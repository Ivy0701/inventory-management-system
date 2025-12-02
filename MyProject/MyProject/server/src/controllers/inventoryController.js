import Inventory from '../models/Inventory.js';

// Product list matching frontend
const PRODUCTS = [
  { id: 'PROD-001', name: 'Casual T-Shirt' },
  { id: 'PROD-002', name: 'Classic Denim Jeans' },
  { id: 'PROD-003', name: 'Hooded Sweatshirt' },
  { id: 'PROD-004', name: 'Chino Pants' },
  { id: 'PROD-005', name: 'Polo Shirt' },
  { id: 'PROD-006', name: 'Jogger Pants' }
];

// Initialize all products with 200 stock (only if not already initialized)
export const initializeInventory = async (req, res, next) => {
  try {
    // Check if inventory already exists
    const existingCount = await Inventory.countDocuments();
    if (existingCount > 0) {
      // Inventory already exists, don't reset it
      return res.json({ message: 'Inventory already initialized', alreadyExists: true });
    }
    
    // Only initialize if no inventory records exist
    for (const product of PRODUCTS) {
      await Inventory.create({
        productId: product.id,
        productName: product.name,
        totalStock: 200,
        available: 200
      });
    }
    res.json({ message: 'Inventory initialized successfully', alreadyExists: false });
  } catch (error) {
    next(error);
  }
};

// Get all inventory
export const getInventory = async (req, res, next) => {
  try {
    const inventory = await Inventory.find().sort({ productId: 1 });
    res.json(inventory);
  } catch (error) {
    next(error);
  }
};

// Get inventory by productId
export const getInventoryByProductId = async (productId) => {
  try {
    const inventory = await Inventory.findOne({ productId });
    return inventory;
  } catch (error) {
    throw error;
  }
};

// Update inventory quantity (decrease or increase available stock)
export const updateInventoryQuantity = async (productId, quantityChange) => {
  try {
    let inventory = await Inventory.findOne({ productId });
    
    // If inventory doesn't exist, initialize it with 200
    if (!inventory) {
      console.log(`Inventory not found for product ${productId}, initializing with 200`);
      const product = PRODUCTS.find(p => p.id === productId);
      if (!product) {
        throw new Error(`Product ${productId} not found in product list`);
      }
      inventory = await Inventory.create({
        productId: product.id,
        productName: product.name,
        totalStock: 200,
        available: 200
      });
    }
    
    const newAvailable = inventory.available + quantityChange;
    if (newAvailable < 0) {
      throw new Error(`Insufficient inventory for product ${productId}. Available: ${inventory.available}, Requested: ${-quantityChange}`);
    }
    if (newAvailable > inventory.totalStock) {
      throw new Error(`Cannot exceed total stock for product ${productId}. Total Stock: ${inventory.totalStock}, Requested: ${inventory.available + quantityChange}`);
    }
    
    const oldAvailable = inventory.available;
    inventory.available = newAvailable;
    await inventory.save();
    console.log(`Inventory updated: productId=${productId}, oldAvailable=${oldAvailable}, newAvailable=${inventory.available}, totalStock=${inventory.totalStock}`);
    return inventory;
  } catch (error) {
    console.error(`Error updating inventory for product ${productId}:`, error);
    throw error;
  }
};

// Decrease inventory (for shipping)
export const decreaseInventory = async (productId, quantity) => {
  return await updateInventoryQuantity(productId, -quantity);
};

// Increase inventory (for returns)
export const increaseInventory = async (productId, quantity) => {
  return await updateInventoryQuantity(productId, quantity);
};

