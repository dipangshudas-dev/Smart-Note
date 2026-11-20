'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Package,
  Plus,
  Search,
  Edit2,
  Trash2,
  Check,
  X,
  AlertTriangle,
  ArrowUpDown,
  RefreshCw,
} from 'lucide-react';
import { StockItem } from '@/types';
import {
  createStockItemAction,
  updateStockItemAction,
  deleteStockItemAction,
} from '@/app/actions';

interface StockManagerProps {
  initialStock: StockItem[];
  userRole: 'admin' | 'staff';
}

export default function StockManager({ initialStock, userRole }: StockManagerProps) {
  const router = useRouter();
  const [stockList, setStockList] = useState<StockItem[]>(initialStock || []);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  useEffect(() => {
    if (initialStock) {
      setStockList(initialStock);
    }
  }, [initialStock]);

  // Form state for adding new item
  const [newName, setNewName] = useState('');
  const [newSku, setNewSku] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newQuantity, setNewQuantity] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state for editing
  const [editPrice, setEditPrice] = useState<number>(0);
  const [editQuantity, setEditQuantity] = useState<number>(0);

  const filteredStock = stockList.filter((item) => {
    const q = searchQuery.toLowerCase();
    return item.name.toLowerCase().includes(q) || (item.sku && item.sku.toLowerCase().includes(q));
  });

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const priceNum = parseFloat(newPrice);
    const qtyNum = parseInt(newQuantity, 10);

    if (!newName.trim()) {
      setFormError('Item name is required.');
      return;
    }
    if (isNaN(priceNum) || priceNum < 0) {
      setFormError('Valid unit price is required.');
      return;
    }
    if (isNaN(qtyNum) || qtyNum < 0) {
      setFormError('Valid stock quantity is required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await createStockItemAction({
        name: newName.trim(),
        sku: newSku.trim() || undefined,
        unit_price: priceNum,
        quantity: qtyNum,
      });

      setIsSubmitting(false);
      if (res && res.error) {
        setFormError(res.error);
      } else if (res && res.item) {
        setStockList((prev) => [res.item!, ...prev.filter((i) => i.id !== res.item!.id)]);
        setNewName('');
        setNewSku('');
        setNewPrice('');
        setNewQuantity('');
        setIsAddModalOpen(false);
        router.refresh();
      } else {
        setFormError('Failed to add item. Please try again.');
      }
    } catch (err: any) {
      setIsSubmitting(false);
      setFormError(err?.message || 'Server error occurred while adding stock.');
    }
  };

  const startEdit = (item: StockItem) => {
    setEditingItemId(item.id);
    setEditPrice(item.unit_price);
    setEditQuantity(item.quantity);
  };

  const cancelEdit = () => {
    setEditingItemId(null);
  };

  const handleSaveEdit = async (id: string) => {
    const res = await updateStockItemAction(id, {
      unit_price: editPrice,
      quantity: editQuantity,
    });

    if (res && res.error) {
      alert(res.error);
    } else if (res && res.item) {
      setStockList((prev) => prev.map((s) => (s.id === id ? res.item! : s)));
      setEditingItemId(null);
      router.refresh();
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove "${name}" from stock?`)) return;

    const res = await deleteStockItemAction(id);
    if (res && res.error) {
      alert(res.error);
    } else {
      setStockList((prev) => prev.filter((s) => s.id !== id));
      router.refresh();
    }
  };

  const handleQuickRestock = async (id: string, currentQty: number, addQty: number) => {
    const newQty = currentQty + addQty;
    const res = await updateStockItemAction(id, { quantity: newQty });
    if (res && res.item) {
      setStockList((prev) => prev.map((s) => (s.id === id ? res.item! : s)));
      router.refresh();
    }
  };

  return (
    <div className="space-y-6">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Search Bar */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search stock by name or SKU code..."
            className="w-full pl-9 pr-4 py-2 bg-canvas border border-hairline rounded-md text-sm text-ink placeholder-muted-soft focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Add Item Button */}
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center justify-center space-x-2 px-4 py-2 bg-primary hover:bg-primary-active text-white text-sm font-medium rounded-md transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Add Stock Item</span>
        </button>
      </div>

      {/* Add Item Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-surface-dark/40 backdrop-blur-sm p-4">
          <div className="bg-surface-card border border-hairline rounded-lg max-w-lg w-full p-6 shadow-lg animate-in fade-in duration-150">
            <div className="flex items-center justify-between border-b border-hairline pb-4 mb-5">
              <div className="flex items-center space-x-2">
                <Package className="w-5 h-5 text-primary" />
                <h3 className="text-base font-medium text-ink">New Stock Entry</h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-muted hover:text-ink p-1 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="mb-4 p-3 bg-semantic-error/10 border border-semantic-error/20 text-xs text-semantic-error rounded-md">
                {formError}
              </div>
            )}

            <form onSubmit={handleAddItem} className="space-y-4">
              <div>
                <label className="block text-xs uppercase tracking-wider font-medium text-ink mb-1">
                  Item Name *
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Spiral Bound Notebook 200pg"
                  className="w-full px-3 py-2 bg-canvas border border-hairline rounded-md text-sm text-ink focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider font-medium text-ink mb-1">
                  SKU / Barcode Code (Optional)
                </label>
                <input
                  type="text"
                  value={newSku}
                  onChange={(e) => setNewSku(e.target.value)}
                  placeholder="e.g. NB-SP-200"
                  className="w-full px-3 py-2 bg-canvas border border-hairline rounded-md text-sm text-ink focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-wider font-medium text-ink mb-1">
                    Unit Price (₹) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3 py-2 bg-canvas border border-hairline rounded-md text-sm text-ink focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider font-medium text-ink mb-1">
                    Initial Quantity *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={newQuantity}
                    onChange={(e) => setNewQuantity(e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2 bg-canvas border border-hairline rounded-md text-sm text-ink focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-hairline flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border border-hairline text-ink text-xs font-medium rounded-md hover:bg-surface-soft transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-primary hover:bg-primary-active text-white text-xs font-medium rounded-md transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Add to Stock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stock Table */}
      <div className="bg-surface-card border border-hairline rounded-lg overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-hairline bg-surface-soft text-[11px] uppercase tracking-wider text-muted font-semibold">
                <th className="py-3 px-4">Item Details</th>
                <th className="py-3 px-4">SKU</th>
                <th className="py-3 px-4 text-right">Unit Price</th>
                <th className="py-3 px-4 text-right">In Stock</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-center">Quick Restock</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {filteredStock.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-xs text-muted">
                    No matching stock items found. Click &quot;Add Stock Item&quot; to register inventory.
                  </td>
                </tr>
              ) : (
                filteredStock.map((item) => {
                  const isEditing = editingItemId === item.id;
                  const isLow = item.quantity > 0 && item.quantity <= 20;
                  const isOut = item.quantity === 0;

                  return (
                    <tr key={item.id} className="hover:bg-canvas/60 transition-colors">
                      <td className="py-3.5 px-4 font-medium text-ink">
                        <div>{item.name}</div>
                        <span className="text-[11px] text-muted font-mono">
                          ID: {item.id.slice(0, 8)}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-xs text-muted">
                        {item.sku || '—'}
                      </td>

                      {/* Unit Price */}
                      <td className="py-3.5 px-4 text-right">
                        {isEditing ? (
                          <input
                            type="number"
                            step="0.01"
                            value={editPrice}
                            onChange={(e) => setEditPrice(parseFloat(e.target.value) || 0)}
                            className="w-24 text-right px-2 py-1 bg-canvas border border-primary rounded text-xs text-ink"
                          />
                        ) : (
                          <span className="font-medium text-ink">
                            ₹{item.unit_price.toFixed(2)}
                          </span>
                        )}
                      </td>

                      {/* Quantity */}
                      <td className="py-3.5 px-4 text-right">
                        {isEditing ? (
                          <input
                            type="number"
                            value={editQuantity}
                            onChange={(e) => setEditQuantity(parseInt(e.target.value, 10) || 0)}
                            className="w-20 text-right px-2 py-1 bg-canvas border border-primary rounded text-xs text-ink"
                          />
                        ) : (
                          <span className="font-semibold text-ink">{item.quantity}</span>
                        )}
                      </td>

                      {/* Stock Status */}
                      <td className="py-3.5 px-4">
                        {isOut ? (
                          <span className="inline-flex items-center space-x-1 text-[10px] font-semibold uppercase px-2 py-0.5 rounded-pill bg-semantic-error/10 text-semantic-error border border-semantic-error/20">
                            <AlertTriangle className="w-2.5 h-2.5" />
                            <span>Out of Stock</span>
                          </span>
                        ) : isLow ? (
                          <span className="inline-flex items-center space-x-1 text-[10px] font-semibold uppercase px-2 py-0.5 rounded-pill bg-semantic-warning/15 text-semantic-warning border border-semantic-warning/25">
                            <AlertTriangle className="w-2.5 h-2.5" />
                            <span>Low ({item.quantity})</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 text-[10px] font-semibold uppercase px-2 py-0.5 rounded-pill bg-semantic-success/10 text-semantic-success border border-semantic-success/20">
                            <Check className="w-2.5 h-2.5" />
                            <span>Available</span>
                          </span>
                        )}
                      </td>

                      {/* Quick Restock Buttons */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex items-center space-x-1">
                          <button
                            type="button"
                            onClick={() => handleQuickRestock(item.id, item.quantity, 10)}
                            className="text-[11px] font-mono px-2 py-0.5 bg-canvas hover:bg-surface-soft border border-hairline rounded text-ink transition-colors"
                            title="Add 10 units"
                          >
                            +10
                          </button>
                          <button
                            type="button"
                            onClick={() => handleQuickRestock(item.id, item.quantity, 50)}
                            className="text-[11px] font-mono px-2 py-0.5 bg-canvas hover:bg-surface-soft border border-hairline rounded text-ink transition-colors"
                            title="Add 50 units"
                          >
                            +50
                          </button>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        {isEditing ? (
                          <div className="flex items-center justify-end space-x-1">
                            <button
                              onClick={() => handleSaveEdit(item.id)}
                              className="p-1 rounded bg-semantic-success/20 text-semantic-success hover:bg-semantic-success/30"
                              title="Save updates"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="p-1 rounded bg-surface-soft text-muted hover:text-ink"
                              title="Cancel"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end space-x-1.5">
                            <button
                              onClick={() => startEdit(item)}
                              className="p-1 text-muted hover:text-primary transition-colors"
                              title="Edit price/quantity"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            {userRole === 'admin' && (
                              <button
                                onClick={() => handleDelete(item.id, item.name)}
                                className="p-1 text-muted hover:text-semantic-error transition-colors"
                                title="Delete stock item"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
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
