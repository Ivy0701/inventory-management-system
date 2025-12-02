<template>
  <div class="central-inventory-count">
    <section class="card">
      <h2 class="section-title">Inventory Count</h2>
      <div class="filter-bar">
        <input
          v-model="filters.sku"
          class="form-input central-inventory-count__filter-input"
          placeholder="Product ID"
          @input="applyFilters"
        />
        <input
          v-model="filters.name"
          class="form-input central-inventory-count__filter-input"
          placeholder="Product Name"
          @input="applyFilters"
        />
        <select v-model="filters.location" class="filter-pill central-inventory-count__filter-picker" @change="applyFilters">
          <option value="">Location: All</option>
          <option value="Central Warehouse">Central Warehouse</option>
          <option value="East Warehouse">East Warehouse</option>
          <option value="West Warehouse">West Warehouse</option>
          <option value="North Warehouse">North Warehouse</option>
          <option value="South Warehouse">South Warehouse</option>
          <option value="East Store 1">East Store 1</option>
          <option value="East Store 2">East Store 2</option>
          <option value="West Store 1">West Store 1</option>
          <option value="West Store 2">West Store 2</option>
          <option value="North Store 1">North Store 1</option>
          <option value="North Store 2">North Store 2</option>
          <option value="South Store 1">South Store 1</option>
          <option value="South Store 2">South Store 2</option>
        </select>
        <select v-model="filters.status" class="filter-pill central-inventory-count__filter-picker" @change="applyFilters">
          <option value="">Status: All</option>
          <option value="Normal">Normal</option>
          <option value="Low Stock">Low Stock</option>
          <option value="Out of Stock">Out of Stock</option>
        </select>
      </div>
    </section>

    <section class="card">
      <h2 class="section-title">Regional Warehouse Inventory</h2>
      <div class="central-inventory-count__table">
        <div class="central-inventory-count__table-header">
          <span class="col col-wide">Product</span>
          <span class="col">Location</span>
          <span class="col">Total Stock</span>
          <span class="col">Available</span>
          <span class="col">Alert</span>
        </div>
        <div
          v-for="item in filteredWarehouseInventory"
          :key="`${item.sku}-${item.location}`"
          class="central-inventory-count__table-row"
          :class="{ 'central-inventory-count__table-row--active': selectedItem?.sku === item.sku && selectedItem?.location === item.location }"
          @click="selectItem(item)"
        >
          <div class="col col-wide">
            <div class="central-inventory-count__item-name">
              <span style="font-size: 20px; margin-right: 8px;">{{ item.icon || '📦' }}</span>
              {{ item.name }}
            </div>
            <div class="central-inventory-count__item-meta">SKU: {{ item.sku }} | Location: {{ item.location }}</div>
          </div>
          <span class="col">{{ item.location }}</span>
          <span class="col">{{ item.total }}</span>
          <span class="col">{{ item.available }}</span>
          <span class="col"><span class="tag" :class="item.warningLevel">{{ item.warningLabel }}</span></span>
        </div>
      </div>
    </section>

    <section class="card">
      <h2 class="section-title">Store Inventory in Region</h2>
      <div class="central-inventory-count__table">
        <div class="central-inventory-count__table-header">
          <span class="col col-wide">Product</span>
          <span class="col">Store</span>
          <span class="col">Total Stock</span>
          <span class="col">Available</span>
          <span class="col">Alert</span>
        </div>
        <div
          v-for="item in filteredStoreInventory"
          :key="`${item.sku}-${item.store}`"
          class="central-inventory-count__table-row"
          :class="{ 'central-inventory-count__table-row--active': selectedItem?.sku === item.sku && selectedItem?.store === item.store }"
          @click="selectItem(item)"
        >
          <div class="col col-wide">
            <div class="central-inventory-count__item-name">
              <span style="font-size: 20px; margin-right: 8px;">{{ item.icon || '📦' }}</span>
              {{ item.name }}
            </div>
            <div class="central-inventory-count__item-meta">SKU: {{ item.sku }} | Store: {{ item.store }}</div>
          </div>
          <span class="col">{{ item.store }}</span>
          <span class="col">{{ item.total }}</span>
          <span class="col">{{ item.available }}</span>
          <span class="col"><span class="tag" :class="item.warningLevel">{{ item.warningLabel }}</span></span>
        </div>
      </div>
    </section>

    <section v-if="selectedItem" class="card">
      <h2 class="section-title">Inventory Details</h2>
      <div class="list">
        <div class="list-item central-inventory-count__detail-item">
          <span>Product: {{ selectedItem.name }}</span>
          <span>SKU: {{ selectedItem.sku }}</span>
        </div>
        <div class="list-item central-inventory-count__detail-item">
          <span>Location: {{ selectedItem.location || selectedItem.store }}</span>
          <span>Total Stock: {{ selectedItem.total }}</span>
        </div>
        <div class="list-item central-inventory-count__detail-item">
          <span>Available: {{ selectedItem.available }}</span>
          <span>Status: {{ selectedItem.warningLabel }}</span>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { reactive, ref, computed } from 'vue';

