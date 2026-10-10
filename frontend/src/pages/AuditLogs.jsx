import React, { useState, useEffect } from 'react';
import { api } from '../api';
import {
  History,
  Shield,
  User,
  ArrowUpRight,
  ArrowDownLeft,
  CheckCircle2,
  FileText,
  Clock,
  Search
} from 'lucide-react';

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [activeSubTab, setActiveSubTab] = useState('transactions'); // 'transactions' or 'admin'
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [txs, auditLogs] = await Promise.all([
          api.getTransactions(),
          api.getAuditLogs()
        ]);
        setTransactions(txs || []);
        setLogs(auditLogs || []);
      } catch (err) {
        console.error('Failed to load audit logs:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredTxs = transactions.filter((t) => {
    const q = search.toLowerCase();
    return (
      t.item?.name?.toLowerCase().includes(q) ||
      t.performedBy?.toLowerCase().includes(q) ||
      t.reason?.toLowerCase().includes(q)
    );
  });

  const filteredLogs = logs.filter((l) => {
    const q = search.toLowerCase();
    return (
      l.details?.toLowerCase().includes(q) ||
      l.performedBy?.toLowerCase().includes(q) ||
      l.action?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white flex items-center gap-2">
            <History className="w-6 h-6 text-emerald-400" />
            Audit Trail &amp; Accountability
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Immutable log of all inventory movements, approvals, and system adjustments
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex bg-[#111815] border border-slate-800 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setActiveSubTab('transactions')}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeSubTab === 'transactions'
                ? 'bg-emerald-500 text-black shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Stock In/Out Logs ({transactions.length})
          </button>
          <button
            onClick={() => setActiveSubTab('admin')}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeSubTab === 'admin'
                ? 'bg-emerald-500 text-black shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            System &amp; Approval Audit ({logs.length})
          </button>
        </div>
      </div>

      {/* Search Filter */}
      <div className="bg-[#111815] border border-slate-800/80 rounded-xl p-3">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by user, item name, or reason..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Tab 1: Stock Transactions Log */}
      {activeSubTab === 'transactions' && (
        <div className="bg-[#111815] border border-slate-800/80 rounded-xl p-5 shadow-lg overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300 min-w-[650px]">
            <thead className="text-[11px] text-slate-400 uppercase bg-slate-900/60 border-b border-slate-800 font-mono">
              <tr>
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">Type</th>
                <th className="py-2.5 px-3">Item / Department</th>
                <th className="py-2.5 px-3">Delta</th>
                <th className="py-2.5 px-3">Stock Before &rarr; After</th>
                <th className="py-2.5 px-3">Reason</th>
                <th className="py-2.5 px-3">Logged By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {filteredTxs.map((t) => {
                const isIn = t.type === 'IN';
                const isWaste = t.type === 'WASTE';

                return (
                  <tr key={t.id} className="hover:bg-slate-900/30">
                    <td className="py-3 px-3 text-[11px] text-slate-400">
                      {new Date(t.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          isIn
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : isWaste
                            ? 'bg-purple-950 text-purple-300 border border-purple-800'
                            : 'bg-rose-950 text-rose-300 border border-rose-800'
                        }`}
                      >
                        {t.type}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-sans">
                      <p className="font-bold text-white">{t.item?.name}</p>
                      <p className="text-[10px] text-slate-400">{t.item?.department}</p>
                    </td>
                    <td className="py-3 px-3 font-bold">
                      <span className={isIn ? 'text-emerald-400' : 'text-rose-400'}>
                        {isIn ? `+${t.quantity}` : `-${t.quantity}`} {t.item?.unit}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-300">
                      {t.previousStock} &rarr; <span className="text-white font-bold">{t.newStock}</span>
                    </td>
                    <td className="py-3 px-3 font-sans text-slate-300 text-xs">
                      {t.reason}
                    </td>
                    <td className="py-3 px-3 font-sans text-slate-300">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-500" />
                        <span>{t.performedBy}</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 2: System & Approvals Audit */}
      {activeSubTab === 'admin' && (
        <div className="bg-[#111815] border border-slate-800/80 rounded-xl p-5 shadow-lg">
          <div className="space-y-3">
            {filteredLogs.map((log) => (
              <div
                key={log.id}
                className="p-3.5 bg-slate-900/60 rounded-xl border border-slate-800/80 flex items-start justify-between gap-3 text-xs"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mt-0.5">
                    <Shield className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white uppercase text-[11px] tracking-wide font-mono">
                        {log.action}
                      </span>
                      <span className="text-slate-500">&bull;</span>
                      <span className="text-slate-400 font-semibold">{log.entity}</span>
                    </div>
                    <p className="text-slate-300 mt-1">{log.details}</p>
                  </div>
                </div>

                <div className="text-right flex-shrink-0 text-[11px]">
                  <span className="text-slate-300 font-medium block">{log.performedBy}</span>
                  <span className="text-slate-500">
                    {new Date(log.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}