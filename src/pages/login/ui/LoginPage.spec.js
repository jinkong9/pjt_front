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
  it('uses Tailwind-only login page layout classes', async () => {
    const { wrapper } = await mountLogin('/login')

    expect(wrapper.find('main').classes()).toContain('min-h-[calc(100svh-80px)]')
    expect(wrapper.get('[data-testid="login-card"]').classes()).toContain(
      'grid-cols-[minmax(0,1fr)_minmax(360px,0.95fr)]',
    )
    expect(wrapper.find('button[type="submit"]').classes()).toContain('min-h-[52px]')
  })

  it('keeps login layout isolated from the shared auth layout classes', async () => {
    const { wrapper } = await mountLogin('/login')

    expect(wrapper.find('main').classes()).not.toContain('auth-page')
    expect(wrapper.get('[data-testid="login-card"]').classes()).not.toContain('auth-card')
    expect(wrapper.get('[data-testid="oauth-kakao"]').classes()).toContain('bg-[#fee500]')
    expect(wrapper.get('[data-testid="oauth-naver"]').classes()).toContain('bg-[#03c75a]')
    expect(wrapper.get('[data-testid="oauth-google"]').classes()).toContain('bg-white')
  })

  it('links social login buttons to backend oauth redirects with the safe return path', async () => {
    const { wrapper } = await mountLogin('/login?redirect=%2Fprices%3Fmode%3Dsearch')

    const kakaoHref = wrapper.get('[data-testid="oauth-kakao"]').attributes('href')

    expect(kakaoHref).toContain('/api/oauth/redirect/kakao?redirect=')
    expect(decodeURIComponent(kakaoHref)).toContain('/prices?mode=search')
  })

  it('explains when a social provider is not configured yet', async () => {
    const { wrapper } = await mountLogin('/login?oauthSetup=kakao')

    expect(wrapper.text()).toContain('KAKAO 로그인 설정이 아직 완료되지 않았습니다')
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
