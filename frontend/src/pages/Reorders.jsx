import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import {
  RotateCw,
  Sparkles,
  CheckCircle2,
  Clock,
  Send,
  AlertTriangle,
  PackageCheck,
  Building,
  Mail,
  DollarSign,
  TrendingDown,
  Layers,
  X
} from 'lucide-react';

export default function Reorders() {
  const { user } = useAuth();
  const [forecastItems, setForecastItems] = useState([]);
  const [reordersList, setReordersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [feedback, setFeedback] = useState({ error: '', success: '' });

  // Receive Modal state
  const [receivingReorder, setReceivingReorder] = useState(null);
  const [receiveQty, setReceiveQty] = useState(1);
  const [batchNo, setBatchNo] = useState('');
  const [expiryDate, setExpiryDate] = useState('');

  const loadData = async () => {
    try {
      const [fcData, roData] = await Promise.all([
        api.getForecast(),
        api.getReorders()
      ]);
      setForecastItems(fcData || []);
      setReordersList(roData || []);
    } catch (err) {
      console.error('Failed to load forecast data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRunReorderEngine = async () => {
    setGenerating(true);
    setFeedback({ error: '', success: '' });
    try {
      const res = await api.generateReorderDrafts();
      setFeedback({ error: '', success: res.message || 'Forecast calculated and reorder drafts updated!' });
      loadData();
    } catch (err) {
      setFeedback({ error: err.message || 'Failed to run forecast engine', success: '' });
    } finally {
      setGenerating(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      await api.approveReorder(id);
      setFeedback({ error: '', success: 'Reorder approved by Admin!' });
      loadData();
    } catch (err) {
      setFeedback({ error: err.message, success: '' });
    }
  };

  const handleMarkOrdered = async (id) => {
    try {
      await api.markReorderOrdered(id);
      setFeedback({ error: '', success: 'Reorder marked as ORDERED with supplier.' });
      loadData();
    } catch (err) {
      setFeedback({ error: err.message, success: '' });
    }
  };

  const openReceiveModal = (reorder) => {
    setReceivingReorder(reorder);
    setReceiveQty(reorder.suggestedQuantity);
    setBatchNo(`BATCH-RECV-${Date.now().toString().slice(-4)}`);
    setExpiryDate('');
  };

  const handleConfirmReceive = async (e) => {
    e.preventDefault();
    if (!receivingReorder) return;
    try {
      await api.receiveReorder(receivingReorder.id, {
        receivedQuantity: receiveQty,
        batchNumber: batchNo,
        expiryDate
      });
      setReceivingReorder(null);
      setFeedback({
        error: '',
        success: `Stock received! Added ${receiveQty} units of ${receivingReorder.item.name} to active inventory.`
      });
      loadData();
    } catch (err) {
      setFeedback({ error: err.message, success: '' });
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white flex items-center gap-2">
            <RotateCw className="w-6 h-6 text-emerald-400" />
            Smart Auto-Reorder Engine
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Usage-based mathematical forecasting ($ROP = d \times L + SS$) and draft purchase orders
          </p>
        </div>

        <button
          disabled={generating}
          onClick={handleRunReorderEngine}
          className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-black font-extrabold text-xs transition shadow-lg shadow-emerald-500/20 disabled:opacity-50"
        >
          <Sparkles className="w-4 h-4 text-black" />
          <span>{generating ? 'Calculating Forecast...' : 'Run Forecast & Draft POs'}</span>
        </button>
      </div>

      {/* Notifications */}
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

      {/* Section 1: Active Purchase Orders & Drafts */}
      <div className="bg-[#111815] border border-slate-800/80 rounded-xl p-5 shadow-lg">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <PackageCheck className="w-4 h-4 text-emerald-400" />
              Reorder Purchase Orders &amp; Supplier Workflows
            </h3>
            <p className="text-[11px] text-slate-400">Review, approve and receive forecasted replenishment orders</p>
          </div>
          <span className="text-xs text-slate-400 font-mono">{reordersList.length} orders</span>
        </div>

        {reordersList.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-500">
            No active purchase orders. Click "Run Forecast & Draft POs" above to generate suggestions based on consumption rates.
          </div>
        ) : (
          <div className="divide-y divide-slate-800/60 mt-3">
            {reordersList.map((ro) => {
              const statusColors = {
                DRAFT: 'bg-amber-950/70 text-amber-300 border-amber-800/60',
                APPROVED: 'bg-blue-950/70 text-blue-300 border-blue-800/60',
                ORDERED: 'bg-purple-950/70 text-purple-300 border-purple-800/60',
                RECEIVED: 'bg-emerald-950/70 text-emerald-300 border-emerald-800/60',
                REJECTED: 'bg-rose-950/70 text-rose-300 border-rose-800/60'
              };

              return (
                <div key={ro.id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border ${statusColors[ro.status] || 'bg-slate-800 text-slate-300'}`}>
                        {ro.status}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">PO #{ro.id.slice(0, 8)}</span>
                      <span className="text-[10px] text-slate-500 bg-slate-900 px-1.5 py-0.5 rounded">
                        {ro.item.department}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-white mt-1">
                      {ro.suggestedQuantity} {ro.item.unit} &times; {ro.item.name}
                    </h4>

                    <div className="flex items-center gap-4 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <Building className="w-3.5 h-3.5 text-slate-500" />
                        {ro.item.supplierName}
                      </span>
                      <span className="flex items-center gap-1 font-mono text-emerald-400 font-bold">
                        <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
                        Est. ${ro.estimatedCost} (${ro.item.unitCost}/{ro.item.unit})
                      </span>
                    </div>

                    {ro.notes && (
                      <p className="text-[11px] text-slate-400 italic mt-0.5">Note: {ro.notes}</p>
                    )}
                  </div>

                  {/* Action Buttons depending on status & role */}
                  <div className="flex items-center gap-2 self-start md:self-center">
                    {ro.status === 'DRAFT' && user?.role === 'admin' && (
                      <button
                        onClick={() => handleApprove(ro.id)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold transition shadow-sm"
                      >
                        Approve Reorder
                      </button>
                    )}

                    {ro.status === 'APPROVED' && user?.role !== 'viewer' && (
                      <button
                        onClick={() => handleMarkOrdered(ro.id)}
                        className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition shadow-sm"
                      >
                        Mark PO Dispatched
                      </button>
                    )}

                    {ro.status === 'ORDERED' && user?.role !== 'viewer' && (
                      <button
                        onClick={() => openReceiveModal(ro)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-black text-xs font-bold transition shadow-sm"
                      >
                        Receive Shipment
                      </button>
                    )}

                    {ro.status === 'RECEIVED' && (
                      <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" /> Stock Fulfilled
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Section 2: Predictive Forecasting Matrix */}
      <div className="bg-[#111815] border border-slate-800/80 rounded-xl p-5 shadow-lg overflow-x-auto">
        <div className="pb-3 border-b border-slate-800">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            Usage-Based Forecast &amp; Reorder Points ($ROP$)
          </h3>
          <p className="text-[11px] text-slate-400">
            Calculated via daily burn rate, safety factor ($Z=1.65$), lead time, and exponential smoothing
          </p>
        </div>

        <table className="w-full text-left text-xs text-slate-300 mt-3 min-w-[700px]">
          <thead className="text-[11px] text-slate-400 uppercase bg-slate-900/60 border-b border-slate-800 font-mono">
            <tr>
              <th className="py-2.5 px-3">Item / Department</th>
              <th className="py-2.5 px-3">Current Stock</th>
              <th className="py-2.5 px-3">Daily Burn ($d$)</th>
              <th className="py-2.5 px-3">Lead Time</th>
              <th className="py-2.5 px-3">Safety Stock ($SS$)</th>
              <th className="py-2.5 px-3">Reorder Point ($ROP$)</th>
              <th className="py-2.5 px-3">Days to Out</th>
              <th className="py-2.5 px-3">Suggested Order</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {forecastItems.map((item) => {
              const needsOrder = item.needsReorder;

              return (
                <tr key={item.id} className={needsOrder ? 'bg-amber-950/20' : 'hover:bg-slate-900/40'}>
                  <td className="py-3 px-3">
                    <p className="font-bold text-white">{item.name}</p>
                    <p className="text-[10px] text-slate-400">{item.department}</p>
                  </td>
                  <td className="py-3 px-3 font-mono font-bold">
                    <span className={item.currentStock <= item.reorderPoint ? 'text-amber-400' : 'text-emerald-400'}>
                      {item.currentStock} {item.unit}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-300">
                    {item.dailyUsageRate} /day
                  </td>
                  <td className="py-3 px-3 text-slate-300">
                    {item.leadTimeDays} days
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-300">
                    {item.safetyStock} {item.unit}
                  </td>
                  <td className="py-3 px-3 font-mono font-bold text-slate-200">
                    {item.reorderPoint} {item.unit}
                  </td>
                  <td className="py-3 px-3 font-mono">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        item.daysUntilStockout <= item.leadTimeDays
                          ? 'bg-rose-950 text-rose-300 border border-rose-800'
                          : item.daysUntilStockout <= 14
                          ? 'bg-amber-950 text-amber-300 border border-amber-800'
                          : 'text-slate-400'
                      }`}
                    >
                      {item.daysUntilStockout}d
                    </span>
                  </td>
                  <td className="py-3 px-3 font-mono">
                    {item.suggestedQuantity > 0 ? (
                      <span className="font-bold text-emerald-400">
                        +{item.suggestedQuantity} {item.unit}
                      </span>
                    ) : (
                      <span className="text-slate-500 font-semibold">Adequate</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Receive Shipment Modal */}
      {receivingReorder && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111815] border border-emerald-900/60 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
            <button
              onClick={() => setReceivingReorder(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white bg-slate-800/80 rounded-lg p-1.5 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-white mb-1 flex items-center gap-2">
              <PackageCheck className="w-5 h-5 text-emerald-400" />
              Receive Shipment from Supplier
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Logging incoming stock for <strong className="text-white">{receivingReorder.item.name}</strong>
            </p>

            <form onSubmit={handleConfirmReceive} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-medium">Quantity Received *</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={receiveQty}
                  onChange={(e) => setReceiveQty(parseInt(e.target.value) || 1)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">Batch / Lot Number</label>
                <input
                  type="text"
                  value={batchNo}
                  onChange={(e) => setBatchNo(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">Expiry Date (FEFO Tracking)</label>
                <input
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setReceivingReorder(null)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-bold"
                >
                  Confirm &amp; Add Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}