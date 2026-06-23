import { beforeEach, describe, expect, it, vi } from 'vitest'

import { api } from '@/shared/api/client'
import { fetchNearbyBusStops, fetchNearbySubwayStations } from './transportApi'

vi.mock('@/shared/api/client', () => ({
  api: {
    get: vi.fn(),
  },
}))

describe('transportApi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('loads nearby bus stops using the coordinate based backend API', async () => {
    api.get.mockResolvedValueOnce({ data: [{ nodeId: 'ICB121000541', nodeName: '강남역서초현대타워앞' }] })

    await expect(
      fetchNearbyBusStops({ latitude: 37.497952, longitude: 127.027619, radiusMeters: 500, limit: 6 }),
    ).resolves.toEqual([{ nodeId: 'ICB121000541', nodeName: '강남역서초현대타워앞' }])

    expect(api.get).toHaveBeenCalledWith('/bus-stops/nearby', {
      params: { latitude: 37.497952, longitude: 127.027619, radiusMeters: 500, limit: 6 },
    })
  })

  it('loads nearby subway stations using Kakao local backed API', async () => {
    api.get.mockResolvedValueOnce({ data: [{ id: 'SW8-1', name: '강남역', distanceMeters: 120 }] })

    await expect(
      fetchNearbySubwayStations({ latitude: 37.497952, longitude: 127.027619, radiusMeters: 1000 }),
    ).resolves.toEqual([{ id: 'SW8-1', name: '강남역', distanceMeters: 120 }])

    expect(api.get).toHaveBeenCalledWith('/subway-stations/nearby', {
      params: { latitude: 37.497952, longitude: 127.027619, radiusMeters: 1000 },
    })
  })
})
