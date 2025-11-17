<template>
  <div class="login">
    <div class="login__panel">
      <div class="login__header">
        <h1>{{ title }}</h1>
        <p>{{ subtitle }}</p>
      </div>
      <form class="login__form" @submit.prevent="handleSubmit">
        <div class="form-group">
          <label class="form-label" for="account">Account</label>
          <input
            id="account"
            v-model="form.account"
            class="form-input"
            placeholder="Enter account"
            autocomplete="username"
          />
        </div>
        <div class="form-group">
          <label class="form-label" for="password">Password</label>
          <input
            id="password"
            v-model="form.password"
            class="form-input"
            type="password"
            placeholder="Enter password"
            autocomplete="current-password"
          />
        </div>
        <div class="login__captcha">
          <div class="form-group">
            <label class="form-label" for="captcha">Verification Code</label>
            <input
              id="captcha"
              v-model="form.captcha"
              class="form-input"
              placeholder="Enter verification code"
            />
          </div>
          <button type="button" class="login__captcha-image" @click="refreshCaptcha">
            {{ captcha }}
          </button>
        </div>
        <div class="login__actions">
          <button type="button" class="link" @click="onForgotPassword">Forgot Password</button>
          <button v-if="role === 'customer'" type="button" class="link" @click="goToRegister">
            Register
          </button>
        </div>
        <button class="btn-primary login__submit" type="submit" :disabled="loading">
          {{ loading ? 'Logging in...' : 'Login' }}
        </button>
      </form>
      <div v-if="showPresetAccounts" class="login__preset-accounts card">
        <div class="card-header">
          <span>Preset Accounts</span>
          <span class="tag">Test Accounts</span>
        </div>
        <div class="login__preset-list">
          <div v-for="account in presetAccounts" :key="account.account" class="preset-account-item">
            <span class="preset-account__label">Account:</span>
            <span class="preset-account__value" @click="fillAccount(account)">{{ account.account }}</span>
            <span class="preset-account__label">Password:</span>
            <span class="preset-account__value">{{ account.password }}</span>
          </div>
        </div>
        <p class="login__preset-hint">Click account to fill quickly</p>
      </div>
      <div class="login__tips card">
        <div class="card-header">
          <span>Login Tips</span>
          <span class="tag">Security Check</span>
        </div>
        <ul class="login__tips-list">
          <li v-for="tip in tips" :key="tip">{{ tip }}</li>
        </ul>
      </div>
      <div class="login__back">
        <button type="button" class="link" @click="goBack">Back to Role Selection</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAppStore } from '../store/appStore';

const router = useRouter();
const route = useRoute();
const appStore = useAppStore();

const role = computed(() => {
  // 从URL参数获取角色，或从store获取
  return route.query.role || appStore.selectedRole || window.sessionStorage.getItem('selectedRole') || 'customer';
});

const title = computed(() => {
  const titles = {
    customer: 'Customer Login',
    sales: 'Sales Staff Login',
    warehouse: 'Warehouse Manager Login'
  };
  return titles[role.value] || 'Login';
});

const subtitle = computed(() => {
  const subtitles = {
    customer: 'Login to purchase products and view orders',
    sales: 'Login to access orders, inventory, reports and other modules',
    warehouse: 'Login to manage inventory and handle replenishment requests'
  };
  return subtitles[role.value] || 'Please login with your account';
});

const tips = computed(() => {
  const tipsMap = {
    customer: [
      'After login, you can purchase products and view orders.',
      'The system will record your shopping history.',
      'Please contact customer service if you have any questions.'
    ],
    sales: [
      'After login, you can access inventory, orders, reports and other modules.',
      'The system will record operation logs to ensure data security.',
      'Please change your password and complete contact information on first login.'
    ],
    warehouse: [
      'After login, you can manage inventory and handle replenishment requests.',
      'The system will record operation logs to ensure data security.',
      'Please change your password and complete contact information on first login.'
    ]
  };
  return tipsMap[role.value] || [];
});

const showPresetAccounts = computed(() => {
  // 只在销售员和仓库管理员登录时显示预设账号
  return role.value === 'sales' || role.value === 'warehouse';
});

