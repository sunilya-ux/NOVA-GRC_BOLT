import { useState } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { Navigation } from '@/components/Navigation'
import { pineconeService } from '@/services/pinecone.service'
import { openaiService } from '@/services/openai.service'
import { supabase } from '@/lib/supabase'

interface SearchResult {
  document_id: string
  document_type: string
  status: string
  priority: string
  created_at: string
  score: number
  ocr_text?: string
  extracted_entities?: any
}

const DOCUMENT_TYPES = ['All', 'PAN', 'Aadhaar', 'Passport', 'Driving License', 'Voter ID']
const STATUSES = ['All', 'pending', 'processing', 'classified', 'approved', 'rejected', 'needs_review']

export function DocumentSearch() {
  const { user } = useAuthStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [searchType, setSearchType] = useState<'semantic' | 'keyword'>('semantic')
  const [documentType, setDocumentType] = useState('All')
  const [status, setStatus] = useState('All')
  const [searching, setSearching] = useState(false)
  const [results, setResults] = useState<SearchResult[]>([])
  const [selectedDoc, setSelectedDoc] = useState<SearchResult | null>(null)

  const handleSemanticSearch = async () => {
    if (!searchQuery.trim() || !user) return

    try {
      setSearching(true)
      setResults([])

      const embedding = await openaiService.generateEmbedding(searchQuery)

      const vectorResults = documentType !== 'All'
        ? await pineconeService.findSimilarByDocumentType(embedding, documentType, 50)
        : await pineconeService.searchSimilarDocuments(embedding, 50)

      const documentIds = vectorResults.map((r: any) => r.id)

      if (documentIds.length === 0) {
        setResults([])
        return
      }

      let query = supabase
        .from('documents')
        .select('*')
        .in('document_id', documentIds)
        .order('created_at', { ascending: false })

      if (status !== 'All') {
        query = query.eq('status', status)
      }

      const { data, error } = await query

      if (!error && data) {
        const resultsWithScores = data.map((doc) => {
          const vectorResult = vectorResults.find((r: any) => r.id === doc.document_id)
          return {
            ...doc,
            score: vectorResult?.score || 0
          }
        })

        resultsWithScores.sort((a, b) => b.score - a.score)
        setResults(resultsWithScores)
      } else {
        console.error('Semantic search error:', error)
        setResults([])
      }
    } catch (error) {
      console.error('Error searching:', error)
    } finally {
      setSearching(false)
    }
  }

  const handleKeywordSearch = async () => {
    if (!searchQuery.trim() || !user) return

    try {
      setSearching(true)
      setResults([])

      let query = supabase
        .from('documents')
        .select('*')
        .or(`ocr_text.ilike.%${searchQuery}%,extracted_entities->>name.ilike.%${searchQuery}%,extracted_entities->>document_number.ilike.%${searchQuery}%`)
        .order('created_at', { ascending: false })
        .limit(50)

      if (documentType !== 'All') {
        query = query.eq('document_type', documentType)
      }

      if (status !== 'All') {
        query = query.eq('status', status)
      }

      const { data, error } = await query

      if (!error && data) {
        setResults(data.map(doc => ({ ...doc, score: 1 })))
      } else {
        console.error('Search error:', error)
        setResults([])
      }
    } catch (error) {
      console.error('Error searching:', error)
      setResults([])
    } finally {
      setSearching(false)
    }
  }

  const handleSearch = () => {
    if (searchType === 'semantic') {
      handleSemanticSearch()
    } else {
      handleKeywordSearch()
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Document Search</h1>
        </div>

        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="space-y-4">
            <div className="flex space-x-4">
              <div className="flex-1">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="Search for documents..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                onClick={handleSearch}
                disabled={searching || !searchQuery.trim()}
                className={`px-6 py-3 rounded-md text-sm font-medium text-white ${
                  searching || !searchQuery.trim()
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {searching ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Searching...
                  </span>
                ) : (
                  'Search'
                )}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search Type
                </label>
                <select
                  value={searchType}
                  onChange={(e) => setSearchType(e.target.value as 'semantic' | 'keyword')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="semantic">Semantic (AI-powered)</option>
                  <option value="keyword">Keyword</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Document Type
                </label>
                <select
                  value={documentType}
                  onChange={(e) => setDocumentType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {DOCUMENT_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s === 'All' ? 'All Statuses' : s.charAt(0).toUpperCase() + s.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {searchType === 'semantic' && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  <span className="font-medium">Semantic Search:</span> Uses AI to understand the meaning of your query and find relevant documents, even if they don't contain exact keywords.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white shadow rounded-lg overflow-hidden">
              {results.length === 0 && !searching && (
                <div className="text-center py-12">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No search results</h3>
                  <p className="mt-1 text-sm text-gray-500">Try adjusting your search query or filters</p>
                </div>
              )}

              {results.length > 0 && (
                <div className="divide-y divide-gray-200">
                  {results.map((doc) => (
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
                              doc.status === 'approved' ? 'bg-green-100 text-green-800' :
                              doc.status === 'rejected' ? 'bg-red-100 text-red-800' :
                              doc.status === 'classified' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {doc.status}
                            </span>
                            {searchType === 'semantic' && (
                              <span className="text-xs text-gray-500">
                                Relevance: {(doc.score * 100).toFixed(0)}%
                              </span>
                            )}
                          </div>
                          <p className="mt-1 text-sm text-gray-600">
                            {new Date(doc.created_at).toLocaleString()}
                          </p>
                          {doc.extracted_entities?.name && (
                            <p className="mt-1 text-sm text-gray-700">
                              <span className="font-medium">Name:</span> {doc.extracted_entities.name}
                            </p>
                          )}
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

            {results.length > 0 && (
              <div className="mt-4 text-sm text-gray-600 text-center">
                Found {results.length} document{results.length !== 1 ? 's' : ''}
              </div>
            )}
          </div>

          <div className="lg:col-span-1">
            {selectedDoc ? (
              <div className="bg-white shadow rounded-lg p-6 sticky top-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Document Details</h3>

                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Document Type</p>
                    <p className="text-sm text-gray-900">{selectedDoc.document_type}</p>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-700">Status</p>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      selectedDoc.status === 'approved' ? 'bg-green-100 text-green-800' :
                      selectedDoc.status === 'rejected' ? 'bg-red-100 text-red-800' :
                      selectedDoc.status === 'classified' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {selectedDoc.status}
                    </span>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-700">Priority</p>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      selectedDoc.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                      selectedDoc.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                      selectedDoc.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {selectedDoc.priority}
                    </span>
                  </div>

                  {searchType === 'semantic' && (
                    <div>
                      <p className="text-sm font-medium text-gray-700">Relevance Score</p>
                      <div className="mt-1">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${selectedDoc.score * 100}%` }}
                          />
                        </div>
                        <p className="text-xs text-gray-600 mt-1">
                          {(selectedDoc.score * 100).toFixed(1)}% match
                        </p>
                      </div>
                    </div>
                  )}

                  <div>
                    <p className="text-sm font-medium text-gray-700">Created</p>
                    <p className="text-sm text-gray-900">
                      {new Date(selectedDoc.created_at).toLocaleString()}
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

                  {selectedDoc.ocr_text && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">OCR Text</p>
                      <div className="text-xs text-gray-600 bg-gray-50 p-3 rounded max-h-48 overflow-y-auto">
                        {selectedDoc.ocr_text}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white shadow rounded-lg p-6 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="mt-4 text-sm text-gray-500">
                  Select a document to view details
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
