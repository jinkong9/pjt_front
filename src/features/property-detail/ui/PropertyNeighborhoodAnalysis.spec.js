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
    total: 88,
    level: 'Good',
  },
  trafficRiskSummary: {
    eventCount: 1,
    roadWorkCount: 1,
    riskLevel: 'Low',
  },
  transitSummary: {
    busStopWithin500m: 4,
    subwayWithin1km: 2,
  },
  busStops: [
    {
      nodeId: 'BUS-1',
      nodeName: '강남역',
      nodeNo: '22009',
      cityCode: '11',
    },
    {
      nodeId: 'BUS-2',
      nodeName: '역삼역',
      nodeNo: '23284',
      cityCode: '11',
    },
  ],
  subwayStations: [
    {
      id: 'SUBWAY-1',
      name: '강남역',
      address: '서울 강남구 강남대로',
      distanceMeters: 240,
    },
    {
      id: 'SUBWAY-2',
      name: '역삼역',
      address: '서울 강남구 테헤란로',
      distanceMeters: 760,
    },
  ],
  places: [
    {
      name: '강남 대형마트',
      largeCategory: '대형마트',
      middleCategory: '대형마트',
      address: '서울 강남구 테헤란로 1',
    },
    {
      name: '역삼 편의점',
      largeCategory: '편의점',
      middleCategory: '편의점',
      address: '서울 강남구 테헤란로 2',
    },
    {
      name: '역삼초등학교',
      largeCategory: '학교',
      middleCategory: '초등학교',
      address: '서울 강남구 테헤란로 3',
    },
    {
      name: '튼튼어린이집',
      largeCategory: '어린이집·유치원',
      middleCategory: '어린이집',
      address: '서울 강남구 테헤란로 4',
    },
    {
      name: '역삼 카페',
      largeCategory: '카페',
      middleCategory: '커피전문점',
      address: '서울 강남구 테헤란로 5',
    },
    {
      name: '강남병원',
      largeCategory: '병원',
      middleCategory: '병원',
      address: '서울 강남구 테헤란로 6',
    },
    {
      name: '강남맛집',
      largeCategory: '음식점',
      middleCategory: '한식',
      address: '서울 강남구 테헤란로 7',
    },
  ],
}

describe('PropertyNeighborhoodAnalysis', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getPropertyAnalysis.mockResolvedValue(analysis)
  })

  it('renders compact nearby facility tabs for the selected trade', async () => {
    const wrapper = mount(PropertyNeighborhoodAnalysis, { props: { trade } })
    await flushPromises()

    expect(wrapper.get('[data-testid="transit-breakdown"]').text()).toContain('교통 접근성')
    expect(wrapper.get('[data-testid="bus-stop-breakdown"]').text()).toContain('버스정류장 4곳')
    expect(wrapper.get('[data-testid="bus-stop-breakdown"]').text()).toContain('강남역')
    expect(wrapper.get('[data-testid="subway-station-breakdown"]').text()).toContain('지하철역 2곳')
    expect(wrapper.get('[data-testid="subway-station-breakdown"]').text()).toContain('240m')
    expect(getPropertyAnalysis).toHaveBeenCalledWith({
      label: trade.address,
      longitude: 127.027619,
      latitude: 37.497952,
      radius: 1000,
    })
    expect(wrapper.text()).toContain('가까운 생활시설')
    expect(wrapper.text()).toContain('88점')
    expect(wrapper.text()).toContain('버스 4곳')
    expect(wrapper.text()).toContain('지하철 2곳')
    expect(wrapper.text()).toContain('교통 위험 2건')
    expect(wrapper.text()).toContain('전체 7')
    expect(wrapper.text()).toContain('대형마트 1')
    expect(wrapper.text()).toContain('편의점 1')
    expect(wrapper.text()).toContain('학교 1')
    expect(wrapper.text()).toContain('어린이집·유치원 1')
    expect(wrapper.text()).toContain('카페 1')
    expect(wrapper.text()).toContain('병원 1')
    expect(wrapper.text()).toContain('음식점 1')
  })

  it('filters nearby facilities by category chips', async () => {
    const wrapper = mount(PropertyNeighborhoodAnalysis, { props: { trade } })
    await flushPromises()

    await wrapper.get('[data-testid="facility-filter-hospital"]').trigger('click')

    expect(wrapper.text()).not.toContain('강남맛집')
    expect(wrapper.text()).toContain('강남병원')
  })

  it('shows an error and retries the analysis request', async () => {
    getPropertyAnalysis.mockRejectedValueOnce(new Error('network')).mockResolvedValueOnce(analysis)

    const wrapper = mount(PropertyNeighborhoodAnalysis, { props: { trade } })
    await flushPromises()

    expect(wrapper.text()).toContain('생활권 분석을 불러오지 못했습니다.')
    await wrapper.get('[data-testid="retry-analysis"]').trigger('click')
    await flushPromises()

    expect(getPropertyAnalysis).toHaveBeenCalledTimes(2)
    expect(wrapper.text()).toContain('가까운 생활시설')
  })

  it('does not request analysis when coordinates are missing', async () => {
    const wrapper = mount(PropertyNeighborhoodAnalysis, {
      props: { trade: { ...trade, longitude: null, latitude: undefined } },
    })
    await flushPromises()

    expect(getPropertyAnalysis).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('좌표가 없어 생활권을 분석할 수 없습니다.')
  })
})
