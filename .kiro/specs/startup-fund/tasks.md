# Implementation Plan: StartupFund

## Overview

StartupFund is a MERN stack platform connecting founders with investors. The build lives in a single repository with two independently runnable packages: a `server/` (Express.js + Mongoose + MongoDB) and a `client/` (React + Vite + Tailwind CSS). Implementation proceeds bottom-up and incrementally — each task builds on prior tasks and ends with wiring, so no code is left orphaned.

The plan is organized into server foundation (project setup → shared pure validators → error/middleware layer → models → auth → startup CRUD → discovery → shortlist → app wiring), then client foundation (api client → auth context → shared UI → pages → routing wiring), then verification (property tests, unit/integration tests, responsive smoke tests). The server and client tracks are independent (the client talks to the API over REST/JSON with mocked/stubbed responses during development), so their tasks run in parallel where dependencies allow.

Property-based tests use `fast-check` (≥100 runs each) with `mongodb-memory-server` for database-backed properties, per the design's Correctness Properties section. Unit, integration, and example/UI tests cover the non-PBT criteria (UI rendering, one-shot side effects, not-found/conflict checks). Test sub-tasks are marked optional with `*`.

Convert the feature design into a series of prompts for a code-generation LLM that will implement each step with incremental progress. Make sure that each prompt builds on the previous prompts, and ends with wiring things together. There should be no hanging or orphaned code that isn't integrated into a previous step. Focus ONLY on tasks that involve writing, modifying, or testing code.

## Tasks

