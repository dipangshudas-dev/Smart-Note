# Smart Note — Business Accounting, Orders, Stock & Daily Closing

Smart Note is a web application designed for daily operational tracking, customer orders, inventory management, petty cash disbursements, and financial closing reports.

---

## Tech Stack
- **Framework:** [Next.js 14](https://nextjs.org/) (App Router, Server Actions)
- **Language:** TypeScript
- **Styling:** Tailwind CSS (Custom design token system)
- **Icons:** Lucide Icons
- **Database:** PostgreSQL via [Supabase](https://supabase.com/) (`@supabase/supabase-js`, `@supabase/ssr`)
- **Security:** HMAC-SHA256 password hashing, timing-safe equality checks, signed session cookies, and brute-force rate limiting

---

## Core Modules

1. **Order Entry** — Create customer orders with multi-item selection, auto-calculated line totals, advance payments, due balance calculations, and automatic stock deduction.
2. **Delivery Confirmation** — Confirm order deliveries, record delivery timestamps, and collect remaining due payments.
3. **Order Processing** — Monitor order lifecycle across stages (*Pending*, *Processing*, *Ready*, *Delivered*, *Cancelled*) with status filters and expandable item breakdowns.
4. **Stock Management** — Add new items, update unit prices and quantities, search inventory, and monitor low/out-of-stock statuses.
5. **Petty Cash Entry** — Record daily minor business expenses with voucher amounts, categories, and memo remarks.
6. **Petty Cash Register** — Detailed historical ledger of all minor disbursements and office expenditures.
7. **Day End Reconciliation** — Reconcile calculated system cash against physical drawer cash counts and lock daily closing records.
8. **Day End Log** — Audit trail of historical day-end closing reconciliations and discrepancy variances.
9. **Cash Report** — Summarize order cash inflows, petty cash outflows, and net liquid cash position.
10. **MIS Summary** — High-level executive overview of sales turnover, collections, pending receivables, expenses, and inventory valuation.
11. **Target Report** — Benchmark tracking for sales and collection quotas against actual performance.

---

## Getting Started

### 1. Prerequisites
- Node.js 18.17+ or later
- npm or pnpm

### 2. Installation
```bash
git clone <your-repo-url>
cd "Smart Note"
npm install
```

### 3. Environment Variables
Create a `.env.local` file in the root directory (you can copy `.env.example`):
```bash
cp .env.example .env.local
```

Configure your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

*(Note: If Supabase credentials are not provided, the application runs using an in-memory/fallback data store for local development).*

### 4. Database Setup (Supabase)
Run the SQL migration script located in `supabase/schema.sql` inside your Supabase project's **SQL Editor**. This will generate all tables, triggers, indexes, and Row Level Security (RLS) policies.

### 5. Run the Application
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Default Administrator Credentials
- **Username:** `admin`
- **Password:** `admin@1x23`

---

## Project Structure
```
├── src/
│   ├── app/                    # Next.js App Router pages and Server Actions
│   │   ├── cash-report/        # Cash Inflow/Outflow summary
│   │   ├── dashboard/          # Central dashboard with 11 module cards
│   │   ├── day-end/            # Day-end closing reconciliation
│   │   ├── day-end-log/        # Historical closing logs
│   │   ├── delivery-confirmation/ # Order handover & due collection
│   │   ├── login/              # Secure Name & Password authentication
│   │   ├── mis-summary/        # Executive MIS performance summary
│   │   ├── order-entry/        # Customer order booking & stock deduction
│   │   ├── order-processing/   # Order status workflow pipeline
│   │   ├── petty-cash-entry/   # Expense voucher entry
│   │   ├── petty-cash-register/# Expense register & audit ledger
│   │   ├── stock/              # Stock inventory management
│   │   ├── target-report/      # Target vs actual quota analytics
│   │   ├── actions.ts          # Next.js Server Actions
│   │   ├── layout.tsx          # Root layout & font configuration
│   │   └── globals.css         # Tailwind & design token styles
│   ├── components/             # Reusable UI components
│   │   ├── delivery/           # Delivery Confirmation components
│   │   ├── orders/             # Order Entry & Processing components
│   │   ├── stock/              # Stock Management components
│   │   └── TopNavigationBar.tsx# Navigation header
│   ├── lib/                    # Authentication, Supabase, and Data store
│   │   ├── auth.ts             # Signed cookie session management
│   │   ├── data-store.ts       # Unified data access layer
│   │   └── supabase.ts         # Supabase client initialization
│   └── types/                  # TypeScript interface definitions
├── supabase/
│   └── schema.sql              # PostgreSQL database migration & RLS schema
├── .env.example                # Sample environment configuration
├── .gitignore                  # Git ignore rules
├── next.config.mjs             # Next.js configuration & security headers
├── tailwind.config.js          # Tailwind CSS styling tokens
├── tsconfig.json               # TypeScript configuration
└── package.json                # Project dependencies and scripts
```
