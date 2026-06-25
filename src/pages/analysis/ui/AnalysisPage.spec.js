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
  score: {
    total: 91,
    level: 'Excellent',
  },
  trafficRiskSummary: {
    eventCount: 1,
    roadWorkCount: 0,
    riskLevel: 'Low',
  },
  transitSummary: {
    busStopWithin500m: 5,
    subwayWithin1km: 3,
  },
  busStops: [
    {
      nodeName: '역삼역 정류장',
      nodeNo: '23284',
      distanceMeters: 180,
    },
    {
      nodeName: '강남역 정류장',
      nodeNo: '22009',
      distanceMeters: 420,
    },
  ],
  subwayStations: [
    {
      name: '역삼역',
      line: '2호선',
      address: '서울 강남구 테헤란로',
      distanceMeters: 260,
    },
  ],
  places: [
    {
      name: '강남 대형마트',
      largeCategory: '대형마트',
      middleCategory: '대형마트',
      address: '서울특별시 강남구 논현로 651',
    },
    {
      name: '역삼 편의점',
      largeCategory: '편의점',
      middleCategory: '편의점',
      address: '서울특별시 강남구 논현로 641',
    },
    {
      name: '역삼초등학교',
      largeCategory: '학교',
      middleCategory: '초등학교',
      address: '서울특별시 강남구 논현로 642',
    },
    {
      name: '튼튼어린이집',
      largeCategory: '어린이집·유치원',
      middleCategory: '어린이집',
      address: '서울특별시 강남구 논현로 643',
    },
    {
      name: '강남 카페',
      largeCategory: '카페',
      middleCategory: '커피전문점',
      address: '서울특별시 강남구 논현로 650',
    },
    {
      name: '강남병원',
      largeCategory: '병원',
      middleCategory: '병원',
      address: '서울특별시 강남구 논현로 644',
    },
    {
      name: '강남맛집',
      largeCategory: '음식점',
      middleCategory: '한식',
      address: '서울특별시 강남구 논현로 645',
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
    expect(wrapper.text()).toContain('91점')
    expect(wrapper.text()).toContain('버스')
    expect(wrapper.text()).toContain('5곳')
    expect(wrapper.text()).toContain('지하철')
    expect(wrapper.text()).toContain('3곳')
    expect(wrapper.text()).toContain('교통 위험 Low')
    expect(wrapper.text()).toContain('7곳')
    expect(wrapper.text()).toContain('대형마트 1')
    expect(wrapper.text()).toContain('편의점 1')
    expect(wrapper.text()).toContain('학교 1')
    expect(wrapper.text()).toContain('어린이집·유치원 1')
    expect(wrapper.text()).toContain('카페 1')
    expect(wrapper.text()).toContain('병원 1')
    expect(wrapper.text()).toContain('음식점 1')
    expect(wrapper.text()).toContain('강남 대형마트')
    expect(wrapper.text()).toContain('대형마트 / 대형마트 · 서울특별시 강남구 논현로 651')

    expect(wrapper.text()).toContain('교통 접근성')
    expect(wrapper.text()).toContain('역삼역 정류장')
    expect(wrapper.text()).toContain('23284')
    expect(wrapper.text()).toContain('180m')
    expect(wrapper.text()).toContain('역삼역')
    expect(wrapper.text()).toContain('2호선')
    expect(wrapper.text()).toContain('260m')

    wrapper.unmount()
  })

  it('filters facilities with the Kakao-style category tabs', async () => {
    const wrapper = mount(AnalysisPage)

    await wrapper.get('form').trigger('submit')
    await flushPromises()
    await wrapper.get('[data-testid="analysis-facility-filter-cafe"]').trigger('click')

    expect(wrapper.text()).not.toContain('강남 대형마트')
    expect(wrapper.text()).toContain('강남 카페')
  })
})
