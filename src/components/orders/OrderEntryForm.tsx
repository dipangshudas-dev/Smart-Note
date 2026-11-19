'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ShoppingCart,
  Plus,
  Trash2,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Calculator,
  User,
  Phone,
} from 'lucide-react';
import { StockItem } from '@/types';
import { createOrderAction } from '@/app/actions';

interface OrderEntryFormProps {
  availableStock: StockItem[];
}

interface SelectedItemRow {
  stock_item_id: string;
  quantity: number;
  unit_price: number;
}

export default function OrderEntryForm({ availableStock }: OrderEntryFormProps) {
  const router = useRouter();

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [items, setItems] = useState<SelectedItemRow[]>(
    availableStock.length > 0
      ? [
          {
            stock_item_id: availableStock[0].id,
            quantity: 1,
            unit_price: availableStock[0].unit_price,
          },
        ]
      : []
  );
  const [advancePaid, setAdvancePaid] = useState<string>('0');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [createdOrderSuccess, setCreatedOrderSuccess] = useState<any | null>(null);

  if (availableStock.length === 0) {
    return (
      <div className="bg-surface-card border border-hairline rounded-lg p-8 text-center max-w-xl mx-auto shadow-sm">
        <div className="w-12 h-12 rounded-full bg-surface-soft border border-hairline flex items-center justify-center mx-auto mb-4 text-muted">
          <ShoppingCart className="w-6 h-6" />
        </div>
        <h2 className="text-base font-medium text-ink">No Stock Items in Warehouse</h2>
        <p className="text-xs text-muted mt-1.5 mb-6 leading-relaxed">
          There are currently no items registered in inventory. Please add stock items first before creating a customer order.
        </p>
        <button
          onClick={() => router.push('/stock')}
          className="inline-flex items-center space-x-2 px-4 py-2 bg-primary hover:bg-primary-active text-white text-xs font-medium rounded-md transition-colors shadow-sm"
        >
          <span>Open Stock Management</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  // Line item change handlers
  const handleItemSelect = (index: number, stockId: string) => {
    const selected = availableStock.find((s) => s.id === stockId);
    if (!selected) return;

    const newRows = [...items];
    newRows[index] = {
      stock_item_id: selected.id,
      quantity: 1,
      unit_price: selected.unit_price,
    };
    setItems(newRows);
  };

  const handleQuantityChange = (index: number, qty: number) => {
    const newRows = [...items];
    newRows[index].quantity = Math.max(1, qty);
    setItems(newRows);
  };

  const handlePriceChange = (index: number, price: number) => {
    const newRows = [...items];
    newRows[index].unit_price = Math.max(0, price);
    setItems(newRows);
  };

  const handleAddRow = () => {
    const defaultStock = availableStock[0];
    if (!defaultStock) return;
    setItems([
      ...items,
      {
        stock_item_id: defaultStock.id,
        quantity: 1,
        unit_price: defaultStock.unit_price,
      },
    ]);
  };

  const handleRemoveRow = (index: number) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  // Calculations
  const grandTotal = items.reduce((sum, row) => sum + row.quantity * row.unit_price, 0);
  const advanceAmountNum = Math.min(parseFloat(advancePaid) || 0, grandTotal);
  const dueAmount = Math.max(0, grandTotal - advanceAmountNum);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!customerName.trim()) {
      setFormError('Customer Name is required.');
      return;
    }

    if (items.length === 0) {
      setFormError('At least one item must be added to the order.');
      return;
    }

    // Validate stock limits
    for (const row of items) {
      const stock = availableStock.find((s) => s.id === row.stock_item_id);
      if (!stock) {
        setFormError('Please select a valid item.');
        return;
      }
      if (stock.quantity < row.quantity) {
        setFormError(
          `Cannot place order: "${stock.name}" has only ${stock.quantity} in stock, but ${row.quantity} was requested.`
        );
        return;
      }
    }

    setIsSubmitting(true);
    const res = await createOrderAction({
      customer_name: customerName.trim(),
      customer_phone: customerPhone.trim() || undefined,
      advance_amount: advanceAmountNum,
      items: items.map((row) => ({
        stock_item_id: row.stock_item_id,
        quantity: row.quantity,
        unit_price: row.unit_price,
      })),
    });

    setIsSubmitting(false);

    if (res.error) {
      setFormError(res.error);
    } else if (res.order) {
      setCreatedOrderSuccess(res.order);
      // Reset form
      setCustomerName('');
      setCustomerPhone('');
      setAdvancePaid('0');
      if (availableStock.length > 0) {
        setItems([
          {
            stock_item_id: availableStock[0].id,
            quantity: 1,
            unit_price: availableStock[0].unit_price,
          },
        ]);
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Success Banner */}
      {createdOrderSuccess && (
        <div className="p-5 rounded-lg bg-semantic-success/10 border border-semantic-success/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-full bg-semantic-success/20 flex items-center justify-center text-semantic-success">
              <CheckCircle className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-semibold text-ink">
                Order <span className="font-mono text-primary">{createdOrderSuccess.order_number}</span> created successfully!
              </div>
              <p className="text-xs text-muted">
                Total: ₹{createdOrderSuccess.total_amount.toFixed(2)} | Advance: ₹
                {createdOrderSuccess.advance_amount.toFixed(2)} | Balance Due: ₹
                {createdOrderSuccess.due_amount.toFixed(2)}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => router.push('/order-processing')}
              className="px-3.5 py-1.5 bg-canvas border border-hairline rounded-md text-xs font-medium text-ink hover:border-primary transition-colors"
            >
              Go to Order Processing
            </button>
            <button
              onClick={() => setCreatedOrderSuccess(null)}
              className="px-3.5 py-1.5 bg-primary text-white rounded-md text-xs font-medium hover:bg-primary-active transition-colors"
            >
              New Order
            </button>
          </div>
        </div>
      )}

      {/* Main Order Entry Form */}
      <div className="bg-surface-card border border-hairline rounded-lg p-6 sm:p-8 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          {formError && (
            <div className="p-3 bg-semantic-error/10 border border-semantic-error/20 rounded-md flex items-center space-x-2 text-xs text-semantic-error">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* Customer Details */}
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted mb-3 flex items-center space-x-1.5">
              <User className="w-3.5 h-3.5" />
              <span>Customer Information</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs uppercase tracking-wider font-medium text-ink mb-1">
                  Customer / Business Name *
                </label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. Apex Academy or John Doe"
                  className="w-full px-3 py-2 bg-canvas border border-hairline rounded-md text-sm text-ink placeholder-muted-soft focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider font-medium text-ink mb-1">
                  Contact Phone Number
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full pl-9 pr-3 py-2 bg-canvas border border-hairline rounded-md text-sm text-ink placeholder-muted-soft focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Order Items Table */}
          <div className="border-t border-hairline pt-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted flex items-center space-x-1.5">
                <ShoppingCart className="w-3.5 h-3.5" />
                <span>Order Items</span>
              </h2>
              <button
                type="button"
                onClick={handleAddRow}
                className="inline-flex items-center space-x-1 px-2.5 py-1 text-xs font-medium text-primary bg-canvas border border-hairline rounded hover:bg-surface-soft transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Another Item</span>
              </button>
            </div>

            <div className="overflow-x-auto border border-hairline rounded-md bg-canvas">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-surface-soft border-b border-hairline text-muted uppercase tracking-wider font-semibold">
                    <th className="py-2.5 px-3">Item Name</th>
                    <th className="py-2.5 px-3 w-28 text-center">In Stock</th>
                    <th className="py-2.5 px-3 w-28 text-right">Unit Price (₹)</th>
                    <th className="py-2.5 px-3 w-24 text-center">Quantity</th>
                    <th className="py-2.5 px-3 w-28 text-right">Line Total (₹)</th>
                    <th className="py-2.5 px-3 w-12 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-hairline">
                  {items.map((row, index) => {
                    const currentStock = availableStock.find((s) => s.id === row.stock_item_id);
                    const isExceeding = currentStock ? currentStock.quantity < row.quantity : false;
                    const lineTotal = row.quantity * row.unit_price;

                    return (
                      <tr key={index} className="hover:bg-surface-card/40">
                        {/* Item Select */}
                        <td className="py-2 px-3">
                          <select
                            value={row.stock_item_id}
                            onChange={(e) => handleItemSelect(index, e.target.value)}
                            className="w-full py-1.5 px-2 bg-canvas border border-hairline rounded text-xs text-ink focus:outline-none focus:border-primary"
                          >
                            {availableStock.map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.name} ({s.quantity} avail)
                              </option>
                            ))}
                          </select>
                        </td>

                        {/* Available Stock */}
                        <td className="py-2 px-3 text-center font-mono">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[11px] ${
                              isExceeding
                                ? 'bg-semantic-error/15 text-semantic-error font-bold'
                                : 'text-muted'
                            }`}
                          >
                            {currentStock ? currentStock.quantity : 0}
                          </span>
                        </td>

                        {/* Unit Price Input */}
                        <td className="py-2 px-3 text-right">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={row.unit_price}
                            onChange={(e) => handlePriceChange(index, parseFloat(e.target.value) || 0)}
                            className="w-24 text-right py-1 px-2 bg-canvas border border-hairline rounded text-xs text-ink focus:outline-none focus:border-primary font-mono"
                          />
                        </td>

                        {/* Quantity Input */}
                        <td className="py-2 px-3 text-center">
                          <input
                            type="number"
                            min="1"
                            value={row.quantity}
                            onChange={(e) => handleQuantityChange(index, parseInt(e.target.value, 10) || 1)}
                            className={`w-20 text-center py-1 px-2 bg-canvas border rounded text-xs text-ink font-mono focus:outline-none ${
                              isExceeding
                                ? 'border-semantic-error bg-semantic-error/5 text-semantic-error'
                                : 'border-hairline focus:border-primary'
                            }`}
                          />
                        </td>

                        {/* Line Total */}
                        <td className="py-2 px-3 text-right font-mono font-medium text-ink">
                          ₹{lineTotal.toFixed(2)}
                        </td>

                        {/* Remove Action */}
                        <td className="py-2 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveRow(index)}
                            disabled={items.length === 1}
                            className="p-1 text-muted hover:text-semantic-error disabled:opacity-30 disabled:hover:text-muted transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Payment & Settlement Summary Box */}
          <div className="border-t border-hairline pt-6">
            <div className="bg-canvas border border-hairline rounded-lg p-5">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted mb-4 flex items-center space-x-1.5">
                <Calculator className="w-3.5 h-3.5" />
                <span>Order Summary & Settlement</span>
              </h2>

              <div className="space-y-3 max-w-sm ml-auto text-sm">
                {/* Total */}
                <div className="flex items-center justify-between text-muted">
                  <span>Grand Total:</span>
                  <span className="font-mono text-base font-semibold text-ink">
                    ₹{grandTotal.toFixed(2)}
                  </span>
                </div>

                {/* Advance Input */}
                <div className="flex items-center justify-between gap-4">
                  <label htmlFor="advancePaid" className="text-xs text-muted whitespace-nowrap">
                    Advance Payment Paid (₹):
                  </label>
                  <input
                    id="advancePaid"
                    type="number"
                    step="0.01"
                    min="0"
                    max={grandTotal}
                    value={advancePaid}
                    onChange={(e) => setAdvancePaid(e.target.value)}
                    className="w-32 text-right py-1.5 px-2 bg-surface-card border border-hairline rounded-md text-sm font-mono text-ink focus:outline-none focus:border-primary"
                  />
                </div>

                {/* Due Balance */}
                <div className="flex items-center justify-between border-t border-hairline pt-3 font-semibold">
                  <span className={dueAmount > 0 ? 'text-semantic-error' : 'text-semantic-success'}>
                    Due Balance Remaining:
                  </span>
                  <span
                    className={`font-mono text-lg ${
                      dueAmount > 0 ? 'text-semantic-error' : 'text-semantic-success'
                    }`}
                  >
                    ₹{dueAmount.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Submit Action */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-hairline">
            <button
              type="button"
              onClick={() => router.push('/dashboard')}
              className="px-4 py-2 border border-hairline text-ink text-xs font-medium rounded-md hover:bg-surface-soft transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || grandTotal <= 0}
              className="inline-flex items-center space-x-2 px-5 py-2.5 bg-primary hover:bg-primary-active text-white text-xs font-medium rounded-md transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>{isSubmitting ? 'Placing Order...' : 'Confirm & Place Order'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
