import { api, toQuery } from '@/shared/api/client'
import { sampleRentalNotices } from '@/entities/rental/model/sampleRentalNotices'

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
  try {
    const { data } = await api.get('/rentals', { params: toQuery(params) })
    return data.map(normalizeRentalNotice)
  } catch {
    return sampleRentalNotices
  }
}

export async function fetchRentalDetail(noticeId) {
  try {
    const { data } = await api.get(`/rentals/${noticeId}`)
    return data
  } catch {
    const notice =
      sampleRentalNotices.find((item) => String(item.rentalNoticeId) === String(noticeId)) ??
      sampleRentalNotices[0]

    return {
      notice,
      detail: {
        contractAddress: `${notice.regionName} LH 주거복지지사`,
        contractDetailAddress: '상세 주소는 원문 공고를 확인하세요.',
        applyStartDate: notice.applyStartDate,
        applyEndDate: notice.applyEndDate,
        contact: '1600-1004',
      },
      supplies: [
        {
          usage: notice.detailType,
          address: notice.regionName,
          area: '전용 26㎡ 이상',
          expectedAmount: '공고문 참고',
          houseType: notice.noticeType,
          householdCount: '모집중',
        },
      ],
    }
  }
}
