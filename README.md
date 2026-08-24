# DanceCARD

DanceCARD is a mobile-first information exchange tool for unused dance-studio class cards. Buyers browse by city, administrative district, and studio; sellers publish remaining classes and provide a WeChat contact. The platform does not process payments, guarantee transactions, or verify listings.

![DanceCARD visual direction](memory-bank/assets/ui-reference.png)

## Current status

The guest, seller, and administrator MVP flows are implemented in a CloudBase development environment. H5 is the V1 release target. The WeChat Mini Program target builds successfully but is not submitted or released. A production environment, custom domain, privacy policy, user agreement, and professional legal review are still required before formal public launch.

## Architecture

- **User app:** Taro 4, React 18, TypeScript, Vite, NutUI Taro, SCSS
- **Admin app:** React, TypeScript, Vite, Ant Design
- **Backend:** Tencent CloudBase Auth, Node.js cloud functions, PostgreSQL
- **Quality:** ESLint, Prettier, Vitest, Testing Library, Playwright

```text
Taro user app ── H5 / WeChat build ─┐
                                    ├─ CloudBase Auth and functions ─ PostgreSQL
React admin app ── Web build ───────┘
```

## Repository layout

```text
apps/               User and administrator applications
packages/           Shared domain, validation, and API packages
cloudbase/          Ordered PostgreSQL migrations
cloudfunctions/     Protected backend functions
database/           Rollbacks, seed data, and SQL tests
e2e/                Playwright journeys
memory-bank/        Product, architecture, and delivery decisions
```

## Local development

Requirements: Node.js 22–24 and pnpm 11.

```bash
pnpm install
cp apps/user-app/.env.example apps/user-app/.env.local
cp apps/admin-web/.env.example apps/admin-web/.env.local
pnpm dev
```

Fill local environment files with your own CloudBase development environment. Never commit real credentials or user data.

## Verification

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test:unit
pnpm test:e2e
pnpm --filter user-app build:h5
pnpm --filter user-app build:weapp
pnpm --filter admin-web build
```

Product behavior is defined in [`memory-bank/Design-Document.md`](memory-bank/Design-Document.md). Architecture and security boundaries are documented in [`memory-bank/architecture.md`](memory-bank/architecture.md).

## Security and privacy

Environment IDs and client API endpoints may be public, but database URLs, SMS credentials, maintenance tokens, private keys, administrator identities, and real user records must remain outside Git. See [`SECURITY.md`](SECURITY.md) before reporting a vulnerability.

## License

No open-source license has been granted. The repository is public for product and engineering transparency; all rights are reserved unless a license is added later.
