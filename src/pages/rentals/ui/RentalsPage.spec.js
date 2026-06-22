import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createRouter, createWebHistory } from 'vue-router'

import RentalsPage from './RentalsPage.vue'
import {
  fetchRentalNotices,
  fetchRentalRecommendations,
  toggleFavoriteRentalNotice,
} from '@/entities/rental/api/rentalApi'

vi.mock('@/entities/rental/api/rentalApi', () => ({
  fetchRentalNotices: vi.fn(),
  fetchRentalRecommendations: vi.fn(),
  toggleFavoriteRentalNotice: vi.fn(),
}))

function createTestRouter() {
  return createRouter({
    history: createWebHistory(),
    routes: [
      { path: '/rentals', component: RentalsPage },
      { path: '/rentals/:noticeId', component: { template: '<div />' } },
      { path: '/login', component: { template: '<div />' } },
      { path: '/member', component: { template: '<div />' } },
      { path: '/mydata', component: { template: '<div />' } },
    ],
  })
}

async function mountRentalsPage() {
  const router = createTestRouter()
  await router.push('/rentals')
  await router.isReady()
  const wrapper = mount(RentalsPage, {
    global: {
      plugins: [router],
    },
  })
  await flushPromises()
  return { router, wrapper }
}

describe('RentalsPage recommendations', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    fetchRentalNotices.mockResolvedValue([])
  })

  it('renders recommendation cards from the recommendation API', async () => {
    fetchRentalRecommendations.mockResolvedValue([
      {
        notice: {
          rentalNoticeId: 'LH-REC-1',
          title: '서울 행복주택',
          regionName: '서울',
          status: '접수예정',
        },
        score: 92,
        reasons: ['소득 기준에 적합합니다.'],
        supplies: [{ area: '46.2', expectedAmount: '120,000,000' }],
      },
    ])
    toggleFavoriteRentalNotice.mockResolvedValue({ favorite: true })

    const { wrapper } = await mountRentalsPage()

    expect(fetchRentalRecommendations).toHaveBeenCalledWith(10)
    expect(wrapper.text()).toContain('나에게 맞는 LH 추천')
    expect(wrapper.text()).toContain('서울 행복주택')
    expect(wrapper.text()).toContain('92')
    expect(wrapper.text()).toContain('소득 기준에 적합합니다.')

    await wrapper.get('[data-testid="recommendation-favorite-LH-REC-1"]').trigger('click')
    await flushPromises()

    expect(toggleFavoriteRentalNotice).toHaveBeenCalledWith('LH-REC-1')
  })

  it('shows a login CTA when recommendations return 401', async () => {
    fetchRentalRecommendations.mockRejectedValue({ response: { status: 401 } })

    const { wrapper } = await mountRentalsPage()

    expect(wrapper.text()).toContain('로그인하면 맞춤 LH 추천을 볼 수 있습니다.')
    expect(wrapper.findComponent({ name: 'RouterLink' }).exists()).toBe(true)
  })

  it('shows a profile CTA when recommendations return 409', async () => {
    fetchRentalRecommendations.mockRejectedValue({ response: { status: 409 } })

    const { wrapper } = await mountRentalsPage()

    expect(wrapper.text()).toContain('금융 프로필을 먼저 입력해 주세요.')
    expect(wrapper.text()).toContain('프로필 입력')
  })
})
