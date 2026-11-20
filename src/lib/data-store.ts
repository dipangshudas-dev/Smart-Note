import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { supabase, isSupabaseConfigured } from './supabase';
import { User, StockItem, Order, OrderItem, PettyCash, DayEndLog, Target, OrderStatus } from '@/types';

const AUTH_SECRET_SALT = process.env.AUTH_SECRET_SALT || 'smart_note_production_security_salt_2026';
const DB_FILE_PATH = path.join(process.cwd(), 'data', 'smart_note_db.json');

export function hashPassword(plainText: string): string {
  return crypto
    .createHmac('sha256', AUTH_SECRET_SALT)
    .update(plainText)
    .digest('hex');
}

export function verifyPassword(plainText: string, storedHash: string): boolean {
  if (storedHash === plainText) {
    return true;
  }
  try {
    const hashOfInput = hashPassword(plainText);
    const inputBuf = Buffer.from(hashOfInput, 'hex');
    const storedBuf = Buffer.from(storedHash, 'hex');
    if (inputBuf.length === storedBuf.length && crypto.timingSafeEqual(inputBuf, storedBuf)) {
      return true;
    }
  } catch {
    // continue
  }
  return false;
}

// Initial registered administrator
const INITIAL_USERS: User[] = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    name: 'admin',
    password_hash: '5219601bb6037136afb52445a85ace922a04057f07e65a506632141a81e429d5',
    role: 'admin',
    created_at: new Date('2026-11-01T08:00:00Z').toISOString(),
  },
];

interface LocalDatabase {
  users: User[];
  stock_items: StockItem[];
  orders: Order[];
  petty_cash: PettyCash[];
  day_end_logs: DayEndLog[];
  targets: Target[];
}

function getLocalDB(): LocalDatabase {
  try {
    if (fs.existsSync(DB_FILE_PATH)) {
      const content = fs.readFileSync(DB_FILE_PATH, 'utf-8');
      const parsed = JSON.parse(content);
      return {
        users: Array.isArray(parsed.users) && parsed.users.length > 0 ? parsed.users : INITIAL_USERS,
        stock_items: Array.isArray(parsed.stock_items) ? parsed.stock_items : [],
        orders: Array.isArray(parsed.orders) ? parsed.orders : [],
        petty_cash: Array.isArray(parsed.petty_cash) ? parsed.petty_cash : [],
        day_end_logs: Array.isArray(parsed.day_end_logs) ? parsed.day_end_logs : [],
        targets: Array.isArray(parsed.targets) ? parsed.targets : [],
      };
    }
  } catch (err) {
    console.error('Error reading local db:', err);
  }

  const defaultDb: LocalDatabase = {
    users: [...INITIAL_USERS],
    stock_items: [],
    orders: [],
    petty_cash: [],
    day_end_logs: [],
    targets: [],
  };
  saveLocalDB(defaultDb);
  return defaultDb;
}

function saveLocalDB(data: LocalDatabase): void {
  try {
    const dir = path.dirname(DB_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DB_FILE_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving local db:', err);
  }
}

// Helper to generate UUIDs
export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// -------------------------------------------------------------
// Authentication & User Data
// -------------------------------------------------------------
export async function authenticateUser(name: string, password: string): Promise<User | null> {
  const normalizedName = name.trim().toLowerCase();

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .ilike('name', normalizedName)
        .single();

      if (!error && data && data.password_hash) {
        if (verifyPassword(password.trim(), data.password_hash)) {
          const { password_hash, ...safeUser } = data;
          return safeUser as User;
        }
      }
    } catch (err) {
      console.warn('Supabase auth failed, checking local store:', err);
    }
  }

  // Fallback to local store
  const db = getLocalDB();
  const user = db.users.find((u) => u.name.toLowerCase() === normalizedName);

  if (user && user.password_hash) {
    if (verifyPassword(password.trim(), user.password_hash)) {
      const { password_hash, ...safeUser } = user;
      return safeUser as User;
    }
  }

  return null;
}

export async function getUserById(id: string): Promise<User | null> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data } = await supabase.from('users').select('*').eq('id', id).single();
      if (data) {
        const { password_hash, ...safeUser } = data;
        return safeUser as User;
      }
    } catch {
      // fallback
    }
  }
  const db = getLocalDB();
  const user = db.users.find((u) => u.id === id);
  if (user) {
    const { password_hash, ...safeUser } = user;
    return safeUser as User;
  }
  return null;
}

