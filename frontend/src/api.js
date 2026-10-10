const API_BASE = '/api';

function getAuthHeader() {
  const token = localStorage.getItem('stockpulse_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request(endpoint, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeader(),
    ...options.headers
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.error || `Request failed with status ${response.status}`);
  }

  return data;
}

export const api = {
  // Auth
  login: (email, password, expectedRole) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password, expectedRole }) }),
  register: (userData) =>
    request('/auth/register', { method: 'POST', body: JSON.stringify(userData) }),
  demoLogin: (role, department, email) =>
    request('/auth/demo-login', { method: 'POST', body: JSON.stringify({ role, department, email }) }),
  getStaffList: () => request('/auth/staff-list'),
  getMe: () => request('/auth/me'),

  // Items
  getItems: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/items${q ? `?${q}` : ''}`);
  },
  getItem: (id) => request(`/items/${id}`),
  getItemByBarcode: (code) => request(`/items/barcode/${encodeURIComponent(code)}`),
  createItem: (itemData) => request('/items', { method: 'POST', body: JSON.stringify(itemData) }),
  updateItem: (id, itemData) => request(`/items/${id}`, { method: 'PUT', body: JSON.stringify(itemData) }),
  deleteItem: (id) => request(`/items/${id}`, { method: 'DELETE' }),

  // Stock operations
  quickAdjustStock: (itemId, delta, reason) =>
    request('/stock/quick', { method: 'POST', body: JSON.stringify({ itemId, delta, reason }) }),
  logTransaction: (txData) =>
    request('/stock/transaction', { method: 'POST', body: JSON.stringify(txData) }),
  getTransactions: () => request('/stock/transactions'),

  // Forecast & Reorders
  getForecast: () => request('/forecast'),
  generateReorderDrafts: () => request('/forecast/generate-drafts', { method: 'POST' }),
  getReorders: (status) => request(`/reorders${status ? `?status=${status}` : ''}`),
  createManualReorder: (data) => request('/reorders', { method: 'POST', body: JSON.stringify(data) }),
  approveReorder: (id) => request(`/reorders/${id}/approve`, { method: 'PUT' }),
  rejectReorder: (id) => request(`/reorders/${id}/reject`, { method: 'PUT' }),
  markReorderOrdered: (id) => request(`/reorders/${id}/order`, { method: 'PUT' }),
  receiveReorder: (id, payload) => request(`/reorders/${id}/receive`, { method: 'PUT', body: JSON.stringify(payload) }),

  // Batches & FEFO Expiry
  getFefoBatches: () => request('/batches/fefo'),

  // Analytics & Dashboard
  getDashboardAnalytics: () => request('/analytics/dashboard'),
  getAuditLogs: () => request('/analytics/audit'),
  getDailySummary: (date) => request(`/analytics/daily-summary${date ? `?date=${date}` : ''}`),
  dispatchDailySummaryToOwner: (payload) =>
    request('/analytics/daily-summary/dispatch-owner', { method: 'POST', body: JSON.stringify(payload || {}) }),

  // Alerts
  getAlerts: () => request('/alerts'),
  markAlertRead: (id) => request(`/alerts/${id}/read`, { method: 'PUT' }),
  testAlert: (data) => request('/alerts/test', { method: 'POST', body: JSON.stringify(data) }),

  // Dealers & Procurement Intelligence
  getDealers: () => request('/dealers'),
  getQuotesForItem: (itemId) => request(`/dealers/quotes/${itemId}`),
  getAiRecommendation: (itemId, quantity) =>
    request(`/dealers/recommend/${itemId}${quantity ? `?quantity=${quantity}` : ''}`),
  autoDispatchDealers: (itemId) =>
    request('/dealers/auto-dispatch', { method: 'POST', body: JSON.stringify({ itemId }) }),
  getDealerDispatches: () => request('/dealers/dispatches'),
  updateDispatchStatus: (id, status) =>
    request(`/dealers/dispatches/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),

  // Subscriptions & Scheduled Monthly Deliveries
  getSubscriptions: () => request('/subscriptions'),
  createSubscription: (data) =>
    request('/subscriptions', { method: 'POST', body: JSON.stringify(data) }),
  toggleSubscriptionPermission: (id) =>
    request(`/subscriptions/${id}/permission`, { method: 'PUT' }),
  updateSubscription: (id, data) =>
    request(`/subscriptions/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  runScheduledDeliveries: (subscriptionId, targetDay, forceRun = true) =>
    request('/subscriptions/run-scheduled', { method: 'POST', body: JSON.stringify({ subscriptionId, targetDay, forceRun }) }),
  cancelSubscription: (id) =>
    request(`/subscriptions/${id}`, { method: 'DELETE' })
};