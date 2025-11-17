<template>
  <div class="return-requests">
    <section class="card">
      <h2 class="section-title">Return Requests</h2>
      <div class="filter-bar">
        <input
          v-model="filters.orderNumber"
          class="form-input return-requests__filter-input"
          placeholder="Order Number"
          @input="applyFilters"
        />
        <input
          v-model="filters.customerName"
          class="form-input return-requests__filter-input"
          placeholder="Customer Name"
          @input="applyFilters"
        />
        <select v-model="filters.status" class="filter-pill return-requests__filter-picker" @change="applyFilters">
          <option value="">Status: All</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="processing">Processing</option>
          <option value="completed">Completed</option>
        </select>
      </div>
    </section>

    <section class="card">
      <h2 class="section-title">Request List</h2>
      <div v-if="!filteredRequests.length" class="empty">No return requests</div>
      <div v-else class="list">
        <div
          v-for="request in filteredRequests"
          :key="request.id"
          class="list-item return-requests__item"
          :class="{ 'return-requests__item--active': selectedRequest && selectedRequest.id === request.id }"
          @click="selectRequest(request)"
        >
          <div class="return-requests__item-header">
            <span>{{ request.orderNumber }}</span>
            <span class="tag" :class="request.statusClass">{{ request.statusLabel }}</span>
          </div>
          <div class="return-requests__item-body">
            <span>Customer: {{ request.customerName }}</span>
            <span>Request Date: {{ formatDate(request.requestDate) }}</span>
          </div>
          <div class="return-requests__item-body">
            <span>Reason: {{ request.reason }}</span>
            <span>Amount: ${{ request.amount }}</span>
          </div>
        </div>
      </div>
    </section>

    <section v-if="selectedRequest" class="card">
      <h2 class="section-title">Return Request Details</h2>
      <div class="return-requests__detail">
        <div class="return-requests__detail-section">
          <h3>Request Information</h3>
          <div class="list">
            <div class="list-item">
              <span>Request ID:</span>
              <span>{{ selectedRequest.id }}</span>
            </div>
            <div class="list-item">
              <span>Order Number:</span>
              <span>{{ selectedRequest.orderNumber }}</span>
            </div>
            <div class="list-item">
              <span>Customer:</span>
              <span>{{ selectedRequest.customerName }}</span>
            </div>
            <div class="list-item">
              <span>Request Date:</span>
              <span>{{ formatDateTime(selectedRequest.requestDate) }}</span>
            </div>
            <div class="list-item">
              <span>Status:</span>
              <span class="tag" :class="selectedRequest.statusClass">{{ selectedRequest.statusLabel }}</span>
            </div>
            <div class="list-item">
              <span>Return Amount:</span>
              <span>${{ selectedRequest.amount }}</span>
            </div>
            <div class="list-item">
              <span>Reason:</span>
              <span>{{ selectedRequest.reason }}</span>
            </div>
            <div v-if="selectedRequest.description" class="list-item">
              <span>Description:</span>
              <span>{{ selectedRequest.description }}</span>
            </div>
          </div>
        </div>

        <div v-if="selectedRequest.items && selectedRequest.items.length > 0" class="return-requests__detail-section">
          <h3>Return Items</h3>
          <div class="list">
            <div v-for="(item, idx) in selectedRequest.items" :key="idx" class="list-item return-requests__product-item">
              <div class="return-requests__product-header">
                <span style="font-size: 24px; margin-right: 8px;">{{ getItemIcon(item.productName) }}</span>
                <span style="font-weight: 600;">{{ item.productName }}</span>
              </div>
              <div class="return-requests__product-body">
                <span v-if="item.color">Color: {{ item.color }}</span>
                <span v-if="item.size">Size: {{ item.size }}</span>
                <span>Quantity: {{ item.quantity }}</span>
                <span>Price: ${{ item.price }}</span>
                <span>Subtotal: ${{ (item.price * item.quantity).toFixed(2) }}</span>
              </div>
            </div>
          </div>
        </div>

        <div v-if="selectedRequest.status === 'pending'" class="return-requests__actions">
          <button class="btn-primary" type="button" @click="approveRequest">Approve Return</button>
          <button class="btn-secondary" type="button" @click="rejectRequest">Reject Return</button>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { reactive, ref, computed } from 'vue';

const filters = reactive({
  orderNumber: '',
  customerName: '',
  status: ''
});

