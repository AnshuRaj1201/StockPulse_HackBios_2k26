import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import {
  FileText,
  Calendar,
  Sparkles,
  ArrowDownLeft,
  ArrowUpRight,
  AlertTriangle,
  Clock,
  DollarSign,
  Printer,
  Send,
  RefreshCw,
  CheckCircle2,
  TrendingUp,
  Package,
  ShieldCheck,
  ShieldAlert,
  ChevronRight,
  Info,
  X,
  Layers,
  Building2,
  Check
} from 'lucide-react';

export default function DailySummary({ setActiveTab }) {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [summaryData, setSummaryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dispatching, setDispatching] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState('overview'); // 'overview', 'movements', 'lowstock', 'attention', 'financials'
  const [feedback, setFeedback] = useState({ error: '', success: '' });

  const fetchDailySummary = async (date) => {
    setLoading(true);
    setFeedback({ error: '', success: '' });
    try {
      const data = await api.getDailySummary(date);
      setSummaryData(data);
    } catch (err) {
      console.error('Failed to load daily summary:', err);
      setFeedback({ error: err.message || 'Failed to load summary', success: '' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDailySummary(selectedDate);
  }, [selectedDate]);

  const handleDispatchToOwner = async () => {
    setDispatching(true);
    try {
      const res = await api.dispatchDailySummaryToOwner({
        targetEmail: user?.email || 'admin@campus.edu'
      });
      setFeedback({
        error: '',
        success: `📲 ${res.message}`
      });
    } catch (err) {
      setFeedback({ error: err.message || 'Dispatch failed', success: '' });
    } finally {
      setDispatching(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const kpis = summaryData?.kpis || {};
  const brief = summaryData?.aiExecutiveBrief || {};
  const received = summaryData?.receivedProducts || [];
  const issued = summaryData?.issuedProducts || [];
  const lowStock = summaryData?.lowStockItems || [];
  const attention = summaryData?.attentionItems || [];
  const financials = summaryData?.financials || {};

  return (
    <div className="space-y-6 pb-16 print:p-0 print:space-y-4">
      {/* Top Header Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[11px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> End-of-Day Executive Pulse
            </span>
            <span className="text-xs text-slate-400">Zero-effort daily owner briefing</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
            <FileText className="w-7 h-7 text-emerald-400" />
            End-of-Day Summary &amp; Operations Digest
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-3xl">
            Designed for busy store owners: Review products received, products issued, low stock warnings, products needing attention, and recorded sales in under 60 seconds.
          </p>
        </div>

        {/* Date Selector & Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5 print:hidden">
          {/* Quick Date Picker */}
          <div className="flex items-center gap-2 bg-[#111815] border border-slate-700/80 rounded-xl px-3 py-1.5 shadow-sm">
            <Calendar className="w-4 h-4 text-emerald-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-white text-xs font-bold focus:outline-none cursor-pointer"
            />
            <button
              onClick={() => setSelectedDate(new Date().toISOString().slice(0, 10))}
              className="text-[10px] bg-slate-800 text-slate-300 hover:text-white px-2 py-0.5 rounded font-medium transition"
            >
              Today
            </button>
          </div>

          <button
            onClick={() => fetchDailySummary(selectedDate)}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition"
            title="Refresh Live Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center space-x-2 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 transition shadow-sm"
          >
            <Printer className="w-4 h-4 text-slate-300" />
            <span>Print 1-Page PDF</span>
          </button>

          <button
            disabled={dispatching}
            onClick={handleDispatchToOwner}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-black font-black text-xs transition shadow-lg shadow-emerald-500/20 disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            <span>{dispatching ? 'Sending...' : 'Send Brief to Owner'}</span>
          </button>
        </div>
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
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>{feedback.success}</span>
          </div>
          <button onClick={() => setFeedback({ ...feedback, success: '' })}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="flex flex-col items-center space-y-3">
            <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs text-slate-400">Compiling owner executive summary...</p>
          </div>
        </div>
      ) : (
        <>
          {/* Recent Activity notice if demonstrating outside live trading hours */}
          {summaryData?.isRecentActivityFallback && (
            <div className="p-3 bg-purple-950/40 border border-purple-800/50 rounded-xl text-purple-300 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-purple-400 flex-shrink-0" />
                <span>
                  Showing active movement window across latest 48h operations so you can review real-time stock inflow, deliveries, and sales data.
                </span>
              </div>
            </div>
          )}

          {/* Key 5 KPI Cards Grid (Direct Match to User Problem Statement) */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
            {/* 1. Products Received */}
            <div className="bg-[#111815] border border-slate-800/80 p-4 rounded-xl shadow-md">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                  <ArrowDownLeft className="w-3.5 h-3.5" /> Received Today
                </span>
                <Package className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-black text-white">
                +{kpis.totalUnitsReceived || 0}{' '}
                <span className="text-xs font-normal text-slate-400">units</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
                <span>{kpis.receivedProductsCount || 0} product(s)</span>
                <span className="font-mono text-emerald-400 font-semibold">${kpis.totalReceivedSpend || 0}</span>
              </div>
            </div>

            {/* 2. Products Issued & Recorded Sales */}
            <div className="bg-[#111815] border border-slate-800/80 p-4 rounded-xl shadow-md">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1">
                  <ArrowUpRight className="w-3.5 h-3.5" /> Issued / Sold
                </span>
                <TrendingUp className="w-4 h-4 text-blue-400" />
              </div>
              <div className="text-2xl font-black text-white">
                -{kpis.totalUnitsIssued || 0}{' '}
                <span className="text-xs font-normal text-slate-400">units</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
                <span>{kpis.issuedProductsCount || 0} product(s)</span>
                <span className="font-mono text-blue-300 font-semibold">${kpis.totalRecordedSales || 0}</span>
              </div>
            </div>

            {/* 3. Items Running Low */}
            <div className="bg-[#111815] border border-amber-900/40 p-4 rounded-xl shadow-md">
              <div className="flex items-center justify-between text-amber-400 mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" /> Items Running Low
                </span>
              </div>
              <div className="text-2xl font-black text-amber-300">
                {kpis.lowStockCount || 0}{' '}
                <span className="text-xs font-normal text-slate-400">SKUs</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
                <span>{kpis.criticalStockoutCount || 0} out of stock</span>
                <span className="text-amber-400 font-semibold font-mono">Action req.</span>
              </div>
            </div>

            {/* 4. Products Needing Attention */}
            <div className="bg-[#111815] border border-rose-900/40 p-4 rounded-xl shadow-md">
              <div className="flex items-center justify-between text-rose-400 mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> Needing Attention
                </span>
              </div>
              <div className="text-2xl font-black text-rose-300">
                {kpis.attentionCount || 0}{' '}
                <span className="text-xs font-normal text-slate-400">alerts</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                Near expiry or order holds
              </div>
            </div>

            {/* 5. Estimated Stock Value & Financials */}
            <div className="col-span-2 md:col-span-1 bg-[#111815] border border-slate-800/80 p-4 rounded-xl shadow-md">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                  <DollarSign className="w-3.5 h-3.5" /> Inventory Value
                </span>
              </div>
              <div className="text-2xl font-black text-white font-mono">
                ${kpis.totalStockValuation || 0}
              </div>
              <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
                <span>Net Flow:</span>
                <span className={`font-mono font-bold ${kpis.netStockUnitChange >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {kpis.netStockUnitChange >= 0 ? `+${kpis.netStockUnitChange}` : kpis.netStockUnitChange} units
                </span>
              </div>
            </div>
          </div>

          {/* AI Executive Summary Card (Owner's TL;DR in 60 seconds) */}
          <div className="rounded-2xl bg-gradient-to-r from-emerald-950/40 via-[#101914] to-slate-900 border border-emerald-800/50 p-5 sm:p-6 shadow-xl relative overflow-hidden">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div className="space-y-2 max-w-3xl">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase font-black px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    AI Owner Brief
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    {summaryData?.dateFormatted || 'Daily Report'}
                  </span>
                </div>

                <h3 className="text-lg sm:text-xl font-black text-white leading-snug">
                  {brief.headline || 'End-of-Day Executive Briefing'}
                </h3>

                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {brief.leadParagraph}
                </p>

                {/* Bullet Highlights */}
                <div className="mt-3 space-y-1.5 pt-2 border-t border-slate-800/60">
                  {(brief.bulletHighlights || []).map((highlight, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-slate-200">
                      <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <span>{highlight}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Health Score Pill */}
              <div className="bg-slate-900/90 border border-emerald-700/50 rounded-2xl p-4 flex flex-col items-center justify-center text-center min-w-[170px] shadow-lg flex-shrink-0">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                  Store Health Score
                </span>
                <div className="text-3xl font-black text-emerald-400 my-1 font-mono">
                  {brief.healthScore || 85}<span className="text-xs text-slate-400">/100</span>
                </div>
                <span
                  className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                    brief.healthScore >= 80
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                      : 'bg-amber-950 text-amber-300 border border-amber-700'
                  }`}
                >
                  {brief.statusBadge?.replace(/_/g, ' ') || 'OPTIMAL'}
                </span>
              </div>
            </div>
          </div>

          {/* Detailed Section Navigation Tabs */}
          <div className="border-b border-slate-800 flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            <button
              onClick={() => setActiveSubTab('overview')}
              className={`px-3 py-2 rounded-lg font-bold transition flex items-center gap-1.5 ${
                activeSubTab === 'overview'
                  ? 'bg-emerald-500 text-black shadow-sm'
                  : 'bg-slate-900/80 text-slate-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" /> Quick Overview
            </button>
            <button
              onClick={() => setActiveSubTab('movements')}
              className={`px-3 py-2 rounded-lg font-bold transition flex items-center gap-1.5 ${
                activeSubTab === 'movements'
                  ? 'bg-emerald-500 text-black shadow-sm'
                  : 'bg-slate-900/80 text-slate-400 hover:text-white'
              }`}
            >
              <Package className="w-3.5 h-3.5" /> Received &amp; Issued ({received.length + issued.length})
            </button>
            <button
              onClick={() => setActiveSubTab('lowstock')}
              className={`px-3 py-2 rounded-lg font-bold transition flex items-center gap-1.5 ${
                activeSubTab === 'lowstock'
                  ? 'bg-emerald-500 text-black shadow-sm'
                  : 'bg-slate-900/80 text-slate-400 hover:text-white'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" /> Items Running Low ({lowStock.length})
            </button>
            <button
              onClick={() => setActiveSubTab('attention')}
              className={`px-3 py-2 rounded-lg font-bold transition flex items-center gap-1.5 ${
                activeSubTab === 'attention'
                  ? 'bg-emerald-500 text-black shadow-sm'
                  : 'bg-slate-900/80 text-slate-400 hover:text-white'
              }`}
            >
              <Clock className="w-3.5 h-3.5" /> Needing Attention ({attention.length})
            </button>
            <button
              onClick={() => setActiveSubTab('financials')}
              className={`px-3 py-2 rounded-lg font-bold transition flex items-center gap-1.5 ${
                activeSubTab === 'financials'
                  ? 'bg-emerald-500 text-black shadow-sm'
                  : 'bg-slate-900/80 text-slate-400 hover:text-white'
              }`}
            >
              <DollarSign className="w-3.5 h-3.5" /> Valuation &amp; Sales
            </button>
          </div>

          {/* TAB 1: OVERVIEW & SIDE-BY-SIDE SUMMARY */}
          {activeSubTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Left Column: Movement Activity (Inflow vs Outflow) */}
              <div className="bg-[#111815] border border-slate-800/80 rounded-2xl p-5 shadow-lg space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                    Daily Throughput Summary
                  </h3>
                  <span className="text-[11px] text-slate-400">
                    Net: {kpis.netStockUnitChange >= 0 ? `+${kpis.netStockUnitChange}` : kpis.netStockUnitChange} units
                  </span>
                </div>

                {/* Dual In/Out Bars */}
                <div className="space-y-3">
                  <div className="p-3 bg-emerald-950/20 border border-emerald-800/40 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-emerald-400 font-bold uppercase block">Total Inflow</span>
                      <span className="text-base font-black text-white">+{kpis.totalUnitsReceived} units received</span>
                    </div>
                    <span className="text-sm font-mono font-bold text-emerald-400">${kpis.totalReceivedSpend}</span>
                  </div>

                  <div className="p-3 bg-blue-950/20 border border-blue-800/40 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-blue-400 font-bold uppercase block">Total Outflow &amp; Sales</span>
                      <span className="text-base font-black text-white">-{kpis.totalUnitsIssued} units issued</span>
                    </div>
                    <span className="text-sm font-mono font-bold text-blue-300">${kpis.totalRecordedSales}</span>
                  </div>
                </div>

                <div className="text-xs text-slate-400">
                  <strong className="text-white">Active Products Moved Today:</strong>
                  <ul className="mt-2 space-y-1 divide-y divide-slate-800/60">
                    {issued.slice(0, 3).map((item) => (
                      <li key={item.itemId} className="pt-1.5 flex items-center justify-between">
                        <span>{item.name}</span>
                        <span className="text-rose-400 font-mono font-bold">-{item.totalQuantity} {item.unit}</span>
                      </li>
                    ))}
                    {received.slice(0, 3).map((item) => (
                      <li key={item.itemId} className="pt-1.5 flex items-center justify-between">
                        <span>{item.name}</span>
                        <span className="text-emerald-400 font-mono font-bold">+{item.totalQuantity} {item.unit}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Right Column: Immediate Action Checklist */}
              <div className="bg-[#111815] border border-slate-800/80 rounded-2xl p-5 shadow-lg space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    Immediate Owner Action Items
                  </h3>
                  <span className="text-[11px] text-amber-400 font-semibold">{lowStock.length + attention.length} items flagged</span>
                </div>

                <div className="space-y-2.5">
                  {attention.slice(0, 3).map((item) => (
                    <div
                      key={item.id}
                      className="p-3 bg-rose-950/20 border border-rose-900/40 rounded-xl flex items-start gap-2.5"
                    >
                      <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-white">{item.title}</h4>
                          <span className="text-[10px] text-rose-300 font-mono font-bold uppercase">{item.urgency}</span>
                        </div>
                        <p className="text-[11px] text-slate-300 mt-0.5">{item.message}</p>
                      </div>
                    </div>
                  ))}

                  {lowStock.slice(0, 2).map((item) => (
                    <div
                      key={item.id}
                      className="p-3 bg-amber-950/20 border border-amber-900/40 rounded-xl flex items-start gap-2.5"
                    >
                      <Info className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-white">{item.name}</h4>
                          <span className="text-[10px] text-amber-300 font-mono font-bold">Stock: {item.currentStock} {item.unit}</span>
                        </div>
                        <p className="text-[11px] text-slate-300 mt-0.5">
                          Threshold is {item.minThreshold}. Shortage of {item.shortageUnits} units.
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DETAILED MOVEMENTS (RECEIVED & ISSUED) */}
          {activeSubTab === 'movements' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Products Received */}
              <div className="bg-[#111815] border border-slate-800/80 rounded-2xl p-5 shadow-lg space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <ArrowDownLeft className="w-4 h-4 text-emerald-400" />
                    Products Received Today ({received.length})
                  </h3>
                  <span className="text-xs font-mono font-bold text-emerald-400">Total: +{kpis.totalUnitsReceived} units</span>
                </div>

                {received.length === 0 ? (
                  <div className="text-center py-8 text-xs text-slate-500">
                    No restock shipments received today.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-800/60">
                    {received.map((item) => (
                      <div key={item.itemId} className="py-3 flex items-start justify-between gap-3">
                        <div>
                          <h4 className="font-bold text-white text-xs">{item.name}</h4>
                          <p className="text-[11px] text-slate-400 font-mono">
                            {item.sku} &bull; {item.department}
                          </p>
                          <span className="text-[10px] text-slate-500 mt-0.5 block">
                            Last received: {item.reasons[0]?.reason || 'Restock'}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-black text-emerald-400 font-mono">
                            +{item.totalQuantity} {item.unit}
                          </span>
                          <span className="text-[11px] text-slate-400 block font-mono">
                            ${item.totalValue}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Products Issued / Sold */}
              <div className="bg-[#111815] border border-slate-800/80 rounded-2xl p-5 shadow-lg space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <ArrowUpRight className="w-4 h-4 text-blue-400" />
                    Products Issued &amp; Dispatched ({issued.length})
                  </h3>
                  <span className="text-xs font-mono font-bold text-blue-300">Total: -{kpis.totalUnitsIssued} units</span>
                </div>

                {issued.length === 0 ? (
                  <div className="text-center py-8 text-xs text-slate-500">
                    No products issued or delivered today.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-800/60">
                    {issued.map((item) => (
                      <div key={item.itemId} className="py-3 flex items-start justify-between gap-3">
                        <div>
                          <h4 className="font-bold text-white text-xs">{item.name}</h4>
                          <p className="text-[11px] text-slate-400 font-mono">
                            {item.sku} &bull; {item.department}
                          </p>
                          <span className="text-[10px] text-slate-500 mt-0.5 block">
                            Reason: {item.reasons[0]?.reason || 'Routine usage / Delivery'}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-black text-rose-400 font-mono">
                            -{item.totalQuantity} {item.unit}
                          </span>
                          <span className="text-[11px] text-blue-300 block font-mono">
                            Sales: ${item.totalSalesValue}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: ITEMS RUNNING LOW */}
          {activeSubTab === 'lowstock' && (
            <div className="bg-[#111815] border border-slate-800/80 rounded-2xl p-5 shadow-lg space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    Items Running Low / Near Depletion ({lowStock.length})
                  </h3>
                  <p className="text-[11px] text-slate-400">Stock at or below minimum reorder point threshold</p>
                </div>
                {setActiveTab && (
                  <button
                    onClick={() => setActiveTab('procurement')}
                    className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                  >
                    <span>Open AI Procurement</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {lowStock.length === 0 ? (
                <div className="text-center py-10 text-xs text-emerald-400">
                  🎉 Excellent! No items are currently running low.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase text-[10px]">
                        <th className="pb-2">Product Name</th>
                        <th className="pb-2">Department</th>
                        <th className="pb-2">Current Stock</th>
                        <th className="pb-2">Min Threshold</th>
                        <th className="pb-2">Deficit</th>
                        <th className="pb-2">Suggested Reorder</th>
                        <th className="pb-2">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                      {lowStock.map((item) => (
                        <tr key={item.id} className="text-slate-300">
                          <td className="py-3 font-bold text-white">{item.name}</td>
                          <td className="py-3 text-slate-400">{item.department}</td>
                          <td className="py-3 font-mono font-black text-rose-400">
                            {item.currentStock} {item.unit}
                          </td>
                          <td className="py-3 font-mono text-slate-400">
                            {item.minThreshold} {item.unit}
                          </td>
                          <td className="py-3 font-mono text-amber-400 font-bold">
                            -{item.shortageUnits} {item.unit}
                          </td>
                          <td className="py-3 font-mono font-bold text-emerald-400">
                            {item.reorderSuggested} {item.unit}
                          </td>
                          <td className="py-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                item.status === 'OUT_OF_STOCK'
                                  ? 'bg-rose-950 text-rose-300 border border-rose-800'
                                  : 'bg-amber-950 text-amber-300 border border-amber-800'
                              }`}
                            >
                              {item.status.replace(/_/g, ' ')}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: PRODUCTS NEEDING ATTENTION */}
          {activeSubTab === 'attention' && (
            <div className="bg-[#111815] border border-slate-800/80 rounded-2xl p-5 shadow-lg space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Clock className="w-4 h-4 text-rose-400" />
                    Products Needing Urgent Attention ({attention.length})
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Expiry deadlines, pending delivery orders, or dealer bottlenecks
                  </p>
                </div>
              </div>

              {attention.length === 0 ? (
                <div className="text-center py-10 text-xs text-emerald-400">
                  🎉 No urgent alerts or attention items required today.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {attention.map((item) => (
                    <div
                      key={item.id}
                      className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex flex-col justify-between space-y-3"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                              item.urgency === 'CRITICAL'
                                ? 'bg-rose-950 text-rose-300 border border-rose-800'
                                : 'bg-amber-950 text-amber-300 border border-amber-800'
                            }`}
                          >
                            {item.urgency}
                          </span>
                          <span className="text-[11px] text-slate-400 font-mono">{item.department}</span>
                        </div>
                        <h4 className="text-sm font-bold text-white">{item.title}</h4>
                        <p className="text-xs text-slate-300 mt-1 leading-relaxed">{item.message}</p>
                      </div>

                      <div className="p-2.5 rounded-lg bg-black/40 border border-slate-800 text-[11px] text-slate-300 flex items-center gap-2">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                        <span><strong className="text-white">Recommended Action:</strong> {item.recommendedAction}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: FINANCIALS & ESTIMATED STOCK VALUE */}
          {activeSubTab === 'financials' && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-[#111815] border border-slate-800/80 rounded-2xl p-5 shadow-lg">
                  <span className="text-[11px] text-slate-400 font-bold uppercase block">
                    Total Inventory Asset Value
                  </span>
                  <div className="text-3xl font-black text-white font-mono mt-1">
                    ${financials.totalAssetValue || 0}
                  </div>
                  <p className="text-xs text-slate-400 mt-1">Based on unit costs of currently held batches</p>
                </div>

                <div className="bg-[#111815] border border-slate-800/80 rounded-2xl p-5 shadow-lg">
                  <span className="text-[11px] text-slate-400 font-bold uppercase block">
                    Recorded Sales / Outflow Value
                  </span>
                  <div className="text-3xl font-black text-blue-300 font-mono mt-1">
                    ${financials.recordedSalesToday || 0}
                  </div>
                  <p className="text-xs text-slate-400 mt-1">Estimated revenue &amp; dispensed turnover today</p>
                </div>

                <div className="bg-[#111815] border border-slate-800/80 rounded-2xl p-5 shadow-lg">
                  <span className="text-[11px] text-slate-400 font-bold uppercase block">
                    Procurement Spend Today
                  </span>
                  <div className="text-3xl font-black text-emerald-400 font-mono mt-1">
                    ${financials.procurementSpendToday || 0}
                  </div>
                  <p className="text-xs text-slate-400 mt-1">Capital invested into restocked products today</p>
                </div>
              </div>

              {/* Department Valuation Breakdown */}
              <div className="bg-[#111815] border border-slate-800/80 rounded-2xl p-5 shadow-lg">
                <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-emerald-400" />
                  Asset Valuation Breakdown by Department
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  {(financials.departmentValuations || []).map((dept) => (
                    <div key={dept.name} className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl">
                      <span className="text-xs text-slate-300 font-medium block">{dept.name}</span>
                      <span className="text-lg font-black text-white font-mono block mt-1">
                        ${dept.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
