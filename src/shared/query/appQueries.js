import { api } from '@/shared/api/client'

export const appKeys = {
  notices: {
    all: ['notices'],
    list: (params = {}) => ['notices', 'list', { ...params }],
    popups: (limit = 3) => ['notices', 'popups', Number(limit)],
    detail: (noticeId) => ['notices', 'detail', String(noticeId)],
  },
  houses: {
    all: ['houses'],
    list: (params = {}) => ['houses', 'list', { ...params }],
    sidos: () => ['houses', 'regions', 'sidos'],
    guguns: (sidoName) => ['houses', 'regions', 'guguns', sidoName || ''],
    dongs: (sidoName, gugunName) => ['houses', 'regions', 'dongs', sidoName || '', gugunName || ''],
  },
  analysis: {
    result: (params = {}) => ['analysis', { ...params }],
  },
}

export const appQueryOptions = {
  noticeList: (params = { limit: 50 }) => ({
    queryKey: appKeys.notices.list(params),
    queryFn: async () => {
      const { data } = await api.get('/notices', { params })
      return data
    },
    staleTime: 60_000,
  }),
  noticePopups: (limit = 3) => ({
    queryKey: appKeys.notices.popups(limit),
    queryFn: async () => {
      const { data } = await api.get('/notices/popups', { params: { limit } })
      return data
    },
    staleTime: 5 * 60_000,
  }),
  noticeDetail: (noticeId) => ({
    queryKey: appKeys.notices.detail(noticeId),
    queryFn: async () => {
      const { data } = await api.get(`/notices/${noticeId}`)
      return data
    },
    staleTime: 60_000,
  }),
  houseList: (params) => ({
    queryKey: appKeys.houses.list(params),
    queryFn: async () => {
      const { data } = await api.get('/houses', { params })
      return data
    },
    staleTime: 30_000,
  }),
  sidos: () => ({
    queryKey: appKeys.houses.sidos(),
    queryFn: async () => {
      const { data } = await api.get('/regions/sidos')
      return data
    },
    staleTime: 30 * 60_000,
  }),
  guguns: (sidoName) => ({
    queryKey: appKeys.houses.guguns(sidoName),
    queryFn: async () => {
      const { data } = await api.get('/regions/guguns', { params: { sidoName } })
      return data
    },
    enabled: Boolean(sidoName),
    staleTime: 30 * 60_000,
  }),
  dongs: (sidoName, gugunName) => ({
    queryKey: appKeys.houses.dongs(sidoName, gugunName),
    queryFn: async () => {
      const { data } = await api.get('/regions/dongs', { params: { sidoName, gugunName } })
      return data
    },
    enabled: Boolean(sidoName && gugunName),
    staleTime: 30 * 60_000,
  }),
  analysis: (params) => ({
    queryKey: appKeys.analysis.result(params),
    queryFn: async () => {
      const { data } = await api.get('/analysis', { params })
      return data
    },
    enabled: false,
    staleTime: 5 * 60_000,
  }),
}
