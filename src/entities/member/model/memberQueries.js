import { api } from '@/shared/api/client'
import { getFinancialProfile } from '@/entities/member/api/financialProfileApi'

export const memberKeys = {
  all: ['member'],
  me: () => ['member', 'me'],
  financialProfile: () => ['member', 'financial-profile'],
  dealFavorites: () => ['member', 'deal-favorites'],
}

export const memberQueryOptions = {
  me: () => ({
    queryKey: memberKeys.me(),
    queryFn: async () => {
      const { data } = await api.get('/members/me')
      return data
    },
    staleTime: 60_000,
  }),
  financialProfile: () => ({
    queryKey: memberKeys.financialProfile(),
    queryFn: getFinancialProfile,
    staleTime: 5 * 60_000,
  }),
  dealFavorites: () => ({
    queryKey: memberKeys.dealFavorites(),
    queryFn: async () => {
      const { data } = await api.get('/favorites')
      return data
    },
    staleTime: 60_000,
  }),
}
