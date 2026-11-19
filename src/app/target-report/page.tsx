import React from 'react';
import { redirect } from 'next/navigation';
import { Target as TargetIcon, TrendingUp, Calendar, CheckCircle } from 'lucide-react';
import { getSession } from '@/lib/auth';
import { getTargets, getOrders } from '@/lib/data-store';
import TopNavigationBar from '@/components/TopNavigationBar';

export const dynamic = 'force-dynamic';

export default async function TargetReportPage() {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }

  const [targets, orders] = await Promise.all([getTargets(), getOrders()]);

  // Actual sales achieved
  const totalSalesAchieved = orders.reduce((sum, o) => sum + o.total_amount, 0);
  const totalCollectionsAchieved = orders.reduce((sum, o) => sum + o.advance_amount, 0);

  const activeTarget = targets[0] || null;

  const targetAmt = activeTarget ? activeTarget.target_amount : 0;
  const salesPct = targetAmt > 0 ? Math.min(100, (totalSalesAchieved / targetAmt) * 100) : 0;
  const collectionsPct = targetAmt > 0 ? Math.min(100, (totalCollectionsAchieved / targetAmt) * 100) : 0;

  return (
    <div className="min-h-screen bg-canvas flex flex-col">
      <TopNavigationBar
        userName={session.name}
        role={session.role}
        currentModule="Target Report"
        showBackToDashboard
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 border-b border-hairline pb-4">
          <div className="flex items-center space-x-2 text-xs text-muted uppercase tracking-wider font-semibold mb-1">
            <TargetIcon className="w-3.5 h-3.5" />
            <span>Goals & Quotas</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-normal text-ink">
            Target vs. Actual Performance
          </h1>
          <p className="text-xs text-muted mt-1">
            Track periodic business milestones, revenue targets, and collection progress.
          </p>
        </div>

        {/* Target Progress Card */}
        {activeTarget ? (
          <div className="bg-surface-card border border-hairline rounded-lg p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-hairline pb-5">
              <div>
                <span className="text-xs uppercase tracking-wider font-semibold text-muted">
                  Active Benchmark Period
                </span>
                <h2 className="text-xl font-serif font-normal text-ink mt-0.5">
                  {activeTarget.period_label}
                </h2>
                <div className="text-xs text-muted flex items-center space-x-2 mt-1">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>
                    {activeTarget.start_date} to {activeTarget.end_date}
                  </span>
                </div>
              </div>

              <div className="text-left sm:text-right">
                <span className="text-xs uppercase tracking-wider font-semibold text-muted">
                  Benchmark Target
                </span>
                <div className="text-2xl font-serif text-primary font-normal">
                  ₹{activeTarget.target_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
              </div>
            </div>

            {/* Sales Progress Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-ink">Sales Booked vs. Target</span>
                <span className="font-mono text-muted">
                  ₹{totalSalesAchieved.toLocaleString(undefined, { minimumFractionDigits: 2 })} (
                  {salesPct.toFixed(1)}%)
                </span>
              </div>
              <div className="w-full h-3 bg-surface-soft border border-hairline rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-300"
                  style={{ width: `${salesPct}%` }}
                />
              </div>
            </div>

            {/* Collections Progress Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-ink">Cash Collections vs. Target</span>
                <span className="font-mono text-muted">
                  ₹{totalCollectionsAchieved.toLocaleString(undefined, { minimumFractionDigits: 2 })} (
                  {collectionsPct.toFixed(1)}%)
                </span>
              </div>
              <div className="w-full h-3 bg-surface-soft border border-hairline rounded-full overflow-hidden">
                <div
                  className="h-full bg-semantic-success rounded-full transition-all duration-300"
                  style={{ width: `${collectionsPct}%` }}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-surface-card border border-hairline rounded-lg p-8 text-center max-w-xl mx-auto shadow-sm">
            <div className="w-12 h-12 rounded-full bg-surface-soft border border-hairline flex items-center justify-center mx-auto mb-4 text-muted">
              <TargetIcon className="w-6 h-6" />
            </div>
            <h2 className="text-base font-medium text-ink">No Sales Target Defined</h2>
            <p className="text-xs text-muted mt-1.5 leading-relaxed">
              No active quota target has been configured in the database yet. Sales performance metrics will track against targets once they are configured.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
