import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'

import RegisterPage from './RegisterPage.vue'
import { api } from '@/shared/api/client'

vi.mock('@/shared/api/client', () => ({
  api: {
    post: vi.fn(),
  },
}))

async function mountRegisterPage() {
  const pinia = createPinia()
  setActivePinia(pinia)
  const router = createRouter({
    history: createWebHistory(),
    routes: [
      { path: '/login', component: { template: '<div />' } },
      { path: '/home', component: { template: '<div />' } },
      { path: '/register', component: RegisterPage },
    ],
  })
  await router.push('/register')
  await router.isReady()

  return mount(RegisterPage, { global: { plugins: [pinia, router] } })
}

describe('RegisterPage email consent', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('registers with rental notice email consent disabled by default', async () => {
    api.post.mockResolvedValueOnce({ data: { userId: 'test@example.com' } })
    const wrapper = await mountRegisterPage()

    expect(wrapper.get('[data-testid="register-rental-email-consent"]').element.checked).toBe(false)

    await wrapper.get('[data-testid="register-name"]').setValue('Tester')
    await wrapper.get('[data-testid="register-email"]').setValue('test@example.com')
    await wrapper.get('[data-testid="register-password"]').setValue('1234')
    await wrapper.get('[data-testid="register-password-confirm"]').setValue('1234')
    await wrapper.get('[data-testid="register-phone"]').setValue('010-0000-0000')
    await wrapper.get('form').trigger('submit')
    await flushPromises()

    expect(api.post).toHaveBeenCalledWith('/members/register', {
      userId: 'test@example.com',
      email: 'test@example.com',
      password: '1234',
      name: 'Tester',
      phone: '010-0000-0000',
      rentalNoticeEmailEnabled: false,
    })
  })

  it('registers with rental notice email consent when the user checks it', async () => {
    api.post.mockResolvedValueOnce({ data: { userId: 'test@example.com' } })
    const wrapper = await mountRegisterPage()

    await wrapper.get('[data-testid="register-rental-email-consent"]').setValue(true)
    await wrapper.get('[data-testid="register-name"]').setValue('Tester')
    await wrapper.get('[data-testid="register-email"]').setValue('test@example.com')
    await wrapper.get('[data-testid="register-password"]').setValue('1234')
    await wrapper.get('[data-testid="register-password-confirm"]').setValue('1234')
    await wrapper.get('[data-testid="register-phone"]').setValue('010-0000-0000')
    await wrapper.get('form').trigger('submit')
    await flushPromises()

    expect(api.post).toHaveBeenCalledWith('/members/register', expect.objectContaining({
      rentalNoticeEmailEnabled: true,
    }))
  })
})
