<template>
  <div class="receiving">
    <section class="card">
      <h2 class="section-title">Inbound Schedules</h2>
      <div class="list">
        <div
          v-for="record in inboundPlans"
          :key="record.planNo"
          class="list-item receiving__plan"
          :class="{ 'receiving__plan--active': selectedPlan?.planNo === record.planNo }"
          @click="selectPlan(record)"
        >
          <div class="receiving__plan-header">
            <span>{{ record.planNo }}</span>
            <span class="tag" :class="record.statusClass">{{ record.statusLabel }}</span>
          </div>
          <div class="receiving__plan-body">
            <span>Supplier: {{ record.supplier }}</span>
            <span>Expected Arrival: {{ record.eta }}</span>
          </div>
          <div class="receiving__plan-meta">
            <span>Dock: {{ record.dock }}</span>
            <span>Items: {{ record.items }} SKU</span>
          </div>
        </div>
      </div>
    </section>

    <section class="card">
      <h2 class="section-title">Receiving Checklist</h2>
      <div v-if="selectedPlan" class="receiving__summary">
        <div><strong>Plan:</strong> {{ selectedPlan.planNo }}</div>
        <div><strong>Supplier:</strong> {{ selectedPlan.supplier }}</div>
        <div><strong>Quality Level:</strong> {{ selectedPlan.qualityLevel }}</div>
      </div>
      <form class="receiving__form" @submit.prevent="completeReceiving">
        <div class="receiving__form-row">
          <div class="form-group">
            <label class="form-label" for="received">Received Quantity</label>
            <input id="received" v-model.number="receivingRecord.received" class="form-input" type="number" min="0" />
          </div>
          <div class="form-group">
            <label class="form-label" for="qualified">Qualified Quantity</label>
            <input id="qualified" v-model.number="receivingRecord.qualified" class="form-input" type="number" min="0" />
          </div>
        </div>
        <div class="form-group">
          <label class="form-label" for="issues">Exceptions</label>
          <select id="issues" v-model="receivingRecord.issue" class="filter-pill">
            <option value="">No issues</option>
            <option value="damage">Packaging damage</option>
            <option value="missing">Missing items</option>
            <option value="quality">Quality issue</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label" for="storage">Storage Location</label>
          <input id="storage" v-model="receivingRecord.storage" class="form-input" placeholder="Location code" />
        </div>
        <div class="form-group">
          <label class="form-label" for="remark">Remark</label>
          <textarea id="remark" v-model="receivingRecord.remark" class="form-textarea" rows="3" />
        </div>
        <button class="btn-primary" type="submit">Complete Receiving</button>
      </form>
    </section>

    <section class="card">
      <h2 class="section-title">Recent Receiving Logs</h2>
      <div class="timeline">
        <div v-for="log in logs" :key="log.id" class="timeline-item">
          <span class="timeline-dot" :class="`timeline-dot--${log.result}`" />
          <div class="timeline-content">
            <span class="timeline-title">{{ log.title }}</span>
            <span class="timeline-desc">{{ log.desc }}</span>
            <span class="timeline-time">{{ log.time }}</span>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue';

const inboundPlans = reactive([
  {
    planNo: 'INB-20251128-015',
    supplier: 'JingCai Technology',
    eta: '2025-11-28 10:00',
    dock: 'A-03',
    items: 24,
    statusLabel: 'Arrived',
    statusClass: 'success',
    qualityLevel: 'A'
  },
  {
    planNo: 'INB-20251127-042',
    supplier: 'LianChuang Supply Chain',
    eta: '2025-11-29 14:20',
    dock: 'B-02',
    items: 18,
    statusLabel: 'In Transit',
    statusClass: 'info',
    qualityLevel: 'B'
  },
  {
    planNo: 'INB-20251125-099',
    supplier: 'HuaTeng Electronics',
    eta: '2025-11-30 09:30',
    dock: 'C-01',
    items: 32,
    statusLabel: 'Pending',
    statusClass: 'warning',
    qualityLevel: 'A'
  }
]);

const selectedPlan = ref(inboundPlans[0]);

const receivingRecord = reactive({
  received: 0,
  qualified: 0,
  issue: '',
  storage: '',
  remark: ''
});

const logs = reactive([
  {
    id: 'log-1',
    title: 'INB-20251124-070 Completed',
    desc: '45 SKU stocked at A-01 / A-02',
    time: '2025-11-24 16:25',
    result: 'success'
  },
  {
    id: 'log-2',
    title: 'INB-20251123-031 Exception',
    desc: '3 pieces missing, notified supplier',
    time: '2025-11-23 11:40',
    result: 'warning'
  }
]);

const selectPlan = (plan) => {
  selectedPlan.value = plan;
};

const completeReceiving = () => {
  if (!receivingRecord.received || !receivingRecord.qualified || !receivingRecord.storage) {
    window.alert('Please fill in receiving quantities and storage location');
    return;
  }
  window.alert('Receiving data saved (demo)');
};
</script>

<style scoped>
.receiving {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
  gap: 24px;
}

.receiving__plan {
  display: flex;
  flex-direction: column;
  gap: 12px;
  cursor: pointer;
}

.receiving__plan--active {
  border: 1px solid rgba(43, 181, 192, 0.4);
}

.receiving__plan-header,
.receiving__plan-body,
.receiving__plan-meta {
  display: flex;
  justify-content: space-between;
}

.receiving__plan-meta {
  color: #9ca3af;
  font-size: 13px;
}

.receiving__summary {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px;
  background: var(--color-background);
  border-radius: 12px;
  margin-bottom: 12px;
}

.receiving__form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.receiving__form-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.timeline-dot--success {
  background-color: var(--color-success);
}

.timeline-dot--warning {
  background-color: var(--color-warning);
}

@media (max-width: 960px) {
  .receiving {
    grid-template-columns: 1fr;
  }
}
</style>


