import { api, toQuery } from '@/shared/api/client'
import { sampleTransfers } from '@/entities/transfer/model/sampleTransfers'

let fallbackTransfers = [...sampleTransfers]

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

function createObjectUrls(images = []) {
  if (typeof URL === 'undefined' || typeof URL.createObjectURL !== 'function') return []
  return images.map((image) => URL.createObjectURL(image))
}

function normalizePayloadFields(fields, images = []) {
  return normalizeTransfer({
    ...fields,
    imageUrls: [...(fields.imageUrls ?? []), ...createObjectUrls(images)],
  })
}

export async function fetchTransfers(params = {}) {
  try {
    const { data } = await api.get('/transfers', { params: toQuery(params) })
    return data.map(normalizeTransfer)
  } catch {
    const keyword = params.keyword?.trim()
    const status = params.status?.trim()
    return fallbackTransfers
      .filter((post) => !keyword || `${post.title} ${post.address}`.includes(keyword))
      .filter((post) => !status || post.status === status)
  }
}

export async function fetchTransferDetail(transferId) {
  try {
    const { data } = await api.get(`/transfers/${transferId}`)
    return normalizeTransfer(data)
  } catch {
    return fallbackTransfers.find((post) => String(post.transferId) === String(transferId)) ?? fallbackTransfers[0]
  }
}

export async function createTransfer(fields, images = []) {
  try {
    const { data } = await api.post('/transfers', createTransferPayload(fields, images), {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return normalizeTransfer(data)
  } catch {
    const created = {
      ...normalizePayloadFields(fields, images),
      transferId: Date.now(),
      viewCount: 0,
      createdAt: new Date().toISOString(),
    }
    fallbackTransfers = [created, ...fallbackTransfers]
    return created
  }
}

export async function updateTransfer(transferId, fields, images = []) {
  try {
    const { data } = await api.put(`/transfers/${transferId}`, createTransferPayload(fields, images), {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return normalizeTransfer(data)
  } catch {
    const updated = {
      ...normalizePayloadFields(fields, images),
      transferId,
      viewCount: fields.viewCount ?? 0,
      createdAt: fields.createdAt ?? new Date().toISOString(),
    }
    fallbackTransfers = fallbackTransfers.map((post) =>
      String(post.transferId) === String(transferId) ? updated : post,
    )
    return updated
  }
}

export async function deleteTransfer(transferId) {
  try {
    await api.delete(`/transfers/${transferId}`)
  } catch {
    fallbackTransfers = fallbackTransfers.filter((post) => String(post.transferId) !== String(transferId))
  }
}
