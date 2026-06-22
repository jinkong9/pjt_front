import { describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import MemberPage from './MemberPage.vue'
import { useMemberStore } from '@/entities/member/model/member'
import { getFinancialProfile } from '@/entities/member/api/financialProfileApi'

vi.mock('@/shared/api/client', () => ({
  api: {
    get: vi.fn(() =>
      Promise.resolve({
        data: [
          {
            no: 1,
            aptName: '역삼동하나빌',
            address: '서울특별시 강남구 역삼동 681-26',
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
    expect(wrapper.get('[data-testid="financial-field-availableAssets"]').element.value).toBe(
      '100,000,000',
    )
    expect(wrapper.text()).toContain('관심 목록')
    expect(wrapper.text()).toContain('실거래')
    expect(wrapper.text()).toContain('양도')
    expect(wrapper.text()).toContain('LH')
    expect(wrapper.text()).toContain('70,000만원')

    await wrapper.get('[data-testid="favorite-tab-transfers"]').trigger('click')
    expect(wrapper.text()).toContain('저장한 관심 양도글이 없습니다.')
  })
})
