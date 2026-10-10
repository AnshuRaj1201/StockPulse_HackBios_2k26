import React, { useState, useEffect } from 'react';
import { api } from '../api';
import {
  Boxes,
  AlertTriangle,
  RotateCw,
  Clock,
  TrendingUp,
  PackageX,
  DollarSign,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  QrCode,
  FileText
} from 'lucide-react';

export default function Dashboard({ setActiveTab, onOpenScanner }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = async () => {
    try {
      const res = await api.getDashboardAnalytics();
      setData(res);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-slate-400">Loading StockPulse analytics...</p>
        </div>
      </div>
    );
  }

  const summary = data?.summary || {};
  const topMovers = data?.topMovers || [];
  const deadStock = data?.deadStock || [];
  const categoryDist = data?.categoryDistribution || [];

  return (
    <div className="space-y-6 pb-12">
      {/* Top Welcome / Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-950/60 via-[#0e1713] to-slate-900 border border-emerald-800/40 p-5 sm:p-6 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Team War Machine &bull; HACKBIOS
              </span>
              <span className="text-xs text-slate-400">Smart Campus & Small Business Ops</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Live Operations & Inventory Pulse
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl mt-1">
              "Never run out of stock, never over-order." Real-time QR tracking, FEFO wastage prevention, and usage-based automated reorder forecasting.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setActiveTab('daily-summary')}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs transition shadow-lg shadow-purple-500/25"
            >
              <FileText className="w-4 h-4 text-white" />
              <span>Daily Summary (EOD)</span>
            </button>
            <button
              onClick={onOpenScanner}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs transition shadow-lg shadow-emerald-500/25"
            >
              <QrCode className="w-4 h-4" />
              <span>Fast Scan & Log</span>
            </button>
            <button
              onClick={() => setActiveTab('reorders')}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-white font-bold text-xs transition border border-slate-700"
            >
              <RotateCw className="w-4 h-4 text-emerald-400" />
              <span>Reorders</span>
            </button>
          </div>
        </div>

        {/* Subtle background glow */}
        <div className="absolute -top-12 -right-12 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Total Items */}
        <div
          onClick={() => setActiveTab('inventory')}
          className="bg-[#111815] border border-slate-800/80 hover:border-emerald-500/40 p-4 rounded-xl cursor-pointer transition shadow-md"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Total SKUs</span>
            <Boxes className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-white">{summary.totalItems || 0}</div>
          <p className="text-[11px] text-slate-400 mt-1">Across 4 departments</p>
        </div>

        {/* Low Stock Alerts */}
        <div
          onClick={() => setActiveTab('inventory')}
          className="bg-[#111815] border border-amber-900/40 hover:border-amber-500/50 p-4 rounded-xl cursor-pointer transition shadow-md"
        >
          <div className="flex items-center justify-between text-amber-400 mb-2">
            <span className="text-xs font-semibold">Low Stock Warnings</span>
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-amber-300">{summary.lowStockCount || 0}</div>
          <p className="text-[11px] text-slate-400 mt-1">At or below threshold</p>
        </div>

        {/* Stockouts */}
        <div
          onClick={() => setActiveTab('inventory')}
          className="bg-[#111815] border border-rose-900/40 hover:border-rose-500/50 p-4 rounded-xl cursor-pointer transition shadow-md"
        >
          <div className="flex items-center justify-between text-rose-400 mb-2">
            <span className="text-xs font-semibold">Critical Stock-outs</span>
            <PackageX className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-rose-300">{summary.stockoutCount || 0}</div>
          <p className="text-[11px] text-slate-400 mt-1">Zero items remaining</p>
        </div>

        {/* Expiring Soon (< 30 days) */}
        <div
          onClick={() => setActiveTab('fefo')}
          className="bg-[#111815] border border-purple-900/40 hover:border-purple-500/50 p-4 rounded-xl cursor-pointer transition shadow-md"
        >
          <div className="flex items-center justify-between text-purple-400 mb-2">
            <span className="text-xs font-semibold">Expiring &lt; 30d</span>
            <Clock className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-purple-300">{summary.nearExpiryBatchesCount || 0}</div>
          <p className="text-[11px] text-slate-400 mt-1">FEFO action required</p>
        </div>

        {/* Total Valuation */}
        <div className="col-span-2 lg:col-span-1 bg-[#111815] border border-slate-800/80 p-4 rounded-xl shadow-md">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Inventory Value</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-white">${summary.totalInventoryValue || 0}</div>
          <p className="text-[11px] text-slate-400 mt-1">Estimated asset total</p>
        </div>
      </div>

      {/* End-of-Day Owner Executive Summary Banner */}
      <div className="bg-gradient-to-r from-purple-950/40 via-[#15121c] to-slate-900 border border-purple-800/50 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg">
        <div className="flex items-start space-x-3.5">
          <div className="p-2.5 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30 flex-shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-purple-400 bg-purple-950/80 px-2 py-0.5 rounded border border-purple-800/60">
                End-of-Day Executive Summary
              </span>
              <span className="text-xs text-slate-400">Save hours of manual report prep</span>
            </div>
            <h4 className="text-sm font-bold text-white mt-1">
              Owner's 60-Second Daily Inventory &amp; Sales Digest
            </h4>
            <p className="text-xs text-slate-300 mt-0.5 max-w-2xl">
              At the end of the day, StockPulse generates a simple digest showing products received and issued, items running low, products needing attention, and estimated stock value with recorded sales.
            </p>
          </div>
        </div>
        <button
          onClick={() => setActiveTab('daily-summary')}
          className="self-start sm:self-center flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs whitespace-nowrap transition shadow-md shadow-purple-500/20"
        >
          <span>Open Daily Summary</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Illustrative Use Case Showcase (Chemistry Lab Gloves Case from Slide 5) */}
      <div className="bg-emerald-950/20 border border-emerald-800/50 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start space-x-3">
          <div className="p-2.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex-shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Live Reorder Example</span>
              <span className="text-[10px] bg-emerald-900/60 text-emerald-300 px-1.5 py-0.2 rounded font-mono">Chemistry Lab</span>
            </div>
            <h4 className="text-sm font-bold text-white mt-0.5">
              Nitrile Examination Gloves: 8 boxes left &bull; usage ~5/week
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              StockPulse detected stock below safety threshold and automatically drafted a purchase order for 20 boxes before the lab runs dry.
            </p>
          </div>
        </div>
        <button
          onClick={() => setActiveTab('reorders')}
          className="self-start sm:self-center flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 font-bold text-xs border border-emerald-500/40 whitespace-nowrap transition"
        >
          <span>View Draft Order</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Analytics Breakdown: Top Movers, Dead Stock, Category Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Movers (High Consumption) */}
        <div className="bg-[#111815] border border-slate-800/80 rounded-xl p-5 shadow-lg">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              Top Movers (High Burn Rate)
            </h3>
            <span className="text-[11px] text-slate-500">Issued last 30d</span>
          </div>

          <div className="mt-4 space-y-3">
            {topMovers.length === 0 ? (
              <p className="text-xs text-slate-500 py-3 text-center">No consumption logged yet</p>
            ) : (
              topMovers.map((item, idx) => (
                <div key={item.id} className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2.5 truncate max-w-[70%]">
                    <span className="font-mono text-slate-500 font-bold">0{idx + 1}</span>
                    <div className="truncate">
                      <p className="font-semibold text-slate-200 truncate">{item.name}</p>
                      <p className="text-[10px] text-slate-400">{item.department}</p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="font-bold text-emerald-400">{item.totalIssued}</span>
                    <span className="text-[10px] text-slate-400 ml-1">{item.unit}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Dead Stock / Stagnant Inventory */}
        <div className="bg-[#111815] border border-slate-800/80 rounded-xl p-5 shadow-lg">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <PackageX className="w-4 h-4 text-amber-400" />
              Dead Stock / Low Turnover
            </h3>
            <span className="text-[11px] text-slate-500">0 usage</span>
          </div>

          <div className="mt-4 space-y-3">
            {deadStock.length === 0 ? (
              <p className="text-xs text-slate-500 py-3 text-center">No stagnant inventory detected</p>
            ) : (
              deadStock.map((item) => (
                <div key={item.id} className="flex items-center justify-between text-xs">
                  <div className="truncate max-w-[70%]">
                    <p className="font-semibold text-slate-200 truncate">{item.name}</p>
                    <p className="text-[10px] text-slate-400">{item.department}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="font-bold text-slate-300">{item.currentStock}</span>
                    <span className="text-[10px] text-slate-500 ml-1">{item.unit} held</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="bg-[#111815] border border-slate-800/80 rounded-xl p-5 shadow-lg">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Boxes className="w-4 h-4 text-teal-400" />
              Category Breakdown
            </h3>
            <span className="text-[11px] text-slate-500">{categoryDist.length} categories</span>
          </div>

          <div className="mt-4 space-y-3">
            {categoryDist.map((cat) => (
              <div key={cat.name} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-300 font-medium">{cat.name}</span>
                  <span className="font-mono text-emerald-400 font-bold">{cat.count} items</span>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full"
                    style={{ width: `${Math.min(100, (cat.count / (summary.totalItems || 1)) * 100)}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}