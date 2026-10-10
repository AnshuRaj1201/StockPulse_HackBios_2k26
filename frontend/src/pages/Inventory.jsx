import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import PrintableQrModal from '../components/PrintableQrModal';
import {
  Boxes,
  Search,
  Plus,
  Minus,
  QrCode,
  AlertTriangle,
  CheckCircle,
  Filter,
  PlusCircle,
  Tag,
  Trash2,
  ExternalLink,
  ChevronDown,
  Layers,
  X,
  Shield,
  ShieldAlert,
  RotateCw
} from 'lucide-react';

const defaultFormData = {
  name: '',
  sku: '',
  barcode: '',
  category: 'Lab Supplies',
  department: 'Chemistry Lab',
  unit: 'boxes',
  initialQuantity: 10,
  minThreshold: 10,
  safetyStock: 4,
  leadTimeDays: 4,
  unitCost: 15.0,
  supplierName: 'Campus Vendor',
  supplierEmail: 'orders@vendor.example.com',
  supplierPhone: '+91 98765 43210',
  expiryDate: ''
};

export default function Inventory() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [lowStockOnly, setLowStockOnly] = useState(false);

  // Modals state
  const [selectedItemForQr, setSelectedItemForQr] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [adjustingItemId, setAdjustingItemId] = useState(null);
  const [feedback, setFeedback] = useState({ error: '', success: '' });

  // Add Item form state
  const [formData, setFormData] = useState(defaultFormData);

  const fetchItems = async () => {
    try {
      const data = await api.getItems({
        department: selectedDept === 'ALL' ? '' : selectedDept,
        search: search.trim(),
        lowStockOnly: lowStockOnly ? 'true' : ''
      });
      setItems(data || []);
    } catch (err) {
      console.error('Fetch items error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [selectedDept, lowStockOnly]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchItems();
  };

  const handleClearSearch = () => {
    setSearch('');
    // Calling fetchItems with empty search
    api.getItems({
      department: selectedDept === 'ALL' ? '' : selectedDept,
      search: '',
      lowStockOnly: lowStockOnly ? 'true' : ''
    }).then((data) => setItems(data || []));
  };

  const handleQuickAdjust = async (itemId, delta) => {
    setAdjustingItemId(itemId);
    setActionLoading(true);
    setFeedback({ error: '', success: '' });
    try {
      const res = await api.quickAdjustStock(itemId, delta, delta > 0 ? 'Quick Restock' : 'Quick Usage Issue');
      setItems((prev) =>
        prev.map((i) =>
          i.id === itemId
            ? { ...i, currentStock: res.item.currentStock, isLowStock: res.item.currentStock <= i.minThreshold }
            : i
        )
      );
      setFeedback({
        error: '',
        success: `Stock ${delta > 0 ? '+1 Restocked' : '-1 Issued'} successfully! Live stock updated.`
      });
    } catch (err) {
      setFeedback({ error: err.message, success: '' });
    } finally {
      setActionLoading(false);
      setAdjustingItemId(null);
    }
  };

  const handleCreateItem = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setFeedback({ error: '', success: '' });
    try {
      const created = await api.createItem(formData);
      setShowAddModal(false);
      setFormData(defaultFormData);
      setSelectedDept('ALL');
      setSearch('');
      setLowStockOnly(false);
      setFeedback({
        error: '',
        success: `Successfully added and saved '${created.name}' (${created.sku}) with ${created.currentStock} ${created.unit}! Item safely persisted in database.`
      });
      await fetchItems();
    } catch (err) {
      setFeedback({ error: err.message || 'Failed to create item', success: '' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteItem = async (item) => {
    // Inventory Protection Safeguard
    if (item.currentStock > 0) {
      setFeedback({
        error: `Protected Item: Cannot delete '${item.name}' while ${item.currentStock} ${item.unit} are held in inventory. To prevent accidental data loss, all items with active stock are locked. Deplete stock to 0 before deleting.`,
        success: ''
      });
      return;
    }

    if (!window.confirm(`Are you sure you want to delete zero-stock item '${item.name}'? This cannot be undone.`)) return;

    try {
      await api.deleteItem(item.id);
      setItems((prev) => prev.filter((i) => i.id !== item.id));
      setFeedback({ error: '', success: `Deleted retired item '${item.name}' successfully.` });
    } catch (err) {
      setFeedback({ error: err.message || 'Failed to delete item', success: '' });
    }
  };

  const departments = [
    'ALL',
    'Chemistry Lab',
    'Central Mess',
    'Stationery & Store',
    'Campus Health Center'
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Header and Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded flex items-center gap-1">
              <Boxes className="w-3 h-3" /> Persistent Inventory Catalog
            </span>
            <span className="text-xs text-slate-400">Database-backed &bull; Multi-department</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white flex items-center gap-2">
            <Boxes className="w-6 h-6 text-emerald-400" />
            Stock &amp; Inventory Management
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time stock levels, automated low-stock warnings, 1-tap fast restock/issue, and QR label printing.
          </p>
        </div>

        {user?.role !== 'viewer' && (
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs transition shadow-lg shadow-emerald-500/20"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add New Item</span>
          </button>
        )}
      </div>

      {/* Notifications / Feedback */}
      {feedback.error && (
        <div className="p-3 bg-rose-950/60 border border-rose-800 text-rose-300 text-xs rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>{feedback.error}</span>
          </div>
          <button onClick={() => setFeedback({ ...feedback, error: '' })}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      {feedback.success && (
        <div className="p-3 bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>{feedback.success}</span>
          </div>
          <button onClick={() => setFeedback({ ...feedback, success: '' })}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Department Tabs & Search Filter */}
      <div className="bg-[#111815] border border-slate-800/80 rounded-xl p-3 sm:p-4 space-y-3">
        {/* Department Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {departments.map((dept) => (
            <button
              key={dept}
              onClick={() => setSelectedDept(dept)}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium transition ${
                selectedDept === dept
                  ? 'bg-emerald-500 text-black font-bold shadow-sm'
                  : 'bg-slate-900/80 text-slate-300 hover:text-white border border-slate-800'
              }`}
            >
              {dept === 'ALL' ? 'All Departments' : dept}
            </button>
          ))}
        </div>

        {/* Search bar & Toggle */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
          <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, SKU, barcode..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-8 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
            {search && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute right-2.5 top-2 text-slate-400 hover:text-white p-0.5"
                title="Clear Search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </form>

          <label className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer self-start sm:self-center">
            <input
              type="checkbox"
              checked={lowStockOnly}
              onChange={(e) => setLowStockOnly(e.target.checked)}
              className="rounded bg-slate-900 border-slate-700 text-emerald-500 focus:ring-0 w-3.5 h-3.5 cursor-pointer"
            />
            <span>Show Low Stock Only (&le; Min Threshold)</span>
          </label>
        </div>
      </div>

      {/* Inventory Items List / Grid */}
      {loading ? (
        <div className="text-center py-12 text-slate-400 text-xs">Loading items from database...</div>
      ) : items.length === 0 ? (
        <div className="bg-[#111815] border border-slate-800/80 rounded-xl p-8 text-center text-slate-400 text-xs">
          No items found matching the selected filters.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => {
            const isOut = item.currentStock === 0;
            const isLow = item.isLowStock;
            const isAdjustingThis = adjustingItemId === item.id;

            return (
              <div
                key={item.id}
                className={`bg-[#111815] rounded-xl p-4 border transition flex flex-col justify-between shadow-md relative ${
                  isOut
                    ? 'border-rose-900/60 bg-gradient-to-b from-[#140c0e] to-[#111815]'
                    : isLow
                    ? 'border-amber-900/50 bg-gradient-to-b from-[#17140e] to-[#111815]'
                    : 'border-slate-800/80 hover:border-emerald-500/40'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-slate-800/80 text-slate-300 border border-slate-700/60">
                      {item.department}
                    </span>
                    <button
                      onClick={() => setSelectedItemForQr(item)}
                      className="text-slate-400 hover:text-emerald-400 p-1 rounded hover:bg-slate-800 transition"
                      title="Print QR Label & Barcode"
                    >
                      <QrCode className="w-4 h-4" />
                    </button>
                  </div>

                  <h3 className="font-bold text-white text-sm sm:text-base mt-2 leading-snug">
                    {item.name}
                  </h3>

                  <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400 mt-1">
                    <span>{item.sku}</span>
                    <span>&bull;</span>
                    <span>{item.barcode}</span>
                  </div>

                  {/* Stock Level Display */}
                  <div className="mt-4 p-3 bg-slate-900/80 rounded-lg flex items-center justify-between border border-slate-800/50">
                    <div>
                      <span className="text-[10px] uppercase text-slate-400 font-semibold block">Stock on hand</span>
                      <span
                        className={`text-xl font-black ${
                          isOut ? 'text-rose-400' : isLow ? 'text-amber-400' : 'text-emerald-400'
                        }`}
                      >
                        {item.currentStock}{' '}
                        <span className="text-xs font-normal text-slate-400">{item.unit}</span>
                      </span>
                    </div>

                    <div className="text-right text-[11px]">
                      <span className="text-slate-400 block">Min Threshold</span>
                      <span className="font-semibold text-slate-200">{item.minThreshold} {item.unit}</span>
                    </div>
                  </div>

                  {/* Status Pills */}
                  <div className="mt-2.5 flex items-center gap-2 flex-wrap text-[10px]">
                    {isOut ? (
                      <span className="bg-rose-950/80 text-rose-300 border border-rose-800/60 px-2 py-0.5 rounded-full font-bold">
                        OUT OF STOCK
                      </span>
                    ) : isLow ? (
                      <span className="bg-amber-950/80 text-amber-300 border border-amber-800/60 px-2 py-0.5 rounded-full font-bold">
                        LOW STOCK WARNING
                      </span>
                    ) : (
                      <span className="bg-emerald-950/80 text-emerald-300 border border-emerald-800/60 px-2 py-0.5 rounded-full font-semibold">
                        HEALTHY STOCK
                      </span>
                    )}

                    <span className="text-slate-400">Lead time: {item.leadTimeDays}d</span>
                  </div>
                </div>

                {/* Quick 1-Tap Log In/Out Buttons */}
                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                  <div className="flex items-center space-x-1.5 w-full">
                    <button
                      disabled={isAdjustingThis || item.currentStock <= 0 || user?.role === 'viewer'}
                      onClick={() => handleQuickAdjust(item.id, -1)}
                      className="flex-1 flex items-center justify-center space-x-1 py-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900/80 border border-rose-800/50 text-rose-200 text-xs font-bold transition disabled:opacity-40"
                      title="Issue / Deduct 1 unit"
                    >
                      <Minus className="w-3.5 h-3.5" />
                      <span>-1 Issue</span>
                    </button>
                    <button
                      disabled={isAdjustingThis || user?.role === 'viewer'}
                      onClick={() => handleQuickAdjust(item.id, 1)}
                      className="flex-1 flex items-center justify-center space-x-1 py-1.5 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-800/50 text-emerald-300 text-xs font-bold transition disabled:opacity-40"
                      title="Restock +1 unit"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+1 Restock</span>
                    </button>
                  </div>

                  {user?.role === 'admin' && (
                    <button
                      onClick={() => handleDeleteItem(item)}
                      className={`p-1.5 rounded transition ${
                        item.currentStock > 0
                          ? 'text-slate-600 hover:text-slate-400 cursor-not-allowed opacity-60'
                          : 'text-slate-500 hover:text-rose-400 hover:bg-slate-800'
                      }`}
                      title={
                        item.currentStock > 0
                          ? `Protected: Holds ${item.currentStock} units in inventory. Deplete stock before removing.`
                          : 'Delete zero-stock item'
                      }
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Printable QR Modal */}
      <PrintableQrModal
        item={selectedItemForQr}
        isOpen={!!selectedItemForQr}
        onClose={() => setSelectedItemForQr(null)}
      />

      {/* Add Item Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#111815] border border-emerald-900/60 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white bg-slate-800/80 rounded-lg p-1.5 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-emerald-400" />
              Add Inventory SKU
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Register a new campus item. Stock will be securely persisted in the database.
            </p>

            <form onSubmit={handleCreateItem} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-medium">Item Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sterile Latex Gloves (M)"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-medium">Department *</label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Chemistry Lab">Chemistry Lab</option>
                    <option value="Central Mess">Central Mess</option>
                    <option value="Stationery & Store">Stationery & Store</option>
                    <option value="Campus Health Center">Campus Health Center</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-medium">Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Lab Supplies">Lab Supplies</option>
                    <option value="Mess & Canteen">Mess & Canteen</option>
                    <option value="Stationery">Stationery</option>
                    <option value="Medical">Medical</option>
                    <option value="General">General</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-medium">Initial Qty</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.initialQuantity}
                    onChange={(e) => setFormData({ ...formData, initialQuantity: parseInt(e.target.value) || 0 })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1 font-medium">Unit</label>
                  <input
                    type="text"
                    placeholder="boxes, kg, etc."
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1 font-medium">Unit Cost ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.unitCost}
                    onChange={(e) => setFormData({ ...formData, unitCost: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-medium">Reorder Point</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.minThreshold}
                    onChange={(e) => setFormData({ ...formData, minThreshold: parseInt(e.target.value) || 1 })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1 font-medium">Safety Stock</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.safetyStock}
                    onChange={(e) => setFormData({ ...formData, safetyStock: parseInt(e.target.value) || 0 })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1 font-medium">Lead Time (Days)</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.leadTimeDays}
                    onChange={(e) => setFormData({ ...formData, leadTimeDays: parseInt(e.target.value) || 1 })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-medium">Supplier Name</label>
                  <input
                    type="text"
                    value={formData.supplierName}
                    onChange={(e) => setFormData({ ...formData, supplierName: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1 font-medium">Supplier Email</label>
                  <input
                    type="email"
                    value={formData.supplierEmail}
                    onChange={(e) => setFormData({ ...formData, supplierEmail: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">Batch Expiry Date (Optional)</label>
                <input
                  type="date"
                  value={formData.expiryDate}
                  onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-bold disabled:opacity-50"
                >
                  {actionLoading ? 'Saving...' : 'Create & Persist Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}