# HacoLED Data

<!-- impeccable:product-schema 1 -->

## Platform
web

## Users
HacoLED's marketing manager and internal team manage marketing data, team surveys, content, leads and reporting. Administrators add members, set/reset passwords and assign roles.

## Product Purpose
An independent internal marketing workspace, separate from HacoLED's public website.

## Capabilities and Constraints
Existing Next.js 14 / React 18 application deployed on Vercel. Preserve operational modules, survey submissions, metric definitions and existing data. Neon PostgreSQL is connected to the Vercel project; local credentials have not been supplied. Existing operational data is a browser-local demonstration, not a shared production database. Account permissions must be enforced on the server.

## Brand Commitments
HacoLED red as the primary color, yellow accents, supplied Đông Sơn drum artwork rendered yellow, and Chakra Petch with Vietnamese support. The user explicitly chose a light TailAdmin-inspired workspace with a white sidebar.

## Evidence on Hand
Existing business definitions in README.md and src/lib/store/database.ts. TailAdmin free-nextjs-admin-dashboard is the user's layout reference. Supplied drum asset is preserved in public/brand/dongson-original.webp.

## Product Principles
- Preserve existing workflows and clearly distinguish sample data from live records.
- Use named accounts and server-side permissions.
- Keep standard PostgreSQL schemas portable.
- Make frequent internal tasks easy to scan and complete.
