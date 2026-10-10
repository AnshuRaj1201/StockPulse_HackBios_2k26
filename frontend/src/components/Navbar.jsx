import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import {
  Boxes,
  LayoutDashboard,
  QrCode,
  History,
  AlertTriangle,
  RotateCw,
  Bell,
  CheckCircle,
  Shield,
  Clock,
  Sparkles,
  LogIn,
  LogOut,
  User,
  ChevronDown,
  UserPlus,
  Beaker,
  Utensils,
  BookOpen,
  HeartPulse,
  Building2,
  CalendarDays,
  FileText
} from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, onOpenScanner }) {
  const { user, loginWithRole, logout, openLoginModal } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [showAlertMenu, setShowAlertMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const fetchAlerts = async () => {
    try {
      const data = await api.getAlerts();
      setAlerts(data || []);
    } catch (e) {
      // ignore
    }
  };

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 10000);
    return () => clearInterval(interval);
  }, []);

  const unreadCount = alerts.filter(a => !a.read).length;

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'daily-summary', label: 'Daily Summary', icon: FileText },
    { id: 'inventory', label: 'Inventory', icon: Boxes },
    { id: 'procurement', label: 'AI Sourcing & Dealers', icon: Building2 },
    { id: 'subscriptions', label: 'Scheduled Deliveries', icon: CalendarDays },
    { id: 'reorders', label: 'Smart Reorder', icon: RotateCw },
    { id: 'fefo', label: 'Expiry & FEFO', icon: Clock },
    { id: 'audit', label: 'Audit Trail', icon: History },
  ];

  const getRoleBadge = (role) => {
    if (role === 'admin') {
      return { label: 'Admin', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' };
    }
    if (role === 'staff') {
      return { label: 'Staff', color: 'bg-teal-500/20 text-teal-300 border-teal-500/40' };
    }
    return { label: 'Viewer', color: 'bg-purple-500/20 text-purple-300 border-purple-500/40' };
  };

  const badge = user ? getRoleBadge(user.role) : null;

  return (
    <header className="sticky top-0 z-40 bg-[#0d1411]/95 backdrop-blur-md border-b border-emerald-900/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-black font-black">
              <Boxes className="w-6 h-6 text-black" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-xl tracking-tight text-white">Stock<span className="text-emerald-400">Pulse</span></span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  War Machine
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">Smart Campus &amp; Small Business Ops</p>
            </div>
          </div>

          {/* Desktop Nav Items */}
          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-sm shadow-emerald-500/10 font-bold'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Quick Actions & Role Switcher */}
          <div className="flex items-center space-x-2.5">
            {/* Quick Camera Scan Trigger */}
            <button
              onClick={onOpenScanner}
              className="flex items-center space-x-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-md shadow-emerald-500/20"
              title="Open Barcode / QR Scanner"
            >
              <QrCode className="w-4 h-4 text-black" />
              <span className="hidden sm:inline">Scan &amp; Log</span>
            </button>

            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowAlertMenu(!showAlertMenu);
                  setShowUserMenu(false);
                }}
                className="relative p-2 text-slate-300 hover:text-white bg-slate-800/60 rounded-lg border border-slate-700/60"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-[10px] font-bold text-white rounded-full flex items-center justify-center animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showAlertMenu && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-[#111815] border border-emerald-900/60 rounded-xl shadow-2xl p-4 z-50">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                      <Bell className="w-4 h-4 text-emerald-400" />
                      Live Alerts &amp; Telegram Bot
                    </h4>
                    <span className="text-[11px] text-slate-400">{alerts.length} total</span>
                  </div>
                  <div className="max-h-64 overflow-y-auto mt-2 space-y-2">
                    {alerts.length === 0 ? (
                      <p className="text-xs text-slate-500 text-center py-4">No active warnings or stock-outs</p>
                    ) : (
                      alerts.map((a) => (
                        <div
                          key={a.id}
                          className={`p-2.5 rounded-lg text-xs border ${
                            a.severity === 'CRITICAL'
                              ? 'bg-rose-950/40 border-rose-800/60 text-rose-200'
                              : 'bg-amber-950/30 border-amber-800/50 text-amber-200'
                          }`}
                        >
                          <div className="font-semibold flex items-center justify-between">
                            <span>{a.title}</span>
                            <span className="text-[10px] opacity-75">{new Date(a.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <p className="mt-0.5 text-slate-300">{a.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* DEDICATED WORKING LOGIN / USER PORTAL BUTTON */}
            <div className="relative">
              {user ? (
                /* User profile pill with drop-down */
                <button
                  onClick={() => {
                    setShowUserMenu(!showUserMenu);
                    setShowAlertMenu(false);
                  }}
                  className="flex items-center space-x-2 bg-slate-900/90 hover:bg-slate-800/90 border border-slate-700/80 px-2.5 py-1.5 rounded-xl transition text-left"
                >
                  <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold text-xs">
                    {user.name.charAt(0)}
                  </div>
                  <div className="hidden sm:block">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-white max-w-[110px] truncate">{user.name}</span>
                      <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded border ${badge.color}`}>
                        {badge.label}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 block truncate max-w-[120px]">{user.department}</span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>
              ) : (
                /* When logged out: Prominent Login Button */
                <button
                  onClick={() => openLoginModal('portals')}
                  className="flex items-center space-x-1.5 bg-emerald-500 hover:bg-emerald-400 text-black px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition shadow-lg shadow-emerald-500/25"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Log In</span>
                </button>
              )}

              {/* User / Login Dropdown Menu with Separate Login Buttons for each Role */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-[#111815] border border-emerald-900/60 rounded-xl shadow-2xl p-3 z-50">
                  {user && (
                    <div className="pb-2.5 mb-2.5 border-b border-slate-800">
                      <span className="text-[10px] uppercase font-bold text-slate-500">Active Account</span>
                      <h4 className="text-xs font-bold text-white">{user.name}</h4>
                      <p className="text-[11px] text-slate-400">{user.email}</p>
                      <span className="inline-block mt-1 text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {user.department} &bull; {user.role.toUpperCase()}
                      </span>
                    </div>
                  )}

                  {/* Direct Switch / Role Login Buttons */}
                  <div className="space-y-1 mb-2.5">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block px-1">
                      Switch Role &bull; Dedicated Logins:
                    </span>

                    {/* Admin Login Button */}
                    <button
                      onClick={() => {
                        loginWithRole('admin');
                        setShowUserMenu(false);
                      }}
                      className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs hover:bg-emerald-950/60 text-slate-200 hover:text-emerald-300 transition"
                    >
                      <span className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                        <strong>Admin Portal</strong> (Anshu Raj)
                      </span>
                      <span className="text-[10px] bg-emerald-900/60 text-emerald-300 px-1.5 py-0.2 rounded font-mono">
                        Admin
                      </span>
                    </button>

                    {/* Staff Logins (Dedicated Button for Each Staff Member) */}
                    <button
                      onClick={() => {
                        loginWithRole('staff', 'Chemistry Lab', 'staff.chemistry@campus.edu');
                        setShowUserMenu(false);
                      }}
                      className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs hover:bg-teal-950/60 text-slate-200 hover:text-teal-300 transition"
                    >
                      <span className="flex items-center gap-2">
                        <Beaker className="w-3.5 h-3.5 text-teal-400" />
                        <span>Chemistry Lab Staff (Aditya)</span>
                      </span>
                      <span className="text-[10px] bg-teal-900/60 text-teal-300 px-1.5 py-0.2 rounded font-mono">
                        Staff
                      </span>
                    </button>

                    <button
                      onClick={() => {
                        loginWithRole('staff', 'Central Mess', 'staff.mess@campus.edu');
                        setShowUserMenu(false);
                      }}
                      className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs hover:bg-teal-950/60 text-slate-200 hover:text-teal-300 transition"
                    >
                      <span className="flex items-center gap-2">
                        <Utensils className="w-3.5 h-3.5 text-amber-400" />
                        <span>Central Mess Staff (Akarshan)</span>
                      </span>
                      <span className="text-[10px] bg-teal-900/60 text-teal-300 px-1.5 py-0.2 rounded font-mono">
                        Staff
                      </span>
                    </button>

                    <button
                      onClick={() => {
                        loginWithRole('staff', 'Stationery & Store', 'staff.stationery@campus.edu');
                        setShowUserMenu(false);
                      }}
                      className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs hover:bg-teal-950/60 text-slate-200 hover:text-teal-300 transition"
                    >
                      <span className="flex items-center gap-2">
                        <BookOpen className="w-3.5 h-3.5 text-sky-400" />
                        <span>Stationery Staff (Adil)</span>
                      </span>
                      <span className="text-[10px] bg-teal-900/60 text-teal-300 px-1.5 py-0.2 rounded font-mono">
                        Staff
                      </span>
                    </button>

                    {/* Viewer Login Button */}
                    <button
                      onClick={() => {
                        loginWithRole('viewer');
                        setShowUserMenu(false);
                      }}
                      className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs hover:bg-purple-950/60 text-slate-200 hover:text-purple-300 transition"
                    >
                      <span className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-purple-400"></span>
                        <span>Auditor / Viewer Portal</span>
                      </span>
                      <span className="text-[10px] bg-purple-900/60 text-purple-300 px-1.5 py-0.2 rounded font-mono">
                        Viewer
                      </span>
                    </button>
                  </div>

                  {/* Actions: Open Full Portals Modal / Sign Out */}
                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                    <button
                      onClick={() => {
                        openLoginModal('portals');
                        setShowUserMenu(false);
                      }}
                      className="text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1"
                    >
                      <LogIn className="w-3.5 h-3.5" />
                      <span>All Portals / Sign Up</span>
                    </button>

                    {user && (
                      <button
                        onClick={() => {
                          logout();
                          setShowUserMenu(false);
                        }}
                        className="text-rose-400 hover:text-rose-300 font-semibold flex items-center gap-1"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Sub-Navigation Bar */}
        <div className="flex md:hidden items-center justify-between py-2 border-t border-emerald-950/60 overflow-x-auto space-x-2 text-xs">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center space-x-1 whitespace-nowrap px-2.5 py-1.5 rounded-md ${
                  isActive ? 'bg-emerald-500/20 text-emerald-400 font-bold' : 'text-slate-400'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
}