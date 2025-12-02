<template>
  <div class="dispatch">
    <section class="card">
      <h2 class="section-title">Pending Dispatch Orders</h2>
      <div class="list">
        <div
          v-for="order in pendingShipments"
          :key="order.orderNo"
          class="list-item dispatch__order"
          :class="{ 'dispatch__order--active': selectedShipment?.orderNo === order.orderNo }"
          @click="selectShipment(order)"
        >
          <div class="dispatch__order-header">
            <span>{{ order.orderNo }}</span>
            <span class="tag" :class="order.priority">{{ order.priorityLabel }}</span>
          </div>
          <div class="dispatch__order-body">
            <span>Destination: {{ order.destination }}</span>
            <span>Items: {{ order.items }} SKU</span>
          </div>
          <div class="dispatch__order-meta">
            <span>Planned Departure: {{ order.departure }}</span>
            <span>Carrier: {{ order.carrier }}</span>
          </div>
        </div>
      </div>
    </section>

    <section class="card">
      <h2 class="section-title">Dispatch Arrangement</h2>
      <div v-if="selectedShipment" class="dispatch__summary">
        <div><strong>Order:</strong> {{ selectedShipment.orderNo }}</div>
        <div><strong>Destination:</strong> {{ selectedShipment.destination }}</div>
        <div><strong>Priority:</strong> {{ selectedShipment.priorityLabel }}</div>
      </div>
      <form class="dispatch__form" @submit.prevent="confirmDispatch">
        <div class="form-group">
          <label class="form-label" for="transferFrom">Transfer From *</label>
          <select id="transferFrom" v-model="dispatchPlan.transferFrom" class="filter-pill" required>
            <option value="">Select warehouse</option>
            <option v-for="warehouse in warehouses" :key="warehouse" :value="warehouse">
              {{ warehouse }}
            </option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label" for="transferTo">Transfer To *</label>
          <select id="transferTo" v-model="dispatchPlan.transferTo" class="filter-pill" required>
            <option value="">Select store</option>
            <option v-for="store in stores" :key="store" :value="store">
              {{ store }}
            </option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label" for="dispatchQuantity">Dispatch Quantity *</label>
          <input
            id="dispatchQuantity"
            v-model.number="dispatchPlan.dispatchQuantity"
            class="form-input"
            type="number"
            min="1"
            placeholder="Enter quantity"
            required
          />
        </div>
        <div class="form-group">
          <label class="form-label" for="carrier">Carrier</label>
          <select id="carrier" v-model="dispatchPlan.carrier" class="filter-pill">
            <option value="">Select carrier</option>
            <option v-for="carrier in carriers" :key="carrier" :value="carrier">
              {{ carrier }}
            </option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label" for="dock">Dock</label>
          <input id="dock" v-model="dispatchPlan.dock" class="form-input" placeholder="Dock number / gate" />
        </div>
        <div class="form-group">
          <label class="form-label" for="departure">Departure Time</label>
          <input id="departure" v-model="dispatchPlan.departure" class="form-input" type="datetime-local" />
        </div>
        <div class="form-group">
          <label class="form-label" for="remark">Remark</label>
          <textarea
            id="remark"
            v-model="dispatchPlan.remark"
            class="form-textarea"
            rows="3"
            placeholder="Handling notes"
          />
        </div>
        <button class="btn-primary" type="submit">Confirm Dispatch</button>
      </form>
    </section>

    <section class="card">
      <h2 class="section-title">Dispatch History</h2>
      <div class="timeline">
        <div v-for="record in history" :key="record.id" class="timeline-item">
          <span class="timeline-dot" />
          <div class="timeline-content">
            <span class="timeline-title">{{ record.title }}</span>
            <span class="timeline-desc">{{ record.desc }}</span>
            <span class="timeline-time">{{ record.time }}</span>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue';
import { useInventoryStore } from '../store/inventoryStore';

const inventoryStore = useInventoryStore();

const carriers = ['Sunshine Logistics', 'East Freight', 'Atlas Transport'];

const warehouses = ['西部仓库', '东部仓库', '北部仓库', '南部仓库'];

const stores = [
  '西部门店1',
  '西部门店2',
  '东部门店1',
  '东部门店2',
  '北部门店1',
  '北部门店2',
  '南部门店1',
  '南部门店2'
];

