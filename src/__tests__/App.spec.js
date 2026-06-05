import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
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
    expect(wrapper.text()).toContain('LH 캘린더')
  })

  it('registers transfer board and LH calendar routes', () => {
    expect(router.resolve('/transfers').name).toBe('transfers')
    expect(router.resolve('/transfers/1').name).toBe('transfer-detail')
    expect(router.resolve('/lh-calendar').name).toBe('lh-calendar')
  })
})

