# Backend-Served SPA and Loan UI Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Serve the current Vue application from Spring Boot on port 8080 and remove global button-style collisions from the loan panel.

**Architecture:** Vite produces a backend-targeted build under Spring Boot static resources. A request filter forwards non-API browser routes to the Vue entry document while preserving REST, upload, and documentation paths.

**Tech Stack:** Vue 3, Vite, Vitest, Spring Boot 4, MockMvc, Java 17.

---

### Task 1: Add SPA Routing Contract

**Files:**
- Create: `pjt_back/src/test/java/com/happyhome/config/SpaFrontendIntegrationTest.java`
- Create: `pjt_back/src/main/java/com/happyhome/config/SpaForwardFilter.java`

- [ ] Write MockMvc tests asserting `/`, `/prices`, and `/transfers/1` contain the Vue `#app` element.
- [ ] Run the focused test and confirm it fails against the Thymeleaf pages.
- [ ] Add a highest-precedence filter forwarding UI GET paths to `/app/index.html`.
- [ ] Run the focused test after the frontend build is installed.

### Task 2: Add Backend Frontend Build

**Files:**
- Modify: `pjt_front/package.json`
- Generate: `pjt_back/src/main/resources/static/app/**`

- [ ] Add `pnpm build:backend` using Vite base `/app/` and the backend static output directory.
- [ ] Run the build and confirm generated `index.html` references `/app/assets`.
- [ ] Run the SPA integration test and full backend tests.

### Task 3: Isolate and Polish Loan Panel Styles

**Files:**
- Modify: `pjt_front/src/features/property-detail/ui/PropertyDetailPanel.vue`
- Modify: `pjt_front/src/features/property-detail/ui/LoanAnalysisResult.vue`
- Create: `pjt_front/src/features/property-detail/ui/LoanAnalysisResult.spec.js`
- Modify: `pjt_front/src/pages/prices/ui/PricesPage.spec.js`

- [ ] Write failing tests for white tab controls, a white close button, additional-assets display, and negative cash-flow warning.
- [ ] Run focused tests and confirm current classes and text fail.
- [ ] Add component-scoped button styles and reorganize result cards.
- [ ] Run focused and full frontend tests and both production builds.

### Task 4: Restart and Verify Both Origins

- [ ] Restart backend `8080` and frontend `5173`.
- [ ] Verify both origins render the Vue prices page.
- [ ] Verify `/api/houses` succeeds from both origins.
- [ ] Open the detail and loan tabs in the in-app browser and confirm visual layout.
