# Repository Guidelines

## Project Structure & Module Organization

DanceCARD is a pnpm workspace. `apps/user-app/` contains the Taro H5 and WeChat client; `apps/admin-web/` is the React administration console. Shared models, validation, and transport adapters live in `packages/`. CloudBase migrations are append-only under `cloudbase/migrations/`; matching rollbacks, repeatable seed data, and SQL checks live in `database/`. Server functions are under `cloudfunctions/`, Playwright journeys under `e2e/`, and product decisions under `memory-bank/`.

Keep unit and component tests beside their source as `*.test.ts` or `*.test.tsx`. Applications may import shared packages but must not import another application's source.

## Build, Test, and Development Commands

Run commands from the repository root:

- `pnpm install`: install the locked workspace dependencies.
- `pnpm dev`: start packages that expose development servers.
- `pnpm format:check && pnpm lint && pnpm typecheck`: run static quality gates.
- `pnpm test:unit`: run Vitest and Testing Library suites.
- `pnpm test:e2e`: run Playwright H5 journeys.
- `pnpm --filter user-app build:h5`: build the release H5.
- `pnpm --filter user-app build:weapp`: verify the WeChat target.
- `pnpm --filter admin-web build`: build the administration console.

## Coding Style & Naming Conventions

Use TypeScript, two-space indentation, semicolons, Prettier, and ESLint. Name components and types in `PascalCase`, hooks as `useSomething`, variables in `camelCase`, and files in `kebab-case`. Shared user UI must use Taro components and platform adapters rather than browser-only APIs. Do not add Redux, Tailwind, or another backend without updating `memory-bank/tech-stack.md`.

## Testing Guidelines

Add regression coverage for behavior changes. Prioritize validation, ownership, visibility, expiration, price ordering, and administrator authorization. Shared UI changes must pass unit tests plus both H5 and WeChat builds. Database changes require a timestamped migration, matching rollback, and transactional SQL verification.

## Commit & Pull Request Guidelines

Use focused Conventional Commits, such as `feat(user-app): add studio card list` or `fix(database): enforce card visibility`. Pull requests must describe user-visible behavior, reference the relevant design requirement, list verification commands, and include mobile screenshots for UI work. Highlight migrations, RLS changes, and new environment variables.

## Security & Configuration

Never commit real user data, phone numbers, `.env` files, CloudBase credentials, database URLs, or maintenance tokens. Track safe placeholders only in `.env.example`. Public list and detail payloads must exclude WeChat IDs; contact lookup, ownership, and administrator access remain server-enforced. Report vulnerabilities through the private channel documented in `SECURITY.md`.

## 重要提示

写 任 何 代码 前 必 须完整阅 读:memory-bank/architecture.md

写任何代码前必须完整阅读 memory-bank/Design-Document.md

每完成一个重大功能或里程碑后，必须更新memory-bank/architecture.md