const requests = ref([
  {
    id: 'RET-001',
    orderNumber: 'SO-20240123',
    customerName: 'John Smith',
    requestDate: '2024-01-15T10:30:00',
    status: 'pending',
    statusLabel: 'Pending',
    statusClass: 'warning',
    reason: 'Product defect',
    description: 'The product has a manufacturing defect on the left sleeve',
    amount: 89.97,
    items: [
      {
        productName: 'Casual T-Shirt',
        color: 'Blue',
        size: 'L',
        quantity: 3,
        price: 29.99
      }
    ]
  },
  {
    id: 'RET-002',
    orderNumber: 'SO-20240120',
    customerName: 'Jane Doe',
    requestDate: '2024-01-14T14:20:00',
    status: 'approved',
    statusLabel: 'Approved',
    statusClass: 'success',
    reason: 'Wrong size',
    description: 'Ordered size M but received size S',
    amount: 59.99,
    items: [
      {
        productName: 'Classic Denim Jeans',
        color: 'Blue',
        size: 'S',
        quantity: 1,
        price: 59.99
      }
    ]
  },
  {
    id: 'RET-003',
    orderNumber: 'SO-20240118',
    customerName: 'Mike Johnson',
    requestDate: '2024-01-13T09:15:00',
    status: 'processing',
    statusLabel: 'Processing',
    statusClass: 'info',
    reason: 'Not satisfied',
    description: 'Product quality does not meet expectations',
    amount: 49.99,
    items: [
      {
        productName: 'Hooded Sweatshirt',
        color: 'Black',
        size: 'M',
        quantity: 1,
        price: 49.99
      }
    ]
  }
]);

const filteredRequests = computed(() => {
  return requests.value.filter((request) => {
    const matchOrderNumber = !filters.orderNumber || request.orderNumber.toLowerCase().includes(filters.orderNumber.toLowerCase());
    const matchCustomer = !filters.customerName || request.customerName.toLowerCase().includes(filters.customerName.toLowerCase());
    const matchStatus = !filters.status || request.status === filters.status;
    return matchOrderNumber && matchCustomer && matchStatus;
  });
});

const selectedRequest = ref(filteredRequests.value[0] || null);

const applyFilters = () => {
  // Filters are applied via computed property
  if (filteredRequests.value.length > 0 && !selectedRequest.value) {
    selectedRequest.value = filteredRequests.value[0];
  }
};

const selectRequest = (request) => {
  selectedRequest.value = request;
};

const approveRequest = () => {
  if (!selectedRequest.value) return;
  if (window.confirm('Are you sure you want to approve this return request?')) {
    selectedRequest.value.status = 'approved';
    selectedRequest.value.statusLabel = 'Approved';
    selectedRequest.value.statusClass = 'success';
    window.alert('Return request approved');
  }
};

const rejectRequest = () => {
  if (!selectedRequest.value) return;
  const reason = window.prompt('Please provide a reason for rejection:');
  if (reason) {
    selectedRequest.value.status = 'rejected';
    selectedRequest.value.statusLabel = 'Rejected';
    selectedRequest.value.statusClass = 'danger';
    window.alert('Return request rejected');
  }
};

const formatDate = (value) => {
  if (!value) return '--';
  return new Date(value).toLocaleDateString('en-US');
};

const formatDateTime = (value) => {
  if (!value) return '--';
  return new Date(value).toLocaleString('en-US', { hour12: false });
};

const getItemIcon = (productName) => {
  if (!productName) return '📦';
  const name = productName.toLowerCase();
  if (name.includes('shirt') || name.includes('t-shirt')) return '👕';
  if (name.includes('jeans') || name.includes('pants') || name.includes('jogger')) return '👖';
  if (name.includes('sweatshirt') || name.includes('hood')) return '🧥';
  if (name.includes('polo')) return '👔';
  return '📦';
};
</script>

<style scoped>
.return-requests {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
  gap: 24px;
}

.return-requests__filter-input {
  flex: 1;
  min-width: 220px;
}

.return-requests__filter-picker {
  min-width: 180px;
}

.return-requests__item {
  display: flex;
  flex-direction: column;
  gap: 12px;
  cursor: pointer;
}

.return-requests__item--active {
  border: 1px solid rgba(43, 181, 192, 0.4);
}

.return-requests__item-header,
.return-requests__item-body {
  display: flex;
  justify-content: space-between;
}

.return-requests__item-body {
  color: var(--color-text-muted);
  font-size: 14px;
}

.return-requests__detail {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.return-requests__detail-section h3 {
  margin: 0 0 12px;
  font-size: 18px;
  font-weight: 600;
}

.return-requests__product-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.return-requests__product-header {
  display: flex;
  align-items: center;
  font-size: 16px;
}

.return-requests__product-body {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  font-size: 14px;
  color: var(--color-text-muted);
}

.return-requests__actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-top: 16px;
}

.return-requests__actions .btn-primary,
.return-requests__actions .btn-secondary {
  flex: 1 1 160px;
}

@media (max-width: 960px) {
  .return-requests {
    grid-template-columns: 1fr;
  }
}
</style>

