# DanceCARD Architecture

- Last updated: 2026-08-24
- Implementation status: guest, seller, and administrator MVP flows implemented and verified in development
- Baseline status: Milestones 1–6 verified; Steps 1–62 complete

## Mandatory Pre-code Reading

Before writing any code, every developer must read these documents in full:

1. `memory-bank/architecture.md`
2. `memory-bank/Design-Document.md`

Consult `memory-bank/implementation-plan.md` and `memory-bank/tech-stack.md` for the active step. Update this file after every major feature or milestone.

## Sources of Truth

- Product behavior: `memory-bank/Design-Document.md`
- Approved technology: `memory-bank/tech-stack.md`
- Ordered delivery: `memory-bank/implementation-plan.md`
- Acceptance evidence index: `memory-bank/requirements-traceability.md`
- Environment rules: `memory-bank/environment.md`
- Current approved visual direction: `memory-bank/assets/ui-reference.png`
- Archived superseded visual direction: `memory-bank/assets/ui-reference-neo-pop-archive.png`

## Implemented Repository Structure

```text
apps/user-app/          Taro user app; H5 release and WeChat build target
apps/admin-web/         React desktop administration app
packages/domain/        Shared business models and state vocabulary
packages/validation/    Shared Zod rules for publishing and editing cards
packages/api-client/    Transport-neutral API contracts and adapters
packages/config/        Shared TypeScript configurations
cloudbase/migrations/   Ordered CloudBase PostgreSQL schema and policy migrations
cloudfunctions/         Protected TypeScript cloud functions and server env example
database/               Rollbacks, repeatable development seed, and database tests
e2e/                    Playwright H5 smoke and future journeys
memory-bank/            Product decisions, architecture, progress, and evidence
```

The root pnpm workspace owns the only lockfile and dependency installation. Applications consume shared packages through package exports; applications must not import each other's source.

## Runtime Architecture

- User app: Taro 4.2.1, React 18, TypeScript, Vite 4, NutUI Taro 3.0.18, SCSS, and Zod. H5 is the V1 release; WeChat is build-and-developer-tools-smoke only.
- Admin app: React 19, TypeScript, Vite 8, Ant Design 6; desktop Web only.
- Backend: the paid `dancecard-dev` CloudBase environment in Shanghai provides PostgreSQL, Auth, functions, and storage. Production remains intentionally unconfigured.
- Shared dependency direction: `config` → `domain` → `validation` / `api-client` → applications. Backend code will consume the same domain and validation packages.
- Time zone and product boundary remain defined by the Design Document: `Asia/Shanghai`, information display and contact connection only.

## Key File Responsibilities

- `package.json`, `pnpm-workspace.yaml`, `pnpm-lock.yaml`: workspace commands, package discovery, and deterministic dependency graph.
- `.nvmrc`: supported local Node baseline (`24.19.0`); root engines allow Node 22–24 and pnpm 11.
- `.eslintrc.cjs`, `.prettierrc.json`, `.prettierignore`: repository code quality rules. `apps/user-app/src/index.html` is intentionally excluded because Taro requires an exact one-line entry placeholder.
- `apps/user-app/config/`: Taro multi-target build configuration.
- `apps/user-app/src/index.html`: H5 shell; the exact `htmlWebpackPlugin.options.script` placeholder is replaced by Taro's Vite plugin.
- `apps/user-app/src/config/environment.ts`: pure public-environment parser and clear validation errors.
- `apps/user-app/src/config/runtime-environment.ts`: binds Taro-prefixed runtime variables to that parser.
- `apps/user-app/src/pages/`: public browsing plus phone login, studio-bound publishing, editing, and personal-card management routes. Publication remains inside the selected studio rather than the tab bar.
- `apps/user-app/src/components/`: cross-page hero, asynchronous states, the shared validated dance-card form, and `page-shell.tsx`, which owns the persistent three-destination primary navigation used by every user-facing route.
- `apps/user-app/src/services/public-api.ts`: instantiates the shared public, authentication, and seller CloudBase adapters.
- `apps/user-app/src/utils/`: safe route decoding plus a strict allowlist for post-login return paths.
- `apps/admin-web/src/components/`: phone login guard and the city, district, studio, card, user, and audit-log dashboard.
- `apps/admin-web/src/services/cloudbase.ts`: instantiates the shared authentication and administrator adapters.
- `apps/admin-web/src/config/environment.ts`: pure admin public-environment parser.
- `apps/admin-web/src/config/runtime-environment.ts`: binds Vite-prefixed variables to the parser.
- `apps/*/vitest.config.ts`, `packages/domain/vitest.config.ts`: unit/component test environments and JUnit reports.
- `e2e/playwright.config.ts`, `e2e/tests/h5-smoke.spec.ts`: start H5 and verify the full anonymous buyer/contact journey, a no-card studio, and an invalid card link; HTML reports go to ignored output directories.
- `apps/*/.env.example`, `cloudfunctions/.env.example`: safe configuration contracts. Real `.env` files are ignored.
- `packages/domain/src/`: canonical user, identity, location, studio, card, visibility, hidden-reason, and administrator-action types.
- `packages/validation/src/dance-card.ts`: publish/edit validation, including Shanghai dates, precise RMB prices, text limits, and dance-scope combinations.
- `cloudbase/migrations/`: append-only schema, indexes, RLS policies, safe views, contact RPC, and secured expiration maintenance in version order.
- `database/rollbacks/`: one matching rollback file for every migration.
- `database/seeds/development.sql`: repeatable Beijing/Shanghai location data plus development-only users and cards.
- `database/tests/milestone-3.sql`: transactional constraints, RLS, visibility, contact, expiration, pagination, and audit tests.
- `database/tests/milestone-5.sql`: transactional seller-state, atomic-write, administrator-action, duplicate, disabled-user, and audit tests.
- `cloudfunctions/expire-dance-cards/`: daily expiration function. TypeScript source compiles to an ignored deployment artifact; the tracked `deploy/package.json` contains runtime-only dependencies.
- `AGENTS.md` and `CLAUDE.md`: contributor and AI-maintainer guardrails.

