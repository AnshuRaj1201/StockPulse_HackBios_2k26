import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import {
  Clock,
  AlertTriangle,
  CheckCircle,
  Layers,
  MapPin,
  Calendar,
  Trash2,
  ShieldAlert,
  X
} from 'lucide-react';

export default function ExpiryTracker() {
  const { user } = useAuth();
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState({ error: '', success: '' });

  const loadBatches = async () => {
    try {
      const data = await api.getFefoBatches();
      setBatches(data || []);
    } catch (err) {
      console.error('Failed to load FEFO batches:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBatches();
  }, []);

  const handleMarkWaste = async (batch) => {
    if (!window.confirm(`Mark ${batch.quantity} ${batch.item.unit} of batch ${batch.batchNumber} as expired waste?`)) return;
    try {
      await api.logTransaction({
        itemId: batch.item.id,
        type: 'WASTE',
        quantity: batch.quantity,
        reason: `FEFO Expired Disposal - Batch ${batch.batchNumber}`
      });
      setFeedback({ error: '', success: `Disposed expired batch ${batch.batchNumber}. Stock updated.` });
      loadBatches();
    } catch (err) {
      setFeedback({ error: err.message || 'Failed to dispose batch', success: '' });
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white flex items-center gap-2">
            <Clock className="w-6 h-6 text-purple-400" />
            FEFO (First-Expiry-First-Out) &amp; Expiry Tracker
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Strict batch expiry tracking to eliminate campus chemical, food, and medicine waste
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs bg-purple-950/40 border border-purple-900/60 px-3 py-2 rounded-xl text-purple-300">
          <ShieldAlert className="w-4 h-4 flex-shrink-0 text-purple-400" />
          <span>Earliest expiring batches are automatically issued first</span>
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
            <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>{feedback.success}</span>
          </div>
          <button onClick={() => setFeedback({ ...feedback, success: '' })}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Batch Cards Grid */}
      {loading ? (
        <div className="text-center py-12 text-slate-400 text-xs">Loading FEFO batches...</div>
      ) : batches.length === 0 ? (
        <div className="bg-[#111815] border border-slate-800/80 rounded-xl p-8 text-center text-slate-400 text-xs">
          No active batches with expiration dates tracked yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {batches.map((batch, index) => {
            const isCritical = batch.statusLabel === 'CRITICAL_NEAR_EXPIRY' || batch.statusLabel === 'EXPIRED';
            const isWarning = batch.statusLabel === 'WARNING_EXPIRING_SOON';

            return (
              <div
                key={batch.id}
                className={`bg-[#111815] rounded-xl p-4 border transition flex flex-col justify-between shadow-md relative ${
                  isCritical
                    ? 'border-rose-900/70 bg-gradient-to-b from-[#190d10] to-[#111815]'
                    : isWarning
                    ? 'border-amber-900/60 bg-gradient-to-b from-[#18130c] to-[#111815]'
                    : 'border-slate-800/80'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-slate-900 text-purple-300 border border-purple-900/40">
                      Priority #{index + 1} for Issuance
                    </span>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        batch.statusLabel === 'EXPIRED'
                          ? 'bg-rose-950 text-rose-300 border border-rose-800'
                          : batch.statusLabel === 'CRITICAL_NEAR_EXPIRY'
                          ? 'bg-rose-950 text-rose-300 border border-rose-800 animate-pulse'
                          : batch.statusLabel === 'WARNING_EXPIRING_SOON'
                          ? 'bg-amber-950 text-amber-300 border border-amber-800'
                          : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      }`}
                    >
                      {batch.daysRemaining !== null
                        ? batch.daysRemaining < 0
                          ? 'EXPIRED'
                          : `${batch.daysRemaining} days left`
                        : 'No Expiry'}
                    </span>
                  </div>

                  <h3 className="font-bold text-white text-base mt-2">
                    {batch.item.name}
                  </h3>

                  <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                    <span className="font-mono text-emerald-400">{batch.batchNumber}</span>
                    <span>&bull;</span>
                    <span className="text-slate-300">{batch.item.department}</span>
                  </div>

                  <div className="mt-3 p-3 bg-slate-900/80 rounded-lg space-y-1.5 text-xs text-slate-300">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Batch Quantity:</span>
                      <span className="font-bold text-white font-mono">{batch.quantity} {batch.item.unit}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-500" />
                        Storage Bin:
                      </span>
                      <span className="font-medium text-slate-200">{batch.location}</span>
                    </div>
                    {batch.expiryDate && (
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400 flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-500" />
                          Expiry Date:
                        </span>
                        <span className="font-mono font-semibold text-slate-200">
                          {new Date(batch.expiryDate).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {isCritical && user?.role !== 'viewer' && (
                  <div className="mt-4 pt-3 border-t border-slate-800/80">
                    <button
                      onClick={() => handleMarkWaste(batch)}
                      className="w-full flex items-center justify-center space-x-1.5 py-1.5 rounded-lg bg-rose-950/80 hover:bg-rose-900 border border-rose-800/60 text-rose-300 text-xs font-bold transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Dispose Expired Waste</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}