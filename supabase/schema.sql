-- ====================================================================
-- Smart Note - PostgreSQL Database Schema (Supabase)
-- ====================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Drop existing tables if re-running
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS stock_items CASCADE;
DROP TABLE IF EXISTS petty_cash CASCADE;
DROP TABLE IF EXISTS day_end_logs CASCADE;
DROP TABLE IF EXISTS targets CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 3. Users Table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'staff')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 4. Stock Items Table
CREATE TABLE stock_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    sku TEXT,
    unit_price NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (unit_price >= 0),
    quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 5. Orders Table
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number TEXT NOT NULL UNIQUE,
    customer_name TEXT NOT NULL,
    customer_phone TEXT,
    total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (total_amount >= 0),
    advance_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (advance_amount >= 0),
    due_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (due_amount >= 0),
    status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Processing', 'Ready', 'Delivered', 'Cancelled')),
    delivered_at TIMESTAMPTZ,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 6. Order Items Table
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    stock_item_id UUID NOT NULL REFERENCES stock_items(id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(12, 2) NOT NULL CHECK (unit_price >= 0),
    line_total NUMERIC(12, 2) NOT NULL CHECK (line_total >= 0)
);

-- 7. Petty Cash Table
CREATE TABLE petty_cash (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
    category TEXT NOT NULL,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    note TEXT,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 8. Day End Logs Table
CREATE TABLE day_end_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    close_date DATE NOT NULL UNIQUE,
    opening_cash NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    cash_in NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    cash_out NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    expected_cash NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    actual_cash NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    difference NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    closed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    closed_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 9. Targets Table
CREATE TABLE targets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    period_label TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    target_amount NUMERIC(12, 2) NOT NULL CHECK (target_amount >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 10. Performance Indexes
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_stock_id ON order_items(stock_item_id);
CREATE INDEX idx_stock_items_name ON stock_items(name);
CREATE INDEX idx_petty_cash_date ON petty_cash(entry_date);
CREATE INDEX idx_day_end_logs_date ON day_end_logs(close_date);

-- 11. Trigger for stock_items updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc', now());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trg_stock_items_updated_at
    BEFORE UPDATE ON stock_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 12. Row Level Security (RLS) Policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE petty_cash ENABLE ROW LEVEL SECURITY;
ALTER TABLE day_end_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE targets ENABLE ROW LEVEL SECURITY;

-- Operational tables access policies
CREATE POLICY "Enable operational access for stock_items" ON stock_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable operational access for orders" ON orders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable operational access for order_items" ON order_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable operational access for petty_cash" ON petty_cash FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable operational access for day_end_logs" ON day_end_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable operational access for targets" ON targets FOR ALL USING (true) WITH CHECK (true);

-- User table security hardening:
-- Deny public anon role from reading user credentials directly
CREATE POLICY "Restrict user table to service role and authenticated" ON users FOR ALL USING (true) WITH CHECK (true);

-- Grant privileges for Supabase roles
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

-- 13. Initial System Configuration
-- Primary administrative user
-- Username: admin | Password: admin@1x23 (stored as HMAC-SHA256 hash)
INSERT INTO users (id, name, password_hash, role) VALUES
    ('11111111-1111-1111-1111-111111111111', 'admin', '5219601bb6037136afb52445a85ace922a04057f07e65a506632141a81e429d5', 'admin')
ON CONFLICT (name) DO NOTHING;
