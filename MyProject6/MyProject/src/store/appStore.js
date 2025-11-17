import { defineStore } from 'pinia';
import { login as loginApi, register as registerApi } from '../services/authService';

const getDefaultUser = () => ({
  name: 'Guest',
  role: 'Guest',
  account: ''
});

export const useAppStore = defineStore('app', {
  state: () => ({
    user: getDefaultUser(),
    auth: {
      isAuthenticated: false,
      token: null
    },
    selectedRole: null, // 当前选择的角色：customer, sales, warehouse
    alerts: [
      {
        id: 'SKU-001',
        name: 'Smart Handheld Terminal',
        stock: 12,
        unit: 'units',
        threshold: 20,
        status: 'Low Stock',
        level: 'danger'
      },
      {
        id: 'SKU-009',
        name: 'Logistics Scanner',
        stock: 5,
        unit: 'units',
        threshold: 10,
        status: 'Critically Low',
        level: 'danger'
      }
    ],
    tasks: [
      {
        id: 'task-1',
        title: 'Review Sales Order SO-20240123',
        desc: 'Confirm inventory and arrange shipping plan',
        deadline: 'Today 17:00',
        priority: 'warning',
        priorityLabel: 'High'
      },
      {
        id: 'task-2',
        title: 'Handle Replenishment Request RA-8811',
        desc: 'Confirm supplier and estimated arrival time',
        deadline: 'Tomorrow 10:00',
        priority: 'default',
        priorityLabel: 'Medium'
      }
    ]
  }),
  actions: {
    async login(credentials) {
      const { user, token } = await loginApi(credentials);
      this.setSession(user, token);
      return true;
    },
    async register(payload) {
      const { user, token } = await registerApi(payload);
      this.setSession(user, token);
      return true;
    },
    setSession(user, token) {
      this.user = user;
      this.auth.isAuthenticated = true;
      this.auth.token = token;
      // 根据用户角色设置selectedRole
      if (user.role) {
        this.selectedRole = user.role;
      }
      window.localStorage.setItem('app-auth', JSON.stringify({ user, token }));
    },
    hydrateFromStorage() {
      const stored = window.localStorage.getItem('app-auth');
      if (stored) {
        const { user, token } = JSON.parse(stored);
        if (user && token) {
          this.user = user;
          this.auth.isAuthenticated = true;
          this.auth.token = token;
          // 恢复角色信息
          if (user.role) {
            this.selectedRole = user.role;
          }
        }
      }
    },
    logout() {
      this.user = getDefaultUser();
      this.auth.isAuthenticated = false;
      this.auth.token = null;
      window.localStorage.removeItem('app-auth');
    }
  }
});

