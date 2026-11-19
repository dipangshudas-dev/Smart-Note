# Smart Note — System & UI Design Specification

## 1. Overview
**Smart Note** is a business accounting, order, stock, petty cash, and daily closing web application designed for daily operational tracking and financial reporting[cite: 1]. Users sign in with their **Name** and **Password** and access role-appropriate modules from a central dashboard[cite: 1].

---

## 2. Tech Stack & Architecture
- **Frontend:** Next.js (App Router), TypeScript, Tailwind CSS, Lucide Icons
- **Backend / Data Layer:** Next.js Server Actions / Route Handlers
- **Database:** PostgreSQL via Supabase (`@supabase/supabase-js` / `@supabase/ssr`)
- **Deployment:** Vercel

---

## 3. Authentication & Access Control
- **Login Flow:** Users authenticate using **Name** and **Password**.
- **Session & Route Protection:** Authenticated session state is verified on protected routes; unauthenticated users are redirected to `/login`.
- **Roles:**
  - **Admin:** Full access to all modules, reports, target settings, and day-end records.
  - **Staff:** Access to daily operational entries and views based on assigned permissions.

---

## 4. Dashboard & Core Modules
After login, the top bar displays:
- Brand name: **Smart Note**
- Logged-in user's **Name** and role badge
- Current date
- **Logout** action

The main dashboard presents **11 module cards** in a responsive grid[cite: 1]:
1. **Order Entry** — Create customer orders with quantity, total, advance paid, and due balance calculation; deducts stock[cite: 1].
2. **Delivery Confirmation** — Confirm delivery of orders and record remaining due collection[cite: 1].
3. **Petty Cash Entry** — Log daily minor expenses with amount, category, date, and note[cite: 1].
4. **Petty Cash Register** — View, filter, and sum logged petty cash expenses by date and category[cite: 1].
5. **Day End** — Reconcile expected cash against physical closing cash and lock the day's record[cite: 1].
6. **Day End Log** — Browse historical day-end closing records and discrepancies[cite: 1].
7. **Cash Report** — Summarize order cash inflows, petty cash outflows, and net cash position[cite: 1].
8. **MIS Summary** — High-level overview of sales, collections, pending dues, expenses, and net balance[cite: 1].
9. **Order Processing** — Track and update order statuses across stages (e.g., Pending, Processing, Ready, Delivered)[cite: 1].
10. **Stock** — Add items, update stock quantities and unit prices, and monitor availability[cite: 1].
11. **Target Report** — Track sales/collection targets against actual performance over a period[cite: 1].

---

## 5. Database Schema (PostgreSQL / Supabase)
- `users`: `id` (uuid, pk), `name` (text, unique), `password_hash` (text), `role` (`'admin' | 'staff'`), `created_at` (timestamptz)
- `stock_items`: `id` (uuid, pk), `name` (text), `sku` (text, optional), `unit_price` (numeric), `quantity` (integer), `updated_at` (timestamptz)
- `orders`: `id` (uuid, pk), `order_number` (text, unique), `customer_name` (text), `customer_phone` (text, optional), `total_amount` (numeric), `advance_amount` (numeric), `due_amount` (numeric), `status` (text), `delivered_at` (timestamptz, nullable), `created_by` (uuid, fk -> `users.id`), `created_at` (timestamptz)
- `order_items`: `id` (uuid, pk), `order_id` (uuid, fk -> `orders.id`), `stock_item_id` (uuid, fk -> `stock_items.id`), `quantity` (integer), `unit_price` (numeric), `line_total` (numeric)
- `petty_cash`: `id` (uuid, pk), `entry_date` (date), `category` (text), `amount` (numeric), `note` (text, optional), `created_by` (uuid, fk -> `users.id`), `created_at` (timestamptz)
- `day_end_logs`: `id` (uuid, pk), `close_date` (date, unique), `opening_cash` (numeric), `cash_in` (numeric), `cash_out` (numeric), `expected_cash` (numeric), `actual_cash` (numeric), `difference` (numeric), `closed_by` (uuid, fk -> `users.id`), `closed_at` (timestamptz)
- `targets`: `id` (uuid, pk), `period_label` (text), `start_date` (date), `end_date` (date), `target_amount` (numeric), `created_at` (timestamptz)

---

## 6. UI & UX Principles
- Clean, high-contrast light surface with crisp borders and clear visual hierarchy.
- Keyboard-friendly forms for fast data entry and numeric calculation feedback.
- Clear empty states, loading indicators, confirmation prompts for irreversible actions (such as closing a day), and inline validation messages.
- Responsive layout across desktop and tablet screens.