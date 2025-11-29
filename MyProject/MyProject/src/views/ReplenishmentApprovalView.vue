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

const selectApplication = (application) => {
  selectedApplication.value = application;
};

const approve = (approved) => {
  if (!selectedApplication.value) {
    return;
  }
  const action = approved ? 'approved' : 'rejected';
  window.alert(`Application ${selectedApplication.value.id} ${action} (demo)`);
  decisionRemark.value = '';
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


