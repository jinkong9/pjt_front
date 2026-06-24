import { api, toQuery } from '@/shared/api/client'

function splitImageUrls(value) {
  if (!value) return []
  if (Array.isArray(value)) return value
  return String(value)
    .split(',')
    .map((imageUrl) => imageUrl.trim())
    .filter(Boolean)
}

export function resolveTransferImageUrl(imageUrl) {
  if (!imageUrl) return ''
  if (/^(https?:)?\/\//.test(imageUrl) || imageUrl.startsWith('data:') || imageUrl.startsWith('blob:')) {
    return imageUrl
  }

  const normalized = imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`
  return normalized
}

export function normalizeTransfer(post) {
  const imageCandidates = [
    ...splitImageUrls(post.imageUrl ?? post.image_url),
    ...splitImageUrls(post.thumbnailUrl ?? post.thumbnail_url),
    ...splitImageUrls(post.imageUrls ?? post.image_urls ?? post.images),
  ]
  const imageUrls = [...new Set(imageCandidates.map(resolveTransferImageUrl).filter(Boolean))]

  return {
    transferId: post.transferId ?? post.transfer_id,
    writerId: post.writerId ?? post.writer_id,
    title: post.title,
    content: post.content,
    address: post.address,
    detailAddress: post.detailAddress ?? post.detail_address,
    floor: post.floor,
    exclusiveArea: post.exclusiveArea ?? post.exclusive_area,
    depositAmount: post.depositAmount ?? post.deposit_amount,
    monthlyRentAmount: post.monthlyRentAmount ?? post.monthly_rent_amount,
    maintenanceFee: post.maintenanceFee ?? post.maintenance_fee,
    transferFee: post.transferFee ?? post.transfer_fee,
    contractEndDate: post.contractEndDate ?? post.contract_end_date,
    moveInDate: post.moveInDate ?? post.move_in_date,
    contactPhone: post.contactPhone ?? post.contact_phone,
    status: post.status,
    imageUrls,
    viewCount: post.viewCount ?? post.view_count,
    createdAt: post.createdAt ?? post.created_at,
    favorite: Boolean(post.favorite ?? post.isFavorite ?? post.is_favorite),
  }
}

export function normalizeTransferComment(comment) {
  return {
    commentId: comment.commentId ?? comment.comment_id,
    transferId: comment.transferId ?? comment.transfer_id,
    writerId: comment.writerId ?? comment.writer_id,
    content: comment.content ?? '',
    createdAt: comment.createdAt ?? comment.created_at,
    updatedAt: comment.updatedAt ?? comment.updated_at,
  }
}

export function createTransferPayload(fields, images = []) {
  const payload = new FormData()

  Object.entries(fields).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return

    if (Array.isArray(value)) {
      value.forEach((item) => payload.append(key, item))
      return
    }

    payload.append(key, value)
  })

  images.forEach((image) => payload.append('images', image))

  return payload
}

export async function fetchTransfers(params = {}) {
  const { data } = await api.get('/transfers', { params: toQuery(params) })
  return data.map(normalizeTransfer)
}

export async function fetchTransferDetail(transferId) {
  const { data } = await api.get(`/transfers/${transferId}`)
  return normalizeTransfer(data)
}

export async function fetchFavoriteTransfers() {
  const { data } = await api.get('/transfers/favorites')
  return data.map(normalizeTransfer)
}

export async function createTransfer(fields, images = []) {
  const { data } = await api.post('/transfers', createTransferPayload(fields, images), {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return normalizeTransfer(data)
}

export async function updateTransfer(transferId, fields, images = []) {
  const { data } = await api.put(`/transfers/${transferId}`, createTransferPayload(fields, images), {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return normalizeTransfer(data)
}

export async function deleteTransfer(transferId) {
  await api.delete(`/transfers/${transferId}`)
}

export async function toggleFavoriteTransfer(transferId) {
  const { data } = await api.post(`/transfers/${transferId}/favorite/toggle`)
  return data
}

export async function fetchTransferComments(transferId) {
  const { data } = await api.get(`/transfers/${transferId}/comments`)
  return data.map(normalizeTransferComment)
}

export async function createTransferComment(transferId, content) {
  const { data } = await api.post(`/transfers/${transferId}/comments`, { content })
  return normalizeTransferComment(data)
}

export async function updateTransferComment(commentId, content) {
  const { data } = await api.put(`/transfers/comments/${commentId}`, { content })
  return normalizeTransferComment(data)
}

export async function deleteTransferComment(commentId) {
  await api.delete(`/transfers/comments/${commentId}`)
}
