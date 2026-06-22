import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'

import AppNav from './AppNav.vue'
import { useMemberStore } from '@/entities/member/model/member'

describe('AppNav', () => {
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
})