- [ ] 1. Set up monorepo project structure and configuration
  - [-] 1.1 Initialize the server package
    - Create `server/` with `package.json` (type: module, scripts: `dev`, `start`, `test`); install runtime deps `express`, `mongoose`, `jsonwebtoken`, `bcrypt`, `express-validator` and dev deps `jest`, `supertest`, `mongodb-memory-server`, `fast-check`
    - Create `server/.env` with `PORT`, `MONGO_URI`, `JWT_SECRET` placeholders and a config loader
    - Create `server/src/config/db.js` exporting a Mongoose connection helper
    - Create `server/src/app.js` skeleton: Express app with JSON body parser, a placeholder for route mounting, and a placeholder for the error handler; export the app for testing
    - _Requirements: 1, 2 (infrastructure for all server features)_

  - [ ] 1.2 Initialize the client package
    - Create `client/` with Vite + React; `package.json` with scripts `dev`, `build`, `test` (Vitest `--run`); install `react-router-dom`, `axios`, and dev deps `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `jsdom`
    - Create `tailwind.config.js` with mobile/tablet/desktop content paths and `client/src/index.css` with Tailwind directives
    - Create `client/src/main.jsx` entry (render `<App />`, import Tailwind CSS) and a minimal `client/src/App.jsx` skeleton
    - _Requirements: 1, 2, 16 (infrastructure for all client features)_

- [ ] 2. Define pure validation functions (shared logic layer)
  - [~] 2.1 Implement server pure validation functions
    - Create `server/src/validators/` pure functions returning an array of `{ field, message }` errors (empty array when valid) for: name (1–100), email format (non-empty text before/after a single `@`), password (6–128), role (Founder|Investor), and all Startup_Profile fields (companyName/tagline ≤200, description ≤2000, industry ≤100, fundingStage enum of 6 stages, fundingRequired 0.01–999999999.99 with ≤2 decimals positive, location ≤200, founderName ≤200, website optional valid URL ≤2048), plus search query (1–200 non-whitespace)
    - Each function must name the failing field and the reason; aggregate across fields so each invalid field yields its own error
    - Keep these pure (no I/O) so they are importable by Jest and mirrorable on the client
    - _Requirements: 1.2, 1.4, 4.2, 4.4, 4.5, 4.6, 4.7, 9.3, 14.2, 14.3, 14.4_

  - [~] 2.2 Implement client-side validation parity
    - Create `client/src/utils/validation.js` mirroring the server pure functions (same field rules and `{ field, message }` shape) so the Web_Client can block invalid submissions and show field-specific errors before and on submit and on blur
    - _Requirements: 14.1, 14.2, 14.3, 14.5, 14.6_

  - [ ]* 2.3 Write property test for required-field presence and length-bound text validation
    - **Property 1: Required-field presence and length-bound text validation**
    - Use `fast-check` (≥100 runs) with generators exercising boundaries: name length 1 and 100, password 6 and 128, companyName/tagline/founderName/location at 200, description at 2000, industry at 100, search query at 1 and 200, whitespace-only required values
    - Assert validators reject missing/undersized/oversized/whitespace-only required fields with one field-specific error per invalid field and accept in-bounds values
    - **Validates: Requirements 1.2, 1.4, 4.3, 5.3, 9.3, 14.2, 14.3**

  - [ ]* 2.4 Write property test for email format validation
    - **Property 2: Email format validation**
    - Use `fast-check` with generators for emails lacking text before/after `@`, multiple `@`, empty local/domain parts, and well-formed emails
    - Assert malformed emails are rejected with an "email format is invalid" message and well-formed emails accepted
    - **Validates: Requirements 1.2, 14.4**

  - [ ]* 2.5 Write property test for fundingRequired numeric validation
    - **Property 3: fundingRequired numeric validation**
    - Use `fast-check` with generators including 0.009, 0.01, 999999999.99, 1000000000, 1.234, negative, NaN, and non-finite values
    - Assert rejection of non-finite/non-positive/below-min/above-max/more-than-2-decimals values and acceptance of `[0.01, 999999999.99]` with ≤2 decimals; non-positive values yield the "funding required must be a positive number" message
    - **Validates: Requirements 4.4, 4.6**

  - [ ]* 2.6 Write property test for enum validation for role and fundingStage
    - **Property 4: Enum validation for role and fundingStage**
    - Use `fast-check` with arbitrary strings; assert only `Founder`/`Investor` roles and the six funding stages (Pre-Seed, Seed, Series A, Series B, Series C, Post-Series C) are accepted; all others rejected
    - **Validates: Requirements 1.2, 4.2**

  - [ ]* 2.7 Write property test for conditional website URL validation
    - **Property 5: Conditional website URL validation**
    - Use `fast-check` with generators for valid URLs, non-URLs, strings over 2048 chars, and empty/omitted values
    - Assert invalid/overlong provided websites are rejected with a "website must be a valid URL" message; omitted/empty websites produce no error; valid in-length URLs accepted
    - **Validates: Requirements 4.5, 4.7**

- [ ] 3. Implement server error handling and middleware
  - [~] 3.1 Create error classes
    - Create `server/src/utils/errors.js` with `AppError` base (carries `statusCode`, `type`) and subclasses `ValidationError` (400, supports an array of `{ field, message }`), `AuthenticationError` (401), `AuthorizationError` (403), `NotFoundError` (404); generic `AppError` defaults to 500
    - _Requirements: 15.1, 15.4, 14.2, 14.3_

  - [~] 3.2 Create authentication and authorization middleware
    - Create `server/src/middleware/auth.js`: `authenticate` reads the `Authorization: Bearer <token>` header, verifies the JWT (absent/expired/malformed/bad-signature → `AuthenticationError` 401), and attaches `req.user = { userId, role }`; `authorize(...roles)` rejects with `AuthorizationError` 403 when the role is absent, unknown, or not in the allowed set
    - _Requirements: 3.1, 3.2, 3.3, 3.5, 12.4_

  - [~] 3.3 Create validation middleware
    - Create `server/src/middleware/validate.js` that runs an express-validator schema (built from the pure functions) and, on failure, throws a `ValidationError` (400) carrying the aggregated `{ field, message }` entries
    - _Requirements: 14.2, 14.3_

  - [~] 3.4 Create central error handler
    - Create `server/src/middleware/errorHandler.js` terminal middleware that converts any `AppError` (and unexpected errors) into the structured JSON `{ error: { type, message } }` with the matching status code (400/401/403/404/500)
    - _Requirements: 15.1, 15.4_

  - [ ]* 3.5 Write property test for structured error responses with correct status codes
    - **Property 18: Error handler produces structured responses with correct status codes**
    - Use `fast-check` to throw each `AppError` subclass and assert the handler emits `{ error: { type, message } }` with status 400/401/403/404/500 respectively
    - **Validates: Requirements 15.1, 15.4**

  - [ ]* 3.6 Write property test for invalid JWT rejected with 401
    - **Property 7: Invalid JWT is rejected with 401**
    - Use `fast-check` to generate absent, expired, malformed, and bad-signature tokens; assert `authenticate` rejects each with 401 and passes valid tokens
    - **Validates: Requirements 3.1**

  - [ ]* 3.7 Write property test for disallowed role rejected with 403
    - **Property 8: Disallowed role is rejected with 403**
    - Use `fast-check` to generate allowed-role, absent-role, and unrecognized-role claims; assert `authorize` rejects disallowed/absent/unknown roles with 403 and passes allowed roles
    - **Validates: Requirements 3.2, 3.3, 3.5, 12.4**

- [ ] 4. Implement Mongoose models and pagination utility
  - [~] 4.1 Create the User model
    - Create `server/src/models/User.js` with `name` (1–100), `email` (unique, lowercase, trim, email format), `password` (required, `select: false`), `role` (enum Founder|Investor), timestamps; unique index on `email`
    - _Requirements: 1.1, 1.2, 1.3_

  - [~] 4.2 Create the Startup model
    - Create `server/src/models/Startup.js` with all profile fields, `fundingRequired` custom validator (finite, 0.01–999999999.99, ≤2 decimals), optional `website` URL validator (only when provided), `founder` ref User, timestamps; indexes on `createdAt` (desc), `industry`, `fundingStage`
    - _Requirements: 4.2, 4.4, 4.5, 6.3_

  - [~] 4.3 Create the Shortlist model
    - Create `server/src/models/Shortlist.js` with `investor` (ref User, unique) and `startups` (array of ref Startup, default `[]`), timestamps; unique index on `investor`
    - _Requirements: 12.1, 12.2, 6.3_

  - [~] 4.4 Create the pagination utility
    - Create `server/src/utils/pagination.js` as a pure function computing `skip = (page - 1) * limit`, `limit` (max 20), and `totalPages = ceil(total / limit)` from `page` and `total`
    - _Requirements: 8.1, 8.3_

- [ ] 5. Implement the auth subsystem
  - [~] 5.1 Create auth validator schemas
    - Create `server/src/validators/authValidator.js` express-validator schemas for register and login built from the pure functions
    - _Requirements: 1.2, 1.4, 2.2, 14.2_

  - [~] 5.2 Create the auth controller
    - Create `server/src/controllers/authController.js`: `register` (validate, check email uniqueness → 409 conflict on duplicate, hash password with bcrypt, create User, sign a 24h JWT with `userId` and `role` claims, return `{ token, user }`); `login` (verify credentials, returning a single generic `AuthenticationError` "invalid credentials" on any mismatch without revealing which field, sign JWT, return `{ token, user }`); `me` (return the authenticated user's profile)
    - _Requirements: 1.1, 1.3, 1.5, 2.1, 2.2_

  - [~] 5.3 Create auth routes
    - Create `server/src/routes/authRoutes.js`: POST `/api/auth/register`, POST `/api/auth/login` (public), GET `/api/auth/me` (behind `authenticate`)
    - _Requirements: 1, 2, 3_

  - [ ]* 5.4 Write property test for JWT claims and 24-hour expiry
    - **Property 6: JWT claims and 24-hour expiry**
    - Use `fast-check` (db-backed via mongodb-memory-server) to register/login and assert the decoded JWT contains `userId` and `role` matching the user and `exp` ≈ `iat` + 24h
    - **Validates: Requirements 1.1, 1.5, 2.1**

  - [ ]* 5.5 Write property test for login never leaking which credential failed
    - **Property 9: Login never leaks which credential failed**
    - Use `fast-check` to attempt login with wrong email, wrong password, both wrong, and unknown email; assert all return the identical generic authentication error message with no field-specific distinction
    - **Validates: Requirements 2.2**

  - [ ]* 5.6 Write integration test for duplicate-email registration conflict
    - Register a user, then register again with the same email; assert a 409 conflict error (db-backed via mongodb-memory-server)
    - **Validates: Requirements 1.3**

- [ ] 6. Implement the startup CRUD service (founder)
  - [~] 6.1 Create startup validator schemas
    - Create `server/src/validators/startupValidator.js` express-validator schema for create/update built from the pure functions
    - _Requirements: 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 5.3, 5.5_

  - [~] 6.2 Create the startup controller
    - Create `server/src/controllers/startupController.js`: `create` (set `founder = req.user.userId`, return created record with id and all fields); `update` (load by id, 403 if not owner, validate, update, return updated record); `remove` (load by id, 403 if not owner, delete, cascade `$pull` the id from all Shortlists best-effort retaining the deletion on partial failure, return success confirmation); `listMine` (return all startups owned by the founder)
    - _Requirements: 4.1, 5.1, 5.2, 5.4, 5.5, 6.1, 6.2, 6.3, 6.4, 6.5, 7.1_

  - [~] 6.3 Create startup routes
    - Create `server/src/routes/startupRoutes.js`: POST `/api/startups`, PUT `/api/startups/:id`, DELETE `/api/startups/:id`, GET `/api/startups` — all behind `authenticate` + `authorize('Founder')`
    - _Requirements: 4, 5, 6, 7, 3.2_

  - [ ]* 6.4 Write property test for ownership-protected mutations rejecting non-owners with 403
    - **Property 10: Ownership-protected mutations reject non-owners with 403**
    - Use `fast-check` (db-backed) to have a non-owner founder attempt update/delete on another founder's startup; assert 403 and the profile is unchanged; assert the owner's own requests are not rejected for ownership reasons
    - **Validates: Requirements 5.2, 6.2**

  - [ ]* 6.5 Write property test for startup serialization round-trip
    - **Property 11: Startup serialization round-trip**
    - Use `fast-check` (db-backed) to create a profile with null, empty-string, and up to 1024-char field values, then retrieve by id within 5 seconds; assert every returned field equals the submitted value and all fields are present in JSON; repeat equality after an update
    - **Validates: Requirements 4.1, 5.1, 11.5, 17.1, 17.2, 17.3**

  - [ ]* 6.6 Write property test for deletion removing the profile and cascading to shortlists
    - **Property 17: Deletion removes the profile and cascades to shortlists**
    - Use `fast-check` (db-backed) to delete an owned startup with entries in multiple investor shortlists; assert a success confirmation identifying the deleted profile, the profile is no longer retrievable by id, and no shortlist contains a reference to it
    - **Validates: Requirements 6.1, 6.3**

  - [ ]* 6.7 Write edge-case test for best-effort cascade on shortlist cleanup failure
    - Mock a failing `Shortlist.updateMany` during a startup deletion and assert the startup deletion is still retained and remaining shortlists continue to be processed
    - **Validates: Requirements 6.5**

  - [ ]* 6.8 Write integration test for not-found startup operations
    - Assert update and delete on a nonexistent startup id return a 404 not-found error (db-backed, controller-level)
    - **Validates: Requirements 5.4, 6.4**

- [ ] 7. Implement the discovery service (investor browse/search/filter/details)
  - [~] 7.1 Create the discovery controller
    - Create `server/src/controllers/discoveryController.js`: `browse` (paginated, most recent first, max 20/page, returns `{ data, page, totalPages, total }`); `search` (`q` 1–200 chars, case-insensitive `$or` over `companyName`/`tagline`/`description`, up to 50 results sorted alphabetically by `companyName`); `filter` (`industry[]` and `fundingStage[]` via `$in`, combine all active filters, clearing all filters returns the unfiltered list); `getById` (return one by id, 404 if missing, accessible to Founder and Investor)
    - _Requirements: 8.1, 8.3, 9.1, 10.1, 10.2, 10.3, 10.5, 11.1, 11.3_

  - [~] 7.2 Create discovery routes
    - Create `server/src/routes/discoveryRoutes.js`: GET `/api/discover`, GET `/api/discover/search`, GET `/api/discover/filter` (behind `authenticate` + `authorize('Investor')`); GET `/api/discover/:id` (behind `authenticate`, both roles)
    - _Requirements: 8, 9, 10, 11, 3.3_

  - [ ]* 7.3 Write property test for pagination correctness and ordering
    - **Property 12: Pagination correctness and ordering**
    - Use `fast-check` (db-backed) with arbitrary dataset sizes and page numbers; assert at most 20 per page ordered by most recently created first, with `skip = (page - 1) * limit`, `totalPages = ceil(total / limit)`, and `total` equal to the dataset size
    - **Validates: Requirements 8.1, 8.3**

  - [ ]* 7.4 Write property test for search correctness
    - **Property 13: Search correctness**
    - Use `fast-check` (db-backed) with 1–200 char queries and varied datasets; assert at most 50 results, each containing the query case-insensitively within `companyName`/`tagline`/`description`, ordered alphabetically by `companyName`
    - **Validates: Requirements 9.1**

  - [ ]* 7.5 Write property test for filter correctness and reset
    - **Property 14: Filter correctness and reset**
    - Use `fast-check` (db-backed) with arbitrary industry and funding-stage filter combinations; assert every returned profile matches all active filters (industry AND funding stage); with no active filters or after clearing all, the returned set equals the full unfiltered list
    - **Validates: Requirements 10.1, 10.2, 10.3, 10.5**

- [ ] 8. Implement the shortlist service (investor)
  - [~] 8.1 Create the shortlist controller
    - Create `server/src/controllers/shortlistController.js`: `list` (populate startups); `add` (investor-only, 404 if startup missing, idempotent — if already present return "already in shortlist" success without a duplicate, else add and return success identifying the startup); `remove` (investor-only, reject with "not in shortlist" if absent, else remove and return success)
    - _Requirements: 12.1, 12.2, 12.3, 12.5, 12.6, 13.1_

  - [~] 8.2 Create shortlist routes
    - Create `server/src/routes/shortlistRoutes.js`: GET `/api/shortlist`, POST `/api/shortlist/:startupId`, DELETE `/api/shortlist/:startupId` — all behind `authenticate` + `authorize('Investor')`
    - _Requirements: 12.4, 13_

  - [ ]* 8.3 Write property test for idempotent shortlist add
    - **Property 15: Shortlist add is idempotent**
    - Use `fast-check` (db-backed) to add an existing startup not yet shortlisted and assert a success confirmation plus exactly one reference in the shortlist; add an already-present startup and assert a success "already in shortlist" response with the shortlist size unchanged (no duplicate)
    - **Validates: Requirements 12.1, 12.2**

  - [ ]* 8.4 Write property test for shortlist remove correctness
    - **Property 16: Shortlist remove correctness**
    - Use `fast-check` (db-backed) to remove a present startup and assert a success confirmation and the shortlist no longer contains it; remove an absent startup and assert a "not in shortlist" error with the shortlist unchanged
    - **Validates: Requirements 12.3, 12.6**

  - [ ]* 8.5 Write integration test for adding a nonexistent startup to the shortlist
    - Assert adding a nonexistent startup id returns a 404 not-found error (db-backed, controller-level)
    - **Validates: Requirements 12.5**

- [ ] 9. Wire the server app together
  - [~] 9.1 Complete the Express app
    - Complete `server/src/app.js`: mount `authRoutes`, `startupRoutes`, `discoveryRoutes`, `shortlistRoutes` under `/api`, attach the `errorHandler` as the terminal middleware, connect to MongoDB on startup, and listen on `PORT`; ensure the app is exported for supertest
    - _Requirements: all server endpoints (wiring)_

- [~] 10. Checkpoint - Ensure all server tests pass
  - Run server tests (`npm test -- --run` in `server/`); ensure all property, integration, and unit tests pass. Ask the user if questions arise.

- [ ] 11. Build the client foundation (api client, auth context, shared UI components)
  - [~] 11.1 Create the API client
    - Create `client/src/api/client.js`: an axios instance with a request interceptor attaching `Authorization: Bearer <token>` from the stored token, and a response interceptor that on 401 clears the stored token/user, shows a "Your session has expired" message, and redirects to `/login`, and on non-2xx/network errors surfaces a non-technical message
    - _Requirements: 2.3, 2.4, 15.2, 15.3_

  - [~] 11.2 Create the auth context and hook
    - Create `client/src/context/AuthContext.jsx` (holds `user`, `token`, `login`, `register`, `logout`; persists the token in localStorage) and `client/src/hooks/useAuth.js`
    - _Requirements: 2.3, 2.4_

  - [~] 11.3 Create shared UI components
    - Create `client/src/components/ui/`: `Button`, `ErrorMessage` (non-technical error text), `EmptyState` (founder "create a profile", investor "browse startups", list "none available"), `Pagination` (controls only when total > 20), `ConfirmDialog` (delete confirmation), `Spinner`
    - _Requirements: 7.3, 7.4, 8.4, 8.5, 13.3, 15.2_

  - [~] 11.4 Create form components
    - Create `client/src/components/forms/`: `FormField` (label + input + inline error, supporting onBlur validation and server-error display) and `AuthForm` (register/login shared fields + role selection)
    - _Requirements: 14.1, 14.5, 14.6_

  - [~] 11.5 Create startup components
    - Create `client/src/components/startups/`: `StartupCard` (company name, tagline, industry, funding stage, funding required), `SearchBar` (text input with 1–200 char client validation), `FilterPanel` (multi-select industry + funding stage with a "clear all" reset)
    - _Requirements: 8.2, 9.3, 10.5_

  - [~] 11.6 Create layout components
    - Create `client/src/components/layout/`: `Navbar` (responsive; below 768px a collapsible menu collapsed by default with a toggle, showing role-appropriate links), `Footer`, `Layout`
    - _Requirements: 16.1, 16.2, 16.4_

- [ ] 12. Build auth and startup form pages
  - [~] 12.1 Create Register and Login pages
    - Create `client/src/pages/Register.jsx` (role selection + signup with client validation, server 400 errors mapped to fields) and `client/src/pages/Login.jsx` (credentials login rendering the generic login error)
    - _Requirements: 1, 2.2, 14.1, 14.5_

  - [~] 12.2 Create the StartupForm page
    - Create `client/src/pages/StartupForm.jsx` (shared create/edit form with client validation before submit and server 400 errors mapped to fields)
    - _Requirements: 4, 5, 14.1, 14.5, 14.6_

  - [ ]* 12.3 Write example tests for form validation UI
    - Assert submission is blocked with field-specific errors when required fields are missing/invalid; server 400 `ValidationError` entries are mapped onto the corresponding form fields; onBlur validation displays a field-specific error without requiring submission
    - **Validates: Requirements 14.1, 14.5, 14.6**

  - [ ]* 12.4 Write example test for the generic login error
    - Assert the Login page renders the single generic authentication error message (no field-specific distinction)
    - **Validates: Requirements 2.2**

- [ ] 13. Build the founder dashboard
  - [~] 13.1 Create the FounderDashboard page
    - Create `client/src/pages/FounderDashboard.jsx`: list owned startups showing company name, create/edit/delete controls, empty-state prompt when none exist, delete confirmation prompt, navigation to the StartupForm on create/edit, and list refresh after create/edit/delete mutations
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_

  - [ ]* 13.2 Write example tests for the founder dashboard UI
    - Assert the owned-startup list shows company names; create/edit/delete controls are present; empty-state prompt appears when none; delete confirmation appears; navigation to the form works; the list refreshes after a mutation
    - **Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.5, 7.6**

- [ ] 14. Build browse and startup details pages
  - [~] 14.1 Create the Browse page
    - Create `client/src/pages/Browse.jsx`: paginated startup list using `StartupCard`, `SearchBar`, `FilterPanel`, `Pagination` (only when total > 20), an empty "none available" message, a "could not be loaded" message on failed fetch, and no-results/no-match messages for search and filters
    - _Requirements: 8.2, 8.4, 8.5, 8.6, 9.2, 10.4_

  - [~] 14.2 Create the StartupDetails page
    - Create `client/src/pages/StartupDetails.jsx`: render all nine fields; show a not-found message on 404; allow both Founder and Investor to view; deny an unknown role with a restricted-access message; render null/empty optional fields as empty
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

  - [ ]* 14.3 Write example tests for browse, search/filter, and details UI
    - Assert a browse card shows the five required fields; pagination controls appear only when total > 20; empty "none available" and "could not be loaded" messages; search no-results and filter no-match messages; details page renders all nine fields, the 404 not-found message, both-role access, unknown-role denial, and empty optional fields rendered as empty
    - **Validates: Requirements 8.2, 8.4, 8.5, 8.6, 9.2, 10.4, 11.1, 11.2, 11.3, 11.4, 11.5**

- [ ] 15. Build the investor dashboard
  - [~] 15.1 Create the InvestorDashboard page
    - Create `client/src/pages/InvestorDashboard.jsx`: render the investor's shortlisted startups, a remove control per item, an empty-state prompt to browse startups, removal that updates the displayed list, rollback that retains the item and shows an error on failed removal, and a "could not be loaded" message on failed load
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6_

  - [ ]* 15.2 Write example tests for the investor dashboard UI and failure rollback
    - Assert the shortlist renders; a remove control is present; the empty-state prompt appears when empty; removal updates the list; a failed removal retains the item and shows an error; a failed load shows "could not be loaded"
    - **Validates: Requirements 13.1, 13.2, 13.3, 13.4, 13.5, 13.6**

- [ ] 16. Wire the client app together and verify auth flows
  - [~] 16.1 Complete the App routing
    - Complete `client/src/App.jsx`: create `ProtectedRoute` (redirect to `/login` when no token) and `RoleRoute` (deny on role mismatch), define routes for all pages (public Register/Login; protected FounderDashboard, StartupForm; Investor Browse, InvestorDashboard; both-role StartupDetails), and mount the `Layout` with the responsive `Navbar`
    - _Requirements: 3.4, 11.4_

  - [ ]* 16.2 Write example tests for auth flows and routing guards
    - Assert the token is stored after login; the `Authorization` header is attached to protected requests; a missing token redirects to `/login` instead of a protected page; an expired/invalid JWT shows a session-expired message and redirects to `/login`
    - **Validates: Requirements 2.3, 2.4, 3.4, 15.3**

- [ ] 17. Responsive UI verification
  - [ ]* 17.1 Write responsive smoke tests
    - Render all pages at mobile (<768px), tablet (768–1023px), and desktop (≥1024px) and verify no horizontal scrolling and all interactive elements remain visible/unclipped; at <768px assert the nav renders as a menu collapsed by default with full links hidden, forms fit with all inputs/labels/submit visible, and toggling the nav expands/collapses the links
    - **Validates: Requirements 16.1, 16.2, 16.3, 16.4**

- [~] 18. Final checkpoint - Ensure all tests pass
  - Run server tests (`npm test -- --run` in `server/`) and client tests (`npm test -- --run` in `client/`); ensure all property, integration, unit, example, and smoke tests pass. Ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP; core implementation tasks (no `*`) must be implemented.
- Server property/integration tests are db-backed via `mongodb-memory-server` and run with Jest; client example/smoke tests run with Vitest (`--run`, not watch) and React Testing Library.
- Each property test is implemented as a single `fast-check` property test with ≥100 runs and tagged `Feature: startup-fund, Property {n}: {text}`.
- Each task references specific requirements for traceability; checkpoints ensure incremental validation.
- Property tests validate universal correctness properties; unit/example/integration tests validate specific examples, edge cases, UI interactions, and one-shot side effects.
- The server and client tracks are independent during development (the client uses mocked/stubbed API responses), so their tasks run in parallel where the dependency graph allows.
- Property test sub-tasks are placed close to the code they test so errors are caught early.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2"] },
    { "id": 1, "tasks": ["2.1", "2.2", "3.1", "4.1", "4.2", "4.3", "4.4", "11.1", "11.3"] },
    { "id": 2, "tasks": ["2.3", "2.4", "2.5", "2.6", "2.7", "3.2", "3.3", "3.4", "5.1", "6.1", "7.1", "8.1", "11.2", "11.5"] },
    { "id": 3, "tasks": ["3.5", "3.6", "3.7", "5.2", "6.2", "7.2", "7.3", "7.4", "7.5", "8.2", "8.3", "8.4", "8.5", "11.4", "11.6", "13.1", "14.1", "14.2", "15.1"] },
    { "id": 4, "tasks": ["5.3", "5.4", "5.5", "5.6", "6.3", "6.4", "6.5", "6.6", "6.7", "6.8", "12.1", "12.2", "13.2", "14.3", "15.2"] },
    { "id": 5, "tasks": ["9.1", "12.3", "12.4", "16.1"] },
    { "id": 6, "tasks": ["16.2", "17.1"] }
  ]
}
```
