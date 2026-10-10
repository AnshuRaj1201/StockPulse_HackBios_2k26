import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import {
  CalendarDays,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Send,
  PlusCircle,
  ShieldCheck,
  ShieldAlert,
  User,
  HeartPulse,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Bell,
  Trash2,
  X,
  Edit3,
  Check,
  PackageCheck,
  Calendar
} from 'lucide-react';

export default function Subscriptions() {
  const { user } = useAuth();
  const [subscriptions, setSubscriptions] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [executingAll, setExecutingAll] = useState(false);
  const [executingSubId, setExecutingSubId] = useState(null);
  const [targetRunDay, setTargetRunDay] = useState('ALL');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSub, setEditingSub] = useState(null); // Subscription being edited for date change
  const [newChosenDay, setNewChosenDay] = useState(5);
  const [feedback, setFeedback] = useState({ error: '', success: '' });

  // Add form state
  const [formData, setFormData] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    itemId: '',
    quantity: 2,
    dayOfMonth: 5,
    destination: 'Dispensary Health Ward',
    notes: 'Monthly essential replenishment'
  });

  const loadData = async () => {
    try {
      const [subsData, itemsData] = await Promise.all([
        api.getSubscriptions(),
        api.getItems()
      ]);
      setSubscriptions(subsData || []);
      setItems(itemsData || []);
      if (itemsData && itemsData.length > 0 && !formData.itemId) {
        setFormData((prev) => ({ ...prev, itemId: itemsData[0].id }));
      }
    } catch (err) {
      console.error('Failed to load subscriptions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleTogglePermission = async (id) => {
    try {
      const updated = await api.toggleSubscriptionPermission(id);
      setSubscriptions((prev) =>
        prev.map((s) => (s.id === id ? { ...s, customerPermission: updated.customerPermission } : s))
      );
      setFeedback({
        error: '',
        success: `Customer delivery consent ${updated.customerPermission ? 'ACTIVATED (deliveries authorized)' : 'REVOKED (deliveries paused)'}.`
      });
    } catch (err) {
      setFeedback({ error: err.message, success: '' });
    }
  };

  const handleRunScheduledDeliveries = async (subId = null) => {
    if (subId) {
      setExecutingSubId(subId);
    } else {
      setExecutingAll(true);
    }
    setFeedback({ error: '', success: '' });

    try {
      const dayParam = subId ? null : (targetRunDay === 'ALL' ? null : parseInt(targetRunDay, 10));
      const res = await api.runScheduledDeliveries(subId, dayParam, true);
      const successCount = res.results.filter((r) => r.status === 'SUCCESS').length;
      const targetLabel = subId
        ? 'Customer order'
        : (targetRunDay === 'ALL' ? 'All scheduled customer orders' : `Day ${targetRunDay} scheduled customer orders`);

      setFeedback({
        error: '',
        success: `⚡ ${targetLabel} processed! Fulfilled ${successCount} order(s). Customers notified & inventory stock automatically deducted.`
      });
      loadData();
    } catch (err) {
      setFeedback({ error: err.message || 'Execution failed', success: '' });
    } finally {
      setExecutingAll(false);
      setExecutingSubId(null);
    }
  };

  const handleCreateSubscription = async (e) => {
    e.preventDefault();
    try {
      await api.createSubscription(formData);
      setShowAddModal(false);
      setFormData({
        customerName: '',
        customerEmail: '',
        customerPhone: '',
        itemId: items[0]?.id || '',
        quantity: 2,
        dayOfMonth: 5,
        destination: 'Dispensary Health Ward',
        notes: 'Monthly essential replenishment'
      });
      setFeedback({
        error: '',
        success: `Created recurring delivery schedule on customer's chosen Day ${formData.dayOfMonth} of every month!`
      });
      loadData();
    } catch (err) {
      setFeedback({ error: err.message, success: '' });
    }
  };

  const handleSaveUpdatedDay = async (e) => {
    e.preventDefault();
    if (!editingSub) return;
    try {
      const day = parseInt(newChosenDay, 10);
      if (day < 1 || day > 31) {
        setFeedback({ error: 'Please enter a valid day of the month between 1 and 31', success: '' });
        return;
      }
      await api.updateSubscription(editingSub.id, { dayOfMonth: day });
      setSubscriptions((prev) =>
        prev.map((s) => (s.id === editingSub.id ? { ...s, dayOfMonth: day } : s))
      );
      setFeedback({
        error: '',
        success: `Updated delivery date for ${editingSub.customerName} to customer's chosen Day ${day} of every month!`
      });
      setEditingSub(null);
    } catch (err) {
      setFeedback({ error: err.message || 'Failed to update delivery date', success: '' });
    }
  };

  const handleCancelSub = async (id, name) => {
    if (!window.confirm(`Are you sure you want to cancel the recurring delivery schedule for ${name}?`)) return;
    try {
      await api.cancelSubscription(id);
      setSubscriptions((prev) => prev.filter((s) => s.id !== id));
      setFeedback({ error: '', success: `Recurring schedule for ${name} has been cancelled.` });
    } catch (err) {
      setFeedback({ error: err.message, success: '' });
    }
  };

  // Extract all execution logs across subscriptions for audit table
  const allLogs = subscriptions.flatMap((s) =>
    (s.deliveryLogs || []).map((log) => ({
      ...log,
      customerName: s.customerName,
      itemName: s.item?.name || 'Item'
    }))
  ).sort((a, b) => new Date(b.executedAt) - new Date(a.executedAt));

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider bg-purple-500/10 text-purple-400 border border-purple-500/30 px-2 py-0.5 rounded flex items-center gap-1">
              <CalendarDays className="w-3 h-3" /> Customer-Chosen Delivery Engine
            </span>
            <span className="text-xs text-slate-400">Automated Monthly Recurring Fulfillment</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <CalendarDays className="w-6 h-6 text-purple-400" />
            Scheduled Customer Deliveries &amp; Auto-Deductions
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Each customer independently selects their preferred delivery day of the month (Day 1 - 31). Stock is automatically deducted and notifications dispatched with customer consent.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-2 px-3.5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition shadow-lg shadow-purple-500/25"
          >
            <PlusCircle className="w-4 h-4" />
            <span>New Schedule</span>
          </button>
        </div>
      </div>

      {/* Feedback Alerts */}
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
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>{feedback.success}</span>
          </div>
          <button onClick={() => setFeedback({ ...feedback, success: '' })}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Target Day Simulation Runner Bar */}
      <div className="bg-gradient-to-r from-purple-950/40 via-[#15121b] to-slate-900 border border-purple-800/40 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30 flex-shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-400">
              Simulation &amp; Fulfillment Dispatcher
            </span>
            <h4 className="text-sm font-bold text-white mt-0.5">
              Run Scheduled Logistics by Customer-Chosen Date
            </h4>
            <p className="text-xs text-slate-300 mt-0.5 max-w-xl">
              Select any target day of the month (1–31) to simulate and dispatch standing deliveries scheduled by customers for that date.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-700/80 rounded-xl px-3 py-2">
            <span className="text-[11px] text-slate-400 whitespace-nowrap font-medium">Target Day:</span>
            <select
              value={targetRunDay}
              onChange={(e) => setTargetRunDay(e.target.value)}
              className="bg-transparent text-white font-bold text-xs focus:outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-slate-900">All Days (All Customers)</option>
              {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                <option key={day} value={day} className="bg-slate-900">
                  Day {day} of Month
                </option>
              ))}
            </select>
          </div>

          <button
            disabled={executingAll}
            onClick={() => handleRunScheduledDeliveries(null)}
            className="flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-500 hover:from-purple-500 hover:to-indigo-400 text-white font-extrabold text-xs transition shadow-lg shadow-purple-500/25 disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4 text-white" />
            <span>
              {executingAll
                ? 'Processing Deliveries...'
                : targetRunDay === 'ALL'
                ? '⚡ Execute All Scheduled Deliveries'
                : `⚡ Execute Deliveries for Day ${targetRunDay}`}
            </span>
          </button>
        </div>
      </div>

      {/* Active Subscriptions Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-purple-400" />
            Active Customer Schedules ({subscriptions.length})
          </h3>
          <span className="text-[11px] text-slate-400">
            Each schedule runs recurringly on the customer's specified day
          </span>
        </div>

        {loading ? (
          <div className="text-center py-10 text-xs text-slate-400">Loading customer schedules...</div>
        ) : subscriptions.length === 0 ? (
          <div className="bg-[#111815] border border-slate-800/80 rounded-xl p-8 text-center text-slate-500 text-xs">
            No recurring delivery schedules created yet. Click "New Schedule" above to add one.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {subscriptions.map((s) => {
              const isPermissionOk = s.customerPermission;
              const hasEnoughStock = (s.item?.currentStock || 0) >= s.quantity;
              const isExecutingThis = executingSubId === s.id;

              return (
                <div
                  key={s.id}
                  className="bg-[#111815] rounded-xl p-5 border border-slate-800/80 hover:border-purple-500/40 transition flex flex-col justify-between shadow-lg relative group"
                >
                  <div>
                    {/* Header: Customer and Customer-Chosen Date badge */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        {/* Highlighting Customer's Chosen Date */}
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] uppercase font-black tracking-wider px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 flex items-center gap-1.5">
                            <Calendar className="w-3 h-3 text-purple-400" />
                            Customer Choice &bull; Day {s.dayOfMonth}
                          </span>
                          <button
                            onClick={() => {
                              setEditingSub(s);
                              setNewChosenDay(s.dayOfMonth);
                            }}
                            className="text-[10px] text-purple-400 hover:text-purple-300 underline font-medium flex items-center gap-0.5"
                            title="Customer can change preferred delivery date"
                          >
                            <Edit3 className="w-3 h-3" /> Change Day
                          </button>
                        </div>

                        <h4 className="font-bold text-white text-base mt-2">{s.customerName}</h4>
                        <p className="text-xs text-slate-400 font-mono">
                          {s.customerEmail} &bull; {s.destination}
                        </p>
                      </div>

                      {user?.role === 'admin' && (
                        <button
                          onClick={() => handleCancelSub(s.id, s.customerName)}
                          className="text-slate-500 hover:text-rose-400 p-1.5 rounded hover:bg-slate-800/80 transition"
                          title="Cancel Recurring Schedule"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {/* Product & Quantity details */}
                    <div className="mt-4 p-3 bg-slate-900/80 rounded-lg flex items-center justify-between border border-slate-800/60">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold block">Scheduled Item</span>
                        <span className="font-bold text-white text-sm">{s.item?.name}</span>
                        <span className="text-xs text-slate-400 block">{s.item?.department}</span>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 uppercase font-semibold block">Delivery Qty</span>
                        <span className="text-lg font-black text-purple-400 font-mono">
                          {s.quantity} <span className="text-xs text-slate-400 font-normal">{s.item?.unit}</span>
                        </span>
                      </div>
                    </div>

                    {/* Permission and Stock Status Badges */}
                    <div className="mt-3 flex items-center justify-between gap-2 text-xs">
                      {/* Customer Permission Toggle */}
                      <button
                        onClick={() => handleTogglePermission(s.id)}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-bold border transition ${
                          isPermissionOk
                            ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800 hover:bg-emerald-900/60'
                            : 'bg-rose-950/60 text-rose-300 border-rose-800 hover:bg-rose-900/60'
                        }`}
                        title="Click to toggle customer authorization"
                      >
                        {isPermissionOk ? (
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                        )}
                        <span>{isPermissionOk ? 'Customer Consent Active' : 'Consent Revoked'}</span>
                      </button>

                      {/* Stock availability badge */}
                      <span
                        className={`text-[11px] font-mono font-bold ${
                          hasEnoughStock ? 'text-slate-300' : 'text-rose-400'
                        }`}
                      >
                        In Inventory: {s.item?.currentStock ?? 0} {s.item?.unit}
                      </span>
                    </div>

                    {/* Schedule Recurrence Info */}
                    <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                      <span>
                        Last Run: {s.lastDeliveredDate ? new Date(s.lastDeliveredDate).toLocaleDateString() : 'Pending'}
                      </span>
                      <span className="text-purple-300 font-semibold">
                        Recurrence: Every Month on the {s.dayOfMonth}{s.dayOfMonth === 1 ? 'st' : s.dayOfMonth === 2 ? 'nd' : s.dayOfMonth === 3 ? 'rd' : 'th'}
                      </span>
                    </div>
                  </div>

                  {/* Individual Trigger Button */}
                  <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-end">
                    <button
                      disabled={isExecutingThis || executingAll || !isPermissionOk || !hasEnoughStock}
                      onClick={() => handleRunScheduledDeliveries(s.id)}
                      className="flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition shadow-sm disabled:opacity-40"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{isExecutingThis ? 'Processing...' : 'Execute Delivery Now & Deduct Stock'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Customer Delivery Execution Log Table */}
      {allLogs.length > 0 && (
        <div className="bg-[#111815] border border-slate-800/80 rounded-xl p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <PackageCheck className="w-4 h-4 text-emerald-400" />
              Automated Delivery &amp; Stock Deduction Trail
            </h3>
            <span className="text-[11px] text-slate-500">Real-time inventory deduction logs</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase text-[10px]">
                  <th className="pb-2">Timestamp</th>
                  <th className="pb-2">Customer</th>
                  <th className="pb-2">Item</th>
                  <th className="pb-2">Qty</th>
                  <th className="pb-2">Stock Impact</th>
                  <th className="pb-2">Status</th>
                  <th className="pb-2">Log Note</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {allLogs.slice(0, 10).map((log) => (
                  <tr key={log.id} className="text-slate-300">
                    <td className="py-2.5 font-mono text-[11px] text-slate-400">
                      {new Date(log.executedAt).toLocaleString()}
                    </td>
                    <td className="py-2.5 font-medium text-white">{log.customerName}</td>
                    <td className="py-2.5">{log.itemName}</td>
                    <td className="py-2.5 font-mono font-bold text-purple-400">{log.quantity}</td>
                    <td className="py-2.5 font-mono text-[11px]">
                      {log.stockBefore} &rarr; <span className="text-emerald-400 font-bold">{log.stockAfter}</span>
                    </td>
                    <td className="py-2.5">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          log.status === 'SUCCESS'
                            ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/60'
                            : 'bg-rose-950/80 text-rose-300 border border-rose-800/60'
                        }`}
                      >
                        {log.status}
                      </span>
                    </td>
                    <td className="py-2.5 text-slate-400 text-[11px] max-w-xs truncate">{log.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Change Delivery Date Modal */}
      {editingSub && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111815] border border-purple-800/60 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
            <button
              onClick={() => setEditingSub(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white bg-slate-800/80 rounded-lg p-1.5 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-white mb-1 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-purple-400" />
              Customer Choice: Change Delivery Date
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Update the recurring monthly delivery date for <strong className="text-white">{editingSub.customerName}</strong>
            </p>

            <form onSubmit={handleSaveUpdatedDay} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 mb-1.5 font-medium">
                  Select Preferred Day of Every Month (1 – 31) *
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="31"
                    required
                    value={newChosenDay}
                    onChange={(e) => setNewChosenDay(e.target.value)}
                    className="w-24 bg-slate-900 border border-purple-500 rounded-lg p-2.5 text-white font-mono font-bold text-center focus:outline-none text-base"
                  />
                  <span className="text-xs text-slate-400">
                    of every month
                  </span>
                </div>
              </div>

              {/* Quick Select Chips */}
              <div>
                <span className="block text-[11px] text-slate-400 mb-2 font-medium">Quick Selection:</span>
                <div className="flex flex-wrap gap-1.5">
                  {[1, 5, 10, 15, 20, 25, 28, 30].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setNewChosenDay(d)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold border transition ${
                        Number(newChosenDay) === d
                          ? 'bg-purple-600 text-white border-purple-500 shadow-md'
                          : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-500'
                      }`}
                    >
                      Day {d}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setEditingSub(null)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold"
                >
                  Save Customer Date
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Subscription Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111815] border border-purple-900/60 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white bg-slate-800/80 rounded-lg p-1.5 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-white mb-1 flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-purple-400" />
              Schedule Monthly Recurring Delivery
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Customer chooses their own delivery date (1–31) with automatic stock deduction
            </p>

            <form onSubmit={handleCreateSubscription} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-medium">Customer / Recipient Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Sarah Thomas / Central Mess"
                  value={formData.customerName}
                  onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-medium">Email *</label>
                  <input
                    type="email"
                    required
                    placeholder="name@campus.edu"
                    value={formData.customerEmail}
                    onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1 font-medium">Phone</label>
                  <input
                    type="text"
                    value={formData.customerPhone}
                    onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-purple-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">Select Product *</label>
                <select
                  value={formData.itemId}
                  onChange={(e) => setFormData({ ...formData, itemId: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-purple-500"
                >
                  {items.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.name} (Stock: {i.currentStock} {i.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-medium">Delivery Qty *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-purple-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1 font-medium">Customer's Chosen Day (1-31) *</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    required
                    value={formData.dayOfMonth}
                    onChange={(e) => setFormData({ ...formData, dayOfMonth: parseInt(e.target.value) || 1 })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-purple-500 font-mono"
                  />
                </div>
              </div>

              {/* Quick pills for day selection */}
              <div>
                <span className="block text-[11px] text-slate-400 mb-1.5 font-medium">Quick Pick Customer's Day:</span>
                <div className="flex flex-wrap gap-1">
                  {[1, 5, 10, 15, 20, 25, 28, 30].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setFormData({ ...formData, dayOfMonth: d })}
                      className={`px-2 py-0.5 rounded text-[11px] font-mono border transition ${
                        formData.dayOfMonth === d
                          ? 'bg-purple-600 text-white border-purple-500 font-bold'
                          : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-500'
                      }`}
                    >
                      Day {d}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">Delivery Destination *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ward A / Hostel Room 102"
                  value={formData.destination}
                  onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-purple-500"
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
                  className="px-5 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold"
                >
                  Create Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}