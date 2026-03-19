# CLAUDE.md — AgroConnect Project Rules

> **This file is the single source of truth for all development rules in this project.**
> **Read it fully before every task. No exceptions. No shortcuts.**

---

## 1. Project Overview

AgroConnect is a full-stack agricultural services marketplace — a platform where farmers post service requests (plowing, spraying, gardening, etc.), providers in the area respond with proposals, the farmer picks one, payment is held in escrow, the work is done and documented, and both parties rate each other. Providers also have a backoffice to manage teams, machines, and inventory.

This is a final-year university project (LEI — Universidade Aberta, Portugal). The goal is a grade of 20/20. Every decision must reflect engineering maturity, not just "it works".

### Tech Stack
- **Backend:** Spring Boot 3 + Java 17
- **Frontend:** React 18 + TypeScript + Tailwind CSS
- **Database:** PostgreSQL 16 + PostGIS
- **Cache:** Redis 7
- **File Storage:** MinIO (S3-compatible)
- **Payments:** Stripe Connect (test mode) + internal wallet
- **Realtime:** Spring WebSocket (STOMP/SockJS)
- **Maps:** Leaflet + OpenStreetMap + React-Leaflet
- **Mobile:** PWA (same React codebase)
- **Containers:** Docker + Docker Compose
- **CI/CD:** GitHub Actions
- **Monitoring:** Prometheus + Grafana
- **Code Quality:** SonarQube Community
- **Tests:** JUnit 5 + Mockito + Testcontainers
- **API Docs:** springdoc-openapi (Swagger UI)
- **Reverse Proxy:** Nginx

### Repository Structure
```
agroconnect/
├── backend/                  # Spring Boot project (Maven)
│   ├── src/main/java/com/agroconnect/
│   │   ├── config/           # Spring configuration classes
│   │   ├── security/         # JWT, filters, RBAC
│   │   ├── controller/       # REST controllers (thin — delegate to services)
│   │   ├── service/          # Business logic
│   │   ├── repository/       # Spring Data JPA repositories
│   │   ├── model/            # JPA entities
│   │   │   └── enums/        # Enums (RequestStatus, Role, PricingModel, etc.)
│   │   ├── dto/              # Request/Response DTOs
│   │   │   ├── request/      # Incoming DTOs
│   │   │   └── response/     # Outgoing DTOs
│   │   ├── mapper/           # Entity ↔ DTO mapping
│   │   ├── exception/        # Custom exceptions + global handler
│   │   ├── validation/       # Custom validators
│   │   ├── event/            # Application events (domain events)
│   │   ├── scheduler/        # Scheduled jobs (expiration, etc.)
│   │   └── util/             # Utility classes (keep minimal)
│   ├── src/main/resources/
│   │   ├── application.yml
│   │   ├── application-dev.yml
│   │   ├── application-prod.yml
│   │   └── db/migration/     # Flyway migrations (V1__, V2__, etc.)
│   └── src/test/java/com/agroconnect/
│       ├── unit/             # Unit tests (mocked dependencies)
│       ├── integration/      # Integration tests (Testcontainers)
│       └── fixture/          # Test data builders / fixtures
├── frontend/                 # React project (Vite)
│   ├── src/
│   │   ├── api/              # API client (axios instance, interceptors)
│   │   ├── components/       # Reusable UI components
│   │   │   └── ui/           # Atomic components (Button, Input, Card, etc.)
│   │   ├── features/         # Feature modules (auth, requests, proposals, etc.)
│   │   │   └── [feature]/
│   │   │       ├── components/
│   │   │       ├── hooks/
│   │   │       ├── types.ts
│   │   │       └── index.ts
│   │   ├── hooks/            # Global hooks
│   │   ├── layouts/          # Page layouts (MainLayout, AuthLayout)
│   │   ├── pages/            # Route pages (thin — compose from features)
│   │   ├── routes/           # React Router config
│   │   ├── stores/           # Zustand stores (auth, notifications)
│   │   ├── types/            # Global TypeScript types
│   │   └── utils/            # Utility functions
│   └── public/
├── docker/                   # Dockerfiles and configs
│   ├── backend/Dockerfile
│   ├── frontend/Dockerfile
│   ├── nginx/
│   │   └── nginx.conf
│   ├── prometheus/
│   │   └── prometheus.yml
│   └── grafana/
│       └── dashboards/
├── docker-compose.yml        # Production-like
├── docker-compose.dev.yml    # Development (hot-reload)
├── .github/workflows/        # CI/CD pipelines
├── docs/                     # Technical documentation, diagrams
├── seed/                     # Seed data scripts (realistic Azores data)
└── CLAUDE.md                 # THIS FILE
```

