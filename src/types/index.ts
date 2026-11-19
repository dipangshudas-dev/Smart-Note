export type UserRole = 'admin' | 'staff';

export interface User {
  id: string;
  name: string;
  password_hash?: string;
  role: UserRole;
  created_at: string;
}

export interface StockItem {
  id: string;
  name: string;
  sku?: string | null;
  unit_price: number;
  quantity: number;
  updated_at: string;
}

export type OrderStatus = 'Pending' | 'Processing' | 'Ready' | 'Delivered' | 'Cancelled';

export interface OrderItem {
  id: string;
  order_id: string;
  stock_item_id: string;
  quantity: number;
  unit_price: number;
  line_total: number;
  stock_item?: StockItem;
}

export interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone?: string | null;
  total_amount: number;
  advance_amount: number;
  due_amount: number;
  status: OrderStatus;
  delivered_at?: string | null;
  created_by?: string | null;
  created_by_name?: string;
  created_at: string;
  items?: OrderItem[];
}

export interface PettyCash {
  id: string;
  entry_date: string;
  category: string;
  amount: number;
  note?: string | null;
  created_by?: string | null;
  created_at: string;
}

export interface DayEndLog {
  id: string;
  close_date: string;
  opening_cash: number;
  cash_in: number;
  cash_out: number;
  expected_cash: number;
  actual_cash: number;
  difference: number;
  closed_by?: string | null;
  closed_by_name?: string;
  closed_at: string;
}

export interface Target {
  id: string;
  period_label: string;
  start_date: string;
  end_date: string;
  target_amount: number;
  created_at: string;
}

export interface DashboardModule {
  id: string;
  title: string;
  description: string;
  href: string;
  iconName: string;
  roleRequired?: UserRole;
  badge?: string;
  accent?: string;
}
