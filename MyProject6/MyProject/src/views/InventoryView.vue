<template>
  <div class="inventory">
    <section class="card">
      <h2 class="section-title">Filter Conditions</h2>
      <div class="filter-bar">
        <input
          v-model="filters.sku"
          class="form-input inventory__filter-input"
          placeholder="Product ID"
          @input="applyFilters"
        />
        <input
          v-model="filters.name"
          class="form-input inventory__filter-input"
          placeholder="Product Name"
          @input="applyFilters"
        />
        <select v-model="filters.warehouse" class="filter-pill inventory__filter-picker" @change="applyFilters">
          <option value="">Warehouse: All</option>
          <option v-for="warehouse in warehouses" :key="warehouse" :value="warehouse">
            Warehouse: {{ warehouse }}
          </option>
        </select>
        <select v-model="filters.status" class="filter-pill inventory__filter-picker" @change="applyFilters">
          <option value="">Status: All</option>
          <option value="正常">Status: Normal</option>
          <option value="低库存">Status: Low Stock</option>
          <option value="缺货">Status: Out of Stock</option>
        </select>
      </div>
      <div class="quick-actions">
        <button class="btn-primary" type="button" @click="onAddProduct">Add Product</button>
        <button class="btn-secondary" type="button" @click="onImport">Import Inventory</button>
        <button class="btn-secondary" type="button" @click="onExport">Export Inventory</button>
      </div>
    </section>

    <section class="card">
      <h2 class="section-title">Inventory List</h2>
      <div class="inventory__table">
        <div class="inventory__table-header">
          <span class="col col-wide">Product</span>
          <span class="col">Total Stock</span>
          <span class="col">Available</span>
          <span class="col">Alert</span>
        </div>
        <div
          v-for="item in filteredInventory"
          :key="item.sku"
          class="inventory__table-row"
          :class="{ 'inventory__table-row--active': selectedItem?.sku === item.sku }"
          @click="selectItem(item)"
        >
          <div class="col col-wide">
            <div class="inventory__item-name">
              <span style="font-size: 20px; margin-right: 8px;">{{ item.icon || '📦' }}</span>
              {{ item.name }}
            </div>
            <div class="inventory__item-meta">SKU: {{ item.sku }} | Warehouse: {{ item.warehouse }} | Price: ${{ item.price }}</div>
          </div>
          <span class="col">{{ item.total }}</span>
          <span class="col">{{ item.available }}</span>
          <span class="col"><span class="tag" :class="item.warningLevel">{{ item.warningLabel }}</span></span>
        </div>
      </div>
    </section>

    <section v-if="selectedItem" class="card">
      <h2 class="section-title">Inventory Details</h2>
      <div class="list">
        <div class="list-item inventory__detail-item">
          <span>Price: ${{ selectedItem.price }}</span>
          <span>Location: {{ selectedItem.location }}</span>
        </div>
        <div class="list-item inventory__detail-item">
          <span>Safety Stock: {{ selectedItem.threshold }}</span>
          <span>Last Inbound: {{ selectedItem.lastInDate }}</span>
        </div>
        <div v-if="selectedItem.colors && selectedItem.colors.length > 0" class="list-item">
          <span>Available Colors: {{ selectedItem.colors.join(', ') }}</span>
        </div>
        <div v-if="selectedItem.sizes && selectedItem.sizes.length > 0" class="list-item">
          <span>Available Sizes: {{ selectedItem.sizes.join(', ') }}</span>
        </div>
        <div class="list-item">
          <span>Restock Suggestion: {{ selectedItem.restockAdvice }}</span>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { reactive, ref, computed } from 'vue';

const warehouses = ['East China Warehouse', 'South China Warehouse', 'Northwest Warehouse'];

