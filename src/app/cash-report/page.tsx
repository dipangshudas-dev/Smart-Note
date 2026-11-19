import React from 'react';
import { redirect } from 'next/navigation';
import { TrendingUp, ArrowDownRight, ArrowUpRight, DollarSign } from 'lucide-react';
import { getSession } from '@/lib/auth';
import { getOrders, getPettyCashEntries } from '@/lib/data-store';
import TopNavigationBar from '@/components/TopNavigationBar';

export const dynamic = 'force-dynamic';

export default async function CashReportPage() {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }

  const [orders, pettyCashList] = await Promise.all([getOrders(), getPettyCashEntries()]);

  // Total collected cash = advance_amount across all orders
  const totalCashIn = orders.reduce((sum, o) => sum + o.advance_amount, 0);
  // Total petty cash expenses
  const totalCashOut = pettyCashList.reduce((sum, p) => sum + p.amount, 0);
  const netCashFlow = totalCashIn - totalCashOut;

  return (
    <div className="min-h-screen bg-canvas flex flex-col">
      <TopNavigationBar
        userName={session.name}
        role={session.role}
        currentModule="Cash Report"
        showBackToDashboard
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 border-b border-hairline pb-4">
          <div className="flex items-center space-x-2 text-xs text-muted uppercase tracking-wider font-semibold mb-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Treasury & Inflows</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-normal text-ink">
            Cash Inflow & Outflow Report
          </h1>
          <p className="text-xs text-muted mt-1">
            Comprehensive audit of collected customer payments against operational expense disbursements.
          </p>
        </div>

        {/* 3 Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
          <div className="bg-surface-card border border-hairline rounded-lg p-5">
            <div className="flex items-center justify-between text-muted mb-2">
              <span className="text-xs uppercase tracking-wider font-semibold">Total Cash Inflow</span>
              <ArrowDownRight className="w-4 h-4 text-semantic-success" />
            </div>
            <div className="text-2xl font-serif font-normal text-semantic-success">
              +₹{totalCashIn.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
            <p className="text-[11px] text-muted mt-1">
              Collected advances and delivery payments across {orders.length} orders
            </p>
          </div>

          <div className="bg-surface-card border border-hairline rounded-lg p-5">
            <div className="flex items-center justify-between text-muted mb-2">
              <span className="text-xs uppercase tracking-wider font-semibold">Total Cash Outflow</span>
              <ArrowUpRight className="w-4 h-4 text-semantic-error" />
            </div>
            <div className="text-2xl font-serif font-normal text-semantic-error">
              -₹{totalCashOut.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
            <p className="text-[11px] text-muted mt-1">
              Minor expense disbursements from {pettyCashList.length} petty cash vouchers
            </p>
          </div>

          <div className="bg-surface-card border border-hairline rounded-lg p-5">
            <div className="flex items-center justify-between text-muted mb-2">
              <span className="text-xs uppercase tracking-wider font-semibold">Net Cash Position</span>
              <DollarSign className="w-4 h-4 text-primary" />
            </div>
            <div
              className={`text-2xl font-serif font-normal ${
                netCashFlow >= 0 ? 'text-ink' : 'text-semantic-error'
              }`}
            >
              ₹{netCashFlow.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
            <p className="text-[11px] text-muted mt-1">
              Net retained liquid operating balance
            </p>
          </div>
        </div>

        {/* Recent Inflows and Outflows Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Order Collections */}
          <div className="bg-surface-card border border-hairline rounded-lg p-5">
            <h3 className="text-xs uppercase tracking-wider font-semibold text-muted mb-4">
              Recent Order Collections
            </h3>
            <div className="space-y-3">
              {orders.slice(0, 5).map((o) => (
                <div
                  key={o.id}
                  className="p-3 bg-canvas border border-hairline rounded flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-mono font-semibold text-primary">{o.order_number}</span>
                    <span className="text-muted ml-2">{o.customer_name}</span>
                  </div>
                  <span className="font-mono font-medium text-semantic-success">
                    +₹{o.advance_amount.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Petty Cash Disbursements */}
          <div className="bg-surface-card border border-hairline rounded-lg p-5">
            <h3 className="text-xs uppercase tracking-wider font-semibold text-muted mb-4">
              Recent Petty Cash Disbursements
            </h3>
            <div className="space-y-3">
              {pettyCashList.slice(0, 5).map((p) => (
                <div
                  key={p.id}
                  className="p-3 bg-canvas border border-hairline rounded flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-medium text-ink">{p.category}</span>
                    <span className="text-muted ml-2">{p.note || 'Expense voucher'}</span>
                  </div>
                  <span className="font-mono font-medium text-semantic-error">
                    -₹{p.amount.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
