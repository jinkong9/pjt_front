import { describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import MemberPage from './MemberPage.vue'
import { useMemberStore } from '@/entities/member/model/member'
import { getFinancialProfile } from '@/entities/member/api/financialProfileApi'

vi.mock('@/shared/api/client', () => ({
  api: {
    get: vi.fn(() => Promise.resolve({ data: [] })),
  },
}))

vi.mock('@/entities/member/api/financialProfileApi', () => ({
  getFinancialProfile: vi.fn(),
  saveFinancialProfile: vi.fn(),
}))

describe('MemberPage', () => {
  it('shows the saved financial profile editor', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const memberStore = useMemberStore()
    memberStore.current = { userId: 'ssafy', name: '싸피', email: 'a@a.com', phone: '010' }
    memberStore.loaded = true
    memberStore.fetchMe = vi.fn()
    getFinancialProfile.mockResolvedValue({
      availableAssets: 100000000,
      annualIncome: 80000000,
      monthlySavings: 4000000,
      existingLoanBalance: 0,
      existingMonthlyDebtPayment: 0,
    })
    const router = createRouter({
      history: createWebHistory(),
      routes: [{ path: '/login', component: { template: '<div />' } }],
    })
    await router.push('/')
    await router.isReady()

    const wrapper = mount(MemberPage, { global: { plugins: [pinia, router] } })
    await flushPromises()

    expect(wrapper.text()).toContain('금융 프로필')
    expect(wrapper.text()).toContain('보유자산')
  })
})
