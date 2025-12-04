<template>
  <div class="approval">
    <section class="card">
      <h2 class="section-title">Pending Replenishment Applications</h2>
      <div class="approval__table">
        <div class="approval__table-header">
          <span class="col col-wide">Application</span>
          <span class="col">Warehouse</span>
          <span class="col">Quantity</span>
          <span class="col">Status</span>
        </div>
        <div
          v-for="application in applications"
          :key="application.requestId"
          class="approval__table-row"
          :class="{ 'approval__table-row--active': selectedApplication?.requestId === application.requestId }"
          @click="selectApplication(application)"
        >
          <div class="col col-wide">
            <div class="approval__row-title">{{ application.requestId }}</div>
            <div class="approval__row-meta">{{ application.productName }} (SKU: {{ application.productId }}) · Trigger: {{ application.reason }}</div>
          </div>
          <span class="col">{{ application.warehouseName }}</span>
          <span class="col">{{ application.quantity }}</span>
          <span class="col">
            <span class="tag" :class="applicationStatusClass(application.status)">
              {{ applicationStatusLabel(application.status) }}
            </span>
          </span>
        </div>
      </div>
    </section>

    <section v-if="selectedApplication" class="card">
      <h2 class="section-title">Application Details</h2>
      <div class="approval__detail">
        <div><strong>Product:</strong> {{ selectedApplication.productName }}</div>
        <div><strong>SKU:</strong> {{ selectedApplication.productId }}</div>
        <div><strong>Warehouse:</strong> {{ selectedApplication.warehouseName }}</div>
        <div><strong>Restock Quantity:</strong> {{ selectedApplication.quantity }}</div>
        <div><strong>Suggested Vendor:</strong> {{ selectedApplication.vendor }}</div>
        <div><strong>Expected Arrival:</strong> {{ new Date(selectedApplication.deliveryDate).toLocaleDateString() }}</div>
        <div><strong>Reason:</strong> {{ selectedApplication.reason || 'N/A' }}</div>
      </div>
      <div class="approval__decision">
        <label class="form-label">Decision</label>
        <div class="approval__decision-actions">
          <button class="btn-primary" type="button" @click="approve(true)">Approve</button>
          <button class="btn-secondary" type="button" @click="approve(false)">Reject</button>
        </div>
        <textarea
          v-model="decisionRemark"
          class="form-textarea"
          rows="3"
          placeholder="Approval remark"
        />
      </div>
    </section>

    <section class="card">
      <h2 class="section-title">Approval Timeline</h2>
      <div class="timeline">
        <div v-for="item in timeline" :key="item.id" class="timeline-item">
          <span class="timeline-dot" :class="`timeline-dot--${item.status}`" />
          <div class="timeline-content">
            <span class="timeline-title">{{ item.title }}</span>
            <span class="timeline-desc">{{ item.desc }}</span>
            <span class="timeline-time">{{ item.time }}</span>
          </div>
        </div>
      </div>
    </section>

    <!-- Allocate Commodities Form - shown after approval -->
    <section v-if="allocationFormVisible && selectedApplication" class="card">
      <h2 class="section-title">Allocate Commodities</h2>
      <form class="allocation__form" @submit.prevent="allocate">
        <div class="allocation__form-row">
          <div class="form-group">
            <label class="form-label" for="from">Transfer From *</label>
            <select id="from" v-model="transfer.from" class="filter-pill" required>
              <option value="">Select warehouse</option>
              <option value="Central Warehouse">Central Warehouse</option>
              <option value="East Warehouse">East Warehouse</option>
              <option value="West Warehouse">West Warehouse</option>
              <option value="North Warehouse">North Warehouse</option>
              <option value="South Warehouse">South Warehouse</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label" for="to">Transfer To *</label>
            <select id="to" v-model="transfer.to" class="filter-pill" required>
              <option value="">Select warehouse</option>
              <option value="Central Warehouse">Central Warehouse</option>
              <option value="East Warehouse">East Warehouse</option>
              <option value="West Warehouse">West Warehouse</option>
              <option value="North Warehouse">North Warehouse</option>
              <option value="South Warehouse">South Warehouse</option>
            </select>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label" for="sku">Product SKU *</label>
          <input id="sku" v-model="transfer.sku" class="form-input" placeholder="PROD-001" required />
        </div>
        <div class="form-group">
          <label class="form-label" for="qty">Quantity *</label>
          <input id="qty" v-model.number="transfer.quantity" class="form-input" type="number" min="1" required />
        </div>
        <div class="form-group">
          <label class="form-label" for="reason">Reason *</label>
          <textarea id="reason" v-model="transfer.reason" class="form-textarea" rows="3" required />
        </div>
        <button class="btn-primary" type="submit">Create Transfer Order</button>
      </form>
    </section>

    <section v-if="allocationHistory.length" class="card">
      <h2 class="section-title">Recent Allocations</h2>
      <div class="allocation__history">
        <div v-for="record in allocationHistory" :key="record.id" class="allocation__history-item">
          <div class="allocation__history-header">
            <span>{{ record.id }}</span>
            <span class="tag" :class="record.statusClass">{{ record.status }}</span>
          </div>
          <div class="allocation__history-body">
            <span>{{ record.from }} → {{ record.to }}</span>
            <span>{{ record.sku }} · {{ record.quantity }} units</span>
          </div>
          <div class="allocation__history-meta">
            <span>Created: {{ record.time }}</span>
            <span>ETA: {{ record.eta }}</span>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { reactive, ref, computed, onMounted } from 'vue';
