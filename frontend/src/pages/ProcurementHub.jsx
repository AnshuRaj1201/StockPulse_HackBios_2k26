import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import {
  Building2,
  Sparkles,
  Truck,
  TrendingDown,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowRight,
  Send,
  PackageCheck,
  ExternalLink,
  DollarSign,
  Star,
  RefreshCw,
  X
} from 'lucide-react';

export default function ProcurementHub() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [selectedItemId, setSelectedItemId] = useState('');
  const [dealers, setDealers] = useState([]);
  const [dispatches, setDispatches] = useState([]);
  const [recommendation, setRecommendation] = useState(null);
  const [activeTab, setActiveTab] = useState('compare'); // 'compare', 'dispatches', 'dealers'
  const [reqQuantity, setReqQuantity] = useState(20);
  const [loading, setLoading] = useState(true);
  const [evalLoading, setEvalLoading] = useState(false);
  const [dispatchLoading, setDispatchLoading] = useState(false);
  const [feedback, setFeedback] = useState({ error: '', success: '' });

  const loadBaseData = async () => {
    try {
      const [itemsData, dealersData, dispatchesData] = await Promise.all([
        api.getItems(),
        api.getDealers(),
        api.getDealerDispatches()
      ]);
      setItems(itemsData || []);
      setDealers(dealersData || []);
      setDispatches(dispatchesData || []);

      if (itemsData && itemsData.length > 0 && !selectedItemId) {
        setSelectedItemId(itemsData[0].id);
      }
    } catch (err) {
      console.error('Failed to load procurement data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBaseData();
  }, []);

  const fetchRecommendation = async (itemId, qty) => {
    if (!itemId) return;
    setEvalLoading(true);
    setFeedback({ error: '', success: '' });
    try {
      const res = await api.getAiRecommendation(itemId, qty);
      setRecommendation(res);
    } catch (err) {
      console.error('Failed to fetch recommendation:', err);
    } finally {
      setEvalLoading(false);
    }
  };

  useEffect(() => {
    if (selectedItemId) {
      fetchRecommendation(selectedItemId, reqQuantity);
    }
  }, [selectedItemId, reqQuantity]);

  const handleTriggerAutoDispatch = async (itemId) => {
    setDispatchLoading(true);
    setFeedback({ error: '', success: '' });
    try {
      const res = await api.autoDispatchDealers(itemId || null);
      setFeedback({
        error: '',
        success: `Successfully executed auto-dispatch! Sent ${res.count} automated purchase order(s) directly to optimal dealer(s).`
      });
      const updatedDispatches = await api.getDealerDispatches();
      setDispatches(updatedDispatches);
    } catch (err) {
      setFeedback({ error: err.message || 'Auto-dispatch failed', success: '' });
    } finally {
      setDispatchLoading(false);
    }
  };

  const handleUpdateStatus = async (dispatchId, status) => {
    try {
      await api.updateDispatchStatus(dispatchId, status);
      setFeedback({
        error: '',
        success: `Updated order status to ${status}. ${status === 'DELIVERED' ? 'Inventory counts automatically replenished!' : ''}`
      });
      const updated = await api.getDealerDispatches();
      setDispatches(updated);
    } catch (err) {
      setFeedback({ error: err.message, success: '' });
    }
  };

  const selectedItem = items.find((i) => i.id === selectedItemId);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Intelligent Procurement
            </span>
            <span className="text-xs text-slate-400">Decision Support &amp; Autonomous Dealer Sourcing</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Building2 className="w-6 h-6 text-emerald-400" />
            Dealer Hub &amp; AI Supplier Recommendation
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Compare verified supplier trade-offs (price vs delivery time vs reliability) and auto-dispatch orders on low stock
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            disabled={dispatchLoading}
            onClick={() => handleTriggerAutoDispatch(null)}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-black font-extrabold text-xs transition shadow-lg shadow-emerald-500/20 disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5 text-black" />
            <span>{dispatchLoading ? 'Dispatching...' : 'Auto-Dispatch All Low-Stock Orders'}</span>
          </button>
        </div>
      </div>

      {/* Feedback alerts */}
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

      {/* Navigation Tabs */}
      <div className="flex bg-[#111815] p-1 rounded-xl border border-slate-800 text-xs font-semibold w-full sm:w-max">
        <button
          onClick={() => setActiveTab('compare')}
          className={`flex-1 sm:flex-none px-4 py-2 rounded-lg transition flex items-center gap-2 ${
            activeTab === 'compare'
              ? 'bg-emerald-500 text-black font-extrabold shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>AI Supplier Trade-Off Analysis</span>
        </button>
        <button
          onClick={() => setActiveTab('dispatches')}
          className={`flex-1 sm:flex-none px-4 py-2 rounded-lg transition flex items-center gap-2 ${
            activeTab === 'dispatches'
              ? 'bg-emerald-500 text-black font-extrabold shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>Autonomous Dealer Dispatches ({dispatches.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('dealers')}
          className={`flex-1 sm:flex-none px-4 py-2 rounded-lg transition flex items-center gap-2 ${
            activeTab === 'dealers'
              ? 'bg-emerald-500 text-black font-extrabold shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Verified Dealer Scorecards ({dealers.length})</span>
        </button>
      </div>

      {/* ----------------- TAB 1: AI SUPPLIER TRADE-OFF ENGINE ----------------- */}
      {activeTab === 'compare' && (
        <div className="space-y-6">
          {/* Controls: Item Selector & Quantity */}
          <div className="bg-[#111815] border border-slate-800/80 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full sm:w-auto">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Select Product to Procure
                </label>
                <select
                  value={selectedItemId}
                  onChange={(e) => setSelectedItemId(e.target.value)}
                  className="bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-2 text-xs font-semibold focus:outline-none focus:border-emerald-500 min-w-[260px]"
                >
                  {items.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.name} ({i.department}) - Stock: {i.currentStock} {i.unit}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Order Quantity
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min="1"
                    value={reqQuantity}
                    onChange={(e) => setReqQuantity(parseInt(e.target.value, 10) || 1)}
                    className="w-24 bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-2 text-xs font-mono font-bold focus:outline-none focus:border-emerald-500"
                  />
                  <span className="text-xs text-slate-400">{selectedItem?.unit || 'units'}</span>
                </div>
              </div>
            </div>

            {recommendation?.recommended && (
              <button
                disabled={dispatchLoading}
                onClick={() => handleTriggerAutoDispatch(selectedItemId)}
                className="w-full sm:w-auto flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs transition shadow-md shadow-emerald-500/20 whitespace-nowrap"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Auto-Dispatch to Recommended Dealer ({recommendation.recommended.supplierName})</span>
              </button>
            )}
          </div>

          {/* AI Plain-Language Trade-Off Explainer Banner */}
          {recommendation?.explanation && (
            <div className="bg-gradient-to-r from-emerald-950/60 via-[#111e17] to-slate-900 border-2 border-emerald-500/40 rounded-2xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Sparkles className="w-5 h-5 text-emerald-400" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs uppercase font-extrabold tracking-wider bg-emerald-500 text-black px-2 py-0.5 rounded">
                      AI Procurement Decision Support
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      Urgency: <strong className="text-amber-400">{recommendation.urgency}</strong>
                    </span>
                  </div>

                  <div className="text-xs sm:text-sm text-slate-200 leading-relaxed font-sans whitespace-pre-line">
                    {recommendation.explanation}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Side-by-Side Comparison Matrix Table */}
          <div className="bg-[#111815] border border-slate-800/80 rounded-xl p-5 shadow-lg overflow-x-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-emerald-400" />
                  Multi-Supplier Evaluation Matrix for: <span className="text-emerald-400">{selectedItem?.name}</span>
                </h3>
                <p className="text-[11px] text-slate-400">
                  Scores calculated dynamically using price, transit time, recorded on-time reliability %, and defect return rates
                </p>
              </div>
              <span className="text-xs text-slate-400 font-mono">{recommendation?.comparisons?.length || 0} quotes</span>
            </div>

            {evalLoading ? (
              <div className="text-center py-10 text-xs text-slate-400">Analyzing supplier trade-offs...</div>
            ) : !recommendation?.comparisons || recommendation.comparisons.length === 0 ? (
              <div className="text-center py-10 text-xs text-slate-500">
                No supplier quotes recorded for this product yet.
              </div>
            ) : (
              <table className="w-full text-left text-xs text-slate-300 mt-4 min-w-[700px]">
                <thead className="text-[11px] text-slate-400 uppercase bg-slate-900/80 border-b border-slate-800 font-mono">
                  <tr>
                    <th className="py-2.5 px-3">Supplier / Dealer</th>
                    <th className="py-2.5 px-3">Unit Price</th>
                    <th className="py-2.5 px-3">Est. Total Cost</th>
                    <th className="py-2.5 px-3">Delivery Lead Time</th>
                    <th className="py-2.5 px-3">On-Time Reliability</th>
                    <th className="py-2.5 px-3">Return / Defect Rate</th>
                    <th className="py-2.5 px-3">AI Fitness Score</th>
                    <th className="py-2.5 px-3 text-right">Verdict</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {recommendation.comparisons.map((c, idx) => {
                    const isBest = idx === 0;

                    return (
                      <tr
                        key={c.supplierId}
                        className={`transition ${
                          isBest
                            ? 'bg-emerald-950/30 border-l-4 border-l-emerald-500'
                            : 'hover:bg-slate-900/40'
                        }`}
                      >
                        <td className="py-3.5 px-3">
                          <div className="flex items-center gap-2">
                            <div>
                              <p className="font-bold text-white text-sm">{c.supplierName}</p>
                              <p className="text-[10px] text-slate-400 font-mono">
                                Contact: {c.contactPerson} ({c.email})
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3 font-mono font-bold text-slate-200">
                          ${c.unitPrice} <span className="text-[10px] font-normal text-slate-500">/{selectedItem?.unit}</span>
                        </td>
                        <td className="py-3 px-3 font-mono font-extrabold text-emerald-400 text-sm">
                          ${c.totalCost}
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-bold font-mono ${
                              c.deliveryDays <= 2
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                : 'bg-amber-950 text-amber-300 border border-amber-800'
                            }`}
                          >
                            {c.deliveryDays} days
                          </span>
                        </td>
                        <td className="py-3 px-3 font-mono">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-200">{c.reliabilityRate}%</span>
                            <span className="text-[10px] text-slate-500">on-time</span>
                          </div>
                        </td>
                        <td className="py-3 px-3 font-mono">
                          <span
                            className={`font-semibold ${
                              c.defectRate < 1.0 ? 'text-emerald-400' : 'text-amber-400'
                            }`}
                          >
                            {c.defectRate}%
                          </span>
                        </td>
                        <td className="py-3 px-3 font-mono">
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-sm font-black ${
                                isBest ? 'text-emerald-400' : 'text-slate-300'
                              }`}
                            >
                              {c.scores.composite}
                            </span>
                            <span className="text-[10px] text-slate-500">/100</span>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-right">
                          {isBest ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500 text-black text-[10px] font-extrabold uppercase shadow-sm">
                              <Sparkles className="w-3 h-3" /> Recommended
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-500 font-semibold">
                              Alternative
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ----------------- TAB 2: AUTONOMOUS DEALER DISPATCHES ----------------- */}
      {activeTab === 'dispatches' && (
        <div className="bg-[#111815] border border-slate-800/80 rounded-xl p-5 shadow-lg">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Truck className="w-4 h-4 text-emerald-400" />
                Autonomous Low-Stock Dealer Purchase Orders
              </h3>
              <p className="text-[11px] text-slate-400">
                Purchase orders automatically generated and dispatched to dealers when items trigger low stock
              </p>
            </div>
            <span className="text-xs text-slate-400 font-mono">{dispatches.length} dispatches</span>
          </div>

          {dispatches.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs">
              No dealer dispatches recorded yet. Click "Auto-Dispatch All Low-Stock Orders" to generate orders.
            </div>
          ) : (
            <div className="divide-y divide-slate-800/60">
              {dispatches.map((d) => {
                const statusColors = {
                  AUTO_DISPATCHED: 'bg-amber-950/80 text-amber-300 border-amber-800',
                  ACKNOWLEDGED: 'bg-blue-950/80 text-blue-300 border-blue-800',
                  SHIPPED: 'bg-purple-950/80 text-purple-300 border-purple-800',
                  DELIVERED: 'bg-emerald-950/80 text-emerald-300 border-emerald-800',
                  CANCELLED: 'bg-rose-950/80 text-rose-300 border-rose-800'
                };

                return (
                  <div key={d.id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1.5 max-w-2xl">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border ${statusColors[d.status] || 'bg-slate-800'}`}>
                          {d.status}
                        </span>
                        <span className="text-xs text-slate-400 font-mono">PO #{d.id.slice(0, 8)}</span>
                        <span className="text-[10px] text-slate-500 bg-slate-900 px-1.5 py-0.5 rounded">
                          {d.item.department}
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-white">
                        {d.quantity} {d.item.unit} &times; {d.item.name} &rarr; <span className="text-emerald-400">{d.supplier.name}</span>
                      </h4>

                      <p className="text-xs text-slate-300 bg-slate-900/60 p-2 rounded-lg border border-slate-800/80">
                        {d.dispatchMessage}
                      </p>

                      <div className="flex items-center gap-4 text-xs text-slate-400 font-mono">
                        <span>Dealer: {d.supplier.contactPerson} ({d.dealerContactEmail})</span>
                        <span>&bull;</span>
                        <span className="text-emerald-400 font-bold">Total: ${d.totalCost}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 self-start md:self-center">
                      {d.status === 'AUTO_DISPATCHED' && (
                        <button
                          onClick={() => handleUpdateStatus(d.id, 'ACKNOWLEDGED')}
                          className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-sm"
                        >
                          Mark Acknowledged
                        </button>
                      )}
                      {d.status === 'ACKNOWLEDGED' && (
                        <button
                          onClick={() => handleUpdateStatus(d.id, 'SHIPPED')}
                          className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition shadow-sm"
                        >
                          Mark In-Transit
                        </button>
                      )}
                      {d.status === 'SHIPPED' && (
                        <button
                          onClick={() => handleUpdateStatus(d.id, 'DELIVERED')}
                          className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold transition shadow-sm flex items-center gap-1"
                        >
                          <PackageCheck className="w-3.5 h-3.5" />
                          <span>Receive &amp; Add Stock</span>
                        </button>
                      )}
                      {d.status === 'DELIVERED' && (
                        <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4" /> Fulfilled &amp; In Inventory
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ----------------- TAB 3: VERIFIED DEALER DIRECTORY & SCORECARDS ----------------- */}
      {activeTab === 'dealers' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {dealers.map((d) => (
            <div
              key={d.id}
              className="bg-[#111815] rounded-xl p-4 border border-slate-800/80 hover:border-emerald-500/40 transition flex flex-col justify-between shadow-md"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    {d.code}
                  </span>
                  <div className="flex items-center text-amber-400 text-xs font-bold gap-1">
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    <span>{d.rating}</span>
                  </div>
                </div>

                <h3 className="font-bold text-white text-base mt-2">{d.name}</h3>
                <p className="text-xs text-slate-400">{d.location}</p>

                <div className="mt-3 p-3 bg-slate-900/80 rounded-lg space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Contact:</span>
                    <span className="text-slate-200 font-medium">{d.contactPerson}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Email:</span>
                    <span className="text-slate-200 font-mono text-[11px] truncate max-w-[160px]">{d.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Phone:</span>
                    <span className="text-slate-200 font-mono text-[11px]">{d.phone}</span>
                  </div>
                </div>

                {/* Scorecards */}
                <div className="grid grid-cols-3 gap-2 mt-3 text-center">
                  <div className="bg-slate-900/90 p-2 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">On-Time</span>
                    <span className="text-xs font-black text-emerald-400 font-mono">{d.reliabilityRate}%</span>
                  </div>
                  <div className="bg-slate-900/90 p-2 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Defect Rate</span>
                    <span className="text-xs font-black text-slate-200 font-mono">{d.defectRate}%</span>
                  </div>
                  <div className="bg-slate-900/90 p-2 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Avg Lead</span>
                    <span className="text-xs font-black text-teal-400 font-mono">{d.avgLeadDays}d</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                <span>{d.quotes?.length || 0} Products Supplied</span>
                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Verified
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}