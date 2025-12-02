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
          :key="application.id"
          class="approval__table-row"
          :class="{ 'approval__table-row--active': selectedApplication?.id === application.id }"
          @click="selectApplication(application)"
        >
          <div class="col col-wide">
            <div class="approval__row-title">{{ application.id }}</div>
            <div class="approval__row-meta">{{ application.product }} · Trigger: {{ application.reason }}</div>
          </div>
          <span class="col">{{ application.warehouse }}</span>
          <span class="col">{{ application.quantity }}</span>
          <span class="col"><span class="tag" :class="application.statusClass">{{ application.statusLabel }}</span></span>
        </div>
      </div>
    </section>

    <section v-if="selectedApplication" class="card">
      <h2 class="section-title">Application Details</h2>
      <div class="approval__detail">
        <div><strong>Product:</strong> {{ selectedApplication.product }}</div>
        <div><strong>Requested By:</strong> {{ selectedApplication.requester }}</div>
        <div><strong>Suggested Vendor:</strong> {{ selectedApplication.vendor }}</div>
        <div><strong>Expected Arrival:</strong> {{ selectedApplication.delivery }}</div>
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

    <!-- Allocate Commodities Form - shown after approval -->
    <section v-if="showAllocationForm && selectedApplication" class="card">
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
          <select id="sku" v-model="transfer.sku" class="filter-pill" required>
            <option value="">Select product</option>
            <option v-for="item in skuOptions" :key="item.sku" :value="item.sku">
              {{ item.sku }} - {{ item.name }}
            </option>
          </select>
        </div>
        <div class="allocation__form-row">
          <div class="form-group">
            <label class="form-label" for="qty">Quantity *</label>
            <input id="qty" v-model.number="transfer.quantity" class="form-input" type="number" min="1" required />
          </div>
          <div class="form-group">
            <label class="form-label" for="eta">ETA *</label>
            <input id="eta" v-model="transfer.eta" class="form-input" type="date" required />
          </div>
        </div>
        <div class="form-group">
          <label class="form-label" for="reason">Reason *</label>
          <textarea id="reason" v-model="transfer.reason" class="form-textarea" rows="3" required />
        </div>
        <button class="btn-primary" type="submit">Create Transfer Order</button>
      </form>
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

    <section class="card">
      <h2 class="section-title">Recent Allocations</h2>
      <div class="allocation__history">
        <div v-for="record in history" :key="record.id" class="allocation__history-item">
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
import { reactive, ref } from 'vue';

const applications = reactive([
  {
    id: 'RA-20251128-018',
    product: 'Jogger Pants',
    warehouse: 'East China Warehouse',
    quantity: 300,
    reason: 'Below safety stock',
    vendor: 'JingCai Technology',
    requester: 'Regional Manager Zhang',
    delivery: '2025-12-02',
    statusClass: 'warning',
    statusLabel: 'Pending'
  },
  {
    id: 'RA-20251126-009',
    product: 'Hooded Sweatshirt',
    warehouse: 'South China Warehouse',
    quantity: 200,
    reason: 'Promotional demand',
    vendor: 'HuaTeng Electronics',
    requester: 'Regional Manager Liu',
    delivery: '2025-12-03',
    statusClass: 'info',
    statusLabel: 'Under Review'
  },
  {
    id: 'RA-20251124-021',
    product: 'Classic Denim Jeans',
    warehouse: 'Northwest Warehouse',
    quantity: 150,
    reason: 'Seasonal adjustment',
    vendor: 'LianChuang Supply Chain',
    requester: 'Regional Manager Chen',
    delivery: '2025-12-01',
    statusClass: 'info',
    statusLabel: 'Under Review'
  }
]);

const selectedApplication = ref(applications[0]);
const decisionRemark = ref('');
const showAllocationForm = ref(false);

const skuOptions = reactive([
  { sku: 'PROD-001', name: 'Casual T-Shirt' },
  { sku: 'PROD-002', name: 'Classic Denim Jeans' },
  { sku: 'PROD-003', name: 'Hooded Sweatshirt' },
  { sku: 'PROD-004', name: 'Chino Pants' },
  { sku: 'PROD-005', name: 'Polo Shirt' },
  { sku: 'PROD-006', name: 'Jogger Pants' }
]);

const transfer = reactive({
  from: '',
  to: '',
  sku: '',
  quantity: 0,
  eta: '',
  reason: ''
});

const timeline = reactive([
  {
    id: 'tl-1',
    title: 'Application Submitted',
    desc: 'Regional manager confirmed replenishment requirement',
    time: '2025-11-28 09:20',
    status: 'completed'
  },
  {
    id: 'tl-2',
    title: 'Stock Analysis Completed',
    desc: 'Central system verified inventory gap',
    time: '2025-11-28 09:45',
    status: 'completed'
  },
  {
    id: 'tl-3',
    title: 'Waiting for Approval',
    desc: 'Pending central manager decision',
    time: '2025-11-28 10:05',
    status: 'processing'
  }
]);

