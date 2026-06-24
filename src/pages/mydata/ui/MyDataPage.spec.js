import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'

import MyDataPage from './MyDataPage.vue'
import { useMemberStore } from '@/entities/member/model/member'
import { getFinancialProfile, saveFinancialProfile } from '@/entities/member/api/financialProfileApi'
import { sendRentalRecommendationEmails } from '@/entities/rental/api/rentalApi'

vi.mock('@/entities/member/api/financialProfileApi', () => ({
  getFinancialProfile: vi.fn(),
  saveFinancialProfile: vi.fn(),
}))

vi.mock('@/entities/rental/api/rentalApi', () => ({
  sendRentalRecommendationEmails: vi.fn(),
}))

function router() {
  return createRouter({
    history: createWebHistory(),
    routes: [
      { path: '/mydata', component: MyDataPage },
      { path: '/login', component: { template: '<div />' } },
      { path: '/rentals', component: { template: '<div />' } },
    ],
  })
}

async function mountMyDataPage() {
  const pinia = createPinia()
  setActivePinia(pinia)
  const memberStore = useMemberStore()
  memberStore.current = {
    userId: 'ssafy',
    name: '테스터',
    email: 'ssafy@example.com',
    rentalNoticeEmailEnabled: true,
  }
  memberStore.loaded = true
  memberStore.fetchMe = vi.fn()
  const testRouter = router()
  await testRouter.push('/mydata')
  await testRouter.isReady()

  const wrapper = mount(MyDataPage, {
    global: {
      plugins: [pinia, testRouter],
    },
  })
  await flushPromises()
  return wrapper
}

describe('MyDataPage recommendation email', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    getFinancialProfile.mockResolvedValue(null)
    saveFinancialProfile.mockResolvedValue({
      availableAssets: 80000000,
      annualIncome: 42000000,
      monthlySavings: 1000000,
      existingLoanBalance: 0,
      existingMonthlyDebtPayment: 0,
    })
    sendRentalRecommendationEmails.mockResolvedValue({
      sentCount: 2,
      skippedCount: 0,
      missingMemberCount: 0,
      consentRequiredCount: 0,
    })
  })

  it('sends recommended LH notices by email after saving MyData criteria', async () => {
    const wrapper = await mountMyDataPage()

    await wrapper.get('[data-testid="mydata-field-birthDate"]').setValue('1995-01-01')
    await wrapper.get('[data-testid="mydata-field-householdMembers"]').setValue('2')
    await wrapper.get('[data-testid="mydata-field-isHomeless"]').setValue('yes')
    await wrapper.get('[data-testid="mydata-field-annualIncome"]').setValue('42000000')
    await wrapper.get('[data-testid="mydata-field-totalAssets"]').setValue('90000000')
    await wrapper.get('[data-testid="mydata-field-availableAssets"]').setValue('80000000')
    await wrapper.get('[data-testid="mydata-field-desiredRegion"]').setValue('서울')
    await wrapper.get('[data-testid="mydata-add-region"]').trigger('click')
    await wrapper.get('[data-testid="mydata-rental-type-행복주택"]').trigger('click')
    await wrapper.get('[data-testid="mydata-form"]').trigger('submit')
    await flushPromises()

    expect(saveFinancialProfile).toHaveBeenCalled()
    expect(sendRentalRecommendationEmails.mock.calls[0][0]).toEqual({
      desiredRegions: ['서울'],
      rentalTypes: ['행복주택'],
      limit: 5,
    })
    expect(wrapper.text()).toContain('추천 공고 2건을 메일로 보냈습니다.')
  })
})
