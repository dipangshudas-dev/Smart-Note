'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import {
  authenticateUser,
  createStockItem,
  updateStockItem,
  deleteStockItem,
  createOrder,
  updateOrderStatus,
  confirmDelivery,
  createPettyCash,
  createDayEndLog,
} from '@/lib/data-store';
import { setSession, clearSession, getSession } from '@/lib/auth';
import { OrderStatus } from '@/types';

// In-memory rate limiting against brute-force attacks
interface AttemptRecord {
  count: number;
  lastAttempt: number;
  lockedUntil?: number;
}

const loginAttempts = new Map<string, AttemptRecord>();

export async function loginAction(formData: FormData) {
  const name = formData.get('name') as string;
  const password = formData.get('password') as string;

  if (!name || !password) {
    return { error: 'Please enter both Name and Password.' };
  }

  const normalizedKey = name.trim().toLowerCase();
  const now = Date.now();
  const record = loginAttempts.get(normalizedKey);

  // Check if account is temporarily locked due to repeated failures
  if (record && record.lockedUntil && record.lockedUntil > now) {
    const remainingSeconds = Math.ceil((record.lockedUntil - now) / 1000);
    return {
      error: `Too many failed login attempts. Please wait ${remainingSeconds} seconds before trying again.`,
    };
  }

  const user = await authenticateUser(name, password);
  if (!user) {
    const prevCount = record ? record.count : 0;
    const newCount = prevCount + 1;

    // After 5 failed attempts, lock for 5 minutes
    if (newCount >= 5) {
      loginAttempts.set(normalizedKey, {
        count: newCount,
        lastAttempt: now,
        lockedUntil: now + 5 * 60 * 1000,
      });
      return {
        error: 'Too many failed attempts. Account temporarily locked for 5 minutes for your security.',
      };
    } else {
      loginAttempts.set(normalizedKey, {
        count: newCount,
        lastAttempt: now,
      });
      return { error: 'Invalid username or password.' };
    }
  }

  // Clear rate limiter on successful authentication
  loginAttempts.delete(normalizedKey);

  await setSession(user);
  redirect('/dashboard');
}

export async function logoutAction() {
  await clearSession();
  redirect('/login');
}

export async function createStockItemAction(data: {
  name: string;
  sku?: string;
  unit_price: number;
  quantity: number;
}) {
  const session = await getSession();
  if (!session) {
    return { error: 'Unauthorized' };
  }

  try {
    const item = await createStockItem(data);
    revalidatePath('/stock');
    revalidatePath('/order-entry');
    revalidatePath('/dashboard');
    return { success: true, item };
  } catch (err: any) {
    return { error: err.message || 'Failed to create stock item' };
  }
}

export async function updateStockItemAction(
  id: string,
  data: {
    name?: string;
    sku?: string;
    unit_price?: number;
    quantity?: number;
  }
) {
  const session = await getSession();
  if (!session) {
    return { error: 'Unauthorized' };
  }

  try {
    const item = await updateStockItem(id, data);
    revalidatePath('/stock');
    revalidatePath('/order-entry');
    revalidatePath('/dashboard');
    return { success: true, item };
  } catch (err: any) {
    return { error: err.message || 'Failed to update stock item' };
  }
}

export async function deleteStockItemAction(id: string) {
  const session = await getSession();
  if (!session) {
    return { error: 'Unauthorized' };
  }
  if (session.role !== 'admin') {
    return { error: 'Admin permission required to remove stock items.' };
  }

  try {
    await deleteStockItem(id);
    revalidatePath('/stock');
    revalidatePath('/order-entry');
    return { success: true };
  } catch (err: any) {
    return { error: err.message || 'Failed to delete stock item' };
  }
}

export async function createOrderAction(data: {
  customer_name: string;
  customer_phone?: string;
  advance_amount: number;
  items: {
    stock_item_id: string;
    quantity: number;
    unit_price: number;
  }[];
}) {
  const session = await getSession();
  if (!session) {
    return { error: 'Unauthorized' };
  }

  try {
    const order = await createOrder({
      ...data,
      created_by: session.userId,
      created_by_name: session.name,
    });
    revalidatePath('/orders');
    revalidatePath('/order-processing');
    revalidatePath('/delivery-confirmation');
    revalidatePath('/stock');
    revalidatePath('/dashboard');
    return { success: true, order };
  } catch (err: any) {
    return { error: err.message || 'Failed to place order' };
  }
}

export async function updateOrderStatusAction(orderId: string, status: OrderStatus) {
  const session = await getSession();
  if (!session) {
    return { error: 'Unauthorized' };
  }

  try {
    const order = await updateOrderStatus(orderId, status);
    revalidatePath('/order-processing');
    revalidatePath('/delivery-confirmation');
    revalidatePath('/dashboard');
    return { success: true, order };
  } catch (err: any) {
    return { error: err.message || 'Failed to update order status' };
  }
}

export async function confirmDeliveryAction(orderId: string, collectedAmount?: number) {
  const session = await getSession();
  if (!session) {
    return { error: 'Unauthorized' };
  }

  try {
    const order = await confirmDelivery(orderId, collectedAmount);
    revalidatePath('/delivery-confirmation');
    revalidatePath('/order-processing');
    revalidatePath('/cash-report');
    revalidatePath('/dashboard');
    return { success: true, order };
  } catch (err: any) {
    return { error: err.message || 'Failed to confirm delivery' };
  }
}

export async function createPettyCashAction(data: {
  entry_date: string;
  category: string;
  amount: number;
  note?: string;
}) {
  const session = await getSession();
  if (!session) {
    return { error: 'Unauthorized' };
  }

  try {
    const entry = await createPettyCash({
      ...data,
      created_by: session.userId,
    });
    revalidatePath('/petty-cash-entry');
    revalidatePath('/petty-cash-register');
    revalidatePath('/cash-report');
    revalidatePath('/dashboard');
    return { success: true, entry };
  } catch (err: any) {
    return { error: err.message || 'Failed to record petty cash' };
  }
}

export async function createDayEndLogAction(data: {
  close_date: string;
  opening_cash: number;
  cash_in: number;
  cash_out: number;
  actual_cash: number;
}) {
  const session = await getSession();
  if (!session) {
    return { error: 'Unauthorized' };
  }
  if (session.role !== 'admin') {
    return { error: 'Admin permission required to lock Day End closing.' };
  }

  try {
    const log = await createDayEndLog({
      ...data,
      closed_by: session.userId,
      closed_by_name: session.name,
    });
    revalidatePath('/day-end');
    revalidatePath('/day-end-log');
    revalidatePath('/dashboard');
    return { success: true, log };
  } catch (err: any) {
    return { error: err.message || 'Failed to record day end closing' };
  }
}
