<template>
  <div class="regional-inventory">
    <section class="card">
      <h2 class="section-title">Regional Inventory</h2>
      <div class="filter-bar">
        <input
          v-model="filters.sku"
          class="form-input regional-inventory__filter-input"
          placeholder="Product ID"
          @input="applyFilters"
        />
        <input
          v-model="filters.name"
          class="form-input regional-inventory__filter-input"
          placeholder="Product Name"
          @input="applyFilters"
        />
        <select v-model="filters.region" class="filter-pill regional-inventory__filter-picker" @change="applyFilters">
          <option value="">Region: All</option>
          <option v-for="region in regions" :key="region" :value="region">
            Region: {{ region }}
          </option>
        </select>
        <select v-model="filters.status" class="filter-pill regional-inventory__filter-picker" @change="applyFilters">
          <option value="">Status: All</option>
          <option value="Normal">Normal</option>
          <option value="Low Stock">Low Stock</option>
          <option value="Out of Stock">Out of Stock</option>
        </select>
      </div>
    </section>

    <section class="card">
      <h2 class="section-title">Regional Distribution</h2>
      <div class="regional-inventory__regions">
        <div v-for="region in regionData" :key="region.name" class="regional-inventory__region-card">
          <div class="regional-inventory__region-header">
            <h3>{{ region.name }}</h3>
            <span class="tag">{{ region.warehouses.length }} warehouses</span>
          </div>
          <div class="regional-inventory__region-stats">
            <div class="regional-inventory__stat">
              <span class="regional-inventory__stat-label">Total Stock</span>
              <span class="regional-inventory__stat-value">{{ region.totalStock }} units</span>
            </div>
            <div class="regional-inventory__stat">
              <span class="regional-inventory__stat-label">Total Value</span>
              <span class="regional-inventory__stat-value">${{ region.totalValue.toLocaleString() }}</span>
            </div>
            <div class="regional-inventory__stat">
              <span class="regional-inventory__stat-label">Low Stock Items</span>
              <span class="regional-inventory__stat-value">{{ region.lowStockCount }} items</span>
            </div>
          </div>
          <div class="regional-inventory__warehouses">
            <div
              v-for="warehouse in region.warehouses"
              :key="warehouse.name"
              class="regional-inventory__warehouse-item"
              @click="selectWarehouse(warehouse)"
            >
              <div class="regional-inventory__warehouse-header">
                <span>{{ warehouse.name }}</span>
                <span class="tag">{{ warehouse.stock }} units</span>
              </div>
              <div class="regional-inventory__warehouse-body">
                <span>Value: ${{ warehouse.value.toLocaleString() }}</span>
                <span>Items: {{ warehouse.items }} SKUs</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section v-if="selectedWarehouse" class="card">
      <h2 class="section-title">Warehouse Inventory: {{ selectedWarehouse.name }}</h2>
      <div class="regional-inventory__table">
        <div class="regional-inventory__table-header">
          <span class="col col-wide">Product</span>
          <span class="col">Total Stock</span>
          <span class="col">Available</span>
          <span class="col">Alert</span>
        </div>
        <div
          v-for="item in selectedWarehouse.inventory"
          :key="item.sku"
          class="regional-inventory__table-row"
        >
          <div class="col col-wide">
            <div class="regional-inventory__item-name">
              <span style="font-size: 20px; margin-right: 8px;">{{ item.icon || '📦' }}</span>
              {{ item.name }}
            </div>
            <div class="regional-inventory__item-meta">SKU: {{ item.sku }} | Location: {{ item.location }}</div>
          </div>
          <span class="col">{{ item.total }}</span>
          <span class="col">{{ item.available }}</span>
          <span class="col"><span class="tag" :class="item.warningLevel">{{ item.warningLabel }}</span></span>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { reactive, ref, computed } from 'vue';

const regions = ['East China', 'South China', 'Northwest'];

const filters = reactive({
  sku: '',
  name: '',
  region: '',
  status: ''
});

