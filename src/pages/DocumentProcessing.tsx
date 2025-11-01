import { useState, useEffect } from 'react'
import { useAuthStore } from '@/stores/authStore'

import { documentService } from '@/services/document.service'
import { openaiService } from '@/services/openai.service'
import { pineconeService } from '@/services/pinecone.service'
import { supabase } from '@/lib/supabase'

interface Document {
  document_id: string
  document_type: string
  file_name?: string
  file_path: string
  mime_type: string
  status: string
  priority: string
  ocr_confidence: number
  created_at: string
}

export function DocumentProcessing() {
  const { user } = useAuthStore()
  const [documents, setDocuments] = useState<Document[]>([])
  const [processing, setProcessing] = useState<string | null>(null)
  const [processingProgress, setProcessingProgress] = useState(0)
  const [processingStep, setProcessingStep] = useState('')
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [ragQuery, setRagQuery] = useState('')
  const [ragResults, setRagResults] = useState<any>(null)

  useEffect(() => {
    loadDocuments()
  }, [user])

  const loadDocuments = async () => {
    if (!user) return

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('documents')
        .select('document_id, document_type, file_name, file_path, mime_type, status, priority, ocr_confidence, created_at')
        .order('created_at', { ascending: false })
        .limit(10)

      if (!error && data) {
        setDocuments(data)
      }
    } catch (error) {
      console.error('Error loading documents:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleProcessDocument = async (documentId: string) => {
    if (!user) return

    try {
      setProcessing(documentId)
      setProcessingProgress(0)
      setResult(null)

      setProcessingStep('Extracting text with OCR...')
      setProcessingProgress(20)
      await new Promise(resolve => setTimeout(resolve, 500))

      setProcessingStep('Classifying document with AI...')
      setProcessingProgress(40)
      await new Promise(resolve => setTimeout(resolve, 500))

      setProcessingStep('Generating embeddings...')
      setProcessingProgress(60)
      await new Promise(resolve => setTimeout(resolve, 500))

      setProcessingStep('Searching for similar documents...')
      setProcessingProgress(80)

      const processingResult = await documentService.processDocument(documentId, user)

      setProcessingStep('Finalizing...')
      setProcessingProgress(100)
      await new Promise(resolve => setTimeout(resolve, 300))

      setResult(processingResult)
      await loadDocuments()
    } catch (error) {
      console.error('Error processing document:', error)
      setResult({ success: false, error: String(error) })
    } finally {
      setProcessing(null)
      setProcessingProgress(0)
      setProcessingStep('')
    }
  }

  const handleRagQuery = async (query: string) => {
    if (!user) return

    try {
      setProcessingStep('Processing RAG query...')
      setProcessingProgress(30)

      // Use OpenAI service for RAG-enhanced responses
      const ragResponse = await openaiService.classifyDocument(query, 'RAG_QUERY')

      setProcessingStep('Retrieving relevant documents...')
      setProcessingProgress(70)

      // Search Pinecone for relevant documents
      const embedding = await openaiService.generateEmbedding(query)
      const similarDocs = await pineconeService.findSimilarByDocumentType(embedding, 'PAN', 3)

      setProcessingProgress(100)
      setResult({
        success: true,
        ragResponse,
        similarDocuments: similarDocs,
        query
      })
    } catch (error) {
      setResult({ success: false, error: String(error) })
    } finally {
      setProcessing(null)
      setProcessingProgress(0)
      setProcessingStep('')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading documents...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">AI Document Processing</h1>
        </div>

        {/* RAG Query Section */}
        <div className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center space-x-3 mb-4">
            <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center">
              <svg className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-blue-900">RAG Query Interface</h2>
          </div>
          <div className="flex space-x-3">
            <input
              type="text"
              value={ragQuery}
              onChange={(e) => setRagQuery(e.target.value)}
              placeholder="Ask questions about processed documents..."
              className="flex-1 px-4 py-3 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
            />
            <button
              onClick={() => handleRagQuery(ragQuery)}
              disabled={!ragQuery.trim() || processing !== null}
              className={`px-6 py-3 rounded-lg text-white font-medium transition-all duration-200 shadow-lg ${
                !ragQuery.trim() || processing !== null
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 transform hover:scale-105'
              }`}
            >
              {processing ? 'Processing...' : 'Query RAG'}
            </button>
          </div>
        </div>

        {processing && processingProgress > 0 && (
          <div className="mb-6 p-6 bg-white border border-blue-200 rounded-xl shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center">
                  <svg className="h-4 w-4 text-blue-600 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Processing Document...</h3>
              </div>
              <span className="text-lg font-bold text-blue-600">{processingProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4 mb-4 overflow-hidden shadow-inner">
              <div
                className="bg-gradient-to-r from-blue-500 to-blue-600 h-4 rounded-full transition-all duration-500 ease-out shadow-sm"
                style={{ width: `${processingProgress}%` }}
              />
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <span className="font-medium">{processingStep}</span>
            </div>
          </div>
        )}

        {result && (
          <div className={`mb-6 p-6 rounded-xl shadow-lg ${result.success ? 'bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200' : 'bg-gradient-to-r from-red-50 to-pink-50 border border-red-200'}`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${result.success ? 'bg-green-100' : 'bg-red-100'}`}>
                  {result.success ? (
                    <svg className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="h-4 w-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                </div>
                <h3 className={`text-lg font-semibold ${result.success ? 'text-green-800' : 'text-red-800'}`}>
                  {result.success ? (result.ragResponse ? 'RAG Query Complete' : 'Processing Complete') : 'Processing Failed'}
                </h3>
              </div>
            </div>
            {result.success && result.classification && (
              <div className="mt-3 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-700">Document Type:</span>
                  <span className="font-medium">{result.classification.document_type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Confidence:</span>
                  <span className="font-medium">{(result.classification.confidence * 100).toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">AI Verdict:</span>
                  <span className={`font-medium ${
                    result.classification.verdict === 'APPROVED' ? 'text-green-700' :
                    result.classification.verdict === 'REJECTED' ? 'text-red-700' :
                    'text-yellow-700'
                  }`}>
                    {result.classification.verdict}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Similar Docs:</span>
                  <span className="font-medium">{result.classification.similar_count}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Duplicates:</span>
                  <span className="font-medium">{result.classification.duplicates}</span>
                </div>
                <div className="mt-3 pt-3 border-t border-green-200">
                  <p className="text-gray-700 font-medium mb-1">AI Reasoning:</p>
                  <p className="text-gray-600 text-sm">{result.classification.reasoning}</p>
                </div>
                {result.classification.extracted_entities && (
                  <div className="mt-3 pt-3 border-t border-green-200">
                    <p className="text-gray-700 font-medium mb-2">Extracted Entities:</p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {Object.entries(result.classification.extracted_entities)
                        .filter(([_, value]) => value)
                        .map(([key, value]) => (
                          <div key={key} className="bg-white p-2 rounded">
                            <span className="text-gray-500 capitalize">{key.replace('_', ' ')}:</span>
                            <span className="ml-2 font-medium">{String(value)}</span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            {result.success && result.ragResponse && (
              <div className="mt-3 space-y-2 text-sm">
                <div className="bg-purple-50 p-3 rounded">
                  <p className="text-purple-800 font-medium mb-1">RAG Query Response:</p>
                  <p className="text-purple-700">{result.ragResponse.reasoning}</p>
                </div>
                {result.similarDocuments && result.similarDocuments.length > 0 && (
                  <div className="bg-indigo-50 p-3 rounded">
                    <p className="text-indigo-800 font-medium mb-2">Relevant Documents Found:</p>
                    <div className="space-y-1">
                      {result.similarDocuments.map((doc: any, index: number) => (
                        <div key={index} className="text-xs text-indigo-700">
                          • Document {doc.metadata.document_id} (Score: {(doc.score * 100).toFixed(1)}%)
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            {!result.success && (
              <p className="mt-2 text-red-700 text-sm">{result.error}</p>
            )}
          </div>
        )}

        <div className="bg-white shadow-xl rounded-xl overflow-hidden border border-gray-100">
           <div className="overflow-x-auto">
             <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Preview
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Document Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Confidence
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {documents.map((doc) => (
                  <tr key={doc.document_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      {doc.file_path && doc.mime_type?.startsWith('image/') ? (
                        <img
                          src={doc.file_path}
                          alt={doc.file_name || 'Document'}
                          className="h-16 w-16 object-cover rounded border border-gray-300"
                        />
                      ) : (
                        <div className="h-16 w-16 bg-gray-100 rounded border border-gray-300 flex items-center justify-center">
                          <svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{doc.document_type}</div>
                      <div className="text-xs text-gray-500">{doc.file_name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        doc.status === 'approved' ? 'bg-green-100 text-green-800' :
                        doc.status === 'rejected' ? 'bg-red-100 text-red-800' :
                        doc.status === 'classified' ? 'bg-blue-100 text-blue-800' :
                        doc.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {doc.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        doc.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                        doc.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                        doc.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {doc.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {doc.ocr_confidence ? `${(doc.ocr_confidence * 100).toFixed(1)}%` : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(doc.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleProcessDocument(doc.document_id)}
                        disabled={processing === doc.document_id || doc.status === 'classified'}
                        className={`inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md ${
                          processing === doc.document_id
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : doc.status === 'classified'
                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                      >
                        {processing === doc.document_id ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Processing...
                          </>
                        ) : doc.status === 'classified' ? (
                          'Processed'
                        ) : (
                          'Process with AI'
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {documents.length === 0 && (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No documents</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by uploading documents</p>
          </div>
        )}
      </div>
    </div>
  )
}
