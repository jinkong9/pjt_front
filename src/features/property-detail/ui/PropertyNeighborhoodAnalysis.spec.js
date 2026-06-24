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
  places: [
    {
      name: '강남맛집',
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

    expect(getPropertyAnalysis).toHaveBeenCalledWith({
      label: trade.address,
      longitude: 127.027619,
      latitude: 37.497952,
      radius: 1000,
    })
    expect(wrapper.text()).toContain('가까운 생활시설')
    expect(wrapper.text()).toContain('전체 3')
    expect(wrapper.text()).toContain('음식 1')
    expect(wrapper.text()).toContain('카페 1')
    expect(wrapper.text()).toContain('의료 1')
  })

  it('filters nearby facilities by category chips', async () => {
    const wrapper = mount(PropertyNeighborhoodAnalysis, { props: { trade } })
    await flushPromises()

    await wrapper.get('[data-testid="facility-filter-cafe"]').trigger('click')

    expect(wrapper.text()).not.toContain('강남맛집')
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