import {
  fetchReplenishmentApplications,
  updateReplenishmentApplicationStatus
} from '../services/replenishmentService';
import { fetchTransfers, createTransferOrder } from '../services/transferService';

const statusMap = {
  PENDING: { label: 'Waiting', class: 'warning' },
  PROCESSING: { label: 'Processing', class: 'info' },
  APPROVED: { label: 'Approved', class: 'success' },
  REJECTED: { label: 'Rejected', class: 'danger' },
  COMPLETED: { label: 'Completed', class: 'success' }
};

const warehouseMap = {
  'Central Warehouse': 'WH-CENTRAL',
  'East Warehouse': 'WH-EAST',
  'West Warehouse': 'WH-WEST',
  'North Warehouse': 'WH-NORTH',
  'South Warehouse': 'WH-SOUTH'
};

const applications = ref([]);
const selectedApplication = ref(null);
const decisionRemark = ref('');
const allocationFormVisible = ref(false);
const transfers = ref([]);
const loading = ref(false);

const transfer = reactive({
  from: '',
  to: '',
  sku: '',
  quantity: 0,
  reason: ''
});

const applicationStatusLabel = (status) => statusMap[status]?.label || status;
const applicationStatusClass = (status) => statusMap[status]?.class || 'default';

const timeline = computed(() =>
  (selectedApplication.value?.progress || []).map((step, idx) => ({
    id: `${selectedApplication.value?.requestId || 'req'}-${idx}`,
    title: step.title,
    desc: step.desc,
    time: new Date(step.timestamp).toLocaleString(),
    status: step.status
  }))
);

const allocationHistory = computed(() =>
  transfers.value.map((record) => ({
    id: record.transferId,
    from: record.fromLocationName,
    to: record.toLocationName,
    sku: record.productSku,
    quantity: record.quantity,
    time: new Date(record.createdAt).toLocaleString(),
    eta: record.dispatchInfo?.departure ? new Date(record.dispatchInfo.departure).toLocaleDateString() : '--',
    status: applicationStatusLabel(record.status),
    statusClass: applicationStatusClass(record.status)
  }))
);

const loadApplications = async () => {
  loading.value = true;
  try {
    // 只加载 PENDING 状态的申请（已完成的不会显示）
    applications.value = await fetchReplenishmentApplications('PENDING');
    if (!selectedApplication.value && applications.value.length > 0) {
      selectedApplication.value = applications.value[0];
    } else if (selectedApplication.value) {
      selectedApplication.value =
        applications.value.find((item) => item.requestId === selectedApplication.value.requestId) ||
        applications.value[0] ||
        null;
    }
    allocationFormVisible.value = selectedApplication.value?.status === 'APPROVED';
  } finally {
    loading.value = false;
  }
};

