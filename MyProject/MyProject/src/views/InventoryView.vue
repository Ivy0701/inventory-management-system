<template>
  <div class="inventory">
    <section class="card">
      <h2 class="section-title">{{ $t('inventory.filterTitle') }}</h2>
      <div class="filter-bar">
        <input
          v-model="filters.sku"
          class="form-input inventory__filter-input"
          :placeholder="$t('inventory.productIdPlaceholder')"
          @input="applyFilters"
        />
        <input
          v-model="filters.name"
          class="form-input inventory__filter-input"
          :placeholder="$t('inventory.productNamePlaceholder')"
          @input="applyFilters"
        />
        <select v-model="filters.warehouse" class="filter-pill inventory__filter-picker" @change="applyFilters">
          <option value="">{{ $t('inventory.warehouseAll') }}</option>
          <option v-for="warehouse in warehouses" :key="warehouse" :value="warehouse">
            Warehouse: {{ warehouse }}
          </option>
        </select>
        <select v-model="filters.status" class="filter-pill inventory__filter-picker" @change="applyFilters">
          <option value="">{{ $t('inventory.statusAll') }}</option>
          <option value="Normal">{{ $t('inventory.statusNormal') }}</option>
          <option value="Low Stock">{{ $t('inventory.statusLow') }}</option>
          <option value="Out of Stock">{{ $t('inventory.statusOut') }}</option>
        </select>
      </div>
      <div class="quick-actions">
        <button class="btn-primary" type="button" @click="onAddProduct">{{ $t('inventory.addProduct') }}</button>
        <button class="btn-secondary" type="button" @click="onImport">{{ $t('inventory.importInventory') }}</button>
        <button class="btn-secondary" type="button" @click="onExport">{{ $t('inventory.exportInventory') }}</button>
      </div>
    </section>

    <section class="card">
      <h2 class="section-title">{{ $t('inventory.listTitle') }}</h2>
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
      <h2 class="section-title">{{ $t('inventory.detailTitle') }}</h2>
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
// 数据来源改为后端接口：GET /api/inventory/:locationId
// 插入位置：原有静态 inventory 数组所在的 <script setup> 中
import { reactive, ref, onMounted } from 'vue';
import { useAppStore } from '../store/appStore';
import { getInventoryByLocation } from '../services/inventoryService';

const appStore = useAppStore();

const warehouses = ['East China Warehouse', 'South China Warehouse', 'Northwest Warehouse'];

// 后端返回的原始库存数据（按商品 + 位置）
const inventory = reactive([]);

const filters = reactive({
  sku: '',
  name: '',
  warehouse: '',
  status: ''
});

const filteredInventory = ref([]);
const selectedItem = ref(null);

const mapWarning = (available, minThreshold) => {
  if (available <= 0) {
    return { level: 'danger', label: 'Out of Stock' };
  }
  if (typeof minThreshold === 'number' && available <= minThreshold) {
    return { level: 'warning', label: 'Low Stock' };
  }
  return { level: 'default', label: 'Normal' };
};

const refreshInventory = async () => {
  try {
    const locationId = appStore.user.assignedLocationId || 'WH-EAST';
    const data = await getInventoryByLocation(locationId);

    inventory.splice(0, inventory.length, ...data.map((row) => {
      const { level, label } = mapWarning(row.available, row.minThreshold);
      return {
        sku: row.productId,
        name: row.productName,
        total: row.totalStock,
        available: row.available,
        threshold: row.minThreshold ?? 0,
        warningLevel: level,
        warningLabel: label,
        warehouse: row.locationName || row.locationId || 'Unknown',
        location: row.locationId,
        lastInDate: row.updatedAt || row.lastUpdated,
        restockAdvice: label === 'Low Stock' || label === 'Out of Stock' ? 'Suggest restock' : 'No restock needed',
        colors: [],
        sizes: [],
        price: row.price || 0,
        icon: '📦'
      };
    }));

    applyFilters();
  } catch (error) {
    console.error(error);
    window.alert(error.message || 'Failed to load inventory');
  }
};

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

onMounted(() => {
  refreshInventory();
});
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

