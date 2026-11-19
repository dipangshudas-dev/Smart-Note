'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  CheckCircle2,
  Truck,
  Search,
  DollarSign,
  AlertCircle,
  Clock,
  Calendar,
  User,
  ArrowRight,
  Receipt,
} from 'lucide-react';
import { Order } from '@/types';
import { confirmDeliveryAction } from '@/app/actions';

interface DeliveryConfirmationManagerProps {
  initialOrders: Order[];
}

export default function DeliveryConfirmationManager({
  initialOrders,
}: DeliveryConfirmationManagerProps) {
  const searchParams = useSearchParams();
  const preselectOrderParam = searchParams.get('order');

  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [selectedOrderId, setSelectedOrderId] = useState<string>('');
  const [collectedAmount, setCollectedAmount] = useState<string>('0');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successReceipt, setSuccessReceipt] = useState<Order | null>(null);
  const [tabFilter, setTabFilter] = useState<'pending' | 'delivered'>('pending');

  const pendingDeliveries = orders.filter((o) => o.status === 'Ready' || o.status === 'Processing');
  const deliveredOrders = orders.filter((o) => o.status === 'Delivered');

  // Handle URL preselection
  useEffect(() => {
    if (preselectOrderParam) {
      const target = orders.find((o) => o.order_number === preselectOrderParam);
      if (target) {
        setSelectedOrderId(target.id);
        setCollectedAmount(target.due_amount.toString());
      }
    } else if (pendingDeliveries.length > 0 && !selectedOrderId) {
      setSelectedOrderId(pendingDeliveries[0].id);
      setCollectedAmount(pendingDeliveries[0].due_amount.toString());
    }
  }, [preselectOrderParam, orders]);

  const selectedOrder = orders.find((o) => o.id === selectedOrderId);

  const handleSelectOrder = (order: Order) => {
    setSelectedOrderId(order.id);
    setCollectedAmount(order.due_amount.toString());
    setErrorMsg(null);
  };

  const handleConfirmDelivery = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!selectedOrder) {
      setErrorMsg('Please select an order to confirm delivery.');
      return;
    }

    const collectedNum = parseFloat(collectedAmount) || 0;
    if (collectedNum < 0) {
      setErrorMsg('Collected amount cannot be negative.');
      return;
    }

    setIsSubmitting(true);
    const res = await confirmDeliveryAction(selectedOrder.id, collectedNum);
    setIsSubmitting(false);

    if (res.error) {
      setErrorMsg(res.error);
    } else if (res.order) {
      setOrders(orders.map((o) => (o.id === res.order!.id ? res.order! : o)));
      setSuccessReceipt(res.order);
      // Select next pending order if available
      const remaining = pendingDeliveries.filter((o) => o.id !== res.order!.id);
      if (remaining.length > 0) {
        setSelectedOrderId(remaining[0].id);
        setCollectedAmount(remaining[0].due_amount.toString());
      } else {
        setSelectedOrderId('');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Success Notification Banner */}
      {successReceipt && (
        <div className="p-5 rounded-lg bg-semantic-success/10 border border-semantic-success/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-full bg-semantic-success/20 flex items-center justify-center text-semantic-success">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-semibold text-ink">
                Delivery Confirmed for Order <span className="font-mono text-primary">{successReceipt.order_number}</span>!
              </div>
              <p className="text-xs text-muted">
                Status updated to Delivered. Total settled: ₹
                {successReceipt.advance_amount.toFixed(2)} | Remaining Due: ₹
                {successReceipt.due_amount.toFixed(2)}
              </p>
            </div>
          </div>
          <button
            onClick={() => setSuccessReceipt(null)}
            className="text-xs font-medium text-muted hover:text-ink px-3 py-1 bg-canvas border border-hairline rounded"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Grid: Orders Queue (Left) & Delivery Settlement Panel (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Orders Queue */}
        <div className="lg:col-span-7 space-y-4">
          {/* Tabs */}
          <div className="flex items-center space-x-2 border-b border-hairline pb-2">
            <button
              onClick={() => setTabFilter('pending')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                tabFilter === 'pending'
                  ? 'bg-surface-card text-ink border border-primary font-semibold'
                  : 'text-muted hover:text-ink'
              }`}
            >
              Ready / Pending Deliveries ({pendingDeliveries.length})
            </button>
            <button
              onClick={() => setTabFilter('delivered')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                tabFilter === 'delivered'
                  ? 'bg-surface-card text-ink border border-primary font-semibold'
                  : 'text-muted hover:text-ink'
              }`}
            >
              Completed Deliveries ({deliveredOrders.length})
            </button>
          </div>

          {/* List of Orders */}
          <div className="space-y-3">
            {tabFilter === 'pending' ? (
              pendingDeliveries.length === 0 ? (
                <div className="p-8 text-center text-xs text-muted bg-surface-card border border-hairline rounded-lg">
                  No orders currently waiting for delivery confirmation.
                </div>
              ) : (
                pendingDeliveries.map((order) => {
                  const isSelected = selectedOrderId === order.id;

                  return (
                    <div
                      key={order.id}
                      onClick={() => handleSelectOrder(order)}
                      className={`p-4 rounded-lg border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-canvas border-primary shadow-sm ring-1 ring-primary'
                          : 'bg-surface-card border-hairline hover:border-primary/50'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-mono text-sm font-semibold text-primary">
                              {order.order_number}
                            </span>
                            <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-pill bg-accent-amber/15 text-accent-amber border border-accent-amber/25">
                              {order.status}
                            </span>
                          </div>
                          <div className="text-xs font-medium text-ink mt-1">
                            {order.customer_name}
                          </div>
                          {order.customer_phone && (
                            <div className="text-[11px] text-muted">{order.customer_phone}</div>
                          )}
                        </div>

                        <div className="text-right">
                          <span className="text-[10px] uppercase text-muted block">Due Balance</span>
                          <span className="font-mono text-sm font-semibold text-semantic-error">
                            ₹{order.due_amount.toFixed(2)}
                          </span>
                          <span className="text-[10px] text-muted block mt-0.5">
                            Total: ₹{order.total_amount.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )
            ) : (
              deliveredOrders.map((order) => (
                <div
                  key={order.id}
                  className="p-4 rounded-lg bg-surface-card border border-hairline flex items-center justify-between"
                >
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-xs font-semibold text-ink">
                        {order.order_number}
                      </span>
                      <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-pill bg-semantic-success/10 text-semantic-success border border-semantic-success/20">
                        Delivered
                      </span>
                    </div>
                    <div className="text-xs text-muted mt-0.5">
                      Customer: <strong className="text-ink">{order.customer_name}</strong> &middot;{' '}
                      {order.delivered_at && new Date(order.delivered_at).toLocaleDateString()}
                    </div>
                  </div>

                  <div className="text-right font-mono text-xs">
                    <span className="text-muted block">Settled Amount:</span>
                    <span className="font-semibold text-ink">
                      ₹{order.advance_amount.toFixed(2)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Settlement & Confirmation Panel */}
        <div className="lg:col-span-5">
          <div className="bg-surface-card border border-hairline rounded-lg p-6 shadow-sm sticky top-20">
            <div className="flex items-center space-x-2 border-b border-hairline pb-4 mb-5">
              <Truck className="w-5 h-5 text-primary" />
              <h3 className="text-base font-medium text-ink">Confirm Delivery & Collect Due</h3>
            </div>

            {errorMsg && (
              <div className="mb-4 p-3 bg-semantic-error/10 border border-semantic-error/20 text-xs text-semantic-error rounded-md flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {selectedOrder ? (
              <form onSubmit={handleConfirmDelivery} className="space-y-4">
                {/* Order Summary Specs */}
                <div className="bg-canvas border border-hairline rounded-md p-4 space-y-2.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted">Selected Order:</span>
                    <span className="font-mono font-semibold text-primary">
                      {selectedOrder.order_number}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">Customer Name:</span>
                    <span className="font-medium text-ink">{selectedOrder.customer_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">Order Total Value:</span>
                    <span className="font-mono text-ink">
                      ₹{selectedOrder.total_amount.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">Advance Already Received:</span>
                    <span className="font-mono text-muted">
                      ₹{selectedOrder.advance_amount.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-hairline font-semibold">
                    <span className="text-semantic-error">Remaining Due Balance:</span>
                    <span className="font-mono text-semantic-error">
                      ₹{selectedOrder.due_amount.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Amount to collect input */}
                <div>
                  <label
                    htmlFor="collectAmt"
                    className="block text-xs uppercase tracking-wider font-medium text-ink mb-1.5"
                  >
                    Cash Collection at Delivery (₹)
                  </label>
                  <div className="relative">
                    <DollarSign className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      id="collectAmt"
                      type="number"
                      step="0.01"
                      min="0"
                      value={collectedAmount}
                      onChange={(e) => setCollectedAmount(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-canvas border border-hairline rounded-md text-sm font-mono text-ink focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <p className="text-[11px] text-muted mt-1">
                    Default is remaining due. Leave 0 if no cash collected upon delivery.
                  </p>
                </div>

                {/* Delivery Note */}
                <div className="p-3 bg-surface-soft rounded-md border border-hairline-soft text-xs text-muted space-y-1">
                  <div className="flex items-center space-x-1.5 font-medium text-ink">
                    <Clock className="w-3.5 h-3.5 text-muted" />
                    <span>Audit Trail Confirmation</span>
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    Confirming delivery will mark the order as &quot;Delivered&quot;, record the current
                    timestamp, and adjust the cash inflow ledger.
                  </p>
                </div>

                {/* Action button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 bg-primary hover:bg-primary-active text-white text-xs font-medium rounded-md transition-colors shadow-sm disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isSubmitting ? 'Confirming...' : 'Confirm Delivery & Record Payment'}</span>
                </button>
              </form>
            ) : (
              <div className="py-12 text-center text-xs text-muted">
                Select an order from the list on the left to confirm delivery.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
