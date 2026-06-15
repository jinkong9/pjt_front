# Property Detail and Loan Analysis Design

## Goal

Extend the real-transaction map without navigating away from it. A selected property opens a fixed detail panel beside the search results. The panel contains property details, favorite registration, a member financial profile form, and a conservative loan-readiness analysis.

The feature uses user-entered financial information. Integration with an external MyData provider is out of scope.

## Repositories and Branch

- Frontend: `pjt_front`, branch `byeg`
- Backend: `pjt_back`, branch `byeg`
- Frontend: Vue 3, Pinia, Axios, Vitest
- Backend: Spring Boot, session authentication, JDBC/MyBatis-style DAO structure, JUnit

## User Experience

### Desktop Layout

Use the approved fixed three-column layout:

1. Search and transaction result panel
2. Selected property detail panel
3. Kakao map

The transaction card action changes from `관심매물 등록` to `상세보기`. Clicking the card, its detail button, or a map marker selects the transaction and updates the same detail panel without navigating away.

### Mobile Layout

The detail panel opens as a full-height drawer above the map and search results. Closing it returns to the search view without losing the current results.

### Detail Tab

Show:

- Apartment name
- Transaction amount
- Address
- Exclusive area
- Floor
- Transaction date
- Link to neighborhood analysis
- Favorite state and favorite toggle button

Favorite registration requires a logged-in member. An unauthenticated user is guided to login.

### Loan Analysis Tab

The tab has three states:

1. Not logged in: show login guidance.
2. Logged in with no financial profile: show the profile form in the panel.
3. Logged in with a profile: request and display the property loan analysis.

Saving the profile immediately reruns the analysis. The same profile can be viewed and edited on the member page.

## Financial Profile

Store one profile per member:

- Available assets
- Annual income
- Monthly savings capacity
- Existing loan balance
- Existing monthly debt payment

All monetary values are stored as non-negative `DECIMAL` values in KRW. The member identifier is the table key and references `members.user_id`.

Suggested table: `member_financial_profiles`

- `user_id` primary key
- `available_assets`
- `annual_income`
- `monthly_savings`
- `existing_loan_balance`
- `existing_monthly_debt_payment`
- `created_at`
- `updated_at`

## Backend API

### Financial Profile

- `GET /api/members/me/financial-profile`
  - `200` with the profile
  - `204` when no profile exists
  - `401` when not logged in
- `PUT /api/members/me/financial-profile`
  - validates and upserts the current member profile
  - returns the saved profile

### Property Loan Analysis

- `POST /api/loans/property-analysis`

Request:

- `dealNo`
- `years`
- `repaymentType`
- optional selected annual rate

The backend loads the transaction price and current member profile. The client does not send trusted asset, income, or property price values.

Response groups:

- Property cost summary
- Borrowing limits
- Readiness summary
- Repayment summary
- Recommended products
- Assumptions and disclaimer

Existing APIs remain available:

- `GET /api/loans/products`
- `POST /api/loans/calculate`

## Calculation Model

The first version is a conservative planning simulation, not an eligibility decision.

### Cost Summary

- Property price: parsed from the selected transaction amount
- Estimated incidental cost: property price multiplied by a configurable ratio
- Total required funds: property price plus estimated incidental cost
- Current available assets: financial profile value

The incidental-cost ratio is a backend configuration value and is returned as an assumption. It represents a simplified allowance for acquisition tax, brokerage, and related expenses.

### Borrowing Limits

- Funding need: `max(total required funds - available assets, 0)`
- LTV limit: `property price * configured conservative LTV ratio`
- Annual DSR capacity: `annual income * configured DSR ratio`
- Remaining annual debt-payment capacity:
  `max(annual DSR capacity - existing monthly debt payment * 12, 0)`
- DSR loan limit: principal affordable by the remaining payment capacity for the selected term and rate
- Expected maximum loan:
  `min(funding need, LTV limit, DSR loan limit)`