// -------------------------------------------------------------
// Stock Management
// -------------------------------------------------------------
export async function getStockItems(): Promise<StockItem[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('stock_items')
        .select('*')
        .order('name', { ascending: true });
      if (!error && data) return data as StockItem[];
    } catch (err) {
      console.warn('Supabase getStockItems failed, loading local items:', err);
    }
  }

  const db = getLocalDB();
  return db.stock_items.sort((a, b) => a.name.localeCompare(b.name));
}

export async function getStockItemById(id: string): Promise<StockItem | null> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data } = await supabase.from('stock_items').select('*').eq('id', id).single();
      if (data) return data as StockItem;
    } catch {
      // fallback
    }
  }
  const db = getLocalDB();
  return db.stock_items.find((item) => item.id === id) || null;
}

export async function createStockItem(item: {
  name: string;
  sku?: string;
  unit_price: number;
  quantity: number;
}): Promise<StockItem> {
  let createdItem: StockItem | null = null;

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('stock_items')
        .insert({
          name: item.name.trim(),
          sku: item.sku?.trim() || null,
          unit_price: Number(item.unit_price),
          quantity: Number(item.quantity),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (!error && data) {
        createdItem = data as StockItem;
      } else if (error) {
        console.error('Supabase stock insert error:', error.message);
        throw new Error(`Supabase Error: ${error.message}. Make sure you ran supabase/schema.sql in Supabase SQL Editor.`);
      }
    } catch (err: any) {
      console.warn('Supabase stock insert exception:', err?.message);
    }
  }

  if (!createdItem) {
    createdItem = {
      id: generateUUID(),
      name: item.name.trim(),
      sku: item.sku?.trim() || null,
      unit_price: Number(item.unit_price),
      quantity: Number(item.quantity),
      updated_at: new Date().toISOString(),
    };
  }

  // Always save to persistent local store
  const db = getLocalDB();
  db.stock_items = [createdItem, ...db.stock_items.filter((s) => s.id !== createdItem!.id)];
  saveLocalDB(db);

  return createdItem;
}

export async function updateStockItem(
  id: string,
  updates: Partial<Pick<StockItem, 'name' | 'sku' | 'unit_price' | 'quantity'>>
): Promise<StockItem | null> {
  let updatedItem: StockItem | null = null;

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('stock_items')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();
      if (!error && data) updatedItem = data as StockItem;
    } catch (err) {
      console.warn('Supabase stock update error:', err);
    }
  }

  const db = getLocalDB();
  const index = db.stock_items.findIndex((i) => i.id === id);
  if (index !== -1) {
    db.stock_items[index] = {
      ...db.stock_items[index],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    saveLocalDB(db);
    return db.stock_items[index];
  }

  return updatedItem;
}

export async function deleteStockItem(id: string): Promise<boolean> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase.from('stock_items').delete().eq('id', id);
      if (!error) {
        const db = getLocalDB();
        db.stock_items = db.stock_items.filter((s) => s.id !== id);
        saveLocalDB(db);
        return true;
      }
    } catch {
      // fallback
    }
  }

  const db = getLocalDB();
  const index = db.stock_items.findIndex((i) => i.id === id);
  if (index !== -1) {
    db.stock_items.splice(index, 1);
    saveLocalDB(db);
    return true;
  }
  return false;
}

// -------------------------------------------------------------
// Orders Management
// -------------------------------------------------------------
export async function getOrders(statusFilter?: string): Promise<Order[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      let query = supabase
        .from('orders')
        .select(`
          *,
          items:order_items(
            *,
            stock_item:stock_items(*)
          ),
          created_by_user:users(name)
        `)
        .order('created_at', { ascending: false });

      if (statusFilter && statusFilter !== 'All') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;
      if (!error && data) {
        return data.map((o: any) => ({
          ...o,
          created_by_name: o.created_by_user?.name || 'Staff',
        })) as Order[];
      }
    } catch (err) {
      console.warn('Supabase getOrders error:', err);
    }
  }

  const db = getLocalDB();
  let list = [...db.orders];
  if (statusFilter && statusFilter !== 'All') {
    list = list.filter((o) => o.status === statusFilter);
  }
  return list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export async function getOrderById(id: string): Promise<Order | null> {
  const all = await getOrders();
  return all.find((o) => o.id === id) || null;
}

