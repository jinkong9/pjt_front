import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'

import MemberPage from './MemberPage.vue'
import { useMemberStore } from '@/entities/member/model/member'
import { api } from '@/shared/api/client'
import { getFinancialProfile } from '@/entities/member/api/financialProfileApi'
import { fetchFavoriteRentalNotices } from '@/entities/rental/api/rentalApi'
import { fetchFavoriteTransfers } from '@/entities/transfer/api/transferApi'

vi.mock('@/shared/api/client', () => ({
  api: {
    get: vi.fn(() => Promise.resolve({ data: [] })),
    put: vi.fn(),
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

async function mountMemberPage(currentMember = {}) {
  const pinia = createPinia()
  setActivePinia(pinia)
  const memberStore = useMemberStore()
  memberStore.current = {
    userId: 'ssafy',
    name: 'Tester',
    email: 'a@a.com',
    phone: '010',
    rentalNoticeEmailEnabled: false,
    ...currentMember,
  }
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

describe('MemberPage rental notice email consent', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getFinancialProfile.mockResolvedValue(null)
    fetchFavoriteRentalNotices.mockResolvedValue([])
    fetchFavoriteTransfers.mockResolvedValue([])
  })

  it('shows automatic email setting guidance without a manual send button', async () => {
    const wrapper = await mountMemberPage({ rentalNoticeEmailEnabled: false })

    await wrapper.get('[data-testid="favorite-tab-rentals"]').trigger('click')
    await flushPromises()

    expect(wrapper.find('[data-testid="send-rental-favorite-emails"]').exists()).toBe(false)
    expect(wrapper.text()).toContain('마감 3일 이내')
  })

  it('saves rental notice email consent from the member form', async () => {
    api.put.mockResolvedValueOnce({
      data: {
        userId: 'ssafy',
        name: 'Tester',
        email: 'a@a.com',
        phone: '010',
        rentalNoticeEmailEnabled: true,
      },
    })
    const wrapper = await mountMemberPage({ rentalNoticeEmailEnabled: false })

    await wrapper.get('[data-testid="member-rental-email-consent"]').setValue(true)
    await wrapper.get('.auth-form').trigger('submit')
    await flushPromises()

    expect(api.put).toHaveBeenCalledWith('/members/me', expect.objectContaining({
      rentalNoticeEmailEnabled: true,
    }))
  })

  it('changes password from a confirmation dialog', async () => {
    api.put.mockResolvedValue({
      data: {
        userId: 'ssafy',
        name: 'Tester',
        email: 'a@a.com',
        phone: '010',
        rentalNoticeEmailEnabled: false,
      },
    })
    const wrapper = await mountMemberPage()

    await wrapper.get('[data-testid="open-password-dialog"]').trigger('click')
    await wrapper.get('[data-testid="password-new"]').setValue('new-pass-1')
    await wrapper.get('[data-testid="password-confirm"]').setValue('different')
    await wrapper.get('[data-testid="password-dialog-form"]').trigger('submit')
    await flushPromises()

    expect(wrapper.text()).toContain('비밀번호가 일치하지 않습니다.')
    expect(api.put).not.toHaveBeenCalled()

    await wrapper.get('[data-testid="password-confirm"]').setValue('new-pass-1')
    await wrapper.get('[data-testid="password-dialog-form"]').trigger('submit')
    await flushPromises()

    expect(api.put).toHaveBeenCalledWith('/members/me', expect.objectContaining({
      password: 'new-pass-1',
    }))
    expect(wrapper.find('[data-testid="password-dialog"]').exists()).toBe(false)
    expect(wrapper.text()).toContain('비밀번호가 변경되었습니다.')
  })
})
