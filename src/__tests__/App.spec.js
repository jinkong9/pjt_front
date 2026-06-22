import { afterEach, describe, expect, it } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia } from 'pinia'

import App from '@/app/App.vue'
import router from '@/app/router'
import { useMemberStore } from '@/entities/member/model/member'
import { clearAuthToken, saveAuthToken } from '@/shared/api/authToken'

describe('App', () => {
  afterEach(() => {
    clearAuthToken()
    localStorage.clear()
  })

  it('renders the application navigation', async () => {
    router.push('/home')
    await router.isReady()

    const wrapper = mount(App, {
      global: {
        plugins: [router, createPinia()],
      },
    })

    expect(wrapper.text()).toContain('SSAFY Home')
    expect(wrapper.find('.nav-links').text()).toContain('로그인')
    expect(wrapper.find('.nav-links').text()).not.toContain('부동산 시세')
    expect(wrapper.find('.nav-links').text()).not.toContain('양도 게시판')
    expect(wrapper.find('.sidebar-drawer').exists()).toBe(false)
    expect(wrapper.find('.menu-toggle').exists()).toBe(true)
    expect(wrapper.text()).toContain('FIND YOUR HOME')
    expect(wrapper.text()).toContain('공공임대 일정')
    expect(wrapper.text()).toContain('양도 게시판')
  })

  it('opens hidden sidebar navigation from the menu button', async () => {
    router.push('/home')
    await router.isReady()

    const wrapper = mount(App, {
      global: {
        plugins: [router, createPinia()],
      },
    })

    await wrapper.find('.menu-toggle').trigger('click')

    expect(wrapper.find('.sidebar-drawer').exists()).toBe(true)
    expect(wrapper.find('.sidebar-drawer').text()).toContain('부동산 시세')
    expect(wrapper.find('.sidebar-drawer').text()).toContain('공공임대')
    expect(wrapper.find('.sidebar-drawer').text()).toContain('양도 게시판')
    expect(wrapper.find('.sidebar-drawer').text()).toContain('LH 캘린더')
    expect(wrapper.find('.sidebar-drawer').text()).toContain('생활권 분석')
  })

  it('shows logout in the top nav when logged in', async () => {
    await router.push('/home')
    await router.isReady()

    const pinia = createPinia()
    const memberStore = useMemberStore(pinia)
    memberStore.current = { userId: 'ssafy', name: '싸피' }
    memberStore.loaded = true
    saveAuthToken({ accessToken: 'token' })

    const wrapper = mount(App, {
      global: {
        plugins: [router, pinia],
      },
    })

    expect(wrapper.find('.nav-links').text()).toContain('로그아웃')
    expect(wrapper.find('.nav-links').text()).not.toContain('로그인')
  })

  it('registers transfer board and LH calendar routes', () => {
    expect(router.resolve('/transfers').name).toBe('transfers')
    expect(router.resolve('/transfers/1').name).toBe('transfer-detail')
    expect(router.resolve('/transfers/new').name).toBe('transfer-create')
    expect(router.resolve('/transfers/1/edit').name).toBe('transfer-edit')
    expect(router.resolve('/lh-calendar').name).toBe('lh-calendar')
    expect(router.resolve('/mydata').name).toBe('mydata')
  })

  it('uses full-page scroll sections on the home page', async () => {
    router.push('/home')
    await router.isReady()

    const wrapper = mount(App, {
      global: {
        plugins: [router, createPinia()],
      },
    })

    expect(wrapper.find('.home-hero').exists()).toBe(true)
    expect(wrapper.find('.fullpage-scroll').exists()).toBe(true)
    expect(wrapper.findAll('.fullpage-section').length).toBeGreaterThanOrEqual(3)
    expect(wrapper.findAll('.fullpage-reveal').length).toBeGreaterThanOrEqual(3)
    expect(wrapper.find('.home-bottom-sheets').exists()).toBe(false)
  })

  it('does not show sample rental notices when backend data is unavailable', async () => {
    router.push('/home')
    await router.isReady()

    const wrapper = mount(App, {
      global: {
        plugins: [router, createPinia()],
      },
    })

    await flushPromises()

    expect(wrapper.find('.rental-slider-shell').exists()).toBe(false)
    expect(wrapper.findAll('.rental-slide-card')).toHaveLength(0)
    expect(wrapper.text()).toContain('LH 공고')
  })

  it('renders login and register as form-only pages', async () => {
    await router.push('/login')
    await router.isReady()

    const loginWrapper = mount(App, {
      global: {
        plugins: [router, createPinia()],
      },
    })

    expect(loginWrapper.find('.auth-visual').exists()).toBe(false)
    expect(loginWrapper.get('[data-testid="login-card"]').classes()).toContain(
      'grid-cols-[minmax(0,1fr)_minmax(360px,0.95fr)]',
    )
    expect(loginWrapper.text()).toContain('Welcome Back')
    expect(loginWrapper.text()).toContain('이메일')
    expect(loginWrapper.text()).toContain('Social Login')
    expect(loginWrapper.text()).not.toContain('OAuth 로그인')

    await router.push('/register')
    await router.isReady()

    const registerWrapper = mount(App, {
      global: {
        plugins: [router, createPinia()],
      },
    })

    expect(registerWrapper.find('.auth-visual').exists()).toBe(false)
    expect(registerWrapper.get('[data-testid="register-card"]').classes()).toContain(
      'grid-cols-[minmax(0,1.04fr)_minmax(360px,0.96fr)]',
    )
    expect(registerWrapper.text()).toContain('Join SSAFY Home')
    expect(registerWrapper.text()).not.toContain('아이디')
    expect(registerWrapper.text()).toContain('비밀번호 확인')
  })

  it('renders analysis as an easy guided form', async () => {
    await router.push('/analysis')
    await router.isReady()

    const wrapper = mount(App, {
      global: {
        plugins: [router, createPinia()],
      },
    })

    expect(wrapper.find('.analysis-quick-form').exists()).toBe(true)
    expect(wrapper.find('.analysis-presets').exists()).toBe(true)
    expect(wrapper.text()).toContain('동네 이름')
    expect(wrapper.text()).toContain('고급 좌표 설정')
  })
})
