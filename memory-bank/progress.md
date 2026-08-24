# DanceCARD Progress

## Current Status

- Date: 2026-08-22
- Active milestone: Milestone 7 — Quality, security, and cross-target acceptance
- Active step: Step 63 — Unified state and quality review
- Step status: Milestones 1–6 complete; development deployment is ready for product acceptance
- Next permitted step: Step 63; formal production release remains blocked by production and legal prerequisites

## Step 1 Work Prepared

- Read `memory-bank/Design-Document.md` in full.
- Read `memory-bank/tech-stack.md` in full.
- Read `memory-bank/implementation-plan.md` in full.
- Confirmed `memory-bank/architecture.md` and `memory-bank/progress.md` were initially empty.
- Confirmed `memory-bank/assets/ui-reference.png` exists and is readable.
- Recorded the approved stack, planned repository layout, system boundaries, and truthful pre-implementation state in `memory-bank/architecture.md`.

## Verification Handoff

The user confirmed on 2026-08-21 that Step 1 verification passed.

Verified scope:

- All five Markdown files in `memory-bank/` are present and readable.
- `memory-bank/assets/ui-reference.png` is present and readable.
- `memory-bank/architecture.md` accurately reflects the approved documents and current repository contents.
- No application functionality is described as implemented or tested.
- `memory-bank/architecture.md` now explains the responsibility of every file currently present in the repository.

## Step 2 Record

- Created `memory-bank/requirements-traceability.md`.
- Copied all 12 V1 acceptance criteria from `memory-bank/Design-Document.md` section 13 without changing their product meaning.
- Assigned at least one expected unit, component, or end-to-end test type to every criterion.
- Added concise verification targets without adding product scope.
- Confirmed the table contains exactly 12 entries, `AC-01` through `AC-12`.
- Left every acceptance checkbox open because no product behavior or test suite has been implemented yet.
- The user confirmed on 2026-08-21 that Step 2 verification passed.

## Milestone Status

Milestones 1 through 6 are complete. Steps 1–62 have passed their implemented validation.

## Step 3 Record

- Confirmed the repository is on `main` and contains baseline commit `8b3e071 docs: establish project memory bank`.
- Added the root `.gitignore` for dependency directories, build output, test reports, CloudBase local state, environment files, logs, and OS metadata.
- Confirmed `.env.example`, database migrations, and product documents remain trackable.
- Created and removed temporary probes for every ignore category; all checks passed.
- Preserved all pre-existing uncommitted documentation and UI-reference changes.
- The user instructed development to continue after the successful local validation.

## Step 4 Record

- Recorded the Git baseline, requirements traceability method, repository boundary, source documents, and current pre-implementation state.
- Added the explicit requirement to read `memory-bank/architecture.md` and `memory-bank/Design-Document.md` in full before coding.
- Re-read both Memory Bank records and matched their paths and claims against the repository; Step 4 validation passed.

## Steps 5–9 Record

- Created the root pnpm 11 workspace and the `apps`, `packages`, `cloudfunctions`, `database`, and `e2e` boundaries with one lockfile.
- Initialized `apps/user-app` with Taro 4.2.1, React 18, TypeScript, Vite 4, SCSS, NutUI Taro, and Zod. H5 development, H5 production, and WeChat production builds passed.
- Initialized `apps/admin-web` with React, Vite, TypeScript, and Ant Design. Development rendering was checked in a desktop browser with no console error or horizontal overflow.
- Created `domain`, `validation`, `api-client`, and `config` shared packages with public package exports and one-way workspace dependencies. Both apps resolved a temporary shared type before it was removed.

## Steps 10–12 Record

- Added root Prettier, ESLint, and strict TypeScript commands. Temporary malformed formatting, unused-variable, and type-error probes each failed as expected; all final checks pass.
- Added Vitest and Testing Library entries for the user app, admin app, and domain package, with ignored JUnit reports.
- Added Playwright and an H5 Chromium smoke test with an ignored HTML report. A deliberately wrong assertion failed the unit-test command, then the restored suite passed.
- Repaired the Taro H5 entry shell after discovering that formatting its exact script placeholder causes an empty H5 bundle. The file is now intentionally excluded from Prettier and both production and browser tests pass.
- Added public environment parsers, local/test/production examples, server-only environment guidance, and clear startup failures for missing variables. A blank-config H5 launch produced the expected named error; a tracked-file secret scan passed.

## Step 13 Record

- Updated `memory-bank/architecture.md` with the implemented directory tree, responsibilities, dependency direction, exact test/build commands, environment boundary, and the Taro/Vitest compatibility decisions.
- Reconciled documentation claims with the real workspace. Backend, database, authentication, and business features remain explicitly unimplemented.
- The final Step 13 reproduction runs formatting, lint, type checks, unit tests, H5 Playwright smoke, H5 production build, WeChat production build, and admin production build.

## Steps 14–15 Record

- Added the canonical shared types for users, identities, cities, districts, studios, dance cards, visibility reasons, and administrator actions.
- Added shared Zod publishing/editing rules for all approved numeric, date, text, and dance-scope boundaries.
- Validation includes valid, boundary, and invalid cases; 25 focused tests pass.

