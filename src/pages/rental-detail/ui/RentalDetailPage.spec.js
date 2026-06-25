import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createRouter, createWebHistory } from 'vue-router'

import RentalDetailPage from './RentalDetailPage.vue'
import { fetchRentalDetail, toggleFavoriteRentalNotice } from '@/entities/rental/api/rentalApi'
import { getFinancialProfile } from '@/entities/member/api/financialProfileApi'
import { saveAuthToken } from '@/shared/api/authToken'

vi.mock('@/entities/rental/api/rentalApi', () => ({
  fetchFavoriteRentalNotices: vi.fn().mockResolvedValue([]),
  fetchRentalDetail: vi.fn(),
  toggleFavoriteRentalNotice: vi.fn(),
}))

vi.mock('@/entities/member/api/financialProfileApi', () => ({
  getFinancialProfile: vi.fn(),
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
    localStorage.clear()
    getFinancialProfile.mockResolvedValue(null)
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
    expect(wrapper.get('[data-testid="rental-favorite-toggle"]').text()).toContain('관심중')
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

  it('renders the map from the contract address when there are no supply rows', async () => {
    const mapConstructor = vi.fn()
    const markerConstructor = vi.fn()
    const infoWindowOpen = vi.fn()
    const addressSearch = vi.fn((address, callback) =>
      callback([{ y: '37.5665', x: '126.9780' }], 'OK'),
    )
    window.kakao = {
      maps: {
        load: (callback) => callback(),
        LatLng: vi.fn(function LatLng(latitude, longitude) {
          this.latitude = latitude
          this.longitude = longitude
        }),
        Map: vi.fn(function Map(element, options) {
          mapConstructor(element, options)
          this.setCenter = vi.fn()
          this.setLevel = vi.fn()
        }),
        Marker: vi.fn(function Marker(options) {
          markerConstructor(options)
          this.setMap = vi.fn()
        }),
        InfoWindow: vi.fn(function InfoWindow() {
          this.open = infoWindowOpen
          this.close = vi.fn()
        }),
        services: {
          Status: { OK: 'OK' },
          Geocoder: vi.fn(function Geocoder() {
            return { addressSearch }
          }),
        },
      },
    }
    fetchRentalDetail.mockResolvedValue({
      ...rentalDetail(),
      detail: {
        ...rentalDetail().detail,
        contractAddress: '서울특별시 중구 세종대로 110',
        contractDetailAddress: '서울특별시 중구 세종대로 110',
      },
      supplies: [],
    })

    const { wrapper } = await mountPage()
    await flushPromises()

    expect(addressSearch).toHaveBeenCalledWith(
      '서울특별시 중구 세종대로 110',
      expect.any(Function),
    )
    expect(mapConstructor).toHaveBeenCalled()
    expect(markerConstructor).toHaveBeenCalled()
    expect(infoWindowOpen).toHaveBeenCalled()
    expect(wrapper.text()).not.toContain('좌표를 찾지 못했습니다')
  })

  it('uses the precise map address before combining supply address and lot number', async () => {
    const addressSearch = vi.fn((address, callback) =>
      callback([{ y: '37.4826', x: '126.9413' }], 'OK'),
    )
    window.kakao = {
      maps: {
        load: (callback) => callback(),
        LatLng: vi.fn(function LatLng(latitude, longitude) {
          this.latitude = latitude
          this.longitude = longitude
        }),
        Map: vi.fn(function Map() {
          this.setCenter = vi.fn()
          this.setLevel = vi.fn()
        }),
        Marker: vi.fn(function Marker() {
          this.setMap = vi.fn()
        }),
        InfoWindow: vi.fn(function InfoWindow() {
          this.open = vi.fn()
          this.close = vi.fn()
        }),
        services: {
          Status: { OK: 'OK' },
          Geocoder: vi.fn(function Geocoder() {
            return { addressSearch }
          }),
        },
      },
    }
    fetchRentalDetail.mockResolvedValue({
      ...rentalDetail(),
      supplies: [
        {
          usage: '26A',
          address: '서울특별시 관악구 봉천동',
          lotNumber: '100-1',
          mapAddress: '서울특별시 관악구 봉천동 100-1',
          area: '26.32',
        },
      ],
    })

    await mountPage()
    await flushPromises()

    expect(addressSearch).toHaveBeenCalledWith(
      '서울특별시 관악구 봉천동 100-1',
      expect.any(Function),
    )
    expect(addressSearch).not.toHaveBeenCalledWith(
      '서울특별시 관악구 봉천동 100-1 서울특별시 관악구 봉천동 100-1',
      expect.any(Function),
    )
  })

  it('shows MyData eligibility from the member financial profile when local MyData is empty', async () => {
    saveAuthToken({ accessToken: 'access-token' })
    fetchRentalDetail.mockResolvedValue(rentalDetail())
    getFinancialProfile.mockResolvedValue({
      birthDate: '2000-01-01',
      householdMembers: 1,
      isHomeless: 'yes',
      annualIncome: 2400,
      totalAssets: 3000,
      desiredRegions: ['서울'],
    })

    const { wrapper } = await mountPage()
    await flushPromises()

    expect(getFinancialProfile).toHaveBeenCalled()
    expect(wrapper.text()).toContain('가능성 높음')
  })
})
