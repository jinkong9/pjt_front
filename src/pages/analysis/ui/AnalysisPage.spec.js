import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'

import AnalysisPage from './AnalysisPage.vue'
import { api } from '@/shared/api/client'

vi.mock('@/shared/api/client', () => ({
  api: {
    get: vi.fn(),
  },
}))

vi.mock('vue-router', () => ({
  useRoute: () => ({
    query: {
      label: '서울특별시 강남구 테헤란로 339',
      latitude: '37.497952',
      longitude: '127.027619',
      radius: '1000',
    },
  }),
}))

const analysis = {
  radiusMeters: 1000,
  places: [
    {
      name: '렌즈커뮤니케이션즈',
      largeCategory: '시설관리·임대',
      middleCategory: '산업용품 대여',
      address: '서울특별시 강남구 논현로 651',
    },
    {
      name: '케이컴',
      largeCategory: '과학·기술',
      middleCategory: '광고',
      address: '서울특별시 강남구 논현로 641',
    },
    {
      name: '강남 카페',
      largeCategory: '카페',
      middleCategory: '커피전문점',
      address: '서울특별시 강남구 논현로 650',
    },
  ],
}

describe('AnalysisPage nearby facilities', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    api.get.mockResolvedValue({ data: analysis })
  })

  it('renders the large nearby facility result layout after analysis', async () => {
    const wrapper = mount(AnalysisPage, { attachTo: document.body })

    await wrapper.get('[data-testid="analysis-radius-1500"]').trigger('click')
    await wrapper.get('form').trigger('submit')
    await flushPromises()

    expect(api.get).toHaveBeenCalledWith('/analysis', {
      params: expect.objectContaining({
        label: '서울특별시 강남구 테헤란로 339',
        latitude: 37.497952,
        longitude: 127.027619,
        radius: 1500,
      }),
    })
    expect(wrapper.text()).toContain('가까운 생활시설')
    expect(wrapper.text()).toContain('3곳')
    expect(wrapper.text()).toContain('렌즈커뮤니케이션즈')
    expect(wrapper.text()).toContain('시설관리·임대 / 산업용품 대여 · 서울특별시 강남구 논현로 651')

    wrapper.unmount()
  })

  it('filters facilities with the Kakao-style category tabs', async () => {
    const wrapper = mount(AnalysisPage)

    await wrapper.get('form').trigger('submit')
    await flushPromises()
    await wrapper.get('[data-testid="analysis-facility-filter-cafe"]').trigger('click')

    expect(wrapper.text()).not.toContain('렌즈커뮤니케이션즈')
    expect(wrapper.text()).toContain('강남 카페')
  })
})
