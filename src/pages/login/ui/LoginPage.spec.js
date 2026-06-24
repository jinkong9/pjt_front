import { describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'

import { useMemberStore } from '@/entities/member/model/member'
import LoginPage from './LoginPage.vue'

vi.mock('@/shared/api/authToken', () => ({
  saveAuthToken: vi.fn(),
}))

import { saveAuthToken } from '@/shared/api/authToken'

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
  memberStore.fetchMe = vi.fn().mockResolvedValue()

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
      'grid-cols-[minmax(0,1.04fr)_minmax(360px,0.96fr)]',
    )
    expect(wrapper.get('[data-testid="login-card"]').classes()).toContain(
      'w-[min(1120px,calc(100vw-48px))]',
    )
    expect(wrapper.find('button[type="submit"]').classes()).toContain('min-h-[54px]')
  })

  it('stacks official social login buttons as three full-width rows', async () => {
    const { wrapper } = await mountLogin('/login')

    expect(wrapper.get('[data-testid="oauth-list"]').classes()).toContain('grid-cols-1')
    expect(wrapper.get('[data-testid="oauth-kakao"]').classes()).toContain('min-h-[54px]')
    expect(wrapper.get('[data-testid="oauth-naver"]').classes()).toContain('min-h-[54px]')
    expect(wrapper.get('[data-testid="oauth-google"]').classes()).toContain('min-h-[54px]')
    expect(wrapper.get('[data-testid="oauth-kakao"]').classes()).toContain(
      'grid-cols-[56px_minmax(0,1fr)_56px]',
    )
    expect(wrapper.get('[data-testid="oauth-kakao"] .oauth-label').text()).toBe('카카오 로그인')
    expect(wrapper.get('[data-testid="oauth-naver"] .oauth-label').text()).toBe('네이버 로그인')
    expect(wrapper.get('[data-testid="oauth-google"] .oauth-label').text()).toBe('Google 로그인')
    expect(wrapper.find('[data-testid="oauth-kakao"] .oauth-icon-kakao').exists()).toBe(true)
    expect(wrapper.get('[data-testid="oauth-naver"] .oauth-icon-naver').text()).toBe('N')
    expect(wrapper.find('[data-testid="oauth-google"] .oauth-icon-google').exists()).toBe(true)
  })

  it('keeps login layout isolated from the shared auth layout classes', async () => {
    const { wrapper } = await mountLogin('/login')

    expect(wrapper.find('main').classes()).not.toContain('auth-page')
    expect(wrapper.get('[data-testid="login-card"]').classes()).not.toContain('auth-card')
    expect(wrapper.get('[data-testid="oauth-kakao"]').attributes('title')).toBe(
      '카카오 계정으로 로그인',
    )
    expect(wrapper.get('[data-testid="oauth-naver"]').attributes('title')).toBe(
      '네이버 계정으로 로그인',
    )
    expect(wrapper.get('[data-testid="oauth-google"]').attributes('title')).toBe(
      '구글 계정으로 로그인',
    )
  })

  it('links social login buttons to backend oauth redirects with the safe return path', async () => {
    const { wrapper } = await mountLogin('/login?redirect=%2Fprices%3Fmode%3Dsearch')

    const kakaoHref = wrapper.get('[data-testid="oauth-kakao"]').attributes('href')

    expect(kakaoHref).toContain('/api/oauth/redirect/kakao?redirect=')
    expect(decodeURIComponent(decodeURIComponent(kakaoHref))).toContain('/prices?mode=search')
  })

  it('explains when a social provider is not configured yet', async () => {
    const { wrapper } = await mountLogin('/login?oauthSetup=kakao')

    expect(wrapper.text()).toContain('KAKAO 로그인 설정이 아직 완료되지 않았습니다')
  })

  it('stores oauth jwt tokens from the callback url and removes them from the address', async () => {
    const { memberStore, router } = await mountLogin(
      '/login?oauth=success&grantType=Bearer&accessToken=access-token&refreshToken=refresh-token&redirect=%2Fprices%3Fmode%3Dsearch',
    )
    await flushPromises()

    expect(saveAuthToken).toHaveBeenCalledWith({
      grantType: 'Bearer',
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    })
    expect(memberStore.fetchMe).toHaveBeenCalled()
    expect(router.currentRoute.value.fullPath).toBe('/prices?mode=search')
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
