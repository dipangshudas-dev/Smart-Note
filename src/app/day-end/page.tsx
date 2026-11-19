'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Calculator, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';
import TopNavigationBar from '@/components/TopNavigationBar';
import { createDayEndLogAction } from '@/app/actions';

export default function DayEndPage() {
  const router = useRouter();

  const [closeDate, setCloseDate] = useState(new Date().toISOString().split('T')[0]);
  const [openingCash, setOpeningCash] = useState<string>('0');
  const [cashIn, setCashIn] = useState<string>('0');
  const [cashOut, setCashOut] = useState<string>('0');
  const [actualCash, setActualCash] = useState<string>('0');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successLog, setSuccessLog] = useState<any | null>(null);

  const openingNum = parseFloat(openingCash) || 0;
  const inNum = parseFloat(cashIn) || 0;
  const outNum = parseFloat(cashOut) || 0;
  const actualNum = parseFloat(actualCash) || 0;

  const expectedCash = openingNum + inNum - outNum;
  const difference = actualNum - expectedCash;

  const handleLockDay = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!confirm('Are you sure you want to lock the Day End record? This action is irreversible.')) {
      return;
    }

    setIsSubmitting(true);
    const res = await createDayEndLogAction({
      close_date: closeDate,
      opening_cash: openingNum,
      cash_in: inNum,
      cash_out: outNum,
      actual_cash: actualNum,
    });
    setIsSubmitting(false);

    if (res.error) {
      setErrorMsg(res.error);
    } else if (res.log) {
      setSuccessLog(res.log);
    }
  };

  return (
    <div className="min-h-screen bg-canvas flex flex-col">
      <TopNavigationBar currentModule="Day End Reconciliation" showBackToDashboard />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 border-b border-hairline pb-4">
          <div className="flex items-center space-x-2 text-xs text-muted uppercase tracking-wider font-semibold mb-1">
            <Lock className="w-3.5 h-3.5" />
            <span>Daily Closing & Audit</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-normal text-ink">
            Day End Cash Reconciliation
          </h1>
          <p className="text-xs text-muted mt-1">
            Reconcile physical cash counted in drawer against calculated system totals and lock closing records.
          </p>
        </div>

        {successLog && (
          <div className="mb-6 p-5 rounded-lg bg-semantic-success/10 border border-semantic-success/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <CheckCircle2 className="w-6 h-6 text-semantic-success flex-shrink-0" />
              <div>
                <div className="text-sm font-semibold text-ink">
                  Closing record for {successLog.close_date} locked successfully!
                </div>
                <p className="text-xs text-muted">
                  Expected: ₹{successLog.expected_cash.toFixed(2)} | Actual: ₹
                  {successLog.actual_cash.toFixed(2)} | Discrepancy: ₹
                  {successLog.difference.toFixed(2)}
                </p>
              </div>
            </div>
            <button
              onClick={() => router.push('/day-end-log')}
              className="px-3 py-1.5 bg-canvas border border-hairline rounded text-xs font-medium text-ink hover:border-primary"
            >
              View Day End Log
            </button>
          </div>
        )}

        <div className="bg-surface-card border border-hairline rounded-lg p-6 sm:p-8 shadow-sm">
          {errorMsg && (
            <div className="mb-4 p-3 bg-semantic-error/10 border border-semantic-error/20 rounded-md text-xs text-semantic-error">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleLockDay} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs uppercase tracking-wider font-medium text-ink mb-1">
                  Closing Date *
                </label>
                <input
                  type="date"
                  required
                  value={closeDate}
                  onChange={(e) => setCloseDate(e.target.value)}
                  className="w-full px-3 py-2 bg-canvas border border-hairline rounded-md text-sm text-ink focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider font-medium text-ink mb-1">
                  Opening Cash In Drawer (₹) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={openingCash}
                  onChange={(e) => setOpeningCash(e.target.value)}
                  className="w-full px-3 py-2 bg-canvas border border-hairline rounded-md text-sm font-mono text-ink focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs uppercase tracking-wider font-medium text-ink mb-1">
                  Total Cash Inflows (Orders / Advance) (₹) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={cashIn}
                  onChange={(e) => setCashIn(e.target.value)}
                  className="w-full px-3 py-2 bg-canvas border border-hairline rounded-md text-sm font-mono text-ink focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider font-medium text-ink mb-1">
                  Total Cash Outflows (Petty Cash) (₹) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={cashOut}
                  onChange={(e) => setCashOut(e.target.value)}
                  className="w-full px-3 py-2 bg-canvas border border-hairline rounded-md text-sm font-mono text-ink focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            {/* Reconciliation Calculator Card */}
            <div className="bg-canvas border border-hairline rounded-lg p-5 space-y-3">
              <h3 className="text-xs uppercase tracking-wider font-semibold text-muted flex items-center space-x-1.5">
                <Calculator className="w-3.5 h-3.5" />
                <span>Reconciliation Audit Balance</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div className="p-3 bg-surface-card rounded border border-hairline">
                  <span className="text-[11px] text-muted block">Expected Drawer Cash:</span>
                  <span className="text-lg font-mono font-semibold text-ink">
                    ₹{expectedCash.toFixed(2)}
                  </span>
                </div>

                <div className="p-3 bg-surface-card rounded border border-hairline">
                  <span className="text-[11px] text-muted block">Physical Cash Counted:</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={actualCash}
                    onChange={(e) => setActualCash(e.target.value)}
                    placeholder="0.00"
                    className="w-full mt-1 px-2 py-1 bg-canvas border border-primary rounded text-sm font-mono font-semibold text-ink focus:outline-none"
                  />
                </div>

                <div className="p-3 bg-surface-card rounded border border-hairline">
                  <span className="text-[11px] text-muted block">Variance / Discrepancy:</span>
                  <span
                    className={`text-lg font-mono font-semibold ${
                      difference === 0
                        ? 'text-semantic-success'
                        : difference > 0
                        ? 'text-semantic-success'
                        : 'text-semantic-error'
                    }`}
                  >
                    {difference >= 0 ? `+₹${difference.toFixed(2)}` : `-₹${Math.abs(difference).toFixed(2)}`}
                  </span>
                </div>
              </div>

              {difference !== 0 && (
                <div className="flex items-center space-x-2 text-xs text-semantic-warning pt-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>
                    Note: A variance of ₹{Math.abs(difference).toFixed(2)} will be permanently logged in the audit ledger.
                  </span>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-hairline flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={() => router.push('/dashboard')}
                className="px-4 py-2 border border-hairline text-ink text-xs font-medium rounded-md hover:bg-surface-soft"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center space-x-2 px-5 py-2.5 bg-primary hover:bg-primary-active text-white text-xs font-medium rounded-md transition-colors shadow-sm disabled:opacity-50"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>{isSubmitting ? 'Locking...' : 'Lock & Finalize Day End'}</span>
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
