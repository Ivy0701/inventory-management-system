<template>
  <div class="inventory">
    <section class="card">
      <h2 class="section-title">库存列表</h2>
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
        <select v-model="filters.location" class="filter-pill inventory__filter-picker" @change="applyFilters">
          <option value="">Location: All</option>
          <option v-for="loc in locations" :key="loc.id" :value="loc.id">
            Location: {{ loc.name }}
          </option>
        </select>
        <select v-model="filters.status" class="filter-pill inventory__filter-picker" @change="applyFilters">
          <option value="">Status: All</option>
          <option value="Normal">Normal</option>
          <option value="Low Stock">Low Stock</option>
          <option value="Out of Stock">Out of Stock</option>
        </select>
      </div>
    </section>

    <section class="card">
      <h2 class="section-title">Inventory List</h2>
      <div v-if="isLoading" class="empty">Loading inventory...</div>
      <div v-else-if="!filteredInventory.length" class="empty">No inventory found</div>
      <div v-else class="inventory__table">
        <div class="inventory__table-header">
          <span class="col col-wide">Product</span>
          <span class="col">Store</span>
          <span class="col">Total Stock</span>
          <span class="col">Available</span>
          <span class="col">Alert</span>
        </div>
        <div
          v-for="item in filteredInventory"
          :key="item.sku + item.locationId"
          class="inventory__table-row"
          :class="{ 'inventory__table-row--active': selectedItem?.sku === item.sku && selectedItem?.locationId === item.locationId }"
          @click="selectItem(item)"
        >
          <div class="col col-wide">
            <div class="inventory__item-name">
              <span style="font-size: 20px; margin-right: 8px;">{{ item.icon || '📦' }}</span>
              {{ item.name }}
            </div>
            <div class="inventory__item-meta">SKU: {{ item.sku }} | Price: ${{ item.price }}</div>
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
import { reactive, ref, computed, onMounted } from 'vue';
import { useAppStore } from '../store/appStore';
import { getInventoryByLocation } from '../services/inventoryService.js';

const appStore = useAppStore();

// 三个位置：华东仓库、华东门店1、华东门店2
const locations = [
  { id: 'WH-EAST', name: 'East Warehouse' },
  { id: 'STORE-EAST-01', name: 'East Store 1' },
  { id: 'STORE-EAST-02', name: 'East Store 2' }
];

const stores = ref([]);

// Product metadata (for display purposes)
const productMetadata = {
  'PROD-001': {
    name: 'Casual T-Shirt',
    spec: 'S/M/L/XL',
    threshold: 80,
    store: 'Store A - Downtown',
    location: 'A区-03-05',
    lastInDate: '2024-01-12',
    colors: ['Black', 'White', 'Blue', 'Red', 'Gray'],
    sizes: ['S', 'M', 'L', 'XL'],
    price: 29.99,
    icon: '👕'
  },
  'PROD-002': {
    name: 'Classic Denim Jeans',
    spec: '28/30/32/34/36',
    threshold: 50,
    store: 'Store B - Shopping Mall',
    location: 'B区-01-02',
    lastInDate: '2024-01-09',
    colors: ['Blue', 'Black', 'Gray'],
    sizes: ['28', '30', '32', '34', '36'],
    price: 59.99,
    icon: '👖'
  },
  'PROD-003': {
    name: 'Hooded Sweatshirt',
    spec: 'S/M/L/XL/XXL',
    threshold: 50,
    store: 'Store A - Downtown',
    location: 'A区-02-03',
    lastInDate: '2024-01-10',
    colors: ['Black', 'Gray', 'Navy', 'Red'],
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    price: 49.99,
    icon: '🧥'
  },
  'PROD-004': {
    name: 'Chino Pants',
    spec: '30/32/34/36/38',
    threshold: 40,
    store: 'Store C - Airport',
    location: 'C区-02-01',
    lastInDate: '2024-01-11',
    colors: ['Khaki', 'Navy', 'Black', 'Olive'],
    sizes: ['30', '32', '34', '36', '38'],
    price: 54.99,
    icon: '👔'
  },
  'PROD-005': {
    name: 'Polo Shirt',
    spec: 'S/M/L/XL',
    threshold: 60,
    store: 'Store B - Shopping Mall',
    location: 'B区-01-04',
    lastInDate: '2024-01-13',
    colors: ['White', 'Black', 'Navy', 'Green', 'Red'],
    sizes: ['S', 'M', 'L', 'XL'],
    price: 39.99,
    icon: '👔'
  },
  'PROD-006': {
    name: 'Jogger Pants',
    spec: 'S/M/L/XL',
    threshold: 25,
    store: 'Store A - Downtown',
    location: 'A区-04-01',
    lastInDate: '2024-01-05',
    colors: ['Black', 'Gray', 'Navy', 'Olive'],
    sizes: ['S', 'M', 'L', 'XL'],
    price: 44.99,
    icon: '👖'
  }
};

