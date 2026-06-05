import { api, toQuery } from '@/shared/api/client'
import { sampleTransfers } from '@/entities/transfer/model/sampleTransfers'

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
    viewCount: post.viewCount ?? post.view_count,
    createdAt: post.createdAt ?? post.created_at,
  }
}

export async function fetchTransfers(params = {}) {
  try {
    const { data } = await api.get('/transfers', { params: toQuery(params) })
    return data.map(normalizeTransfer)
  } catch {
    const keyword = params.keyword?.trim()
    const status = params.status?.trim()
    return sampleTransfers
      .filter((post) => !keyword || `${post.title} ${post.address}`.includes(keyword))
      .filter((post) => !status || post.status === status)
  }
}

export async function fetchTransferDetail(transferId) {
  try {
    const { data } = await api.get(`/transfers/${transferId}`)
    return normalizeTransfer(data)
  } catch {
    return sampleTransfers.find((post) => String(post.transferId) === String(transferId)) ?? sampleTransfers[0]
  }
}
