# Property Detail and Loan Analysis Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an in-map property detail panel, member financial profiles, conservative property loan analysis, and loan-product recommendations.

**Architecture:** The backend owns persisted financial data and every trusted calculation. The frontend loads session-scoped profile and analysis APIs, while `PricesPage` owns property selection and delegates the panel UI to focused components.

**Tech Stack:** Java 17, Spring Boot 4, MyBatis, JUnit 5, Vue 3, Pinia, Axios, Vitest, Vite.

---

### Task 1: Establish a Clean Test Baseline

**Files:**
- Verify: `pjt_back/pom.xml`
- Verify: `pjt_front/package.json`

- [ ] Run `.\mvnw.cmd test` in `pjt_back` and record the existing result.
- [ ] Run `pnpm test:unit -- --run` in `pjt_front` and record the existing result.
- [ ] Run `java -version` and confirm Java 17 is active for Maven.

### Task 2: Add Member Financial Profile Persistence

**Files:**
- Modify: `pjt_back/src/main/resources/schema.sql`
- Create: `pjt_back/src/main/java/com/happyhome/member/dto/FinancialProfile.java`
- Create: `pjt_back/src/main/java/com/happyhome/member/dao/FinancialProfileMapper.java`
- Create: `pjt_back/src/main/java/com/happyhome/member/dao/FinancialProfileDao.java`
- Create: `pjt_back/src/main/java/com/happyhome/member/service/FinancialProfileService.java`
- Create: `pjt_back/src/main/resources/mappers/FinancialProfileMapper.xml`
- Modify: `pjt_back/src/main/java/com/happyhome/member/controller/MemberRestController.java`
- Test: `pjt_back/src/test/java/com/happyhome/member/service/FinancialProfileServiceTest.java`

- [ ] Write failing service tests for validation, missing profile, and upsert.
- [ ] Run the focused tests and confirm failure because the profile types do not exist.
- [ ] Add the table, DTO, mapper, DAO, service, and session-scoped GET/PUT endpoints.
- [ ] Run the focused tests and the backend test suite.
- [ ] Commit only financial-profile files.

### Task 3: Add the Property Loan Analysis Calculator

**Files:**
- Create: `pjt_back/src/main/java/com/happyhome/loan/dto/PropertyLoanAnalysisRequest.java`
- Create: `pjt_back/src/main/java/com/happyhome/loan/dto/PropertyLoanAnalysisResult.java`
- Create: `pjt_back/src/main/java/com/happyhome/loan/service/PropertyLoanAnalysisService.java`
- Modify: `pjt_back/src/main/java/com/happyhome/loan/controller/LoanRestController.java`
- Modify: `pjt_back/src/main/java/com/happyhome/house/dao/HouseDealMapper.java`
- Modify: `pjt_back/src/main/java/com/happyhome/house/dao/HouseDealDao.java`
- Modify: `pjt_back/src/main/java/com/happyhome/house/service/HouseDealService.java`
- Modify: `pjt_back/src/main/resources/mappers/HouseDealMapper.xml`
- Modify: `pjt_back/src/main/resources/application.properties`
- Test: `pjt_back/src/test/java/com/happyhome/loan/service/PropertyLoanAnalysisServiceTest.java`

- [ ] Write failing tests for LTV-limited, DSR-limited, sufficient-assets, zero-savings, and existing-debt scenarios.
- [ ] Run the focused tests and confirm the calculator is missing.
- [ ] Implement amount parsing, configured assumptions, inverse annuity principal calculation, readiness values, and repayment reuse.
- [ ] Add the authenticated `POST /api/loans/property-analysis` endpoint that loads the profile and transaction by session/deal number.
- [ ] Run focused and full backend tests.
- [ ] Commit the calculator and endpoint.

### Task 4: Add Resilient Product Recommendations

**Files:**
- Modify: `pjt_back/src/main/java/com/happyhome/loan/service/PropertyLoanAnalysisService.java`
- Modify: `pjt_back/src/main/java/com/happyhome/loan/dto/PropertyLoanAnalysisResult.java`
- Test: `pjt_back/src/test/java/com/happyhome/loan/service/PropertyLoanAnalysisServiceTest.java`

- [ ] Add failing tests for rate ordering and product-service failure.
- [ ] Confirm the new tests fail for missing recommendations.
- [ ] Rank mortgage product options by usable rate and return an empty list plus warning on remote failure.
- [ ] Run focused and full backend tests.
- [ ] Commit recommendation behavior.

### Task 5: Add Frontend Financial and Loan API Modules

**Files:**
- Create: `pjt_front/src/entities/member/api/financialProfileApi.js`
- Create: `pjt_front/src/entities/member/api/financialProfileApi.spec.js`
- Create: `pjt_front/src/entities/loan/api/loanAnalysisApi.js`
- Create: `pjt_front/src/entities/loan/api/loanAnalysisApi.spec.js`

- [ ] Write failing API tests for profile GET/PUT and property analysis POST payloads.
- [ ] Run focused Vitest tests and confirm the modules are missing.
- [ ] Implement thin Axios wrappers using the shared client.
- [ ] Run focused and full frontend tests.
- [ ] Commit API modules.

### Task 6: Build the Property Detail and Loan Panel

**Files:**
- Create: `pjt_front/src/features/property-detail/ui/PropertyDetailPanel.vue`
- Create: `pjt_front/src/features/property-detail/ui/PropertyDetailPanel.spec.js`
- Create: `pjt_front/src/features/property-detail/ui/FinancialProfileForm.vue`
- Create: `pjt_front/src/features/property-detail/ui/LoanAnalysisResult.vue`
- Modify: `pjt_front/src/pages/prices/ui/PricesPage.vue`
- Modify: `pjt_front/src/pages/prices/ui/PricesPage.spec.js`

- [ ] Add failing tests for `상세보기`, panel open/close, tab switching, unauthenticated guidance, and favorite toggling.
- [ ] Run focused tests and confirm the panel behavior is absent.
- [ ] Build the approved fixed desktop panel and mobile drawer.
- [ ] Connect favorite toggle, profile load/save, and analysis loading/error states.
- [ ] Ensure a new search does not auto-open the first transaction.
- [ ] Run focused and full frontend tests.
- [ ] Commit the prices-page feature.

### Task 7: Add Financial Profile Editing to Member Page

**Files:**
- Modify: `pjt_front/src/pages/member/ui/MemberPage.vue`
- Create: `pjt_front/src/pages/member/ui/MemberPage.spec.js`

- [ ] Write a failing test for loading, creating, and updating the profile.
- [ ] Run the focused test and confirm the section is absent.
- [ ] Reuse the profile field definitions and API module in the member page.
- [ ] Run focused and full frontend tests.
- [ ] Commit the member-page feature.

### Task 8: Verify Build and Live Integration

**Files:**
- Verify: `pjt_back/.env`
- Verify: `pjt_front/vite.config.js`

- [ ] Run `.\mvnw.cmd test` and `.\mvnw.cmd package -DskipTests`.
- [ ] Run `pnpm test:unit -- --run` and `pnpm build`.
- [ ] Stop stale backend and frontend processes without touching unrelated processes.
- [ ] Start the Java 17 backend on `8080` and Vite frontend on `5173`.
- [ ] Verify `/api/members/me`, `/api/houses`, financial-profile APIs, and property analysis through the frontend proxy.
- [ ] Use the in-app browser to test search, detail tabs, favorite behavior, profile entry, and loan result rendering.
- [ ] Review `git diff`, confirm generated DB files and secrets are excluded, and report remaining limitations.