Generated `dist/`, test reports, dependencies, local CloudBase state, and local environment files are ignored and are not architecture sources.

## Commands and Verification

Run from the repository root:

```text
pnpm install                         Install the entire workspace
pnpm format:check                    Verify formatting
pnpm lint                            Run repository ESLint rules
pnpm typecheck                       Strict TypeScript checks
pnpm test:unit                       User, admin, and shared-package tests
pnpm test:e2e                        H5 Chromium smoke test
pnpm --filter user-app build:h5      H5 production build
pnpm --filter user-app build:weapp   WeChat production build
pnpm --filter admin-web build        Admin production build
```

Vitest 0.34.6 is intentionally scoped to the Taro app because that app is tied to Vite 4. The admin and shared packages use Vitest 4.1.11. Playwright uses its installed Chromium build.

## Data Model and Access Boundary

- `users` is the business profile and authorization record; `user_identities` maps CloudBase Auth subjects to business users. Login identity is never treated as the business user row itself.
- `cities` → `districts` → `studios` provides the location hierarchy. Locations are disabled rather than cascaded away; a disabled ancestor makes all descendant cards non-public.
- `dance_cards` stores seller nickname and WeChat snapshots, exact decimal price, remaining classes, dance scope, expiry date, visibility, hidden reason, and soft deletion. It contains no order, payment, purchase, split-sale, or sold state.
- `admin_action_logs` is append-only audit evidence for privileged mutations.
- `public_dance_cards` exposes only currently public cards and excludes WeChat IDs. `get_dance_card_contact` rechecks the full visibility chain and returns one contact only for one valid card.
- RLS allows anonymous reads of active public data, owner-only card writes, and administrator-only location/user/moderation writes. An administrator cannot restore a card hidden by another administrator through ordinary owner paths.
- Seller queries always include the current business-user ID even when that identity is also an administrator; administrator-wide visibility is available only through the administrator adapter.

## Expiration and Database Delivery

Public queries compare `expire_date` with the current `Asia/Shanghai` date, so an expired card disappears even if maintenance is delayed. The `expire-dance-cards` event function also runs daily at 00:10 and marks prior-date active cards hidden with reason `expired`. Its maintenance token exists only in ignored local configuration and the cloud-function environment; PostgreSQL stores only a SHA-256 digest. Anonymous calls without that token fail.

Migrations `20260821194000` through `20260822110500` are applied in the development environment. Each has a rollback under `database/rollbacks/`. The repeatable seed currently creates 2 cities, 32 districts, 15 studios, 3 development users, and 6 state-covering cards. Both database milestone suites run inside transactions and roll back all test changes.