const regionData = reactive([
  {
    name: 'East China',
    totalStock: 6200,
    totalValue: 980000,
    lowStockCount: 3,
    warehouses: [
      {
        name: 'East China Warehouse',
        stock: 6200,
        value: 980000,
        items: 65,
        inventory: [
          {
            sku: 'PROD-001',
            name: 'Casual T-Shirt',
            total: 120,
            available: 98,
            threshold: 80,
            warningLevel: 'default',
            warningLabel: 'Normal',
            location: 'A区-03-05',
            icon: '👕'
          },
          {
            sku: 'PROD-003',
            name: 'Hooded Sweatshirt',
            total: 45,
            available: 30,
            threshold: 50,
            warningLevel: 'warning',
            warningLabel: 'Low Stock',
            location: 'A区-02-03',
            icon: '🧥'
          },
          {
            sku: 'PROD-006',
            name: 'Jogger Pants',
            total: 12,
            available: 5,
            threshold: 25,
            warningLevel: 'danger',
            warningLabel: 'Out of Stock',
            location: 'A区-04-01',
            icon: '👖'
          }
        ]
      }
    ]
  },
  {
    name: 'South China',
    totalStock: 5100,
    totalValue: 850000,
    lowStockCount: 2,
    warehouses: [
      {
        name: 'South China Warehouse',
        stock: 5100,
        value: 850000,
        items: 52,
        inventory: [
          {
            sku: 'PROD-002',
            name: 'Classic Denim Jeans',
            total: 85,
            available: 65,
            threshold: 50,
            warningLevel: 'warning',
            warningLabel: 'Low Stock',
            location: 'B区-01-02',
            icon: '👖'
          },
          {
            sku: 'PROD-004',
            name: 'Chino Pants',
            total: 60,
            available: 45,
            threshold: 40,
            warningLevel: 'default',
            warningLabel: 'Normal',
            location: 'B区-02-01',
            icon: '👔'
          }
        ]
      }
    ]
  },
  {
    name: 'Northwest',
    totalStock: 4380,
    totalValue: 620000,
    lowStockCount: 1,
    warehouses: [
      {
        name: 'Northwest Warehouse',
        stock: 4380,
        value: 620000,
        items: 39,
        inventory: [
          {
            sku: 'PROD-005',
            name: 'Polo Shirt',
            total: 90,
            available: 75,
            threshold: 60,
            warningLevel: 'default',
            warningLabel: 'Normal',
            location: 'C区-01-04',
            icon: '👔'
          }
        ]
      }
    ]
  }
]);

const selectedWarehouse = ref(null);

const applyFilters = () => {
  // Filters can be applied here if needed
};

const selectWarehouse = (warehouse) => {
  selectedWarehouse.value = warehouse;
};
</script>

<style scoped>
.regional-inventory {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
  gap: 24px;
}

.regional-inventory__filter-input {
  flex: 1;
  min-width: 220px;
}

.regional-inventory__filter-picker {
  min-width: 180px;
}

.regional-inventory__regions {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.regional-inventory__region-card {
  background-color: #ffffff;
  border-radius: 16px;
  padding: 20px;
  box-shadow: var(--shadow-soft);
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.regional-inventory__region-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.regional-inventory__region-header h3 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
}

.regional-inventory__region-stats {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 16px;
}

.regional-inventory__stat {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.regional-inventory__stat-label {
  color: var(--color-text-muted);
  font-size: 14px;
}

.regional-inventory__stat-value {
  font-size: 18px;
  font-weight: 600;
  color: var(--color-text);
}

.regional-inventory__warehouses {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.regional-inventory__warehouse-item {
  background-color: var(--color-background);
  border-radius: 12px;
  padding: 16px;
  cursor: pointer;
  transition: background-color 0.2s ease, transform 0.2s ease;
}

.regional-inventory__warehouse-item:hover {
  background-color: rgba(43, 181, 192, 0.08);
  transform: translateX(4px);
}

.regional-inventory__warehouse-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
  margin-bottom: 8px;
}

.regional-inventory__warehouse-body {
  display: flex;
  gap: 16px;
  color: var(--color-text-muted);
  font-size: 14px;
}

.regional-inventory__table {
  display: flex;
  flex-direction: column;
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid var(--color-border);
}

.regional-inventory__table-header,
.regional-inventory__table-row {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr;
  gap: 12px;
  padding: 16px 20px;
  align-items: center;
}

.regional-inventory__table-header {
  background-color: var(--color-surface-alt);
  font-weight: 600;
  color: var(--color-text-muted);
}

.regional-inventory__table-row {
  border-top: 1px solid var(--color-border);
}

.regional-inventory__item-name {
  font-weight: 600;
}

.regional-inventory__item-meta {
  margin-top: 4px;
  color: #9ca3af;
  font-size: 13px;
}

@media (max-width: 960px) {
  .regional-inventory {
    grid-template-columns: 1fr;
  }
}
</style>