const filters = reactive({
  sku: '',
  name: '',
  location: '',
  status: ''
});

// Product metadata
const productMetadata = {
  'PROD-001': { name: 'Casual T-Shirt', icon: '👕', threshold: 80 },
  'PROD-002': { name: 'Classic Denim Jeans', icon: '👖', threshold: 50 },
  'PROD-003': { name: 'Hooded Sweatshirt', icon: '🧥', threshold: 50 },
  'PROD-004': { name: 'Chino Pants', icon: '👔', threshold: 40 },
  'PROD-005': { name: 'Polo Shirt', icon: '👔', threshold: 60 },
  'PROD-006': { name: 'Jogger Pants', icon: '👖', threshold: 25 }
};

// Regional Warehouse Inventory (总仓库 + 东南西北仓库)
const warehouseInventory = reactive([
  { sku: 'PROD-001', name: 'Casual T-Shirt', location: 'Central Warehouse', total: 200, available: 200, icon: '👕', threshold: 80 },
  { sku: 'PROD-001', name: 'Casual T-Shirt', location: 'East Warehouse', total: 200, available: 198, icon: '👕', threshold: 80 },
  { sku: 'PROD-001', name: 'Casual T-Shirt', location: 'West Warehouse', total: 200, available: 200, icon: '👕', threshold: 80 },
  { sku: 'PROD-001', name: 'Casual T-Shirt', location: 'North Warehouse', total: 200, available: 200, icon: '👕', threshold: 80 },
  { sku: 'PROD-001', name: 'Casual T-Shirt', location: 'South Warehouse', total: 200, available: 200, icon: '👕', threshold: 80 },
  { sku: 'PROD-002', name: 'Classic Denim Jeans', location: 'Central Warehouse', total: 200, available: 200, icon: '👖', threshold: 50 },
  { sku: 'PROD-002', name: 'Classic Denim Jeans', location: 'East Warehouse', total: 200, available: 200, icon: '👖', threshold: 50 },
  { sku: 'PROD-002', name: 'Classic Denim Jeans', location: 'West Warehouse', total: 200, available: 200, icon: '👖', threshold: 50 },
  { sku: 'PROD-002', name: 'Classic Denim Jeans', location: 'North Warehouse', total: 200, available: 200, icon: '👖', threshold: 50 },
  { sku: 'PROD-002', name: 'Classic Denim Jeans', location: 'South Warehouse', total: 200, available: 200, icon: '👖', threshold: 50 },
  { sku: 'PROD-003', name: 'Hooded Sweatshirt', location: 'Central Warehouse', total: 200, available: 200, icon: '🧥', threshold: 50 },
  { sku: 'PROD-003', name: 'Hooded Sweatshirt', location: 'East Warehouse', total: 200, available: 200, icon: '🧥', threshold: 50 },
  { sku: 'PROD-003', name: 'Hooded Sweatshirt', location: 'West Warehouse', total: 200, available: 200, icon: '🧥', threshold: 50 },
  { sku: 'PROD-003', name: 'Hooded Sweatshirt', location: 'North Warehouse', total: 200, available: 200, icon: '🧥', threshold: 50 },
  { sku: 'PROD-003', name: 'Hooded Sweatshirt', location: 'South Warehouse', total: 200, available: 200, icon: '🧥', threshold: 50 },
  { sku: 'PROD-004', name: 'Chino Pants', location: 'Central Warehouse', total: 200, available: 200, icon: '👔', threshold: 40 },
  { sku: 'PROD-004', name: 'Chino Pants', location: 'East Warehouse', total: 200, available: 200, icon: '👔', threshold: 40 },
  { sku: 'PROD-004', name: 'Chino Pants', location: 'West Warehouse', total: 200, available: 200, icon: '👔', threshold: 40 },
  { sku: 'PROD-004', name: 'Chino Pants', location: 'North Warehouse', total: 200, available: 200, icon: '👔', threshold: 40 },
  { sku: 'PROD-004', name: 'Chino Pants', location: 'South Warehouse', total: 200, available: 200, icon: '👔', threshold: 40 },
  { sku: 'PROD-005', name: 'Polo Shirt', location: 'Central Warehouse', total: 200, available: 200, icon: '👔', threshold: 60 },
  { sku: 'PROD-005', name: 'Polo Shirt', location: 'East Warehouse', total: 200, available: 200, icon: '👔', threshold: 60 },
  { sku: 'PROD-005', name: 'Polo Shirt', location: 'West Warehouse', total: 200, available: 200, icon: '👔', threshold: 60 },
  { sku: 'PROD-005', name: 'Polo Shirt', location: 'North Warehouse', total: 200, available: 200, icon: '👔', threshold: 60 },
  { sku: 'PROD-005', name: 'Polo Shirt', location: 'South Warehouse', total: 200, available: 200, icon: '👔', threshold: 60 },
  { sku: 'PROD-006', name: 'Jogger Pants', location: 'Central Warehouse', total: 200, available: 200, icon: '👖', threshold: 25 },
  { sku: 'PROD-006', name: 'Jogger Pants', location: 'East Warehouse', total: 200, available: 200, icon: '👖', threshold: 25 },
  { sku: 'PROD-006', name: 'Jogger Pants', location: 'West Warehouse', total: 200, available: 200, icon: '👖', threshold: 25 },
  { sku: 'PROD-006', name: 'Jogger Pants', location: 'North Warehouse', total: 200, available: 200, icon: '👖', threshold: 25 },
  { sku: 'PROD-006', name: 'Jogger Pants', location: 'South Warehouse', total: 200, available: 200, icon: '👖', threshold: 25 }
]);