---

## 2. ABSOLUTE RULES — Never Break These

### 2.1 Git — NEVER TOUCH IT
**NEVER run any git command. Not `git add`, not `git commit`, not `git push`, not `git stash`, not `git checkout`, NOTHING.**

I manage git myself. I do not want your name, your email, or any trace of you in my repository history. If a task requires git, STOP and tell me what git operation I need to run manually.

If you accidentally run a git command, IMMEDIATELY tell me so I can fix it.

### 2.2 Never Delete Without Asking
Never delete files, directories, database migrations, or test data without explicitly asking me first. If you think something should be removed, tell me why and wait for confirmation.

### 2.3 Never Modify Existing Migrations
Database migrations are immutable once created. If a schema change is needed, create a NEW migration file with the next version number. Never edit an existing `V*__` file.

### 2.4 Never Hardcode Secrets
No API keys, passwords, tokens, or secrets in code. Everything goes through environment variables defined in `application.yml` with `${ENV_VAR:default}` syntax. Docker Compose `.env` file for local dev.

### 2.5 Never Skip Tests
Every new service method MUST have at least one unit test. Every new endpoint MUST have at least one integration test. No "I'll add tests later". Tests are written FIRST or alongside the code (TDD when practical).

### 2.6 Never Leave Swagger Incomplete
Every controller endpoint MUST have complete Swagger annotations BEFORE the PR is considered done:
- `@Operation(summary = "...", description = "...")`
- `@ApiResponse` for all possible HTTP status codes (200, 201, 400, 401, 403, 404, 409, etc.)
- `@Parameter` for path/query params
- Request/Response DTOs with `@Schema` annotations on fields

The Swagger UI at `/swagger-ui.html` must always be accurate and usable as interactive API documentation.

---

## 3. Code Style & Quality

### 3.1 Language
- **All code** is in English: class names, method names, variable names, constants.
- **All comments** are in English. Comments only when the WHY is not obvious. Never comment WHAT the code does — the code should be self-documenting.
- **All commit messages** (that I write) are in English.
- **User-facing text** (API error messages, validation messages) are in Portuguese (pt-PT) — these are returned to end users.

### 3.2 Naming Conventions

**Java (Backend):**
- Classes: `PascalCase` — `ServiceRequestController`, `ProposalService`
- Methods: `camelCase` — `findByLocationWithinRadius()`, `createProposal()`
- Constants: `UPPER_SNAKE_CASE` — `MAX_UPLOAD_SIZE`, `DEFAULT_COMMISSION_RATE`
- Packages: `lowercase` — `com.agroconnect.service`
- DTOs: suffix with `Request`/`Response` — `CreateRequestDto`, `ProposalResponseDto`
- Entities: no suffix — `ServiceRequest`, `Proposal`, `User`
- Enums: `PascalCase` name, `UPPER_SNAKE_CASE` values — `RequestStatus.AWAITING_CONFIRMATION`
- Test classes: suffix `Test` for unit, `IT` for integration — `ProposalServiceTest`, `RequestControllerIT`

