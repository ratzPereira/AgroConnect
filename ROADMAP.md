# ROADMAP.md — AgroConnect Development Plan

> **This document defines every deliverable, in order, with acceptance criteria.**
> **Follow it sequentially. Do not skip ahead. Each task builds on the previous.**
> **When starting a new task, re-read CLAUDE.md first.**

---

## University Phases Overview

| Phase | University Deliverable | Sprints | Focus |
|-------|----------------------|---------|-------|
| Fase 1 — Proposta inicial | Technical proposal document | Sprint 0 + Sprint 1 | Infrastructure + Auth |
| Fase 2 — Relatório intermédio | Working prototype with core flow | Sprint 2 + Sprint 3 | Requests + Proposals + Payments |
| Fase 3 — Relatório final | Feature-complete application | Sprint 4 + Sprint 5 | Backoffice + Execution + Admin |
| Fase 4 — Defesa | Live demo + final report | Sprint 6 | Polish + Docs + Presentation |

---

## Priority Tiers (If Time Runs Short)

**P0 — Must have (grade ≥ 16):** Auth, requests CRUD, proposals, geolocation, basic escrow (wallet only), request state machine, basic ratings, Docker Compose, Swagger docs.

**P1 — Should have (grade ≥ 18):** Stripe Connect integration, provider backoffice (teams, machines, inventory), execution with GPS check-in and photo upload, WebSocket notifications, admin dashboard, CI/CD pipeline.

**P2 — Nice to have (grade = 20):** Grafana dashboards with business metrics, load tests with k6, full chat between client/provider, recurring service packages, financial reports PDF export, SonarQube integration in pipeline.

**Rule: Never start a P1 task until all P0 tasks in the current sprint are done. Never start P2 until all P1 are done.**

---

# ═══════════════════════════════════════════
# SPRINT 0 — Project Foundation (Weeks 1-2)
# ═══════════════════════════════════════════

> **Goal:** One command (`docker compose up`) boots the entire stack. CI pipeline runs. Database has schema and seed data. Swagger UI loads.

---

### Task 0.1 — Initialize Backend Project

**What:** Create Spring Boot 3 project with Maven.

**Dependencies (pom.xml):**
- spring-boot-starter-web
- spring-boot-starter-data-jpa
- spring-boot-starter-security
- spring-boot-starter-validation
- spring-boot-starter-websocket
- spring-boot-starter-actuator (metrics for Prometheus)
- springdoc-openapi-starter-webmvc-ui (Swagger)
- postgresql (driver)
- hibernate-spatial (PostGIS support)
- org.locationtech.jts:jts-core (geometry types)
- flyway-core + flyway-database-postgresql
- lombok
- jjwt-api + jjwt-impl + jjwt-jackson (JWT)
- spring-boot-starter-data-redis
- io.minio:minio (MinIO SDK)
- stripe-java (Stripe SDK)
- spring-boot-starter-test
- org.testcontainers:postgresql
- org.testcontainers:junit-jupiter

**Configuration files:**
- `application.yml` — common config, profile-agnostic
- `application-dev.yml` — local dev (Docker service URLs, debug logging)
- `application-prod.yml` — production-like (env vars for all secrets)

**Acceptance criteria:**
- [ ] `mvn compile` succeeds with zero errors
- [ ] `mvn test` runs (even if no tests yet)
- [ ] Application starts and Swagger UI loads at `/swagger-ui.html`
- [ ] Actuator health endpoint responds at `/actuator/health`
- [ ] Package structure matches CLAUDE.md section 1

---

### Task 0.2 — Initialize Frontend Project

**What:** Create React 18 + TypeScript + Vite project.

**Dependencies (package.json):**
- react, react-dom, react-router-dom
- typescript
- @tanstack/react-query (server state)
- zustand (client state)
- react-hook-form + @hookform/resolvers + zod (forms)
- axios (HTTP client)
- tailwindcss + postcss + autoprefixer
- react-leaflet + leaflet + @types/leaflet (maps)
- lucide-react (icons)
- clsx + tailwind-merge (className utility)
- date-fns (date formatting)
- vitest + @testing-library/react + @testing-library/jest-dom + msw

**Setup:**
- Tailwind config with custom color palette matching AgroConnect brand (greens, earth tones)
- TypeScript strict mode enabled
- Path aliases: `@/` → `src/`
- ESLint + Prettier configured
- Axios instance with base URL, JWT interceptor skeleton
- React Router with placeholder routes: `/`, `/login`, `/register`, `/dashboard`, `/requests`

**Acceptance criteria:**
- [ ] `npm run build` succeeds with zero errors
- [ ] `npm run dev` serves app on localhost
- [ ] Tailwind classes render correctly
- [ ] React Router navigates between placeholder pages
- [ ] TypeScript strict mode — no `any` anywhere

---

### Task 0.3 — Docker Compose Setup

**What:** Create Docker Compose orchestration for all services.

**Services in `docker-compose.dev.yml`:**

