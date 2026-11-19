import React, { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { CheckCircle2 } from 'lucide-react';
import { getSession } from '@/lib/auth';
import { getOrders } from '@/lib/data-store';
import TopNavigationBar from '@/components/TopNavigationBar';
import DeliveryConfirmationManager from '@/components/delivery/DeliveryConfirmationManager';

export const dynamic = 'force-dynamic';

export default async function DeliveryConfirmationPage() {
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
        currentModule="Delivery Confirmation"
        showBackToDashboard
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 border-b border-hairline pb-4">
          <div className="flex items-center space-x-2 text-xs text-muted uppercase tracking-wider font-semibold mb-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Fulfillment & Collections</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-normal text-ink">
            Delivery Confirmation & Due Collection
          </h1>
          <p className="text-xs text-muted mt-1">
            Confirm handover of customer orders, collect remaining due amounts, and settle accounts.
          </p>
        </div>

        <Suspense fallback={<div className="text-xs text-muted py-6">Loading delivery records...</div>}>
          <DeliveryConfirmationManager initialOrders={orders} />
        </Suspense>
      </main>
    </div>
  );
}
