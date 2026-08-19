// API Abstraction Layer for Nexora
// Bulletproof multi-transport authentication (Cookies + Bearer Token)

const API_BASE = '/api';

export const getStoredToken = (): string | null => {
  try {
    return localStorage.getItem('auth_token');
  } catch (e) {
    return null;
  }
};

export const setStoredToken = (token: string): void => {
  try {
    localStorage.setItem('auth_token', token);
  } catch (e) {}
};

export const removeStoredToken = (): void => {
  try {
    localStorage.removeItem('auth_token');
  } catch (e) {}
};

async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  const token = getStoredToken();
  const headers = new Headers(options.headers || {});

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // Prevent browser caching on all API requests
  headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
  headers.set('Pragma', 'no-cache');
  headers.set('Expires', '0');

  try {
    const res = await fetch(url, {
      credentials: 'include',
      cache: 'no-store',
      ...options,
      headers,
    });

    // If unauthorized due to invalid token, clear local token
    if (res.status === 401) {
      const clone = res.clone();
      try {
        const data = await clone.json();
        if (data?.error === 'Invalid token' || data?.error === 'Unauthorized' || data?.error === 'User not found' || data?.error === 'جلسة غير صالحة') {
          removeStoredToken();
        }
      } catch (e) {
        try {
          const txt = await clone.text();
          if (txt.includes('Invalid token') || txt.includes('Unauthorized')) {
            removeStoredToken();
          }
        } catch (err) {}
      }
    }

    return res;
  } catch (netErr: any) {
    console.error(`Network/Fetch error for ${url}:`, netErr);
    throw new Error(netErr.message === 'Failed to fetch' ? 'تعذر الاتصال بالخادم، يرجى التحقق من اتصالك بالإنترنت أو إعادة تحميل الصفحة' : (netErr.message || 'حدث خطأ في الاتصال بالخادم'));
  }
}

async function handleResponse(res: Response): Promise<any> {
  const contentType = res.headers.get('content-type') || '';
  
  if (!res.ok) {
    let msg = 'حدث خطأ في الاتصال بالخادم';
    try {
      if (contentType.includes('application/json')) {
        const data = await res.json();
        msg = data.error || data.message || (typeof data === 'string' ? data : JSON.stringify(data));
      } else {
        const text = await res.text();
        if (text && text.length < 300 && !text.startsWith('<!doctype') && !text.startsWith('<html')) {
          msg = text;
        } else if (res.status === 429) {
          msg = 'تم تجاوز عدد الطلبات المسموح بها، يرجى الانتظار قليلاً';
        } else if (res.status === 404) {
          msg = 'الخدمة المطلوبة غير متوفرة حالياً';
        } else if (res.status >= 500) {
          msg = 'حدث خطأ في معالجة الطلب في الخادم';
        }
      }
    } catch (e) {
      msg = res.statusText || msg;
    }
    throw new Error(msg);
  }

  if (contentType.includes('application/json')) {
    return res.json();
  }

  try {
    return await res.json();
  } catch (e) {
    const text = await res.text();
    if (text.startsWith('<!doctype') || text.startsWith('<html')) {
      throw new Error('حدث خطأ في استجابة الخادم');
    }
    return text;
  }
}

