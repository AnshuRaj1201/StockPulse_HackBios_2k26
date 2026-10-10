import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, Printer, QrCode, Tag } from 'lucide-react';

export default function PrintableQrModal({ item, isOpen, onClose }) {
  if (!isOpen || !item) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#111815] border border-emerald-900/60 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white bg-slate-800/80 rounded-lg p-1.5 transition no-print"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-2 text-emerald-400 mb-4 no-print">
          <Tag className="w-5 h-5" />
          <h3 className="font-bold text-white text-base">Printable QR Label Card</h3>
        </div>

        {/* Printable Area Card */}
        <div className="print-area bg-white text-black p-6 rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center text-center shadow-inner">
          <div className="w-full flex items-center justify-between pb-3 mb-3 border-b border-slate-200">
            <span className="font-black text-sm tracking-tight text-emerald-700">STOCKPULSE</span>
            <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 px-2 py-0.5 rounded text-slate-600">
              {item.department}
            </span>
          </div>

          {/* QR Code */}
          <div className="p-3 bg-white border border-slate-200 rounded-lg shadow-sm my-2">
            <QRCodeSVG
              value={item.barcode || item.sku}
              size={160}
              level="H"
              includeMargin={true}
            />
          </div>

          <h4 className="font-extrabold text-base text-slate-900 mt-2 px-2 leading-tight">
            {item.name}
          </h4>

          <div className="flex items-center gap-3 text-xs font-mono font-semibold text-slate-700 mt-1">
            <span>SKU: {item.sku}</span>
            <span>&bull;</span>
            <span>Code: {item.barcode}</span>
          </div>

          <div className="mt-3 pt-2 w-full border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Reorder Point: {item.minThreshold} {item.unit}</span>
            <span>Supplier: {item.supplierName}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex items-center justify-end space-x-3 no-print">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold"
          >
            Close
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold transition shadow-lg shadow-emerald-500/20"
          >
            <Printer className="w-4 h-4" />
            <span>Print Label Card</span>
          </button>
        </div>
      </div>
    </div>
  );
}