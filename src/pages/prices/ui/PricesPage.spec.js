import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'

import PricesPage from '@/pages/prices/ui/PricesPage.vue'
import { api } from '@/shared/api/client'

let housesResponse = []
let latestMap = null

vi.mock('@/shared/api/client', () => ({
  api: {
    get: vi.fn((url) => {
      if (url === '/regions/sidos')
        return Promise.resolve({ data: [{ label: '서울특별시', value: '서울특별시' }] })
      if (url === '/regions/guguns')
        return Promise.resolve({ data: [{ label: '강남구', value: '강남구' }] })
      if (url === '/regions/dongs') return Promise.resolve({ data: [] })
      if (url === '/houses') return Promise.resolve({ data: housesResponse })
      return Promise.reject(new Error('unexpected url'))
    }),
    post: vi.fn(),
    put: vi.fn(),
  },
  toQuery: (params) =>
    Object.fromEntries(
      Object.entries(params).filter(
        ([, value]) => value !== undefined && value !== null && value !== '',
      ),
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
    latestMap = null
    window.kakao = {
      maps: {
        load: (callback) => callback(),
        LatLng: vi.fn(function LatLng(latitude, longitude) {
          return { latitude, longitude }
        }),
        LatLngBounds: vi.fn(function LatLngBounds() {
          return {
            extend: vi.fn(),
          }
        }),
        Map: vi.fn(function Map() {
          latestMap = {
            setBounds: vi.fn(),
            setCenter: vi.fn(),
            panTo: vi.fn(),
            setLevel: vi.fn(),
          }
          return latestMap
        }),
        Marker: vi.fn(function Marker() {
          return {
            setMap: vi.fn(),
          }
        }),
        event: {
          addListener: vi.fn(),
        },
      },
    }
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
    expect(wrapper.get('.price-search-panel').classes()).toContain('price-panel-frame')
    expect(wrapper.get('[data-testid="property-detail-panel"]').classes()).toContain(
      'price-panel-frame',
    )
    expect(wrapper.get('[data-testid="property-detail-panel"]').classes()).not.toContain(
      'md:my-6',
    )
    expect(wrapper.text()).toContain('관심 매물 등록')
    expect(wrapper.get('[data-testid="property-close"]').classes()).toContain('rounded-xl')
    expect(wrapper.get('[data-testid="loan-tab"]').classes()).toContain('min-h-11')

    await wrapper.get('[data-testid="loan-tab"]').trigger('click')
    expect(wrapper.text()).toContain('로그인 후 내 자산 기준 대출 분석을 확인하세요')
  })

  it('keeps the initial map close instead of fitting all listings to a wide view', async () => {
    housesResponse = [
      {
        no: 11,
        aptSeq: 'REAL-APT-001',
        aptName: '역삼 실제 아파트',
        address: '서울특별시 강남구 역삼동 1',
        dealAmount: '210000',
        exclusiveArea: 84.9,
        floor: '12',
        dealDate: '2026-04-10',
        latitude: '37.50',
        longitude: '127.03',
      },
    ]
    const router = createTestRouter()
    await router.push('/prices')
    await router.isReady()

    mount(PricesPage, {
      global: {
        plugins: [router, createPinia()],
      },
    })
    await flushPromises()

    expect(window.kakao.maps.Map).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        level: 6,
      }),
    )
    expect(latestMap.setLevel).toHaveBeenCalledWith(6)
    expect(latestMap.setBounds).not.toHaveBeenCalled()
  })

  it('preserves the selected trade and active tab in login links', async () => {
    housesResponse = [
      {
        no: 11,
        aptSeq: 'REAL-APT-001',
        aptName: '역삼 실제 아파트',
        address: '서울특별시 강남구 역삼동 1',
        dealAmount: '210000',
        exclusiveArea: 84.9,
        floor: '12',
        dealDate: '2026-04-10',
        latitude: '37.50',
        longitude: '127.03',
      },
    ]
    const router = createTestRouter()
    await router.push('/prices?mode=search&keyword=역삼')
    await router.isReady()
    const wrapper = mount(PricesPage, {
      global: {
        plugins: [router, createPinia()],
      },
    })
    await flushPromises()

    await wrapper.get('[data-testid="open-detail-11"]').trigger('click')
    await wrapper.get('[data-testid="loan-tab"]').trigger('click')

    const loginLink = wrapper
      .findAllComponents({ name: 'RouterLink' })
      .find((link) => link.attributes('data-testid') === 'property-login-link')

    expect(loginLink.props('to')).toEqual({
      path: '/login',
      query: {
        redirect: '/prices?mode=search&keyword=역삼&trade=11&tab=loan',
      },
    })
  })

  it('restores the selected trade and loan tab after returning from login', async () => {
    housesResponse = [
      {
        no: 11,
        aptSeq: 'REAL-APT-001',
        aptName: '역삼 실제 아파트',
        address: '서울특별시 강남구 역삼동 1',
        dealAmount: '210000',
        exclusiveArea: 84.9,
        floor: '12',
        dealDate: '2026-04-10',
        latitude: '37.50',
        longitude: '127.03',
      },
    ]
    const router = createTestRouter()
    await router.push('/prices?mode=search&keyword=역삼&trade=11&tab=loan')
    await router.isReady()
    const wrapper = mount(PricesPage, {
      global: {
        plugins: [router, createPinia()],
      },
    })
    await flushPromises()

    expect(wrapper.find('[data-testid="property-detail-panel"]').exists()).toBe(true)
    expect(wrapper.get('[data-testid="loan-tab"]').classes()).toContain('border-[#b4212a]')
    expect(wrapper.text()).toContain('로그인 후 내 자산 기준 대출 분석을 확인하세요')
  })

  it('restores a valid trade on the detail tab when the requested tab is invalid', async () => {
    housesResponse = [
      {
        no: 11,
        aptSeq: 'REAL-APT-001',
        aptName: '역삼 실제 아파트',
        address: '서울특별시 강남구 역삼동 1',
        dealAmount: '210000',
        exclusiveArea: 84.9,
        floor: '12',
        dealDate: '2026-04-10',
        latitude: '37.50',
        longitude: '127.03',
      },
    ]
    const router = createTestRouter()
    await router.push('/prices?mode=search&keyword=역삼&trade=11&tab=unknown')
    await router.isReady()
    const wrapper = mount(PricesPage, {
      global: {
        plugins: [router, createPinia()],
      },
    })
    await flushPromises()

    expect(wrapper.find('[data-testid="property-detail-panel"]').exists()).toBe(true)
    expect(wrapper.get('[data-testid="loan-tab"]').classes()).not.toContain('border-[#b4212a]')
    expect(wrapper.text()).toContain('거래 가격')
  })
})