| Service | Image/Build | Ports | Notes |
|---------|-------------|-------|-------|
| `postgres` | postgis/postgis:16-3.4 | 5432:5432 | With PostGIS extension enabled |
| `redis` | redis:7-alpine | 6379:6379 | Used for cache and pub/sub |
| `minio` | minio/minio | 9000:9000, 9001:9001 | S3-compatible storage |
| `backend` | Build from `docker/backend/Dockerfile` | 8080:8080, 5005:5005 | Debug port 5005 |
| `frontend` | Build from `docker/frontend/Dockerfile` | 3000:3000 | Vite dev server |
| `nginx` | nginx:alpine | 80:80 | Reverse proxy |

**For `docker-compose.yml` (prod-like):** same services but multi-stage builds, no debug ports, no volume mounts for source code.

**Nginx config (`docker/nginx/nginx.conf`):**
```
/ → frontend (serve static files)
/api/* → backend:8080
/ws/* → backend:8080 (WebSocket upgrade)
/swagger-ui.html → backend:8080
/v3/api-docs/* → backend:8080
```

**Critical: Nginx is the ONLY exposed port (80). Frontend and backend are internal.**

**.env file:**
```
POSTGRES_DB=agroconnect
POSTGRES_USER=agroconnect
POSTGRES_PASSWORD=dev_password_123
REDIS_HOST=redis
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=minioadmin
JWT_SECRET=dev-jwt-secret-at-least-256-bits-long-for-hs256
STRIPE_SECRET_KEY=sk_test_placeholder
STRIPE_WEBHOOK_SECRET=whsec_placeholder
```

**Acceptance criteria:**
- [ ] `docker compose -f docker-compose.dev.yml up` starts all services
- [ ] `curl http://localhost/api/actuator/health` returns `{"status":"UP"}`
- [ ] `curl http://localhost/` returns React app HTML
- [ ] `http://localhost/swagger-ui.html` loads Swagger UI
- [ ] PostgreSQL has PostGIS extension: `SELECT PostGIS_Version();` works
- [ ] MinIO console accessible at `localhost:9001`
- [ ] All services have healthchecks and restart policies

---

### Task 0.4 — Database Schema (Flyway Migrations)

**What:** Create all Flyway migration files for the complete database schema.

**Migration files (in execution order):**

**V1__create_users.sql**
```sql
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(30) NOT NULL, -- ADMIN, CLIENT, PROVIDER_MANAGER, PROVIDER_LEAD, PROVIDER_OPERATOR
    email_verified BOOLEAN DEFAULT FALSE,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
```

**V2__create_client_profiles.sql**
- Fields: user_id (FK, UNIQUE), name, phone, location (GEOMETRY(Point, 4326)), farm_type, total_area_ha, profile_photo_url, bio
- Index on location (GiST)

**V3__create_provider_profiles.sql**
- Fields: user_id (FK, UNIQUE), company_name, nif, phone, location (GEOMETRY(Point, 4326)), service_radius_km, avg_rating, total_reviews, profile_photo_url, bio, verified
- Index on location (GiST), nif (UNIQUE)

**V4__create_service_categories.sql**
- Fields: id, name, slug (UNIQUE), description, icon_url, pricing_models (TEXT[] — array of allowed models), form_schema (JSONB — dynamic form definition), active, sort_order
- Seed initial categories in same migration

**V5__create_provider_services.sql**
- Join table: provider_id (FK) + category_id (FK) — which categories a provider offers
- UNIQUE constraint on (provider_id, category_id)

**V6__create_service_requests.sql**
- Fields: id, client_id (FK), category_id (FK), status VARCHAR(30), title, description, location (GEOMETRY(Point, 4326)), area, area_unit, urgency (LOW/MEDIUM/HIGH), preferred_date_from, preferred_date_to, form_data (JSONB — answers to category-specific form), expires_at, created_at, updated_at
- Indexes: status, client_id, location (GiST), created_at, expires_at
- CHECK constraint: status IN valid values

**V7__create_request_photos.sql**
- Fields: id, request_id (FK), photo_url, sort_order, uploaded_at
- Max 10 photos per request (enforced in application)

**V8__create_proposals.sql**
- Fields: id, request_id (FK), provider_id (FK), status (PENDING/ACCEPTED/REJECTED/WITHDRAWN), price, pricing_model (FIXED/PER_UNIT/RECURRING), unit_price, estimated_units, description, includes_text, excludes_text, estimated_date, valid_until, created_at, updated_at
- UNIQUE constraint on (request_id, provider_id) — one proposal per provider per request
- Indexes: request_id, provider_id, status

**V9__create_transactions.sql**
- Fields: id, request_id (FK, UNIQUE), proposal_id (FK), amount, commission_rate, commission_amount, provider_payout, status (PENDING/HELD/RELEASED/REFUNDED/PARTIALLY_REFUNDED), stripe_payment_intent_id, stripe_transfer_id, held_at, released_at, refunded_at, created_at
- Index: status