**TypeScript (Frontend):**
- Components: `PascalCase` — `RequestCard.tsx`, `ProposalList.tsx`
- Hooks: `camelCase` with `use` prefix — `useRequests()`, `useAuth()`
- Types/Interfaces: `PascalCase` — `ServiceRequest`, `ProposalResponse`
- Files: `PascalCase` for components, `camelCase` for utilities — `RequestCard.tsx`, `formatCurrency.ts`
- Constants: `UPPER_SNAKE_CASE` — `API_BASE_URL`

### 3.3 Code Principles
- **DRY** — Don't Repeat Yourself. If you write similar code twice, extract it.
- **SOLID** — Single responsibility in particular. Controllers are thin (validate + delegate). Services hold business logic. Repositories handle data.
- **KISS** — Don't over-engineer. No design pattern just because it exists. Use patterns when they solve a real problem.
- **Fail fast** — Validate inputs at the boundary (controller/DTO level). Don't let invalid data propagate.
- **No magic numbers** — Use named constants.
- **No commented-out code** — Delete it. Git has history.
- **No wildcard imports** — Always explicit imports.
- **No `System.out.println`** — Use SLF4J logger: `private static final Logger log = LoggerFactory.getLogger(ClassName.class);`
- **No `@Autowired` on fields** — Use constructor injection (final fields). Lombok `@RequiredArgsConstructor` is fine.

### 3.4 Method Size
If a method exceeds 30 lines, it probably needs to be split. Exceptions: test methods and mappers can be longer.

### 3.5 Comments Policy
```java
// BAD — describes WHAT (obvious from code)
// Get user by ID
User user = userRepository.findById(id);

// GOOD — describes WHY (not obvious)
// PostGIS ST_DWithin uses meters, but our API accepts km
double radiusMeters = radiusKm * 1000;

// GOOD — warns about non-obvious behavior
// Stripe webhook may fire before our DB transaction commits — retry with backoff
```

---

## 4. Backend Rules

### 4.1 Controller Layer
```java
// Controllers are THIN. They:
// 1. Receive the request
// 2. Extract the authenticated user (if needed)
// 3. Delegate to a service
// 4. Return the response

@PostMapping
@Operation(summary = "Create a service request")
@ApiResponse(responseCode = "201", description = "Request created")
@ApiResponse(responseCode = "400", description = "Invalid input")
public ResponseEntity<RequestResponseDto> create(
        @Valid @RequestBody CreateRequestDto dto,
        @AuthenticationPrincipal UserPrincipal principal) {
    var response = requestService.create(dto, principal.getId());
    return ResponseEntity.status(HttpStatus.CREATED).body(response);
}
```

### 4.2 Service Layer
- All business logic lives here.
- Services are `@Transactional` at class level (readOnly = true), with `@Transactional` on write methods.
- Services NEVER return entities to controllers — always DTOs via mappers.
- Services throw custom exceptions that the global handler catches.

### 4.3 Exception Handling
```
com.agroconnect.exception/
├── AgroConnectException.java       # Base (abstract)
├── ResourceNotFoundException.java  # 404
├── InvalidStateException.java      # 409 (wrong state transition)
├── ForbiddenException.java         # 403
├── ValidationException.java        # 400
└── GlobalExceptionHandler.java     # @RestControllerAdvice
```

The `GlobalExceptionHandler` returns a consistent error response:
```json
{
  "timestamp": "2026-03-18T12:00:00Z",
  "status": 400,
  "error": "Validation Error",
  "message": "O campo 'area' é obrigatório",
  "path": "/api/v1/requests"
}
```

### 4.4 DTOs and Validation
- Every endpoint uses DTOs — NEVER expose entities directly.
- Validation annotations on request DTOs: `@NotBlank`, `@NotNull`, `@Min`, `@Max`, `@Size`, `@Email`, etc.
- Custom validators when Bean Validation is not enough (e.g., `@ValidStateTransition`).
- DTOs are records when possible (Java 17):
```java
public record CreateRequestDto(
    @NotNull @Schema(description = "Service category ID") Long categoryId,
    @NotBlank @Schema(description = "Description of what is needed") String description,
    @NotNull @Schema(description = "Location latitude") Double latitude,
    @NotNull @Schema(description = "Location longitude") Double longitude,
    @Positive @Schema(description = "Approximate area in appropriate unit") Double area
) {}
```

