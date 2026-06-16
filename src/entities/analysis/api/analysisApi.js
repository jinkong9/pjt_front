import { api } from '@/shared/api/client'

export async function getPropertyAnalysis(params) {
  const { data } = await api.get('/analysis', { params })
  return data
}
