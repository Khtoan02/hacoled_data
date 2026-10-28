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

`003-tasks.sql` adds tasks referencing real member UUIDs. `/api/tasks` applies scope in SQL before returning rows, including requests by task ID; client-side filters do not determine access. Full administrators assign tasks and edit existing task definitions. Marketing members may also create work for themselves. Manager/staff/interns can report progress, checklist completion and results on their own assignments through `/api/tasks/report`. Other visible tasks remain read-only. They cannot edit assignment, title, due date, priority or checklist definitions. Approval rules are not represented in the role matrix and have not yet been implemented in task management.

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

`004-task-details.sql` adds constrained priority, JSON checklist and update timestamps without replacing existing tasks. Full administrators can assign/edit/delete tasks, update checklist definitions and move status through table, Kanban or to-do views. Members can create their own tasks. Other Marketing roles retain scoped visibility and can report only their own assignments as described below. Charts and team completion figures derive from these real task records.

`/api/profile` returns only the signed-in member’s public account fields and accepts name/email updates for that same member. Role, active status, IDs and password changes cannot be submitted through this endpoint. Password resets remain in member administration.

The UI workflow suite verifies persisted priority/checklist, Kanban drag, to-do completion, editing/deletion, profile updates, prohibited role changes and restricted mutation access, with desktop/mobile captures.

## Results, evidence and KPI groundwork

`005-task-reports.sql` adds result text, up to 10 browser-previewed evidence URLs, server-recorded completion time and a report version. Staff, interns and managers may report only their own assignments. Leader/Director may report any task. The report endpoint accepts only status, result text, evidence links, channel selection and existing checklist item completion; assignment/definition fields are rejected. Concurrent stale submissions return 409 and the UI offers an explicit reload without silently discarding drafts.

Every report and administrator edit atomically appends an immutable snapshot to `app_task_reports`: actor name/ID, task title, assignee, due date, result, evidence, checklist, status and completion time. Reopening clears the current completion timestamp but keeps prior snapshots. Repeated completed-state updates preserve the original completion time. Existing completed tasks are not assigned invented historical completion dates. History is retained even if an administrator deletes a task; normal task history APIs require access to an existing task. Current history is limited to the latest 50 entries in the UI; all records remain in PostgreSQL.

URLs are loaded only by the browser with no referrer, never fetched/proxied by the application server. Only HTTP/HTTPS without embedded credentials are accepted. Image preview depends on the source's permissions and hotlink policy; ordinary Drive/share-page URLs may not render as images. Broken previews do not erase the saved URL. No image upload or image storage service is added.

Completion is a self-reported progress state, not approval or a scored KPI. Monthly quantity targets and period reconciliation are implemented below. Quality review and weighted scoring remain separate future business workflows.

## Social channel catalog and credential access

`006-social-channels.sql` creates the social channel catalog, per-member credential grants, credential-access/change audit and optional task-to-channel links. Marketing members can browse channel metadata and choose an active channel on their own task report. Leader/Director/Marketing Manager create and edit channel metadata, manage grants and archive/restore channels. Archived channels cannot be selected for new assignments or reveal credentials, but existing task links remain readable and can be retained on updates. Channel name/ID are snapshotted with each task report to support later per-channel reconciliation.

Catalog and task APIs never return usernames, passwords or ciphertext. The separate same-origin POST `/api/social-channels/credentials` checks current active channel and grants on every reveal, returns `Cache-Control: no-store, private` and records who viewed which channel. Leader/Director/Marketing Manager have implicit access; staff/interns require an explicit per-channel grant. Kinh doanh remains pending and cannot access the catalog/credentials. Grants allow revealing credentials only, not editing the channel or other members' work. Credential strings are kept only in component memory, initially masked, and cleared when closing, after 60 seconds, or when the document becomes hidden.