### 4.5 Database & JPA
- **Flyway** for migrations. Files in `src/main/resources/db/migration/`. Format: `V1__create_users_table.sql`, `V2__create_service_requests.sql`.
- **Explicit column definitions** — always `@Column(name = "...", nullable = false/true, length = ...)`.
- **No `CascadeType.ALL`** — be explicit about cascades. Prefer `PERSIST` and `MERGE` only.
- **`@CreationTimestamp`** and **`@UpdateTimestamp`** on `createdAt` / `updatedAt` fields.
- **Soft deletes** where appropriate — `deletedAt` timestamp, `@Where(clause = "deleted_at IS NULL")`.
- **Indexes** — add `@Table(indexes = {...})` for any field used in WHERE clauses or JOINs.
- **PostGIS** — location fields use `org.locationtech.jts.geom.Point`. Repository methods use native queries with `ST_DWithin`.

### 4.6 Security
- JWT with access token (15min) + refresh token (7 days).
- Passwords hashed with BCrypt (strength 12).
- RBAC with 5 roles: `ADMIN`, `CLIENT`, `PROVIDER_MANAGER`, `PROVIDER_LEAD`, `PROVIDER_OPERATOR`.
- `@PreAuthorize` annotations on service methods for role checks.
- Ownership checks in service layer (a client can only see their own requests).
- Rate limiting via Redis (Spring Boot Bucket4j or custom filter).
- Input sanitization — no raw HTML in any text field.

### 4.7 API Design
- Base path: `/api/v1/`
- Use plural nouns: `/api/v1/requests`, `/api/v1/proposals`
- HTTP methods: GET (read), POST (create), PUT (full update), PATCH (partial update), DELETE
- Status codes: 200 (OK), 201 (Created), 204 (No Content), 400 (Bad Request), 401 (Unauthorized), 403 (Forbidden), 404 (Not Found), 409 (Conflict)
- Pagination: `?page=0&size=20&sort=createdAt,desc` → Spring Pageable
- Filtering: query params → Specification pattern
- Always return the created/updated resource in POST/PUT/PATCH responses

---

## 5. Frontend Rules

### 5.1 Component Structure
```tsx
// Feature-based organization. Each feature is self-contained.
// A "page" is thin — it composes feature components.

// features/requests/components/RequestCard.tsx
interface RequestCardProps {
  request: ServiceRequest;
  onSelect?: (id: number) => void;
}

export function RequestCard({ request, onSelect }: RequestCardProps) {
  // Component logic...
}
```

### 5.2 State Management
- **Server state:** React Query (TanStack Query) for all API calls. No manual fetch + useState.
- **Client state:** Zustand for global UI state (auth, notifications, theme).
- **Form state:** React Hook Form + Zod for validation.
- **URL state:** React Router search params for filters, pagination.

### 5.3 API Client
- Single axios instance in `src/api/client.ts` with:
  - Base URL from env
  - JWT interceptor (auto-attach access token)
  - 401 interceptor (auto-refresh token)
  - Error interceptor (toast notifications for errors)
- API functions grouped by domain in `src/api/` — `requests.ts`, `proposals.ts`, `auth.ts`.
- Every API function has TypeScript types for request and response.

### 5.4 Styling
- **Tailwind CSS only** — no inline styles, no CSS modules, no styled-components.
- Use `cn()` utility (clsx + tailwind-merge) for conditional classes.
- Design tokens via Tailwind config (colors, spacing, fonts).
- Mobile-first: `sm:`, `md:`, `lg:` breakpoints.
- Consistent spacing: use Tailwind's scale (`p-4`, `gap-6`, `mb-8`).

