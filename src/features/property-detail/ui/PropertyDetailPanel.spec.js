import { flushPromises, mount } from '@vue/test-utils'
import { createRouter, createWebHistory } from 'vue-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import PropertyDetailPanel from './PropertyDetailPanel.vue'
import { getFinancialProfile } from '@/entities/member/api/financialProfileApi'
import { analyzePropertyLoan } from '@/entities/loan/api/loanAnalysisApi'
import { api } from '@/shared/api/client'

vi.mock('@/shared/api/client', () => ({
  api: {
    post: vi.fn(() => Promise.resolve({ data: { favorite: true } })),
  },
}))

vi.mock('@/entities/member/api/financialProfileApi', () => ({
  getFinancialProfile: vi.fn(),
  saveFinancialProfile: vi.fn(),
}))

vi.mock('@/entities/loan/api/loanAnalysisApi', () => ({
  analyzePropertyLoan: vi.fn(),
}))

const trade = {
  no: 11,
  aptName: '역삼 하나빌',
  address: '서울특별시 강남구 역삼동 681-26',
  dealAmount: '70,000',
  exclusiveArea: 52.31,
  floor: '7',
  dealDate: '2026-04-28',
  latitude: '37.509',
  longitude: '127.041',
}

function loanAnalysis() {
  return {
    readiness: {
      feasibleNow: true,
      additionalAssetsNeeded: 0,
      monthsToTarget: 0,
      minimumRequiredEquity: 120000000,
    },
    cost: {
      totalRequiredFunds: 700000000,
      availableAssets: 200000000,
    },
    limits: {
      expectedMaximumLoan: 500000000,
    },
    repayment: {
      monthlyPayment: 2450000,
      monthlyCashAfterPayment: 1550000,
    },
    recommendations: [],
    disclaimer: '테스트용 안내',
  }
}

async function mountPanel() {
  const router = createRouter({
    history: createWebHistory(),
    routes: [
      { path: '/prices', component: { template: '<div />' } },
      { path: '/mydata', component: { template: '<div />' } },
      { path: '/analysis', component: { template: '<div />' } },
      { path: '/login', component: { template: '<div />' } },
    ],
  })
  await router.push('/prices')
  await router.isReady()

  return mount(PropertyDetailPanel, {
    props: {
      trade,
      loggedIn: true,
    },
    global: {
      plugins: [router],
      stubs: {
        PropertyNeighborhoodAnalysis: true,
      },
    },
  })
}

describe('PropertyDetailPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('links to mydata when the member has no financial profile', async () => {
    getFinancialProfile.mockRejectedValue({ response: { status: 204 } })
    const wrapper = await mountPanel()

    await wrapper.get('[data-testid="loan-tab"]').trigger('click')
    await flushPromises()

    const link = wrapper.get('[data-testid="mydata-link"]')
    expect(link.text()).toContain('마이데이터 입력하러 가기')
    expect(link.attributes('href')).toBe('/mydata')
    expect(analyzePropertyLoan).not.toHaveBeenCalled()
  })

  it('runs loan analysis immediately when the member has a financial profile', async () => {
    getFinancialProfile.mockResolvedValue({
      availableAssets: 200000000,
      annualIncome: 80000000,
      monthlySavings: 4000000,
      existingLoanBalance: 0,
      existingMonthlyDebtPayment: 0,
    })
    analyzePropertyLoan.mockResolvedValue(loanAnalysis())
    const wrapper = await mountPanel()

    await wrapper.get('[data-testid="loan-tab"]').trigger('click')
    await flushPromises()

    expect(analyzePropertyLoan).toHaveBeenCalledWith({
      dealNo: 11,
      years: 30,
      rate: 4.2,
      repaymentType: 'EQUAL_PAYMENT',
    })
    expect(wrapper.text()).toContain('245만원')
  })
  it('keeps the favorite action visible in the detail header after switching tabs', async () => {
    getFinancialProfile.mockResolvedValue({
      availableAssets: 200000000,
      annualIncome: 80000000,
      monthlySavings: 4000000,
      existingLoanBalance: 0,
      existingMonthlyDebtPayment: 0,
    })
    analyzePropertyLoan.mockResolvedValue(loanAnalysis())
    const wrapper = await mountPanel()

    expect(wrapper.get('[data-testid="property-favorite-toggle"]').text()).toContain('관심')

    await wrapper.get('[data-testid="loan-tab"]').trigger('click')
    await flushPromises()
    await wrapper.get('[data-testid="property-favorite-toggle"]').trigger('click')
    await flushPromises()

    expect(api.post).toHaveBeenCalledWith('/favorites/11/toggle')
    expect(wrapper.get('[data-testid="property-favorite-toggle"]').text()).toContain('해제')
  })
})
