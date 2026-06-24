import { expect, test } from '@playwright/test'

const analysisResponse = {
  score: {
    total: 82,
    level: 'Good',
  },
  commercialSummary: {
    totalCount: 2,
  },
  trafficRiskSummary: {
    eventCount: 0,
    roadWorkCount: 0,
    riskLevel: 'Low',
  },
  transitSummary: {
    busStopWithin300m: 1,
    busStopWithin500m: 2,
    busStopWithin1km: 3,
    subwayWithin500m: 1,
    subwayWithin1km: 2,
  },
  radiusMeters: 1500,
  places: [
    {
      name: 'Happy Coffee',
      largeCategory: '카페',
      middleCategory: '카페',
      address: 'Test road 1',
    },
    {
      name: 'Town Hospital',
      largeCategory: '병원',
      middleCategory: '병원',
      address: 'Test road 2',
    },
  ],
  busStops: [
    {
      nodeId: 'BUS-1',
      nodeName: 'Happy Home Station',
      nodeNo: '12345',
      latitude: 37.497952,
      longitude: 127.027619,
      distanceMeters: 180,
    },
    {
      nodeId: 'BUS-2',
      nodeName: 'Central Avenue',
      nodeNo: '67890',
      latitude: 37.498952,
      longitude: 127.028619,
      distanceMeters: 420,
    },
  ],
  subwayStations: [
    {
      id: 'SUBWAY-1',
      name: 'Gangnam Station',
      line: 'Line 2',
      address: 'Test subway road',
      distanceMeters: 360,
    },
  ],
}

test('analysis page submits selected radius and renders nearby facilities', async ({ page }) => {
  let requestedRadius = null

  await page.route('**/api/members/me**', async (route) => {
    await route.fulfill({
      status: 401,
      contentType: 'application/json',
      body: JSON.stringify({ message: 'Unauthorized' }),
    })
  })

  await page.route('**/api/analysis**', async (route) => {
    const url = new URL(route.request().url())
    requestedRadius = url.searchParams.get('radius')

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(analysisResponse),
    })
  })

  await page.goto('/analysis')
  await page.getByTestId('analysis-radius-1500').click()
  await page.locator('button[type="submit"]').click()

  await expect(page.getByRole('heading', { name: '가까운 생활시설' })).toBeVisible()
  await expect(page.getByText('82점')).toBeVisible()
  await expect(page.getByText('버스')).toBeVisible()
  await expect(page.getByText('지하철')).toBeVisible()
  await expect(page.getByText('전체 2')).toBeVisible()
  await expect(page.getByText('카페 1')).toBeVisible()
  await expect(page.getByText('병원 1')).toBeVisible()
  await expect(page.getByText('Happy Coffee')).toBeVisible()
  await expect(page.getByText('Town Hospital')).toBeVisible()

  await page.getByTestId('analysis-facility-filter-cafe').click()
  await expect(page.getByText('Happy Coffee')).toBeVisible()
  await expect(page.getByText('Town Hospital')).not.toBeVisible()
  expect(requestedRadius).toBe('1500')
})
