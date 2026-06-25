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

    expect(fetchRentalRecommendations).not.toHaveBeenCalled()
    await wrapper.get('[data-testid="rental-section-tab-recommendation"]').trigger('click')
    await flushPromises()

    expect(fetchRentalRecommendations).toHaveBeenCalledWith(10)
    expect(wrapper.text()).toContain('서울 행복주택')
    expect(wrapper.text()).toContain('92')
    expect(wrapper.text()).toContain('소득 기준에 적합합니다.')

    await wrapper.get('[data-testid="recommendation-favorite-LH-REC-1"]').trigger('click')
    await flushPromises()

    expect(toggleFavoriteRentalNotice).toHaveBeenCalledWith('LH-REC-1')
    expect(wrapper.get('[data-testid="recommendation-favorite-LH-REC-1"]').text()).toContain('관심중')
  })

  it('shows a login CTA when recommendations return 401', async () => {
    fetchRentalRecommendations.mockRejectedValue({ response: { status: 401 } })

    const { wrapper } = await mountRentalsPage()
    await wrapper.get('[data-testid="rental-section-tab-recommendation"]').trigger('click')
    await flushPromises()

    expect(wrapper.findComponent({ name: 'RouterLink' }).exists()).toBe(true)
  })

  it('shows a profile CTA when recommendations return 409', async () => {
    fetchRentalRecommendations.mockRejectedValue({ response: { status: 409 } })

    const { wrapper } = await mountRentalsPage()
    await wrapper.get('[data-testid="rental-section-tab-recommendation"]').trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('금융 프로필을 먼저 입력해 주세요.')
    expect(wrapper.text()).toContain('프로필 입력')
  })
  it('toggles a favorite from a regular LH notice card', async () => {
    fetchRentalRecommendations.mockResolvedValue([])
    fetchRentalNotices.mockResolvedValue([
      {
        rentalNoticeId: 'LH-LIST-1',
        title: 'LH 일반 공고',
        regionName: '서울',
        status: '접수예정',
        noticeType: '공공임대',
        detailType: '행복주택',
        applicationPeriod: '2026-06-01 ~ 2026-06-10',
        noticeDate: '2026-05-20',
      },
    ])
    toggleFavoriteRentalNotice.mockResolvedValue({ favorite: true })

    const { wrapper } = await mountRentalsPage()

    await wrapper.get('[data-testid="notice-favorite-LH-LIST-1"]').trigger('click')
    await flushPromises()

    expect(toggleFavoriteRentalNotice).toHaveBeenCalledWith('LH-LIST-1')
    expect(wrapper.get('[data-testid="notice-favorite-LH-LIST-1"]').text()).toContain('관심중')
    expect(wrapper.text()).toContain('관심 공고로 등록했습니다.')
  })

  it('uses rental type filters instead of status filters', async () => {
    fetchRentalRecommendations.mockResolvedValue([])
    fetchRentalNotices.mockResolvedValue([
      {
        rentalNoticeId: 'LAND-1',
        title: '토지 공급 공고',
        regionName: '인천광역시',
        status: '공고중',
        noticeType: '토지',
        detailType: '토지',
        applicationPeriod: '2026.07.09',
        noticeDate: '2026.06.23',
      },
      {
        rentalNoticeId: 'HOUSE-1',
        title: '행복주택 입주자 모집',
        regionName: '경상북도',
        status: '공고중',
        noticeType: '임대주택',
        detailType: '행복주택',
        applicationPeriod: '2026.07.02',
        noticeDate: '2026.06.22',
      },
      {
        rentalNoticeId: 'SHOP-1',
        title: '상가 입점자 모집',
        regionName: '강원특별자치도',
        status: '공고중',
        noticeType: '상가',
        detailType: '임대상가(추첨)',
        applicationPeriod: '2026.07.03',
        noticeDate: '2026.06.23',
      },
    ])

    const { wrapper } = await mountRentalsPage()

    expect(wrapper.get('[data-testid="rental-type-select"]').text()).toContain('유형 전체')
    expect(wrapper.text()).not.toContain('상태 전체')
    expect(wrapper.get('[data-testid="rental-section-tab-all"]').text()).toContain('전체')
    expect(wrapper.get('[data-testid="rental-section-tab-land"]').text()).toContain('토지')
    expect(wrapper.get('[data-testid="rental-section-tab-rental"]').text()).toContain('임대주택')
    expect(wrapper.get('[data-testid="rental-section-tab-shop"]').text()).toContain('상가')
    expect(wrapper.get('[data-testid="rental-section-tab-recommendation"]').text()).toContain('추천')

    await wrapper.get('[data-testid="rental-section-tab-rental"]').trigger('click')
    expect(wrapper.text()).toContain('행복주택 입주자 모집')
    expect(wrapper.text()).not.toContain('토지 공급 공고')
    expect(wrapper.text()).not.toContain('상가 입점자 모집')
  })
})
