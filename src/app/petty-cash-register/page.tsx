import React from 'react';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { FileSpreadsheet, Plus, Filter, Calendar } from 'lucide-react';
import { getSession } from '@/lib/auth';
import { getPettyCashEntries } from '@/lib/data-store';
import TopNavigationBar from '@/components/TopNavigationBar';

export const dynamic = 'force-dynamic';

export default async function PettyCashRegisterPage() {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }

  const entries = await getPettyCashEntries();
  const totalAmount = entries.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="min-h-screen bg-canvas flex flex-col">
      <TopNavigationBar
        userName={session.name}
        role={session.role}
        currentModule="Petty Cash Register"
        showBackToDashboard
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-hairline pb-4">
          <div>
            <div className="flex items-center space-x-2 text-xs text-muted uppercase tracking-wider font-semibold mb-1">
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Expense Audit</span>
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-normal text-ink">
              Petty Cash Register
            </h1>
            <p className="text-xs text-muted mt-1">
              Detailed historical ledger of all minor disbursements and office expenditures.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <Link
              href="/petty-cash-entry"
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-primary hover:bg-primary-active text-white text-xs font-medium rounded-md transition-colors shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Record New Expense</span>
            </Link>
          </div>
        </div>

        {/* Total Summary Header */}
        <div className="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-surface-card border border-hairline rounded-lg p-4">
            <span className="text-[11px] uppercase tracking-wider text-muted block font-medium">
              Total Logged Expenses
            </span>
            <span className="text-2xl font-serif font-normal text-ink">
              ₹{totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="bg-surface-card border border-hairline rounded-lg p-4">
            <span className="text-[11px] uppercase tracking-wider text-muted block font-medium">
              Total Recorded Vouchers
            </span>
            <span className="text-2xl font-serif font-normal text-ink">{entries.length}</span>
          </div>
          <div className="bg-surface-card border border-hairline rounded-lg p-4">
            <span className="text-[11px] uppercase tracking-wider text-muted block font-medium">
              Average Disbursement
            </span>
            <span className="text-2xl font-serif font-normal text-ink">
              ₹{entries.length > 0 ? (totalAmount / entries.length).toFixed(2) : '0.00'}
            </span>
          </div>
        </div>

        {/* Register Table */}
        <div className="bg-surface-card border border-hairline rounded-lg overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-surface-soft border-b border-hairline uppercase tracking-wider text-muted font-semibold text-[11px]">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Memo / Remarks</th>
                  <th className="py-3 px-4 text-right">Disbursed Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline">
                {entries.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-muted">
                      No petty cash expenses logged yet.
                    </td>
                  </tr>
                ) : (
                  entries.map((entry) => (
                    <tr key={entry.id} className="hover:bg-canvas/60 transition-colors">
                      <td className="py-3 px-4 font-mono text-ink">
                        {new Date(entry.entry_date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="py-3 px-4 font-medium text-ink">
                        <span className="px-2 py-0.5 rounded-pill bg-surface-soft border border-hairline text-muted">
                          {entry.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-muted">{entry.note || '—'}</td>
                      <td className="py-3 px-4 text-right font-mono font-medium text-ink">
                        ₹{entry.amount.toFixed(2)}
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
