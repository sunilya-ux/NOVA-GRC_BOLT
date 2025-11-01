import { useState, useEffect } from 'react'
import { useAuthStore } from '@/stores/authStore'

import { aiDecisionEngine } from '@/services/ai-decision-engine.service'
import { supabase } from '@/lib/supabase'
import type { AIDecision } from '@/services/ai-decision-engine.service'

interface ExplainabilityDocument {
  document_id: string
  document_type: string
  status: string
  created_at: string
  ai_decision?: AIDecision
  file_name: string
}

export function AIExplainability() {
  const { user } = useAuthStore()
  const [documents, setDocuments] = useState<ExplainabilityDocument[]>([])
  const [selectedDoc, setSelectedDoc] = useState<ExplainabilityDocument | null>(null)
  const [loading, setLoading] = useState(true)
  const [showBiasAnalysis, setShowBiasAnalysis] = useState(false)
  const [showAuditTrail, setShowAuditTrail] = useState(false)

  useEffect(() => {
    loadDocuments()
  }, [user])

  const loadDocuments = async () => {
    if (!user) return

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('documents')
        .select('document_id, document_type, status, created_at, file_name')
        .eq('status', 'classified')
        .order('created_at', { ascending: false })
        .limit(20)

      if (!error && data) {
        // Load AI decisions for each document with retry logic
        const documentsWithDecisions = await Promise.all(
          data.map(async (doc) => {
            let retries = 3
            while (retries > 0) {
              try {
                const decisions = await aiDecisionEngine.getDecisionHistory(doc.document_id)
                return {
                  ...doc,
                  ai_decision: decisions[0] // Get the latest decision
                }
              } catch (error) {
                retries--
                if (retries === 0) {
                  console.warn(`Failed to load AI decision for document ${doc.document_id}:`, error)
                  return { ...doc, ai_decision: undefined }
                }
                // Wait 500ms before retry
                await new Promise(resolve => setTimeout(resolve, 500))
              }
            }
            return { ...doc, ai_decision: undefined }
          })
        )
        setDocuments(documentsWithDecisions)
      }
    } catch (error) {
      console.error('Error loading documents:', error)
    } finally {
      setLoading(false)
    }
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600'
    if (confidence >= 0.6) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getBiasColor = (biasScore: number) => {
    if (biasScore >= 0.7) return 'text-red-600'
    if (biasScore >= 0.4) return 'text-yellow-600'
    return 'text-green-600'
  }

  const getRiskColor = (risk: string) => {
    switch (risk.toLowerCase()) {
      case 'high': return 'text-red-600 bg-red-50'
      case 'medium': return 'text-yellow-600 bg-yellow-50'
      case 'low': return 'text-green-600 bg-green-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading AI explainability data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">AI Explainability</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">AI-Decided Documents</h2>
                <p className="text-sm text-gray-600">Click any document to view detailed explainability</p>
              </div>
              <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
                {documents.length === 0 ? (
                  <div className="text-center py-12">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No AI-decided documents</h3>
                    <p className="mt-1 text-sm text-gray-500">Documents processed by AI will appear here</p>
                  </div>
                ) : (
                  documents.map((doc) => (
                    <div
                      key={doc.document_id}
                      onClick={() => setSelectedDoc(doc)}
                      className={`p-4 cursor-pointer transition-colors ${
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
                            {doc.ai_decision && (
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                doc.ai_decision.verdict === 'APPROVED' ? 'bg-green-100 text-green-800' :
                                doc.ai_decision.verdict === 'REJECTED' ? 'bg-red-100 text-red-800' :
                                'bg-yellow-100 text-yellow-800'
                              }`}>
                                {doc.ai_decision.verdict}
                              </span>
                            )}
                          </div>
                          <div className="mt-2 space-y-1">
                            {doc.ai_decision && (
                              <div className="flex items-center space-x-4 text-sm">
                                <span className={`font-medium ${getConfidenceColor(doc.ai_decision.confidence)}`}>
                                  Confidence: {(doc.ai_decision.confidence * 100).toFixed(1)}%
                                </span>
                                <span className={`font-medium ${getBiasColor(doc.ai_decision.bias_analysis.bias_score)}`}>
                                  Bias: {(doc.ai_decision.bias_analysis.bias_score * 100).toFixed(1)}%
                                </span>
                                <span className={`px-2 py-1 rounded text-xs font-medium ${getRiskColor(doc.ai_decision.explainability.risk_assessment)}`}>
                                  Risk: {doc.ai_decision.explainability.risk_assessment}
                                </span>
                              </div>
                            )}
                            <p className="text-sm text-gray-600">
                              Processed: {new Date(doc.created_at).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            {selectedDoc && selectedDoc.ai_decision ? (
              <div className="bg-white shadow rounded-lg p-6 sticky top-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">AI Decision Analysis</h3>

                <div className="space-y-6">
                  {/* Decision Overview */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Decision Overview</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Verdict:</span>
                        <span className={`font-medium ${
                          selectedDoc.ai_decision.verdict === 'APPROVED' ? 'text-green-700' :
                          selectedDoc.ai_decision.verdict === 'REJECTED' ? 'text-red-700' :
                          'text-yellow-700'
                        }`}>
                          {selectedDoc.ai_decision.verdict}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Confidence:</span>
                        <span className={`font-medium ${getConfidenceColor(selectedDoc.ai_decision.confidence)}`}>
                          {(selectedDoc.ai_decision.confidence * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Processing Time:</span>
                        <span className="font-medium text-gray-900">
                          {selectedDoc.ai_decision.processing_time}ms
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Model Performance */}
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium text-blue-900">Model Performance</h4>
                      <button
                        onClick={() => setShowBiasAnalysis(!showBiasAnalysis)}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        {showBiasAnalysis ? 'Hide' : 'Show'}
                      </button>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-blue-700">Bias Detection:</span>
                        <span className={`font-medium ${getBiasColor(selectedDoc.ai_decision.bias_analysis.bias_score)}`}>
                          {(selectedDoc.ai_decision.bias_analysis.bias_score * 100).toFixed(1)}%
                        </span>
                      </div>
                      {showBiasAnalysis && (
                        <div className="mt-3 space-y-2">
                          <div>
                            <p className="text-blue-800 font-medium text-xs">Bias Factors:</p>
                            <ul className="text-blue-700 text-xs mt-1 space-y-1">
                              {selectedDoc.ai_decision.bias_analysis.bias_factors.map((factor, index) => (
                                <li key={index} className="flex items-start">
                                  <span className="text-blue-500 mr-1">•</span>
                                  {factor}
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <p className="text-blue-800 font-medium text-xs">Recommendations:</p>
                            <ul className="text-blue-700 text-xs mt-1 space-y-1">
                              {selectedDoc.ai_decision.bias_analysis.recommendations.map((rec, index) => (
                                <li key={index} className="flex items-start">
                                  <span className="text-blue-500 mr-1">•</span>
                                  {rec}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Explainability Report */}
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="text-sm font-medium text-green-900 mb-2">Explainability Report</h4>
                    <div className="space-y-3 text-sm">
                      <div>
                        <p className="text-green-800 font-medium text-xs">Decision Factors:</p>
                        <ul className="text-green-700 text-xs mt-1 space-y-1">
                          {selectedDoc.ai_decision.explainability.decision_factors.map((factor, index) => (
                            <li key={index} className="flex items-start">
                              <span className="text-green-500 mr-1">•</span>
                              {factor}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-green-700">Confidence Range:</span>
                        <span className="font-medium text-green-900">
                          {(selectedDoc.ai_decision.explainability.confidence_intervals.min * 100).toFixed(1)}% - {(selectedDoc.ai_decision.explainability.confidence_intervals.max * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className={`px-2 py-1 rounded text-xs font-medium ${getRiskColor(selectedDoc.ai_decision.explainability.risk_assessment)}`}>
                        Risk Assessment: {selectedDoc.ai_decision.explainability.risk_assessment}
                      </div>
                    </div>
                  </div>

                  {/* Audit Trail */}
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium text-purple-900">Audit Trail</h4>
                      <button
                        onClick={() => setShowAuditTrail(!showAuditTrail)}
                        className="text-purple-600 hover:text-purple-800 text-sm"
                      >
                        {showAuditTrail ? 'Hide' : 'Show'}
                      </button>
                    </div>
                    {showAuditTrail && (
                      <div className="space-y-1">
                        {selectedDoc.ai_decision.explainability.audit_trail.map((entry, index) => (
                          <div key={index} className="text-purple-700 text-xs">
                            {entry}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* AI Reasoning */}
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <h4 className="text-sm font-medium text-yellow-900 mb-2">AI Reasoning</h4>
                    <p className="text-yellow-800 text-sm">
                      {selectedDoc.ai_decision.reasoning}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white shadow rounded-lg p-6 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                <p className="mt-4 text-sm text-gray-500">
                  Select a document to view AI explainability analysis
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 bg-blue-50 border-l-4 border-blue-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-700">
                <strong>AI Explainability:</strong> This dashboard provides complete transparency into AI decision-making,
                including bias detection, confidence intervals, and detailed reasoning. All decisions are auditable
                and include risk assessments to ensure compliance and fairness.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}