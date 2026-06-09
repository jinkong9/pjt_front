import { describe, expect, it } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia } from 'pinia'

import App from '@/app/App.vue'
import router from '@/app/router'

describe('App', () => {
  it('renders the application navigation', async () => {
    router.push('/home')
    await router.isReady()

    const wrapper = mount(App, {
      global: {
        plugins: [router, createPinia()],
      },
    })

    expect(wrapper.text()).toContain('SSAFY Home')
    expect(wrapper.text()).toContain('부동산 시세')
    expect(wrapper.text()).toContain('양도 게시판')
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
    expect(wrapper.find('.sidebar-drawer').text()).toContain('LH 캘린더')
    expect(wrapper.find('.sidebar-drawer').text()).toContain('생활권 분석')
  })

  it('registers transfer board and LH calendar routes', () => {
    expect(router.resolve('/transfers').name).toBe('transfers')
    expect(router.resolve('/transfers/1').name).toBe('transfer-detail')
    expect(router.resolve('/transfers/new').name).toBe('transfer-create')
    expect(router.resolve('/transfers/1/edit').name).toBe('transfer-edit')
    expect(router.resolve('/lh-calendar').name).toBe('lh-calendar')
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

  it('shows public rental notices as a slider on the second home section', async () => {
    router.push('/home')
    await router.isReady()

    const wrapper = mount(App, {
      global: {
        plugins: [router, createPinia()],
      },
    })

    await flushPromises()

    expect(wrapper.find('.rental-slider-shell').exists()).toBe(true)
    expect(wrapper.findAll('.rental-slide-card').length).toBeGreaterThanOrEqual(3)
    expect(wrapper.find('.rental-window-prev').exists()).toBe(true)
    expect(wrapper.find('.rental-window-next').exists()).toBe(true)
    expect(wrapper.text()).toContain('LH 공고')
  })
})

