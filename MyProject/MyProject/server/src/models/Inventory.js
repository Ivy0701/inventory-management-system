import mongoose from 'mongoose';

const inventorySchema = new mongoose.Schema(
  {
    productId: { type: String, required: true, unique: true },
    productName: { type: String, required: true },
    totalStock: { type: Number, required: true, min: 0, default: 200 }, // Total capacity, always 200
    available: { type: Number, required: true, min: 0, default: 200 } // Available stock, changes with shipping/returns
  },
  { timestamps: true }
);

inventorySchema.index({ productId: 1 }, { unique: true });

const Inventory = mongoose.model('Inventory', inventorySchema);

export default Inventory;