Credentials are encrypted together using AES-256-GCM with a fresh 12-byte IV per write. The versioned envelope contains only ciphertext/IV/authentication tag in PostgreSQL. Set `SOCIAL_CREDENTIALS_KEY` to 32 random bytes represented by 64 hex characters, server-only. `npm run credentials:key` creates the key in ignored `.env.local` without printing it or replacing an existing valid key. Add the same value in **Vercel → Project Settings → Environment Variables → Production**, then redeploy. Keep a secure backup of the key; losing/changing it prevents decryption of existing credentials. Preview/test databases should use their own keys and data. Metadata-only channel management works without this key; credential saves/reveals fail explicitly rather than falling back to plaintext.

Saving metadata without a credential replacement preserves the encrypted value. An explicit replacement stores exactly the supplied new username/password; an explicit clear removes it. Channel changes and reveal operations serialize under a dedicated database advisory lock. Optimistic channel versions prevent stale editors from restoring revoked grants. Audits record actor, action and channel, never secret values. Ordinary notes and names are shared metadata; credentials belong only in the dedicated fields.

The isolated social-channel test exercises ciphertext at rest, metadata non-disclosure, scoped reveals, grant revocation, stale updates, archive/clear behavior, automatic hiding, task channel selection and report snapshots, plus desktop/mobile layouts. It uses synthetic credentials and a test-only encryption key, never production data.

## Monthly KPI assignment and reconciliation

`007-monthly-kpis.sql` adds one unique target per `(assignee_id, channel_id, month, output_type)`, positive integer quantity targets, versioned target edits, and append-only target-change audit. Leader/Director create and update targets. After creation, person/channel/month/type cannot be changed; targets can be paused/reactivated or adjusted with optimistic version checks. New targets require active Marketing members and active channels. Other roles have the same read scopes as task management; Kinh doanh remains denied.

`008-task-multi-channels.sql` adds the many-to-many channel list for tasks and backfills every existing task's primary channel. The existing `channel_id` remains the primary channel used by a linked KPI, preserving historical reports and KPI reconciliation.

`009-task-briefs.sql` adds a structured brief object to each task. The UI chooses fields from the output type and selected platforms: Facebook posts, Website posts, video work, and other work no longer share one generic requirement form.

Tasks gain an optional KPI relation, output type, planned quantity (default 1), reported delivered quantity (default 0), and production date. Existing records do not receive invented delivered quantities or automatic KPI matches. An explicitly completed task without a production date defaults to the current date in Asia/Ho_Chi_Minh. Production dates can be reported historically, but cannot be future/invalid dates. Quantities are whole numbers, max 100,000 per task; delivered zero means no production units reported. Work may explicitly be complete with zero units, which contributes no units to KPI. Quick completion without a separately supplied quantity defaults to planned quantity; explicit zero is preserved.

The KPI API sums the **current task row**, not report-history entries: only completed tasks whose assignee, channel and output type match the linked target; the KPI month is the assigned target month, including deliveries before or after that month. Reporting the same quantity twice does not double-count. Reopening a task excludes it until completed again; deleting a task removes its current contribution and the UI warns about that. Outside-month completed quantities are shown separately and credited to the assigned KPI period; actual-production monthly reports still use the production date. Planned volume is informational, not attainment. The UI shows actual/target, percentage (uncapped, truncated to one decimal), remaining/excess units and task links. No cross-unit global percentage is invented.

Members may POST their own tasks for KPI work or extra work; assigning another person and editing existing assignment definitions still require full administration. Owner reports can choose only a matching personal KPI/channel/type and cannot change the target or planned quantity. A paused KPI cannot receive new task links; existing links can still report and preserve history, and paused plans can be viewed explicitly. SQL enforces KPI/assignee/channel/type consistency on create/update/report. Reassignment or changing channel/type requires clearing the old KPI link or choosing a matching plan.

`/api/kpis?month=YYYY-MM` returns scoped plans and completed extra tasks in that month. `month=all` supports scoped task selectors. Extra work is work without a KPI relation; the page counts tasks and lists each output unit separately. In-progress extra work is available through the task filter, not counted as completed. Historical completed tasks lacking a production date use their recorded completion timestamp for the extra-work period, if available. Report snapshots now retain KPI ID, output type, planned/delivered quantities and production date.

