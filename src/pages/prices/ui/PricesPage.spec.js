import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'

import PricesPage from '@/pages/prices/ui/PricesPage.vue'
import { api } from '@/shared/api/client'

let housesResponse = []
let officetelResponse = []
let oneroomResponse = []
let latestMap = null

vi.mock('@/shared/api/client', () => ({
  api: {
    get: vi.fn((url, config = {}) => {
      if (url === '/regions/sidos')
        return Promise.resolve({ data: [{ label: '서울특별시', value: '서울특별시' }] })
      if (url === '/regions/guguns')
        return Promise.resolve({ data: [{ label: '강남구', value: '강남구' }] })
      if (url === '/regions/dongs') return Promise.resolve({ data: [] })
      if (url === '/property-deals') {
        const propertyType = config.params?.propertyType
        if (propertyType === 'OFFICETEL') return Promise.resolve({ data: officetelResponse })
        if (propertyType === 'ONEROOM') return Promise.resolve({ data: oneroomResponse })
        return Promise.resolve({ data: housesResponse })
      }
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
    officetelResponse = []
    oneroomResponse = []
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
        CustomOverlay: vi.fn(function CustomOverlay() {
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

    expect(api.get).toHaveBeenCalledWith('/property-deals', {
      params: expect.objectContaining({
        mode: 'region',
        sidoName: '서울특별시',
        gugunName: '강남구',
        propertyType: 'APARTMENT',
        limit: 20,
      }),
    })
    expect(api.get).toHaveBeenCalledWith('/property-deals', {
      params: expect.objectContaining({
        mode: 'region',
        propertyType: 'OFFICETEL',
        limit: 20,
      }),
    })
    const officetelCall = api.get.mock.calls.find(
      ([url, config]) => url === '/property-deals' && config.params.propertyType === 'OFFICETEL',
    )
    expect(officetelCall[1].params).not.toHaveProperty('sidoName')
    expect(officetelCall[1].params).not.toHaveProperty('gugunName')
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

  it('shows officetel and one-room deals from separate backend property types', async () => {
    housesResponse = [
      {
        propertyDealId: 1,
        propertyType: 'APARTMENT',
        dealType: 'TRADE',
        propertyName: '역삼 아파트',
        dealAmount: '90000',
        exclusiveArea: '84.9',
        floor: '10',
        dealDate: '2026-04-10',
        sidoName: '서울특별시',
        gugunName: '강남구',
        dongName: '역삼동',
        jibun: '1',
        latitude: 37.5,
        longitude: 127.03,
      },
    ]
    officetelResponse = [
      {
        propertyDealId: 2,
        propertyType: 'OFFICETEL',
        dealType: 'RENT',
        propertyName: '역삼 오피스텔',
        depositAmount: '3000',
        monthlyRentAmount: '120',
        exclusiveArea: '32.1',
        floor: '5',
        dealDate: '2026-04-11',
        sidoName: '서울특별시',
        gugunName: '강남구',
        dongName: '역삼동',
        jibun: '2',
        latitude: 37.51,
        longitude: 127.04,
      },
    ]
    oneroomResponse = [
      {
        propertyDealId: 3,
        propertyType: 'ONEROOM',
        dealType: 'RENT',
        propertyName: '역삼 원룸',
        depositAmount: '1000',
        monthlyRentAmount: '80',
        exclusiveArea: '20.5',
        floor: '3',
        dealDate: '2026-04-12',
        sidoName: '서울특별시',
        gugunName: '강남구',
        dongName: '역삼동',
        jibun: '3',
        latitude: 37.52,
        longitude: 127.05,
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

    expect(wrapper.text()).toContain('역삼 아파트')
    expect(wrapper.text()).not.toContain('역삼 오피스텔')

    await wrapper.get('[data-testid="property-tab-officetel"]').trigger('click')
    await flushPromises()
    expect(wrapper.text()).toContain('오피스텔 / 월세')
    expect(wrapper.text()).toContain('역삼 오피스텔')
    expect(wrapper.text()).toContain('3,000만원 / 120만원')
    expect(wrapper.text()).not.toContain('역삼 아파트')

    await wrapper.get('[data-testid="property-tab-oneroom"]').trigger('click')
    await flushPromises()
    expect(wrapper.text()).toContain('원룸 / 월세')
    expect(wrapper.text()).toContain('역삼 원룸')
    expect(wrapper.text()).not.toContain('역삼 오피스텔')
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
    expect(wrapper.get('[data-testid="property-detail-panel"]').classes()).not.toContain(
      'md:left-[544px]',
    )
    expect(wrapper.get('[data-testid="property-detail-panel"]').classes()).toContain('md:bottom-0')
    expect(wrapper.get('[data-testid="property-detail-panel"]').classes()).not.toContain('md:my-6')
    expect(wrapper.get('[data-testid="property-login-link"]').text()).toContain('관심')
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
