# Spotlight Studios — Dance Studio Management

A full-stack Next.js 14 application for managing a dance studio: students, batches, renewals, batch changes, and a rich analytics dashboard.

## Stack

- **Next.js 14** (App Router) + **TypeScript**
- **SQLite** (via `better-sqlite3`) — embedded, zero-config database
- **Tailwind CSS** + shadcn-style UI primitives
- **Recharts** for charts & graphs
- **next-themes** for light/dark mode
- **Zod** for API input validation
- **Sonner** for toasts

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Start the dev server
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

The SQLite database file is created automatically at `data/spotlight.db` on first run. No configuration needed.

## Production

```bash
npm run build
npm start
```

## Features

### 1. Dashboard
- **8 KPI cards**: Total Students, Total Revenue, This Month, Expiring Soon, Active Batches, New This Month, Projected 30-day Revenue, Last Month
- **Month-over-month growth indicators** with up/down arrows
- **Revenue Trend** (6-month area chart)
- **Membership Status** (bar chart: active / expiring / critical / expired)
- **Enrolment Trend** (30-day line chart)
- **Validity Buckets** (bar chart: 0-7d, 8-30d, 31-90d, 90d+, expired)
- **Batch Distribution** (donut chart)
- **Top Batches by Revenue** (horizontal bar chart)
- **Expiring Soon list** with status badges
- **Recent Activity** feed

### 2. Students
- Add with Name, Phone, Batch, Amount Paid, Start Date, Validity, Notes
- **Amount auto-fills from batch price** — override anytime with a "Custom" badge
- **Live end-date preview** while filling the form
- Searchable by name or phone
- Filter by batch (including unassigned) and status
- **Three quick actions** per student:
  - **Renew** — extend from current end date or reset from today; adds payment to total
  - **Change Batch** — dedicated dialog with before/after summary and full history log
  - **Edit / Delete**
- Desktop shows a full table; mobile collapses to rich cards
- Sorted by days remaining (most urgent first)

### 3. Batches
- Card grid with price, schedule, student count, and revenue earned
- Add/Edit with Name, Price, Schedule, Description
- Delete safely — students are unassigned, not deleted

### 4. UX Niceties
- **Light/Dark/System theme** toggle in the top bar
- **Responsive shell**: sidebar (desktop), drawer + bottom tab bar (mobile)
- **Keyboard-friendly** dialogs with ESC to close
- **Sonner toasts** for all feedback
- **Loading skeletons** for smooth transitions
- **Hydration-safe** theming
- **Mobile-optimized** layouts with safe-area insets for notched devices

## API Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/analytics` | All dashboard data |
| GET / POST | `/api/batches` | List / create batch |
| PATCH / DELETE | `/api/batches/[id]` | Update / delete batch |
| GET / POST | `/api/students` | List / create student |
| GET / PATCH / DELETE | `/api/students/[id]` | Get / update / delete student |
| POST | `/api/students/[id]/renew` | Renew membership |
| GET / POST | `/api/students/[id]/batch-change` | List history / change batch |

## Data Model

```
batches: id, name, price, schedule, description, created_at
students: id, name, phone, amount, start_date, validity_days, batch_id, notes, created_at
batch_history: id, student_id, from_batch_id, to_batch_id, changed_at, note
```

Every batch change is automatically recorded to `batch_history` — including initial enrolment and batch-change dialog moves. This lets you see a student's entire batch journey.

## Project Structure

```
src/
├── app/
│   ├── api/                # API routes
│   ├── batches/page.tsx
│   ├── students/page.tsx
│   ├── layout.tsx
│   ├── page.tsx            # Dashboard
│   └── globals.css
├── components/
│   ├── ui/                 # shadcn primitives
│   ├── charts.tsx          # Recharts wrappers
│   ├── app-shell.tsx       # Responsive shell
│   ├── stat-card.tsx
│   ├── student-form-dialog.tsx
│   ├── batch-form-dialog.tsx
│   ├── batch-change-dialog.tsx
│   ├── renew-dialog.tsx
│   ├── confirm-dialog.tsx
│   ├── theme-provider.tsx
│   └── theme-toggle.tsx
└── lib/
    ├── db.ts               # SQLite + migrations
    ├── schemas.ts          # Zod validators
    ├── types.ts
    ├── utils.ts            # Formatters, date helpers
    └── api.ts              # Client-side fetcher
```

## Development Notes

- Currency is `₹` (INR), formatted with Indian number system (`en-IN`)
- Dates stored as `YYYY-MM-DD` strings
- Timestamps (`created_at`, `changed_at`) stored as Unix ms
- `end_date` is computed server-side from `start_date + validity_days`

## License

MIT — use it however helps your studio.
