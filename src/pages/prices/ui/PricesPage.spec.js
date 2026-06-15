import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'

import PricesPage from '@/pages/prices/ui/PricesPage.vue'
import { api } from '@/shared/api/client'

let housesResponse = []

vi.mock('@/shared/api/client', () => ({
  api: {
    get: vi.fn((url) => {
      if (url === '/regions/sidos') return Promise.resolve({ data: [{ label: '서울특별시', value: '서울특별시' }] })
      if (url === '/regions/guguns') return Promise.resolve({ data: [{ label: '강남구', value: '강남구' }] })
      if (url === '/regions/dongs') return Promise.resolve({ data: [] })
      if (url === '/houses') return Promise.resolve({ data: housesResponse })
      return Promise.reject(new Error('unexpected url'))
    }),
    post: vi.fn(),
    put: vi.fn(),
  },
  toQuery: (params) =>
    Object.fromEntries(
      Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== ''),
    ),
}))

function createTestRouter() {
  return createRouter({
    history: createWebHistory(),
    routes: [
      { path: '/home', component: { template: '<div />' } },
      { path: '/prices', component: PricesPage },
      { path: '/analysis', component: { template: '<div />' } },
      { path: '/rentals', component: { template: '<div />' } },
      { path: '/transfers', component: { template: '<div />' } },
      { path: '/notices', component: { template: '<div />' } },
      { path: '/lh-calendar', component: { template: '<div />' } },
      { path: '/member', component: { template: '<div />' } },
      { path: '/login', component: { template: '<div />' } },
    ],
  })
}

describe('PricesPage', () => {
  beforeEach(() => {
    housesResponse = []
    vi.clearAllMocks()
  })

  it('loads Seoul Gangnam prices by default when opened without query params', async () => {
    const router = createTestRouter()
    await router.push('/prices')
    await router.isReady()

    mount(PricesPage, {
      global: {
        plugins: [router, createPinia()],
      },
    })
    await flushPromises()

    expect(api.get).toHaveBeenCalledWith('/houses', {
      params: expect.objectContaining({
        mode: 'region',
        sidoName: '서울특별시',
        gugunName: '강남구',
        limit: 20,
      }),
    })
  })

  it('does not render backend sample house rows or the map side navigation', async () => {
    housesResponse = [
      {
        no: 900001,
        aptSeq: 'SAMPLE-APT-001',
        aptName: '개포 샘플 아파트',
        address: '서울특별시 강남구 개포동 12-1',
        dealAmount: '185000',
        latitude: '37.4812',
        longitude: '127.0574',
      },
      {
        no: 7928647,
        aptSeq: 'REAL-APT-001',
        aptName: '개포 실제 아파트',
        address: '서울특별시 강남구 개포동 1',
        dealAmount: '210000',
        latitude: '37.48',
        longitude: '127.06',
      },
    ]
    const router = createTestRouter()
    await router.push('/prices')
    await router.isReady()

    const wrapper = mount(PricesPage, {
      global: {
        plugins: [router, createPinia()],
      },
    })
    await flushPromises()

    expect(wrapper.find('.map-side-nav').exists()).toBe(false)
    expect(wrapper.text()).not.toContain('샘플')
    expect(wrapper.text()).toContain('개포 실제 아파트')
  })

  it('opens the fixed detail panel and switches to the loan tab', async () => {
    housesResponse = [
      {
        no: 11,
        aptSeq: 'REAL-APT-001',
        aptName: '개포 실제 아파트',
        address: '서울특별시 강남구 개포동 1',
        dealAmount: '210000',
        exclusiveArea: 84.9,
        floor: '12',
        dealDate: '2026-04-10',
        latitude: '37.48',
        longitude: '127.06',
      },
    ]
    const router = createTestRouter()
    await router.push('/prices')
    await router.isReady()
    const wrapper = mount(PricesPage, {
      global: {
        plugins: [router, createPinia()],
      },
    })
    await flushPromises()

    expect(wrapper.text()).toContain('상세보기')
    expect(wrapper.find('[data-testid="property-detail-panel"]').exists()).toBe(false)

    await wrapper.get('[data-testid="open-detail-11"]').trigger('click')
    expect(wrapper.find('[data-testid="property-detail-panel"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('관심 매물 등록')
    expect(wrapper.get('[data-testid="property-close"]').classes()).toContain('property-icon-button')
    expect(wrapper.get('[data-testid="loan-tab"]').classes()).toContain('property-tab')

    await wrapper.get('[data-testid="loan-tab"]').trigger('click')
    expect(wrapper.text()).toContain('로그인 후 내 자산 기준 대출 분석을 확인하세요')
  })
})
