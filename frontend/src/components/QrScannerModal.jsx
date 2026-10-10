import React, { useState, useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { api } from '../api';
import {
  X,
  Camera,
  CheckCircle,
  AlertTriangle,
  Plus,
  Minus,
  ArrowRight,
  Package,
  Layers,
  Sparkles
} from 'lucide-react';

export default function QrScannerModal({ isOpen, onClose, onStockUpdated }) {
  const [scannedResult, setScannedResult] = useState('');
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [quickQty, setQuickQty] = useState(1);
  const [reason, setReason] = useState('Routine Usage');
  const scannerRef = useRef(null);

  useEffect(() => {
    if (!isOpen) {
      setItem(null);
      setScannedResult('');
      setError('');
      setSuccessMsg('');
      return;
    }

    let scannerInstance = null;

    // Small delay to ensure the DOM element exists
    const timer = setTimeout(() => {
      try {
        const scannerElement = document.getElementById('reader');
        if (scannerElement) {
          scannerInstance = new Html5QrcodeScanner(
            'reader',
            {
              fps: 10,
              qrbox: { width: 240, height: 240 },
              rememberLastUsedCamera: true
            },
            false
          );

          scannerInstance.render(
            (decodedText) => {
              handleBarcodeScanned(decodedText);
            },
            (errorMessage) => {
              // ignore scan cycle misses
            }
          );
          scannerRef.current = scannerInstance;
        }
      } catch (err) {
        console.warn('Scanner init error (camera access may require permission):', err);
      }
    }, 250);

    return () => {
      clearTimeout(timer);
      if (scannerRef.current) {
        try {
          scannerRef.current.clear();
        } catch (e) {
          // ignore
        }
      }
    };
  }, [isOpen]);

  const handleBarcodeScanned = async (code) => {
    setScannedResult(code);
    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      const data = await api.getItemByBarcode(code);
      setItem(data);
    } catch (err) {
      setError(err.message || 'Item not found for code: ' + code);
      setItem(null);
    } finally {
      setLoading(false);
    }
  };

  const handleStockAdjustment = async (delta) => {
    if (!item) return;
    setLoading(true);
    setError('');
    setSuccessMsg('');
    try {
      const res = await api.quickAdjustStock(item.id, delta * quickQty, reason);
      setItem((prev) => ({
        ...prev,
        currentStock: res.item.currentStock,
        isLowStock: res.item.currentStock <= prev.minThreshold
      }));
      setSuccessMsg(
        `Successfully ${delta > 0 ? 'added' : 'issued'} ${quickQty} ${item.unit}. New Stock: ${res.item.currentStock}`
      );
      if (onStockUpdated) onStockUpdated();
    } catch (err) {
      setError(err.message || 'Stock adjustment failed');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-[#111815] border border-emerald-900/60 rounded-2xl w-full max-w-xl p-5 sm:p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white bg-slate-800/80 rounded-lg p-1.5 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-2.5 mb-4">
          <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <Camera className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Scan Barcode / QR Code</h3>
            <p className="text-xs text-slate-400">Scan via phone/laptop camera or use quick 1-tap simulation</p>
          </div>
        </div>

        {/* Live Camera Scanner Container */}
        <div className="bg-[#0a0f0d] rounded-xl border border-emerald-950 p-2 overflow-hidden mb-4">
          <div id="reader" className="w-full text-slate-300"></div>
          <p className="text-[11px] text-center text-slate-500 py-1">
            Center barcode or QR in camera frame to scan automatically
          </p>
        </div>

        {/* Quick Demo Simulator Barcode Buttons */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2 font-medium">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              Demo Simulator (1-Tap Barcode Tests)
            </span>
            <span className="text-[10px] text-slate-500">Click to test instant scan</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
            <button
              onClick={() => handleBarcodeScanned('890123456781')}
              className="px-2.5 py-1.5 bg-slate-800/70 hover:bg-emerald-900/40 hover:border-emerald-500/50 border border-slate-700/60 rounded-lg text-left transition"
            >
              <span className="font-semibold block text-emerald-300 truncate">Nitrile Gloves</span>
              <span className="text-[10px] text-slate-400 font-mono">890123456781</span>
            </button>
            <button
              onClick={() => handleBarcodeScanned('890123456782')}
              className="px-2.5 py-1.5 bg-slate-800/70 hover:bg-emerald-900/40 hover:border-emerald-500/50 border border-slate-700/60 rounded-lg text-left transition"
            >
              <span className="font-semibold block text-emerald-300 truncate">HCl 1M Reagent</span>
              <span className="text-[10px] text-slate-400 font-mono">890123456782</span>
            </button>
            <button
              onClick={() => handleBarcodeScanned('890123456783')}
              className="px-2.5 py-1.5 bg-slate-800/70 hover:bg-emerald-900/40 hover:border-emerald-500/50 border border-slate-700/60 rounded-lg text-left transition"
            >
              <span className="font-semibold block text-emerald-300 truncate">Mess Cooking Oil</span>
              <span className="text-[10px] text-slate-400 font-mono">890123456783</span>
            </button>
            <button
              onClick={() => handleBarcodeScanned('890123456786')}
              className="px-2.5 py-1.5 bg-slate-800/70 hover:bg-emerald-900/40 hover:border-emerald-500/50 border border-slate-700/60 rounded-lg text-left transition"
            >
              <span className="font-semibold block text-emerald-300 truncate">Paracetamol 500mg</span>
              <span className="text-[10px] text-slate-400 font-mono">890123456786</span>
            </button>
            <button
              onClick={() => handleBarcodeScanned('890123456785')}
              className="px-2.5 py-1.5 bg-slate-800/70 hover:bg-emerald-900/40 hover:border-emerald-500/50 border border-slate-700/60 rounded-lg text-left transition"
            >
              <span className="font-semibold block text-emerald-300 truncate">Blue Gel Pens</span>
              <span className="text-[10px] text-slate-400 font-mono">890123456785</span>
            </button>
            <button
              onClick={() => handleBarcodeScanned('890123456784')}
              className="px-2.5 py-1.5 bg-slate-800/70 hover:bg-emerald-900/40 hover:border-emerald-500/50 border border-slate-700/60 rounded-lg text-left transition"
            >
              <span className="font-semibold block text-emerald-300 truncate">Basmati Rice 25kg</span>
              <span className="text-[10px] text-slate-400 font-mono">890123456784</span>
            </button>
          </div>
        </div>

        {/* Feedback Messages */}
        {error && (
          <div className="p-3 mb-3 bg-rose-950/60 border border-rose-800 text-rose-300 text-xs rounded-xl flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}
        {successMsg && (
          <div className="p-3 mb-3 bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs rounded-xl flex items-center gap-2">
            <CheckCircle className="w-4 h-4 flex-shrink-0 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Scanned Item Detail & Fast Logging Actions */}
        {item && (
          <div className="p-4 bg-[#0a0f0d] border border-emerald-800/50 rounded-xl">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  {item.department} &bull; {item.category}
                </span>
                <h4 className="text-base font-bold text-white mt-1">{item.name}</h4>
                <p className="text-xs text-slate-400 font-mono">SKU: {item.sku} | Barcode: {item.barcode}</p>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400 block">Available Stock</span>
                <span className={`text-2xl font-black ${item.isLowStock ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {item.currentStock} <span className="text-xs font-normal text-slate-300">{item.unit}</span>
                </span>
              </div>
            </div>

            {/* Quick Action Controls */}
            <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center space-x-2">
                <label className="text-xs text-slate-400">Qty:</label>
                <div className="flex items-center border border-slate-700 rounded-lg overflow-hidden bg-slate-900">
                  <button
                    onClick={() => setQuickQty(Math.max(1, quickQty - 1))}
                    className="px-2.5 py-1 text-slate-300 hover:bg-slate-800"
                  >
                    -
                  </button>
                  <span className="px-3 py-1 text-xs font-mono font-bold text-white">{quickQty}</span>
                  <button
                    onClick={() => setQuickQty(quickQty + 1)}
                    className="px-2.5 py-1 text-slate-300 hover:bg-slate-800"
                  >
                    +
                  </button>
                </div>

                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="bg-slate-900 text-xs text-slate-200 border border-slate-700 rounded-lg px-2 py-1.5 focus:outline-none focus:border-emerald-500"
                >
                  <option value="Routine Usage">Routine Usage</option>
                  <option value="Lab Practical Session">Lab Practical Session</option>
                  <option value="Canteen Daily Prep">Canteen Daily Prep</option>
                  <option value="Restock Delivery">Restock Delivery</option>
                  <option value="Wastage / Expired">Wastage / Expired</option>
                </select>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  disabled={loading || item.currentStock <= 0}
                  onClick={() => handleStockAdjustment(-1)}
                  className="flex-1 sm:flex-none flex items-center justify-center space-x-1 px-4 py-2 rounded-lg bg-rose-600/80 hover:bg-rose-500 text-white font-bold text-xs transition disabled:opacity-50"
                >
                  <Minus className="w-3.5 h-3.5" />
                  <span>Issue (-{quickQty})</span>
                </button>
                <button
                  disabled={loading}
                  onClick={() => handleStockAdjustment(1)}
                  className="flex-1 sm:flex-none flex items-center justify-center space-x-1 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-black font-bold text-xs transition disabled:opacity-50"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add (+{quickQty})</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}