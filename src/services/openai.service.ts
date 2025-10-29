export interface DocumentClassification {
  document_type: string
  confidence: number
  extracted_entities: {
    name?: string
    document_number?: string
    date_of_birth?: string
    issue_date?: string
    expiry_date?: string
    address?: string
  }
  verdict: 'APPROVED' | 'REJECTED' | 'NEEDS_REVIEW'
  reasoning: string
}

class OpenAIService {
  private apiKey: string

  constructor() {
    this.apiKey = import.meta.env.VITE_OPENAI_API_KEY
  }

  async generateEmbedding(text: string): Promise<number[]> {
    try {
      const response = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'text-embedding-3-small',
          input: text
        })
      })

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`)
      }

      const data = await response.json()
      return data.data[0].embedding
    } catch (error) {
      console.error('Error generating embedding:', error)
      throw error
    }
  }

  async classifyDocument(
    ocrText: string,
    documentType: string
  ): Promise<DocumentClassification> {
    try {
      const prompt = `You are an expert KYC document classifier for banking compliance.

Analyze the following OCR text from a ${documentType} document and extract:
1. Document type verification (is this really a ${documentType}?)
2. Key entities (name, document number, dates, address)
3. Quality assessment (is the document readable, complete, valid?)
4. Compliance verdict (APPROVED, REJECTED, NEEDS_REVIEW)

OCR Text:
${ocrText}

Respond in JSON format:
{
  "document_type": "verified type",
  "confidence": 0.0-1.0,
  "extracted_entities": {
    "name": "full name",
    "document_number": "number",
    "date_of_birth": "DOB",
    "issue_date": "issue date",
    "expiry_date": "expiry date",
    "address": "full address"
  },
  "verdict": "APPROVED | REJECTED | NEEDS_REVIEW",
  "reasoning": "detailed explanation"
}`

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: 'You are a KYC compliance expert. Respond only with valid JSON.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.3,
          response_format: { type: 'json_object' }
        })
      })

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`)
      }

      const data = await response.json()
      const content = data.choices[0].message.content

      if (!content) {
        throw new Error('No response from OpenAI')
      }

      return JSON.parse(content) as DocumentClassification
    } catch (error) {
      console.error('Error classifying document:', error)
      throw error
    }
  }

  async extractTextFromImage(imageUrl: string): Promise<string> {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: 'Extract all text from this document image. Return only the extracted text, preserving the layout and structure as much as possible.'
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: imageUrl
                  }
                }
              ]
            }
          ],
          max_tokens: 1000
        })
      })

      if (!response.ok) {
        throw new Error(`OpenAI Vision API error: ${response.statusText}`)
      }

      const data = await response.json()
      return data.choices[0].message.content || ''
    } catch (error) {
      console.error('Error extracting text from image:', error)
      throw error
    }
  }

  async generateOCRText(documentType: string): Promise<string> {
    const sampleTexts: Record<string, string> = {
      'PAN': 'INCOME TAX DEPARTMENT\nPermanent Account Number Card\nName: RAJESH KUMAR SHARMA\nFather Name: MOHAN LAL SHARMA\nDate of Birth: 15/08/1985\nPAN: ABCDE1234F',
      'Aadhaar': 'GOVERNMENT OF INDIA\nAadhaar\nName: PRIYA SINGH\nDOB: 23/03/1992\nAadhaar Number: 1234 5678 9012\nAddress: 123, MG Road, Bangalore - 560001',
      'Passport': 'REPUBLIC OF INDIA\nPassport\nSurname: KUMAR\nGiven Name: AMIT\nPassport No: K1234567\nDate of Birth: 10/12/1988\nDate of Issue: 01/06/2020\nDate of Expiry: 31/05/2030',
      'Driving License': 'DRIVING LICENCE\nState: Karnataka\nName: ANJALI REDDY\nDL No: KA0120190012345\nDOB: 05/07/1995\nIssue Date: 15/03/2019\nValid Till: 14/03/2039',
      'Voter ID': 'ELECTION COMMISSION OF INDIA\nELECTOR PHOTO IDENTITY CARD\nName: VIKRAM PATEL\nAge: 32 Years\nID No: ABC1234567\nAddress: 456, Park Street, Mumbai - 400001'
    }

    return sampleTexts[documentType] || 'Sample document text'
  }

  async analyzeDocumentBatch(documents: Array<{ id: string, ocrText: string, type: string }>) {
    const results = await Promise.all(
      documents.map(async (doc) => {
        try {
          const classification = await this.classifyDocument(doc.ocrText, doc.type)
          return { id: doc.id, classification, error: null }
        } catch (error) {
          return { id: doc.id, classification: null, error: String(error) }
        }
      })
    )

    return results
  }
}

export const openaiService = new OpenAIService()
