import { api } from '@/shared/api/client'

export async function fetchNearbyBusStops(params) {
  const { data } = await api.get('/bus-stops/nearby', { params })
  return data
}

export async function fetchNearbySubwayStations(params) {
  const { data } = await api.get('/subway-stations/nearby', { params })
  return data
}