const presetAccounts = computed(() => {
  if (role.value === 'sales') {
    return [
      { account: 'sales001', password: '123456', name: 'Sales Staff 1' },
      { account: 'sales002', password: '123456', name: 'Sales Staff 2' }
    ];
  } else if (role.value === 'warehouse') {
    return [
      { account: 'warehouse001', password: '123456', name: 'Warehouse Manager 1' },
      { account: 'warehouse002', password: '123456', name: 'Warehouse Manager 2' }
    ];
  }
  return [];
});

const fillAccount = (account) => {
  form.account = account.account;
  form.password = account.password;
};

const form = reactive({
  account: '',
  password: '',
  captcha: ''
});

const generateCaptcha = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
};

const captcha = ref(generateCaptcha());
const loading = ref(false);

const refreshCaptcha = () => {
  captcha.value = generateCaptcha();
};

const handleSubmit = async () => {
  if (!form.account || !form.password || !form.captcha) {
    window.alert('Please fill in all information');
    return;
  }
  if (form.captcha.toUpperCase() !== captcha.value) {
    window.alert('Verification code is incorrect');
    refreshCaptcha();
    return;
  }
  try {
    loading.value = true;
    await appStore.login({ account: form.account, password: form.password, role: role.value });
    
    // Navigate to different pages based on role
    if (role.value === 'customer') {
      router.replace('/customer/shop');
    } else if (role.value === 'sales') {
      router.replace('/app/sales/dashboard');
    } else if (role.value === 'warehouse') {
      router.replace('/app/warehouse/dashboard');
    } else {
      router.replace('/');
    }
  } catch (error) {
    window.alert(error.message || 'Login failed, please try again');
    refreshCaptcha();
  } finally {
    loading.value = false;
  }
};

const goToRegister = () => {
  router.push('/customer/register');
};

const goBack = () => {
  router.push('/');
};

const onForgotPassword = () => {
  window.alert('Please contact administrator to reset password');
};
</script>

<style scoped>
.login {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: radial-gradient(circle at top left, rgba(43, 181, 192, 0.15), transparent 55%),
    radial-gradient(circle at bottom right, rgba(39, 48, 63, 0.2), transparent 45%),
    var(--color-background);
  padding: 48px 16px;
}

.login__panel {
  max-width: 480px;
  width: 100%;
  background-color: var(--color-surface);
  border-radius: 24px;
  box-shadow: var(--shadow-card);
  padding: 32px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.login__header h1 {
  margin: 0;
  font-size: 24px;
  color: var(--color-brand-dark);
}

.login__header p {
  margin: 8px 0 0;
  color: var(--color-text-muted);
}

.login__form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.login__captcha {
  display: flex;
  gap: 12px;
  align-items: flex-end;
}

.login__captcha-image {
  width: 108px;
  height: 56px;
  border-radius: 12px;
  background: linear-gradient(135deg, #2bb5c0, #1f2933);
  color: #ffffff;
  font-weight: 700;
  letter-spacing: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.login__actions {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
}

.link {
  background: none;
  border: none;
  color: var(--color-brand);
  padding: 0;
}

.login__submit {
  width: 100%;
  margin-top: 8px;
}

.login__tips.card {
  margin: 0;
}

.login__tips-list {
  margin: 12px 0 0;
  padding-left: 18px;
  color: var(--color-text-muted);
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.login__preset-accounts {
  margin: 0;
}

.login__preset-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin: 12px 0 8px;
}

.preset-account-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: var(--color-background);
  border-radius: 8px;
  font-size: 14px;
}

.preset-account__label {
  color: var(--color-text-muted);
  font-weight: 500;
}

.preset-account__value {
  color: var(--color-brand);
  font-weight: 600;
  cursor: pointer;
  padding: 2px 6px;
  border-radius: 4px;
  transition: background 0.2s ease;
}

.preset-account__value:hover {
  background: rgba(43, 181, 192, 0.1);
}

.login__preset-hint {
  margin: 8px 0 0;
  text-align: center;
  font-size: 12px;
  color: var(--color-text-muted);
}

.login__back {
  text-align: center;
  margin-top: 8px;
}
</style>

