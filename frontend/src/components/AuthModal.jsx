import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import {
  ShieldCheck,
  UserCheck,
  Eye,
  KeyRound,
  UserPlus,
  LogIn,
  X,
  Sparkles,
  Building,
  CheckCircle2,
  AlertTriangle,
  Beaker,
  Utensils,
  BookOpen,
  HeartPulse
} from 'lucide-react';

export default function AuthModal() {
  const {
    user,
    isAuthModalOpen,
    closeLoginModal,
    loginWithCredentials,
    signup,
    loginWithRole,
    loading,
    activeAuthTab,
    setActiveAuthTab
  } = useAuth();

  // Mode: 'portals' (role cards) or 'form' (password credentials)
  const [viewMode, setViewMode] = useState('portals');
  const [formMode, setFormMode] = useState('login'); // 'login' or 'signup'
  const [selectedRole, setSelectedRole] = useState('staff'); // 'admin', 'staff', 'viewer'

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [department, setDepartment] = useState('Chemistry Lab');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (activeAuthTab === 'signup') {
      setViewMode('form');
      setFormMode('signup');
    } else if (activeAuthTab === 'admin') {
      setViewMode('form');
      setFormMode('login');
      setSelectedRole('admin');
      setEmail('admin@campus.edu');
    } else if (activeAuthTab === 'staff') {
      setViewMode('form');
      setFormMode('login');
      setSelectedRole('staff');
      setEmail('staff.chemistry@campus.edu');
    } else if (activeAuthTab === 'viewer') {
      setViewMode('form');
      setFormMode('login');
      setSelectedRole('viewer');
      setEmail('viewer@campus.edu');
    } else {
      setViewMode('portals');
    }
    setError('');
    setSuccess('');
  }, [activeAuthTab, isAuthModalOpen]);

  if (!isAuthModalOpen) return null;

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (formMode === 'login') {
      const res = await loginWithCredentials(email, password, selectedRole);
      if (!res.success) {
        setError(res.error || 'Login failed. Please check your credentials.');
      }
    } else {
      const res = await signup({
        name,
        email,
        password,
        role: selectedRole,
        department
      });
      if (!res.success) {
        setError(res.error || 'Signup failed. Please try again.');
      } else {
        setSuccess('Account created successfully! Welcome to StockPulse.');
      }
    }
  };

  const openFormForRole = (role, defaultEmail = '') => {
    setSelectedRole(role);
    setEmail(defaultEmail);
    setPassword('');
    setViewMode('form');
    setFormMode('login');
    setError('');
  };

  const openSignupForRole = (role) => {
    setSelectedRole(role);
    setName('');
    setEmail('');
    setPassword('');
    setViewMode('form');
    setFormMode('signup');
    setError('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-[#111815] border border-emerald-900/60 rounded-2xl w-full max-w-2xl p-5 sm:p-7 shadow-2xl relative my-8 max-h-[92vh] overflow-y-auto">
        {/* Close Button (if user is logged in, allow closing) */}
        {user && (
          <button
            onClick={closeLoginModal}
            className="absolute top-4 right-4 text-slate-400 hover:text-white bg-slate-800/80 rounded-lg p-1.5 transition"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Modal Header */}
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-black font-black flex-shrink-0">
            <KeyRound className="w-6 h-6 text-black" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                Stock<span className="text-emerald-400">Pulse</span> Authentication
              </h2>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                War Machine
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Select your role portal or log in with credentials to manage campus inventory
            </p>
          </div>
        </div>

        {/* Tab switch between Portals view and Custom Credentials view */}
        <div className="flex bg-slate-900/90 p-1 rounded-xl border border-slate-800 text-xs font-semibold mb-6">
          <button
            onClick={() => {
              setViewMode('portals');
              setError('');
            }}
            className={`flex-1 py-2 rounded-lg transition flex items-center justify-center gap-1.5 ${
              viewMode === 'portals'
                ? 'bg-emerald-500 text-black font-extrabold shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Role Portals (Dedicated Login Buttons)</span>
          </button>
          <button
            onClick={() => {
              setViewMode('form');
              setError('');
            }}
            className={`flex-1 py-2 rounded-lg transition flex items-center justify-center gap-1.5 ${
              viewMode === 'form'
                ? 'bg-emerald-500 text-black font-extrabold shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <LogIn className="w-4 h-4" />
            <span>Email &amp; Password Login / Sign Up</span>
          </button>
        </div>

        {/* Error / Success Feedback */}
        {error && (
          <div className="p-3 mb-4 bg-rose-950/60 border border-rose-800 text-rose-300 text-xs rounded-xl flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="p-3 mb-4 bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs rounded-xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400" />
            <span>{success}</span>
          </div>
        )}

        {/* ----------------- VIEW MODE 1: DEDICATED ROLE PORTALS ----------------- */}
        {viewMode === 'portals' && (
          <div className="space-y-4">
            {/* 1. ADMIN PORTAL CARD */}
            <div className="bg-[#0e1612] border border-emerald-900/50 hover:border-emerald-500/50 rounded-xl p-4 transition shadow-md">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex-shrink-0">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-white text-sm sm:text-base">Admin Portal</h3>
                      <span className="text-[10px] bg-emerald-950 border border-emerald-800 text-emerald-300 px-2 py-0.2 rounded font-mono">
                        Full Authority
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Purchase orders approval, inventory catalog management &amp; threshold control
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1 font-mono">
                      Lead: <strong className="text-slate-300">Anshu Raj (admin@campus.edu)</strong>
                    </p>
                  </div>
                </div>

                {/* Separate Admin Login & Signup Buttons */}
                <div className="flex flex-wrap sm:flex-col gap-2">
                  <button
                    disabled={loading}
                    onClick={() => loginWithRole('admin')}
                    className="flex-1 sm:flex-none flex items-center justify-center space-x-1.5 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs transition shadow-md shadow-emerald-500/20 disabled:opacity-50"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>Admin Login</span>
                  </button>
                  <button
                    onClick={() => openSignupForRole('admin')}
                    className="flex-1 sm:flex-none flex items-center justify-center space-x-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-semibold border border-slate-700 transition"
                  >
                    <UserPlus className="w-3 h-3 text-emerald-400" />
                    <span>Admin Sign Up</span>
                  </button>
                </div>
              </div>
            </div>

            {/* 2. STAFF PORTAL CARD (EACH STAFF HAS ITS OWN LOGIN BUTTON) */}
            <div className="bg-[#0e1612] border border-teal-900/50 hover:border-teal-500/50 rounded-xl p-4 transition shadow-md">
              <div className="flex items-start gap-3 mb-3">
                <div className="p-2.5 rounded-lg bg-teal-500/20 text-teal-400 border border-teal-500/30 flex-shrink-0">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-white text-sm sm:text-base">Staff Operations Portal</h3>
                    <span className="text-[10px] bg-teal-950 border border-teal-800 text-teal-300 px-2 py-0.2 rounded font-mono">
                      Department Staff
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Log stock movements, scan barcodes with camera, and receive delivery shipments
                  </p>
                </div>
              </div>

              {/* Dedicated Buttons for Each Staff Member */}
              <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800 mb-3">
                <span className="text-[11px] uppercase tracking-wider text-slate-400 font-bold block mb-2">
                  1-Tap Staff Direct Login (By Department):
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {/* Chemistry Lab Staff */}
                  <button
                    disabled={loading}
                    onClick={() => loginWithRole('staff', 'Chemistry Lab', 'staff.chemistry@campus.edu')}
                    className="flex items-center space-x-2.5 px-3 py-2 rounded-lg bg-slate-800/80 hover:bg-emerald-950/60 hover:border-emerald-500/50 border border-slate-700 text-left transition"
                  >
                    <Beaker className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <div className="truncate">
                      <span className="text-xs font-bold text-white block truncate">Chemistry Lab In-charge</span>
                      <span className="text-[10px] text-slate-400 block truncate">Aditya Yadaw</span>
                    </div>
                  </button>

                  {/* Central Mess Staff */}
                  <button
                    disabled={loading}
                    onClick={() => loginWithRole('staff', 'Central Mess', 'staff.mess@campus.edu')}
                    className="flex items-center space-x-2.5 px-3 py-2 rounded-lg bg-slate-800/80 hover:bg-emerald-950/60 hover:border-emerald-500/50 border border-slate-700 text-left transition"
                  >
                    <Utensils className="w-4 h-4 text-amber-400 flex-shrink-0" />
                    <div className="truncate">
                      <span className="text-xs font-bold text-white block truncate">Central Mess &amp; Canteen</span>
                      <span className="text-[10px] text-slate-400 block truncate">Akarshan Mishra</span>
                    </div>
                  </button>

                  {/* Stationery Staff */}
                  <button
                    disabled={loading}
                    onClick={() => loginWithRole('staff', 'Stationery & Store', 'staff.stationery@campus.edu')}
                    className="flex items-center space-x-2.5 px-3 py-2 rounded-lg bg-slate-800/80 hover:bg-emerald-950/60 hover:border-emerald-500/50 border border-slate-700 text-left transition"
                  >
                    <BookOpen className="w-4 h-4 text-sky-400 flex-shrink-0" />
                    <div className="truncate">
                      <span className="text-xs font-bold text-white block truncate">Stationery Store In-charge</span>
                      <span className="text-[10px] text-slate-400 block truncate">Md. Adil Mokarram</span>
                    </div>
                  </button>

                  {/* Campus Health Staff */}
                  <button
                    disabled={loading}
                    onClick={() => loginWithRole('staff', 'Campus Health Center', 'staff.health@campus.edu')}
                    className="flex items-center space-x-2.5 px-3 py-2 rounded-lg bg-slate-800/80 hover:bg-emerald-950/60 hover:border-emerald-500/50 border border-slate-700 text-left transition"
                  >
                    <HeartPulse className="w-4 h-4 text-rose-400 flex-shrink-0" />
                    <div className="truncate">
                      <span className="text-xs font-bold text-white block truncate">Campus Health Center</span>
                      <span className="text-[10px] text-slate-400 block truncate">Dispensary Staff</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Staff Password Login & Signup Buttons */}
              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => openFormForRole('staff')}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700 transition"
                >
                  Staff Password Login
                </button>
                <button
                  onClick={() => openSignupForRole('staff')}
                  className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition shadow-sm"
                >
                  Register New Staff Account
                </button>
              </div>
            </div>

            {/* 3. VIEWER / AUDITOR PORTAL CARD */}
            <div className="bg-[#0e1612] border border-purple-900/50 hover:border-purple-500/50 rounded-xl p-4 transition shadow-md">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-lg bg-purple-500/20 text-purple-400 border border-purple-500/30 flex-shrink-0">
                    <Eye className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-white text-sm sm:text-base">Auditor / Viewer Portal</h3>
                      <span className="text-[10px] bg-purple-950 border border-purple-800 text-purple-300 px-2 py-0.2 rounded font-mono">
                        Read-Only Inspection
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Inspect stock visibility, audit log records, and analytics trends
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1 font-mono">
                      Guest: <strong className="text-slate-300">Campus Auditor (viewer@campus.edu)</strong>
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap sm:flex-col gap-2">
                  <button
                    disabled={loading}
                    onClick={() => loginWithRole('viewer')}
                    className="flex-1 sm:flex-none flex items-center justify-center space-x-1.5 px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs transition shadow-md shadow-purple-600/20 disabled:opacity-50"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>Viewer Login</span>
                  </button>
                  <button
                    onClick={() => openSignupForRole('viewer')}
                    className="flex-1 sm:flex-none flex items-center justify-center space-x-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-semibold border border-slate-700 transition"
                  >
                    <UserPlus className="w-3 h-3 text-purple-400" />
                    <span>Viewer Sign Up</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ----------------- VIEW MODE 2: CUSTOM CREDENTIALS & SIGNUP FORM ----------------- */}
        {viewMode === 'form' && (
          <form onSubmit={handleFormSubmit} className="space-y-4">
            {/* Toggle: Sign In vs Sign Up */}
            <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs font-semibold mb-4">
              <button
                type="button"
                onClick={() => {
                  setFormMode('login');
                  setError('');
                }}
                className={`flex-1 py-1.5 rounded-lg transition ${
                  formMode === 'login'
                    ? 'bg-emerald-500 text-black font-bold shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Sign In With Password
              </button>
              <button
                type="button"
                onClick={() => {
                  setFormMode('signup');
                  setError('');
                }}
                className={`flex-1 py-1.5 rounded-lg transition ${
                  formMode === 'signup'
                    ? 'bg-emerald-500 text-black font-bold shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Create New Account (Sign Up)
              </button>
            </div>

            {/* Role Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Select Portal Role *
              </label>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setSelectedRole('admin')}
                  className={`p-2.5 rounded-lg border text-center transition font-semibold ${
                    selectedRole === 'admin'
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4 mx-auto mb-1 text-emerald-400" />
                  <span>Admin</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedRole('staff')}
                  className={`p-2.5 rounded-lg border text-center transition font-semibold ${
                    selectedRole === 'staff'
                      ? 'bg-teal-500/20 border-teal-500 text-teal-300'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <UserCheck className="w-4 h-4 mx-auto mb-1 text-teal-400" />
                  <span>Staff</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedRole('viewer')}
                  className={`p-2.5 rounded-lg border text-center transition font-semibold ${
                    selectedRole === 'viewer'
                      ? 'bg-purple-500/20 border-purple-500 text-purple-300'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <Eye className="w-4 h-4 mx-auto mb-1 text-purple-400" />
                  <span>Viewer</span>
                </button>
              </div>
            </div>

            {/* Name input (only on Signup) */}
            {formMode === 'signup' && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
            )}

            {/* Department input (for staff on Signup) */}
            {formMode === 'signup' && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Department / Store Unit *
                </label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                >
                  <option value="Chemistry Lab">Chemistry Lab</option>
                  <option value="Central Mess">Central Mess</option>
                  <option value="Stationery & Store">Stationery & Store</option>
                  <option value="Campus Health Center">Campus Health Center</option>
                  <option value="Procurement & Labs">Procurement & Labs</option>
                  <option value="Finance Inspection">Finance Inspection</option>
                  <option value="General">General Store</option>
                </select>
              </div>
            )}

            {/* Email Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Email Address *
              </label>
              <input
                type="email"
                required
                placeholder="e.g. name@campus.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Password *
              </label>
              <input
                type="password"
                required
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
              {formMode === 'login' && (
                <p className="text-[11px] text-slate-500 mt-1">
                  Default Demo Passwords: <code className="text-slate-400">admin123</code> &bull; <code className="text-slate-400">staff123</code> &bull; <code className="text-slate-400">viewer123</code>
                </p>
              )}
            </div>

            {/* Submit Button */}
            <div className="pt-2 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setViewMode('portals')}
                className="text-xs text-slate-400 hover:text-white"
              >
                &larr; Back to Role Portals
              </button>

              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs transition shadow-lg shadow-emerald-500/25 disabled:opacity-50"
              >
                {loading
                  ? 'Processing...'
                  : formMode === 'login'
                  ? `Sign In as ${selectedRole.toUpperCase()}`
                  : `Create ${selectedRole.toUpperCase()} Account`}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}