Existing loan balance is shown in the result and retained in the profile. Existing monthly debt payment is the direct DSR deduction to avoid inventing repayment terms for existing debt.

### Readiness Summary

- Minimum required equity:
  `max(total required funds - min(LTV limit, DSR loan limit), 0)`
- Additional assets needed:
  `max(minimum required equity - available assets, 0)`
- Estimated time to target:
  `ceil(additional assets needed / monthly savings capacity)`

If additional assets needed is zero, display that the property is feasible under the current assumptions. If monthly savings capacity is zero while more assets are required, display that the target duration cannot be estimated.

### Repayment Summary

Reuse `LoanCalculator` for:

- Expected monthly payment
- First and last monthly payment where applicable
- Total interest
- Total repayment

Monthly remaining cash is:

`monthly savings capacity - expected new monthly payment`

This is presented as a simple cash-flow indicator, not disposable income.

### Product Recommendations

Use mortgage products from the existing FinLife-backed product service. Rank products by:

1. Availability of a numeric rate option
2. Lower applicable average or minimum rate
3. Compatibility with the selected repayment type where metadata permits

Return a small ranked list with company, product, rate, repayment metadata, and source details. Text-only product limits must be displayed as source information and must not be treated as a numeric approval limit.

If product retrieval fails, return the core analysis with an empty recommendation list and a recommendation warning.

## Configuration

Add backend settings with documented defaults:

- Conservative LTV ratio
- Conservative DSR ratio
- Incidental-cost ratio
- Default loan term
- Maximum recommendation count

Return applied assumptions in every analysis response so the UI never presents hidden rules.

## Frontend Structure

Refactor the large price page into focused feature components while preserving existing page behavior:

- Property search/results panel
- Property detail panel
- Property detail tab
- Financial profile form
- Loan analysis result

The page owns selection, panel visibility, and map coordination. API-specific loading and error states stay near the tab that triggers them.

The member page gains a financial-profile section using the same field definitions and validation messages.

## State and Error Handling

- A new search does not auto-open the first transaction detail.
- Closing the detail panel clears only the selection.
- Switching transactions invalidates the previous analysis and loads the selected deal analysis.
- Favorite state is loaded for authenticated users and updated after toggling.
- `401`: show login action.
- `204` financial profile: show input form.
- Validation error: keep entered values and show field messages.
- Product API error: keep the calculation visible and show a recommendation warning.
- Map SDK error: preserve search, details, favorites, and loan analysis.

## Security and Privacy

- Financial profile APIs derive `user_id` from the authenticated session.
- The frontend never supplies a member identifier for profile operations.
- The analysis endpoint loads authoritative transaction price data by `dealNo`.
- Logs must not contain the full financial profile.
- Profile values are not returned to other members or attached to favorite responses.

## Testing

### Backend

- Financial profile validation and upsert
- Authentication requirements
- LTV-limited scenario
- DSR-limited scenario
- Funding-need-limited scenario
- Sufficient-assets scenario
- Zero monthly-savings scenario
- Existing monthly debt reducing DSR capacity
- Incidental-cost inclusion
- Product ranking and product API failure fallback
- Transaction not found

### Frontend

- Search results show `상세보기`
- Detail panel opens, closes, and switches transactions
- Detail and loan tabs switch correctly
- Favorite toggle and unauthenticated login guidance
- Missing profile form, save, and immediate analysis
- Analysis summary renders all required values
- Product warning does not hide the calculation
- Member page profile editing
- Mobile drawer behavior

## Acceptance Criteria

- The user stays on `/prices` while inspecting a property.
- Search results, detail panel, and map remain coordinated.
- Favorites can be toggled from the detail tab.
- A logged-in user can create and edit a financial profile.
- The loan tab explains total funds, assets, maximum expected loan, minimum equity, additional assets needed, target time, repayment estimate, and recommended products.
- Applied assumptions and the simulation disclaimer are visible.
- Both applications start on Java 17/frontend Node tooling and communicate successfully through the configured API proxy.
