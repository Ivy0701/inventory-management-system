<template>
  <div class="replenishment">
    <section class="card">
      <h2 class="section-title">Inventory Replenishment Alerts</h2>
      <div class="list">
        <div
          v-for="reminder in reminders"
          :key="reminder.id"
          class="list-item replenishment__reminder"
          :class="{ 'replenishment__reminder--active': application.product === reminder.product }"
          @click="selectReminder(reminder)"
        >
          <div class="replenishment__reminder-header">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 24px;">{{ reminder.icon || '📦' }}</span>
              <span>{{ reminder.product }}</span>
            </div>
            <span class="tag" :class="reminder.level">{{ reminder.levelLabel }}</span>
          </div>
          <div class="replenishment__reminder-body">
            <span>Current Stock: {{ reminder.stock }}</span>
            <span>Suggested Restock: {{ reminder.suggested }}</span>
          </div>
          <div class="replenishment__reminder-meta">
            <span>Trigger Reason: {{ reminder.trigger }}</span>
            <span>Warehouse: {{ reminder.warehouse }}</span>
          </div>
          <div v-if="reminder.threshold" class="replenishment__reminder-meta" style="margin-top: 4px;">
            <span>Safety Threshold: {{ reminder.threshold }}</span>
          </div>
        </div>
      </div>
    </section>

    <section class="card">
      <h2 class="section-title">Replenishment Application</h2>
      <form class="replenishment__form" @submit.prevent="submitApplication">
        <div class="form-group">
          <label class="form-label" for="product">Product</label>
          <input id="product" class="form-input" :value="application.product" placeholder="Please select product" disabled />
        </div>
        <div class="form-group">
          <label class="form-label" for="vendor">Vendor</label>
          <select id="vendor" v-model="application.vendor" class="filter-pill">
            <option value="">Please select vendor</option>
            <option v-for="vendor in vendors" :key="vendor" :value="vendor">{{ vendor }}</option>
          </select>
        </div>
        <div class="replenishment__form-row">
          <div class="form-group">
            <label class="form-label" for="quantity">Restock Quantity</label>
            <input
              id="quantity"
              v-model="application.quantity"
              class="form-input"
              type="number"
              min="0"
              placeholder="0"
            />
          </div>
          <div class="form-group">
            <label class="form-label" for="delivery">Expected Delivery</label>
            <input
              id="delivery"
              v-model="application.deliveryDate"
              class="form-input"
              type="date"
            />
          </div>
        </div>
        <div class="form-group">
          <label class="form-label" for="remark">Remark</label>
          <textarea
            id="remark"
            v-model="application.remark"
            class="form-textarea"
            rows="3"
            placeholder="Replenishment notes and precautions"
          />
        </div>
        <button class="btn-primary" type="submit">Submit Replenishment Application</button>
      </form>
    </section>

    <section class="card">
      <h2 class="section-title">Processing Progress Tracking</h2>
      <div class="timeline replenishment__timeline">
        <div v-for="item in progress" :key="item.title" class="timeline-item">
          <span class="timeline-dot" :class="`timeline-dot--${item.status}`" />
          <div class="timeline-content">
            <span class="timeline-title">{{ item.title }}</span>
            <span class="timeline-desc">{{ item.desc }}</span>
            <span class="timeline-time">{{ item.time }}</span>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { reactive } from 'vue';

// 使用与顾客页面相同的商品数据
const reminders = reactive([
  {
    id: 'REM-001',
    product: 'Jogger Pants',
    productId: 'PROD-006',
    stock: 5,
    suggested: 30,
    trigger: 'Below safety threshold',
    warehouse: 'Northwest Warehouse',
    level: 'danger',
    levelLabel: 'Urgent',
    icon: '👖',
    threshold: 25
  },
  {
    id: 'REM-002',
    product: 'Hooded Sweatshirt',
    productId: 'PROD-003',
    stock: 30,
    suggested: 25,
    trigger: 'Below safety threshold',
    warehouse: 'East China Warehouse',
    level: 'warning',
    levelLabel: 'Warning',
    icon: '🧥',
    threshold: 50
  },
  {
    id: 'REM-003',
    product: 'Classic Denim Jeans',
    productId: 'PROD-002',
    stock: 65,
    suggested: 20,
    trigger: 'Abnormal sales growth',
    warehouse: 'South China Warehouse',
    level: 'warning',
    levelLabel: 'Warning',
    icon: '👖',
    threshold: 50
  }
]);

const vendors = ['JingCai Technology', 'HuaTeng Electronics', 'LianChuang Supply Chain'];

const application = reactive({
  product: '',
  vendor: '',
  quantity: '',
  deliveryDate: '',
  remark: ''
});

const progress = reactive([
  {
    title: 'Replenishment Alert Generated',
    desc: 'System detected inventory below safety threshold',
    time: '2024-01-11 09:15',
    status: 'completed'
  },
  {
    title: 'Application Submitted',
    desc: 'Warehouse manager confirmed replenishment need',
    time: '2024-01-11 10:05',
    status: 'completed'
  },
  {
    title: 'Under Approval',
    desc: 'Waiting for procurement manager approval',
    time: '2024-01-11 11:20',
    status: 'processing'
  },
  {
    title: 'Procurement Integration',
    desc: 'Sync to procurement module after approval',
    time: '--',
    status: 'pending'
  }
]);

const selectReminder = (reminder) => {
  application.product = reminder.product;
  application.quantity = reminder.suggested;
};

const submitApplication = () => {
  if (!application.product || !application.vendor || !application.quantity || !application.deliveryDate) {
    window.alert('Please complete application information');
    return;
  }
  window.alert('Replenishment application submitted (demo)');
};
</script>

<style scoped>
.replenishment {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
  gap: 24px;
}

.replenishment__reminder {
  display: flex;
  flex-direction: column;
  gap: 12px;
  cursor: pointer;
}

.replenishment__reminder--active {
  border: 1px solid rgba(43, 181, 192, 0.4);
}

.replenishment__reminder-header,
.replenishment__reminder-body,
.replenishment__reminder-meta {
  display: flex;
  justify-content: space-between;
}

.replenishment__reminder-meta {
  color: #9ca3af;
  font-size: 13px;
}

.replenishment__form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.replenishment__form-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.replenishment__timeline .timeline-dot {
  background-color: var(--color-border);
}

.timeline-dot--completed {
  background-color: var(--color-success);
}

.timeline-dot--processing {
  background-color: var(--color-brand);
}

.timeline-dot--pending {
  background-color: var(--color-border);
}

@media (max-width: 960px) {
  .replenishment {
    grid-template-columns: 1fr;
  }
}
</style>

