import React from 'react';
import { redirect } from 'next/navigation';
import { ShoppingCart } from 'lucide-react';
import { getSession } from '@/lib/auth';
import { getStockItems } from '@/lib/data-store';
import TopNavigationBar from '@/components/TopNavigationBar';
import OrderEntryForm from '@/components/orders/OrderEntryForm';

export const dynamic = 'force-dynamic';

export default async function OrderEntryPage() {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }

  const stockItems = await getStockItems();

  return (
    <div className="min-h-screen bg-canvas flex flex-col">
      <TopNavigationBar
        userName={session.name}
        role={session.role}
        currentModule="Order Entry"
        showBackToDashboard
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 border-b border-hairline pb-4">
          <div className="flex items-center space-x-2 text-xs text-muted uppercase tracking-wider font-semibold mb-1">
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>Sales & Booking</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-normal text-ink">
            Create Customer Order
          </h1>
          <p className="text-xs text-muted mt-1">
            Build customer orders, calculate due balances, and automatically deduct stock upon confirmation.
          </p>
        </div>

        <OrderEntryForm availableStock={stockItems} />
      </main>
    </div>
  );
}
