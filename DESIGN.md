---
name: HacoLED Data
description: A light marketing operations workspace with HacoLED identity.
colors:
  primary: "#bd2027"
  primary-hover: "#94171d"
  gold: "#f4c34e"
  canvas: "#f5f6fa"
  surface: "#ffffff"
  ink: "#242936"
  muted: "#667085"
  line: "#e6e9ef"
  active-nav: "#fff0f0"
  success: "#167b52"
  success-surface: "#eaf8f1"
typography:
  headline:
    fontFamily: "Chakra Petch, sans-serif"
    fontSize: "25px"
    fontWeight: 600
    lineHeight: 1.35
    letterSpacing: "-0.5px"
  title:
    fontFamily: "Chakra Petch, sans-serif"
    fontSize: "16px"
    fontWeight: 600
  body:
    fontFamily: "Chakra Petch, sans-serif"
    fontSize: "14px"
    fontWeight: 400
  label:
    fontFamily: "Chakra Petch, sans-serif"
    fontSize: "12px"
    fontWeight: 600
rounded:
  control: "8px"
  panel: "16px"
  legacy-panel: "12px"
  status: "6px"
spacing:
  control-gap: "8px"
  mobile-gutter: "16px"
  section-gap: "24px"
  desktop-gutter: "30px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.surface}"
    rounded: "{rounded.control}"
    padding: "10px 17px"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "#525e70"
    rounded: "{rounded.control}"
    padding: "10px 17px"
  navigation-active:
    backgroundColor: "{colors.active-nav}"
    textColor: "{colors.primary}"
    rounded: "{rounded.control}"
    padding: "12px"
  account-input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "11px 13px"
    height: "45px"
---

# Design System: HacoLED Data

## Overview

A light, TailAdmin-inspired operations interface: white navigation and panels, a quiet gray canvas, clear data hierarchy, and restrained red and yellow brand details. The user confirmed this direction, local Chakra Petch typography, and the supplied Đông Sơn artwork.

Scope is the dashboard shell, live task overview, member management, task table/Kanban/to-do, personal profile, component library and login. Existing operational detail views retain their components with scoped brand overrides; this document does not imply a full redesign of those views. Source authority is `src/app/globals.css`, dashboard shell and member components, root layout, Tailwind configuration, and the shared UI primitives.

## Colors

Primary red identifies actions, selected navigation and key brand details; darker red is its hover state. Gold identifies cultural artwork and small accents. White surfaces sit on the canvas with ink for content, muted text for supporting information, and thin neutral dividers. Green is reserved for successful or enabled states, paired with explicit text.

**The Brand Detail Rule.** Keep the navigation white. Use red and gold deliberately within the light workspace.

## Typography

Chakra Petch is locally hosted in normal weights (400, 500, 600, 700), loaded through `next/font/local`, with a sans-serif fallback and Vietnamese document language. Use the frontmatter hierarchy; dense table content is smaller (12px), supporting labels range from (10–12px), and metric values use semibold tabular figures where appropriate. The login title is (30px); its desktop brand headline scales with `clamp(32px, 4.4vw, 65px)`.

## Layout

The desktop shell uses a fixed sidebar (270px), sticky topbar (86px), and centered content with maximum width (1680px). Standard gutters use the spacing tokens. At widths up to (1200px), the sidebar becomes (240px) and content gutters become (24px); at (1600px) and above content padding becomes (36px 40px).

Below (1024px), navigation becomes an off-canvas drawer over a scrim, with a close button, Escape dismissal, Tab containment and focus return. At widths up to (640px), the topbar becomes (66px), headings and forms stack, account descriptions recede, and table filters fill the available width. Wide tables scroll inside their own containers. Login uses equal desktop columns and a single form column on mobile, hiding the decorative brand panel.

## Elevation & Depth

Panels are mostly flat; canvas contrast and one-pixel borders establish structure. The search-results overlay uses `0 12px 25px #24293612`. The mobile navigation scrim uses `#171c2b66`. Avoid adding shadows to every data card. Legacy explanatory tooltips retain their elevated dark treatment.

## Shapes

Controls use the control radius, major new panels use the panel radius, and retained operational cards use the legacy-panel radius. Avatars and status dots are circular. Prefer thin dividers and compact rounded rectangles over decorative containers.

## Components

