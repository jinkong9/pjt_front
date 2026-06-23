import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'

import PropertyNeighborhoodAnalysis from './PropertyNeighborhoodAnalysis.vue'
import { getPropertyAnalysis } from '@/entities/analysis/api/analysisApi'

vi.mock('@/entities/analysis/api/analysisApi', () => ({
  getPropertyAnalysis: vi.fn(),
}))

const trade = {
  no: 11,
  address: '서울특별시 강남구 테헤란로 339',
  longitude: '127.027619',
  latitude: '37.497952',
}

const analysis = {
  score: {
    total: 48,
    commercialScore: 20,
    transitScore: 28,
    trafficSafetyScore: 0,
    level: '아쉬움',
    message: '상권 20점, 대중교통 28점입니다.',
  },
  commercialSummary: {
    totalCount: 4,
    foodCount: 1,
    cafeCount: 1,
    medicalCount: 1,
    convenienceCount: 1,
    lifeCount: 0,
  },
  transitSummary: {
    subwayWithin500m: 2,
    subwayWithin1000m: 7,
    busStopWithin300m: 3,
    busStopWithin500m: 8,
    busStopWithin1000m: 15,
  },
  trafficRiskSummary: {
    eventCount: 10,
    roadworkCount: 10,
    riskLevel: '높음',
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
    {
      name: '강남연세의원',
      largeCategory: '의료',
      middleCategory: '의원',
      address: '서울 강남구 테헤란로 3',
    },
    {
      name: '편의점 강남점',
      largeCategory: '편의',
      middleCategory: '편의점',
      address: '서울 강남구 테헤란로 4',
    },
  ],
  events: [{ type: '공사', roadName: '봉은사로', message: '일부 통제' }],
  busStops: [
    {
      nodeId: 'ICB121000541',
      nodeName: '강남역서초현대타워앞',
      nodeNo: '31016',
      latitude: 37.496661,
      longitude: 127.028028,
    },
    {
      nodeId: 'ICB121000009',
      nodeName: '신분당선강남역(중)',
      nodeNo: '22009',
      latitude: 37.495913,
      longitude: 127.028556,
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

describe('PropertyNeighborhoodAnalysis', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getPropertyAnalysis.mockResolvedValue(analysis)
  })

  it('loads one integrated analysis response with nearby bus stops and subway stations', async () => {
    const wrapper = mount(PropertyNeighborhoodAnalysis, { props: { trade } })
    await flushPromises()

    expect(getPropertyAnalysis).toHaveBeenCalledWith({
      label: trade.address,
      longitude: 127.027619,
      latitude: 37.497952,
      radius: 1000,
    })
    expect(wrapper.text()).toContain('대중교통 요약')
    expect(wrapper.text()).toContain('강남역서초현대타워앞')
    expect(wrapper.text()).toContain('신분당선강남역(중)')
    expect(wrapper.text()).toContain('강남역')
    expect(wrapper.text()).not.toContain('교통 체크 포인트')
  })

  it('filters nearby facilities by category chips', async () => {
    const wrapper = mount(PropertyNeighborhoodAnalysis, { props: { trade } })
    await flushPromises()

    expect(wrapper.text()).toContain('강남역 맛집')
    expect(wrapper.text()).toContain('역삼 카페')

    await wrapper.get('[data-testid="facility-filter-cafe"]').trigger('click')

    expect(wrapper.text()).not.toContain('강남역 맛집')
    expect(wrapper.text()).toContain('역삼 카페')
  })

  it('shows an error and retries the analysis request', async () => {
    getPropertyAnalysis.mockRejectedValueOnce(new Error('network')).mockResolvedValueOnce(analysis)

    const wrapper = mount(PropertyNeighborhoodAnalysis, { props: { trade } })
    await flushPromises()

    expect(wrapper.text()).toContain('생활권 분석을 불러오지 못했습니다.')
    await wrapper.get('[data-testid="retry-analysis"]').trigger('click')
    await flushPromises()

    expect(getPropertyAnalysis).toHaveBeenCalledTimes(2)
    expect(wrapper.text()).toContain('생활권 종합 평가')
  })

  it('does not request analysis or transport details when coordinates are missing', async () => {
    const wrapper = mount(PropertyNeighborhoodAnalysis, {
      props: { trade: { ...trade, longitude: null, latitude: undefined } },
    })
    await flushPromises()

    expect(getPropertyAnalysis).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('좌표가 없어 생활권을 분석할 수 없습니다.')
  })

  it('ignores older responses after the selected trade changes', async () => {
    let resolveFirst
    let resolveSecond
    getPropertyAnalysis
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveFirst = resolve
          }),
      )
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveSecond = resolve
          }),
      )

    const wrapper = mount(PropertyNeighborhoodAnalysis, { props: { trade } })
    await wrapper.setProps({
      trade: {
        ...trade,
        no: 12,
        address: '새 매물 주소',
        longitude: '127.05',
        latitude: '37.51',
      },
    })
    resolveSecond({
      ...analysis,
      score: { ...analysis.score, message: '새 매물 분석' },
    })
    await flushPromises()
    resolveFirst({
      ...analysis,
      score: { ...analysis.score, message: '이전 매물 분석' },
    })
    await flushPromises()

    expect(wrapper.text()).toContain('새 매물 분석')
    expect(wrapper.text()).not.toContain('이전 매물 분석')
  })
})