### 5.5 TypeScript
- **Strict mode** — `"strict": true` in tsconfig.
- **No `any`** — ever. Use `unknown` if truly unknown, then narrow.
- **No non-null assertions (`!`)** — handle the null case.
- **Interfaces for object shapes, types for unions/intersections.**
- **Enums from backend are string unions on frontend:**
```typescript
type RequestStatus = 'DRAFT' | 'PUBLISHED' | 'WITH_PROPOSALS' | 'AWARDED' | 'IN_PROGRESS' | 'AWAITING_CONFIRMATION' | 'COMPLETED' | 'RATED' | 'DISPUTED' | 'EXPIRED' | 'CANCELLED';
```

---

## 6. Testing Rules

### 6.1 TDD Approach
When practical (especially for service layer business logic):
1. Write the test first — it will fail (RED)
2. Write the minimum code to make it pass (GREEN)
3. Refactor while keeping tests green (REFACTOR)

For controllers and integration tests, writing tests alongside the code is acceptable.

### 6.2 Unit Tests (Backend)
- Located in `src/test/java/.../unit/`
- Mock dependencies with Mockito (`@ExtendWith(MockitoExtension.class)`)
- Test one behavior per test method
- Naming: `methodName_givenCondition_shouldExpectedResult`
```java
@Test
void createProposal_givenRequestNotPublished_shouldThrowInvalidState() {
    // Arrange
    when(requestRepo.findById(1L)).thenReturn(Optional.of(draftRequest));
    
    // Act & Assert
    assertThrows(InvalidStateException.class,
        () -> proposalService.create(dto, providerId));
}
```

### 6.3 Integration Tests (Backend)
- Located in `src/test/java/.../integration/`
- Use `@SpringBootTest` + Testcontainers (real PostgreSQL + PostGIS, real Redis)
- Test the full stack: HTTP request → controller → service → repository → database
- Use `@Sql` or test fixtures to set up data
- Naming: `ClassName` + `IT` suffix — `RequestControllerIT`

### 6.4 Frontend Tests
- Vitest for unit tests
- React Testing Library for component tests
- Test user interactions, not implementation details
- MSW (Mock Service Worker) for API mocking in tests

### 6.5 Test Data
- Use builder pattern for test fixtures:
```java
public class RequestFixture {
    public static ServiceRequest.ServiceRequestBuilder aRequest() {
        return ServiceRequest.builder()
            .description("Lavoura de 2 hectares")
            .status(RequestStatus.PUBLISHED)
            .area(2.0)
            .location(createPoint(-27.2167, 38.6667));
    }
}
```

---

## 7. Docker & DevOps

### 7.1 Docker Compose
- `docker-compose.yml` — production-like (optimized images, no debug ports)
- `docker-compose.dev.yml` — development (hot-reload, debug ports, volume mounts)
- Every service has `healthcheck` and `restart: unless-stopped`
- Use `.env` file for all configurable values

### 7.2 Dockerfiles
- Multi-stage builds for both backend and frontend
- Backend: Maven build stage → JRE runtime stage (eclipse-temurin:17-jre-alpine)
- Frontend: Node build stage → Nginx serve stage (nginx:alpine)

### 7.3 Nginx Config
- Serves React static files on `/`
- Proxies `/api/*` to Spring Boot backend
- Proxies `/ws/*` to Spring Boot WebSocket
- Gzip compression enabled
- Security headers (X-Frame-Options, X-Content-Type-Options, etc.)

### 7.4 Database
- PostgreSQL + PostGIS extension enabled in Docker
- Flyway runs automatically on app startup
- Seed data via `V999__seed_data.sql` (realistic Azores data: real parishes, typical services, market prices)

---

## 8. Domain Model — State Machine

The `ServiceRequest` entity has a formal state machine. These are the ONLY valid transitions:

```
DRAFT → PUBLISHED → WITH_PROPOSALS → AWARDED → IN_PROGRESS → AWAITING_CONFIRMATION → COMPLETED → RATED
                                                                    ↓
                                                                DISPUTED → COMPLETED (resolved)
                                                                         → CANCELLED (refund)

PUBLISHED → EXPIRED (no proposals within deadline)
Any non-terminal state → CANCELLED (by client, with refund if payment was made)
```

