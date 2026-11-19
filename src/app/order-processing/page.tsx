import React from 'react';
import { redirect } from 'next/navigation';
import { Clock } from 'lucide-react';
import { getSession } from '@/lib/auth';
import { getOrders } from '@/lib/data-store';
import TopNavigationBar from '@/components/TopNavigationBar';
import OrderProcessingList from '@/components/orders/OrderProcessingList';

export const dynamic = 'force-dynamic';

export default async function OrderProcessingPage() {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }

  const orders = await getOrders();

  return (
    <div className="min-h-screen bg-canvas flex flex-col">
      <TopNavigationBar
        userName={session.name}
        role={session.role}
        currentModule="Order Processing"
        showBackToDashboard
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 border-b border-hairline pb-4">
          <div className="flex items-center space-x-2 text-xs text-muted uppercase tracking-wider font-semibold mb-1">
            <Clock className="w-3.5 h-3.5" />
            <span>Workflow & Pipeline</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-normal text-ink">
            Order Processing Pipeline
          </h1>
          <p className="text-xs text-muted mt-1">
            Monitor orders across lifecycle stages, transition statuses from Pending to Ready, and prepare dispatches.
          </p>
        </div>

        <OrderProcessingList initialOrders={orders} />
      </main>
    </div>
  );
}
