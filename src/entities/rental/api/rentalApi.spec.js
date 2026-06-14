import { beforeEach, describe, expect, it, vi } from 'vitest'

import { fetchRentalDetail, fetchRentalNotices } from '@/entities/rental/api/rentalApi'
import { api } from '@/shared/api/client'

vi.mock('@/shared/api/client', () => ({
  api: {
    get: vi.fn(),
  },
  toQuery: (params) =>
    Object.fromEntries(
      Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== ''),
    ),
}))

describe('rentalApi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('uses backend rental notices without falling back to sample notices', async () => {
    api.get.mockResolvedValueOnce({
      data: [
        {
          rental_notice_id: 12,
          notice_id: 12,
          title: '서울 강남 공공임대',
          region_name: '서울 강남구',
          notice_type: '공공임대',
          detail_type: '아파트',
        },
      ],
    })

    await expect(fetchRentalNotices({ size: 6 })).resolves.toEqual([
      expect.objectContaining({
        rentalNoticeId: 12,
        noticeId: 12,
        title: '서울 강남 공공임대',
        regionName: '서울 강남구',
        noticeType: '공공임대',
        detailType: '아파트',
      }),
    ])
    expect(api.get).toHaveBeenCalledWith('/rentals', { params: { size: 6 } })
  })

  it('propagates rental list backend errors instead of serving sample notices', async () => {
    api.get.mockRejectedValueOnce(new Error('backend unavailable'))

    await expect(fetchRentalNotices()).rejects.toThrow('backend unavailable')
  })

  it('propagates rental detail backend errors instead of serving sample detail', async () => {
    api.get.mockRejectedValueOnce(new Error('detail unavailable'))

    await expect(fetchRentalDetail(12)).rejects.toThrow('detail unavailable')
  })
})
