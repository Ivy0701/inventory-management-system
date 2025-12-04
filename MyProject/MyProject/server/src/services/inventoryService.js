import Inventory from '../models/Inventory.js';
import ReplenishmentAlert from '../models/ReplenishmentAlert.js';
import ReplenishmentRequest from '../models/ReplenishmentRequest.js';

const genRequestId = () => {
  const now = new Date();
  return `REQ-${now.toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(Math.random() * 900 + 100)}`;
};

const getWarehouseForStore = (locationId) => {
  if (!locationId || !locationId.startsWith('STORE-')) return null;
  if (locationId.includes('EAST')) return { warehouseId: 'WH-EAST', warehouseName: 'East Warehouse' };
  if (locationId.includes('WEST')) return { warehouseId: 'WH-WEST', warehouseName: 'West Warehouse' };
  if (locationId.includes('NORTH')) return { warehouseId: 'WH-NORTH', warehouseName: 'North Warehouse' };
  if (locationId.includes('SOUTH')) return { warehouseId: 'WH-SOUTH', warehouseName: 'South Warehouse' };
  return null;
};

export const adjustInventory = async ({
  productSku,
  productName,
  locationId,
  locationName,
  delta,
  session
}) => {
  if (!productSku || !locationId || !delta) {
    throw new Error('productSku, locationId and delta are required for inventory adjustment');
  }

  const options = {
    new: true,
    upsert: true,
    setDefaultsOnInsert: true
  };

  if (session) {
    options.session = session;
  }

  const inventory = await Inventory.findOneAndUpdate(
    { productId: productSku, locationId },
    {
      $inc: { available: delta },
      $set: {
        lastUpdated: new Date(),
        productName: productName || productSku,
        locationName: locationName || locationId
      },
      $setOnInsert: {
        productId: productSku,
        locationId,
        totalStock: 200,
        minThreshold: 0,
        maxThreshold: 500
      }
    },
    options
  );

  if (inventory.available < 0) {
    throw new Error(`Inventory cannot be negative for ${productSku} at ${locationId}`);
  }

  // 自动补货触发：仅对门店位置生效，available < 60 时为对应区域仓库生成补货请求 + 预警
  const storeMapping = getWarehouseForStore(locationId);
  if (storeMapping && inventory.available < 60) {
    const { warehouseId, warehouseName } = storeMapping;

    // 检查是否已有未完成的补货申请
    const baseFilter = {
      productId: productSku,
      warehouseId,
      status: { $in: ['PENDING', 'PROCESSING', 'APPROVED'] }
    };
    const reqQuery = ReplenishmentRequest.findOne(baseFilter);
    if (session) reqQuery.session(session);
    const existingReq = await reqQuery;

    if (!existingReq) {
      const quantity = 200 - inventory.available;
      const now = new Date();

      const createReq = ReplenishmentRequest.create(
        [
          {
            requestId: genRequestId(),
            productId: productSku,
            productName: productName || productSku,
            vendor: '',
            quantity: quantity > 0 ? quantity : 60,
            deliveryDate: new Date(now.getTime() + 3 * 24 * 3600 * 1000),
            remark: `Auto request from ${locationName || locationId}`,
            warehouseId,
            warehouseName,
            reason: 'Store inventory below 60',
            status: 'PENDING',
            progress: [
              {
                title: 'Replenishment Alert Generated',
                desc: `${productName || productSku} below threshold at ${locationName || locationId}`,
                status: 'completed',
                timestamp: now
              },
              {
                title: 'Application Submitted',
                desc: `${warehouseName} auto request ${quantity > 0 ? quantity : 60} units`,
                status: 'completed',
                timestamp: now
              },
              {
                title: 'Waiting for Approval',
                desc: 'Awaiting central approval',
                status: 'processing',
                timestamp: now
              }
            ]
          }
        ],
        session ? { session } : {}
      );

      const alertFilter = {
        productId: productSku,
        warehouseId
      };
      const totalStock = inventory.totalStock || 200;
      const targetStock = totalStock * 0.9;
      const suggestedQty = Math.max(0, Math.ceil(targetStock - inventory.available));

      const alertUpdate = {
        $set: {
          productName: productName || productSku,
          stock: inventory.available,
          suggested: suggestedQty,
          trigger: 'Store inventory below threshold',
          warehouseName,
          level: 'warning',
          levelLabel: 'Warning',
          threshold: 60
        }
      };
      const alertOptions = { upsert: true, new: true };
      if (session) alertOptions.session = session;
      const createAlert = ReplenishmentAlert.findOneAndUpdate(alertFilter, alertUpdate, alertOptions);

      await Promise.all([createReq, createAlert]);
    }
  }

  // 检查区域仓库库存是否低于30%，如果是，创建replenishment alert
  const regionalWarehouses = ['WH-EAST', 'WH-WEST', 'WH-NORTH', 'WH-SOUTH'];
  const targetProducts = ['PROD-001', 'PROD-002', 'PROD-003', 'PROD-004', 'PROD-005', 'PROD-006'];
  
  if (regionalWarehouses.includes(locationId) && targetProducts.includes(productSku)) {
    if (inventory.totalStock > 0) {
      const threshold30Percent = inventory.totalStock * 0.3;
      
      if (inventory.available < threshold30Percent) {
        // 检查是否已有未完成的补货申请
        const baseFilter = {
          productId: productSku,
          warehouseId: locationId,
          status: { $in: ['PENDING', 'PROCESSING', 'APPROVED'] }
        };
        const reqQuery = ReplenishmentRequest.findOne(baseFilter);
        if (session) reqQuery.session(session);
        const existingReq = await reqQuery;
        
        if (!existingReq) {
          const alertId = `ALERT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
          const suggestedQty = Math.ceil(inventory.totalStock * 0.9 - inventory.available);
          const shortageQty = Math.ceil(threshold30Percent - inventory.available);
          
          const alertFilter = {
            productId: productSku,
            warehouseId: locationId
          };
          const alertUpdate = {
            $set: {
              alertId,
              productId: productSku,
              productName: productName || productSku,
              stock: inventory.available,
              suggested: suggestedQty > 0 ? suggestedQty : Math.ceil(threshold30Percent),
              trigger: `区域仓库库存低于总库存的30% (当前: ${inventory.available} < ${Math.ceil(threshold30Percent)})`,
              warehouseId: locationId,
              warehouseName: locationName || locationId,
              level: inventory.available < threshold30Percent * 0.5 ? 'danger' : 'warning',
              levelLabel: inventory.available < threshold30Percent * 0.5 ? 'Urgent' : 'Warning',
              threshold: Math.ceil(threshold30Percent),
              shortageQty: shortageQty > 0 ? shortageQty : 0
            }
          };
          const alertOptions = { upsert: true, new: true };
          if (session) alertOptions.session = session;
          await ReplenishmentAlert.findOneAndUpdate(alertFilter, alertUpdate, alertOptions);
        }
      } else {
        // 如果库存已恢复，删除对应的alert
        const deleteQuery = ReplenishmentAlert.findOneAndDelete({ productId: productSku, warehouseId: locationId });
        if (session) deleteQuery.session(session);
        await deleteQuery;
      }
    }
  }

  return inventory;
};