// Store Inventory in Region (东12，南12，西12，北12门店)
const storeInventory = reactive([
  { sku: 'PROD-001', name: 'Casual T-Shirt', store: 'East Store 1', total: 200, available: 200, icon: '👕', threshold: 80 },
  { sku: 'PROD-001', name: 'Casual T-Shirt', store: 'East Store 2', total: 200, available: 200, icon: '👕', threshold: 80 },
  { sku: 'PROD-001', name: 'Casual T-Shirt', store: 'West Store 1', total: 200, available: 200, icon: '👕', threshold: 80 },
  { sku: 'PROD-001', name: 'Casual T-Shirt', store: 'West Store 2', total: 200, available: 200, icon: '👕', threshold: 80 },
  { sku: 'PROD-001', name: 'Casual T-Shirt', store: 'North Store 1', total: 200, available: 200, icon: '👕', threshold: 80 },
  { sku: 'PROD-001', name: 'Casual T-Shirt', store: 'North Store 2', total: 200, available: 200, icon: '👕', threshold: 80 },
  { sku: 'PROD-001', name: 'Casual T-Shirt', store: 'South Store 1', total: 200, available: 200, icon: '👕', threshold: 80 },
  { sku: 'PROD-001', name: 'Casual T-Shirt', store: 'South Store 2', total: 200, available: 200, icon: '👕', threshold: 80 },
  { sku: 'PROD-002', name: 'Classic Denim Jeans', store: 'East Store 1', total: 200, available: 200, icon: '👖', threshold: 50 },
  { sku: 'PROD-002', name: 'Classic Denim Jeans', store: 'East Store 2', total: 200, available: 200, icon: '👖', threshold: 50 },
  { sku: 'PROD-002', name: 'Classic Denim Jeans', store: 'West Store 1', total: 200, available: 200, icon: '👖', threshold: 50 },
  { sku: 'PROD-002', name: 'Classic Denim Jeans', store: 'West Store 2', total: 200, available: 200, icon: '👖', threshold: 50 },
  { sku: 'PROD-002', name: 'Classic Denim Jeans', store: 'North Store 1', total: 200, available: 200, icon: '👖', threshold: 50 },
  { sku: 'PROD-002', name: 'Classic Denim Jeans', store: 'North Store 2', total: 200, available: 200, icon: '👖', threshold: 50 },
  { sku: 'PROD-002', name: 'Classic Denim Jeans', store: 'South Store 1', total: 200, available: 200, icon: '👖', threshold: 50 },
  { sku: 'PROD-002', name: 'Classic Denim Jeans', store: 'South Store 2', total: 200, available: 200, icon: '👖', threshold: 50 },
  { sku: 'PROD-003', name: 'Hooded Sweatshirt', store: 'East Store 1', total: 200, available: 200, icon: '🧥', threshold: 50 },
  { sku: 'PROD-003', name: 'Hooded Sweatshirt', store: 'East Store 2', total: 200, available: 200, icon: '🧥', threshold: 50 },
  { sku: 'PROD-003', name: 'Hooded Sweatshirt', store: 'West Store 1', total: 200, available: 200, icon: '🧥', threshold: 50 },
  { sku: 'PROD-003', name: 'Hooded Sweatshirt', store: 'West Store 2', total: 200, available: 200, icon: '🧥', threshold: 50 },
  { sku: 'PROD-003', name: 'Hooded Sweatshirt', store: 'North Store 1', total: 200, available: 200, icon: '🧥', threshold: 50 },
  { sku: 'PROD-003', name: 'Hooded Sweatshirt', store: 'North Store 2', total: 200, available: 200, icon: '🧥', threshold: 50 },
  { sku: 'PROD-003', name: 'Hooded Sweatshirt', store: 'South Store 1', total: 200, available: 200, icon: '🧥', threshold: 50 },
  { sku: 'PROD-003', name: 'Hooded Sweatshirt', store: 'South Store 2', total: 200, available: 200, icon: '🧥', threshold: 50 },
  { sku: 'PROD-004', name: 'Chino Pants', store: 'East Store 1', total: 200, available: 200, icon: '👔', threshold: 40 },
  { sku: 'PROD-004', name: 'Chino Pants', store: 'East Store 2', total: 200, available: 200, icon: '👔', threshold: 40 },
  { sku: 'PROD-004', name: 'Chino Pants', store: 'West Store 1', total: 200, available: 200, icon: '👔', threshold: 40 },
  { sku: 'PROD-004', name: 'Chino Pants', store: 'West Store 2', total: 200, available: 200, icon: '👔', threshold: 40 },
  { sku: 'PROD-004', name: 'Chino Pants', store: 'North Store 1', total: 200, available: 200, icon: '👔', threshold: 40 },
  { sku: 'PROD-004', name: 'Chino Pants', store: 'North Store 2', total: 200, available: 200, icon: '👔', threshold: 40 },
  { sku: 'PROD-004', name: 'Chino Pants', store: 'South Store 1', total: 200, available: 200, icon: '👔', threshold: 40 },
  { sku: 'PROD-004', name: 'Chino Pants', store: 'South Store 2', total: 200, available: 200, icon: '👔', threshold: 40 },
  { sku: 'PROD-005', name: 'Polo Shirt', store: 'East Store 1', total: 200, available: 200, icon: '👔', threshold: 60 },
  { sku: 'PROD-005', name: 'Polo Shirt', store: 'East Store 2', total: 200, available: 200, icon: '👔', threshold: 60 },
  { sku: 'PROD-005', name: 'Polo Shirt', store: 'West Store 1', total: 200, available: 200, icon: '👔', threshold: 60 },
  { sku: 'PROD-005', name: 'Polo Shirt', store: 'West Store 2', total: 200, available: 200, icon: '👔', threshold: 60 },
  { sku: 'PROD-005', name: 'Polo Shirt', store: 'North Store 1', total: 200, available: 200, icon: '👔', threshold: 60 },
  { sku: 'PROD-005', name: 'Polo Shirt', store: 'North Store 2', total: 200, available: 200, icon: '👔', threshold: 60 },
  { sku: 'PROD-005', name: 'Polo Shirt', store: 'South Store 1', total: 200, available: 200, icon: '👔', threshold: 60 },
  { sku: 'PROD-005', name: 'Polo Shirt', store: 'South Store 2', total: 200, available: 200, icon: '👔', threshold: 60 },
  { sku: 'PROD-006', name: 'Jogger Pants', store: 'East Store 1', total: 200, available: 200, icon: '👖', threshold: 25 },
  { sku: 'PROD-006', name: 'Jogger Pants', store: 'East Store 2', total: 200, available: 200, icon: '👖', threshold: 25 },
  { sku: 'PROD-006', name: 'Jogger Pants', store: 'West Store 1', total: 200, available: 200, icon: '👖', threshold: 25 },
  { sku: 'PROD-006', name: 'Jogger Pants', store: 'West Store 2', total: 200, available: 200, icon: '👖', threshold: 25 },
  { sku: 'PROD-006', name: 'Jogger Pants', store: 'North Store 1', total: 200, available: 200, icon: '👖', threshold: 25 },
  { sku: 'PROD-006', name: 'Jogger Pants', store: 'North Store 2', total: 200, available: 200, icon: '👖', threshold: 25 },
  { sku: 'PROD-006', name: 'Jogger Pants', store: 'South Store 1', total: 200, available: 200, icon: '👖', threshold: 25 },
  { sku: 'PROD-006', name: 'Jogger Pants', store: 'South Store 2', total: 200, available: 200, icon: '👖', threshold: 25 }
]);

