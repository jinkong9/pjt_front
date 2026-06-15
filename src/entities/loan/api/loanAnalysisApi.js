import { api } from '@/shared/api/client'

export async function analyzePropertyLoan(payload) {
  const { data } = await api.post('/loans/property-analysis', payload)
  return data
}
