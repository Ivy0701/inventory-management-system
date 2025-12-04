<template>
  <div class="replenishment">
    <section class="card">
      <h2 class="section-title">Inventory Replenishment Alerts</h2>
      <div class="list" v-if="!loading">
        <div
          v-for="reminder in alerts"
          :key="reminder.alertId"
          class="list-item replenishment__reminder"
          :class="{ 'replenishment__reminder--active': selectedAlertId === reminder.alertId }"
          @click="selectReminder(reminder)"
        >
          <div class="replenishment__reminder-header">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 24px;">{{ reminder.icon || '📦' }}</span>
              <div style="display: flex; flex-direction: column;">
                <span>{{ reminder.productName }}</span>
                <span style="font-size: 12px; color: #9ca3af;">SKU: {{ reminder.productId }}</span>
              </div>
            </div>
            <span class="tag" :class="reminder.level">{{ reminder.levelLabel }}</span>
          </div>
          <div class="replenishment__reminder-body">
            <span>Product SKU: {{ reminder.productId }}</span>
            <span>Warehouse: {{ reminder.warehouseName }}</span>
            <span>Current Stock: {{ reminder.stock }}</span>
            <span v-if="reminder.shortageQty">Shortage Qty: {{ reminder.shortageQty }}</span>
            <span>Suggested Restock: {{ reminder.suggested }}</span>
          </div>
          <div class="replenishment__reminder-meta">
            <span>Trigger Reason: {{ reminder.trigger }}</span>
          </div>
          <div v-if="reminder.threshold" class="replenishment__reminder-meta" style="margin-top: 4px;">
            <span>Safety Threshold: {{ reminder.threshold }}</span>
          </div>
        </div>
        <p v-if="!alerts.length" class="empty-hint">No alerts</p>
      </div>
    </section>

    <section class="card">
      <h2 class="section-title">Pending Replenishment Board</h2>
      <div v-if="pendingLoading" class="empty-hint">Loading tasks...</div>
      <div v-else-if="boardApplications.length" class="list">
        <div v-for="item in boardApplications" :key="item.requestId" class="list-item replenishment__reminder">
          <div class="replenishment__reminder-header">
            <div style="display: flex; flex-direction: column;">
              <span>{{ item.requestId }}</span>
              <span style="font-size: 12px; color: #9ca3af;">{{ item.productName }} · {{ item.quantity }} units</span>
            </div>
            <span class="tag" :class="item.statusClass">{{ item.statusLabel }}</span>
          </div>
          <div class="replenishment__reminder-body">
            <span>Warehouse: {{ item.warehouseName }}</span>
            <span>Status Route: {{ item.routeText }}</span>
            <span>Submitted: {{ item.submittedAt }}</span>
            <span>Last Update: {{ item.lastUpdate }}</span>
          </div>
        </div>
      </div>
      <p v-else class="empty-hint">No pending replenishment tasks</p>
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
        <div v-for="item in progress" :key="`${item.requestId}-${item.title}-${item.time}`" class="timeline-item">
          <span class="timeline-dot" :class="`timeline-dot--${item.status}`" />
          <div class="timeline-content">
            <span class="timeline-title">{{ item.title }}</span>
            <span class="timeline-desc">{{ item.desc }}</span>
            <span class="timeline-time">{{ new Date(item.time).toLocaleString() }}</span>
          </div>
        </div>
        <p v-if="!progress.length" class="empty-hint">No progress records</p>
      </div>
    </section>
  </div>
</template>

<script setup>
import { reactive, ref, computed, onMounted } from 'vue';
import { useAppStore } from '../store/appStore';
import {
  fetchReplenishmentAlerts,
  fetchReplenishmentProgress,
  submitReplenishmentApplication,
  fetchReplenishmentApplications
} from '../services/replenishmentService';

const appStore = useAppStore();

const alerts = ref([]);
const progress = ref([]);
const pendingApplications = ref([]);
const loading = ref(false);
const pendingLoading = ref(false);

const vendors = ['JingCai Technology', 'HuaTeng Electronics', 'LianChuang Supply Chain'];