- **Buttons:** Semibold labels with outline icons and a minimum height (42px). Primary uses red and darkens on hover; secondary uses a white surface and neutral border. Disabled controls reduce opacity to (0.55). Icon buttons are square (36px).
- **Fields:** Account inputs use a neutral border, red caret and red focus border with a translucent red outline. Visible labels accompany form fields; password visibility has an explicit accessible label. Search and role filters retain their compact table styling.
- **Navigation:** Outline Lucide icons use consistent stroke treatment; active rows pair a pale red surface with red text and a chevron. Group labels are small and tracked. Search operates on available workspace destinations.
- **Tasks:** One database collection supports table, Kanban and deadline-grouped to-do. Shared search, status, channel, KPI and assignee filters; advanced filters collapse on mobile, where table rows become stacked records. No priority UI. Full administrators select up to 100 tasks across views/pages and confirm bulk deletion; changing filters clears selections. The detail drawer keeps task identity visible, separates assignment and delivery, prioritizes outcome/status/images, and provides a sticky save action. Assignees can complete their own to-do items; supervisors see other visible tasks read-only. Images can be pasted, chosen or dropped, optimized and previewed before saving, then served through the authenticated task attachment route.
- **Charts:** Recharts renders actual monthly task creation and status distribution. Period controls change the monthly window; empty data stays explicit. Legacy marketing metrics are grouped behind a clearly labelled demonstration disclosure.
- **Team:** Table and card views share real member actions and task completion counts. Initial avatars use actual names.
- **Profile:** Members can edit their own name/email. Role, account state and security information are read-only.
- **Shared primitives:** Panel, Notice, EmptyState, LoadingState, Avatar, StatusBadge, PriorityBadge, Pagination and Drawer live in `src/components/dashboard/ui`. Drawers trap focus, support Escape and return focus to the invoking control. `/admin/components` demonstrates the same controls for full administrators; examples do not persist business data.
- **Panels and tables:** Separate section headers, toolbar, table and footnote. Member identity combines an initial avatar, name and email. Status uses a dot and text, never color alone. Loading, empty, failure and success states remain explicit.
- **Đông Sơn artwork:** Preserve `/brand/dongson-original.webp`. Render it through the supplied CSS luminance mask with gold as its background, decorative and noninteractive. Crop within panels; keep artwork behind content. Welcome, sidebar note, member intro and login apply their own scale and opacity.
- **Retained detail components:** Badges, meters, metric cards and explanatory tooltips keep their existing APIs. Scoped brand overrides replace selected dark/blue accents with red; tooltip panels remain ink-colored. On mobile, tooltip content becomes a fixed bottom panel within viewport gutters.

## Do's and Don'ts

- **Do** preserve the white sidebar, compact information hierarchy and Vietnamese typography.
- **Do** keep visible keyboard focus, accessible icon labels, drawer keyboard behavior and reduced-motion support.
- **Do** preserve existing workflow content, metric definitions and explicit sample-data notices.
- **Don't** replace the supplied drum with an invented pattern or use it behind dense table text.
- **Don't** promote gold into the default action color or remove semantic status labels.
- **Don't** assume the retained operational detail views have adopted every new panel treatment.

## Reference and licensing

The user-supplied `free-nextjs-admin-dashboard-main.zip` informed panel, table, chart, team and profile hierarchy. Kanban/to-do and real application workflows were implemented for HacoLED. TailAdmin MIT attribution is preserved in `public/licenses/tailadmin.txt`. Desktop and 390px mobile workflow captures are stored in ignored `.impeccable/review/`.

## Task result workflow

Existing task drawers offer Information and Results/Progress sections. Owners land on reporting; administrators retain the assignment editor and have direct result links in each table row. Results include progress, existing checklist completion, narrative and up to ten evidence links. Pasted direct image URLs create inline previews; images expand in place and broken sources have a clear fallback. History discloses snapshots progressively. Unsaved report dismissal requires confirmation; stale versions show a recoverable conflict rather than overwriting another report. All controls preserve the existing light red/gold system and responsive drawer.

## Social channels

`/admin/channels` uses the same white panels, branded primary actions, search, platform filter and card/table density. Channel cards distinguish metadata (platform, public URL, handle, notes, active/archive state) from credential access. An editor groups channel details, explicit credential replacement/clear, and member grants. Credentials open only in a separate drawer after a deliberate reveal, with a masked password, immediate-hide control and timed/visibility-based clearing. Metadata notes explicitly exclude passwords. Task assignment and result forms share the channel selector; the task table and cards show channel names and provide a channel filter. Archived channels remain identifiable on existing work.

## Monthly KPI workspace
`/admin/kpis` shows a month picker, scoped person/channel filters, target cards with actual/target units, uncapped percentages, remaining/excess amounts and links to the corresponding task list. Shared progress bars cap visually at 100%; the percentage and excess label continue above 100%. Quantity types remain separate. Extra completed work has a separate table and a link to all work outside KPI. On mobile, target panels and header actions stack; wide detail tables scroll within their own container.

Task creation includes KPI association, output type and planned quantity. Results include actual quantity and a production date, with a warning when the date lies outside the selected KPI period. Selecting a plan sets its channel/type. Changing the channel or assignee clears the previous association so cross-person/channel units cannot be silently counted. The report drawer shows refreshed plan progress after saving, and retains its existing checklist, result and evidence workflow. KPI identity (person/channel/type/month) is immutable after creation; target/notes/active edits remain explicit and audited.

## Bulk planning and monthly review interface

KPI import uses a drawer: download schema/directory → upload or paste → explicit create/update mode → validate row preview → confirm. Invalid rows show their reason and block commit; changing input invalidates the preview. Task-plan import uses the same explicit preview pattern and discloses its optional monthly KPI relation. Retry IDs remain stable until the batch succeeds.

The operational overview prioritizes a month selector and six comparable metrics, followed by six-month task counts, separate output-type comparisons, employee comparisons, plan/work discrepancies and structured-brief breakdowns. The dedicated `/admin/performance` shares this component. Person drawers link to filtered work. Mobile tables scroll inside containers; chart panels stack. Missing baselines render as insufficient data. Red/gold HacoLED styling and existing shared components are retained.

KPI và đánh giá tháng dùng chung mục **KPI & hiệu suất** tại `/admin/kpis`: hai phần **Chỉ tiêu tháng** và **Đánh giá hiệu suất** giữ tháng đang chọn khi chuyển qua lại. Đường dẫn cũ `/admin/performance` chuyển đến phần đánh giá trong trang này. Giao/import KPI vẫn theo quyền hiện có.