export async function createOrder(data: {
  customer_name: string;
  customer_phone?: string;
  advance_amount: number;
  items: {
    stock_item_id: string;
    quantity: number;
    unit_price: number;
  }[];
  created_by?: string;
  created_by_name?: string;
}): Promise<Order> {
  // 1. Verify stock availability and deduct stock
  const currentStocks = await getStockItems();
  for (const item of data.items) {
    const stock = currentStocks.find((s) => s.id === item.stock_item_id);
    if (!stock) {
      throw new Error('Selected item was not found in stock.');
    }
    if (stock.quantity < item.quantity) {
      throw new Error(`Insufficient stock for "${stock.name}". Available: ${stock.quantity}, Requested: ${item.quantity}`);
    }
  }

  // Deduct stock in database and local cache
  for (const item of data.items) {
    const stock = currentStocks.find((s) => s.id === item.stock_item_id);
    if (stock) {
      const updatedQty = stock.quantity - item.quantity;
      await updateStockItem(stock.id, { quantity: updatedQty });
    }
  }

  // Calculate totals
  const totalAmount = data.items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);
  const advanceAmount = Math.min(Number(data.advance_amount) || 0, totalAmount);
  const dueAmount = Math.max(0, totalAmount - advanceAmount);

  // Generate order number
  const db = getLocalDB();
  const nextSeq = 1001 + db.orders.length;
  const orderNumber = `SN-${nextSeq}`;
  const orderId = generateUUID();

  const orderItems: OrderItem[] = data.items.map((item) => {
    const stock = currentStocks.find((s) => s.id === item.stock_item_id);
    return {
      id: generateUUID(),
      order_id: orderId,
      stock_item_id: item.stock_item_id,
      quantity: item.quantity,
      unit_price: item.unit_price,
      line_total: item.quantity * item.unit_price,
      stock_item: stock,
    };
  });

  const newOrder: Order = {
    id: orderId,
    order_number: orderNumber,
    customer_name: data.customer_name.trim(),
    customer_phone: data.customer_phone?.trim() || null,
    total_amount: totalAmount,
    advance_amount: advanceAmount,
    due_amount: dueAmount,
    status: 'Pending',
    delivered_at: null,
    created_by: data.created_by || null,
    created_by_name: data.created_by_name || 'Staff',
    created_at: new Date().toISOString(),
    items: orderItems,
  };

  if (isSupabaseConfigured && supabase) {
    try {
      const { data: dbOrder } = await supabase
        .from('orders')
        .insert({
          id: newOrder.id,
          order_number: newOrder.order_number,
          customer_name: newOrder.customer_name,
          customer_phone: newOrder.customer_phone,
          total_amount: newOrder.total_amount,
          advance_amount: newOrder.advance_amount,
          due_amount: newOrder.due_amount,
          status: newOrder.status,
          created_by: newOrder.created_by,
          created_at: newOrder.created_at,
        })
        .select()
        .single();

      if (dbOrder) {
        const itemsToInsert = orderItems.map((oi) => ({
          id: oi.id,
          order_id: oi.order_id,
          stock_item_id: oi.stock_item_id,
          quantity: oi.quantity,
          unit_price: oi.unit_price,
          line_total: oi.line_total,
        }));
        await supabase.from('order_items').insert(itemsToInsert);
      }
    } catch (err) {
      console.warn('Supabase order insert error, saved locally:', err);
    }
  }

  db.orders.unshift(newOrder);
  saveLocalDB(db);
  return newOrder;
}

export async function updateOrderStatus(orderId: string, newStatus: OrderStatus): Promise<Order | null> {
  const db = getLocalDB();
  const order = db.orders.find((o) => o.id === orderId);
  if (!order) return null;

  order.status = newStatus;
  if (newStatus === 'Delivered' && !order.delivered_at) {
    order.delivered_at = new Date().toISOString();
  }

  if (isSupabaseConfigured && supabase) {
    try {
      await supabase
        .from('orders')
        .update({
          status: newStatus,
          delivered_at: order.delivered_at,
        })
        .eq('id', orderId);
    } catch (err) {
      console.warn('Supabase order update status error:', err);
    }
  }

  saveLocalDB(db);
  return order;
}

export async function confirmDelivery(
  orderId: string,
  collectedAmount?: number
): Promise<Order | null> {
  const db = getLocalDB();
  const order = db.orders.find((o) => o.id === orderId);
  if (!order) return null;

  const paymentToCollect =
    collectedAmount !== undefined ? Number(collectedAmount) : order.due_amount;

  order.status = 'Delivered';
  order.delivered_at = new Date().toISOString();
  order.advance_amount += paymentToCollect;
  order.due_amount = Math.max(0, order.total_amount - order.advance_amount);

  if (isSupabaseConfigured && supabase) {
    try {
      await supabase
        .from('orders')
        .update({
          status: 'Delivered',
          delivered_at: order.delivered_at,
          advance_amount: order.advance_amount,
          due_amount: order.due_amount,
        })
        .eq('id', orderId);
    } catch (err) {
      console.warn('Supabase confirm delivery error:', err);
    }
  }

  saveLocalDB(db);
  return order;
}

