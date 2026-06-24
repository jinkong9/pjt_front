# LH 추천/관심/메일 기능 프론트 작업 목록

백엔드에 추가된 LH 기능을 기준으로 `pjt_front`를 확인한 결과, LH 목록/상세/캘린더/마이데이터 기본 화면은 이미 있지만 새 기능을 쓰기 위한 API 연동과 UI가 아직 없습니다.

## 현재 프론트에 이미 있는 것

- LH 공고 목록 화면: `src/pages/rentals/ui/RentalsPage.vue`
- LH 공고 상세 화면: `src/pages/rental-detail/ui/RentalDetailPage.vue`
- LH 캘린더 화면: `src/pages/lh-calendar/ui/LhCalendarPage.vue`
- LH 상세에서 로컬 마이데이터로 자격 확인: `src/entities/mydata/model/myDataProfile.js`
- 회원 금융 프로필 저장/조회: `src/entities/member/api/financialProfileApi.js`
- 마이페이지 관심 목록 탭 UI의 뼈대: `src/pages/member/ui/MemberPage.vue`

## 백엔드 신규 기능 중 프론트에 없는 것

### 1. LH 관심 공고 API 함수

현재 `src/entities/rental/api/rentalApi.js`에는 아래 두 API만 있습니다.

- `GET /api/rentals`
- `GET /api/rentals/{noticeId}`

추가 필요:

```js
export async function fetchFavoriteRentalNotices() {
  const { data } = await api.get('/rentals/favorites')
  return data.map(normalizeRentalDetail)
}

export async function toggleFavoriteRentalNotice(noticeId) {
  const { data } = await api.post(`/rentals/${noticeId}/favorite/toggle`)
  return data
}

export async function fetchRentalRecommendations(limit = 10) {
  const { data } = await api.get('/rentals/recommendations', { params: { limit } })
  return data.map(normalizeRentalRecommendation)
}

export async function sendFavoriteRentalNoticeEmails() {
  const { data } = await api.post('/rentals/favorites/emails/send')
  return data
}
```

`normalizeRentalRecommendation()`도 새로 필요합니다. 백엔드 응답은 `notice`, `score`, `reasons`, `supplies` 형태입니다.

### 2. LH 상세 화면 관심 등록 버튼

`RentalDetailPage.vue`에 관심 등록/해제 버튼이 없습니다.

추가 위치 추천:

- 상세 헤더의 “원문 보기” 버튼 옆
- 버튼 텍스트: `관심 공고 등록` / `관심 공고 해제`
- 클릭 시 `POST /api/rentals/{noticeId}/favorite/toggle`
- 비로그인 또는 401 응답 시 `/login?redirect=/rentals/{noticeId}` 이동

주의:

- 현재 백엔드는 상세 응답에 `favorite` 여부를 같이 내려주지 않습니다.
- 첫 구현은 “클릭 후 서버 응답의 `favorite` 값으로 버튼 상태 갱신”만 해도 됩니다.
- 초기 진입 시 이미 관심 등록된 공고인지 표시하려면 `GET /api/rentals/favorites`로 목록을 받아 현재 `noticeId` 포함 여부를 확인해야 합니다.

### 3. 마이페이지 LH 관심 목록 실제 렌더링

`MemberPage.vue`에는 `favoriteTab === 'rentals'`일 때 empty state만 있습니다.

추가 필요:

- `loadRentalFavorites()` 함수
- `rentalFavorites` 상태
- LH 탭 클릭 또는 마이페이지 진입 시 `GET /api/rentals/favorites`
- 각 항목에 공고명, 지역, 상태, 접수기간, 상세 링크 표시
- 항목별 “해제” 버튼은 `toggleFavoriteRentalNotice(noticeId)` 호출 후 목록에서 제거

추천 UI:

- 현재 관심 실거래 목록과 같은 카드/리스트 밀도 유지
- LH 탭 안에 “관심 공고 메일 발송 테스트” 버튼을 배치해 수동 발송 API를 확인 가능하게 함

