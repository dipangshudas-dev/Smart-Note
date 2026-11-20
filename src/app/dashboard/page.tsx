import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
  ShoppingCart,
  CheckCircle2,
  Receipt,
  FileSpreadsheet,
  Lock,
  History,
  TrendingUp,
  BarChart3,
  Clock,
  Package,
  Target as TargetIcon,
  ArrowUpRight,
  ShieldAlert,
  Layers,
  ChevronRight,
} from 'lucide-react';
import { getSession } from '@/lib/auth';
import TopNavigationBar from '@/components/TopNavigationBar';
import { getOrders, getStockItems, getPettyCashEntries, getDayEndLogs } from '@/lib/data-store';
import { isSupabaseConfigured } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }

  // Load live operational metrics for dashboard pulse
  const [orders, stockItems, pettyCashList, dayEndLogs] = await Promise.all([
    getOrders(),
    getStockItems(),
    getPettyCashEntries(),
    getDayEndLogs(),
  ]);

  const activeOrdersCount = orders.filter((o) => o.status !== 'Delivered' && o.status !== 'Cancelled').length;
  const pendingDeliveryCount = orders.filter((o) => o.status === 'Ready').length;
  const lowStockCount = stockItems.filter((s) => s.quantity <= 20).length;
  const todayStr = new Date().toISOString().split('T')[0];
  const todayPettyCashTotal = pettyCashList
    .filter((p) => p.entry_date === todayStr)
    .reduce((sum, p) => sum + p.amount, 0);

  // 11 Core Modules as specified in PROJECT.md
  const modules = [
    {
      id: 'order-entry',
      title: 'Order Entry',
      description: 'Create customer orders with item quantities, advance payments, and automatic stock deduction.',
      href: '/order-entry',
      icon: ShoppingCart,
      badge: 'Core Entry',
      highlightColor: 'hover:border-primary',
    },
    {
      id: 'delivery-confirmation',
      title: 'Delivery Confirmation',
      description: 'Confirm order deliveries, record remaining due balance collections, and close order items.',
      href: '/delivery-confirmation',
      icon: CheckCircle2,
      badge: pendingDeliveryCount > 0 ? `${pendingDeliveryCount} Ready` : undefined,
      highlightColor: 'hover:border-semantic-success',
    },
    {
      id: 'order-processing',
      title: 'Order Processing',
      description: 'Track and transition order workflow across stages (Pending, Processing, Ready, Delivered).',
      href: '/order-processing',
      icon: Clock,
      badge: `${activeOrdersCount} Active`,
      highlightColor: 'hover:border-accent-amber',
    },
    {
      id: 'stock',
      title: 'Stock Management',
      description: 'Add new items, update quantities and unit prices, and monitor live inventory availability.',
      href: '/stock',
      icon: Package,
      badge: lowStockCount > 0 ? `${lowStockCount} Low Stock` : `${stockItems.length} Items`,
      highlightColor: 'hover:border-primary',
    },
    {
      id: 'petty-cash-entry',
      title: 'Petty Cash Entry',
      description: 'Log daily minor business expenses with voucher amount, category, date, and remark notes.',
      href: '/petty-cash-entry',
      icon: Receipt,
      badge: 'Daily Expense',
      highlightColor: 'hover:border-primary',
    },
    {
      id: 'petty-cash-register',
      title: 'Petty Cash Register',
      description: 'Browse, filter, and summarize logged expenses by date range and expense categories.',
      href: '/petty-cash-register',
      icon: FileSpreadsheet,
      badge: todayPettyCashTotal > 0 ? `Today: ₹${todayPettyCashTotal.toLocaleString()}` : undefined,
      highlightColor: 'hover:border-primary',
    },
    {
      id: 'day-end',
      title: 'Day End Reconciliation',
      description: 'Reconcile expected cash vs. physical closing drawer cash and permanently lock the day record.',
      href: '/day-end',
      icon: Lock,
      badge: 'Admin Only',
      adminOnly: true,
      highlightColor: 'hover:border-primary',
    },
    {
      id: 'day-end-log',
      title: 'Day End Log',
      description: 'Review historical closing records, audit discrepancies, and verified cash drawer histories.',
      href: '/day-end-log',
      icon: History,
      badge: `${dayEndLogs.length} Records`,
      highlightColor: 'hover:border-primary',
    },
    {
      id: 'cash-report',
      title: 'Cash Report',
      description: 'Summarize order cash collections, advance receipts, petty cash outflows, and net cash balances.',
      href: '/cash-report',
      icon: TrendingUp,
      badge: 'Financial',
      highlightColor: 'hover:border-semantic-success',
    },
    {
      id: 'mis-summary',
      title: 'MIS Summary',
      description: 'Executive overview of total sales, collected revenue, outstanding customer dues, and net balance.',
      href: '/mis-summary',
      icon: BarChart3,
      badge: 'Executive',
      highlightColor: 'hover:border-primary',
    },
    {
      id: 'target-report',
      title: 'Target Report',
      description: 'Track periodic sales and collection targets against real-time actual achievement rates.',
      href: '/target-report',
      icon: TargetIcon,
      badge: 'Analytics',
      highlightColor: 'hover:border-primary',
    },
  ];

  return (
    <div className="min-h-screen bg-canvas flex flex-col">
      {/* Pinned Top Navigation Bar */}
      <TopNavigationBar userName={session.name} role={session.role} />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome & Pulse Header */}
        <div className="mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-4 border-b border-hairline pb-6">
          <div>
            <div className="flex items-center space-x-2 text-xs text-muted uppercase tracking-wider font-semibold mb-1">
              <Layers className="w-3.5 h-3.5" />
              <span>Operations Control Center</span>
            </div>
            <h1 className="font-serif text-3xl font-normal text-ink">
              Operational Workspace
            </h1>
            <p className="text-sm text-muted mt-1">
              Select a module below to process transactions, manage inventory, or analyze closing summaries.
            </p>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="bg-surface-card border border-hairline px-3.5 py-2.5 rounded-lg">
              <span className="text-[11px] uppercase tracking-wider text-muted block font-medium">
                Active Orders
              </span>
              <span className="text-xl font-serif text-ink font-normal">{activeOrdersCount}</span>
            </div>
            <div className="bg-surface-card border border-hairline px-3.5 py-2.5 rounded-lg">
              <span className="text-[11px] uppercase tracking-wider text-muted block font-medium">
                Stock Catalog
              </span>
              <span className="text-xl font-serif text-ink font-normal">{stockItems.length} items</span>
            </div>
            <div className="col-span-2 sm:col-span-1 bg-surface-card border border-hairline px-3.5 py-2.5 rounded-lg">
              <span className="text-[11px] uppercase tracking-wider text-muted block font-medium">
                Ready Delivery
              </span>
              <span className="text-xl font-serif text-ink font-normal">{pendingDeliveryCount}</span>
            </div>
          </div>
        </div>

        {/* 11 Module Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {modules.map((m, index) => {
            const Icon = m.icon;
            const isRestricted = m.adminOnly && session.role !== 'admin';

            return (
              <div
                key={m.id}
                className={`relative group bg-surface-card border border-hairline rounded-lg p-6 flex flex-col justify-between transition-all duration-150 ${
                  isRestricted
                    ? 'opacity-65 cursor-not-allowed'
                    : `hover:shadow-sm hover:bg-canvas ${m.highlightColor}`
                }`}
              >
                <div>
                  {/* Top card bar: Icon + Badge + Numbering */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-md bg-canvas border border-hairline flex items-center justify-center text-ink group-hover:text-primary transition-colors">
                      <Icon className="w-5 h-5" />
                    </div>

                    <div className="flex items-center space-x-2">
                      {m.badge && (
                        <span className="text-[11px] font-medium uppercase tracking-wider text-muted bg-canvas border border-hairline px-2 py-0.5 rounded-pill">
                          {m.badge}
                        </span>
                      )}
                      <span className="text-xs font-mono text-muted-soft">
                        #{String(index + 1).padStart(2, '0')}
                      </span>
                    </div>
                  </div>

                  {/* Title & Description */}
                  <h2 className="text-base font-medium text-ink group-hover:text-primary transition-colors flex items-center justify-between">
                    <span>{m.title}</span>
                    {!isRestricted && (
                      <ArrowUpRight className="w-4 h-4 text-muted group-hover:text-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    )}
                  </h2>
                  <p className="text-xs text-body leading-relaxed mt-2">
                    {m.description}
                  </p>
                </div>

                {/* Bottom Action Footer */}
                <div className="mt-6 pt-3 border-t border-hairline-soft flex items-center justify-between">
                  {isRestricted ? (
                    <div className="flex items-center space-x-1.5 text-xs text-muted-soft">
                      <ShieldAlert className="w-3.5 h-3.5" />
                      <span>Admin Clearance Required</span>
                    </div>
                  ) : (
                    <Link
                      href={m.href}
                      className="text-xs font-medium text-primary hover:text-primary-active inline-flex items-center space-x-1 transition-colors"
                    >
                      <span>Open Module</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* System Information Banner */}
        <div className="mt-12 p-4 rounded-lg bg-surface-soft border border-hairline flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted">
          <div>
            <span className="font-semibold text-ink">Smart Note Ledger System</span> &middot; Active Database:{' '}
            {isSupabaseConfigured ? (
              <span className="text-semantic-success font-medium">
                Supabase PostgreSQL (Connected)
              </span>
            ) : (
              <span className="text-semantic-warning font-medium">
                Local Offline Storage (Supabase credentials not configured in .env.local)
              </span>
            )}
          </div>
          <div className="flex items-center space-x-4">
            <span>Signed in as <strong className="text-ink">{session.name}</strong></span>
            <span className="text-hairline">|</span>
            <span>Role: <strong className="uppercase text-ink">{session.role}</strong></span>
          </div>
        </div>
      </main>
    </div>
  );
}