**V10__create_team_members.sql**
- Fields: id, provider_id (FK), user_id (FK, NULLABLE — invited but not registered yet), name, email, phone, role (MANAGER/LEAD/OPERATOR), active, invited_at, joined_at
- UNIQUE on (provider_id, email)

**V11__create_machines.sql**
- Fields: id, provider_id (FK), name, type, description, status (AVAILABLE/IN_USE/MAINTENANCE/RETIRED), license_plate, last_maintenance_date, next_maintenance_date, created_at
- Index: provider_id, status

**V12__create_inventory.sql**
- Fields: id, provider_id (FK), product_name, unit (KG/L/UNIT), quantity, min_stock_alert, cost_per_unit, created_at, updated_at
- Index: provider_id

**V13__create_service_executions.sql**
- Fields: id, proposal_id (FK, UNIQUE), checkin_location (GEOMETRY(Point, 4326)), checkin_time, checkout_time, notes, materials_used (JSONB), completed_at, created_at
- Index: proposal_id

**V14__create_execution_assignments.sql**
- Join table: execution_id (FK) + team_member_id (FK) + machine_id (FK, NULLABLE)
- Tracks who was assigned with which machine

**V15__create_execution_photos.sql**
- Fields: id, execution_id (FK), photo_url, location (GEOMETRY(Point, 4326)), taken_at, uploaded_at
- Geolocated proof of execution

**V16__create_reviews.sql**
- Fields: id, request_id (FK), author_id (FK users), target_id (FK users), rating (1-5), comment, created_at
- UNIQUE on (request_id, author_id) — one review per party per request
- CHECK: rating BETWEEN 1 AND 5

**V17__create_notifications.sql**
- Fields: id, user_id (FK), type, title, body, data (JSONB), read BOOLEAN DEFAULT FALSE, created_at
- Index: user_id, read, created_at DESC

**V18__create_chat_messages.sql**
- Fields: id, request_id (FK), sender_id (FK), content, sent_at
- Index: request_id, sent_at

**V19__create_audit_log.sql**
- Fields: id, user_id (FK NULLABLE), action, entity_type, entity_id, old_data (JSONB), new_data (JSONB), ip_address, timestamp
- IMMUTABLE — no UPDATE or DELETE allowed (enforce via application)
- Index: entity_type + entity_id, user_id, timestamp

**V20__create_refresh_tokens.sql**
- Fields: id, user_id (FK), token_hash, expires_at, revoked BOOLEAN DEFAULT FALSE, created_at
- Index: token_hash, user_id

**Acceptance criteria:**
- [ ] `docker compose up` → Flyway runs all migrations successfully
- [ ] `\dt` in psql shows all tables
- [ ] PostGIS geometry columns work: `SELECT ST_AsText(ST_MakePoint(-27.2167, 38.6667));`
- [ ] JSONB columns accept valid JSON
- [ ] All indexes created
- [ ] All foreign keys and constraints in place

---

### Task 0.5 — Seed Data

**What:** Create `V999__seed_data.sql` with realistic demo data contextualized in the Azores.

**Data to include:**

**Users (10+):**
- 1 admin
- 4 clients (farmers with different profiles across Terceira, São Miguel)
- 3 provider managers (agricultural service companies)
- 2 provider operators

**Client profiles with real Azores locations:**
- Angra do Heroísmo (Terceira): -27.2167, 38.6667
- Praia da Vitória (Terceira): -27.0667, 38.7333
- Ponta Delgada (São Miguel): -25.6667, 37.7333
- Ribeira Grande (São Miguel): -25.5167, 37.8167

**Provider profiles:**
- "AgroServiços Terceira Lda" — radius 40km, based in Angra
- "Verde Açores — Serviços Agrícolas" — radius 50km, based in Ponta Delgada
- "João Silva — Jardinagem e Manutenção" — radius 15km, based in Praia da Vitória

**9 Service Categories** (with form_schema JSONB):
- Preparação de Solo, Tratamentos, Colheita, Transporte, Limpeza de Terreno, Vedação, Rega, Jardinagem, Outros

**Service requests (8+):**
- Mix of statuses: PUBLISHED, WITH_PROPOSALS, AWARDED, COMPLETED, RATED
- Realistic descriptions in Portuguese
- Market-realistic prices (e.g., lavoura: €80-120/hectare, jardinagem: €60-100/visita)

**Proposals, reviews, team members, machines, inventory items.**

**All passwords:** `$2a$12$...` bcrypt hash of `password123` (for dev/demo only).

**Acceptance criteria:**
- [ ] Seed runs without errors
- [ ] Swagger UI can query seeded data via endpoints (once built)
- [ ] Map visualization shows pins in real Azores locations
- [ ] Data is realistic enough for a convincing demo

---

### Task 0.6 — CI/CD Pipeline

**What:** GitHub Actions workflow that runs on push to `main` and on pull requests.

