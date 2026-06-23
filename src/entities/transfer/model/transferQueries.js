import {
  fetchTransferComments,
  fetchTransferDetail,
  fetchTransfers,
} from '@/entities/transfer/api/transferApi'

export const transferKeys = {
  all: ['transfers'],
  list: (params = {}) => ['transfers', 'list', { ...params }],
  detail: (transferId) => ['transfers', 'detail', String(transferId)],
  comments: (transferId) => ['transfers', 'comments', String(transferId)],
  favorites: () => ['transfers', 'favorites'],
}

export const transferQueryOptions = {
  list: (params) => ({
    queryKey: transferKeys.list(params),
    queryFn: () => fetchTransfers(params),
    staleTime: 60_000,
  }),
  detail: (transferId) => ({
    queryKey: transferKeys.detail(transferId),
    queryFn: () => fetchTransferDetail(transferId),
    staleTime: 60_000,
  }),
  comments: (transferId) => ({
    queryKey: transferKeys.comments(transferId),
    queryFn: () => fetchTransferComments(transferId),
    staleTime: 30_000,
  }),
}
