import {
  fetchFavoriteRentalNotices,
  fetchRentalDetail,
  fetchRentalNotices,
  fetchRentalRecommendations,
} from '@/entities/rental/api/rentalApi'

export const rentalKeys = {
  all: ['rentals'],
  list: (params = {}) => ['rentals', 'list', { ...params }],
  detail: (noticeId) => ['rentals', 'detail', String(noticeId)],
  favorites: () => ['rentals', 'favorites'],
  recommendations: (limit = 10) => ['rentals', 'recommendations', Number(limit)],
}

export const rentalQueryOptions = {
  list: (params) => ({
    queryKey: rentalKeys.list(params),
    queryFn: () => fetchRentalNotices(params),
    staleTime: 60_000,
  }),
  detail: (noticeId) => ({
    queryKey: rentalKeys.detail(noticeId),
    queryFn: () => fetchRentalDetail(noticeId),
    staleTime: 5 * 60_000,
  }),
  favorites: () => ({
    queryKey: rentalKeys.favorites(),
    queryFn: fetchFavoriteRentalNotices,
    staleTime: 60_000,
  }),
  recommendations: (limit = 10) => ({
    queryKey: rentalKeys.recommendations(limit),
    queryFn: () => fetchRentalRecommendations(limit),
    staleTime: 5 * 60_000,
  }),
}
