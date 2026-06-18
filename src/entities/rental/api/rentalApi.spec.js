import { describe, expect, it } from 'vitest'

import { normalizeRentalDetail, normalizeRentalNotice } from './rentalApi'

describe('rentalApi normalization', () => {
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

  it('keeps notice region and supply address separated in detail responses', () => {
    expect(
      normalizeRentalDetail({
        notice: {
          notice_id: 'N-2',
          title: '부산 매입임대',
          region_name: '부산광역시',
        },
        detail: {
          contract_address: '부산시청',
          apply_start_date: '2026-07-01',
          contact: '1600-1004',
        },
        supplies: [
          {
            usage: '주거',
            address: '부산 해운대구 공급주소',
            expected_amount: '보증금 500만원',
            household_count: '20호',
          },
        ],
      }),
    ).toMatchObject({
      notice: {
        regionName: '부산광역시',
      },
      detail: {
        contractAddress: '부산시청',
        applyStartDate: '2026-07-01',
        contact: '1600-1004',
      },
      supplies: [
        {
          address: '부산 해운대구 공급주소',
          expectedAmount: '보증금 500만원',
          householdCount: '20호',
        },
      ],
    })
  })
})
