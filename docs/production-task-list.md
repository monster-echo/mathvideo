# AnimG Production Task List

## Phase 1: Core Hardening (in progress)

### 1. API security baseline
- [x] Add input schema validation on `POST /api/prompt`.
- [x] Add input schema validation on `POST /api/aha-offer`.
- [x] Add input schema validation on `POST /api/leads`.
- [x] Add per-IP rate limiting for `prompt` route.
- [x] Add per-IP rate limiting for `aha-offer` route.
- [x] Add per-IP rate limiting for `leads` route.
- [x] Return consistent `429` errors and standard rate-limit headers.

### 2. AI gateway reliability
- [x] Validate external AI payload shape strictly.
- [x] Distinguish fallback reasons (`not_configured`, `timeout`, `http_error`, `schema_invalid`).
- [x] Emit structured server logs for upstream failure cases.

### 3. Conversion correctness
- [x] Fix persona hardcoding in creator flow.
- [x] Pass persona to both `/api/prompt` and `/api/aha-offer`.
- [x] Add role selector in creator workbench UI.

### 4. Theme system
- [x] Add explicit Light/Dark toggle in header.
- [x] Persist theme in localStorage.
- [x] Add pre-hydration theme init script to reduce flash.

### 5. Firebase observability
- [x] Warn when Firebase Admin env vars are missing in runtime.
- [x] Log event-write failures instead of silent no-op.

## Phase 2: Product-Ready Billing & Access Control

### 1. Authentication/session
- [x] Exchange Firebase ID token to secure session cookie.
- [x] Add server-side auth guard for paid features and private data routes.
- [x] Attach user identity to analytics and billing context.

### 2. Billing
- [x] Integrate Stripe Checkout sessions for each paid plan.
- [x] Implement webhook handler (`checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`).
- [x] Persist subscription status in Firestore and expose entitlement checks.
- [x] Enforce paywall by entitlement on export/download/render priority features.

## Phase 3: Playground Real Runtime

### 0. Delivered prototype layer
- [x] Add async render job API (`POST/GET /api/renders`) with queued/running/succeeded/failed lifecycle.
- [x] Bind playground UI to create jobs and poll status.
- [x] Add log panel, status panel, and export-trigger paywall entry.
- [ ] Replace in-memory job store with persistent queue/worker infrastructure.

### 1. Render pipeline
- [x] Add `POST /api/renders` for async jobs.
- [x] Add job status polling endpoint.
- [x] Persist render jobs (`queued/running/succeeded/failed`) in Firestore (fallback to in-memory when Firebase Admin is absent).
- [ ] Return render logs and output asset URLs.

### 2. UX workflow
- [x] Replace static code block with editable code editor.
- [x] Bind render button to real job creation.
- [x] Bind preview block to actual video output.
- [x] Add run history with replay and retry.

### 3. Safety
- [ ] Execute Manim in isolated runtime (container/sandbox).
- [ ] Set CPU/memory/time quotas and rejection policy.

## Phase 4: Release Engineering

### 1. Testing
- [x] Add route-level tests for prompt/aha/leads validation + rate limits (current scope: prompt/renders/billing checkout).
- [ ] Add one conversion E2E flow (creator -> aha -> pricing/checkout).
- [ ] Add one playground render E2E flow.

### 2. CI/CD
- [x] Add GitHub Actions for lint/typecheck/test/build.
- [ ] Configure preview and production deployments.
- [ ] Add rollback procedure and post-deploy smoke checks.

### 3. Monitoring
- [ ] Add Sentry for runtime/API exception tracking.
- [ ] Add analytics funnel dashboard (visit -> prompt -> aha -> upgrade -> paid).
- [ ] Add alert rules for API error-rate and payment webhook failures.