const loadTransfers = async () => {
  transfers.value = await fetchTransfers('WH-CENTRAL');
};

const selectApplication = (application) => {
  selectedApplication.value = application;
  allocationFormVisible.value = application?.status === 'APPROVED';
  transfer.from = 'Central Warehouse';
  transfer.to = application?.warehouseName || '';
  transfer.sku = application?.productId || '';
  transfer.quantity = application?.quantity || 0;
  transfer.reason = application?.reason || '';
};

const approve = async (approved) => {
  if (!selectedApplication.value) return;
  if (!approved && !decisionRemark.value.trim()) {
    window.alert('Please provide a rejection remark');
    return;
  }
  const decision = approved ? 'APPROVED' : 'REJECTED';
  try {
    const updated = await updateReplenishmentApplicationStatus(selectedApplication.value.requestId, {
      decision,
      remark: decisionRemark.value
    });
    await loadApplications();
    selectApplication(updated);
    if (approved) {
      allocationFormVisible.value = true;
    } else {
      allocationFormVisible.value = false;
    }
    window.alert(`Application ${decision.toLowerCase()}`);
  } catch (error) {
    window.alert(error.message || 'Operation failed');
  } finally {
    decisionRemark.value = '';
  }
};

const allocate = async () => {
  if (!selectedApplication.value) return;
  if (!transfer.from || !transfer.to || !transfer.quantity) {
    window.alert('Please fill in all allocation fields');
    return;
  }
  if (transfer.from === transfer.to) {
    window.alert('Source and destination cannot be the same');
    return;
  }
  try {
    await createTransferOrder({
      productSku: transfer.sku || selectedApplication.value.productId,
      productName: selectedApplication.value.productName,
      quantity: Number(transfer.quantity),
      fromLocationId: warehouseMap[transfer.from],
      fromLocationName: transfer.from,
      toLocationId: warehouseMap[transfer.to],
      toLocationName: transfer.to,
      requestId: selectedApplication.value.requestId
    });
    // 重新加载应用以更新 timeline
    await loadApplications();
    // 如果补货申请已完成，隐藏分配表单
    if (selectedApplication.value?.status === 'COMPLETED') {
      allocationFormVisible.value = false;
    }
    await loadTransfers();
    window.alert('Transfer order created and dispatched');
  } catch (error) {
    window.alert(error.message || 'Failed to create transfer');
  }
};

onMounted(async () => {
  await Promise.all([loadApplications(), loadTransfers()]);
});
</script>

<style scoped>
.approval {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
  gap: 24px;
}

.approval__table {
  display: flex;
  flex-direction: column;
  border-radius: 16px;
  border: 1px solid var(--color-border);
  overflow: hidden;
}

.approval__table-header,
.approval__table-row {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr;
  gap: 12px;
  padding: 16px 20px;
  align-items: center;
}

.approval__table-header {
  background-color: var(--color-surface-alt);
  font-weight: 600;
  color: var(--color-text-muted);
}

.approval__table-row {
  border-top: 1px solid var(--color-border);
  cursor: pointer;
}

.approval__table-row--active {
  background-color: rgba(43, 181, 192, 0.12);
}

.approval__row-title {
  font-weight: 600;
}

.approval__row-meta {
  margin-top: 4px;
  font-size: 13px;
  color: #9ca3af;
}

.approval__detail {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 8px;
  background: var(--color-background);
  padding: 12px;
  border-radius: 12px;
  margin-bottom: 12px;
}

.approval__decision {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.approval__decision-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.allocation__form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.allocation__form-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.allocation__history {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.allocation__history-item {
  background: var(--color-background);
  border-radius: 12px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.allocation__history-header,
.allocation__history-body,
.allocation__history-meta {
  display: flex;
  justify-content: space-between;
}

.timeline-dot--completed {
  background-color: var(--color-success);
}

.timeline-dot--processing {
  background-color: var(--color-brand);
}

@media (max-width: 960px) {
  .approval {
    grid-template-columns: 1fr;
  }
}
</style>