CloudBase's browser SDK cannot reliably parse a raw scalar UUID returned by an RPC. Browser-facing write functions therefore return one-row tables, while the original scalar functions remain available for internal SQL composition. Authentication likewise uses a one-row profile RPC that atomically creates or returns the business profile.

## Environment and Security Boundary

Development, test, and production environments are separate. Only API base URLs, environment names, and CloudBase environment IDs may enter client builds. `DATABASE_URL`, private keys, SMS secrets, and administrative credentials are server-only. Missing required client variables fail at startup with named variables and an example-file path.

## Implemented Guest Data Flow

The Taro app establishes a lazy anonymous CloudBase session and reads active cities, districts, and studios directly through RLS-protected PostgreSQL access. It reads card list/detail data only from `public_dance_cards`. The shared client validates route IDs before querying, uses 20-item stable pages, and maps database names into transport-neutral application objects.

Seller contact is not included in list or detail responses. A contact action calls `get_dance_card_contact` for exactly one card and copies the returned value directly through Taro's cross-platform clipboard API; the risk notice remains visible on the detail page without a second confirmation modal. Hidden, expired, deleted, disabled-user, and inactive-location cards fail the same server-side visibility recheck.

The user app does not use Taro's native tab bar. `PageShell` renders one custom bottom navigation on every page, including nested browsing, login, publishing, editing, loading, and unavailable states. Primary destinations use `reLaunch`, while ordinary hierarchy navigation continues to use `navigateTo`. This avoids native blank icon placeholders and makes the navigation consistent across H5 and the WeChat build.

The user app's current visual system is a dark editorial/archive theme approved on 2026-08-24. `app.scss` owns the shared near-black canvas, warm-white type, coral-orange actions, muted-gold metadata, cool-slate rules, compact rectangular controls, and numbered bottom navigation. `PageShell` owns the persistent brand masthead and three-item navigation, while the city page adds numbered bilingual city rows and the restrained `DC` watermark. The earlier Neo-pop asset is retained only as an archive and must not drive new UI work.

City, district, or studio additions remain administrator-managed. The studio list opens an in-app help dialog and directs submissions to `m18800126467@163.com`; the administrator phone remains an authentication identity only. Hero cards contain only an eyebrow and title, while instructional copy is kept in the relevant content or modal instead of promotional subtitles.

The development H5 is currently deployed at `https://dancecard-dev-d5g955nph1202e188-1472887055.tcloudbaseapp.com`. This URL is development verification infrastructure, not the formal V1 production release.

## Implemented Seller and Administrator Flows

Phone OTP creates a CloudBase Auth session and an independently keyed DanceCARD business profile. A verified normal user retains the session while awaiting administrator authorization, so the first administrator can be promoted once without requesting a second OTP. The first active administrator was initialized manually and the dashboard role guard was verified against the deployed environment.

Publishing is atomic: the server derives the owner from the authenticated subject, validates active location ancestry, snapshots the card nickname and WeChat ID, and saves those values as account defaults. Seller reads and mutations are owner-filtered, including for administrator accounts. Editing cannot change card ownership or studio. Hide, valid restore, and soft delete are enforced by both the client workflow and RLS/trigger rules.

The administration app is deployed at `https://dancecard-dev-d5g955nph1202e188-1472887055.tcloudbaseapp.com/admin/`. It exposes active-administrator-only city, district, studio, card moderation, user status, and read-only audit-log areas. Exact normalized studio duplicates are blocked in one district; similar names remain an administrator decision. All privileged mutations use atomic RPCs and append audit records.

## Product and Delivery Boundaries

V1 excludes payment, escrow, transaction guarantees, chat, purchases, sold status, favorites, reports, location, recommendations, ratings, and image upload. Guests browse and may copy one valid seller contact without login. Sellers use SMS-code login. Administrators manage locations, studios, users, and noncompliant listings in the separate protected app.

The development H5 is publicly reachable for product acceptance, but the formal production environment and domain are not configured. The WeChat target builds successfully but has not been opened in WeChat Developer Tools because that application is unavailable in the current environment; it is not submitted, published, or accepted on a real device in V1. Privacy policy, user agreement, production configuration, and professional legal review remain required before formal public launch.

## Git Baseline

- Branch: `main`.
- Documentation baseline: `8b3e071 docs: establish project memory bank`.
- Existing uncommitted product-document updates are intentional and must be preserved.
