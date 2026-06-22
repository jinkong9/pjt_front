import { describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'

import MemberPage from './MemberPage.vue'
import { useMemberStore } from '@/entities/member/model/member'
import { getFinancialProfile } from '@/entities/member/api/financialProfileApi'
import {
  fetchFavoriteRentalNotices,
  sendFavoriteRentalNoticeEmails,
  toggleFavoriteRentalNotice,
} from '@/entities/rental/api/rentalApi'

vi.mock('@/shared/api/client', () => ({
  api: {
    get: vi.fn(() =>
      Promise.resolve({
        data: [
          {
            no: 1,
            aptName: '삼성힐스테이트',
            address: '서울특별시 강남구 삼성동',
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
  sendFavoriteRentalNoticeEmails: vi.fn(),
  toggleFavoriteRentalNotice: vi.fn(),
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
      { path: '/login', component: { template: '<div />' } },
      { path: '/rentals/:noticeId', component: { template: '<div />' } },
    ],
  })
  await router.push('/')
  await router.isReady()

  const wrapper = mount(MemberPage, { global: { plugins: [pinia, router] } })
  await flushPromises()
  return wrapper
}

describe('MemberPage', () => {
  it('shows the saved financial profile editor and default deal favorites', async () => {
    getFinancialProfile.mockResolvedValue({
      availableAssets: 100000000,
      annualIncome: 80000000,
      monthlySavings: 4000000,
      existingLoanBalance: 0,
      existingMonthlyDebtPayment: 0,
    })
    fetchFavoriteRentalNotices.mockResolvedValue([])

    const wrapper = await mountMemberPage()

    expect(wrapper.get('[data-testid="financial-field-availableAssets"]').element.value).toBe(
      '100,000,000',
    )
    expect(wrapper.text()).toContain('LH')
    expect(wrapper.text()).toContain('70,000')

    await wrapper.get('[data-testid="favorite-tab-transfers"]').trigger('click')
    expect(wrapper.text()).toContain('관심')
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

    await wrapper.get('[data-testid="remove-rental-favorite-LH-FAV-1"]').trigger('click')
    await flushPromises()

    expect(toggleFavoriteRentalNotice).toHaveBeenCalledWith('LH-FAV-1')
    expect(wrapper.text()).not.toContain('서울 행복주택')
  })

  it('shows a result message after sending LH favorite email alerts', async () => {
    getFinancialProfile.mockResolvedValue(null)
    fetchFavoriteRentalNotices.mockResolvedValue([])
    sendFavoriteRentalNoticeEmails.mockResolvedValue({
      sentCount: 1,
      skippedCount: 2,
      missingMemberCount: 0,
    })

    const wrapper = await mountMemberPage()
    await wrapper.get('[data-testid="favorite-tab-rentals"]').trigger('click')
    await wrapper.get('[data-testid="send-rental-favorite-emails"]').trigger('click')
    await flushPromises()

    expect(sendFavoriteRentalNoticeEmails).toHaveBeenCalled()
    expect(wrapper.text()).toContain('1건의 LH 관심 공고 알림을 발송했습니다.')
    expect(wrapper.text()).toContain('보류 2건')
    expect(wrapper.text()).toContain('이메일 없음 0건')
  })
})
