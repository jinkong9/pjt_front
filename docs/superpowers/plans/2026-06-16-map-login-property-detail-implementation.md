# Map Login Property Detail Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix login styling and return navigation, enrich the property detail panel with the complete neighborhood analysis, and enable Kakao Maps on both local frontend origins.

**Architecture:** Login return state is encoded in validated internal query parameters and restored by `PricesPage` after house results load. Neighborhood analysis is isolated in a focused detail component that consumes the existing `/api/analysis` response. Kakao SDK configuration remains backend-driven while allowed origins are registered in Kakao Developers.

**Tech Stack:** Vue 3, Vue Router, Pinia, Axios, Vitest, Vue Test Utils, Vite, Spring Boot static SPA serving, Kakao Maps JavaScript SDK

---

### Task 1: Safe Login Return Navigation

**Files:**
- Create: `src/shared/lib/safeRedirect.js`
- Create: `src/shared/lib/safeRedirect.spec.js`
- Create: `src/pages/login/ui/LoginPage.spec.js`
- Modify: `src/pages/login/ui/LoginPage.vue`

- [ ] **Step 1: Write failing redirect validation tests**

Test that `/prices?mode=search` is accepted and `https://evil.example`, `//evil.example`, empty values are replaced with `/home`.

- [ ] **Step 2: Run tests and verify RED**

Run: `pnpm test:unit -- --run src/shared/lib/safeRedirect.spec.js`

Expected: FAIL because `safeRedirect` does not exist.

- [ ] **Step 3: Implement the redirect validator**

Export `safeRedirect(value, fallback = '/home')`. Accept only strings beginning with one `/`, reject protocol-relative paths, and parse with `new URL(value, window.location.origin)` to ensure the origin remains local.

- [ ] **Step 4: Write failing login navigation tests**

Mock `memberStore.login`, submit the form, and assert:

```js
expect(router.currentRoute.value.fullPath).toBe('/home')
```

For `/login?redirect=%2Fprices%3Fmode%3Dsearch`, assert the final route is `/prices?mode=search`.

- [ ] **Step 5: Run tests and verify RED**

Run: `pnpm test:unit -- --run src/pages/login/ui/LoginPage.spec.js`

Expected: FAIL because login currently routes to `/member`.

- [ ] **Step 6: Implement login navigation**

Read `route.query.redirect`, normalize it with `safeRedirect`, and `await router.push(destination)` after successful login.

- [ ] **Step 7: Run focused tests and verify GREEN**

Run: `pnpm test:unit -- --run src/shared/lib/safeRedirect.spec.js src/pages/login/ui/LoginPage.spec.js`

Expected: all tests pass.

### Task 2: Login Page Style Isolation

**Files:**
- Modify: `src/pages/login/ui/LoginPage.vue`
- Modify: `src/pages/login/ui/LoginPage.spec.js`

- [ ] **Step 1: Add failing style contract assertions**

Assert the page has `login-page`, the form card has `login-card`, and the submit button has `login-submit`.

- [ ] **Step 2: Run the test and verify RED**

Run: `pnpm test:unit -- --run src/pages/login/ui/LoginPage.spec.js`

Expected: FAIL because the dedicated classes are absent.

- [ ] **Step 3: Add scoped login styles**

Define explicit card sizing, vertical alignment, input appearance, red submit background with white text, OAuth button colors, and a single-column breakpoint below 900px. Keep shared auth structure but make login-specific styles authoritative.

- [ ] **Step 4: Run the test and verify GREEN**

Run: `pnpm test:unit -- --run src/pages/login/ui/LoginPage.spec.js`

Expected: all tests pass.

### Task 3: Preserve Property Context Through Login

**Files:**
- Modify: `src/features/property-detail/ui/PropertyDetailPanel.vue`
- Modify: `src/pages/prices/ui/PricesPage.vue`
- Modify: `src/pages/prices/ui/PricesPage.spec.js`

- [ ] **Step 1: Write failing context-link tests**

Open trade `11` from `/prices?mode=search&keyword=역삼`, switch to the loan tab, and assert the login link contains:

```js
{
  path: '/login',
  query: {
    redirect: '/prices?mode=search&keyword=역삼&trade=11&tab=loan',
  },
}
```

- [ ] **Step 2: Write failing restoration test**

Open `/prices?mode=search&keyword=역삼&trade=11&tab=loan`, load trade `11`, and assert its detail panel opens with the loan tab active.

- [ ] **Step 3: Run the tests and verify RED**

Run: `pnpm test:unit -- --run src/pages/prices/ui/PricesPage.spec.js`

Expected: FAIL because links do not preserve context and route state is not restored.

- [ ] **Step 4: Implement context generation**

Use `route.fullPath` without stale `trade` and `tab`, append the current trade number and active tab, and pass the resulting login route from `PricesPage` to `PropertyDetailPanel`.

- [ ] **Step 5: Implement restoration**

After `loadTrades`, locate `route.query.trade`, open the matching trade, and pass `route.query.tab` as the initial panel tab. Ignore unknown trade numbers and invalid tab values.

- [ ] **Step 6: Run focused tests and verify GREEN**

Run: `pnpm test:unit -- --run src/pages/prices/ui/PricesPage.spec.js`

Expected: all tests pass.

### Task 4: Property Neighborhood Analysis Component

