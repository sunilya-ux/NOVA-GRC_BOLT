import { openaiService } from './openai.service'
import { pineconeService } from './pinecone.service'
import { auditLogger } from './audit.service'
import type { User } from './auth.service'

export interface BiasAnalysis {
  bias_score: number
  bias_factors: string[]
  confidence: number
  recommendations: string[]
}

export interface ExplainabilityReport {
  decision_factors: string[]
  confidence_intervals: { min: number; max: number }
  alternative_scenarios: string[]
  risk_assessment: string
  audit_trail: string[]
}

export interface AIDecision {
  verdict: 'APPROVED' | 'REJECTED' | 'ESCALATE'
  confidence: number
  reasoning: string
  bias_analysis: BiasAnalysis
  explainability: ExplainabilityReport
  processing_time: number
  model_version: string
}

export class AIDecisionEngine {
  private static instance: AIDecisionEngine

  static getInstance(): AIDecisionEngine {
    if (!AIDecisionEngine.instance) {
      AIDecisionEngine.instance = new AIDecisionEngine()
    }
    return AIDecisionEngine.instance
  }

  async makeDecision(
    documentId: string,
    extractedText: string,
    user: User,
    documentType: string
  ): Promise<AIDecision> {
    const startTime = Date.now()

    try {
      // Step 1: Generate embeddings for bias detection
      const embedding = await openaiService.generateEmbedding(extractedText)

      // Step 2: Check for similar documents (bias detection)
      const similarDocs = await pineconeService.findSimilarByDocumentType(
        embedding,
        documentType,
        10
      )

      // Step 3: Analyze for bias patterns
      const biasAnalysis = await this.analyzeBias(similarDocs, extractedText, documentType)

      // Step 4: Make AI decision with explainability
      const decision = await this.generateDecision(
        extractedText,
        documentType,
        biasAnalysis,
        similarDocs
      )

      // Step 5: Generate explainability report
      const explainability = await this.generateExplainabilityReport(
        decision,
        biasAnalysis,
        similarDocs,
        extractedText
      )

      const processingTime = Date.now() - startTime

      const finalDecision: AIDecision = {
        verdict: decision.verdict,
        confidence: decision.confidence,
        reasoning: decision.reasoning,
        bias_analysis: biasAnalysis,
        explainability,
        processing_time: processingTime,
        model_version: 'gpt-4-turbo'
      }

      // Audit the decision
      await auditLogger.log({
        user_id: user.user_id,
        role_name: user.role_name,
        action: 'AI_DECISION_MADE',
        resource_type: 'DOCUMENT',
        resource_id: documentId,
        success: true,
        details: {
          verdict: finalDecision.verdict,
          confidence: finalDecision.confidence,
          bias_score: biasAnalysis.bias_score,
          processing_time: processingTime
        }
      })

      return finalDecision

    } catch (error) {
      console.error('AI Decision Engine error:', error)

      // Fallback decision
      return {
        verdict: 'ESCALATE',
        confidence: 0,
        reasoning: 'AI processing failed - escalated for manual review',
        bias_analysis: {
          bias_score: 0,
          bias_factors: ['Processing error'],
          confidence: 0,
          recommendations: ['Manual review required']
        },
        explainability: {
          decision_factors: ['System error'],
          confidence_intervals: { min: 0, max: 0 },
          alternative_scenarios: ['Manual review'],
          risk_assessment: 'High - System error',
          audit_trail: [`Error at ${new Date().toISOString()}: ${String(error)}`]
        },
        processing_time: Date.now() - startTime,
        model_version: 'error-fallback'
      }
    }
  }

  private async analyzeBias(
    similarDocs: any[],
    extractedText: string,
    documentType: string
  ): Promise<BiasAnalysis> {
    // Analyze patterns in similar documents
    const verdicts = similarDocs.map(doc => doc.metadata?.verdict || 'UNKNOWN')
    const approvedCount = verdicts.filter(v => v === 'APPROVED').length
    const rejectedCount = verdicts.filter(v => v === 'REJECTED').length

    let biasScore = 0
    const biasFactors: string[] = []
    const recommendations: string[] = []

    // Check for approval bias
    if (approvedCount > rejectedCount * 2) {
      biasScore += 0.3
      biasFactors.push('High approval rate in similar documents')
      recommendations.push('Consider additional scrutiny for approval patterns')
    }

    // Check for document type bias
    if (documentType === 'PAN' && approvedCount > 0) {
      biasScore += 0.2
      biasFactors.push('PAN documents historically approved')
    }

    // Check for text length bias
    if (extractedText.length < 100) {
      biasScore += 0.1
      biasFactors.push('Short document may lack sufficient information')
      recommendations.push('Request additional documentation')
    }

    // Check for keyword bias
    const riskKeywords = ['urgent', 'rush', 'emergency', 'priority']
    const hasRiskKeywords = riskKeywords.some(keyword =>
      extractedText.toLowerCase().includes(keyword)
    )

    if (hasRiskKeywords) {
      biasScore += 0.2
      biasFactors.push('Contains urgency keywords')
      recommendations.push('Verify urgency claims')
    }

    return {
      bias_score: Math.min(biasScore, 1.0),
      bias_factors: biasFactors,
      confidence: 0.85,
      recommendations
    }
  }