const selectedItem = ref(null);

const getWarningLevel = (available, threshold) => {
  if (available === 0) return { level: 'danger', label: 'Out of Stock' };
  if (available < threshold) return { level: 'warning', label: 'Low Stock' };
  return { level: 'default', label: 'Normal' };
};

// Add warning levels to inventory items
warehouseInventory.forEach(item => {
  const warning = getWarningLevel(item.available, item.threshold);
  item.warningLevel = warning.level;
  item.warningLabel = warning.label;
});

storeInventory.forEach(item => {
  const warning = getWarningLevel(item.available, item.threshold);
  item.warningLevel = warning.level;
  item.warningLabel = warning.label;
});

const filteredWarehouseInventory = computed(() => {
  return warehouseInventory.filter((item) => {
    const matchSku = !filters.sku || item.sku.toLowerCase().includes(filters.sku.toLowerCase());
    const matchName = !filters.name || item.name.includes(filters.name);
    const matchLocation = !filters.location || item.location === filters.location;
    const matchStatus = !filters.status || item.warningLabel === filters.status;
    return matchSku && matchName && matchLocation && matchStatus;
  });
});

const filteredStoreInventory = computed(() => {
  return storeInventory.filter((item) => {
    const matchSku = !filters.sku || item.sku.toLowerCase().includes(filters.sku.toLowerCase());
    const matchName = !filters.name || item.name.includes(filters.name);
    const matchLocation = !filters.location || item.store === filters.location;
    const matchStatus = !filters.status || item.warningLabel === filters.status;
    return matchSku && matchName && matchLocation && matchStatus;
  });
});

