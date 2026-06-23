import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createRouter, createWebHistory } from 'vue-router'

import RentalDetailPage from './RentalDetailPage.vue'
import { fetchRentalDetail, toggleFavoriteRentalNotice } from '@/entities/rental/api/rentalApi'

vi.mock('@/entities/rental/api/rentalApi', () => ({
  fetchFavoriteRentalNotices: vi.fn().mockResolvedValue([]),
  fetchRentalDetail: vi.fn(),
  toggleFavoriteRentalNotice: vi.fn(),
}))

function rentalDetail() {
  return {
    notice: {
      rentalNoticeId: 'LH-1',
      noticeId: 'LH-1',
      title: '서울 행복주택 입주자 모집',
      regionName: '서울',
      noticeType: '공공임대',
      detailType: '행복주택',
      status: '접수예정',
      detailUrl: 'https://apply.lh.or.kr',
    },
    detail: {
      noticeDate: '2026-06-01',
      closeDate: '2026-06-10',
      contractAddress: '서울',
      contact: '1600-1004',
    },
    supplies: [],
  }
}

async function mountPage(initialPath = '/rentals/LH-1') {
  const router = createRouter({
    history: createWebHistory(),
    routes: [
      { path: '/rentals/:noticeId', component: RentalDetailPage },
      { path: '/login', component: { template: '<div>Login</div>' } },
    ],
  })
  await router.push(initialPath)
  await router.isReady()

  const wrapper = mount(RentalDetailPage, {
    global: {
      plugins: [router],
    },
  })
  await flushPromises()
  return { router, wrapper }
}

describe('RentalDetailPage favorite button', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    delete window.kakao
    document.getElementById('kakao-map-sdk')?.remove()
  })

  it('toggles the favorite state from the detail header', async () => {
    fetchRentalDetail.mockResolvedValue(rentalDetail())
    toggleFavoriteRentalNotice.mockResolvedValue({ favorite: true })

    const { wrapper } = await mountPage()

    await wrapper.get('[data-testid="rental-favorite-toggle"]').trigger('click')
    await flushPromises()

    expect(toggleFavoriteRentalNotice).toHaveBeenCalledWith('LH-1')
    expect(wrapper.get('[data-testid="rental-favorite-toggle"]').text()).toContain('관심 공고 해제')
  })

  it('sends 401 users to login with the rental detail redirect', async () => {
    fetchRentalDetail.mockResolvedValue(rentalDetail())
    toggleFavoriteRentalNotice.mockRejectedValue({ response: { status: 401 } })

    const { router, wrapper } = await mountPage()

    await wrapper.get('[data-testid="rental-favorite-toggle"]').trigger('click')
    await flushPromises()

    expect(router.currentRoute.value.fullPath).toBe('/login?redirect=/rentals/LH-1')
  })

  it('explains when Kakao geocoding cannot find coordinates for an LH supply name', async () => {
    window.kakao = {
      maps: {
        load: (callback) => callback(),
        services: {
          Status: { OK: 'OK' },
          Geocoder: vi.fn(function Geocoder() {
            return {
              addressSearch: vi.fn((address, callback) => callback([], 'ZERO_RESULT')),
            }
          }),
        },
      },
    }
    fetchRentalDetail.mockResolvedValue({
      ...rentalDetail(),
      supplies: [
        {
          usage: '26A',
          address: '서귀포 대정 통합공공임대주택',
          lotNumber: '-',
          area: '26.32',
        },
      ],
    })

    const { wrapper } = await mountPage()
    await flushPromises()

    expect(wrapper.text()).toContain('좌표를 찾지 못했습니다')
    expect(wrapper.text()).not.toContain('Kakao JavaScript 키')
  })
})
