'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Clock,
  Search,
  CheckCircle,
  Truck,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Check,
  Phone,
  User,
  Package,
} from 'lucide-react';
import { Order, OrderStatus } from '@/types';
import { updateOrderStatusAction } from '@/app/actions';

interface OrderProcessingListProps {
  initialOrders: Order[];
}

export default function OrderProcessingList({ initialOrders }: OrderProcessingListProps) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  const statusTabs = ['All', 'Pending', 'Processing', 'Ready', 'Delivered', 'Cancelled'];

  const filteredOrders = orders.filter((order) => {
    const matchesStatus = statusFilter === 'All' || order.status === statusFilter;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      order.order_number.toLowerCase().includes(q) ||
      order.customer_name.toLowerCase().includes(q) ||
      (order.customer_phone && order.customer_phone.toLowerCase().includes(q));
    return matchesStatus && matchesSearch;
  });

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    setIsUpdating(orderId);
    const res = await updateOrderStatusAction(orderId, newStatus);
    setIsUpdating(null);

    if (res.error) {
      alert(res.error);
    } else if (res.order) {
      setOrders(orders.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)));
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedOrderId(expandedOrderId === id ? null : id);
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'Pending':
        return (
          <span className="inline-flex items-center space-x-1 text-[11px] font-semibold uppercase px-2 py-0.5 rounded-pill bg-accent-amber/15 text-accent-amber border border-accent-amber/25">
            <Clock className="w-2.5 h-2.5" />
            <span>Pending</span>
          </span>
        );
      case 'Processing':
        return (
          <span className="inline-flex items-center space-x-1 text-[11px] font-semibold uppercase px-2 py-0.5 rounded-pill bg-primary/10 text-primary border border-primary/20">
            <Package className="w-2.5 h-2.5" />
            <span>Processing</span>
          </span>
        );
      case 'Ready':
        return (
          <span className="inline-flex items-center space-x-1 text-[11px] font-semibold uppercase px-2 py-0.5 rounded-pill bg-semantic-warning/15 text-semantic-warning border border-semantic-warning/25">
            <Truck className="w-2.5 h-2.5" />
            <span>Ready for Delivery</span>
          </span>
        );
      case 'Delivered':
        return (
          <span className="inline-flex items-center space-x-1 text-[11px] font-semibold uppercase px-2 py-0.5 rounded-pill bg-semantic-success/10 text-semantic-success border border-semantic-success/20">
            <CheckCircle className="w-2.5 h-2.5" />
            <span>Delivered</span>
          </span>
        );
      case 'Cancelled':
        return (
          <span className="inline-flex items-center space-x-1 text-[11px] font-semibold uppercase px-2 py-0.5 rounded-pill bg-semantic-error/10 text-semantic-error border border-semantic-error/20">
            <span>Cancelled</span>
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Status Category Tabs */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 sm:pb-0">
          {statusTabs.map((tab) => {
            const count =
              tab === 'All' ? orders.length : orders.filter((o) => o.status === tab).length;
            const isActive = statusFilter === tab;

            return (
              <button
                key={tab}
                onClick={() => setStatusFilter(tab)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors flex items-center space-x-1.5 ${
                  isActive
                    ? 'bg-surface-card border border-primary text-ink shadow-sm'
                    : 'bg-canvas text-muted hover:text-ink border border-hairline'
                }`}
              >
                <span>{tab}</span>
                <span
                  className={`text-[10px] font-mono px-1 rounded-full ${
                    isActive ? 'bg-primary text-white' : 'bg-surface-soft text-muted'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by order # or customer..."
            className="w-full pl-9 pr-3 py-1.5 bg-canvas border border-hairline rounded-md text-xs text-ink placeholder-muted-soft focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      {/* Orders List Table */}
      <div className="bg-surface-card border border-hairline rounded-lg overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-surface-soft border-b border-hairline uppercase tracking-wider text-muted font-semibold text-[11px]">
                <th className="py-3 px-4">Order #</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Total (₹)</th>
                <th className="py-3 px-4 text-right">Advance (₹)</th>
                <th className="py-3 px-4 text-right">Due (₹)</th>
                <th className="py-3 px-4">Created Date</th>
                <th className="py-3 px-4 text-right">Stage Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-muted">
                    No orders matching the selected filter.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const isExpanded = expandedOrderId === order.id;
                  const formattedDate = new Date(order.created_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  });

                  return (
                    <React.Fragment key={order.id}>
                      <tr className="hover:bg-canvas/60 transition-colors">
                        {/* Order Number & Expand Toggle */}
                        <td className="py-3 px-4 font-mono font-medium text-ink">
                          <button
                            onClick={() => toggleExpand(order.id)}
                            className="inline-flex items-center space-x-1.5 hover:text-primary transition-colors text-left"
                          >
                            {isExpanded ? (
                              <ChevronUp className="w-3.5 h-3.5 text-muted" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5 text-muted" />
                            )}
                            <span className="font-semibold text-primary">{order.order_number}</span>
                          </button>
                        </td>

                        {/* Customer */}
                        <td className="py-3 px-4">
                          <div className="font-medium text-ink">{order.customer_name}</div>
                          {order.customer_phone && (
                            <div className="text-[11px] text-muted flex items-center space-x-1 mt-0.5">
                              <Phone className="w-3 h-3 text-muted-soft" />
                              <span>{order.customer_phone}</span>
                            </div>
                          )}
                        </td>

                        {/* Status */}
                        <td className="py-3 px-4">{getStatusBadge(order.status)}</td>

                        {/* Financials */}
                        <td className="py-3 px-4 text-right font-mono font-medium text-ink">
                          ₹{order.total_amount.toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-muted">
                          ₹{order.advance_amount.toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono">
                          <span
                            className={
                              order.due_amount > 0
                                ? 'text-semantic-error font-semibold'
                                : 'text-semantic-success'
                            }
                          >
                            ₹{order.due_amount.toFixed(2)}
                          </span>
                        </td>

                        {/* Date */}
                        <td className="py-3 px-4 text-muted">{formattedDate}</td>

                        {/* Stage Progression Actions */}
                        <td className="py-3 px-4 text-right">
                          <div className="inline-flex items-center space-x-1">
                            {order.status === 'Pending' && (
                              <button
                                onClick={() => handleStatusChange(order.id, 'Processing')}
                                disabled={isUpdating === order.id}
                                className="px-2.5 py-1 bg-primary text-white rounded text-[11px] font-medium hover:bg-primary-active transition-colors"
                              >
                                {isUpdating === order.id ? 'Updating...' : 'Start Processing'}
                              </button>
                            )}

                            {order.status === 'Processing' && (
                              <button
                                onClick={() => handleStatusChange(order.id, 'Ready')}
                                disabled={isUpdating === order.id}
                                className="px-2.5 py-1 bg-accent-amber text-ink rounded text-[11px] font-medium hover:bg-accent-amber/80 transition-colors"
                              >
                                {isUpdating === order.id ? 'Updating...' : 'Mark as Ready'}
                              </button>
                            )}

                            {order.status === 'Ready' && (
                              <Link
                                href={`/delivery-confirmation?order=${order.order_number}`}
                                className="px-2.5 py-1 bg-semantic-success text-white rounded text-[11px] font-medium hover:bg-semantic-success/90 transition-colors inline-flex items-center space-x-1"
                              >
                                <span>Confirm Delivery</span>
                                <ArrowRight className="w-3 h-3" />
                              </Link>
                            )}

                            {order.status === 'Delivered' && (
                              <span className="text-[11px] text-muted font-medium inline-flex items-center space-x-1">
                                <Check className="w-3 h-3 text-semantic-success" />
                                <span>Completed</span>
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>

                      {/* Expanded Item Detail Row */}
                      {isExpanded && (
                        <tr className="bg-surface-soft/60">
                          <td colSpan={8} className="p-4 border-t border-hairline">
                            <div className="bg-canvas border border-hairline rounded-md p-3">
                              <span className="text-[11px] uppercase tracking-wider font-semibold text-muted block mb-2">
                                Order Line Items for {order.order_number}
                              </span>
                              {order.items && order.items.length > 0 ? (
                                <table className="w-full text-left text-xs">
                                  <thead>
                                    <tr className="border-b border-hairline text-muted uppercase text-[10px]">
                                      <th className="py-1 px-2">Item</th>
                                      <th className="py-1 px-2 text-right">Unit Price</th>
                                      <th className="py-1 px-2 text-center">Qty</th>
                                      <th className="py-1 px-2 text-right">Line Total</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-hairline">
                                    {order.items.map((item, idx) => (
                                      <tr key={idx}>
                                        <td className="py-1.5 px-2 font-medium text-ink">
                                          {item.stock_item?.name || 'Stock Item'}
                                        </td>
                                        <td className="py-1.5 px-2 text-right font-mono">
                                          ₹{item.unit_price.toFixed(2)}
                                        </td>
                                        <td className="py-1.5 px-2 text-center font-mono">
                                          {item.quantity}
                                        </td>
                                        <td className="py-1.5 px-2 text-right font-mono font-medium text-ink">
                                          ₹{item.line_total.toFixed(2)}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              ) : (
                                <p className="text-xs text-muted">No items found for this order.</p>
                              )}
                              <div className="mt-3 pt-2 border-t border-hairline flex items-center justify-between text-[11px] text-muted">
                                <span>Placed by: {order.created_by_name || 'Staff'}</span>
                                {order.delivered_at && (
                                  <span>
                                    Delivered at: {new Date(order.delivered_at).toLocaleString()}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
