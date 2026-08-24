# Security Policy

## Supported version

DanceCARD is currently an MVP. Security fixes apply to the latest commit on `main`; older revisions are not maintained.

## Reporting a vulnerability

Do not open a public GitHub issue for vulnerabilities, exposed credentials, authorization bypasses, or personal-data leaks. Send a concise report to `m18800126467@163.com` with:

- the affected page, function, or file;
- reproduction steps;
- the potential impact;
- screenshots or a minimal proof of concept, with personal data removed.

Do not access, alter, or retain data belonging to other users. Allow reasonable time for investigation before public disclosure.

## Repository secrets

Only placeholder values belong in tracked `.env.example` files. CloudBase credentials, database URLs, SMS secrets, maintenance tokens, administrator identities, and real user records must remain in ignored local files or managed cloud configuration.
