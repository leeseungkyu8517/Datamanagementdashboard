# Datamanagement Dashboard — Project Structure

## What This Project Is

A **B2B Sales & Company Data Management Dashboard** built for **BRYCEN** (a company with offices in Korea, Japan, and Vietnam). It manages client companies, sales personnel, sales history, task tracking, and revenue forecasting across three regional branches. The UI is in Korean and targets internal sales team use.

Built from Figma Make (Figma's code generation tool), it is a React SPA with Vite, using shadcn/ui + Radix UI components, Tailwind CSS v4, and Recharts for data visualization.

---

## Tech Stack

| Layer | Library / Tool |
|---|---|
| Framework | React 18 + React Router 7 |
| Build | Vite 6 |
| Styling | Tailwind CSS v4, tw-animate-css |
| UI Components | shadcn/ui (Radix UI primitives) + MUI (icons) |
| Charts | Recharts |
| Forms | react-hook-form |
| Drag & Drop | react-dnd |
| Dates | date-fns, react-day-picker |
| Notifications | sonner |
| Animations | motion (Framer Motion) |
| Package Manager | pnpm (workspace) |

---

## Directory Structure

```
C:\Datamanagementdashboard
├── index.html                        # App entry point
├── package.json                      # Dependencies & scripts
├── pnpm-workspace.yaml               # pnpm workspace config
├── postcss.config.mjs                # PostCSS (Tailwind)
├── default_shadcn_theme.css          # shadcn base theme
├── ATTRIBUTIONS.md                   # Asset attributions
├── guidelines/
│   └── Guidelines.md                 # Project guidelines (empty)
└── src/
    ├── main.tsx                      # React DOM render root
    ├── styles/
    │   └── fonts.css                 # Font imports
    ├── assets/
    │   └── *.png                     # Static image assets (logo, etc.)
    └── app/
        ├── App.tsx                   # RouterProvider root
        ├── routes.tsx                # All route definitions
        ├── components/
        │   ├── layout.tsx            # Root layout (Sidebar + Outlet)
        │   ├── sidebar.tsx           # Navigation sidebar
        │   ├── confirm-dialog.tsx    # Reusable confirm dialog
        │   ├── figma/
        │   │   └── ImageWithFallback.tsx  # Figma asset image wrapper
        │   └── ui/                   # shadcn/ui component library
        │       ├── accordion.tsx
        │       ├── alert-dialog.tsx
        │       ├── alert.tsx
        │       ├── avatar.tsx
        │       ├── badge.tsx
        │       ├── button.tsx
        │       ├── calendar.tsx
        │       ├── card.tsx
        │       ├── chart.tsx
        │       ├── checkbox.tsx
        │       ├── dialog.tsx
        │       ├── dropdown-menu.tsx
        │       ├── form.tsx
        │       ├── input.tsx
        │       ├── label.tsx
        │       ├── pagination.tsx
        │       ├── popover.tsx
        │       ├── progress.tsx
        │       ├── select.tsx
        │       ├── separator.tsx
        │       ├── sheet.tsx
        │       ├── sidebar.tsx
        │       ├── skeleton.tsx
        │       ├── table.tsx
        │       ├── tabs.tsx
        │       ├── textarea.tsx
        │       ├── tooltip.tsx
        │       ├── use-mobile.ts
        │       └── utils.ts
        └── pages/
            ├── company-korea.tsx           # Korean client company list & management
            ├── company-japan.tsx           # Japanese client company list & management
            ├── company-vietnam.tsx         # Vietnamese client company list & management
            ├── sales-personnel.tsx         # Korea sales rep management
            ├── sales-personnel-japan.tsx   # Japan sales rep management
            ├── sales-personnel-vietnam.tsx # Vietnam sales rep management
            ├── sales-history.tsx           # Sales deal history log
            ├── company-data-collection.tsx # Company info collection / research
            ├── my-tasks.tsx                # Personal task board (kanban/list view)
            ├── sales-dashboard.tsx         # Revenue forecast dashboard (charts + KPIs)
            ├── period-forecast-dashboard.tsx # Period-based forecast dashboard
            ├── schedule-management.tsx     # Schedule / calendar management
            └── settings.tsx               # App settings page
```

---

## Routing Map

| Path | Component | Description |
|---|---|---|
| `/` | `CompanyKorea` | Default → Korea company list |
| `/companies/korea` | `CompanyKorea` | Korea client companies |
| `/companies/korea/personnel` | `SalesPersonnel` | Korea sales reps |
| `/companies/japan` | `CompanyJapan` | Japan client companies |
| `/companies/japan/personnel` | `SalesPersonnelJapan` | Japan sales reps |
| `/companies/vietnam` | `CompanyVietnam` | Vietnam client companies |
| `/companies/vietnam/personnel` | `SalesPersonnelVietnam` | Vietnam sales reps |
| `/sales` | `SalesHistory` | Sales deal history |
| `/company-data` | `CompanyDataCollection` | Company data collection |
| `/my-tasks` | `MyTasks` | Personal task board |
| `/dashboard` | `SalesDashboard` | Revenue forecast dashboard |
| `/period-forecast` | `PeriodForecastDashboard` | Period-based forecast |
| `/schedule` | `ScheduleManagement` | Schedule management |

---

## Sidebar Navigation (Korean labels)

```
영업 이력 관리          → /sales
BRYCENKOREA  ▼
  KOREA 담당 기업 관리  → /companies/korea
  KOREA 영업인력 관리   → /companies/korea/personnel
BRYCENJAPAN  ▼
  JAPAN 담당 기업 관리  → /companies/japan
  JAPAN 영업인력 관리   → /companies/japan/personnel
BRYCENVIETNAM  ▼
  VIETNAM 담당 기업 관리 → /companies/vietnam
  VIETNAM 영업인력 관리  → /companies/vietnam/personnel
기업 정보 수집          → /company-data
나의 할일               → /my-tasks
매출 예측 대시보드      → /dashboard
기수별 예측 대시보드    → /period-forecast
스케줄 관리             → /schedule
```

---

## Key Data Models

### Company
- `id`, `name`, `rank` (A/B/C/D), `businessNumber`, `ceo`, `industry`, `address`
- `totalProjects`, `totalAmount`, `status` (거래중 / 협의중 / 보류)
- `contactAttempts`, `successfulContacts` (contact rate)
- `managers[]` — list of contact persons per company

### Manager (per Company)
- `id`, `name`, `position`, `phone`, `email`, `department`

### Task (My Tasks page)
- `id`, `title`, `description`, `status` (todo / completed), `priority` (high / medium / low)
- `dueDate`, `category`, `tags[]`
- `assignee` (name + contact), `history[]`, `attachments[]`
- `projectId`, `projectName`

---

## Development

```bash
# Install dependencies
pnpm install

# Start dev server
pnpm dev

# Build for production
pnpm build
```

---

## Notes

- All UI text and labels are in **Korean**.
- Data is currently **static / in-memory** (no backend or API integration yet).
- The project was initially generated from **Figma Make** and is being extended.
- Company rank system: `A` (red) > `B` (blue) > `C` (green) > `D` (gray).
