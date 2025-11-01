import { useState, useEffect } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { Navigation } from '@/components/Navigation'
import { documentService } from '@/services/document.service'
import { supabase } from '@/lib/supabase'

interface ApprovalDocument {
  document_id: string
  document_type: string
  status: string
  priority: string
  created_at: string
  file_name: string
  decision: {
    decision_id: string
    ai_verdict: string
    ai_confidence: number
    ai_reasoning: string
    officer_action: string
    officer_comment: string
    officer_timestamp: string
    status: string
  }
  extracted_entities: any
}

export function ManagerApproval() {
  const { user } = useAuthStore()
  const [documents, setDocuments] = useState<ApprovalDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDoc, setSelectedDoc] = useState<ApprovalDocument | null>(null)
  const [managerAction, setManagerAction] = useState<'APPROVE' | 'REJECT' | 'ESCALATE'>('APPROVE')
  const [justification, setJustification] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    loadDocuments()
  }, [user])

  const loadDocuments = async () => {
    if (!user) return

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('documents')
        .select(`
          document_id,
          document_type,
          status,
          priority,
          created_at,
          file_name,
          extracted_entities,
          decisions!inner(
            decision_id,
            ai_verdict,
            ai_confidence,
            ai_reasoning,
            officer_action,
            officer_comment,
            officer_timestamp,
            status
          )
        `)
        .eq('decisions.status', 'pending_manager_approval')
        .order('created_at', { ascending: false })

      if (!error && data) {
        const formatted = data.map((doc: any) => ({
          ...doc,
          decision: Array.isArray(doc.decisions) ? doc.decisions[0] : doc.decisions
        }))
        setDocuments(formatted)
      }
    } catch (error) {
      console.error('Error loading documents:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApproval = async () => {
    if (!selectedDoc || !user) return

    try {
      setSubmitting(true)
      const result = await documentService.approveDocumentAsManager(
        selectedDoc.document_id,
        user,
        managerAction,
        justification
      )

      if (result.success) {
        setSelectedDoc(null)
        setJustification('')
        await loadDocuments()
      }
    } catch (error) {
      console.error('Error approving document:', error)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading approval queue...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Manager Approval Queue</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white shadow rounded-lg overflow-hidden">
              {documents.length === 0 ? (
                <div className="text-center py-12">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No documents pending approval</h3>
                  <p className="mt-1 text-sm text-gray-500">All officer reviews have been processed</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {documents.map((doc) => (
                    <div
                      key={doc.document_id}
                      onClick={() => setSelectedDoc(doc)}
                      className={`p-6 cursor-pointer transition-colors ${
                        selectedDoc?.document_id === doc.document_id
                          ? 'bg-blue-50 border-l-4 border-blue-600'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {doc.document_type} - {doc.file_name}
                            </h3>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              doc.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                              doc.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                              doc.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {doc.priority}
                            </span>
                          </div>
                          <div className="mt-3 space-y-2">
                            <div className="bg-gray-50 p-3 rounded">
                              <div className="flex items-center justify-between text-sm mb-2">
                                <span className="font-medium text-gray-700">AI Decision:</span>
                                <span className={`font-semibold ${
                                  doc.decision.ai_verdict === 'APPROVED' ? 'text-green-700' :
                                  doc.decision.ai_verdict === 'REJECTED' ? 'text-red-700' :
                                  'text-yellow-700'
                                }`}>
                                  {doc.decision.ai_verdict} ({(doc.decision.ai_confidence * 100).toFixed(1)}%)
                                </span>
                              </div>
                              <div className="flex items-center justify-between text-sm">
                                <span className="font-medium text-gray-700">Officer Action:</span>
                                <span className="font-semibold text-red-700">
                                  {doc.decision.officer_action}
                                </span>
                              </div>
                            </div>
                            <p className="text-xs text-gray-500">
                              Reviewed: {new Date(doc.decision.officer_timestamp).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-1">
            {selectedDoc ? (
              <div className="bg-white shadow rounded-lg p-6 sticky top-8">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Manager Decision</h2>

                <div className="space-y-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-blue-900 mb-2">AI Reasoning</h3>
                    <p className="text-sm text-blue-800">{selectedDoc.decision.ai_reasoning}</p>
                  </div>

                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-yellow-900 mb-2">Officer Comment</h3>
                    <p className="text-sm text-yellow-800">{selectedDoc.decision.officer_comment}</p>
                  </div>

                  {selectedDoc.extracted_entities && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-sm font-medium text-gray-900 mb-2">Extracted Information</h3>
                      <div className="text-xs text-gray-700 space-y-1">
                        {Object.entries(selectedDoc.extracted_entities).map(([key, value]) => (
                          <div key={key} className="flex justify-between">
                            <span className="font-medium">{key}:</span>
                            <span>{String(value)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Manager Action
                    </label>
                    <select
                      value={managerAction}
                      onChange={(e) => setManagerAction(e.target.value as any)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="APPROVE">Approve (Override Officer)</option>
                      <option value="REJECT">Reject (Support Officer)</option>
                      <option value="ESCALATE">Escalate to CCO</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Justification *
                    </label>
                    <textarea
                      value={justification}
                      onChange={(e) => setJustification(e.target.value)}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Explain your decision..."
                    />
                  </div>

                  <button
                    onClick={handleApproval}
                    disabled={submitting || !justification.trim()}
                    className={`w-full px-4 py-2 rounded-md text-white font-medium ${
                      submitting || !justification.trim()
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                  >
                    {submitting ? 'Submitting...' : 'Submit Decision'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white shadow rounded-lg p-6">
                <p className="text-sm text-gray-500 text-center">
                  Select a document to review and make a decision
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                <strong>Maker-Checker Workflow:</strong> Officers review AI decisions first. When they disagree, managers provide final approval. This ensures proper segregation of duties and compliance with banking regulations.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