**Files:**
- Create: `src/entities/analysis/api/analysisApi.js`
- Create: `src/features/property-detail/ui/PropertyNeighborhoodAnalysis.vue`
- Create: `src/features/property-detail/ui/PropertyNeighborhoodAnalysis.spec.js`
- Modify: `src/features/property-detail/ui/PropertyDetailPanel.vue`

- [ ] **Step 1: Write failing API rendering test**

Mount the new component with a trade and mock `/analysis` to return:

```js
{
  score: { total: 20, commercialScore: 20, transitScore: 0, trafficSafetyScore: 0, level: '주의', message: '상권 20점...' },
  commercialSummary: { totalCount: 50, foodCount: 7, cafeCount: 1, medicalCount: 1, convenienceCount: 0, lifeCount: 42 },
  transitSummary: { subwayWithin500m: 0, subwayWithin1000m: 0, busStopWithin300m: 0, busStopWithin500m: 0, busStopWithin1000m: 0 },
  trafficRiskSummary: { eventCount: 10, roadworkCount: 10, riskLevel: '높음' },
  places: [{ name: '강남연세안과의원', largeCategory: '보건의료', middleCategory: '의원', address: '서울특별시 강남구 테헤란로 339' }],
  events: [{ type: '공사', roadName: '봉은사로', message: '양방향 전면통제' }],
}
```

Assert all four scores and all summary categories render.

- [ ] **Step 2: Run the test and verify RED**

Run: `pnpm test:unit -- --run src/features/property-detail/ui/PropertyNeighborhoodAnalysis.spec.js`

Expected: FAIL because the component does not exist.

- [ ] **Step 3: Implement API wrapper and component**

Call `GET /analysis` with `label`, numeric longitude/latitude, and `radius: 1000`. Render score cards, commercial counts, transit distances, traffic risk, five facilities, and three traffic events.

- [ ] **Step 4: Add failing expand and error-state tests**

Provide six facilities and four traffic events, assert the initial limits, click each `더보기`, and assert all items appear. Reject the API and assert a retry button appears. Provide missing coordinates and assert no API call occurs.

- [ ] **Step 5: Run tests and verify RED**

Run: `pnpm test:unit -- --run src/features/property-detail/ui/PropertyNeighborhoodAnalysis.spec.js`

Expected: new expand/error tests fail.

- [ ] **Step 6: Implement limits, retry, and stale-response protection**

Track expanded sections, expose retry, skip invalid coordinates, and compare a monotonically increasing request token before applying results.

- [ ] **Step 7: Integrate into the detail tab**

Place the component after basic transaction fields and before actions. Keep transaction details available when analysis fails.

- [ ] **Step 8: Run focused tests and verify GREEN**

Run: `pnpm test:unit -- --run src/features/property-detail/ui/PropertyNeighborhoodAnalysis.spec.js src/pages/prices/ui/PricesPage.spec.js`

Expected: all tests pass.

### Task 5: Kakao Map Error Guidance and Origin Registration

**Files:**
- Modify: `src/pages/prices/ui/PricesPage.vue`
- Modify: `src/pages/prices/ui/PricesPage.spec.js`
- External setting: Kakao Developers Web platform domains

- [ ] **Step 1: Add failing map guidance test**

Mock the SDK script error and assert the visible message mentions both `http://localhost:8080` and `http://localhost:5173`.

- [ ] **Step 2: Run the test and verify RED**

Run: `pnpm test:unit -- --run src/pages/prices/ui/PricesPage.spec.js`

Expected: FAIL because the current message does not list the origins.

- [ ] **Step 3: Improve the error message**

Show that the key arrived but the Kakao Web platform domains must include both local origins.

- [ ] **Step 4: Register origins in Kakao Developers**

Open the application matching JavaScript key `2c0c...69c`, navigate to platform settings, and add:

```text
http://localhost:8080
http://localhost:5173
```

Do not alter REST keys, redirect URIs, or unrelated application settings.

- [ ] **Step 5: Verify SDK access**

Request the SDK with each origin as referer and expect HTTP 200 instead of `401 domain mismatched`.

### Task 6: Full Verification and Integrated Build

**Files:**
- Generated: `../pjt_back/src/main/resources/static/app/**`

- [ ] **Step 1: Run the complete frontend suite**

Run: `pnpm test:unit -- --run`

Expected: all tests pass.

- [ ] **Step 2: Build development and backend bundles**

Run:

```text
pnpm build
pnpm build:backend
```

Expected: both builds succeed.

- [ ] **Step 3: Run backend tests**

Run: `.\mvnw.cmd test` in `D:\GitHub\pjt_back`.

Expected: all tests pass.

- [ ] **Step 4: Restart both servers**

Restart Spring Boot with Java 17 on port 8080 and Vite on port 5173.

- [ ] **Step 5: Browser verification**

Verify on 8080 and 5173:

- map renders without the domain mismatch message;
- login page layout and button colors are correct;
- normal login returns to `/home`;
- property-origin login restores the prior search, selected trade, and tab;
- detail panel shows score, commercial, transit, traffic, facilities, and traffic events.

- [ ] **Step 6: Commit implementation**

Commit frontend source/tests and backend generated static assets separately. Exclude `data/happyhome.mv.db` and `data/happyhome.trace.db`.
