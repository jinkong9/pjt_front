import { api, toQuery } from '@/shared/api/client'

function valueOf(source = {}, ...keys) {
  return keys.map((key) => source?.[key]).find((value) => value !== undefined && value !== null)
}

function buildPeriod(start, end) {
  if (start && end) return `${start} ~ ${end}`
  return start || end || ''
}

export function normalizeRentalNotice(notice) {
  const noticeId = valueOf(notice, 'noticeId', 'notice_id', 'rentalNoticeId', 'rental_notice_id')
  const applyStartDate = valueOf(notice, 'applyStartDate', 'apply_start_date')
  const applyEndDate = valueOf(notice, 'applyEndDate', 'apply_end_date', 'closeDate', 'close_date')

  return {
    rentalNoticeId: noticeId,
    noticeId,
    title: valueOf(notice, 'title') || '제목 없음',
    regionName: valueOf(notice, 'regionName', 'region_name') || '-',
    noticeType: valueOf(notice, 'noticeType', 'notice_type') || '-',
    detailType: valueOf(notice, 'detailType', 'detail_type') || '-',
    status: valueOf(notice, 'status') || '공고',
    noticeDate: valueOf(notice, 'noticeDate', 'notice_date'),
    closeDate: valueOf(notice, 'closeDate', 'close_date'),
    applyStartDate,
    applyEndDate,
    applicationPeriod: buildPeriod(applyStartDate, applyEndDate),
    detailUrl: valueOf(notice, 'detailUrl', 'detail_url'),
    source: valueOf(notice, 'source'),
  }
}

export function normalizeRentalDetail(payload = {}) {
  const detail = payload.detail ?? {}

  return {
    notice: normalizeRentalNotice(payload.notice ?? payload),
    detail: {
      contractAddress: valueOf(detail, 'contractAddress', 'contract_address') || '-',
      contractDetailAddress: valueOf(detail, 'contractDetailAddress', 'contract_detail_address') || '-',
      applyStartDate: valueOf(detail, 'applyStartDate', 'apply_start_date') || '-',
      applyEndDate: valueOf(detail, 'applyEndDate', 'apply_end_date') || '-',
      contact: valueOf(detail, 'contact') || '-',
    },
    supplies: (payload.supplies ?? payload.supplyList ?? []).map((supply) => ({
      usage: valueOf(supply, 'usage') || '-',
      address: valueOf(supply, 'address') || '-',
      area: valueOf(supply, 'area') || '-',
      expectedAmount: valueOf(supply, 'expectedAmount', 'expected_amount') || '-',
      houseType: valueOf(supply, 'houseType', 'house_type') || '-',
      householdCount: valueOf(supply, 'householdCount', 'household_count') || '-',
    })),
  }
}

export async function fetchRentalNotices(params = {}) {
  const { data } = await api.get('/rentals', { params: toQuery(params) })
  return data.map(normalizeRentalNotice)
}

export async function fetchRentalDetail(noticeId) {
  const { data } = await api.get(`/rentals/${noticeId}`)
  return normalizeRentalDetail(data)
}
