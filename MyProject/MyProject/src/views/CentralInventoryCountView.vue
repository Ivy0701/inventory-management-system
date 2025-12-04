<template>
  <div class="central-inventory-count">
    <section class="card">
      <h2 class="section-title">Inventory Count</h2>
      <p class="section-desc">Central, regional warehouses, and regional stores overview.</p>
      <div class="summary-grid">
        <div class="summary-card">
          <span class="summary-label">Central Warehouse</span>
          <span class="summary-value">{{ summary.central.available }}</span>
          <small>Total {{ summary.central.total }}</small>
        </div>
        <div class="summary-card">
          <span class="summary-label">Regional Warehouses</span>
          <span class="summary-value">{{ summary.regional.available }}</span>
          <small>Total {{ summary.regional.total }}</small>
        </div>
        <div class="summary-card">
          <span class="summary-label">Regional Stores</span>
          <span class="summary-value">{{ summary.store.available }}</span>
          <small>Total {{ summary.store.total }}</small>
        </div>
      </div>
    </section>

    <section class="card">
      <div class="section-header">
        <h2 class="section-title">Central Warehouse Inventory</h2>
        <button class="btn-secondary" type="button" @click="refreshAll" :disabled="loading">Refresh</button>
      </div>
      <InventoryTable :items="centralInventory" />
    </section>

    <section class="card">
      <div class="section-header">
        <h2 class="section-title">Regional Warehouse Inventory</h2>
        <button class="btn-secondary" type="button" @click="refreshAll" :disabled="loading">Refresh</button>
      </div>
      <InventoryTable :items="regionalWarehouseInventory" />
    </section>

    <section class="card">
      <div class="section-header">
        <h2 class="section-title">Regional Store</h2>
        <button class="btn-secondary" type="button" @click="refreshAll" :disabled="loading">Refresh</button>
      </div>
      <InventoryTable :items="regionalStoreInventory" />
    </section>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, defineComponent } from 'vue';
import { getInventoryByLocation } from '../services/inventoryService';

const centralLocation = { id: 'WH-CENTRAL', label: 'Central Warehouse' };

const regionalWarehouseLocations = [
  { id: 'WH-EAST', label: 'East Warehouse' },
  { id: 'WH-WEST', label: 'West Warehouse' },
  { id: 'WH-NORTH', label: 'North Warehouse' },
  { id: 'WH-SOUTH', label: 'South Warehouse' }
];

const regionalStoreLocations = [
  { id: 'STORE-EAST-01', label: 'East Store 1' },
  { id: 'STORE-EAST-02', label: 'East Store 2' },
  { id: 'STORE-WEST-01', label: 'West Store 1' },
  { id: 'STORE-WEST-02', label: 'West Store 2' },
  { id: 'STORE-SOUTH-01', label: 'South Store 1' },
  { id: 'STORE-SOUTH-02', label: 'South Store 2' },
  { id: 'STORE-NORTH-01', label: 'North Store 1' },
  { id: 'STORE-NORTH-02', label: 'North Store 2' }
];

const centralInventory = ref([]);
const regionalWarehouseInventory = ref([]);
const regionalStoreInventory = ref([]);
const loading = ref(false);

const warningLevel = (available, threshold = 0) => {
  if (available <= 0) return { level: 'danger', label: 'Out of Stock' };
  if (available <= threshold) return { level: 'warning', label: 'Low Stock' };
  return { level: 'default', label: 'Normal' };
};

const normalizeItem = (row, locationLabel) => {
  const available = row.available ?? row.quantity ?? 0;
  const total = row.totalStock ?? row.quantity ?? 0;
  const warning = warningLevel(available, row.minThreshold);
  const productName =
    typeof row.productName === 'object'
      ? row.productName.en || row.productName.zh || row.productId
      : row.productName;

  return {
    sku: row.productId || row.productSku,
    name: productName,
    location: locationLabel,
    total,
    available,
    warningLevel: warning.level,
    warningLabel: warning.label
  };
};

const fetchInventoryForLocations = async (locations) => {
  const results = await Promise.all(
    locations.map(async (loc) => {
      try {
        const data = await getInventoryByLocation(loc.id);
        return data.map((row) => normalizeItem(row, loc.label));
      } catch (error) {
        console.error('Failed to load inventory for', loc.id, error);
        return [];
      }
    })
  );
  return results.flat();
};

const refreshAll = async () => {
  loading.value = true;
  try {
    const [central, regionalWarehouses, regionalStores] = await Promise.all([
      fetchInventoryForLocations([centralLocation]),
      fetchInventoryForLocations(regionalWarehouseLocations),
      fetchInventoryForLocations(regionalStoreLocations)
    ]);

    centralInventory.value = central;
    regionalWarehouseInventory.value = regionalWarehouses;
    regionalStoreInventory.value = regionalStores;
  } finally {
    loading.value = false;
  }
};

const summary = computed(() => {
  const aggregate = (items) => ({
    total: items.reduce((sum, item) => sum + (item.total || 0), 0),
    available: items.reduce((sum, item) => sum + (item.available || 0), 0)
  });
  return {
    central: aggregate(centralInventory.value),
    regional: aggregate(regionalWarehouseInventory.value),
    store: aggregate(regionalStoreInventory.value)
  };
});

const InventoryTable = defineComponent({
  props: {
    items: {
      type: Array,
      default: () => []
    }
  },
  template: `
    <div class="central-inventory-count__table">
      <div class="central-inventory-count__table-header">
        <span class="col col-wide">Product</span>
        <span class="col">Location</span>
        <span class="col">Total Stock</span>
        <span class="col">Available</span>
        <span class="col">Alert</span>
      </div>
      <div
        v-for="item in items"
        :key="item.sku + item.location"
        class="central-inventory-count__table-row"
      >
        <div class="col col-wide">
          <div class="central-inventory-count__item-name">{{ item.name }}</div>
          <div class="central-inventory-count__item-meta">SKU: {{ item.sku }}</div>
        </div>
        <span class="col">{{ item.location }}</span>
        <span class="col">{{ item.total }}</span>
        <span class="col">{{ item.available }}</span>
        <span class="col"><span class="tag" :class="item.warningLevel">{{ item.warningLabel }}</span></span>
      </div>
      <p v-if="!items.length" class="empty-hint">No inventory data</p>
    </div>
  `
});

onMounted(refreshAll);
</script>

<style scoped>
.central-inventory-count {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.section-desc {
  margin-top: 4px;
  color: var(--color-text-muted);
  font-size: 14px;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 16px;
  margin-top: 12px;
}

.summary-card {
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.summary-label {
  font-size: 14px;
  color: var(--color-text-muted);
}

.summary-value {
  font-size: 24px;
  font-weight: 600;
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
}

.central-inventory-count__item-name {
  font-weight: 600;
}

.central-inventory-count__item-meta {
  margin-top: 4px;
  color: #9ca3af;
  font-size: 13px;
}

.empty-hint {
  margin: 0;
  padding: 12px;
  text-align: center;
  color: var(--color-text-muted);
}

@media (max-width: 960px) {
  .central-inventory-count__table-header,
  .central-inventory-count__table-row {
    grid-template-columns: 1.5fr 1fr 1fr 1fr 1fr;
  }
}
</style>

