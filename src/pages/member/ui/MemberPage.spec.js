import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'

import MemberPage from './MemberPage.vue'
import { useMemberStore } from '@/entities/member/model/member'
import { getFinancialProfile, saveFinancialProfile } from '@/entities/member/api/financialProfileApi'
import {
  fetchFavoriteRentalNotices,
  sendRentalRecommendationEmails,
  toggleFavoriteRentalNotice,
} from '@/entities/rental/api/rentalApi'
import { fetchFavoriteTransfers } from '@/entities/transfer/api/transferApi'

vi.mock('@/shared/api/client', () => ({
  api: {
    get: vi.fn(() =>
      Promise.resolve({
        data: [
          {
            no: 1,
            aptName: '일성아파트',
            address: '서울특별시 강남구 일성동',
            dealAmount: '70000',
          },
        ],
      }),
    ),
  },
}))

vi.mock('@/entities/member/api/financialProfileApi', () => ({
  getFinancialProfile: vi.fn(),
  saveFinancialProfile: vi.fn(),
}))

vi.mock('@/entities/rental/api/rentalApi', () => ({
  fetchFavoriteRentalNotices: vi.fn(),
  sendRentalRecommendationEmails: vi.fn(),
  toggleFavoriteRentalNotice: vi.fn(),
}))

vi.mock('@/entities/transfer/api/transferApi', () => ({
  fetchFavoriteTransfers: vi.fn(),
}))

async function mountMemberPage() {
  const pinia = createPinia()
  setActivePinia(pinia)
  const memberStore = useMemberStore()
  memberStore.current = { userId: 'ssafy', name: '테스터', email: 'a@a.com', phone: '010' }
  memberStore.loaded = true
  memberStore.fetchMe = vi.fn()
  const router = createRouter({
    history: createWebHistory(),
    routes: [
      { path: '/', component: { template: '<div />' } },
      { path: '/login', component: { template: '<div />' } },
      { path: '/prices', component: { template: '<div />' } },
      { path: '/rentals/:noticeId', component: { template: '<div />' } },
      { path: '/transfers/:transferId', component: { template: '<div />' } },
    ],
  })
  await router.push('/')
  await router.isReady()

  const wrapper = mount(MemberPage, { global: { plugins: [pinia, router] } })
  await flushPromises()
  return wrapper
}

async function mountLoggedOutMemberPage() {
  const pinia = createPinia()
  setActivePinia(pinia)
  const memberStore = useMemberStore()
  memberStore.current = null
  memberStore.loaded = true
  memberStore.fetchMe = vi.fn()
  const router = createRouter({
    history: createWebHistory(),
    routes: [
      { path: '/login', component: { template: '<div />' } },
      { path: '/', component: { template: '<div />' } },
    ],
  })
  await router.push('/')
  await router.isReady()

  const wrapper = mount(MemberPage, { global: { plugins: [pinia, router] } })
  await flushPromises()
  return { wrapper, router }
}