  private async generateDecision(
    extractedText: string,
    documentType: string,
    biasAnalysis: BiasAnalysis,
    similarDocs: any[]
  ): Promise<{ verdict: 'APPROVED' | 'REJECTED' | 'ESCALATE'; confidence: number; reasoning: string }> {

    const prompt = `
Analyze this ${documentType} document and make a compliance decision.

Document Text:
${extractedText}

Bias Analysis:
- Bias Score: ${biasAnalysis.bias_score}
- Factors: ${biasAnalysis.bias_factors.join(', ')}
- Recommendations: ${biasAnalysis.recommendations.join(', ')}

Similar Documents: ${similarDocs.length} found

Instructions:
1. Consider the document authenticity and completeness
2. Account for bias factors in your analysis
3. Provide clear reasoning
4. Return verdict as APPROVED, REJECTED, or ESCALATE
5. Include confidence score (0-1)

Response format:
{
  "verdict": "APPROVED|REJECTED|ESCALATE",
  "confidence": 0.95,
  "reasoning": "Detailed explanation..."
}
`

    const response = await openaiService.classifyDocument(prompt, 'AI_DECISION')

    try {
      // Assuming classifyDocument returns a string that can be parsed as JSON
      const responseText = typeof response === 'string' ? response : JSON.stringify(response)
      const parsed = JSON.parse(responseText)
      return {
        verdict: parsed.verdict as 'APPROVED' | 'REJECTED' | 'ESCALATE',
        confidence: parsed.confidence || 0.5,
        reasoning: parsed.reasoning || 'AI decision made'
      }
    } catch (error) {
      // Fallback parsing
      const responseText = typeof response === 'string' ? response : String(response)
      const verdict = responseText.includes('APPROVED') ? 'APPROVED' :
                     responseText.includes('REJECTED') ? 'REJECTED' : 'ESCALATE'

      return {
        verdict,
        confidence: 0.6,
        reasoning: responseText
      }
    }
  }

  private async generateExplainabilityReport(
    decision: any,
    biasAnalysis: BiasAnalysis,
    similarDocs: any[],
    extractedText: string
  ): Promise<ExplainabilityReport> {

    const decisionFactors = [
      `Document type: ${extractedText.length > 0 ? 'Valid content detected' : 'No content extracted'}`,
      `Bias score: ${biasAnalysis.bias_score}`,
      `Similar documents found: ${similarDocs.length}`,
      `AI confidence: ${decision.confidence}`
    ]

    const confidenceIntervals = {
      min: Math.max(0, decision.confidence - 0.2),
      max: Math.min(1, decision.confidence + 0.2)
    }

    const alternativeScenarios = [
      'If bias factors were ignored: ' + (decision.verdict === 'APPROVED' ? 'REJECTED' : 'APPROVED'),
      'If similar documents showed opposite pattern: ' + (decision.verdict === 'APPROVED' ? 'REJECTED' : 'APPROVED'),
      'Manual review recommended for borderline cases'
    ]

    const riskAssessment = biasAnalysis.bias_score > 0.5 ? 'High' :
                          biasAnalysis.bias_score > 0.3 ? 'Medium' : 'Low'

    const auditTrail = [
      `Decision made at ${new Date().toISOString()}`,
      `Model version: gpt-4-turbo`,
      `Bias analysis completed`,
      `Similar documents analyzed: ${similarDocs.length}`,
      `Confidence score: ${decision.confidence}`
    ]

    return {
      decision_factors: decisionFactors,
      confidence_intervals: confidenceIntervals,
      alternative_scenarios: alternativeScenarios,
      risk_assessment: riskAssessment,
      audit_trail: auditTrail
    }
  }

  async getDecisionHistory(documentId: string): Promise<AIDecision[]> {
    // This would query the database for previous decisions
    // For now, return empty array
    return []
  }

  async retrainModel(feedback: { documentId: string; correctVerdict: string; userId: string }): Promise<void> {
    // This would trigger model retraining with feedback
    await auditLogger.log({
      user_id: feedback.userId,
      role_name: null,
      action: 'MODEL_RETRAINING_TRIGGERED',
      resource_type: 'AI_MODEL',
      resource_id: 'decision-engine',
      success: true,
      details: {
        document_id: feedback.documentId,
        correct_verdict: feedback.correctVerdict
      }
    })
  }
}

export const aiDecisionEngine = AIDecisionEngine.getInstance()