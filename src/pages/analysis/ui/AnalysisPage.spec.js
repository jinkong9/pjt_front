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
  score: { total: 76, level: '양호' },
  commercialSummary: {
    totalCount: 3,
  },
  trafficRiskSummary: {
    eventCount: 2,
    riskLevel: '주의 낮음',
  },
  places: [
    {
      name: '강남역 맛집',
      largeCategory: '음식',
      middleCategory: '한식',
      address: '서울 강남구 테헤란로 1',
    },
    {
      name: '역삼 카페',
      largeCategory: '카페',
      middleCategory: '커피전문점',
      address: '서울 강남구 테헤란로 2',
    },
  ],
  events: [{ type: '공사', message: '일부 통제' }],
  busStops: [
    {
      nodeId: 'ICB121000541',
      nodeName: '강남역서초현대타워앞',
      nodeNo: '31016',
    },
  ],
  subwayStations: [
    {
      id: 'SW8-1',
      name: '강남역',
      address: '서울 강남구 강남대로',
      distanceMeters: 120,
    },
  ],
}

describe('AnalysisPage segment buttons', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    api.get.mockResolvedValue({ data: analysis })
  })

  it('uses readable active segment colors without keeping the white background class', async () => {
    const wrapper = mount(AnalysisPage)

    const activeRadius = wrapper.get('[data-testid="analysis-radius-1000"]')
    expect(activeRadius.classes()).toContain('bg-[#b4212a]')
    expect(activeRadius.classes()).toContain('text-white')
    expect(activeRadius.classes()).not.toContain('bg-white')
    expect(wrapper.text()).toContain('대중교통 중심')
    expect(wrapper.text()).not.toContain('교통 안전')

    await wrapper.get('[data-testid="analysis-priority-commercial"]').trigger('click')

    const activePriority = wrapper.get('[data-testid="analysis-priority-commercial"]')
    expect(activePriority.classes()).toContain('bg-[#b4212a]')
    expect(activePriority.classes()).toContain('text-white')
    expect(activePriority.classes()).not.toContain('bg-white')
  })

  it('renders nearby transport details and category filtered facilities after analysis', async () => {
    const wrapper = mount(AnalysisPage, { attachTo: document.body })

    await wrapper.get('[data-testid="analysis-radius-1500"]').trigger('click')
    await wrapper.get('button[type="submit"]').trigger('click')
    await flushPromises()

    expect(api.get).toHaveBeenCalledWith('/analysis', {
      params: expect.objectContaining({
        label: '서울특별시 강남구 테헤란로 339',
        latitude: 37.497952,
        longitude: 127.027619,
        radius: 1500,
      }),
    })
    expect(wrapper.get('[data-testid="analysis-bus-radius-label"]').text()).toBe('1500m 이내 정류장')
    expect(wrapper.text()).toContain('근처 버스정류장')
    expect(wrapper.text()).toContain('강남역서초현대타워앞')
    expect(wrapper.text()).toContain('근처 지하철역')
    expect(wrapper.text()).toContain('강남역')
    expect(wrapper.text()).not.toContain('교통 체크 포인트')

    await wrapper.get('[data-testid="analysis-facility-filter-cafe"]').trigger('click')

    expect(wrapper.text()).not.toContain('강남역 맛집')
    expect(wrapper.text()).toContain('역삼 카페')

    wrapper.unmount()
  })
})