const inventory = reactive([]);
const isLoading = ref(false);

const filters = reactive({
  sku: '',
  name: '',
  location: '',
  status: ''
});

const filteredInventory = computed(() => {
  return inventory.filter((item) => {
    const matchSku = !filters.sku || item.sku.toLowerCase().includes(filters.sku.toLowerCase());
    const matchName = !filters.name || item.name.includes(filters.name);
    const matchLocation = !filters.location || item.locationId === filters.location;
    const matchStatus = !filters.status || item.warningLabel === filters.status;
    return matchSku && matchName && matchLocation && matchStatus;
  });
});

const selectedItem = ref(null);

const applyFilters = () => {
  // Filters are applied via computed property
  if (filteredInventory.value.length > 0 && !selectedItem.value) {
    selectedItem.value = filteredInventory.value[0];
  }
};

const selectItem = (item) => {
  selectedItem.value = item;
};

const getWarningLevel = (quantity, threshold, totalStock, productId, locationId) => {
  if (quantity === 0) return { level: 'danger', label: 'Out of Stock' };
  
  // 对于区域仓库中的特定产品，如果可用库存小于总库存的30%，显示Low Stock
  const regionalWarehouses = ['WH-EAST', 'WH-WEST', 'WH-NORTH', 'WH-SOUTH'];
  const specificProducts = ['PROD-001', 'PROD-002', 'PROD-003', 'PROD-004', 'PROD-005', 'PROD-006'];
  
  if (regionalWarehouses.includes(locationId) && specificProducts.includes(productId)) {
    const threshold30Percent = totalStock * 0.3;
    if (quantity < threshold30Percent) {
      return { level: 'warning', label: 'Low Stock' };
    }
  }
  
  if (quantity < threshold) return { level: 'warning', label: 'Low Stock' };
  return { level: 'default', label: 'Normal' };
};

const getRestockAdvice = (quantity, threshold) => {
  if (quantity === 0) return 'Restock immediately 30 pieces';
  if (quantity < threshold) return `Suggest restock ${threshold - quantity} pieces`;
  return 'No restock needed';
};

const loadInventory = async () => {
  isLoading.value = true;
  try {
    // 并行加载三个位置的库存
    const [warehouseData, store1Data, store2Data] = await Promise.all([
      getInventoryByLocation('WH-EAST'),
      getInventoryByLocation('STORE-EAST-01'),
      getInventoryByLocation('STORE-EAST-02')
    ]);

    inventory.length = 0;

    // 合并三个位置的数据
    const allData = [
      ...warehouseData.map(item => ({ ...item, locationId: 'WH-EAST', locationName: 'East Warehouse' })),
      ...store1Data.map(item => ({ ...item, locationId: 'STORE-EAST-01', locationName: 'East Store 1' })),
      ...store2Data.map(item => ({ ...item, locationId: 'STORE-EAST-02', locationName: 'East Store 2' }))
    ];

    allData.forEach((item) => {
      const metadata = productMetadata[item.productId];
      if (metadata) {
        const totalStock = item.totalStock || 200;
        const warning = getWarningLevel(item.available, metadata.threshold, totalStock, item.productId, item.locationId);
        inventory.push({
          sku: item.productId,
          name: metadata.name,
          spec: metadata.spec,
          total: totalStock,
          available: item.available,
          threshold: metadata.threshold,
          warningLevel: warning.level,
          warningLabel: warning.label,
          store: item.locationName || metadata.store,
          location: item.locationId,
          locationId: item.locationId,
          lastInDate: metadata.lastInDate,
          restockAdvice: getRestockAdvice(item.available, metadata.threshold),
          colors: metadata.colors,
          sizes: metadata.sizes,
          price: metadata.price,
          icon: metadata.icon
        });
      }
    });

    // 提取所有门店名称用于筛选
    const uniqueStores = [...new Set(inventory.map(item => item.store))];
    stores.value = uniqueStores;

    if (inventory.length > 0 && !selectedItem.value) {
      selectedItem.value = inventory[0];
    }
  } catch (error) {
    console.error('Failed to load inventory:', error);
    window.alert('Failed to load inventory: ' + (error.message || 'Unknown error'));
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  loadInventory();
});
</script>

<style scoped>
.inventory {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
  gap: 24px;
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
  grid-template-columns: 2fr 1fr 1fr 1fr 1fr;
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

.empty {
  padding: 48px;
  text-align: center;
  color: var(--color-text-muted);
}

@media (max-width: 960px) {
  .inventory {
    grid-template-columns: 1fr;
  }
}
</style>