describe('MemberPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    fetchFavoriteTransfers.mockResolvedValue([])
    sendRentalRecommendationEmails.mockResolvedValue({
      sentCount: 0,
      skippedCount: 0,
      missingMemberCount: 0,
      consentRequiredCount: 0,
    })
  })

  it('alerts and redirects to login instead of rendering the logged-out member panel', async () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {})

    const { wrapper, router } = await mountLoggedOutMemberPage()

    expect(alertSpy).toHaveBeenCalledWith('로그인이 필요합니다.')
    expect(router.currentRoute.value.path).toBe('/login')
    expect(wrapper.text()).not.toContain('로그인이 필요합니다.')
  })

  it('shows the saved financial profile editor and default deal favorites', async () => {
    getFinancialProfile.mockResolvedValue({
      availableAssets: 100000000,
      annualIncome: 80000000,
      monthlySavings: 4000000,
      existingLoanBalance: 0,
      existingMonthlyDebtPayment: 0,
    })
    fetchFavoriteRentalNotices.mockResolvedValue([])
    fetchFavoriteTransfers.mockResolvedValue([])

    const wrapper = await mountMemberPage()

    expect(wrapper.get('[data-testid="financial-field-availableAssets"]').element.value).toBe(
      '100,000,000',
    )
    expect(wrapper.get('[data-testid="mydata-field-householdMembers"]').exists()).toBe(true)
    expect(wrapper.get('[data-testid="mydata-field-isHomeless"]').exists()).toBe(true)
    expect(wrapper.get('[data-testid="mydata-field-desiredRegion"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('LH')
    expect(wrapper.text()).toContain('7억')

    await wrapper.get('[data-testid="favorite-tab-transfers"]').trigger('click')
    expect(wrapper.text()).toContain('관심')
  })

  it('saves backend financial fields and local LH recommendation profile from the large form', async () => {
    getFinancialProfile.mockResolvedValue({
      availableAssets: 30000000,
      annualIncome: 50000000,
      monthlySavings: 1200000,
      existingLoanBalance: 0,
      existingMonthlyDebtPayment: 0,
    })
    saveFinancialProfile.mockResolvedValue({
      availableAssets: 30000000,
      annualIncome: 50000000,
      monthlySavings: 1200000,
      existingLoanBalance: 0,
      existingMonthlyDebtPayment: 0,
    })
    fetchFavoriteRentalNotices.mockResolvedValue([])

    const wrapper = await mountMemberPage()

    await wrapper.get('[data-testid="mydata-field-householdMembers"]').setValue('2')
    await wrapper.get('[data-testid="mydata-field-isHomeless"]').setValue('yes')
    await wrapper.get('[data-testid="mydata-field-desiredRegion"]').setValue('서울')
    await wrapper.get('[data-testid="mydata-add-region"]').trigger('click')
    await wrapper.get('[data-testid="mydata-rental-type-행복주택"]').trigger('click')
    await wrapper.get('[data-testid="financial-profile-form"]').trigger('submit')
    await flushPromises()

    expect(saveFinancialProfile).toHaveBeenCalledWith({
      availableAssets: 30000000,
      annualIncome: 50000000,
      monthlySavings: 1200000,
      existingLoanBalance: 0,
      existingMonthlyDebtPayment: 0,
    })
    expect(sendRentalRecommendationEmails).toHaveBeenCalled()
    expect(sendRentalRecommendationEmails.mock.calls[0][0]).toEqual({
      desiredRegions: ['서울'],
      rentalTypes: ['행복주택'],
      limit: 5,
    })
    expect(JSON.parse(localStorage.getItem('happyhome.mydata.profile'))).toMatchObject({
      householdMembers: 2,
      isHomeless: 'yes',
      desiredRegions: ['서울'],
      rentalTypes: ['행복주택'],
    })
  })

  it('loads transfer favorites and links favorites to detail screens', async () => {
    getFinancialProfile.mockResolvedValue(null)
    fetchFavoriteRentalNotices.mockResolvedValue([])
    fetchFavoriteTransfers.mockResolvedValue([
      {
        transferId: 7,
        title: '강남 원룸 양도',
        address: '서울 강남구',
        depositAmount: 10000,
        monthlyRentAmount: 3000,
        transferFee: 35000,
      },
    ])

    const wrapper = await mountMemberPage()

    const dealLink = wrapper.get('[data-testid="favorite-deal-detail-1"]')
    expect(dealLink.attributes('href')).toContain('/prices')
    expect(wrapper.text()).toContain('7억')

    await wrapper.get('[data-testid="favorite-tab-transfers"]').trigger('click')
    await flushPromises()

    expect(fetchFavoriteTransfers).toHaveBeenCalled()
    expect(wrapper.text()).toContain('강남 원룸 양도')
    expect(wrapper.text()).toContain('보증금 1억')
    expect(wrapper.text()).toContain('월세 3,000만원')
    expect(wrapper.text()).toContain('양도비 3.5억')
    expect(wrapper.get('[data-testid="favorite-transfer-detail-7"]').attributes('href')).toBe(
      '/transfers/7',
    )
  })

  it('renders LH favorite notices and removes a notice after toggling', async () => {
    getFinancialProfile.mockResolvedValue(null)
    fetchFavoriteRentalNotices.mockResolvedValue([
      {
        notice: {
          rentalNoticeId: 'LH-FAV-1',
          title: '서울 행복주택',
          regionName: '서울',
          status: '접수예정',
          applicationPeriod: '2026-06-01 ~ 2026-06-10',
        },
      },
    ])
    toggleFavoriteRentalNotice.mockResolvedValue({ favorite: false })

    const wrapper = await mountMemberPage()
    await wrapper.get('[data-testid="favorite-tab-rentals"]').trigger('click')
    await flushPromises()

    expect(fetchFavoriteRentalNotices).toHaveBeenCalled()
    expect(wrapper.text()).toContain('서울 행복주택')
    expect(wrapper.text()).toContain('2026-06-01 ~ 2026-06-10')
    expect(wrapper.get('[data-testid="remove-rental-favorite-LH-FAV-1"]').classes()).toContain(
      'border-[#b4212a]',
    )
    expect(wrapper.get('[data-testid="remove-rental-favorite-LH-FAV-1"]').classes()).toContain(
      'bg-white',
    )

    await wrapper.get('[data-testid="remove-rental-favorite-LH-FAV-1"]').trigger('click')
    await flushPromises()

    expect(toggleFavoriteRentalNotice).toHaveBeenCalledWith('LH-FAV-1')
    expect(wrapper.text()).not.toContain('서울 행복주택')
  })

  it('shows automatic LH email guidance instead of a manual send action', async () => {
    getFinancialProfile.mockResolvedValue(null)
    fetchFavoriteRentalNotices.mockResolvedValue([])

    const wrapper = await mountMemberPage()
    await wrapper.get('[data-testid="favorite-tab-rentals"]').trigger('click')
    await flushPromises()

    expect(wrapper.find('[data-testid="send-rental-favorite-emails"]').exists()).toBe(false)
    expect(wrapper.text()).toContain('마감 3일 이내')
    expect(wrapper.text()).toContain('하루에 한 번 자동')
  })
})
