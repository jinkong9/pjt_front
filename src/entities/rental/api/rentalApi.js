import { api, toQuery } from '@/shared/api/client'

export function normalizeRentalNotice(notice) {
  return {
    rentalNoticeId: notice.rentalNoticeId ?? notice.rental_notice_id ?? notice.noticeId ?? notice.notice_id,
    noticeId: notice.noticeId ?? notice.notice_id ?? notice.rentalNoticeId ?? notice.rental_notice_id,
    title: notice.title,
    regionName: notice.regionName ?? notice.region_name,
    noticeType: notice.noticeType ?? notice.notice_type,
    detailType: notice.detailType ?? notice.detail_type,
    status: notice.status,
    noticeDate: notice.noticeDate ?? notice.notice_date,
    closeDate: notice.closeDate ?? notice.close_date,
    applyStartDate: notice.applyStartDate ?? notice.apply_start_date,
    applyEndDate: notice.applyEndDate ?? notice.apply_end_date,
  }
}

export async function fetchRentalNotices(params = {}) {
  const { data } = await api.get('/rentals', { params: toQuery(params) })
  return data.map(normalizeRentalNotice)
}

export async function fetchRentalDetail(noticeId) {
  const { data } = await api.get(`/rentals/${noticeId}`)
  return data
}
