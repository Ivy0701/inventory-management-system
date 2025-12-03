import TransferOrder from '../models/TransferOrder.js';
import ReceivingSchedule from '../models/ReceivingSchedule.js';
import ReplenishmentAlert from '../models/ReplenishmentAlert.js';

const transferSeed = [
  {
    transferId: 'TRF-20251203-001',
    productSku: 'PROD-001',
    productName: 'Casual T-Shirt',
    quantity: 80,
    fromLocationId: 'WH-EAST',
    fromLocationName: 'East Warehouse',
    toLocationId: 'STORE-EAST-01',
    toLocationName: 'East Store 1'
  },
  {
    transferId: 'TRF-20251203-002',
    productSku: 'PROD-004',
    productName: 'Chino Pants',
    quantity: 60,
    fromLocationId: 'WH-SOUTH',
    fromLocationName: 'South Warehouse',
    toLocationId: 'STORE-SOUTH-02',
    toLocationName: 'South Store 2'
  },
  {
    transferId: 'TRF-20251203-003',
    productSku: 'PROD-003',
    productName: 'Hooded Sweatshirt',
    quantity: 40,
    fromLocationId: 'WH-NORTH',
    fromLocationName: 'North Warehouse',
    toLocationId: 'STORE-NORTH-01',
    toLocationName: 'North Store 1'
  }
];

const receivingSeed = [
  {
    planNo: 'INB-20251205-001',
    supplier: 'JingCai Technology',
    eta: new Date(Date.now() + 3600 * 1000 * 24),
    dock: 'A-03',
    items: 24,
    productSku: 'PROD-002',
    productName: 'Classic Denim Jeans',
    quantity: 120,
    status: 'PENDING',
    qualityLevel: 'A'
  },
  {
    planNo: 'INB-20251204-002',
    supplier: 'LianChuang Supply Chain',
    eta: new Date(Date.now() + 3600 * 1000 * 48),
    dock: 'B-01',
    items: 18,
    productSku: 'PROD-006',
    productName: 'Jogger Pants',
    quantity: 90,
    status: 'IN_TRANSIT',
    qualityLevel: 'B'
  }
];

const alertSeed = [
  {
    alertId: 'REM-001',
    productId: 'PROD-006',
    productName: 'Jogger Pants',
    stock: 5,
    suggested: 30,
    trigger: 'Below safety threshold',
    warehouseId: 'WH-NORTH',
    warehouseName: 'North Warehouse',
    level: 'danger',
    levelLabel: 'Urgent',
    icon: '👖',
    threshold: 25
  },
  {
    alertId: 'REM-002',
    productId: 'PROD-003',
    productName: 'Hooded Sweatshirt',
    stock: 30,
    suggested: 25,
    trigger: 'Below safety threshold',
    warehouseId: 'WH-EAST',
    warehouseName: 'East Warehouse',
    level: 'warning',
    levelLabel: 'Warning',
    icon: '🧥',
    threshold: 50
  }
];

export const initOperationalData = async () => {
  try {
    const transferCount = await TransferOrder.countDocuments();
    if (transferCount === 0) {
      await TransferOrder.insertMany(transferSeed);
      console.log('Seeded transfer orders');
    }

    const receivingCount = await ReceivingSchedule.countDocuments();
    if (receivingCount === 0) {
      await ReceivingSchedule.insertMany(receivingSeed);
      console.log('Seeded receiving schedules');
    }

    const alertCount = await ReplenishmentAlert.countDocuments();
    if (alertCount === 0) {
      await ReplenishmentAlert.insertMany(alertSeed);
      console.log('Seeded replenishment alerts');
    }
  } catch (error) {
    console.error('Failed to seed operational data', error);
  }
};

