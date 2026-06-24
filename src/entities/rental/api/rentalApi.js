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
    favorite: Boolean(valueOf(notice, 'favorite', 'isFavorite', 'is_favorite')),
  }
}

export function normalizeRentalDetail(payload = {}) {
  const detail = payload.detail ?? {}
  const notice = normalizeRentalNotice(payload.notice ?? payload)

  return {
    notice,
    detail: {
      contractAddress: valueOf(detail, 'contractAddress', 'contract_address') || '-',
      contractDetailAddress: valueOf(detail, 'contractDetailAddress', 'contract_detail_address') || '-',
      noticeDate:
        valueOf(detail, 'noticeDate', 'notice_date', 'applyStartDate', 'apply_start_date') ||
        notice.noticeDate ||
        '-',
      closeDate:
        valueOf(detail, 'closeDate', 'close_date', 'applyEndDate', 'apply_end_date') ||
        notice.closeDate ||
        '-',
      contact: valueOf(detail, 'contact') || '-',
    },
    supplies: (payload.supplies ?? payload.supplyList ?? []).map((supply) => ({
      usage: valueOf(supply, 'usage') || '-',
      address: valueOf(supply, 'address') || '-',
      lotNumber: valueOf(supply, 'lotNumber', 'lot_number') || '-',
      area: valueOf(supply, 'area') || '-',
      expectedAmount: valueOf(supply, 'expectedAmount', 'expected_amount') || '-',
      expectedAmountRaw: valueOf(supply, 'expectedAmountRaw', 'expected_amount_raw') || '',
      houseType: valueOf(supply, 'houseType', 'house_type') || '-',
      householdCount: valueOf(supply, 'householdCount', 'household_count') || '-',
      internetApplyStatus: valueOf(supply, 'internetApplyStatus', 'internet_apply_status') || '-',
      mapAddress: valueOf(supply, 'mapAddress', 'map_address') || valueOf(supply, 'address') || '',
      mapUrl: valueOf(supply, 'mapUrl', 'map_url') || '',
      latitude: valueOf(supply, 'latitude', 'lat'),
      longitude: valueOf(supply, 'longitude', 'lng', 'lon'),
    })),
  }
}

export function normalizeRentalRecommendation(payload = {}) {
  return {
    notice: normalizeRentalNotice(payload.notice ?? payload),
    score: valueOf(payload, 'score') ?? 0,
    reasons: valueOf(payload, 'reasons') ?? [],
    supplies: (payload.supplies ?? payload.supplyList ?? []).map((supply) => ({
      usage: valueOf(supply, 'usage') || '-',
      address: valueOf(supply, 'address') || '-',
      lotNumber: valueOf(supply, 'lotNumber', 'lot_number') || '-',
      area: valueOf(supply, 'area') || '-',
      expectedAmount: valueOf(supply, 'expectedAmount', 'expected_amount') || '-',
      expectedAmountRaw: valueOf(supply, 'expectedAmountRaw', 'expected_amount_raw') || '',
      houseType: valueOf(supply, 'houseType', 'house_type') || '-',
      householdCount: valueOf(supply, 'householdCount', 'household_count') || '-',
      internetApplyStatus: valueOf(supply, 'internetApplyStatus', 'internet_apply_status') || '-',
      mapAddress: valueOf(supply, 'mapAddress', 'map_address') || valueOf(supply, 'address') || '',
      mapUrl: valueOf(supply, 'mapUrl', 'map_url') || '',
      latitude: valueOf(supply, 'latitude', 'lat'),
      longitude: valueOf(supply, 'longitude', 'lng', 'lon'),
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

export async function fetchFavoriteRentalNotices() {
  const { data } = await api.get('/rentals/favorites')
  return data.map(normalizeRentalDetail)
}

export async function toggleFavoriteRentalNotice(noticeId) {
  const { data } = await api.post(`/rentals/${noticeId}/favorite/toggle`)
  return data
}

export async function fetchRentalRecommendations(limit = 10) {
  const { data } = await api.get('/rentals/recommendations', { params: { limit } })
  return data.map(normalizeRentalRecommendation)
}

export async function sendFavoriteRentalNoticeEmails() {
  const { data } = await api.post('/rentals/favorites/emails/send')
  return data
}
