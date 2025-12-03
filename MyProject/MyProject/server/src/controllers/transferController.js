import mongoose from 'mongoose';
import TransferOrder from '../models/TransferOrder.js';
import ReceivingSchedule from '../models/ReceivingSchedule.js';
import ReplenishmentRequest from '../models/ReplenishmentRequest.js';
import { adjustInventory } from '../services/inventoryService.js';
const genTransferId = () => {
  const now = new Date();
  return `TRF-${now.toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(Math.random() * 900 + 100)}`;
};

export const createTransferOrder = async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    const {
      productSku,
      productName,
      quantity,
      fromLocationId,
      fromLocationName,
      toLocationId,
      toLocationName,
      requestId
    } = req.body;

    if (!productSku || !quantity || !fromLocationId || !toLocationId) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    if (quantity <= 0) {
      return res.status(400).json({ message: 'Quantity must be greater than 0' });
    }

    const transferId = genTransferId();

    let transferDoc;
    await session.withTransaction(async () => {
      await adjustInventory({
        locationId: fromLocationId,
        locationName: fromLocationName,
        productSku,
        productName,
        delta: -quantity,
        session
      });

      transferDoc = await TransferOrder.create(
        [
          {
            transferId,
            productSku,
            productName,
            quantity,
            fromLocationId,
            fromLocationName: fromLocationName || fromLocationId,
            toLocationId,
            toLocationName: toLocationName || toLocationId,
            status: 'IN_TRANSIT',
            history: [
              { status: 'PENDING', note: 'Transfer order created', createdAt: new Date() },
              { status: 'IN_TRANSIT', note: 'Dispatched by central warehouse', createdAt: new Date() }
            ],
            inventoryUpdated: false,
            requestId: requestId || null
          }
        ],
        { session }
      );

      await ReceivingSchedule.create(
        [
          {
            planNo: transferId,
            supplier: 'Central Warehouse',
            eta: new Date(Date.now() + 2 * 24 * 3600 * 1000),
            dock: 'Central-Dock',
            items: 1,
            productSku,
            productName,
            quantity,
            storageLocationId: toLocationId,
            qualityLevel: 'A',
            status: 'IN_TRANSIT'
          }
        ],
        { session }
      );

      if (requestId) {
        await ReplenishmentRequest.findOneAndUpdate(
          { requestId },
          {
            status: 'PROCESSING',
            $push: {
              progress: {
                title: 'Transfer Order Created',
                desc: `${quantity} units of ${productSku} allocated from ${fromLocationName || fromLocationId}`,
                status: 'completed',
                timestamp: new Date()
              }
            }
          },
          { session }
        );
      }
    });

    res.status(201).json(transferDoc[0]);
  } catch (error) {
    next(error);
  } finally {
    session.endSession();
  }
};

const formatDate = (value) => (value ? new Date(value) : null);

export const getTransferOrders = async (req, res, next) => {
  try {
    const { locationId, status } = req.query;
    const filter = {};

    if (locationId) {
      filter.$or = [{ fromLocationId: locationId }, { toLocationId: locationId }];
    }

    if (status) {
      filter.status = status;
    }

    const transfers = await TransferOrder.find(filter).sort({ createdAt: -1 });
    res.json(transfers);
  } catch (error) {
    next(error);
  }
};

export const dispatchTransferOrder = async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    const { transferId } = req.params;
    const { carrier, dock, departure, remark } = req.body;

    const transfer = await TransferOrder.findOne({ transferId });
    if (!transfer) {
      return res.status(404).json({ message: 'Transfer order not found' });
    }

    if (transfer.status !== 'PENDING') {
      return res.status(400).json({ message: 'Only pending transfer orders can be dispatched' });
    }

    await session.withTransaction(async () => {
      await adjustInventory({
        locationId: transfer.fromLocationId,
        locationName: transfer.fromLocationName,
        productSku: transfer.productSku,
        productName: transfer.productName,
        delta: -transfer.quantity,
        session
      });

      transfer.status = 'IN_TRANSIT';
      transfer.dispatchInfo = {
        carrier: carrier || '',
        dock: dock || '',
        departure: formatDate(departure),
        remark: remark || ''
      };
      transfer.history.push({
        status: 'IN_TRANSIT',
        note: `Dispatched via ${carrier || 'N/A'}`
      });

      await transfer.save({ session });
    });

    res.json(transfer);
  } catch (error) {
    next(error);
  } finally {
    session.endSession();
  }
};