const selectedAlertId = ref(null);
const selectedAlert = ref(null);
const assignedWarehouseId = computed(() => appStore.user.assignedLocationId || 'WH-EAST');

const requestStatusMap = {
  PENDING: { label: 'Pending Approval', class: 'warning' },
  PROCESSING: { label: 'Processing', class: 'info' },
  APPROVED: { label: 'Approved', class: 'success' },
  IN_TRANSIT: { label: 'In Transit', class: 'info' },
  ARRIVED: { label: 'Arrived', class: 'success' },
  COMPLETED: { label: 'Completed', class: 'success' },
  REJECTED: { label: 'Completed', class: 'default' }
};

const application = reactive({
  productId: '',
  product: '',
  vendor: '',
  quantity: '',
  deliveryDate: '',
  remark: ''
});

const loadReplenishmentData = async () => {
  loading.value = true;
  try {
    const [alertData, progressData] = await Promise.all([
      fetchReplenishmentAlerts(),
      fetchReplenishmentProgress()
    ]);
    // 只显示未提交申请的预警（已提交申请的预警会被删除）
    alerts.value = alertData;
    progress.value = progressData;
    if (alerts.value.length > 0) {
      selectReminder(alerts.value[0]);
    } else {
      selectedAlertId.value = null;
      selectedAlert.value = null;
    }
  } catch (error) {
    console.error(error);
    await loadPendingApplications();
  } finally {
    loading.value = false;
  }
};

const loadPendingApplications = async () => {
  pendingLoading.value = true;
  try {
    const apps = await fetchReplenishmentApplications({
      warehouseId: assignedWarehouseId.value
    });
    pendingApplications.value = apps.sort(
      (a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt)
    );
  } catch (error) {
    console.error(error);
  } finally {
    pendingLoading.value = false;
  }
};

const selectReminder = (reminder) => {
  selectedAlertId.value = reminder.alertId;
  selectedAlert.value = reminder;
  application.product = reminder.productName;
  application.productId = reminder.productId;
  application.quantity = reminder.suggested;
  application.vendor = reminder.suggestedVendor || vendors[0];
  application.remark = reminder.trigger;
};

const boardApplications = computed(() =>
  pendingApplications.value.map((item) => ({
    ...item,
    statusLabel: requestStatusMap[item.status]?.label || item.status,
    statusClass: requestStatusMap[item.status]?.class || 'default',
    submittedAt: new Date(item.createdAt).toLocaleString(),
    lastUpdate: new Date(item.updatedAt || item.createdAt).toLocaleString(),
    routeText: ['IN_TRANSIT', 'ARRIVED'].includes(item.status)
      ? `Central Warehouse → ${item.warehouseName}`
      : 'Awaiting allocation'
  }))
);

const submitApplication = async () => {
  if (!application.productId || !application.vendor || !application.quantity || !application.deliveryDate) {
    window.alert('Please complete application information');
    return;
  }

  try {
    const { alerts: updatedAlerts, progress: updatedProgress } = await submitReplenishmentApplication({
      alertId: selectedAlertId.value,
      productId: application.productId,
      productName: application.product,
      vendor: application.vendor,
      quantity: Number(application.quantity),
      deliveryDate: application.deliveryDate,
      remark: application.remark,
      warehouseId: selectedAlert.value?.warehouseId || appStore.user.assignedLocationId || 'WH-EAST',
      warehouseName: selectedAlert.value?.warehouseName || 'Regional Warehouse',
      reason: application.remark || selectedAlert.value?.trigger
    });

    alerts.value = updatedAlerts;
    progress.value = updatedProgress;
    await loadPendingApplications();

    Object.assign(application, {
      productId: '',
      product: '',
      vendor: '',
      quantity: '',
      deliveryDate: '',
      remark: ''
    });
    selectedAlertId.value = null;
    selectedAlert.value = null;

    window.alert('Replenishment application submitted successfully');
  } catch (error) {
    window.alert(error.message || 'Failed to submit application');
  }
};

onMounted(() => {
  loadReplenishmentData();
});
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

.empty-hint {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 14px;
  text-align: center;
}

@media (max-width: 960px) {
  .replenishment {
    grid-template-columns: 1fr;
  }
}
</style>