// 使用与顾客页面相同的商品数据
const inventory = reactive([
  {
    sku: 'PROD-001',
    name: 'Casual T-Shirt',
    spec: 'S/M/L/XL',
    total: 120,
    available: 98,
    threshold: 80,
    warningLevel: 'default',
    warningLabel: 'Normal',
    warehouse: 'East China Warehouse',
    location: 'A区-03-05',
    lastInDate: '2024-01-12',
    restockAdvice: 'No restock needed',
    colors: ['Black', 'White', 'Blue', 'Red', 'Gray'],
    sizes: ['S', 'M', 'L', 'XL'],
    price: 29.99,
    icon: '👕'
  },
  {
    sku: 'PROD-002',
    name: 'Classic Denim Jeans',
    spec: '28/30/32/34/36',
    total: 85,
    available: 65,
    threshold: 50,
    warningLevel: 'warning',
    warningLabel: 'Low Stock',
    warehouse: 'South China Warehouse',
    location: 'B区-01-02',
    lastInDate: '2024-01-09',
    restockAdvice: 'Suggest restock 20 pieces',
    colors: ['Blue', 'Black', 'Gray'],
    sizes: ['28', '30', '32', '34', '36'],
    price: 59.99,
    icon: '👖'
  },
  {
    sku: 'PROD-003',
    name: 'Hooded Sweatshirt',
    spec: 'S/M/L/XL/XXL',
    total: 45,
    available: 30,
    threshold: 50,
    warningLevel: 'warning',
    warningLabel: 'Low Stock',
    warehouse: 'East China Warehouse',
    location: 'A区-02-03',
    lastInDate: '2024-01-10',
    restockAdvice: 'Suggest restock 25 pieces',
    colors: ['Black', 'Gray', 'Navy', 'Red'],
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    price: 49.99,
    icon: '🧥'
  },
  {
    sku: 'PROD-004',
    name: 'Chino Pants',
    spec: '30/32/34/36/38',
    total: 60,
    available: 45,
    threshold: 40,
    warningLevel: 'default',
    warningLabel: 'Normal',
    warehouse: 'South China Warehouse',
    location: 'B区-02-01',
    lastInDate: '2024-01-11',
    restockAdvice: 'No restock needed',
    colors: ['Khaki', 'Navy', 'Black', 'Olive'],
    sizes: ['30', '32', '34', '36', '38'],
    price: 54.99,
    icon: '👔'
  },
  {
    sku: 'PROD-005',
    name: 'Polo Shirt',
    spec: 'S/M/L/XL',
    total: 90,
    available: 75,
    threshold: 60,
    warningLevel: 'default',
    warningLabel: 'Normal',
    warehouse: 'East China Warehouse',
    location: 'A区-01-04',
    lastInDate: '2024-01-13',
    restockAdvice: 'No restock needed',
    colors: ['White', 'Black', 'Navy', 'Green', 'Red'],
    sizes: ['S', 'M', 'L', 'XL'],
    price: 39.99,
    icon: '👔'
  },
  {
    sku: 'PROD-006',
    name: 'Jogger Pants',
    spec: 'S/M/L/XL',
    total: 12,
    available: 5,
    threshold: 25,
    warningLevel: 'danger',
    warningLabel: 'Out of Stock',
    warehouse: 'Northwest Warehouse',
    location: 'C区-04-01',
    lastInDate: '2024-01-05',
    restockAdvice: 'Restock immediately 30 pieces',
    colors: ['Black', 'Gray', 'Navy', 'Olive'],
    sizes: ['S', 'M', 'L', 'XL'],
    price: 44.99,
    icon: '👖'
  }
]);

const filters = reactive({
  sku: '',
  name: '',
  warehouse: '',
  status: ''
});

const filteredInventory = ref([...inventory]);
const selectedItem = ref(filteredInventory.value[0] || null);

const applyFilters = () => {
  filteredInventory.value = inventory.filter((item) => {
    const matchSku = !filters.sku || item.sku.toLowerCase().includes(filters.sku.toLowerCase());
    const matchName = !filters.name || item.name.includes(filters.name);
    const matchWarehouse = !filters.warehouse || item.warehouse === filters.warehouse;
    const matchStatus = !filters.status || item.warningLabel === filters.status;
    return matchSku && matchName && matchWarehouse && matchStatus;
  });
  selectedItem.value = filteredInventory.value[0] || null;
};

const selectItem = (item) => {
  selectedItem.value = item;
};

const onAddProduct = () => {
  window.alert('Open add product dialog (demo)');
};

const onImport = () => {
  window.alert('Enter import process (demo)');
};

const onExport = () => {
  window.alert('Export report (demo)');
};

applyFilters();
</script>

<style scoped>
.inventory {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
  gap: 24px;
}

.inventory > .card {
  height: fit-content;
}

.inventory > .card:nth-child(1) {
  grid-column: 1 / -1;
}

.inventory__filter-input {
  flex: 1;
  min-width: 220px;
}

.inventory__filter-picker {
  min-width: 180px;
}

.inventory__table {
  display: flex;
  flex-direction: column;
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid var(--color-border);
}

.inventory__table-header,
.inventory__table-row {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr;
  gap: 12px;
  padding: 16px 20px;
  align-items: center;
}

.inventory__table-header {
  background-color: var(--color-surface-alt);
  font-weight: 600;
  color: var(--color-text-muted);
}

.inventory__table-row {
  border-top: 1px solid var(--color-border);
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.inventory__table-row:hover {
  background-color: rgba(43, 181, 192, 0.08);
}

.inventory__table-row--active {
  background-color: rgba(43, 181, 192, 0.12);
}

.inventory__item-name {
  font-weight: 600;
}

.inventory__item-meta {
  margin-top: 4px;
  color: #9ca3af;
  font-size: 13px;
}

.inventory__detail-item {
  display: flex;
  justify-content: space-between;
}

@media (max-width: 960px) {
  .inventory {
    grid-template-columns: 1fr;
  }
}
</style>