## Steps 16–25 Record

- Created the paid `dancecard-dev` CloudBase PostgreSQL environment in Shanghai; production is not configured and no secret is tracked.
- Applied reversible migrations for business users and identities, cities, districts, studios, cards, administrator audit logs, indexes, RLS policies, public-card view, protected contact RPC, and expiry maintenance.
- Verified migration rollback, repaired history, and reapplied the first migration successfully.
- Added repeatable Beijing/Shanghai seed data: 2 cities, all 32 administrative districts, 15 researched studios, 3 development users, and 6 sample cards. Running the seed twice keeps counts stable.
- Confirmed public queries exclude WeChat IDs, inactive ancestry, disabled users, hidden/deleted/expired cards, while retaining underlying records.

## Steps 26–29 Record

- Verified owner-only card creation/editing, forged-user rejection, cross-user denial, and administrator-hidden restore denial.
- Verified administrator location, user, and moderation permissions plus immutable audit records.
- Added `get_dance_card_contact`, which returns one WeChat ID only after rechecking the entire card and location visibility chain.
- Added query-time Shanghai expiry exclusion plus a deployed daily CloudBase event function. The function uses a server-only rotated maintenance token whose database representation is only a SHA-256 digest.
- Created the enabled `daily-expiration` timer (`0 10 0 * * * *`) and successfully invoked the function manually with `affected: 0`.

## Step 30 Verification

- `database/tests/milestone-3.sql` passes transactionally, including constraints, RLS, audit, contact, expiry, stable price ordering, and 20-row pagination.
- Anonymous maintenance calls without the token fail; the deployed function succeeds.
- The public listing query uses `dance_cards_public_listing_idx` for the tested sort/filter shape.
- All 14 migrations through `20260821195300` are applied in the development environment with matching rollback files.

## Steps 31–42 Record

- Implemented the Neo-pop mobile theme, safe-area layout, three-tab navigation, shared loading/error/empty states, and the complete public route chain from cities through card details.
- Connected the user app to CloudBase through the shared API client. Anonymous sessions can read active Beijing/Shanghai location data and public cards; public list/detail payloads omit WeChat IDs.
- Implemented the seven-item FAQ, administrator contact instructions, the card-detail disclaimer, risk confirmation, protected single-card contact lookup, and clipboard feedback.
- Added safe H5 route-parameter decoding after deployed verification found encoded Chinese page titles.
- Added invalid UUID handling so malformed links show an unavailable/empty state instead of exposing a PostgreSQL error.
- Expanded Playwright coverage to the full guest journey, a studio with no cards, and an invalid card link. The three-test journey passed twice consecutively.
- Built H5 and WeChat targets and the administration shell successfully. The H5 buyer flow was deployed to and manually verified on the development hosting domain; this is not the formal production release.

## Step 42 Verification

- Formatting, ESLint, strict TypeScript, all unit tests, and all three Playwright buyer tests pass.
- H5, WeChat mini-program, and administration production builds pass.
- The deployed development H5 was manually walked through “上海 → 静安区 → CASTER → ¥45 次卡 → 详情”; price ordering and decoded Chinese labels were visible.
- At the Step 42 checkpoint, seller login, publication, personal card management, and administration operations were still unimplemented; the later records below supersede that historical state.

## Next Handoff

The development MVP and public source publication are complete. The next product milestone is formal production readiness: privacy policy, user agreement, professional legal review, production CloudBase configuration, domain, and release acceptance. Read `memory-bank/architecture.md` and `memory-bank/Design-Document.md` in full before any further code changes.

## Steps 43–53 Record

- Implemented H5 phone OTP login, persisted business profiles, safe studio return paths, account nickname/WeChat defaults, and a shared validated publish/edit form.
- Added server-derived ownership, active-user and active-location checks, atomic publication, owner-only list/edit/hide/restore/delete operations, and protections against restoring expired or administrator-hidden cards.
- Implemented “我的次卡” across active, manually hidden, administrator-hidden, and expired states. Soft-deleted records disappear from user views but remain in PostgreSQL.
- A deployed seller acceptance record was published, edited from 7 / ¥9.99 to 8 / ¥10.01, hidden and confirmed absent publicly, restored and confirmed public, then deleted through the confirmation modal. A database check confirmed one retained soft-deleted acceptance row.
- Live verification found and fixed an administrator-specific ownership leak: administrator RLS can read all cards, so seller API queries now explicitly filter by current business-user ID.
- Live verification also found CloudBase browser-SDK parsing failures for scalar UUID RPC results. Browser-facing profile and mutation wrappers now return one-row tables; `database/tests/milestone-5.sql` covers these wrappers.

## Steps 54–62 Record