// -------------------------------------------------------------
// Petty Cash Management
// -------------------------------------------------------------
export async function getPettyCashEntries(params?: {
  category?: string;
  startDate?: string;
  endDate?: string;
}): Promise<PettyCash[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      let query = supabase.from('petty_cash').select('*').order('entry_date', { ascending: false });
      if (params?.category && params.category !== 'All') {
        query = query.eq('category', params.category);
      }
      if (params?.startDate) {
        query = query.gte('entry_date', params.startDate);
      }
      if (params?.endDate) {
        query = query.lte('entry_date', params.endDate);
      }
      const { data } = await query;
      if (data) return data as PettyCash[];
    } catch (err) {
      console.warn('Supabase petty cash read error:', err);
    }
  }

  const db = getLocalDB();
  let list = [...db.petty_cash];
  if (params?.category && params.category !== 'All') {
    list = list.filter((p) => p.category === params.category);
  }
  if (params?.startDate) {
    list = list.filter((p) => p.entry_date >= params.startDate!);
  }
  if (params?.endDate) {
    list = list.filter((p) => p.entry_date <= params.endDate!);
  }
  return list.sort((a, b) => b.entry_date.localeCompare(a.entry_date));
}

export async function createPettyCash(entry: {
  entry_date: string;
  category: string;
  amount: number;
  note?: string;
  created_by?: string;
}): Promise<PettyCash> {
  const newEntry: PettyCash = {
    id: generateUUID(),
    entry_date: entry.entry_date || new Date().toISOString().split('T')[0],
    category: entry.category.trim(),
    amount: Number(entry.amount),
    note: entry.note?.trim() || null,
    created_by: entry.created_by || null,
    created_at: new Date().toISOString(),
  };

  if (isSupabaseConfigured && supabase) {
    try {
      const { data } = await supabase.from('petty_cash').insert(newEntry).select().single();
      if (data) return data as PettyCash;
    } catch (err) {
      console.warn('Supabase petty cash insert error:', err);
    }
  }

  const db = getLocalDB();
  db.petty_cash.unshift(newEntry);
  saveLocalDB(db);
  return newEntry;
}

// -------------------------------------------------------------
// Day End Logs
// -------------------------------------------------------------
export async function getDayEndLogs(): Promise<DayEndLog[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data } = await supabase
        .from('day_end_logs')
        .select('*, closed_by_user:users(name)')
        .order('close_date', { ascending: false });
      if (data) {
        return data.map((d: any) => ({
          ...d,
          closed_by_name: d.closed_by_user?.name || 'Staff',
        })) as DayEndLog[];
      }
    } catch (err) {
      console.warn('Supabase day end read error:', err);
    }
  }

  const db = getLocalDB();
  return db.day_end_logs.sort((a, b) => b.close_date.localeCompare(a.close_date));
}

export async function createDayEndLog(log: {
  close_date: string;
  opening_cash: number;
  cash_in: number;
  cash_out: number;
  actual_cash: number;
  closed_by?: string;
  closed_by_name?: string;
}): Promise<DayEndLog> {
  const expected_cash = log.opening_cash + log.cash_in - log.cash_out;
  const difference = log.actual_cash - expected_cash;

  const newLog: DayEndLog = {
    id: generateUUID(),
    close_date: log.close_date,
    opening_cash: Number(log.opening_cash),
    cash_in: Number(log.cash_in),
    cash_out: Number(log.cash_out),
    expected_cash: expected_cash,
    actual_cash: Number(log.actual_cash),
    difference: difference,
    closed_by: log.closed_by || null,
    closed_by_name: log.closed_by_name || 'Staff',
    closed_at: new Date().toISOString(),
  };

  if (isSupabaseConfigured && supabase) {
    try {
      const { data } = await supabase.from('day_end_logs').insert(newLog).select().single();
      if (data) return data as DayEndLog;
    } catch (err) {
      console.warn('Supabase day end insert error:', err);
    }
  }

  const db = getLocalDB();
  db.day_end_logs.unshift(newLog);
  saveLocalDB(db);
  return newLog;
}

// -------------------------------------------------------------
// Targets & Reports
// -------------------------------------------------------------
export async function getTargets(): Promise<Target[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data } = await supabase.from('targets').select('*').order('created_at', { ascending: false });
      if (data) return data as Target[];
    } catch (err) {
      console.warn('Supabase targets read error:', err);
    }
  }

  const db = getLocalDB();
  return db.targets;
}