const history = reactive([
  {
    id: 'TRF-20251125-011',
    from: 'Central Warehouse',
    to: 'East Warehouse',
    sku: 'PROD-003',
    quantity: 150,
    time: '2025-11-25 13:10',
    eta: '2025-11-28',
    status: 'In Transit',
    statusClass: 'info'
  },
  {
    id: 'TRF-20251123-006',
    from: 'Central Warehouse',
    to: 'South Warehouse',
    sku: 'PROD-002',
    quantity: 80,
    time: '2025-11-23 10:45',
    eta: '2025-11-27',
    status: 'Completed',
    statusClass: 'success'
  }
]);

const selectApplication = (application) => {
  selectedApplication.value = application;
  showAllocationForm.value = false;
  // Reset transfer form
  transfer.from = '';
  transfer.to = '';
  transfer.sku = '';
  transfer.quantity = 0;
  transfer.eta = '';
  transfer.reason = '';
};

const approve = (approved) => {
  if (!selectedApplication.value) {
    return;
  }
  
  // Validate decision remark if rejecting
  if (!approved && !decisionRemark.value.trim()) {
    window.alert('Please provide a rejection reason');
    return;
  }

  const action = approved ? 'approved' : 'rejected';
  
  if (approved) {
    // Show allocation form after approval
    showAllocationForm.value = true;
    // Pre-fill some fields from the application
    transfer.sku = getSkuFromProduct(selectedApplication.value.product);
    transfer.quantity = selectedApplication.value.quantity;
    
    // Update timeline
    timeline.push({
      id: `tl-${timeline.length + 1}`,
      title: 'Application Approved',
      desc: decisionRemark.value || 'Application approved by central manager',
      time: new Date().toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).replace(/\//g, '-'),
      status: 'completed'
    });
  } else {
    // Update timeline for rejection
    timeline.push({
      id: `tl-${timeline.length + 1}`,
      title: 'Application Rejected',
      desc: decisionRemark.value || 'Application rejected by central manager',
      time: new Date().toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).replace(/\//g, '-'),
      status: 'completed'
    });
    showAllocationForm.value = false;
  }
  
  // Update application status
  selectedApplication.value.statusClass = approved ? 'success' : 'danger';
  selectedApplication.value.statusLabel = approved ? 'Approved' : 'Rejected';
  
  decisionRemark.value = '';
};

const getSkuFromProduct = (productName) => {
  const productMap = {
    'Jogger Pants': 'PROD-006',
    'Hooded Sweatshirt': 'PROD-003',
    'Classic Denim Jeans': 'PROD-002',
    'Casual T-Shirt': 'PROD-001',
    'Chino Pants': 'PROD-004',
    'Polo Shirt': 'PROD-005'
  };
  return productMap[productName] || '';
};

const allocate = () => {
  // Validate all required fields
  if (!transfer.from || !transfer.to || !transfer.sku || !transfer.quantity || !transfer.eta || !transfer.reason.trim()) {
    window.alert('Please fill in all required fields');
    return;
  }
  
  if (transfer.from === transfer.to) {
    window.alert('Source and destination cannot be the same');
    return;
  }
  
  if (transfer.quantity <= 0) {
    window.alert('Quantity must be greater than 0');
    return;
  }

  // Create transfer order
  const transferId = `TRF-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(history.length + 1).padStart(3, '0')}`;
  const now = new Date();
  const timeStr = now.toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).replace(/\//g, '-');
  
  history.unshift({
    id: transferId,
    from: transfer.from,
    to: transfer.to,
    sku: transfer.sku,
    quantity: transfer.quantity,
    time: timeStr,
    eta: transfer.eta,
    status: 'In Transit',
    statusClass: 'info'
  });

  // Update timeline
  timeline.push({
    id: `tl-${timeline.length + 1}`,
    title: 'Transfer Order Created',
    desc: `${transfer.quantity} units of ${transfer.sku} from ${transfer.from} to ${transfer.to}`,
    time: timeStr,
    status: 'completed'
  });

  // Update regional warehouse inventory (simulated)
  // In a real application, this would call an API to update the inventory
  console.log(`Updating inventory: ${transfer.quantity} units of ${transfer.sku} from ${transfer.from} to ${transfer.to}`);
  
  window.alert(`Transfer order ${transferId} created successfully`);
  
  // Reset form
  transfer.from = '';
  transfer.to = '';
  transfer.sku = '';
  transfer.quantity = 0;
  transfer.eta = '';
  transfer.reason = '';
  showAllocationForm.value = false;
};
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
