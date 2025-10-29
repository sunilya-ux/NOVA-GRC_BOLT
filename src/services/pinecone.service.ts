interface DocumentMetadata {
  document_id: string
  document_type: string
  user_id: string
  role_name: string
  status: string
  created_at: string
}

interface SearchResult {
  id: string
  score: number
  metadata: DocumentMetadata
}

class PineconeService {
  private apiKey: string
  private indexUrl: string

  constructor() {
    this.apiKey = import.meta.env.VITE_PINECONE_API_KEY
    this.indexUrl = import.meta.env.VITE_PINECONE_INDEX_URL
  }

  async upsertDocument(
    documentId: string,
    embedding: number[],
    metadata: DocumentMetadata
  ): Promise<void> {
    try {
      const response = await fetch(`${this.indexUrl}/vectors/upsert`, {
        method: 'POST',
        headers: {
          'Api-Key': this.apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          vectors: [
            {
              id: documentId,
              values: embedding,
              metadata
            }
          ]
        })
      })

      if (!response.ok) {
        throw new Error(`Pinecone upsert failed: ${response.statusText}`)
      }
    } catch (error) {
      console.error('Error upserting to Pinecone:', error)
      throw error
    }
  }

  async searchSimilarDocuments(
    embedding: number[],
    topK: number = 5,
    filter?: Record<string, any>
  ): Promise<SearchResult[]> {
    try {
      const response = await fetch(`${this.indexUrl}/query`, {
        method: 'POST',
        headers: {
          'Api-Key': this.apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          vector: embedding,
          topK,
          includeMetadata: true,
          filter
        })
      })

      if (!response.ok) {
        throw new Error(`Pinecone query failed: ${response.statusText}`)
      }

      const data = await response.json()

      return data.matches.map((match: any) => ({
        id: match.id,
        score: match.score || 0,
        metadata: match.metadata as DocumentMetadata
      }))
    } catch (error) {
      console.error('Error searching Pinecone:', error)
      throw error
    }
  }

  async findSimilarByDocumentType(
    embedding: number[],
    documentType: string,
    topK: number = 5
  ): Promise<SearchResult[]> {
    return this.searchSimilarDocuments(embedding, topK, {
      document_type: documentType
    })
  }

  async findDuplicateDocuments(
    embedding: number[],
    userId: string,
    threshold: number = 0.95
  ): Promise<SearchResult[]> {
    const results = await this.searchSimilarDocuments(embedding, 10, {
      user_id: userId
    })

    return results.filter((result) => result.score >= threshold)
  }

  async deleteDocument(documentId: string): Promise<void> {
    try {
      const response = await fetch(`${this.indexUrl}/vectors/delete`, {
        method: 'POST',
        headers: {
          'Api-Key': this.apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ids: [documentId]
        })
      })

      if (!response.ok) {
        throw new Error(`Pinecone delete failed: ${response.statusText}`)
      }
    } catch (error) {
      console.error('Error deleting from Pinecone:', error)
      throw error
    }
  }

  async getIndexStats() {
    try {
      const response = await fetch(`${this.indexUrl}/describe_index_stats`, {
        method: 'POST',
        headers: {
          'Api-Key': this.apiKey,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`Pinecone stats failed: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error getting index stats:', error)
      throw error
    }
  }
}

export const pineconeService = new PineconeService()