- Implemented the separate Ant Design administration app with a no-flash role guard and no administrator registration entry point.
- Completed phone verification for the requested administrator number, manually promoted exactly the one newly verified phone identity, and recorded the bootstrap in the append-only audit log.
- Implemented city, district, studio, card moderation, user status, and read-only audit-log areas with filters and required reasons.
- Implemented normalized exact-duplicate prevention for studios plus non-blocking similarity warnings.
- Verified the deployed dashboard can read Beijing and Shanghai, changed Beijing sort order from 10 to 11 through the UI, observed a successful audited write, restored it to 10, and confirmed both update actions in the audit-log page.
- Transactional database suites verify administrator-only writes, moderation, disabled-user visibility, self-disable prevention, duplicate blocking, state rules, and audit creation.

## Latest Regression Evidence

- Formatting, ESLint, strict TypeScript, 40 unit/component tests, and 4 Playwright guest/login-routing tests pass.
- `database/tests/milestone-3.sql` and `database/tests/milestone-5.sql` both pass transactionally after the final migrations.
- H5, WeChat mini-program, and administrator production builds succeed. The remaining build output contains upstream Sass legacy-API deprecation notices and an administrator bundle-size advisory; neither is a runtime failure.
- The deployed H5 and administrator app were manually exercised against the real development CloudBase environment. Build artifacts were scanned for server-secret markers and seeded contact values with no match.
- WeChat Developer Tools is not installed in the current environment, so the required developer-tools visual smoke remains an external acceptance item even though the WeChat production build passes.
- Formal production is not configured. Privacy policy, user agreement, professional legal review, production CloudBase, and formal domain/release checks remain blocking prerequisites for public launch.

## Step 63 UI Quality Pass

- Replaced the native three-tab bar with one Neo-pop primary navigation component that remains visible on every user-app route and uses explicit text symbols instead of blank icon placeholders.
- Removed instructional subtitles from hero cards across city, district, studio, card, login, FAQ, seller, publish, and edit pages.
- Replaced the inline “找不到舞室” notice with a reference-style modal. New city, district, and studio requests now use `m18800126467@163.com`; the administrator phone remains login-only.
- Reworked the phone verification row so the six-digit input and compact “获取验证码” button are visually distinct. Explicit H5 styles override Taro's `disabled="false"` color rule, which had made valid button labels appear blank.
- Standardized the two dance-scope choices to equal 50/50 dimensions and the seller card actions to a consistent three-column layout with visible labels.
- Removed the second confirmation modal from seller contact. The protected single-card lookup now copies the WeChat ID immediately and keeps the existing success/failure feedback.
- Updated product documentation and tests for the new contact and support behavior. The mobile-first Playwright viewport now covers the persistent navigation, direct contact copy, studio-help modal/email copy, empty state, invalid card state, and login return path.
- Verification passed: formatting, ESLint, workspace TypeScript, 41 unit/component tests, 5 H5 Playwright tests, H5 production build, and WeChat production build.
- Deployed the verified H5 artifact to the existing development acceptance URL and manually rechecked the home page, FAQ navigation, support email, full card-detail path, persistent bottom menu, and direct WeChat copy feedback against the live environment.

## Dark Editorial Visual Redesign

- On 2026-08-24 the user approved a dark editorial/archive visual direction and specifically approved the revised numbered city-selection screen.
- Replaced the Neo-pop user-app styling with a unified near-black, warm-white, coral-orange, muted-gold, and cool-slate system across browsing, detail, FAQ, login, publishing, editing, and seller-management views.
- Added a persistent DanceCARD masthead, compact numbered bottom navigation, restrained rectangular controls, editorial metadata labels, and numbered city/district/studio rows. The bottom navigation remains visible on every user-facing route as required by the product design.
- Saved the approved visual mockup as `memory-bank/assets/ui-reference.png` and archived the superseded Neo-pop reference as `memory-bank/assets/ui-reference-neo-pop-archive.png`.
- Verification passed: formatting, ESLint, workspace TypeScript, 41 unit/component tests, 5 H5 Playwright journeys, H5 production build, and WeChat production build.
- Deployed the redesigned H5 build to the existing development acceptance URL for product review; production and legal release prerequisites remain unchanged.

## Public GitHub Publication

- Published the repository as `PUBLIC` at `https://github.com/fvpswrdnz2-commits/DanceCARD` with `main` as the only remote branch.
- Added a public-facing `README.md`, a private vulnerability-reporting policy in `SECURITY.md`, and refreshed `AGENTS.md` to match the implemented workspace and commands.
- Audited the current tree and local history for database URLs, private keys, access keys, CloudBase maintenance tokens, tracked runtime configuration, personal test identities, and machine-generated commit email addresses.
- Replaced the real administrator identity and previously used OTP value in tracked test/documentation content. The support email remains intentionally public because it is part of the product UI.
- Published a sanitized current-source snapshot using the GitHub no-reply author address. Earlier development history is preserved only in an ignored local recovery bundle and was not pushed.
- Confirmed the public tree tracks only placeholder `.env.example` files; real `.env` files and `cloudbaserc.json` remain ignored.
- Public-release verification passed: formatting, ESLint, workspace TypeScript, 41 unit/component tests, 5 Playwright H5 journeys, H5 production build, WeChat production build, and administrator production build.
- GitHub publication does not deploy the product. The existing CloudBase development H5 and administrator runtime remain unchanged, and no automatic deployment workflow is configured.
