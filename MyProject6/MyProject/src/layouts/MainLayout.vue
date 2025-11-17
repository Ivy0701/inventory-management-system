<template>
  <div class="layout">
    <aside class="layout__sidebar">
      <div class="layout__brand">
        <span class="layout__brand-name">Inventory & Sales Management</span>
      </div>
      <nav class="layout__nav">
        <RouterLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="layout__nav-item"
          active-class="layout__nav-item--active"
        >
          <span class="layout__nav-icon">{{ item.icon }}</span>
          <span>{{ item.label }}</span>
        </RouterLink>
      </nav>
    </aside>
    <div class="layout__content">
      <header class="layout__header">
        <div>
          <h1 class="layout__title">{{ pageTitle }}</h1>
          <p class="layout__subtitle">{{ subtitle }}</p>
        </div>
        <div class="layout__user">
          <span class="layout__user-name">{{ appStore.user.name }}</span>
          <button class="btn-secondary" type="button" @click="handleLogout">Logout</button>
        </div>
      </header>
      <main class="layout__main">
        <RouterView />
      </main>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useRouter, useRoute, RouterLink, RouterView } from 'vue-router';
import { useAppStore } from '../store/appStore';

const appStore = useAppStore();
const router = useRouter();
const route = useRoute();

const navItems = computed(() => {
  const role = appStore.user.role;
  if (role === 'sales') {
    return [
      { label: 'Dashboard', icon: '🏠', to: '/app/sales/dashboard' },
      { label: 'Customer Orders', icon: '🧾', to: '/app/sales/customer-orders' },
      { label: 'Store Inventory', icon: '📦', to: '/app/sales/store-inventory' },
      { label: 'Return Requests', icon: '↩️', to: '/app/sales/return-requests' }
    ];
  } else if (role === 'warehouse') {
    return [
      { label: 'Dashboard', icon: '🏠', to: '/app/warehouse/dashboard' },
      { label: 'Inventory Stats', icon: '📊', to: '/app/warehouse/inventory-stats' },
      { label: 'Regional Inventory', icon: '🗺️', to: '/app/warehouse/regional-inventory' },
      { label: 'Replenishment', icon: '🔁', to: '/app/warehouse/replenishment' }
    ];
  }
  return [];
});

const pageTitles = {
  '/app/sales/dashboard': 'Sales Dashboard',
  '/app/sales/customer-orders': 'Customer Orders',
  '/app/sales/store-inventory': 'Store Inventory',
  '/app/sales/return-requests': 'Return Requests',
  '/app/warehouse/dashboard': 'Warehouse Dashboard',
  '/app/warehouse/inventory-stats': 'Inventory Statistics',
  '/app/warehouse/regional-inventory': 'Regional Inventory',
  '/app/warehouse/replenishment': 'Replenishment'
};

const pageSubtitles = {
  '/app/sales/dashboard': 'Manage customer orders and return requests',
  '/app/sales/customer-orders': 'View and manage all customer orders',
  '/app/sales/store-inventory': 'View inventory across all stores',
  '/app/sales/return-requests': 'Handle customer return requests',
  '/app/warehouse/dashboard': 'Manage inventory statistics and replenishment',
  '/app/warehouse/inventory-stats': 'View inventory statistics and metrics',
  '/app/warehouse/regional-inventory': 'View inventory by region and warehouse',
  '/app/warehouse/replenishment': 'Handle replenishment requests'
};

const pageTitle = computed(() => pageTitles[route.path] || 'Inventory & Sales Management System');
const subtitle = computed(() => pageSubtitles[route.path] || '');

const handleLogout = () => {
  appStore.logout();
  router.replace('/');
};
</script>