**Pipeline steps:**
1. Checkout code
2. Set up Java 17 + Node 20
3. Backend: `mvn verify` (compile + test)
4. Frontend: `npm ci && npm run build && npm run test`
5. Docker: build images (don't push — just validate they build)
6. Upload test reports as artifacts

**File:** `.github/workflows/ci.yml`

**Acceptance criteria:**
- [ ] Pipeline YAML is valid
- [ ] Would run successfully if pushed (verify locally with `act` if possible)
- [ ] Fails fast on compilation errors or test failures

---

# ═══════════════════════════════════════════
# SPRINT 1 — Authentication & Profiles (Weeks 3-5)
# ═══════════════════════════════════════════

> **Goal:** Users can register, login, get JWT tokens, refresh them. Profiles are created. RBAC works on every endpoint.

---

### Task 1.1 — JWT Authentication System

**What:** Complete auth flow: register → verify email (skip for now, auto-verify) → login → get tokens → refresh → logout.

**Endpoints:**
- `POST /api/v1/auth/register` — create user + profile (client or provider)
- `POST /api/v1/auth/login` — returns { accessToken, refreshToken, user }
- `POST /api/v1/auth/refresh` — exchange refresh token for new access token
- `POST /api/v1/auth/logout` — revoke refresh token

**Implementation details:**
- `JwtService` — generate/validate access tokens (15min) and refresh tokens (7 days)
- `JwtAuthenticationFilter` — extract token from `Authorization: Bearer ...` header
- `UserPrincipal` — implements `UserDetails`, used in `@AuthenticationPrincipal`
- `SecurityConfig` — permit auth endpoints, require auth for everything else
- Refresh tokens stored in DB (hashed), revocable
- Registration creates User + ClientProfile or ProviderProfile in a single transaction

**Tests:**
- Unit: `JwtServiceTest` — token generation, validation, expiration
- Unit: `AuthServiceTest` — register (happy path, duplicate email), login (valid, invalid password)
- Integration: `AuthControllerIT` — full flow: register → login → access protected endpoint → refresh → logout

**Acceptance criteria:**
- [ ] Register creates user and returns tokens
- [ ] Login with valid credentials returns tokens
- [ ] Login with invalid credentials returns 401
- [ ] Access token grants access to protected endpoints
- [ ] Expired access token returns 401
- [ ] Refresh token returns new access token
- [ ] Logout revokes refresh token
- [ ] Swagger documents all auth endpoints with examples

---

### Task 1.2 — User Profiles CRUD

**What:** Client and provider profiles with full CRUD.

**Endpoints:**
- `GET /api/v1/users/me` — current user profile
- `PUT /api/v1/users/me` — update own profile
- `GET /api/v1/providers/{id}` — public provider profile (name, rating, services, no sensitive data)
- `GET /api/v1/providers?lat=X&lng=Y&radius=Z` — find providers near location (PostGIS)

**PostGIS query for nearby providers:**
```sql
SELECT p.* FROM provider_profiles p
WHERE ST_DWithin(
    p.location::geography,
    ST_MakePoint(:lng, :lat)::geography,
    :radiusMeters
)
AND p.verified = true
ORDER BY ST_Distance(p.location::geography, ST_MakePoint(:lng, :lat)::geography)
```

**Tests:**
- Unit: profile update validation, provider search logic
- Integration: geo query returns correct providers within radius, ignores providers outside

**Acceptance criteria:**
- [ ] Client can view and update own profile
- [ ] Provider can view and update own profile including service radius
- [ ] Public provider profile hides sensitive fields (email, NIF)
- [ ] Geo search returns only providers within specified radius
- [ ] Geo search orders by distance (nearest first)
- [ ] Swagger documents all profile endpoints

---

### Task 1.3 — RBAC Enforcement

**What:** Role-based access control on every endpoint.

**Implementation:**
- Custom `@PreAuthorize` expressions or method-level security
- `OwnershipChecker` service — validates that user owns the resource they're accessing
- Admin can access everything
- Client: own requests, own proposals (view only), own reviews
- Provider Manager: own company's proposals, team, machines, inventory
- Provider Lead: assigned operations only
- Provider Operator: assigned tasks only

**Tests:**
- Integration: client cannot access provider-only endpoints (403)
- Integration: provider cannot create requests (403)
- Integration: client A cannot see client B's requests (403 or 404)

**Acceptance criteria:**
- [ ] Every endpoint enforces role check
- [ ] Ownership is verified (client sees only own data)
- [ ] 403 returned for unauthorized access (not 500)
- [ ] Admin bypass works for all endpoints

---

### Task 1.4 — Service Categories CRUD (Admin)

**What:** Admin can manage service categories (CRUD). Public can list them.

**Endpoints:**
- `GET /api/v1/categories` — public, list all active categories
- `GET /api/v1/categories/{id}` — public, category detail with form_schema
- `POST /api/v1/categories` — admin only, create category
- `PUT /api/v1/categories/{id}` — admin only, update category
- `DELETE /api/v1/categories/{id}` — admin only, soft delete

**The `form_schema` JSONB defines the dynamic form for each category:**
```json
{
  "fields": [
    { "name": "area", "label": "Área aproximada", "type": "number", "unit": "hectares", "required": true },
    { "name": "terrain_type", "label": "Tipo de terreno", "type": "select", "options": ["Plano", "Inclinado", "Pedregoso"], "required": true },
    { "name": "accessibility", "label": "Acessibilidade", "type": "select", "options": ["Estrada alcatroada", "Caminho de terra", "Sem acesso direto"], "required": false }
  ]
}
```

**Acceptance criteria:**
- [ ] Categories seeded from V999 migration load correctly
- [ ] Public can list and view categories
- [ ] Admin can CRUD categories
- [ ] form_schema is valid JSON and returned in category detail
- [ ] Frontend can render dynamic form from form_schema (later sprint)

---

# ═══════════════════════════════════════════
# SPRINT 2 — Requests & Proposals (Weeks 6-8)
# ═══════════════════════════════════════════

> **Goal:** The core marketplace flow works: client creates a geolocated request, providers see it, submit proposals, client compares and accepts one.

---

### Task 2.1 — Service Requests CRUD

**What:** Clients create, view, edit, and cancel service requests.

**Endpoints:**
- `POST /api/v1/requests` — create (status: DRAFT)
- `GET /api/v1/requests` — list own requests (client) or nearby requests (provider)
- `GET /api/v1/requests/{id}` — detail (with photos, form_data)
- `PUT /api/v1/requests/{id}` — update (only in DRAFT status)
- `POST /api/v1/requests/{id}/publish` — change status DRAFT → PUBLISHED
- `POST /api/v1/requests/{id}/cancel` — cancel (any non-terminal status)
- `POST /api/v1/requests/{id}/photos` — upload photos (multipart, stored in MinIO)

**Provider view:** Providers see PUBLISHED/WITH_PROPOSALS requests within their service radius. PostGIS query filters by distance.

**Photo upload flow:**
1. Backend generates presigned MinIO URL
2. Frontend uploads directly to MinIO using presigned URL
3. Frontend confirms upload by sending photo URL to backend
4. Backend saves reference in `request_photos` table

**State transitions in this task:**
- DRAFT → PUBLISHED (via /publish endpoint)
- PUBLISHED → EXPIRED (via scheduled job — Task 2.4)
- Any → CANCELLED (via /cancel)

**Acceptance criteria:**
- [ ] Client creates request with form_data matching category schema
- [ ] Request has geolocation (lat/lng stored as PostGIS Point)
- [ ] Photos upload to MinIO and URLs are stored
- [ ] Provider sees only requests within their radius
- [ ] Provider does NOT see DRAFT or CANCELLED requests
- [ ] Request can be edited only in DRAFT status (400 otherwise)
- [ ] Cancel works from any non-terminal status
- [ ] State machine validates transitions (InvalidStateException for illegal ones)
- [ ] All endpoints in Swagger with full documentation

---

### Task 2.2 — Proposals System

**What:** Providers submit proposals on published requests. Clients compare and accept one.

**Endpoints:**
- `POST /api/v1/requests/{id}/proposals` — provider submits proposal
- `GET /api/v1/requests/{id}/proposals` — client sees all proposals on their request
- `GET /api/v1/providers/me/proposals` — provider sees their own proposals
- `POST /api/v1/proposals/{id}/accept` — client accepts (triggers state change)
- `POST /api/v1/proposals/{id}/withdraw` — provider withdraws own proposal

**Business logic on accept:**
1. Validate request is in PUBLISHED or WITH_PROPOSALS status
2. Change accepted proposal status to ACCEPTED
3. Change all other proposals on this request to REJECTED
4. Change request status to AWARDED
5. Notify rejected providers (create Notification records)
6. Trigger escrow (Task 3.1)

**State transitions:**
- PUBLISHED → WITH_PROPOSALS (automatic when first proposal arrives)
- WITH_PROPOSALS → AWARDED (when client accepts a proposal)

**Acceptance criteria:**
- [ ] Provider can only propose on PUBLISHED/WITH_PROPOSALS requests in their radius
- [ ] One proposal per provider per request (409 on duplicate)
- [ ] Client sees proposals with provider rating and history
- [ ] Accept auto-rejects all other proposals
- [ ] Accept changes request status to AWARDED
- [ ] Provider can withdraw before acceptance
- [ ] Notifications created for rejected providers
- [ ] All in Swagger

---

### Task 2.3 — Frontend: Request Creation Flow

**What:** Complete UI for creating a service request.

**Flow:**
1. Client clicks "Novo Pedido"
2. Step 1: Select category (grid of category cards with icons)
3. Step 2: Dynamic form rendered from category's `form_schema` (React Hook Form + Zod validates based on schema)
4. Step 3: Map (Leaflet) — client drops pin or types address → geocode to lat/lng
5. Step 4: Photo upload (drag & drop, up to 10 photos, preview thumbnails)
6. Step 5: Review & submit (summary of all info)
7. Status: DRAFT → can publish or save for later

**Frontend components:**
- `CategorySelector` — grid with category cards
- `DynamicForm` — renders form from JSONB schema (supports text, number, select, textarea, date)
- `LocationPicker` — Leaflet map with draggable pin + search
- `PhotoUploader` — drag & drop with MinIO presigned upload
- `RequestSummary` — review step before publish
- `RequestWizard` — stepper orchestrating all steps

**Acceptance criteria:**
- [ ] Wizard flows through all 5 steps
- [ ] Dynamic form validates according to schema (required fields, types)
- [ ] Map pin sets lat/lng correctly
- [ ] Photos upload to MinIO and show previews
- [ ] Request created in DRAFT, publish changes to PUBLISHED
- [ ] Mobile-responsive (PWA-friendly)

---

### Task 2.4 — Frontend: Proposals View & Comparison

**What:** Client views and compares proposals on their request.

**UI:**
- Request detail page shows list of proposals as cards
- Each proposal card: provider name, rating (stars), total reviews, price, description, includes/excludes, estimated date
- Sort by: price (low/high), rating, date
- "Accept" button on each card → confirm dialog → triggers accept flow
- Provider proposals page: list of sent proposals with status

**Acceptance criteria:**
- [ ] Proposals render with all relevant info
- [ ] Accept flow works with confirmation dialog
- [ ] Rejected proposals show as such (no actions available)
- [ ] Provider sees their proposals with current status

---

### Task 2.5 — Scheduled Jobs

**What:** Background jobs for time-based state changes.

**Jobs:**
- `RequestExpirationJob` — runs every hour. Finds PUBLISHED requests where `expires_at < NOW()` and no proposals → transition to EXPIRED.
- `ProposalExpirationJob` — runs every hour. Finds proposals where `valid_until < NOW()` and status is PENDING → transition to WITHDRAWN.

**Implementation:** `@Scheduled` with `@SchedulerLock` (ShedLock with Redis) to prevent duplicate execution in multi-instance deployments.

**Acceptance criteria:**
- [ ] Expired requests transition to EXPIRED automatically
- [ ] Expired proposals transition to WITHDRAWN automatically
- [ ] Jobs are idempotent (safe to run multiple times)
- [ ] Logged for debugging

---

# ═══════════════════════════════════════════
# SPRINT 3 — Payments & Execution (Weeks 9-11)
# ═══════════════════════════════════════════

> **Goal:** Money flows through the system. Work is documented. The cycle completes.

---

### Task 3.1 — Internal Wallet & Escrow

**What:** Wallet system as the payment abstraction layer.

**How it works:**
1. When client accepts a proposal, a Transaction is created with status HELD
2. The transaction amount = proposal price
3. Commission rate is read from system config (default 12%)
4. When client confirms completion (or 48h timeout), transaction changes to RELEASED
5. Provider payout = amount - commission
6. On dispute resolution: REFUNDED or PARTIALLY_REFUNDED

**This is the P0 payment system — works without Stripe for demo purposes.**

**Endpoints:**
- `GET /api/v1/transactions/me` — list own transactions (client or provider)
- `GET /api/v1/transactions/{id}` — transaction detail

**State transitions on request triggered by payment:**
- AWARDED + payment held → IN_PROGRESS
- AWAITING_CONFIRMATION + confirmed → COMPLETED (transaction RELEASED)
- AWAITING_CONFIRMATION + disputed → DISPUTED (transaction stays HELD)
- DISPUTED + admin resolves → COMPLETED/CANCELLED (transaction RELEASED/REFUNDED)

**Acceptance criteria:**
- [ ] Accepting a proposal creates a HELD transaction
- [ ] Confirming completion releases the transaction
- [ ] Commission calculated correctly
- [ ] 48h auto-confirm via scheduled job
- [ ] Dispute keeps money held
- [ ] Admin can resolve disputes (release or refund)
- [ ] Transaction history available for both parties

---

### Task 3.2 — Stripe Connect Integration (P1)

**What:** Stripe Connect in test mode as a real payment processor alongside the wallet.

**Flow:**
1. Provider onboards via Stripe Connect Express (onboarding link)
2. Client accepts proposal → Stripe PaymentIntent created (amount held)
3. On confirmation → Stripe Transfer to provider's connected account (minus commission)
4. Stripe webhooks update transaction status

**Endpoints:**
- `POST /api/v1/stripe/onboard` — generate Stripe onboarding link for provider
- `GET /api/v1/stripe/onboard/callback` — handle return from Stripe onboarding
- `POST /api/v1/stripe/webhooks` — handle Stripe webhook events

**Test mode cards:** `4242 4242 4242 4242` for success, `4000 0000 0000 0002` for decline.

**Acceptance criteria:**
- [ ] Provider can onboard to Stripe Connect (test mode)
- [ ] Payment intent created on proposal acceptance
- [ ] Transfer executed on confirmation
- [ ] Webhooks update transaction status
- [ ] Graceful fallback to wallet-only if Stripe fails

---

### Task 3.3 — Service Execution & Documentation

**What:** The work happens. Operator documents it.

**Endpoints:**
- `POST /api/v1/executions/{id}/assign` — manager assigns operators + machines
- `POST /api/v1/executions/{id}/checkin` — operator checks in (GPS validated)
- `POST /api/v1/executions/{id}/photos` — upload execution proof photos (geolocated)
- `POST /api/v1/executions/{id}/complete` — mark as completed
- `POST /api/v1/requests/{id}/confirm` — client confirms completion
- `POST /api/v1/requests/{id}/dispute` — client opens dispute

**GPS check-in validation:**
- Operator sends their GPS coordinates
- System checks if coordinates are within 500m of the request location
- If not, check-in is rejected with "Não está próximo do local do serviço"

**State transitions:**
- AWARDED → IN_PROGRESS (when operator checks in)
- IN_PROGRESS → AWAITING_CONFIRMATION (when operator marks complete)
- AWAITING_CONFIRMATION → COMPLETED (client confirms or 48h timeout)
- AWAITING_CONFIRMATION → DISPUTED (client disputes)

**Acceptance criteria:**
- [ ] Manager assigns team members and machines to execution
- [ ] Operator check-in validates GPS proximity
- [ ] Execution photos are geolocated and timestamped
- [ ] Materials used recorded in JSONB
- [ ] Client receives notification when work is marked complete
- [ ] Client can confirm or dispute within 48h
- [ ] Auto-confirm after 48h via scheduled job

---

### Task 3.4 — Reviews & Ratings

**What:** Bidirectional rating system after service completion.

**Endpoints:**
- `POST /api/v1/requests/{id}/reviews` — submit review (both parties)
- `GET /api/v1/providers/{id}/reviews` — public reviews of a provider
- `GET /api/v1/users/me/reviews` — own received reviews

**Business logic:**
- Both client and provider can review each other (one review each per request)
- Rating 1-5 with mandatory comment (min 10 chars)
- After both review (or after 7 days), request transitions to RATED
- Provider's `avg_rating` and `total_reviews` are updated (denormalized for performance)

**Acceptance criteria:**
- [ ] Both parties can submit one review per request
- [ ] Rating updates provider's average (recalculated, not just averaged)
- [ ] Reviews visible on public provider profile
- [ ] Cannot review before COMPLETED status
- [ ] Request → RATED when both reviewed or after 7 days

---

### Task 3.5 — WebSocket Notifications (P1)

**What:** Real-time push notifications via WebSocket.

**Events that trigger notifications:**
- New proposal on your request
- Your proposal was accepted/rejected
- Service marked as completed (confirmation needed)
- Payment released
- New chat message

**Implementation:**
- STOMP over SockJS (Spring WebSocket)
- User subscribes to `/user/queue/notifications`
- Backend publishes via `SimpMessagingTemplate`
- Notifications also persisted in DB (for offline users — shown on next login)
- Redis pub/sub as broker relay (for multi-instance scaling)

**Frontend:**
- Notification bell icon in header with unread count badge
- Dropdown with recent notifications
- Click notification → navigate to relevant page
- Toast popup for new real-time notifications

**Acceptance criteria:**
- [ ] WebSocket connection established on login
- [ ] Real-time notifications appear instantly
- [ ] Notifications persisted for offline access
- [ ] Unread count badge updates
- [ ] Click navigates to relevant content

---

# ═══════════════════════════════════════════
# SPRINT 4 — Provider Backoffice (Weeks 12-14)
# ═══════════════════════════════════════════

> **Goal:** Provider has a complete operations management tool.

---

### Task 4.1 — Team Management

**Endpoints:**
- `GET /api/v1/providers/me/team` — list team members
- `POST /api/v1/providers/me/team` — invite member (by email)
- `PUT /api/v1/providers/me/team/{id}` — update member role
- `DELETE /api/v1/providers/me/team/{id}` — deactivate member

**Frontend:** Team management page with member cards, invite modal, role selector.

---

### Task 4.2 — Machine Management

**Endpoints:**
- CRUD on `/api/v1/providers/me/machines`
- Status tracking: AVAILABLE, IN_USE, MAINTENANCE, RETIRED
- Maintenance scheduling alerts

**Frontend:** Machine list with status badges, add/edit forms, calendar view of availability.

---

### Task 4.3 — Inventory Management

**Endpoints:**
- CRUD on `/api/v1/providers/me/inventory`
- Stock level tracking with min_stock_alert
- Usage deduction when materials recorded in execution

**Frontend:** Inventory table with stock levels, color-coded alerts (green/yellow/red), add/edit forms.

---

### Task 4.4 — Operations Calendar

**What:** Calendar view of all scheduled services.

**Frontend:** Monthly/weekly calendar showing assigned services with status color coding. Click on a day to see detailed assignments. Uses date-fns for date manipulation.

---

### Task 4.5 — Financial Dashboard

**What:** Provider sees their financial overview.

**Endpoints:**
- `GET /api/v1/providers/me/finance/summary` — totals: revenue, commissions paid, pending payouts
- `GET /api/v1/providers/me/finance/transactions` — paginated transaction history
- `GET /api/v1/providers/me/finance/export?format=csv` — export to CSV

**Frontend:** Dashboard with stat cards (total revenue, this month, pending), transaction table with filters, export button.

---

# ═══════════════════════════════════════════
# SPRINT 5 — Admin & Monitoring (Weeks 14-15)
# ═══════════════════════════════════════════

> **Goal:** Platform admin has control. System is observable.

---

### Task 5.1 — Admin Dashboard

**Endpoints:**
- `GET /api/v1/admin/dashboard` — global metrics (users, requests, transactions, volume)
- `GET /api/v1/admin/users` — paginated user list with filters
- `POST /api/v1/admin/users/{id}/ban` — ban user
- `GET /api/v1/admin/disputes` — pending disputes
- `POST /api/v1/admin/disputes/{id}/resolve` — resolve dispute (refund/release/partial)
- `GET /api/v1/admin/config` — platform configuration
- `PUT /api/v1/admin/config` — update config (commission rate, timeouts, etc.)

---

### Task 5.2 — Prometheus + Grafana Setup

**What:** Monitoring dashboards.

**Prometheus config:** scrapes Spring Actuator metrics endpoint.

**Grafana dashboards (pre-configured JSON):**
- System: request rate, latency p50/p95/p99, error rate, JVM memory, DB connections
- Business: requests created/hour, proposals/hour, transaction volume, avg completion time
- Health: service up/down, Redis hit rate, MinIO storage usage

**Acceptance criteria:**
- [ ] Grafana loads with pre-configured dashboards
- [ ] Metrics update in real-time
- [ ] Business metrics show meaningful data with seed data

---

### Task 5.3 — Chat System (P1)

**What:** Contextual chat between client and provider per request.

**Endpoints:**
- `GET /api/v1/requests/{id}/messages` — message history (paginated)
- `POST /api/v1/requests/{id}/messages` — send message

**Messages also pushed via WebSocket for real-time chat.**

**Frontend:** Chat panel in request detail page. Message bubbles, auto-scroll, typing indicator (P2).

---

# ═══════════════════════════════════════════
# SPRINT 6 — Polish & Delivery (Week 16)
# ═══════════════════════════════════════════

> **Goal:** Everything works, looks good, and is documented. Ready for demo and defense.

---

### Task 6.1 — Load Testing

**Tool:** k6 (free, runs locally)

**Scenarios:**
- 50 concurrent users browsing requests
- 20 concurrent users creating requests
- 10 concurrent proposal submissions
- PostGIS query performance with 10k requests in DB

**Deliverable:** k6 script + results summary showing p95 latencies.

---

### Task 6.2 — Seed Data Enhancement

**What:** Make demo data perfect for the defense presentation.

- 50+ requests across multiple statuses
- 20+ completed requests with reviews
- Realistic conversation threads
- Financial data that makes sense on dashboards
- Map pins spread realistically across the Azores

---

### Task 6.3 — UI Polish

- Loading skeletons on all data-fetching pages
- Empty states with helpful messages
- Error boundaries with friendly error pages
- Favicon and PWA manifest with AgroConnect branding
- Consistent responsive design across all pages
- Smooth page transitions

---

### Task 6.4 — Documentation

**Technical report sections (for the university deliverable):**
- Problem analysis and motivation
- State of the art (existing platforms: Zaask, TaskRabbit, etc.)
- Architecture decisions (C4 diagrams)
- Data model (ER diagram)
- State machine (formal diagram)
- Security model (RBAC, JWT flow)
- API documentation (reference to Swagger)
- Testing strategy and results
- DevOps pipeline description
- Performance results (k6)
- Critical reflection and future work

---

### Task 6.5 — Demo Preparation

**What:** A scripted demo flow that takes 15 minutes and shows everything.

**Demo script:**
1. `docker compose up` — show all services starting
2. Register as client → create request with map → upload photos
3. Login as provider → see request in nearby list → submit proposal
4. Login as client → compare proposals → accept one
5. Show escrow (transaction HELD)
6. Login as operator (mobile PWA) → check-in with GPS → upload photos → complete
7. Login as client → confirm → show payment released
8. Both rate each other
9. Show admin dashboard with metrics
10. Show Grafana dashboards
11. Show Swagger UI

**Acceptance criteria:**
- [ ] Demo runs end-to-end without errors
- [ ] Every feature is exercised
- [ ] Looks professional on projector (font sizes, contrast)