export const api = {
  // Auth
  async register(data: any) {
    const res = await fetchWithAuth(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await handleResponse(res);
    if (json?.token) {
      setStoredToken(json.token);
    }
    return json;
  },
  
  async login(data: any) {
    const res = await fetchWithAuth(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await handleResponse(res);
    if (json?.token) {
      setStoredToken(json.token);
    }
    return json;
  },

  async logout() {
    removeStoredToken();
    try {
      const res = await fetchWithAuth(`${API_BASE}/auth/logout`, { method: 'POST' });
      return await handleResponse(res);
    } catch (e) {
      return { message: 'Logged out' };
    }
  },

  async getMe() {
    const res = await fetchWithAuth(`${API_BASE}/auth/me`);
    if (!res.ok) {
      if (res.status === 401) {
        removeStoredToken();
        return { user: null };
      }
      throw new Error('Not authenticated');
    }
    return res.json();
  },

  // User Profile
  async getProfile() {
    const res = await fetchWithAuth(`${API_BASE}/user/profile`);
    return handleResponse(res);
  },

  async updateProfile(data: { displayName?: string; phone?: string }) {
    const res = await fetchWithAuth(`${API_BASE}/user/profile`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async changePassword(data: { oldPassword: string; newPassword: string }) {
    const res = await fetchWithAuth(`${API_BASE}/user/change-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async setTransactionPin(data: { pin: string; currentPassword?: string; currentPin?: string }) {
    const res = await fetchWithAuth(`${API_BASE}/user/pin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  // Wallet
  async getWallet() {
    const res = await fetchWithAuth(`${API_BASE}/wallet`);
    return handleResponse(res);
  },

  async getTransactions() {
    const res = await fetchWithAuth(`${API_BASE}/wallet/transactions`);
    return handleResponse(res);
  },

  async deposit(amount: number, data?: { reference?: string; txid?: string; paymentMethod?: string }) {
    const res = await fetchWithAuth(`${API_BASE}/deposits`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        amount, 
        reference: data?.reference || data?.txid,
        txid: data?.txid,
        paymentMethod: data?.paymentMethod || 'USDT TRC20'
      }),
    });
    return handleResponse(res);
  },

  async requestDeposit(amount: number, data?: { reference?: string; txid?: string; paymentMethod?: string }) {
    return this.deposit(amount, data);
  },

  async withdraw(amount: number, data?: { address?: string; reference?: string; paymentMethod?: string; pin?: string }) {
    const res = await fetchWithAuth(`${API_BASE}/withdrawals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        amount, 
        address: data?.address,
        reference: data?.reference || data?.address,
        paymentMethod: data?.paymentMethod || 'USDT TRC20',
        pin: data?.pin
      }),
    });
    return handleResponse(res);
  },

  async requestWithdrawal(amount: number, data?: { address?: string; reference?: string; paymentMethod?: string; pin?: string }) {
    return this.withdraw(amount, data);
  },

  // Tasks
  async getTasks() {
    const res = await fetchWithAuth(`${API_BASE}/tasks`);
    return handleResponse(res);
  },

  async getTaskCompletions() {
    const res = await fetchWithAuth(`${API_BASE}/tasks/completions`);
    return handleResponse(res);
  },

  async completeTask(taskId: string, proofData?: { proofAccount?: string; proofImage?: string }) {
    const res = await fetchWithAuth(`${API_BASE}/tasks/${taskId}/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(proofData || {}),
    });
    return handleResponse(res);
  },

  // Ads
  async getAds() {
    const res = await fetchWithAuth(`${API_BASE}/ads`);
    return handleResponse(res);
  },

  async getAdCompletions() {
    const res = await fetchWithAuth(`${API_BASE}/ads/completions`);
    return handleResponse(res);
  },

  async completeAd(adId: string) {
    const res = await fetchWithAuth(`${API_BASE}/ads/${adId}/complete`, {
      method: 'POST'
    });
    return handleResponse(res);
  },

  // Notifications
  async getNotifications() {
    try {
      const res = await fetchWithAuth(`${API_BASE}/notifications`);
      return handleResponse(res);
    } catch (e) {
      return { notifications: [] };
    }
  },

  async markNotificationRead(id: string) {
    const res = await fetchWithAuth(`${API_BASE}/notifications/${id}/read`, {
      method: 'PATCH'
    });
    return handleResponse(res);
  },

  async markAllNotificationsRead() {
    const res = await fetchWithAuth(`${API_BASE}/notifications/read-all`, {
      method: 'POST'
    });
    return handleResponse(res);
  },

  // VIP
  async getVipPlans() {
    const res = await fetchWithAuth(`${API_BASE}/vip`);
    return handleResponse(res);
  },

  async subscribeVip(planId: string) {
    const res = await fetchWithAuth(`${API_BASE}/vip/${planId}/subscribe`, {
      method: 'POST'
    });
    return handleResponse(res);
  },

  // System Settings
  async getSettings() {
    const res = await fetchWithAuth(`${API_BASE}/settings`);
    return handleResponse(res);
  },

  // Payment Methods (Public / User)
  async getPaymentMethods(type?: 'DEPOSIT' | 'WITHDRAWAL') {
    const url = type ? `${API_BASE}/payment-methods?type=${type}` : `${API_BASE}/payment-methods`;
    const res = await fetchWithAuth(url);
    return handleResponse(res);
  },

  // Admin APIs
  admin: {
    async getStats() {
      const res = await fetchWithAuth(`${API_BASE}/admin/stats`);
      return handleResponse(res);
    },

    async getSettings() {
      const res = await fetchWithAuth(`${API_BASE}/admin/settings`);
      return handleResponse(res);
    },

    async updateSettings(data: any) {
      const res = await fetchWithAuth(`${API_BASE}/admin/settings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return handleResponse(res);
    },

    async testTelegram(data?: { botToken?: string; chatId?: string }) {
      const res = await fetchWithAuth(`${API_BASE}/admin/telegram/test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data || {}),
      });
      return handleResponse(res);
    },

    async getUsers() {
      const res = await fetchWithAuth(`${API_BASE}/admin/users`);
      return handleResponse(res);
    },

    async updateUserVip(userId: string, vipLevel: number) {
      const res = await fetchWithAuth(`${API_BASE}/admin/users/${userId}/vip`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vipLevel }),
      });
      return handleResponse(res);
    },

    async adjustWallet(userId: string, amount: number, reason: string, type: 'ADD' | 'DEDUCT' = 'ADD') {
      const res = await fetchWithAuth(`${API_BASE}/admin/users/${userId}/wallet-adjustment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, reason, type }),
      });
      return handleResponse(res);
    },

    async approveDeposit(depositId: string, data?: { note?: string }) {
      const res = await fetchWithAuth(`${API_BASE}/admin/deposits/${depositId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data || {})
      });
      return handleResponse(res);
    },

    async rejectDeposit(depositId: string, data?: { reason?: string }) {
      const res = await fetchWithAuth(`${API_BASE}/admin/deposits/${depositId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data || {})
      });
      return handleResponse(res);
    },

    async approveWithdrawal(withdrawalId: string, data?: { txHash?: string; note?: string }) {
      const res = await fetchWithAuth(`${API_BASE}/admin/withdrawals/${withdrawalId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data || {})
      });
      return handleResponse(res);
    },

    async rejectWithdrawal(withdrawalId: string, data?: { reason?: string }) {
      const res = await fetchWithAuth(`${API_BASE}/admin/withdrawals/${withdrawalId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data || {})
      });
      return handleResponse(res);
    },

    async getFinancialRequests() {
      const res = await fetchWithAuth(`${API_BASE}/admin/financial-requests`);
      return handleResponse(res);
    },

    async updateUserStatus(userId: string, status: string) {
      const res = await fetchWithAuth(`${API_BASE}/admin/users/${userId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      return handleResponse(res);
    },

    async getAdminAds() {
      const res = await fetchWithAuth(`${API_BASE}/admin/ads`);
      return handleResponse(res);
    },
    async createAd(data: any) {
      const res = await fetchWithAuth(`${API_BASE}/admin/ads`, { 
        method: "POST", 
        headers: {"Content-Type": "application/json"}, 
        body: JSON.stringify(data) 
      });
      return handleResponse(res);
    },
    async updateAd(id: string, data: any) {
      const res = await fetchWithAuth(`${API_BASE}/admin/ads/${id}`, { 
        method: "PATCH", 
        headers: {"Content-Type": "application/json"}, 
        body: JSON.stringify(data) 
      });
      return handleResponse(res);
    },
    async deleteAd(id: string) {
      const res = await fetchWithAuth(`${API_BASE}/admin/ads/${id}`, { 
        method: "DELETE" 
      });
      return handleResponse(res);
    },
    async getAdminTasks() {
      const res = await fetchWithAuth(`${API_BASE}/admin/tasks`);
      return handleResponse(res);
    },
    async createTask(data: any) {
      const res = await fetchWithAuth(`${API_BASE}/admin/tasks`, { 
        method: "POST", 
        headers: {"Content-Type": "application/json"}, 
        body: JSON.stringify(data) 
      });
      return handleResponse(res);
    },
    async updateTask(id: string, data: any) {
      const res = await fetchWithAuth(`${API_BASE}/admin/tasks/${id}`, { 
        method: "PATCH", 
        headers: {"Content-Type": "application/json"}, 
        body: JSON.stringify(data) 
      });
      return handleResponse(res);
    },
    async deleteTask(id: string) {
      const res = await fetchWithAuth(`${API_BASE}/admin/tasks/${id}`, { 
        method: "DELETE" 
      });
      return handleResponse(res);
    },
    async createVipPlan(data: any) {
      const res = await fetchWithAuth(`${API_BASE}/admin/vip`, { 
        method: "POST", 
        headers: {"Content-Type": "application/json"}, 
        body: JSON.stringify(data) 
      });
      return handleResponse(res);
    },
    async updateVipPlan(id: string, data: any) {
      const res = await fetchWithAuth(`${API_BASE}/admin/vip/${id}`, { 
        method: "PATCH", 
        headers: {"Content-Type": "application/json"}, 
        body: JSON.stringify(data) 
      });
      return handleResponse(res);
    },
    async getAdminCompletions(type: 'AD' | 'TASK') {
      const endpoint = type === 'AD' ? 'ad-completions' : 'task-completions';
      const res = await fetchWithAuth(`${API_BASE}/admin/${endpoint}`);
      return handleResponse(res);
    },
    async approveCompletion(type: 'AD' | 'TASK', id: string, action: string, reason?: string) {
      const res = await fetchWithAuth(`${API_BASE}/admin/${type === "AD" ? "ad-completions" : "task-completions"}/${id}/approve`, { 
        method: "POST", 
        headers: { "Content-Type": "application/json" }, 
        body: JSON.stringify({ action, reason }) 
      });
      return handleResponse(res);
    },
    async getAdminLogs() {
      const res = await fetchWithAuth(`${API_BASE}/admin/logs`);
      return handleResponse(res);
    },

    // Payment Methods Management
    async getPaymentMethods() {
      const res = await fetchWithAuth(`${API_BASE}/admin/payment-methods`);
      return handleResponse(res);
    },
    async createPaymentMethod(data: any) {
      const res = await fetchWithAuth(`${API_BASE}/admin/payment-methods`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return handleResponse(res);
    },
    async updatePaymentMethod(id: string, data: any) {
      const res = await fetchWithAuth(`${API_BASE}/admin/payment-methods/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return handleResponse(res);
    },
    async togglePaymentMethod(id: string) {
      const res = await fetchWithAuth(`${API_BASE}/admin/payment-methods/${id}/toggle`, {
        method: 'PATCH',
      });
      return handleResponse(res);
    },
    async deletePaymentMethod(id: string) {
      const res = await fetchWithAuth(`${API_BASE}/admin/payment-methods/${id}`, {
        method: 'DELETE',
      });
      return handleResponse(res);
    }
  }
};
