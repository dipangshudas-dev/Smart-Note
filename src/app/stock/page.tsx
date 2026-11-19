import React from 'react';
import { redirect } from 'next/navigation';
import { Package, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { getSession } from '@/lib/auth';
import { getStockItems } from '@/lib/data-store';
import TopNavigationBar from '@/components/TopNavigationBar';
import StockManager from '@/components/stock/StockManager';

export const dynamic = 'force-dynamic';

export default async function StockPage() {
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
        currentModule="Stock Management"
        showBackToDashboard
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-hairline pb-4">
          <div>
            <div className="flex items-center space-x-2 text-xs text-muted uppercase tracking-wider font-semibold mb-1">
              <Package className="w-3.5 h-3.5" />
              <span>Inventory Control</span>
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-normal text-ink">
              Stock & Inventory
            </h1>
            <p className="text-xs text-muted mt-1">
              Monitor real-time inventory levels, adjust unit selling prices, and register new stock items.
            </p>
          </div>
        </div>

        <StockManager initialStock={stockItems} userRole={session.role} />
      </main>
    </div>
  );
}
