import React from 'react';
import { redirect } from 'next/navigation';
import { BarChart3, TrendingUp, AlertCircle, ShoppingCart, DollarSign, Package } from 'lucide-react';
import { getSession } from '@/lib/auth';
import { getOrders, getStockItems, getPettyCashEntries } from '@/lib/data-store';
import TopNavigationBar from '@/components/TopNavigationBar';

export const dynamic = 'force-dynamic';

export default async function MisSummaryPage() {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }

  const [orders, stockItems, pettyCashList] = await Promise.all([
    getOrders(),
    getStockItems(),
    getPettyCashEntries(),
  ]);

  const totalSalesBooked = orders.reduce((sum, o) => sum + o.total_amount, 0);
  const totalCollections = orders.reduce((sum, o) => sum + o.advance_amount, 0);
  const totalPendingDues = orders.reduce((sum, o) => sum + o.due_amount, 0);
  const totalExpenses = pettyCashList.reduce((sum, p) => sum + p.amount, 0);
  const netOperatingMargin = totalCollections - totalExpenses;
  const totalInventoryValue = stockItems.reduce((sum, s) => sum + s.quantity * s.unit_price, 0);

  return (
    <div className="min-h-screen bg-canvas flex flex-col">
      <TopNavigationBar
        userName={session.name}
        role={session.role}
        currentModule="MIS Summary"
        showBackToDashboard
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 border-b border-hairline pb-4">
          <div className="flex items-center space-x-2 text-xs text-muted uppercase tracking-wider font-semibold mb-1">
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Management Information System</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-normal text-ink">
            Executive MIS Performance Summary
          </h1>
          <p className="text-xs text-muted mt-1">
            Consolidated operational health dashboard: total sales turnover, receivables, expenses, and net surplus.
          </p>
        </div>

        {/* High-level MIS KPI grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
          <div className="bg-surface-card border border-hairline rounded-lg p-5">
            <span className="text-xs uppercase tracking-wider text-muted font-semibold block mb-1">
              Total Sales Booked
            </span>
            <span className="text-2xl font-serif text-ink font-normal">
              ₹{totalSalesBooked.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
            <span className="text-[11px] text-muted block mt-1">
              Across {orders.length} registered orders
            </span>
          </div>

          <div className="bg-surface-card border border-hairline rounded-lg p-5">
            <span className="text-xs uppercase tracking-wider text-muted font-semibold block mb-1">
              Total Collections Received
            </span>
            <span className="text-2xl font-serif text-semantic-success font-normal">
              ₹{totalCollections.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
            <span className="text-[11px] text-muted block mt-1">
              {(totalSalesBooked > 0 ? (totalCollections / totalSalesBooked) * 100 : 0).toFixed(1)}% collection rate
            </span>
          </div>

          <div className="bg-surface-card border border-hairline rounded-lg p-5">
            <span className="text-xs uppercase tracking-wider text-muted font-semibold block mb-1">
              Pending Customer Receivables
            </span>
            <span className="text-2xl font-serif text-semantic-error font-normal">
              ₹{totalPendingDues.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
            <span className="text-[11px] text-muted block mt-1">
              Outstanding due balance to be collected
            </span>
          </div>

          <div className="bg-surface-card border border-hairline rounded-lg p-5">
            <span className="text-xs uppercase tracking-wider text-muted font-semibold block mb-1">
              Operational Disbursements
            </span>
            <span className="text-2xl font-serif text-ink font-normal">
              ₹{totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
            <span className="text-[11px] text-muted block mt-1">
              Total petty cash vouchers recorded
            </span>
          </div>

          <div className="bg-surface-card border border-hairline rounded-lg p-5">
            <span className="text-xs uppercase tracking-wider text-muted font-semibold block mb-1">
              Net Operating Balance
            </span>
            <span className="text-2xl font-serif text-primary font-normal">
              ₹{netOperatingMargin.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
            <span className="text-[11px] text-muted block mt-1">
              Net cash collections less operational expenses
            </span>
          </div>

          <div className="bg-surface-card border border-hairline rounded-lg p-5">
            <span className="text-xs uppercase tracking-wider text-muted font-semibold block mb-1">
              Live Inventory Valuation
            </span>
            <span className="text-2xl font-serif text-ink font-normal">
              ₹{totalInventoryValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
            <span className="text-[11px] text-muted block mt-1">
              {stockItems.length} active SKUs in warehouse
            </span>
          </div>
        </div>
      </main>
    </div>
  );
}