const pendingShipments = reactive([
  {
    orderNo: 'DISP-20251128-901',
    destination: 'East China Flagship Store',
    items: 42,
    departure: '2025-11-28 15:30',
    carrier: 'Sunshine Logistics',
    priority: 'warning',
    priorityLabel: 'Urgent'
  },
  {
    orderNo: 'DISP-20251126-510',
    destination: 'South China Wholesale Center',
    items: 27,
    departure: '2025-11-29 09:00',
    carrier: 'East Freight',
    priority: 'default',
    priorityLabel: 'Normal'
  },
  {
    orderNo: 'DISP-20251125-318',
    destination: 'Northwest Regional Partner',
    items: 18,
    departure: '2025-11-29 13:45',
    carrier: 'Atlas Transport',
    priority: 'info',
    priorityLabel: 'Scheduled'
  }
]);

const selectedShipment = ref(pendingShipments[0]);

const dispatchPlan = reactive({
  transferFrom: '',
  transferTo: '',
  dispatchQuantity: null,
  carrier: '',
  dock: '',
  departure: '',
  remark: ''
});

const history = reactive([
  {
    id: 'his-1',
    title: 'DISP-20251122-110 Dispatched',
    desc: 'Sent to Central Retail Hub via Sunshine Logistics',
    time: '2025-11-22 14:20'
  },
  {
    id: 'his-2',
    title: 'DISP-20251120-088 Dispatched',
    desc: 'Sent to South China Distribution Center',
    time: '2025-11-20 09:10'
  }
]);

const selectShipment = (order) => {
  selectedShipment.value = order;
};

const confirmDispatch = () => {
  if (!selectedShipment.value) {
    window.alert('Please select a shipment order');
    return;
  }
  if (!dispatchPlan.transferFrom || !dispatchPlan.transferTo || !dispatchPlan.dispatchQuantity) {
    window.alert('Please complete required fields: Transfer From, Transfer To, and Dispatch Quantity');
    return;
  }
  if (dispatchPlan.dispatchQuantity <= 0) {
    window.alert('Dispatch Quantity must be greater than 0');
    return;
  }

  // Add to Dispatch History
  const now = new Date();
  const timeStr = now.toLocaleString('en-US', { 
    year: 'numeric', 
    month: '2-digit', 
    day: '2-digit', 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: false 
  }).replace(',', '');
  
  const historyEntry = {
    id: `his-${Date.now()}`,
    title: `${selectedShipment.value.orderNo} Dispatched`,
    desc: `Transferred ${dispatchPlan.dispatchQuantity} units from ${dispatchPlan.transferFrom} to ${dispatchPlan.transferTo}${dispatchPlan.carrier ? ` via ${dispatchPlan.carrier}` : ''}`,
    time: timeStr
  };
  
  history.unshift(historyEntry);
  
  // Store dispatch update for inventory synchronization
  inventoryStore.addDispatchUpdate({
    transferFrom: dispatchPlan.transferFrom,
    transferTo: dispatchPlan.transferTo,
    quantity: dispatchPlan.dispatchQuantity,
    orderNo: selectedShipment.value.orderNo,
    timestamp: now.toISOString()
  });

  // Remove from pending shipments
  const index = pendingShipments.findIndex(s => s.orderNo === selectedShipment.value.orderNo);
  if (index > -1) {
    pendingShipments.splice(index, 1);
  }

  // Reset form and selection
  selectedShipment.value = pendingShipments[0] || null;
  Object.assign(dispatchPlan, {
    transferFrom: '',
    transferTo: '',
    dispatchQuantity: null,
    carrier: '',
    dock: '',
    departure: '',
    remark: ''
  });

  window.alert(`Order ${selectedShipment.value?.orderNo || 'dispatch'} confirmed successfully`);
};
</script>

<style scoped>
.dispatch {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
  gap: 24px;
}

.dispatch__order {
  display: flex;
  flex-direction: column;
  gap: 12px;
  cursor: pointer;
}

.dispatch__order--active {
  border: 1px solid rgba(43, 181, 192, 0.4);
}

.dispatch__order-header,
.dispatch__order-body,
.dispatch__order-meta {
  display: flex;
  justify-content: space-between;
}

.dispatch__order-meta {
  color: #9ca3af;
  font-size: 13px;
}

.dispatch__summary {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px;
  border-radius: 12px;
  background: var(--color-background);
  margin-bottom: 12px;
}

.dispatch__form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

@media (max-width: 960px) {
  .dispatch {
    grid-template-columns: 1fr;
  }
}
</style>


