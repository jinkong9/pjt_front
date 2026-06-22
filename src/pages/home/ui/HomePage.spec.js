import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'

import HomePage from '@/pages/home/ui/HomePage.vue'

const push = vi.fn()

vi.mock('vue-router', async () => {
  const actual = await vi.importActual('vue-router')
  return {
    ...actual,
    useRouter: () => ({ push }),
  }
})

vi.mock('@/entities/rental/api/rentalApi', () => ({
  fetchRentalNotices: vi.fn().mockResolvedValue([]),
}))

vi.mock('@/shared/api/client', () => ({
  api: {
    get: vi.fn().mockResolvedValue({ data: [] }),
  },
  toQuery: (params) =>
    Object.fromEntries(
      Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== ''),
    ),
}))

describe('HomePage', () => {
  beforeEach(async () => {
    push.mockClear()
    localStorage.clear()
    const { api } = await import('@/shared/api/client')
    api.get.mockResolvedValue({ data: [] })
  })

  it('routes the hero action directly to the Gangnam price map', async () => {
    const wrapper = mount(HomePage, {
      global: {
        stubs: {
          RouterLink: true,
          Swiper: { template: '<div><slot /></div>' },
          SwiperSlide: { template: '<div><slot /></div>' },
        },
      },
    })

    expect(wrapper.find('.main-search input').exists()).toBe(false)

    await wrapper.find('.main-search').trigger('submit')

    expect(push).toHaveBeenCalledWith({
      path: '/prices',
      query: {
        mode: 'region',
        sidoName: '서울특별시',
        gugunName: '강남구',
        limit: 20,
      },
    })
  })

  it('closes the notice popup for the current page view', async () => {
    const { api } = await import('@/shared/api/client')
    api.get.mockResolvedValueOnce({
      data: [{ noticeId: 10, title: '2026.05.15 부터 점검이 시작됩니다.' }],
    })

    const wrapper = mount(HomePage, {
      global: {
        stubs: {
          RouterLink: true,
          Swiper: { template: '<div><slot /></div>' },
          SwiperSlide: { template: '<div><slot /></div>' },
        },
      },
    })
    await flushPromises()

    expect(wrapper.find('[data-testid="notice-popup"]').exists()).toBe(true)

    await wrapper.get('[data-testid="notice-close"]').trigger('click')

    expect(wrapper.find('[data-testid="notice-popup"]').exists()).toBe(false)
    expect(localStorage.getItem('happyhome.noticePopupHiddenUntil')).toBeNull()
  })

  it('hides the notice popup for one day when selected', async () => {
    const { api } = await import('@/shared/api/client')
    api.get.mockResolvedValueOnce({
      data: [{ noticeId: 11, title: '하루 동안 숨길 공지' }],
    })

    const wrapper = mount(HomePage, {
      global: {
        stubs: {
          RouterLink: true,
          Swiper: { template: '<div><slot /></div>' },
          SwiperSlide: { template: '<div><slot /></div>' },
        },
      },
    })
    await flushPromises()

    await wrapper.get('[data-testid="notice-hide-today"]').trigger('click')

    const hiddenUntil = JSON.parse(localStorage.getItem('happyhome.noticePopupHiddenUntil'))
    expect(hiddenUntil['11']).toBeGreaterThan(Date.now())
    expect(wrapper.find('[data-testid="notice-popup"]').exists()).toBe(false)
  })
})
