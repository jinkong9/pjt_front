import { api } from '@/shared/api/client'

export async function askAiChat(question) {
  const { data } = await api.post('/ai/chat', { question })

  return {
    answer: data.answer,
    indexedDocumentCount: data.indexedDocumentCount ?? data.indexed_document_count ?? 0,
  }
}
