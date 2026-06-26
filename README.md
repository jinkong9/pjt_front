# HomeFit Frontend

공공데이터 기반 주거 탐색 서비스 HomeFit의 Vue 3 SPA입니다. 실거래가, LH 공공임대, 양도 게시판, 생활권 분석, 마이데이터 금융 프로필, AI 상담을 하나의 프론트엔드 경험으로 제공합니다.

## 핵심 기능

- 홈: 서비스 진입, 주요 기능 이동, 반응형 내비게이션
- 실거래가: 아파트, 오피스텔, 원룸 매매/전월세 조회와 상세 패널
- LH 공공임대: 공고 목록, 상세 공급 정보, LH 캘린더, 관심 공고 등록
- 맞춤 추천: 마이데이터 금융 프로필 기반 LH 추천 공고 조회와 추천 메일 발송
- 양도 게시판: 양도글 목록/상세/작성/수정, 이미지 업로드, 관심 등록, 댓글형 소통
- 생활권 분석: 상권, 대중교통, 교통 위험 정보를 결합한 입지 분석 화면
- 회원: 일반 로그인, OAuth 로그인, 회원가입, 마이페이지, 금융 프로필, 메일 수신 동의
- AI 상담 위젯: 백엔드 Spring AI RAG API와 연결되는 플로팅 상담 UI

## 기술 스택

| 영역 | 기술 |
| --- | --- |
| Framework | Vue 3.5, Vite 8 |
| Language | JavaScript ES Modules |
| Routing | Vue Router 5 |
| Server State | TanStack Vue Query 5 |
| Client State | Pinia 3 |
| HTTP | Axios 1, JWT Bearer interceptor, cookie token storage |
| Styling | Tailwind CSS 4 Vite Plugin, project CSS |
| Build | pnpm, Vite |
| Unit Test | Vitest 4, Vue Test Utils, jsdom |
| E2E Test | Playwright |
| Quality | ESLint 10, Oxlint, Prettier |

## 애플리케이션 구조

```text
src
  app/                 # App shell, router
  pages/               # 라우트 단위 화면
  widgets/             # 전역 내비게이션, AI 채팅 위젯
  features/            # 화면 안의 복합 기능 UI
  entities/            # 도메인별 API, model, query
  shared/              # 공통 API client, query client, util, UI, style
  test/                # 테스트 공통 설정
e2e/                   # Playwright 시나리오
docs/                  # 프론트 문서와 보고서
```

Feature-Sliced Design에 가까운 구조로 화면, 기능, 도메인, 공통 계층을 분리했습니다.

## 라우팅

| Path | 화면 |
| --- | --- |
| `/home` | 홈 |
| `/prices` | 실거래가 조회 |
| `/rentals` | LH 공공임대 공고 목록 |
| `/rentals/:noticeId` | LH 공고 상세 |
| `/transfers` | 양도 게시판 |
| `/transfers/new` | 양도글 작성 |
| `/transfers/:transferId` | 양도글 상세와 댓글 |
| `/transfers/:transferId/edit` | 양도글 수정 |
| `/lh-calendar` | LH 일정 캘린더 |
| `/analysis` | 생활권 분석 |
| `/notices` | 공지사항 |
| `/notices/:noticeId` | 공지사항 상세 |
| `/login` | 로그인 |
| `/register` | 회원가입 |
| `/member` | 마이페이지와 금융 프로필 |

## API 연동

공통 Axios 인스턴스는 `src/shared/api/client.js`에 있습니다.

- `VITE_BACKEND_ORIGIN`을 기준으로 `/api` base URL을 만듭니다.
- 기본 운영 API 주소는 Cloudtype 백엔드로 설정되어 있습니다.
- 인증이 필요한 API는 access token을 `Authorization: Bearer ...` 헤더로 자동 첨부합니다.
- 401 응답을 받으면 로컬 인증 쿠키를 정리합니다.
- 개발 서버는 `/api`, `/uploads`를 백엔드로 proxy합니다.

주요 도메인 API:

| 파일 | 역할 |
| --- | --- |
| `src/entities/rental/api/rentalApi.js` | LH 공고, 상세, 관심 등록, 추천, 메일 발송 |
| `src/entities/transfer/api/transferApi.js` | 양도 게시판, multipart 이미지, 댓글 |
| `src/entities/analysis/api/analysisApi.js` | 생활권 분석 |
| `src/entities/loan/api/loanAnalysisApi.js` | 대출 가능성 분석 |
| `src/entities/member/api/financialProfileApi.js` | 금융 프로필 |
| `src/entities/transport/api/transportApi.js` | 대중교통 접근성 |
| `src/shared/api/aiChatApi.js` | AI 상담 |

## 인증 흐름

1. 로그인 또는 OAuth 콜백 후 백엔드가 JWT 응답을 반환합니다.
2. 프론트는 access token, refresh token, grant type을 쿠키에 저장합니다.
3. Axios interceptor가 보호 API 호출에 Bearer 토큰을 붙입니다.
4. 인증 만료 시 401 응답에서 쿠키를 제거하고 로그인 상태를 초기화합니다.

## 실행 방법

### 요구 사항

- Node.js `^20.19.0` 또는 `>=22.12.0`
- pnpm

### 설치

```bash
pnpm install
```

### 개발 서버

```bash
pnpm dev
```

기본 주소는 `http://127.0.0.1:5173`입니다.

### 백엔드 주소 변경

`.env`에 다음 값을 설정합니다.

```properties
VITE_BACKEND_ORIGIN=http://localhost:8080
```

## 빌드

### 정적 SPA 빌드

```bash
pnpm build
```

### 백엔드 정적 리소스 배포용 빌드

```bash
pnpm build:backend
```

이 명령은 Vue 앱을 백엔드 저장소의 `src/main/resources/static/app`으로 빌드합니다.

## 테스트와 품질 검사

```bash
pnpm test:unit
pnpm test:e2e
pnpm lint
pnpm format
```

- 단위 테스트는 Vitest와 Vue Test Utils를 사용합니다.
- E2E 테스트는 Playwright Chromium 프로젝트로 실행합니다.
- `pnpm lint`는 Oxlint와 ESLint를 함께 실행합니다.

## 백엔드 연동 포인트

| 기능 | 백엔드 API |
| --- | --- |
| 실거래가 | `/api/houses`, `/api/properties` |
| LH 공고 | `/api/rentals`, `/api/rentals/{noticeId}` |
| LH 추천 | `/api/rentals/recommendations` |
| LH 메일 | `/api/rentals/favorites/emails/send`, `/api/rentals/recommendations/emails/send` |
| 양도 게시판 | `/api/transfers` |
| 양도 댓글 | `/api/transfers/{transferId}/comments` |
| 생활권 분석 | `/api/analysis` |
| 대출 분석 | `/api/loans/property-analysis` |
| AI 상담 | `/api/ai/chat` |
| 회원 | `/api/members/*` |

## 프로젝트 특징

- API 응답의 camelCase/snake_case 차이를 normalize 함수로 흡수합니다.
- TanStack Vue Query로 서버 상태 캐싱, stale time, 재시도 정책을 통일했습니다.
- 인증 토큰 저장과 API 인증 조건을 공통 계층에서 관리합니다.
- 페이지 단위 테스트와 도메인 모델 테스트를 함께 두어 UI와 데이터 변환 로직을 검증합니다.
- 백엔드 정적 리소스 빌드를 지원해 별도 프론트 배포와 백엔드 내장 배포를 모두 사용할 수 있습니다.
