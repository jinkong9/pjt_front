import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'

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
})
