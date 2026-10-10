import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import QrScannerModal from './components/QrScannerModal';
import AuthModal from './components/AuthModal';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import Reorders from './pages/Reorders';
import ExpiryTracker from './pages/ExpiryTracker';
import AuditLogs from './pages/AuditLogs';
import ProcurementHub from './pages/ProcurementHub';
import Subscriptions from './pages/Subscriptions';
import DailySummary from './pages/DailySummary';

function MainLayout() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleStockUpdated = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className="min-h-screen bg-[#0a0f0d] text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-black">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenScanner={() => setIsScannerOpen(true)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {activeTab === 'dashboard' && (
          <Dashboard
            key={refreshTrigger}
            setActiveTab={setActiveTab}
            onOpenScanner={() => setIsScannerOpen(true)}
          />
        )}
        {activeTab === 'daily-summary' && (
          <DailySummary setActiveTab={setActiveTab} key={refreshTrigger} />
        )}
        {activeTab === 'inventory' && <Inventory key={refreshTrigger} />}
        {activeTab === 'procurement' && <ProcurementHub key={refreshTrigger} />}
        {activeTab === 'subscriptions' && <Subscriptions key={refreshTrigger} />}
        {activeTab === 'reorders' && <Reorders key={refreshTrigger} />}
        {activeTab === 'fefo' && <ExpiryTracker key={refreshTrigger} />}
        {activeTab === 'audit' && <AuditLogs key={refreshTrigger} />}
      </main>

      {/* QR/Barcode Camera Scanner Modal */}
      <QrScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onStockUpdated={handleStockUpdated}
      />

      {/* Multi-Role Authentication & Login Modal */}
      <AuthModal />

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-[#0d1411] py-4 text-center text-xs text-slate-500">
        <p className="flex items-center justify-center gap-1">
          StockPulse &bull; Built for <strong className="text-emerald-400 font-bold">HACKBIOS</strong> by{' '}
          <strong className="text-white font-bold">Team War Machine</strong>
        </p>
        <p className="text-[11px] text-slate-600 mt-0.5">
          Anshu Raj &bull; Aditya Kumar Yadaw &bull; Akarshan Mishra &bull; Md. Adil Mokarram
        </p>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainLayout />
    </AuthProvider>
  );
}