Terminal states: `RATED`, `EXPIRED`, `CANCELLED`

Every state transition MUST be validated in the service layer. If invalid, throw `InvalidStateException`.

---

## 9. Working Methodology

### 9.1 How to Approach a Task
1. **Read this file** if you haven't recently.
2. **Understand the requirement** — ask me if anything is unclear.
3. **Plan before coding** — briefly outline what files you'll create/modify.
4. **Write tests first** (when practical) for the service layer.
5. **Implement** — one layer at a time (entity → repository → service → controller → frontend).
6. **Add Swagger annotations** to every new endpoint.
7. **Run tests** — make sure everything passes.
8. **Check compilation** — `mvn compile` and `npm run build` must succeed.
9. **Tell me what git commands to run** when the task is done.

### 9.2 When Unsure
If you're unsure about an architectural decision, a naming choice, or anything that might affect other parts of the system — STOP and ask me. Don't make assumptions. A 30-second question saves hours of refactoring.

### 9.3 Breaking Changes
If a task requires changing an existing API contract (endpoint URL, request/response shape), WARN me first. These affect the frontend and potentially other parts of the system.

### 9.4 File Creation
When creating new files, always respect the directory structure defined in section 1. Don't create files in unexpected locations.

---

## 10. Swagger Example (Reference)

Every controller should look like this for Swagger completeness:

```java
@RestController
@RequestMapping("/api/v1/requests")
@RequiredArgsConstructor
@Tag(name = "Service Requests", description = "Manage service requests")
public class ServiceRequestController {

    private final ServiceRequestService requestService;

    @GetMapping
    @Operation(
        summary = "List service requests",
        description = "Returns paginated service requests. Providers see requests within their radius. Clients see their own."
    )
    @ApiResponse(responseCode = "200", description = "Page of service requests")
    @ApiResponse(responseCode = "401", description = "Not authenticated")
    public ResponseEntity<Page<RequestResponseDto>> list(
            @Parameter(description = "Page number (0-indexed)") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size") @RequestParam(defaultValue = "20") int size,
            @Parameter(description = "Filter by status") @RequestParam(required = false) RequestStatus status,
            @AuthenticationPrincipal UserPrincipal principal) {
        var result = requestService.list(page, size, status, principal);
        return ResponseEntity.ok(result);
    }

    @PostMapping
    @Operation(summary = "Create a new service request")
    @ApiResponse(responseCode = "201", description = "Request created successfully")
    @ApiResponse(responseCode = "400", description = "Invalid input data")
    @ApiResponse(responseCode = "401", description = "Not authenticated")
    @ApiResponse(responseCode = "403", description = "Only clients can create requests")
    public ResponseEntity<RequestResponseDto> create(
            @Valid @RequestBody CreateRequestDto dto,
            @AuthenticationPrincipal UserPrincipal principal) {
        var response = requestService.create(dto, principal.getId());
        var location = URI.create("/api/v1/requests/" + response.id());
        return ResponseEntity.created(location).body(response);
    }
}
```

---

## 11. Quick Checklist Before Declaring a Task Done

- [ ] Code compiles without warnings (`mvn compile -q`)
- [ ] All tests pass (`mvn test`)
- [ ] New endpoints have full Swagger annotations
- [ ] New DTOs have `@Schema` annotations
- [ ] New service methods have unit tests
- [ ] New endpoints have at least one integration test
- [ ] No hardcoded secrets, URLs, or magic numbers
- [ ] No `System.out.println` — use logger
- [ ] No commented-out code
- [ ] No `any` types in TypeScript
- [ ] No wildcard imports
- [ ] Consistent naming conventions followed
- [ ] Error messages in Portuguese for user-facing, English for logs
- [ ] Git was NOT touched (remind me what to commit)
