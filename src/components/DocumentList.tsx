interface Document {
  document_id: string
  file_name: string
  document_type: string
  status: string
  uploaded_at: string
  ocr_confidence?: number
}

interface DocumentListProps {
  documents: Document[]
  onDocumentClick?: (document: Document) => void
}

export function DocumentList({ documents, onDocumentClick }: DocumentListProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800'
      case 'rejected':
        return 'bg-red-100 text-red-800'
      case 'processing':
        return 'bg-yellow-100 text-yellow-800'
      case 'needs_review':
        return 'bg-orange-100 text-orange-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-3">
      {documents.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No documents found
        </div>
      ) : (
        documents.map((doc) => (
          <div
            key={doc.document_id}
            onClick={() => onDocumentClick?.(doc)}
            className="p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer bg-white"
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">{doc.file_name}</h3>
                <p className="text-sm text-gray-600">{doc.document_type}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Uploaded: {new Date(doc.uploaded_at).toLocaleDateString()}
                </p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(doc.status)}`}>
                  {doc.status}
                </span>
                {doc.ocr_confidence && (
                  <span className="text-xs text-gray-600">
                    Confidence: {(doc.ocr_confidence * 100).toFixed(1)}%
                  </span>
                )}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  )
}
