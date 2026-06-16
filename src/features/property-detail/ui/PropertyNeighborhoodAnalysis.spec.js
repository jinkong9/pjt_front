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
  longitude: '127.047',
  latitude: '37.503',
}

const analysis = {
  score: {
    total: 20,
    commercialScore: 20,
    transitScore: 0,
    trafficSafetyScore: 0,
    level: '주의',
    message: '상권 20점...',
  },
  commercialSummary: {
    totalCount: 50,
    foodCount: 7,
    cafeCount: 1,
    medicalCount: 1,
    convenienceCount: 0,
    lifeCount: 42,
  },
  transitSummary: {
    subwayWithin500m: 0,
    subwayWithin1000m: 0,
    busStopWithin300m: 0,
    busStopWithin500m: 0,
    busStopWithin1000m: 0,
  },
  trafficRiskSummary: {
    eventCount: 10,
    roadworkCount: 10,
    riskLevel: '높음',
  },
  places: [
    {
      name: '강남연세안과의원',
      largeCategory: '보건의료',
      middleCategory: '의원',
      address: '서울특별시 강남구 테헤란로 339',
    },
  ],
  events: [{ type: '공사', roadName: '봉은사로', message: '양방향 전면통제' }],
}

describe('PropertyNeighborhoodAnalysis', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getPropertyAnalysis.mockResolvedValue(analysis)
  })

  it('renders scores and commercial, transit, and traffic summaries', async () => {
    const wrapper = mount(PropertyNeighborhoodAnalysis, { props: { trade } })
    await flushPromises()

    expect(getPropertyAnalysis).toHaveBeenCalledWith({
      label: trade.address,
      longitude: 127.047,
      latitude: 37.503,
      radius: 1000,
    })
    expect(wrapper.text()).toContain('종합 점수')
    expect(wrapper.text()).toContain('20점')
    expect(wrapper.text()).toContain('상권 점수')
    expect(wrapper.text()).toContain('대중교통 점수')
    expect(wrapper.text()).toContain('교통안전 점수')
    expect(wrapper.text()).toContain('전체 시설')
    expect(wrapper.text()).toContain('음식')
    expect(wrapper.text()).toContain('카페')
    expect(wrapper.text()).toContain('의료')
    expect(wrapper.text()).toContain('편의')
    expect(wrapper.text()).toContain('생활')
    expect(wrapper.text()).toContain('500m 이내 지하철')
    expect(wrapper.text()).toContain('1km 이내 지하철')
    expect(wrapper.text()).toContain('300m 이내 버스정류장')
    expect(wrapper.text()).toContain('500m 이내 버스정류장')
    expect(wrapper.text()).toContain('1km 이내 버스정류장')
    expect(wrapper.text()).toContain('교통 이벤트')
    expect(wrapper.text()).toContain('도로공사')
    expect(wrapper.text()).toContain('위험 등급')
    expect(wrapper.get('[data-testid="score-grid"]').classes()).toContain('!grid-cols-2')
  })

  it('limits facilities and traffic events until each section is expanded', async () => {
    getPropertyAnalysis.mockResolvedValue({
      ...analysis,
      places: Array.from({ length: 6 }, (_, index) => ({
        name: `생활시설 ${index + 1}`,
        largeCategory: '생활',
        middleCategory: '서비스',
        address: `테헤란로 ${index + 1}`,
      })),
      events: Array.from({ length: 4 }, (_, index) => ({
        type: '공사',
        roadName: `도로 ${index + 1}`,
        message: `교통 안내 ${index + 1}`,
      })),
    })

    const wrapper = mount(PropertyNeighborhoodAnalysis, { props: { trade } })
    await flushPromises()

    expect(wrapper.text()).not.toContain('생활시설 6')
    expect(wrapper.text()).not.toContain('교통 안내 4')

    await wrapper.get('[data-testid="expand-places"]').trigger('click')
    await wrapper.get('[data-testid="expand-events"]').trigger('click')

    expect(wrapper.text()).toContain('생활시설 6')
    expect(wrapper.text()).toContain('교통 안내 4')
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

  it('does not request analysis when coordinates are missing', async () => {
    const wrapper = mount(PropertyNeighborhoodAnalysis, {
      props: { trade: { ...trade, longitude: null, latitude: undefined } },
    })
    await flushPromises()

    expect(getPropertyAnalysis).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('좌표가 없어 생활권을 분석할 수 없습니다.')
  })

  it('ignores an older response after the selected trade changes', async () => {
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
