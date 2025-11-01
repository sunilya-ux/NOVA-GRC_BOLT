import { useState, useEffect } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { Navigation } from '@/components/Navigation'
import { getUserPermissions } from '@/lib/permissions'
import { documentService } from '@/services/document.service'
import { supabase } from '@/lib/supabase'

interface ReviewDocument {
  document_id: string
  document_type: string
  status: string
  priority: string
  created_at: string
  decision: {
    decision_id: string
    ai_verdict: string
    ai_confidence: number
    ai_reasoning: string
    officer_action: string | null
    status: string
  }
  extracted_entities: any
}

export function DocumentReview() {
  const { user } = useAuthStore()
  const [documents, setDocuments] = useState<ReviewDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDoc, setSelectedDoc] = useState<ReviewDocument | null>(null)
  const [reviewAction, setReviewAction] = useState<'AGREE' | 'DISAGREE'>('AGREE')
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const permissions = user ? getUserPermissions(user.role_name) : null

  useEffect(() => {
    loadDocuments()
  }, [user])

  const loadDocuments = async () => {
    if (!user) return

    try {
      setLoading(true)
      let query = supabase
        .from('documents')
        .select(`
          document_id,
          document_type,
          status,
          priority,
          created_at,
          extracted_entities,
          file_name,
          assigned_to,
          decisions!inner(
            decision_id,
            ai_verdict,
            ai_confidence,
            ai_reasoning,
            officer_action,
            status
          )
        `)
        .eq('decisions.status', 'ai_proposed')

      if (user.role_name === 'compliance_officer') {
        query = query.eq('assigned_to', user.user_id)
      }

      const { data, error } = await query.order('created_at', { ascending: false })

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

  const handleReview = async () => {
    if (!selectedDoc || !user) return

    try {
      setSubmitting(true)
      const result = await documentService.reviewDocumentDecision(
        selectedDoc.document_id,
        user,
        reviewAction,
        comment
      )

      if (result.success) {
        setSelectedDoc(null)
        setComment('')
        await loadDocuments()
      }
    } catch (error) {
      console.error('Error reviewing document:', error)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading review queue...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Document Approvals</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white shadow rounded-lg overflow-hidden">
              {documents.length === 0 ? (
                <div className="text-center py-12">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No documents pending review</h3>
                  <p className="mt-1 text-sm text-gray-500">All documents have been reviewed</p>
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
                              {doc.document_type}
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
                          <div className="mt-2 space-y-1">
                            <div className="flex items-center space-x-2 text-sm">
                              <span className="text-gray-600">AI Verdict:</span>
                              <span className={`font-medium ${
                                doc.decision.ai_verdict === 'APPROVED' ? 'text-green-700' :
                                doc.decision.ai_verdict === 'REJECTED' ? 'text-red-700' :
                                'text-yellow-700'
                              }`}>
                                {doc.decision.ai_verdict}
                              </span>
                              <span className="text-gray-500">
                                ({(doc.decision.ai_confidence * 100).toFixed(1)}% confidence)
                              </span>
                            </div>
                            <p className="text-sm text-gray-600">
                              {new Date(doc.created_at).toLocaleString()}
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
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Review Details</h3>

                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Maker-Checker Workflow:</strong> As a Compliance Officer (Maker), you can agree or disagree with AI decisions.
                    If you disagree, this will escalate to a Manager (Checker) for final approval.
                  </p>
                </div>

                <div className="space-y-4 mb-6">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Document Type</p>
                    <p className="text-sm text-gray-900">{selectedDoc.document_type}</p>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-700">AI Verdict</p>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      selectedDoc.decision.ai_verdict === 'APPROVED' ? 'bg-green-100 text-green-800' :
                      selectedDoc.decision.ai_verdict === 'REJECTED' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {selectedDoc.decision.ai_verdict}
                    </span>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-700">AI Confidence</p>
                    <p className="text-sm text-gray-900">
                      {(selectedDoc.decision.ai_confidence * 100).toFixed(1)}%
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-1">AI Reasoning</p>
                    <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                      {selectedDoc.decision.ai_reasoning}
                    </p>
                  </div>

                  {selectedDoc.extracted_entities && Object.keys(selectedDoc.extracted_entities).length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">Extracted Entities</p>
                      <div className="space-y-2">
                        {Object.entries(selectedDoc.extracted_entities)
                          .filter(([_, value]) => value)
                          .map(([key, value]) => (
                            <div key={key} className="text-sm bg-gray-50 p-2 rounded">
                              <span className="text-gray-600 capitalize">{key.replace('_', ' ')}:</span>
                              <span className="ml-2 font-medium text-gray-900">{String(value)}</span>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>

                {permissions?.canProvideReviewFeedback ? (
                  <div className="border-t border-gray-200 pt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Your Decision
                    </label>
                    <div className="space-y-3 mb-4">
                      <div className="text-sm font-medium text-gray-700 mb-2">Your Decision:</div>
                      <label className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                        <input
                          type="radio"
                          checked={reviewAction === 'AGREE'}
                          onChange={() => setReviewAction('AGREE')}
                          className="mr-3"
                        />
                        <div>
                          <span className="text-sm font-medium text-gray-900">Agree with AI</span>
                          <p className="text-xs text-gray-600">Finalize the decision - document approved/rejected</p>
                        </div>
                      </label>
                      <label className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                        <input
                          type="radio"
                          checked={reviewAction === 'DISAGREE'}
                          onChange={() => setReviewAction('DISAGREE')}
                          className="mr-3"
                        />
                        <div>
                          <span className="text-sm font-medium text-gray-900">Disagree with AI</span>
                          <p className="text-xs text-gray-600">Escalate to Manager for final approval</p>
                        </div>
                      </label>
                    </div>

                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Comment
                    </label>
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Add your review comments..."
                    />

                    <button
                      onClick={handleReview}
                      disabled={submitting || !comment.trim()}
                      className={`w-full mt-4 px-4 py-2 rounded-md text-sm font-medium text-white ${
                        submitting || !comment.trim()
                          ? 'bg-gray-400 cursor-not-allowed'
                          : 'bg-blue-600 hover:bg-blue-700'
                      }`}
                    >
                      {submitting ? 'Submitting...' : 'Submit Review'}
                    </button>
                  </div>
                ) : (
                  <div className="border-t border-gray-200 pt-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-sm text-blue-800">
                        <strong>View-only access:</strong> Your role allows you to view document reviews but not provide feedback.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white shadow rounded-lg p-6 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="mt-4 text-sm text-gray-500">
                  Select a document to review
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
