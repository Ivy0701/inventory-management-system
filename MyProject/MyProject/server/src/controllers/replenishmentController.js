import ReplenishmentAlert from '../models/ReplenishmentAlert.js';
import ReplenishmentRequest from '../models/ReplenishmentRequest.js';

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
    const { status } = req.query;
    const filter = {};
    if (status) {
      filter.status = status;
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

    // 确保必填字段存在，如果不存在则使用默认值
    const warehouseId = request.warehouseId || 'UNKNOWN';
    const warehouseName = request.warehouseName || 'Unknown Warehouse';

    // 使用 findOneAndUpdate 确保所有必填字段都被正确保存
    const updated = await ReplenishmentRequest.findOneAndUpdate(
      { requestId },
      {
        $set: {
          status: decision === 'APPROVED' ? 'APPROVED' : 'REJECTED',
          warehouseId: warehouseId,
          warehouseName: warehouseName
        },
        $push: {
          progress: {
            title: decision === 'APPROVED' ? 'Application Approved' : 'Application Rejected',
            desc: remark || (decision === 'APPROVED' ? 'Approved by central manager' : 'Rejected by central manager'),
            status: 'completed',
            timestamp: new Date()
          }
        }
      },
      { new: true, runValidators: true }
    );

    res.json(updated);
  } catch (error) {
    next(error);
  }
};

