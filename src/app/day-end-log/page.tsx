import React from 'react';
import { redirect } from 'next/navigation';
import { History, Lock, Calendar, CheckCircle, AlertTriangle } from 'lucide-react';
import { getSession } from '@/lib/auth';
import { getDayEndLogs } from '@/lib/data-store';
import TopNavigationBar from '@/components/TopNavigationBar';

export const dynamic = 'force-dynamic';

export default async function DayEndLogPage() {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }

  const logs = await getDayEndLogs();

  return (
    <div className="min-h-screen bg-canvas flex flex-col">
      <TopNavigationBar
        userName={session.name}
        role={session.role}
        currentModule="Day End Log"
        showBackToDashboard
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 border-b border-hairline pb-4">
          <div className="flex items-center space-x-2 text-xs text-muted uppercase tracking-wider font-semibold mb-1">
            <History className="w-3.5 h-3.5" />
            <span>Audit Trail</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-normal text-ink">
            Historical Day-End Closing Records
          </h1>
          <p className="text-xs text-muted mt-1">
            Permanent records of daily reconciliations, physical cash counts, and discrepancy audits.
          </p>
        </div>

        <div className="bg-surface-card border border-hairline rounded-lg overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-surface-soft border-b border-hairline uppercase tracking-wider text-muted font-semibold text-[11px]">
                  <th className="py-3 px-4">Closing Date</th>
                  <th className="py-3 px-4 text-right">Opening Cash</th>
                  <th className="py-3 px-4 text-right">Cash In</th>
                  <th className="py-3 px-4 text-right">Cash Out</th>
                  <th className="py-3 px-4 text-right">Expected Total</th>
                  <th className="py-3 px-4 text-right">Physical Count</th>
                  <th className="py-3 px-4 text-right">Variance</th>
                  <th className="py-3 px-4">Closed By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-muted">
                      No locked day-end closing records found.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-canvas/60 transition-colors font-mono">
                      <td className="py-3 px-4 font-semibold text-ink">
                        {new Date(log.close_date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="py-3 px-4 text-right text-muted">
                        ₹{log.opening_cash.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right text-semantic-success">
                        +₹{log.cash_in.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right text-semantic-error">
                        -₹{log.cash_out.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-ink">
                        ₹{log.expected_cash.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-ink">
                        ₹{log.actual_cash.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {log.difference === 0 ? (
                          <span className="text-semantic-success font-semibold">₹0.00</span>
                        ) : log.difference > 0 ? (
                          <span className="text-semantic-success font-semibold">
                            +₹{log.difference.toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-semantic-error font-semibold">
                            -₹{Math.abs(log.difference).toFixed(2)}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-sans text-muted">
                        {log.closed_by_name || 'Staff'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
