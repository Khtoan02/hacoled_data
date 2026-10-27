# HacoLED Data

<!-- impeccable:product-schema 1 -->

## Platform
web

## Users
HacoLED's marketing manager and internal team manage marketing data, team surveys, content, leads and reporting. Administrators add members, set/reset passwords and assign roles.

## Product Purpose
An independent internal marketing workspace, separate from HacoLED's public website.

## Capabilities and Constraints
Existing Next.js 15.5 / React 18 application deployed on Vercel. Preserve operational modules, survey submissions, metric definitions and existing data. Neon PostgreSQL is connected to the Vercel project; local credentials have not been supplied. Existing operational data is a browser-local demonstration, not a shared production database. Account permissions must be enforced on the server.

## Brand Commitments
HacoLED red as the primary color, yellow accents, supplied Đông Sơn drum artwork rendered yellow, and Chakra Petch with Vietnamese support. The user explicitly chose a light TailAdmin-inspired workspace with a white sidebar.

## Evidence on Hand
Existing business definitions in README.md and src/lib/store/database.ts. TailAdmin free-nextjs-admin-dashboard is the user's layout reference. Supplied drum asset is preserved in public/brand/dongson-original.webp.

## Product Principles
- Preserve existing workflows and clearly distinguish sample data from live records.
- Use named accounts and server-side permissions.
- Keep standard PostgreSQL schemas portable.
- Make frequent internal tasks easy to scan and complete.

## Member Roles and Task Access
Six member roles: Kinh doanh (pending business permissions), Giám đốc and Leader Marketing (full administration), Trưởng phòng Marketing (own tasks plus Marketing staff/intern tasks), Nhân viên Marketing and Thực tập Marketing (identical own-task visibility and reporting). Account and task permissions are enforced on the server. Task approval configuration is a separate future workflow, not a fixed role-matrix column.

## Current Operational UI
Database-backed task table, Kanban and to-do views share priority, due dates, checklist and scoped permissions. Assignees can submit result text, inline image links and progress for their own work; definition changes remain administrator-only. Overview charts use actual task records; team card/table views use real members and task counts. Personal profile editing changes only the signed-in member name/email. An administrator-only UI library documents reusable components. Legacy marketing modules remain explicitly marked browser-local demonstrations.

Task result snapshots preserve reporter, assignee, deadline and completion timestamps for future KPI reconciliation. Completed status is not content approval or KPI achievement. KPI targets and quality scoring remain undefined.