const applyFilters = () => {
  // Filters are applied via computed properties
};

const selectItem = (item) => {
  selectedItem.value = item;
};
</script>

<style scoped>
.central-inventory-count {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
  gap: 24px;
}

.central-inventory-count__filter-input {
  flex: 1;
  min-width: 220px;
}

.central-inventory-count__filter-picker {
  min-width: 180px;
}

.central-inventory-count__table {
  display: flex;
  flex-direction: column;
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid var(--color-border);
}

.central-inventory-count__table-header,
.central-inventory-count__table-row {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr 1fr;
  gap: 12px;
  padding: 16px 20px;
  align-items: center;
}

.central-inventory-count__table-header {
  background-color: var(--color-surface-alt);
  font-weight: 600;
  color: var(--color-text-muted);
}

.central-inventory-count__table-row {
  border-top: 1px solid var(--color-border);
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.central-inventory-count__table-row:hover {
  background-color: rgba(43, 181, 192, 0.08);
}

.central-inventory-count__table-row--active {
  background-color: rgba(43, 181, 192, 0.12);
}

.central-inventory-count__item-name {
  font-weight: 600;
}

.central-inventory-count__item-meta {
  margin-top: 4px;
  color: #9ca3af;
  font-size: 13px;
}

.central-inventory-count__detail-item {
  display: flex;
  justify-content: space-between;
}

@media (max-width: 960px) {
  .central-inventory-count {
    grid-template-columns: 1fr;
  }
}
</style>

