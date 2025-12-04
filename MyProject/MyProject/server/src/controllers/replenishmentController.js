import ReplenishmentAlert from '../models/ReplenishmentAlert.js';
import ReplenishmentRequest from '../models/ReplenishmentRequest.js';
import Inventory from '../models/Inventory.js';

const genRequestId = () => {
  const now = new Date();
  return `REQ-${now.toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(Math.random() * 900 + 100)}`;
};

export const getReplenishmentAlerts = async (_req, res, next) => {
  try {
    const alerts = await ReplenishmentAlert.find().sort({ createdAt: -1 });
    res.json(alerts);
  } catch (error) {
    next(error);
  }
};

export const getReplenishmentProgress = async (_req, res, next) => {
  try {
    const requests = await ReplenishmentRequest.find().sort({ createdAt: -1 }).limit(10);
    const progress = requests
      .flatMap((req) =>
        req.progress.map((step) => ({
          title: step.title,
          desc: step.desc,
          status: step.status,
          time: step.timestamp,
          requestId: req.requestId
        }))
      )
      .sort((a, b) => new Date(b.time) - new Date(a.time))
      .slice(0, 20);

    res.json(progress);
  } catch (error) {
    next(error);
  }
};

export const submitReplenishmentApplication = async (req, res, next) => {
  try {
    const {
      alertId,
      productId,
      productName,
      vendor,
      quantity,
      deliveryDate,
      remark,
      warehouseId,
      warehouseName,
      reason
    } = req.body;

    if (!productId || !vendor || !quantity || !deliveryDate || !warehouseId || !warehouseName) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    if (quantity <= 0) {
      return res.status(400).json({ message: 'Quantity must be greater than 0' });
    }

    const now = new Date();
    const request = await ReplenishmentRequest.create({
      requestId: genRequestId(),
      productId,
      productName: productName || productId,
      vendor,
      quantity,
      deliveryDate,
      remark,
      warehouseId,
      warehouseName,
      reason: reason || 'Safety stock alert',
      status: 'PENDING',
      progress: [
        {
          title: 'Replenishment Alert Generated',
          desc: `${productName || productId} below threshold at ${warehouseName}`,
          status: 'completed',
          timestamp: now
        },
        {
          title: 'Application Submitted',
          desc: `${warehouseName} requested ${quantity} units from ${vendor}`,
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
    });

    if (alertId) {
      await ReplenishmentAlert.findOneAndDelete({ alertId });
    }

    const [alerts, progress] = await Promise.all([
      ReplenishmentAlert.find().sort({ createdAt: -1 }),
      ReplenishmentRequest.find().sort({ createdAt: -1 }).limit(10)
    ]);

    const progressEntries = progress
      .flatMap((reqItem) =>
        reqItem.progress.map((step) => ({
          title: step.title,
          desc: step.desc,
          status: step.status,
          time: step.timestamp,
          requestId: reqItem.requestId
        }))
      )
      .sort((a, b) => new Date(b.time) - new Date(a.time))
      .slice(0, 20);

    res.status(201).json({
      request,
      alerts,
      progress: progressEntries
    });
  } catch (error) {
    next(error);
  }
};

export const getReplenishmentApplications = async (req, res, next) => {
  try {
    const { status, warehouseId } = req.query;
    const filter = {};
    if (status && status !== 'ALL') {
      filter.status = status;
    }
    if (warehouseId) {
      filter.warehouseId = warehouseId;
    }
    const applications = await ReplenishmentRequest.find(filter).sort({ createdAt: -1 });
    res.json(applications);
  } catch (error) {
    next(error);
  }
};

export const updateReplenishmentApplicationStatus = async (req, res, next) => {
  try {
    const { requestId } = req.params;
    const { decision, remark } = req.body;

    if (!['APPROVED', 'REJECTED'].includes(decision)) {
      return res.status(400).json({ message: 'Invalid decision' });
    }

    const request = await ReplenishmentRequest.findOne({ requestId });
    if (!request) {
      return res.status(404).json({ message: 'Application not found' });
    }

    request.status = decision === 'APPROVED' ? 'APPROVED' : 'COMPLETED';
    request.progress.push({
      title: decision === 'APPROVED' ? 'Application Approved' : 'Application Rejected',
      desc: remark || (decision === 'APPROVED' ? 'Approved by central manager' : 'Rejected by central manager'),
      status: 'completed',
      timestamp: new Date()
    });
    await request.save();

    res.json(request);
  } catch (error) {
    next(error);
  }
};

// Check inventory and create replenishment alerts for low stock items
export const checkAndCreateReplenishmentAlerts = async (_req, res, next) => {
  try {
    const targetProducts = ['PROD-001', 'PROD-002', 'PROD-003', 'PROD-004', 'PROD-005', 'PROD-006'];
    const regionalWarehouses = ['WH-EAST', 'WH-WEST', 'WH-NORTH', 'WH-SOUTH'];
    
    const createdAlerts = [];
    
    // 检查每个区域仓库中的指定产品
    for (const warehouseId of regionalWarehouses) {
      for (const productId of targetProducts) {
        const inventory = await Inventory.findOne({
          productId,
          locationId: warehouseId
        });
        
        if (inventory && inventory.totalStock > 0) {
          const threshold30Percent = inventory.totalStock * 0.3;
          
          // 如果available < totalStock * 0.3，创建或更新alert
          if (inventory.available < threshold30Percent) {
            // 检查是否已有未完成的补货申请
            const existingRequest = await ReplenishmentRequest.findOne({
              productId,
              warehouseId,
              status: { $in: ['PENDING', 'PROCESSING', 'APPROVED'] }
            });
            
            // 如果没有未完成的申请，创建或更新alert
            if (!existingRequest) {
              const alertId = `ALERT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
              const suggestedQty = Math.max(0, Math.ceil(inventory.totalStock * 0.9 - inventory.available)); // 建议补到90%
              const shortageQty = Math.ceil(threshold30Percent - inventory.available); // 缺货数量
              
              const alert = await ReplenishmentAlert.findOneAndUpdate(
                { productId, warehouseId },
                {
                  alertId,
                  productId,
                  productName: inventory.productName || productId,
                  stock: inventory.available,
                  suggested: suggestedQty > 0 ? suggestedQty : Math.ceil(threshold30Percent),
                  trigger: `区域仓库库存低于总库存的30% (当前: ${inventory.available} < ${Math.ceil(threshold30Percent)})`,
                  warehouseId,
                  warehouseName: inventory.locationName || warehouseId,
                  level: inventory.available < threshold30Percent * 0.5 ? 'danger' : 'warning',
                  levelLabel: inventory.available < threshold30Percent * 0.5 ? 'Urgent' : 'Warning',
                  threshold: Math.ceil(threshold30Percent),
                  shortageQty: shortageQty > 0 ? shortageQty : 0 // 缺货数量
                },
                { upsert: true, new: true }
              );
              
              createdAlerts.push(alert);
            }
          } else {
            // 如果库存已恢复，删除对应的alert
            await ReplenishmentAlert.findOneAndDelete({ productId, warehouseId });
          }
        }
      }
    }
    
    res.json({ 
      message: 'Inventory check completed',
      alertsCreated: createdAlerts.length,
      alerts: createdAlerts
    });
  } catch (error) {
    next(error);
  }
};

// Create replenishment alerts for low stock items from frontend
export const createAlertsForLowStockItems = async (req, res, next) => {
  try {
    const { items } = req.body;
    
    if (!Array.isArray(items) || items.length === 0) {
      return res.json({ 
        message: 'No low stock items provided',
        alertsCreated: 0,
        alerts: []
      });
    }
    
    const createdAlerts = [];
    
    for (const item of items) {
      const { productId, productName, locationId, locationName, available, totalStock, threshold } = item;
      
      if (!productId || !locationId) {
        continue;
      }
      
      // 检查是否已存在alert
      const existingAlert = await ReplenishmentAlert.findOne({
        productId,
        warehouseId: locationId
      });
      
      // 只要商品是low stock状态，就应该创建或更新alert
      // 无论是否有未完成的申请，都应该显示alert（因为申请可能被拒绝，或者需要再次补货）
      
        // 计算缺货数量：如果totalStock存在，使用30%阈值；否则使用threshold
      let shortageQty = 0;
      let suggestedQty = 0;
      let triggerText = '';
      
      if (totalStock && totalStock > 0) {
        const threshold30Percent = totalStock * 0.3;
          shortageQty = Math.max(0, Math.ceil(threshold30Percent - available));
          suggestedQty = Math.max(0, Math.ceil(totalStock * 0.9 - available));
        triggerText = `库存低于总库存的30% (当前: ${available} < ${Math.ceil(threshold30Percent)})`;
      } else if (threshold && threshold > 0) {
          shortageQty = Math.max(0, Math.ceil(threshold - available));
          suggestedQty = Math.max(0, Math.ceil((threshold * 3) - available)); // 近似为 totalStock=threshold/0.3, 0.9*totalStock=3*threshold
        triggerText = `库存低于安全阈值 (当前: ${available} < ${threshold})`;
      } else {
        shortageQty = Math.max(0, Math.ceil(50 - available)); // 默认阈值50
        suggestedQty = Math.max(0, Math.ceil(100 - available));
        triggerText = `库存低于安全阈值 (当前: ${available})`;
      }
      
      const alertId = existingAlert?.alertId || `ALERT-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
      
      const alert = await ReplenishmentAlert.findOneAndUpdate(
        { productId, warehouseId: locationId },
        {
          alertId,
          productId,
          productName: productName || productId,
          stock: available,
          suggested: suggestedQty > 0 ? suggestedQty : Math.max(50, shortageQty),
          trigger: triggerText,
          warehouseId: locationId,
          warehouseName: locationName || locationId,
          level: available === 0 ? 'danger' : 'warning',
          levelLabel: available === 0 ? 'Urgent' : 'Warning',
          threshold: totalStock ? Math.ceil(totalStock * 0.3) : (threshold || 50),
          shortageQty: shortageQty
        },
        { upsert: true, new: true }
      );
      
      createdAlerts.push(alert);
    }
    
    res.json({ 
      message: 'Alerts created for low stock items',
      alertsCreated: createdAlerts.length,
      alerts: createdAlerts
    });
  } catch (error) {
    next(error);
  }
};

