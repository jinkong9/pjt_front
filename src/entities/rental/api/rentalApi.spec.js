import { beforeEach, describe, expect, it, vi } from 'vitest'

import { api } from '@/shared/api/client'
import {
  fetchFavoriteRentalNotices,
  fetchRentalRecommendations,
  normalizeRentalDetail,
  normalizeRentalNotice,
  normalizeRentalRecommendation,
  sendFavoriteRentalNoticeEmails,
  toggleFavoriteRentalNotice,
} from './rentalApi'

vi.mock('@/shared/api/client', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
  },
  toQuery: (params) =>
    Object.fromEntries(
      Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== ''),
    ),
}))

describe('rentalApi normalization', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('maps LH notice fields from camelCase and snake_case responses', () => {
    expect(
      normalizeRentalNotice({
        rental_notice_id: 'N-1',
        title: '서울 행복주택 입주자 모집',
        region_name: '서울특별시',
        notice_type: '임대주택',
        detail_type: '행복주택',
        apply_start_date: '2026-06-01',
        apply_end_date: '2026-06-10',
        detail_url: 'https://apply.lh.or.kr',
      }),
    ).toMatchObject({
      rentalNoticeId: 'N-1',
      noticeId: 'N-1',
      regionName: '서울특별시',
      noticeType: '임대주택',
      detailType: '행복주택',
      applicationPeriod: '2026-06-01 ~ 2026-06-10',
      detailUrl: 'https://apply.lh.or.kr',
    })
  })

  it('keeps notice region and maps supply land fields for detail responses', () => {
    expect(
      normalizeRentalDetail({
        notice: {
          notice_id: 'N-2',
          title: '화성동탄 근린생활시설용지 공급',
          region_name: '경기도',
        },
        detail: {
          contract_address: '경기도 화성시 동탄구 노작로 10',
          contract_detail_address: '오산동탄사업본부 1층',
          apply_start_date: '2026-07-01',
          contact: '1600-1004',
        },
        supplies: [
          {
            usage: '근린생활시설',
            address: '경기도 화성시 동탄구 반송동',
            lot_number: '61-3',
            area: '493.4',
            expected_amount: '2,605,152,000',
            expected_amount_raw: '2605152000',
            internet_apply_status: '입찰신청전',
            map_address: '경기도 화성시 동탄구 반송동 61-3',
            map_url: 'https://map.naver.com/v5/search/example',
            household_count: '20',
          },
        ],
      }),
    ).toMatchObject({
      notice: {
        regionName: '경기도',
      },
      detail: {
        contractAddress: '경기도 화성시 동탄구 노작로 10',
        contractDetailAddress: '오산동탄사업본부 1층',
        noticeDate: '2026-07-01',
        contact: '1600-1004',
      },
      supplies: [
        {
          usage: '근린생활시설',
          address: '경기도 화성시 동탄구 반송동',
          lotNumber: '61-3',
          area: '493.4',
          expectedAmount: '2,605,152,000',
          expectedAmountRaw: '2605152000',
          internetApplyStatus: '입찰신청전',
          mapAddress: '경기도 화성시 동탄구 반송동 61-3',
          mapUrl: 'https://map.naver.com/v5/search/example',
          householdCount: '20',
        },
      ],
    })
  })

  it('maps basic detail dates from the notice JSON fields', () => {
    expect(
      normalizeRentalDetail({
        notice: {
          noticeId: 'BN-0007655',
          regionName: '경기도',
          detailType: '토지',
          noticeDate: '2026.06.22',
          closeDate: '2026.07.07',
        },
        detail: {
          contact: '1600-1004',
        },
      }),
    ).toMatchObject({
      notice: {
        regionName: '경기도',
        detailType: '토지',
      },
      detail: {
        noticeDate: '2026.06.22',
        closeDate: '2026.07.07',
        contact: '1600-1004',
      },
    })
  })

  it('normalizes LH recommendation responses with notice, score, reasons, and supplies', () => {
    expect(
      normalizeRentalRecommendation({
        notice: {
          notice_id: 'LH-REC-1',
          title: '서울 행복주택',
          region_name: '서울',
          status: '접수예정',
        },
        score: 87.5,
        reasons: ['소득 기준에 적합', '자산 기준에 적합'],
        supplies: [
          {
            area: '46.2',
            expected_amount: '120,000,000',
            household_count: '12',
          },
        ],
      }),
    ).toMatchObject({
      notice: {
        rentalNoticeId: 'LH-REC-1',
        title: '서울 행복주택',
        regionName: '서울',
        status: '접수예정',
      },
      score: 87.5,
      reasons: ['소득 기준에 적합', '자산 기준에 적합'],
      supplies: [
        {
          area: '46.2',
          expectedAmount: '120,000,000',
          householdCount: '12',
        },
      ],
    })
  })

  it('loads favorite LH notices through the favorites endpoint', async () => {
    api.get.mockResolvedValueOnce({
      data: [
        {
          notice: {
            noticeId: 'LH-FAV-1',
            title: '관심 LH 공고',
            regionName: '경기',
          },
        },
      ],
    })

    await expect(fetchFavoriteRentalNotices()).resolves.toMatchObject([
      {
        notice: {
          rentalNoticeId: 'LH-FAV-1',
          title: '관심 LH 공고',
          regionName: '경기',
        },
      },
    ])
    expect(api.get).toHaveBeenCalledWith('/rentals/favorites')
  })

  it('uses backend paths for toggling favorites, recommendations, and email sending', async () => {
    api.post.mockResolvedValueOnce({ data: { favorite: true } })
    await expect(toggleFavoriteRentalNotice('LH-1')).resolves.toEqual({ favorite: true })
    expect(api.post).toHaveBeenCalledWith('/rentals/LH-1/favorite/toggle')

    api.get.mockResolvedValueOnce({ data: [] })
    await expect(fetchRentalRecommendations(3)).resolves.toEqual([])
    expect(api.get).toHaveBeenCalledWith('/rentals/recommendations', { params: { limit: 3 } })

    api.post.mockResolvedValueOnce({
      data: { sentCount: 1, skippedCount: 0, missingMemberCount: 0 },
    })
    await expect(sendFavoriteRentalNoticeEmails()).resolves.toEqual({
      sentCount: 1,
      skippedCount: 0,
      missingMemberCount: 0,
    })
    expect(api.post).toHaveBeenCalledWith('/rentals/favorites/emails/send')
  })
})
