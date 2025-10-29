import { useState, useEffect } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { documentService } from '@/services/document.service'
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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">AI Document Processing</h1>
          <p className="mt-2 text-gray-600">
            Process KYC documents with OpenAI + Pinecone vector search
          </p>
        </div>

        {processing && processingProgress > 0 && (
          <div className="mb-6 p-6 bg-white border border-blue-200 rounded-lg shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-900">Processing Document...</h3>
              <span className="text-sm font-medium text-blue-600">{processingProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 mb-3 overflow-hidden">
              <div
                className="bg-blue-600 h-3 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${processingProgress}%` }}
              />
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <svg className="animate-spin h-4 w-4 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {processingStep}
            </div>
          </div>
        )}

        {result && (
          <div className={`mb-6 p-4 rounded-lg ${result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            <h3 className={`font-semibold ${result.success ? 'text-green-800' : 'text-red-800'}`}>
              {result.success ? 'Processing Complete' : 'Processing Failed'}
            </h3>
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
            {!result.success && (
              <p className="mt-2 text-red-700 text-sm">{result.error}</p>
            )}
          </div>
        )}

        <div className="bg-white shadow rounded-lg overflow-hidden">
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
