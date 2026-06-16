import { api } from '@/shared/api/client'

export async function getFinancialProfile() {
  const { data } = await api.get('/members/me/financial-profile')
  return data || null
}

export async function saveFinancialProfile(payload) {
  const { data } = await api.put('/members/me/financial-profile', payload)
  return data
}
