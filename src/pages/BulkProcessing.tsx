import { useState, useEffect } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { Navigation } from '@/components/Navigation'
import { documentService } from '@/services/document.service'
import { supabase } from '@/lib/supabase'

interface BulkDocument {
  document_id: string
  document_type: string
  status: string
  priority: string
  created_at: string
  selected: boolean
}

interface ProcessingResult {
  document_id: string
  success: boolean
  error?: string
}

export function BulkProcessing() {
  const { user } = useAuthStore()
  const [documents, setDocuments] = useState<BulkDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [results, setResults] = useState<ProcessingResult[]>([])
  const [filterType, setFilterType] = useState('All')
  const [filterStatus, setFilterStatus] = useState('pending')

  useEffect(() => {
    loadDocuments()
  }, [user, filterType, filterStatus])

  const loadDocuments = async () => {
    if (!user) return

    try {
      setLoading(true)
      let query = supabase
        .from('documents')
        .select('document_id, document_type, status, priority, created_at')
        .order('created_at', { ascending: false })
        .limit(50)

      if (filterType !== 'All') {
        query = query.eq('document_type', filterType)
      }

      if (filterStatus !== 'All') {
        query = query.eq('status', filterStatus)
      }

      const { data, error } = await query

      if (!error && data) {
        setDocuments(data.map(doc => ({ ...doc, selected: false })))
      }
    } catch (error) {
      console.error('Error loading documents:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleSelection = (documentId: string) => {
    setDocuments(docs =>
      docs.map(doc =>
        doc.document_id === documentId
          ? { ...doc, selected: !doc.selected }
          : doc
      )
    )
  }

  const toggleSelectAll = () => {
    const allSelected = documents.every(doc => doc.selected)
    setDocuments(docs => docs.map(doc => ({ ...doc, selected: !allSelected })))
  }

  const handleBulkProcess = async () => {
    if (!user) return

    const selectedDocs = documents.filter(doc => doc.selected)
    if (selectedDocs.length === 0) return

    try {
      setProcessing(true)
      setResults([])

      const documentIds = selectedDocs.map(doc => doc.document_id)
      const processingResults = await documentService.batchProcessDocuments(documentIds, user)

      setResults(processingResults.map(r => ({
        document_id: r.documentId,
        success: r.success,
        error: r.error
      })))

      await loadDocuments()
    } catch (error) {
      console.error('Error processing documents:', error)
    } finally {
      setProcessing(false)
    }
  }

  const selectedCount = documents.filter(doc => doc.selected).length

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
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Bulk Document Processing</h1>
          <p className="mt-2 text-gray-600">
            Process multiple documents at once with AI-powered classification
          </p>
        </div>

        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Document Type
              </label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="All">All Types</option>
                <option value="PAN">PAN</option>
                <option value="Aadhaar">Aadhaar</option>
                <option value="Passport">Passport</option>
                <option value="Driving License">Driving License</option>
                <option value="Voter ID">Voter ID</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="All">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="classified">Classified</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={loadDocuments}
                className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Refresh
              </button>
            </div>
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-gray-200">
            <div className="text-sm text-gray-600">
              {selectedCount} of {documents.length} documents selected
            </div>
            <button
              onClick={handleBulkProcess}
              disabled={selectedCount === 0 || processing}
              className={`px-6 py-2 rounded-md text-sm font-medium text-white ${
                selectedCount === 0 || processing
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {processing ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing {selectedCount} documents...
                </span>
              ) : (
                `Process ${selectedCount} document${selectedCount !== 1 ? 's' : ''}`
              )}
            </button>
          </div>
        </div>

        {results.length > 0 && (
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Processing Results</h3>
            <div className="space-y-2">
              {results.map((result) => (
                <div
                  key={result.document_id}
                  className={`p-3 rounded-lg ${
                    result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      Document ID: {result.document_id.substring(0, 8)}...
                    </span>
                    {result.success ? (
                      <span className="text-green-700 text-sm">✓ Success</span>
                    ) : (
                      <span className="text-red-700 text-sm">✗ Failed</span>
                    )}
                  </div>
                  {result.error && (
                    <p className="text-sm text-red-600 mt-1">{result.error}</p>
                  )}
                </div>
              ))}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600">
                  Processed: {results.filter(r => r.success).length} successful, {results.filter(r => !r.success).length} failed
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={documents.length > 0 && documents.every(doc => doc.selected)}
                      onChange={toggleSelectAll}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
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
                    Created
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {documents.map((doc) => (
                  <tr
                    key={doc.document_id}
                    className={`hover:bg-gray-50 ${doc.selected ? 'bg-blue-50' : ''}`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={doc.selected}
                        onChange={() => toggleSelection(doc.document_id)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {doc.document_type}
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
                      {new Date(doc.created_at).toLocaleString()}
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
            <h3 className="mt-2 text-sm font-medium text-gray-900">No documents found</h3>
            <p className="mt-1 text-sm text-gray-500">Try adjusting your filters</p>
          </div>
        )}
      </div>
    </div>
  )
}
