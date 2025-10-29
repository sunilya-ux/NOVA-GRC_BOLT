import { supabase } from '@/lib/supabase'
import { openaiService } from './openai.service'
import { pineconeService } from './pinecone.service'
import { auditLogger } from './audit.service'
import type { User } from './auth.service'

export interface DocumentProcessingResult {
  success: boolean
  documentId: string
  classification?: any
  similarDocuments?: any[]
  error?: string
}

class DocumentService {
  async processDocument(
    documentId: string,
    user: User
  ): Promise<DocumentProcessingResult> {
    try {
      const { data: document, error: fetchError } = await supabase
        .from('documents')
        .select('*')
        .eq('document_id', documentId)
        .maybeSingle()

      if (fetchError || !document) {
        throw new Error('Document not found')
      }

      await auditLogger.log(
        user,
        'document_processing',
        'document',
        documentId,
        { action: 'start_processing', document_type: document.document_type }
      )

      const ocrText = document.ocr_text || await openaiService.generateOCRText(document.document_type)

      const classification = await openaiService.classifyDocument(
        ocrText,
        document.document_type
      )

      const embedding = await openaiService.generateEmbedding(ocrText)

      const similarDocs = await pineconeService.findSimilarByDocumentType(
        embedding,
        document.document_type,
        5
      )

      const duplicates = await pineconeService.findDuplicateDocuments(
        embedding,
        document.uploaded_by,
        0.95
      )

      await pineconeService.upsertDocument(documentId, embedding, {
        document_id: documentId,
        document_type: document.document_type,
        user_id: document.uploaded_by,
        role_name: user.role_name,
        status: 'classified',
        created_at: document.created_at
      })

      await supabase
        .from('documents')
        .update({
          status: 'classified',
          ocr_text: ocrText,
          ocr_confidence: classification.confidence,
          extracted_entities: classification.extracted_entities,
          updated_at: new Date().toISOString()
        })
        .eq('document_id', documentId)

      const aiVerdict = duplicates.length > 0 ? 'NEEDS_REVIEW' : classification.verdict

      await supabase.from('decisions').insert({
        document_id: documentId,
        ai_verdict: aiVerdict,
        ai_confidence: classification.confidence,
        ai_reasoning: duplicates.length > 0
          ? `Possible duplicate detected. ${classification.reasoning}`
          : classification.reasoning,
        ai_timestamp: new Date().toISOString(),
        status: 'ai_proposed'
      })

      await auditLogger.log(
        user,
        'document_processing',
        'document',
        documentId,
        {
          action: 'processing_complete',
          verdict: aiVerdict,
          confidence: classification.confidence,
          duplicates_found: duplicates.length
        }
      )

      return {
        success: true,
        documentId,
        classification: {
          ...classification,
          duplicates: duplicates.length,
          similar_count: similarDocs.length
        },
        similarDocuments: similarDocs.slice(0, 3)
      }
    } catch (error) {
      await auditLogger.log(
        user,
        'document_processing',
        'document',
        documentId,
        { action: 'processing_failed', error: String(error) },
        false
      )

      return {
        success: false,
        documentId,
        error: String(error)
      }
    }
  }

  async batchProcessDocuments(
    documentIds: string[],
    user: User
  ): Promise<DocumentProcessingResult[]> {
    const results = await Promise.all(
      documentIds.map((id) => this.processDocument(id, user))
    )

    const successCount = results.filter((r) => r.success).length
    await auditLogger.log(
      user,
      'document_processing',
      'batch',
      null,
      {
        action: 'batch_processing',
        total: documentIds.length,
        successful: successCount,
        failed: documentIds.length - successCount
      }
    )

    return results
  }

  async reviewDocumentDecision(
    documentId: string,
    user: User,
    action: 'AGREE' | 'DISAGREE',
    comment: string
  ) {
    try {
      const { data: decision, error } = await supabase
        .from('decisions')
        .select('*')
        .eq('document_id', documentId)
        .eq('status', 'ai_proposed')
        .maybeSingle()

      if (error || !decision) {
        throw new Error('Decision not found')
      }

      await supabase
        .from('decisions')
        .update({
          officer_user_id: user.user_id,
          officer_action: action,
          officer_comment: comment,
          officer_timestamp: new Date().toISOString(),
          status: action === 'AGREE' ? 'final' : 'pending_manager_approval',
          final_verdict: action === 'AGREE' ? decision.ai_verdict : null,
          finalized_at: action === 'AGREE' ? new Date().toISOString() : null
        })
        .eq('decision_id', decision.decision_id)

      await supabase
        .from('documents')
        .update({
          status: action === 'AGREE' ? decision.ai_verdict.toLowerCase() : 'needs_review'
        })
        .eq('document_id', documentId)

      await auditLogger.log(
        user,
        'document_review',
        'decision',
        decision.decision_id,
        {
          action: 'officer_review',
          officer_action: action,
          ai_verdict: decision.ai_verdict
        }
      )

      return { success: true }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  }

  async approveDocumentAsManager(
    documentId: string,
    user: User,
    action: 'APPROVE' | 'REJECT' | 'ESCALATE',
    justification: string
  ) {
    try {
      const { data: decision, error } = await supabase
        .from('decisions')
        .select('*')
        .eq('document_id', documentId)
        .eq('status', 'pending_manager_approval')
        .maybeSingle()

      if (error || !decision) {
        throw new Error('Decision not found or not pending approval')
      }

      const finalVerdict = action === 'APPROVE' ? 'APPROVED' : action === 'REJECT' ? 'REJECTED' : null

      await supabase
        .from('decisions')
        .update({
          manager_user_id: user.user_id,
          manager_action: action,
          manager_justification: justification,
          manager_timestamp: new Date().toISOString(),
          status: action === 'ESCALATE' ? 'cco_escalated' : 'final',
          final_verdict: finalVerdict,
          finalized_at: action !== 'ESCALATE' ? new Date().toISOString() : null
        })
        .eq('decision_id', decision.decision_id)

      if (finalVerdict) {
        await supabase
          .from('documents')
          .update({ status: finalVerdict.toLowerCase() })
          .eq('document_id', documentId)
      }

      await auditLogger.log(
        user,
        'document_approval',
        'decision',
        decision.decision_id,
        {
          action: 'manager_decision',
          manager_action: action,
          final_verdict: finalVerdict
        }
      )

      return { success: true }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  }

  async uploadDocument(params: {
    file_name: string
    file_size: number
    mime_type: string
    base64_content: string
    document_type: string
    priority: string
    user: User
  }) {
    try {
      const { file_name, base64_content, document_type, priority, user } = params

      const { data: document, error } = await supabase
        .from('documents')
        .insert({
          document_type,
          priority,
          status: 'pending',
          uploaded_by: user.user_id,
          file_name,
          file_path: `${user.user_id}/${Date.now()}_${file_name}`,
          ocr_confidence: 0
        })
        .select()
        .single()

      if (error) throw error

      await auditLogger.log(
        user,
        'document_upload',
        'document',
        document.document_id,
        {
          action: 'document_uploaded',
          document_type,
          file_name
        }
      )

      return { success: true, documentId: document.document_id }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  }
}

export const documentService = new DocumentService()
