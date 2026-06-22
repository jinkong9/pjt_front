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
})
