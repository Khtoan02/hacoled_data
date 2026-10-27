# Accounts and permissions

This change adds account storage in standard PostgreSQL. It does not import survey JSON or browser-local operational data into PostgreSQL.

## Configure Neon and Vercel

1. In Vercel project settings, confirm `DATABASE_URL` is present for Production (the Neon integration usually adds it). Use the pooled URL for application requests.
2. Set `ADMIN_SETUP_TOKEN` to a long randomly generated secret. Generate one locally with `openssl rand -hex 32`; do not commit it or paste it into chat.
3. Production deployments on Vercel automatically run `npm run db:migrate` through the `prebuild` lifecycle before compiling the application. A missing/invalid connection stops the deployment. Preview and local builds skip this step. For local setup, put `DATABASE_URL` in ignored `.env.local` and run `npm run db:migrate` manually. Do not overwrite Blob variables. Migrations are transactional and rerunnable. They create account/task tables and migrate legacy role IDs as documented below.
4. Deploy the reviewed code. Open `/`, enter name, email, a password of 12–128 characters, and the setup token to create the first administrator. This endpoint can create only one first account, serialized by a PostgreSQL transaction lock.
5. Remove `ADMIN_SETUP_TOKEN` from the deployment environment and redeploy after setup. Existing logins do not depend on it.
6. Go to `/admin/members` to create named accounts, assign roles, reset passwords and lock/unlock accounts. Passwords are not recoverable; only resets are supported.

There is no default administrator password. The previous shared password and sessionStorage login are removed. Production deployment requires DATABASE_URL; administrators cannot log in until the first account is created using ADMIN_SETUP_TOKEN.

## Password-only sign-in

Members enter only their individually assigned password. Email remains a contact/profile field in member management, not a login requirement. Salted password hashes remain unchanged; password-only sign-in requires no additional environment variable. Role changes are handled by the role migration below.

Creation and password reset reject reuse of any other account's password, including inactive accounts. Existing duplicate active passwords are rejected at login rather than selecting an arbitrary identity; a Leader Marketing or Giám đốc must assign separate passwords. Writes check a credential snapshot under the account transaction lock to prevent concurrent duplicates. Session creation uses the same lock and verifies the current password hash so reset/revocation cannot race with login.

This deliberately targets a small internal team. Verification scans active salted scrypt hashes sequentially, so cost grows with account count. No plaintext passwords or fast deterministic password fingerprints are stored.

## Six member roles and task scope

| Role | Task visibility | Account administration |
| --- | --- | --- |
| Kinh doanh | Pending configuration; no business access yet | No |
| Giám đốc | All tasks | Full |
| Leader Marketing | All tasks | Full |
| Trưởng phòng Marketing | Own tasks plus those assigned to Marketing staff/interns | No |
| Nhân viên Marketing | Own assigned tasks | No |
| Thực tập Marketing | Own assigned tasks (same permissions as staff) | No |

`002-member-roles.sql` preserves member IDs, passwords and audit references. Legacy `fulltime_coord` maps conservatively to `marketing_staff`; an administrator can explicitly promote members to Trưởng phòng. SEO/video intern roles merge into `marketing_intern`. Previous AI member accounts become inactive staff records because AI is no longer an assignable human role. Migrated legacy-role sessions are revoked. Leader and Director IDs remain unchanged.

`003-tasks.sql` adds tasks referencing real member UUIDs. `/api/tasks` applies scope in SQL before returning rows, including requests by task ID; client-side filters do not determine access. Full administrators create tasks and update progress. Manager/staff/intern access is read-only at this stage. Approval rules are not represented in the role matrix and have not yet been implemented in task management.

Task lists start empty; old browser-local demonstration tasks are not imported or guessed onto real accounts. Non-admin Marketing accounts land on `/admin/tasks`. Business/financial dashboards and summary APIs require full administration; Kinh doanh lands on a pending-permissions page.

## Boundaries

- Leader Marketing and Giám đốc manage members. Other roles cannot call member APIs. Survey results require the role's HR-private-data permission.
- Account changes revoke existing sessions. The last active full administrator (Leader Marketing or Giám đốc) cannot be disabled or demoted. Member changes are audited without passwords.
- Session cookies are HTTP-only, SameSite=Lax, Secure in production, with seven-day expiry. Each request checks the active account and current role in PostgreSQL.
- Passwords use salted scrypt. Mutations require same-origin requests. Failed login attempts are limited per client IP (10 per 15 minutes). Vercel provides the trusted x-real-ip header; other hosting must configure a trusted reverse proxy to overwrite that header. Successful logins remove only their own counted attempt.
- Existing Marketing OS modules still use demonstration/browser-local data. They explicitly display this limitation. Their client-side UI permissions are not a substitute for a future server-backed operational API.
- Survey submissions still use the existing Blob/local-file store. The new API access checks protect results, but the old public Blob URL remains a separate exposure until data is migrated to private storage/PostgreSQL. Do not delete the old file until a verified backup and migration have been completed.
- No deployment, production database migration or changes to live Blob data are performed by the local build/tests.

## Verification

`npm run build` performs production compilation and TypeScript checking.

`npm run test:e2e` starts an isolated PostgreSQL-compatible PGlite fixture and local Next.js process. It uses a dummy Neon hostname intercepted only by the test preloader; it never accesses the live Neon database. Tests exercise first-admin setup, sign-in, member creation, restricted API access, last-admin protection, password/session revocation, account locking, login throttling, and mobile navigation. Browser screenshots are saved in `.impeccable/review/`.

Install the test browser once if needed: `npx playwright install chromium`.

PGlite verifies PostgreSQL schema/query behavior and application flows; final connectivity and concurrency should also be verified on a separate Neon development branch before production.

## Maintenance

Periodically delete expired rows from `app_sessions` and old rows in `app_auth_attempts`. Retain audit records according to internal policy. Export backups using standard PostgreSQL tools and test restoration separately.

## Task details and profiles

`004-task-details.sql` adds constrained priority, JSON checklist and update timestamps without replacing existing tasks. Full administrators can create/edit/delete tasks, update checklists and move status through table, Kanban or to-do views. Other Marketing roles retain the read-only scope described above. Charts and team completion figures derive from these real task records.

`/api/profile` returns only the signed-in member’s public account fields and accepts name/email updates for that same member. Role, active status, IDs and password changes cannot be submitted through this endpoint. Password resets remain in member administration.

The UI workflow suite verifies persisted priority/checklist, Kanban drag, to-do completion, editing/deletion, profile updates, prohibited role changes and restricted mutation access, with desktop/mobile captures.
