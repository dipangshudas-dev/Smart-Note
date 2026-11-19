'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Receipt, Plus, CheckCircle, AlertCircle, Calendar, ArrowRight } from 'lucide-react';
import TopNavigationBar from '@/components/TopNavigationBar';
import { createPettyCashAction } from '@/app/actions';

export default function PettyCashEntryPage() {
  const router = useRouter();
  const [entryDate, setEntryDate] = useState(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState('Office Supplies');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = [
    'Office Supplies',
    'Tea & Refreshments',
    'Courier & Postage',
    'Transportation & Fuel',
    'Cleaning & Maintenance',
    'Repairs & Hardware',
    'Miscellaneous',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSuccess(false);

    const amtNum = parseFloat(amount);
    if (isNaN(amtNum) || amtNum <= 0) {
      setErrorMsg('Please enter a valid expense amount.');
      return;
    }

    setIsSubmitting(true);
    const res = await createPettyCashAction({
      entry_date: entryDate,
      category,
      amount: amtNum,
      note: note.trim() || undefined,
    });
    setIsSubmitting(false);

    if (res.error) {
      setErrorMsg(res.error);
    } else {
      setIsSuccess(true);
      setAmount('');
      setNote('');
    }
  };

  return (
    <div className="min-h-screen bg-canvas flex flex-col">
      <TopNavigationBar currentModule="Petty Cash Entry" showBackToDashboard />

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 border-b border-hairline pb-4">
          <div className="flex items-center space-x-2 text-xs text-muted uppercase tracking-wider font-semibold mb-1">
            <Receipt className="w-3.5 h-3.5" />
            <span>Daily Outflows</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-normal text-ink">
            Petty Cash Expense Entry
          </h1>
          <p className="text-xs text-muted mt-1">
            Record minor operational cash expenses, categorized vouchers, and memo notes.
          </p>
        </div>

        {isSuccess && (
          <div className="mb-6 p-4 rounded-lg bg-semantic-success/10 border border-semantic-success/20 flex items-center justify-between">
            <div className="flex items-center space-x-2 text-xs text-semantic-success font-medium">
              <CheckCircle className="w-4 h-4" />
              <span>Petty cash expense voucher recorded successfully!</span>
            </div>
            <button
              onClick={() => router.push('/petty-cash-register')}
              className="text-xs font-semibold text-semantic-success underline"
            >
              View in Register
            </button>
          </div>
        )}

        <div className="bg-surface-card border border-hairline rounded-lg p-6 sm:p-8 shadow-sm">
          {errorMsg && (
            <div className="mb-4 p-3 bg-semantic-error/10 border border-semantic-error/20 rounded-md text-xs text-semantic-error flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs uppercase tracking-wider font-medium text-ink mb-1">
                  Voucher Date *
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="date"
                    required
                    value={entryDate}
                    onChange={(e) => setEntryDate(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-canvas border border-hairline rounded-md text-sm text-ink focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider font-medium text-ink mb-1">
                  Expense Category *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-canvas border border-hairline rounded-md text-sm text-ink focus:outline-none focus:border-primary"
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider font-medium text-ink mb-1">
                Amount Paid (₹) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full px-3 py-2 bg-canvas border border-hairline rounded-md text-sm font-mono text-ink focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider font-medium text-ink mb-1">
                Memo / Note
              </label>
              <textarea
                rows={3}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Describe expense purpose or voucher receipt number..."
                className="w-full px-3 py-2 bg-canvas border border-hairline rounded-md text-sm text-ink focus:outline-none focus:border-primary"
              />
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
                <span>{isSubmitting ? 'Saving...' : 'Record Petty Cash Expense'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