### 4. LH 추천 공고 화면 또는 섹션

백엔드 추천 API가 추가됐지만 프론트에는 추천을 보여주는 곳이 없습니다.

추가 방식 후보:

1. `/rentals` 상단에 “나에게 맞는 LH 추천” 섹션 추가
2. `/member` 금융 프로필 아래에 “추천 LH 공고” 섹션 추가
3. 별도 라우트 `/rentals/recommendations` 추가

추천은 1번입니다. 사용자가 LH 공고를 보러 온 맥락에서 바로 추천을 볼 수 있고, 기존 목록 화면과 가장 잘 이어집니다.

필요 상태:

- `recommendations`
- `recommendationLoading`
- `recommendationError`

처리해야 할 응답:

- 200: 추천 카드 렌더링
- 401: 로그인 유도
- 409: 금융 프로필 없음. `/mydata` 또는 `/member`로 이동 CTA 표시

추천 카드 표시 정보:

- 점수: `score`
- 추천 이유: `reasons`
- 공고 기본 정보: `notice.title`, `notice.regionName`, `notice.status`
- 공급 금액/면적 요약: `supplies[0]`
- CTA: 상세 보기, 관심 등록

### 5. 관심 공고 메일 발송 UI

백엔드에는 수동 발송 API와 스케줄러가 있습니다.

프론트에 필요한 최소 UI:

- 마이페이지 LH 관심 탭 안에 버튼 추가: `관심 공고 알림 메일 보내기`
- 호출: `POST /api/rentals/favorites/emails/send`
- 결과 표시:
  - `sentCount`: 발송됨
  - `skippedCount`: 이미 발송했거나 날짜 조건 미충족
  - `missingMemberCount`: 회원 이메일 없음 또는 회원 조회 실패

문구 예시:

- `1건의 LH 관심 공고 알림을 발송했습니다.`
- `새로 보낼 알림이 없습니다. 이미 발송했거나 접수 기간 조건에 맞지 않습니다.`

운영 자동 발송은 백엔드 스케줄러가 처리하므로 프론트에서는 “알림 설정됨” 안내 정도만 있으면 됩니다.

### 6. 정규화/테스트 추가

추가할 테스트:

- `src/entities/rental/api/rentalApi.spec.js`
  - 추천 응답 normalize
  - 관심 LH 목록 normalize
  - toggle/send API 경로 검증
- `src/pages/rental-detail/ui/RentalDetailPage.spec.js`
  - 관심 등록 버튼 클릭 시 API 호출
  - 401 시 로그인 안내 또는 이동
- `src/pages/member/ui/MemberPage.spec.js`
  - LH 탭 클릭 시 관심 LH 공고 렌더링
  - 메일 발송 버튼 결과 메시지 표시
- `src/pages/rentals/ui/RentalsPage.spec.js`
  - 추천 섹션 200/401/409 상태별 표시

## 작업 우선순위

1. `rentalApi.js`에 신규 API 함수와 정규화 함수 추가
2. `RentalDetailPage.vue`에 관심 등록/해제 버튼 추가
3. `MemberPage.vue`의 LH 관심 탭을 실제 데이터 렌더링으로 교체
4. `RentalsPage.vue` 상단에 추천 섹션 추가
5. 마이페이지 LH 탭에 수동 메일 발송 버튼 추가
6. 위 흐름별 Vitest 보강

## 추가로 발견한 프론트 리스크

- 여러 Vue 파일과 테스트에 한글이 깨진 문자열이 많고, 일부 문자열은 따옴표가 닫히지 않은 것처럼 보입니다. 실제 빌드가 깨질 수 있으니 새 기능 구현 전에 `pnpm test:unit` 또는 `pnpm build`로 현재 상태를 먼저 확인해야 합니다.
- API 클라이언트는 `VITE_BACKEND_ORIGIN` 또는 기본 Cloudtype origin을 사용합니다. Netlify 배포 환경에서도 동일한 백엔드 origin을 유지해야 합니다.
