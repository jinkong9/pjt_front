import { describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'

import { useMemberStore } from '@/entities/member/model/member'
import LoginPage from './LoginPage.vue'

function createTestRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/login', component: LoginPage },
      { path: '/home', component: { template: '<div>Home</div>' } },
      { path: '/prices', component: { template: '<div>Prices</div>' } },
      { path: '/register', component: { template: '<div>Register</div>' } },
    ],
  })
}

async function mountLogin(initialPath) {
  const pinia = createPinia()
  setActivePinia(pinia)

  const memberStore = useMemberStore()
  memberStore.login = vi.fn().mockResolvedValue({ userId: 'ssafy' })

  const router = createTestRouter()
  await router.push(initialPath)
  await router.isReady()

  const wrapper = mount(LoginPage, {
    global: {
      plugins: [pinia, router],
    },
  })

  await wrapper.find('input[type="email"]').setValue('ssafy@example.com')
  await wrapper.find('input[type="password"]').setValue('password')

  return { memberStore, router, wrapper }
}

describe('LoginPage', () => {
  it('uses dedicated login page style hooks', async () => {
    const { wrapper } = await mountLogin('/login')

    expect(wrapper.find('.login-page').exists()).toBe(true)
    expect(wrapper.find('.login-card').exists()).toBe(true)
    expect(wrapper.find('.login-submit').exists()).toBe(true)
  })

  it('keeps login layout isolated from the shared auth layout classes', async () => {
    const { wrapper } = await mountLogin('/login')

    expect(wrapper.find('main').classes()).toEqual(['login-page'])
    expect(wrapper.find('section').classes()).toEqual(['login-card'])
    expect(wrapper.find('.login-oauth .kakao').classes()).toContain('login-oauth-button')
    expect(wrapper.find('.login-oauth .naver').classes()).toContain('login-oauth-button')
    expect(wrapper.find('.login-oauth .google').classes()).toContain('login-oauth-button')
  })

  it('routes a normal login to home', async () => {
    const { memberStore, router, wrapper } = await mountLogin('/login')

    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(memberStore.login).toHaveBeenCalledWith({
      email: 'ssafy@example.com',
      userId: 'ssafy@example.com',
      password: 'password',
    })
    expect(router.currentRoute.value.fullPath).toBe('/home')
  })

  it('returns to a valid internal redirect after login', async () => {
    const { router, wrapper } = await mountLogin('/login?redirect=%2Fprices%3Fmode%3Dsearch')

    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(router.currentRoute.value.fullPath).toBe('/prices?mode=search')
  })
})
