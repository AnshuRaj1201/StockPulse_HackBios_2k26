import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('stockpulse_user');
    if (savedUser) {
      try {
        return JSON.parse(savedUser);
      } catch (e) {
        // fallback
      }
    }
    return {
      id: 'demo-admin',
      name: 'Anshu Raj (Admin)',
      email: 'admin@campus.edu',
      role: 'admin',
      department: 'Procurement & Labs'
    };
  });
  const [loading, setLoading] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [activeAuthTab, setActiveAuthTab] = useState('portals'); // 'portals', 'admin', 'staff', 'viewer', 'signup'

  const openLoginModal = (targetTab = 'portals') => {
    setActiveAuthTab(targetTab);
    setIsAuthModalOpen(true);
  };

  const closeLoginModal = () => {
    setIsAuthModalOpen(false);
  };

  const loginWithCredentials = async (email, password, expectedRole) => {
    setLoading(true);
    try {
      const res = await api.login(email, password, expectedRole);
      localStorage.setItem('stockpulse_token', res.token);
      localStorage.setItem('stockpulse_user', JSON.stringify(res.user));
      setUser(res.user);
      setIsAuthModalOpen(false);
      return { success: true, user: res.user };
    } catch (err) {
      return { success: false, error: err.message || 'Login failed' };
    } finally {
      setLoading(false);
    }
  };

  const signup = async (userData) => {
    setLoading(true);
    try {
      const res = await api.register(userData);
      localStorage.setItem('stockpulse_token', res.token);
      localStorage.setItem('stockpulse_user', JSON.stringify(res.user));
      setUser(res.user);
      setIsAuthModalOpen(false);
      return { success: true, user: res.user };
    } catch (err) {
      return { success: false, error: err.message || 'Signup failed' };
    } finally {
      setLoading(false);
    }
  };

  const loginWithRole = async (role, department, email) => {
    setLoading(true);
    try {
      const res = await api.demoLogin(role, department, email);
      localStorage.setItem('stockpulse_token', res.token);
      localStorage.setItem('stockpulse_user', JSON.stringify(res.user));
      setUser(res.user);
      setIsAuthModalOpen(false);
      return { success: true, user: res.user };
    } catch (e) {
      console.warn('Demo login API fallback, using client mock session:', e);
      const fallbackUser = {
        admin: { id: 'u1', name: 'Anshu Raj (Admin)', email: 'admin@campus.edu', role: 'admin', department: 'Procurement & Labs' },
        staff: {
          id: 'u2',
          name: email?.includes('mess')
            ? 'Akarshan Mishra (Central Mess In-charge)'
            : email?.includes('stationery')
            ? 'Md. Adil Mokarram (Stationery In-charge)'
            : 'Aditya Yadaw (Chemistry Lab In-charge)',
          email: email || 'staff.chemistry@campus.edu',
          role: 'staff',
          department: department || 'Chemistry Lab'
        },
        viewer: { id: 'u3', name: 'Campus Auditor (Viewer)', email: 'viewer@campus.edu', role: 'viewer', department: 'Finance Inspection' }
      }[role] || { id: 'u1', name: 'Demo User', role };
      setUser(fallbackUser);
      localStorage.setItem('stockpulse_user', JSON.stringify(fallbackUser));
      setIsAuthModalOpen(false);
      return { success: true, user: fallbackUser };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('stockpulse_token');
    localStorage.removeItem('stockpulse_user');
    setUser(null);
    openLoginModal('portals');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        loginWithCredentials,
        signup,
        loginWithRole,
        logout,
        loading,
        isAuthModalOpen,
        setIsAuthModalOpen,
        openLoginModal,
        closeLoginModal,
        activeAuthTab,
        setActiveAuthTab
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}