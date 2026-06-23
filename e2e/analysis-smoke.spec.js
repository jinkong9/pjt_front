import { expect, test } from '@playwright/test'

const analysisResponse = {
  score: {
    total: 82,
    level: 'Good',
  },
  commercialSummary: {
    totalCount: 4,
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
      largeCategory: 'Food',
      middleCategory: 'Cafe',
      address: 'Test road 1',
    },
    {
      name: 'Town Clinic',
      largeCategory: 'Medical',
      middleCategory: 'Clinic',
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

test('analysis page submits selected radius and renders transit results', async ({ page }) => {
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

  await expect(page.getByTestId('analysis-bus-radius-label')).toContainText('1500m')
  await expect(page.getByText('Happy Home Station')).toBeVisible()
  await expect(page.getByText('Gangnam Station')).toBeVisible()
  await expect(page.getByText('Happy Coffee')).toBeVisible()
  expect(requestedRadius).toBe('1500')
})
