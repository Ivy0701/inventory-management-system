<template>
  <div class="dashboard">
    <section class="card dashboard__welcome">
      <header class="dashboard__welcome-header">
        <div>
          <h2>Welcome back, {{ appStore.user.name }}</h2>
          <p>{{ tasks.length }} tasks to handle today</p>
        </div>
        <span class="tag">Alerts {{ alerts.length }}</span>
      </header>
      <div class="dashboard__actions">
        <RouterLink
          v-for="action in welcomeActions"
          :key="action.to"
          :class="action.class"
          :to="action.to"
        >
          {{ action.label }}
        </RouterLink>
      </div>
    </section>

    <section class="card">
      <h3 class="section-title">Common Functions</h3>
      <div class="dashboard__grid">
        <RouterLink
          v-for="item in shortcuts"
          :key="item.to"
          :to="item.to"
          class="dashboard__grid-item"
        >
          <div class="dashboard__grid-icon">{{ item.icon }}</div>
          <div class="dashboard__grid-title">{{ item.title }}</div>
          <div class="dashboard__grid-desc">{{ item.desc }}</div>
        </RouterLink>
      </div>
    </section>

    <section v-if="userRole === 'warehouse'" class="card">
      <h3 class="section-title">Inventory Alerts</h3>
      <div v-if="alerts.length" class="list">
        <div v-for="alert in alerts" :key="alert.id" class="list-item dashboard__alert">
          <div class="dashboard__alert-header">
            <span>{{ alert.name }}</span>
            <span class="tag danger">{{ alert.status }}</span>
          </div>
          <div class="dashboard__alert-body">
            <span>Available Stock: {{ alert.stock }} {{ alert.unit }}</span>
            <span>Safety Threshold: {{ alert.threshold }}</span>
          </div>
        </div>
      </div>
      <p v-else class="empty">No inventory alerts</p>
    </section>

    <section v-if="userRole === 'sales'" class="card">
      <h3 class="section-title">Pending Return Requests</h3>
      <div v-if="tasks.length" class="list">
        <div v-for="task in tasks" :key="task.id" class="list-item dashboard__task">
          <div class="dashboard__task-header">
            <span>{{ task.title }}</span>
            <span class="tag" :class="task.priority">{{ task.priorityLabel }}</span>
          </div>
          <div class="dashboard__task-body">
            <span>{{ task.desc }}</span>
            <span class="dashboard__task-deadline">Deadline: {{ task.deadline }}</span>
          </div>
        </div>
      </div>
      <p v-else class="empty">No pending return requests</p>
    </section>

    <section v-if="userRole === 'warehouse'" class="card">
      <h3 class="section-title">Pending Replenishment Tasks</h3>
      <div v-if="tasks.length" class="list">
        <div v-for="task in tasks" :key="task.id" class="list-item dashboard__task">
          <div class="dashboard__task-header">
            <span>{{ task.title }}</span>
            <span class="tag" :class="task.priority">{{ task.priorityLabel }}</span>
          </div>
          <div class="dashboard__task-body">
            <span>{{ task.desc }}</span>
            <span class="dashboard__task-deadline">Deadline: {{ task.deadline }}</span>
          </div>
        </div>
      </div>
      <p v-else class="empty">No pending replenishment tasks</p>
    </section>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { RouterLink, useRoute } from 'vue-router';
import { useAppStore } from '../store/appStore';

const appStore = useAppStore();
const route = useRoute();

const alerts = computed(() => appStore.alerts);
const tasks = computed(() => appStore.tasks);
const userRole = computed(() => appStore.user.role);

// 根据角色显示不同的功能卡片
const shortcuts = computed(() => {
  if (userRole.value === 'sales') {
    return [
      { title: 'Customer Orders', desc: 'View and manage customer orders', icon: '🧾', to: '/app/sales/customer-orders' },
      { title: 'Store Inventory', desc: 'View inventory across all stores', icon: '📦', to: '/app/sales/store-inventory' },
      { title: 'Return Requests', desc: 'Handle customer return requests', icon: '↩️', to: '/app/sales/return-requests' }
    ];
  } else if (userRole.value === 'warehouse') {
    return [
      { title: 'Inventory Statistics', desc: 'View inventory statistics and metrics', icon: '📊', to: '/app/warehouse/inventory-stats' },
      { title: 'Regional Inventory', desc: 'View inventory by region and warehouse', icon: '🗺️', to: '/app/warehouse/regional-inventory' },
      { title: 'Replenishment', desc: 'Handle replenishment requests', icon: '🔁', to: '/app/warehouse/replenishment' }
    ];
  }
  return [];
});

const welcomeActions = computed(() => {
  if (userRole.value === 'sales') {
    return [
      { label: 'View Customer Orders', to: '/app/sales/customer-orders', class: 'btn-primary' },
      { label: 'Handle Return Requests', to: '/app/sales/return-requests', class: 'btn-secondary' }
    ];
  } else if (userRole.value === 'warehouse') {
    return [
      { label: 'View Inventory Stats', to: '/app/warehouse/inventory-stats', class: 'btn-primary' },
      { label: 'Handle Replenishment', to: '/app/warehouse/replenishment', class: 'btn-secondary' }
    ];
  }
  return [];
});
</script>

<style scoped>
.dashboard {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
  gap: 24px;
}

.dashboard__welcome {
  grid-column: 1 / -1;
  background: linear-gradient(135deg, rgba(43, 181, 192, 0.15), #ffffff);
}

.dashboard__welcome-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.dashboard__welcome-header h2 {
  margin: 0;
  font-size: 24px;
}

.dashboard__welcome-header p {
  margin: 8px 0 0;
  color: var(--color-text-muted);
}

.dashboard__actions {
  margin-top: 18px;
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.dashboard__actions .btn-primary,
.dashboard__actions .btn-secondary {
  flex: 1 1 180px;
  text-align: center;
}

.dashboard__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 16px;
}

.dashboard__grid-item {
  background-color: #ffffff;
  border-radius: 16px;
  padding: 20px;
  box-shadow: var(--shadow-soft);
  display: flex;
  flex-direction: column;
  gap: 8px;
  color: var(--color-text);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.dashboard__grid-item:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-card);
}

.dashboard__grid-icon {
  font-size: 32px;
}

.dashboard__grid-title {
  font-weight: 600;
}

.dashboard__grid-desc {
  color: var(--color-text-muted);
  font-size: 14px;
}

.dashboard__alert {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.dashboard__alert-header,
.dashboard__alert-body {
  display: flex;
  justify-content: space-between;
}

.dashboard__task {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.dashboard__task-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.dashboard__task-body {
  display: flex;
  justify-content: space-between;
  color: var(--color-text-muted);
  font-size: 14px;
}

.dashboard__task-deadline {
  color: #9ca3af;
}

@media (max-width: 960px) {
  .dashboard {
    grid-template-columns: 1fr;
  }
}
</style>

