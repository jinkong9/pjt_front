import { api, toQuery } from '@/shared/api/client'

function normalizeTransfer(post) {
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
    imageUrls: post.imageUrls ?? post.image_urls ?? [],
    viewCount: post.viewCount ?? post.view_count,
    createdAt: post.createdAt ?? post.created_at,
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
