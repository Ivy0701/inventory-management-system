<template>
  <div class="role-select">
    <div class="role-select__panel">
      <div class="role-select__header">
        <h1>Distributed Inventory and Sales Management System</h1>
        <p>Please select your role</p>
      </div>
      <div class="role-select__options">
        <button
          class="role-card"
          :class="{ 'role-card--selected': selectedRole === 'customer' }"
          @click="selectRole('customer')"
        >
          <div class="role-card__icon">🛒</div>
          <div class="role-card__title">Customer</div>
          <div class="role-card__desc">Purchase products, view orders</div>
          <div v-if="selectedRole === 'customer'" class="role-card__badge">Registration Supported</div>
        </button>
        <button
          class="role-card"
          :class="{ 'role-card--selected': selectedRole === 'sales' }"
          @click="selectRole('sales')"
        >
          <div class="role-card__icon">👔</div>
          <div class="role-card__title">Sales Staff</div>
          <div class="role-card__desc">Manage orders, view inventory</div>
        </button>
        <button
          class="role-card"
          :class="{ 'role-card--selected': selectedRole === 'warehouse' }"
          @click="selectRole('warehouse')"
        >
          <div class="role-card__icon">📦</div>
          <div class="role-card__title">Warehouse Manager</div>
          <div class="role-card__desc">Manage inventory, handle replenishment</div>
        </button>
      </div>
      <div v-if="selectedRole" class="role-select__actions">
        <button class="btn-primary" @click="handleContinue">
          {{ selectedRole === 'customer' ? 'Register / Login' : 'Login' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAppStore } from '../store/appStore';

const router = useRouter();
const appStore = useAppStore();
const selectedRole = ref(null);

const selectRole = (role) => {
  selectedRole.value = role;
  // 保存选择的角色到store
  appStore.selectedRole = role;
  window.sessionStorage.setItem('selectedRole', role);
};

const handleContinue = () => {
  if (!selectedRole.value) {
    window.alert('Please select your role first');
    return;
  }

  if (selectedRole.value === 'customer') {
    router.push('/customer/register');
  } else {
    router.push(`/staff/login?role=${selectedRole.value}`);
  }
};
</script>

<style scoped>
.role-select {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: radial-gradient(circle at top left, rgba(43, 181, 192, 0.15), transparent 55%),
    radial-gradient(circle at bottom right, rgba(39, 48, 63, 0.2), transparent 45%),
    var(--color-background);
  padding: 48px 16px;
}

.role-select__panel {
  max-width: 800px;
  width: 100%;
  background-color: var(--color-surface);
  border-radius: 24px;
  box-shadow: var(--shadow-card);
  padding: 48px 32px;
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.role-select__header {
  text-align: center;
}

.role-select__header h1 {
  margin: 0;
  font-size: 28px;
  color: var(--color-brand-dark);
}

.role-select__header p {
  margin: 12px 0 0;
  color: var(--color-text-muted);
  font-size: 16px;
}

.role-select__options {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 24px;
}

.role-card {
  background: #ffffff;
  border: 2px solid #e5e7eb;
  border-radius: 16px;
  padding: 32px 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: center;
}

.role-card:hover {
  border-color: var(--color-brand);
  transform: translateY(-4px);
  box-shadow: var(--shadow-card);
}

.role-card--selected {
  border-color: var(--color-brand);
  background: linear-gradient(135deg, rgba(43, 181, 192, 0.1), #ffffff);
  box-shadow: var(--shadow-card);
}

.role-card__icon {
  font-size: 48px;
  margin-bottom: 8px;
}

.role-card__title {
  font-size: 20px;
  font-weight: 600;
  color: var(--color-text);
}

.role-card__desc {
  font-size: 14px;
  color: var(--color-text-muted);
  margin-top: 4px;
}

.role-card__badge {
  margin-top: 8px;
  padding: 4px 12px;
  background: var(--color-brand);
  color: #ffffff;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.role-select__actions {
  display: flex;
  justify-content: center;
}

.role-select__actions .btn-primary {
  min-width: 200px;
}

@media (max-width: 768px) {
  .role-select__options {
    grid-template-columns: 1fr;
  }

  .role-select__panel {
    padding: 32px 24px;
  }
}
</style>