The new KPI browser/API test covers assignment, duplicate/invalid targets, scope, quantities vs task counts, repeated reports, reopening, outside-month delivery, future dates, mismatched KPI binding, extra work, target version conflicts, personal task creation and desktop/mobile paths. Tests use the isolated fixture only. Quantity attainment is self-reported and is not content approval, automated publication verification, quality scoring, payroll or a weighted performance score.

## Bulk planning imports and monthly review

Run numbered migration `010-kpi-imports.sql` before enabling imports. It adds import batch ledgers for atomic/idempotent commits and a unique actor/content hash for task plans. It does not rewrite historical task or KPI data. Production Vercel prebuild runs it with the other numbered migrations.

Full administrators use `/api/kpis/import` for preview and explicit create/update commit. Inputs resolve active people and channels; duplicate identities, stale previews, ambiguous channels and invalid targets reject the batch. Import UUIDs make retries safe. `/api/tasks/import` now also requires preview/fingerprint/commit and optionally resolves `thang_kpi` to one matching active KPI. An identical task file cannot be committed again under a fresh batch ID for the same actor. Files accept up to 500 rows and 1.5 MB serialized data. SQL transactions either store the whole prepared batch or none.

KPI DELETE now removes the goal, keeps a deletion snapshot, and unlinks its tasks into extra work. Pausing remains PATCH active=false and preserves links. Paused goals are excluded from active target summaries, remain accessible with explicit filters and cannot accept new task links.

`/api/performance?month=YYYY-MM` applies role scope in SQL before aggregation and returns no channel credentials. Month boundaries use Asia/Ho_Chi_Minh. Goal quantities share the KPI API calculation. Production-date cohorts differ from due-date cohorts; punctuality uses server completion timestamps. Missing denominators return null. Six-month trends and person/brief breakdowns use current task state, not historical closed-period snapshots. See `docs/OPERATIONS_USE_CASES.md` for formulas, limitations and acceptance cases.

Trưởng phòng Marketing được quản lý danh mục kênh, thêm/sửa/lưu trữ kênh, cập nhật thông tin đăng nhập và cấp/thu hồi quyền xem đăng nhập cho thành viên. Giám đốc, Leader và Trưởng phòng có quyền xem đăng nhập kênh đang hoạt động; quyền tài khoản hệ thống và giao/import KPI vẫn theo phân quyền riêng. Danh sách cấp quyền kênh dùng API danh mục tối thiểu, không mở quyền quản trị thành viên.

KPI sản lượng ghi nhận theo **tháng chỉ tiêu đã giao** (tự liên kết từ hạn hoàn thành), kể cả làm sớm/trễ; ngày sản lượng thực tế vẫn giữ để phân tích hoạt động theo thời gian. Hoàn thành nhanh mặc định ghi nhận khối lượng đã giao nếu chưa nhập sản lượng; số thực tế nhập rõ, kể cả 0, được ưu tiên. Không cộng dồn các lần gửi lại. Việc cũ đã hoàn thành nhưng sản lượng 0 có cảnh báo và nút bổ sung từ khối lượng giao, không tự sửa hàng loạt.

Run `011-deletion-audit.sql` for Leader/Director deletion snapshots. KPI deletion transaction records the plan/history, unlinks existing work with report-version bumps, removes dependent target audit rows and then the plan. Task deletion records a snapshot before removing the task; prior task reports are retained. These endpoints require full administration and same-origin requests. Neither migration deletes existing records.

## Team chat

Migration `012-team-chat.sql` creates rooms, memberships with join/read sequence cursors and messages. Authenticated active members have chat access independent of business permissions. Every read/write is membership-scoped; full administrators have no implicit message access. Group owners manage rosters with optimistic versions; new joins see only newer sequences. Creates and sends use idempotency keys and serialized transactions. See `docs/TEAM_CHAT.md` for the complete contract and isolated tests.

`013-notifications.sql`: hộp thông báo theo thành viên, trigger giao việc/hoàn thành và khóa chống trùng; xóa công việc/KPI sẽ cascade thông báo tương ứng. Không backfill thông báo lịch sử.
