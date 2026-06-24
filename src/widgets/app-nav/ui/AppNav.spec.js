import { afterEach, describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'

import AppNav from './AppNav.vue'
import { useMemberStore } from '@/entities/member/model/member'
import { clearAuthToken, saveAuthToken } from '@/shared/api/authToken'

describe('AppNav', () => {
  afterEach(() => {
    clearAuthToken()
    localStorage.clear()
  })

  it('uses the main navigation layout on the LH calendar page', async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/home', name: 'home', component: { template: '<div />' } },
        { path: '/lh-calendar', name: 'lh-calendar', component: { template: '<div />' } },
      ],
    })
    await router.push('/lh-calendar')
    await router.isReady()

    const pinia = createPinia()
    const memberStore = useMemberStore(pinia)
    memberStore.loaded = true

    const wrapper = mount(AppNav, {
      global: {
        plugins: [router, pinia],
      },
    })

    expect(wrapper.find('.nav').exists()).toBe(true)
    expect(wrapper.find('.brand-mark').text()).toBe('HOME')
    expect(wrapper.find('.menu-toggle').exists()).toBe(true)
  })

  it('uses the main navigation layout on the notices page', async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/home', name: 'home', component: { template: '<div />' } },
        { path: '/notices', name: 'notices', component: { template: '<div />' } },
      ],
    })
    await router.push('/notices')
    await router.isReady()

    const pinia = createPinia()
    const memberStore = useMemberStore(pinia)
    memberStore.loaded = true

    const wrapper = mount(AppNav, {
      global: {
        plugins: [router, pinia],
      },
    })

    expect(wrapper.find('.nav').exists()).toBe(true)
    expect(wrapper.find('.brand-mark').text()).toBe('HOME')
    expect(wrapper.find('.menu-toggle').exists()).toBe(true)
  })

  it('shows login instead of logout when member data exists without an auth token', async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/home', name: 'home', component: { template: '<div />' } }],
    })
    await router.push('/home')
    await router.isReady()

    const pinia = createPinia()
    const memberStore = useMemberStore(pinia)
    memberStore.loaded = true
    memberStore.current = { name: '테스터' }

    const wrapper = mount(AppNav, {
      global: {
        plugins: [router, pinia],
      },
    })

    expect(wrapper.find('button.nav-login-link').exists()).toBe(false)
    expect(wrapper.find('a.nav-login-link').exists()).toBe(true)
  })

  it('shows my info and logout when member data and an auth token both exist', async () => {
    saveAuthToken({ accessToken: 'token' })
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/home', name: 'home', component: { template: '<div />' } },
        { path: '/member', name: 'member', component: { template: '<div />' } },
      ],
    })
    await router.push('/home')
    await router.isReady()

    const pinia = createPinia()
    const memberStore = useMemberStore(pinia)
    memberStore.loaded = true
    memberStore.current = { name: '테스터' }

    const wrapper = mount(AppNav, {
      global: {
        plugins: [router, pinia],
      },
    })

    expect(wrapper.find('button.nav-login-link').exists()).toBe(true)
    expect(wrapper.find('a.nav-login-link[href="/member"]').text()).toBe('나의 정보')
  })
})
