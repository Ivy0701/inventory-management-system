import Order from '../models/Order.js';

const statusLabelMap = {
  pending: 'Pending',
  processing: 'Processing',
  shipped: 'Shipped',
  completed: 'Completed',
  cancelled: 'Cancelled',
  returned: 'Returned'
};

const generateOrderNumber = () => {
  const now = new Date();
  const datePart = now.toISOString().slice(0, 10).replace(/-/g, '');
  const randomPart = Math.floor(Math.random() * 900 + 100);
  return `ORD-${datePart}-${randomPart}`;
};

const buildTimeline = (title) => [
  { title: title || 'Order Created', time: new Date() }
];

const mapOrderResponse = (order) => ({
  id: order._id.toString(),
  orderNumber: order.orderNumber,
  customerId: order.customerId,
  customerName: order.customerName,
  items: order.items,
  shippingAddress: order.shippingAddress,
  subtotal: order.subtotal,
  discount: order.discount,
  totalAmount: order.totalAmount,
  remark: order.remark,
  inventoryStatus: order.inventoryStatus,
  status: order.status,
  statusLabel: statusLabelMap[order.status] || order.status,
  timeline: order.timeline,
  createTime: order.createdAt ? new Date(order.createdAt).toLocaleString('en-US') : '',
  createdAt: order.createdAt,
  updatedAt: order.updatedAt
});

export const getOrders = async (req, res, next) => {
  try {
    const user = req.user;
    
    if (!user) {
      // Guest user, return empty array
      return res.json([]);
    }
    
    const userRole = user.role;
    const userId = user.id || user._id;
    
    // Determine which orders to return based on user role
    let query = {};
    
    if (userRole === 'customer') {
      // Customers can only see their own orders
      query = { customerId: userId };
    } else if (userRole === 'sales' || userRole === 'warehouse') {
      // Sales staff and warehouse managers can see all orders
      query = {};
    } else {
      // Other roles return empty array
      return res.json([]);
    }
    
    // Query orders
    const orders = await Order.find(query).sort({ createdAt: -1 });
    res.json(orders.map(mapOrderResponse));
  } catch (error) {
    next(error);
  }
};

export const createOrder = async (req, res, next) => {
  try {
    const { items, shippingAddress, subtotal, discount = 0, totalAmount, remark = '' } = req.body;
    const customerId = req.user?.id || req.user?._id;
    
    // If no authenticated user, we can't create an order (or use guest, but they won't be able to view it)
    if (!customerId) {
      return res.status(401).json({ message: 'Please login before placing order' });
    }
    
    const customerName = req.user?.name || req.user?.account || shippingAddress?.name || 'Customer';

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Order items cannot be empty' });
    }

    if (!shippingAddress || !shippingAddress.name || !shippingAddress.phone || 
        !shippingAddress.street || !shippingAddress.city || !shippingAddress.state || !shippingAddress.zipCode) {
      return res.status(400).json({ message: 'Shipping address information is incomplete' });
    }

    if (!totalAmount || totalAmount <= 0) {
      return res.status(400).json({ message: 'Invalid order amount' });
    }

    const order = await Order.create({
      orderNumber: generateOrderNumber(),
      customerId,
      customerName,
      items,
      shippingAddress,
      subtotal: subtotal || totalAmount,
      discount,
      totalAmount,
      remark,
      inventoryStatus: 'Inventory Checking',
      status: 'pending',
      timeline: buildTimeline('Order Created')
    });

    res.status(201).json(mapOrderResponse(order));
  } catch (error) {
    if (error.code === 11000) {
      error.status = 400;
      error.message = 'Duplicate order number, please try again';
    }
    next(error);
  }
};

export const confirmOrderReceipt = async (req, res, next) => {
  try {
    const { id } = req.params;
    const customerId = req.user?.id || req.user?._id;

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ message: 'Order does not exist' });
    }

    // Check if order belongs to the customer
    if (customerId && order.customerId !== customerId) {
      return res.status(403).json({ message: 'No permission to operate this order' });
    }

    if (order.status !== 'shipped') {
      return res.status(400).json({ message: 'Only shipped orders can confirm receipt' });
    }

    order.status = 'completed';
    order.timeline.push({ title: 'Receipt Confirmed', time: new Date() });
    await order.save();

    res.json(mapOrderResponse(order));
  } catch (error) {
    next(error);
  }
};

export const returnOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const customerId = req.user?.id || req.user?._id;

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ message: 'Order does not exist' });
    }

    // Check if order belongs to the customer
    if (customerId && order.customerId !== customerId) {
      return res.status(403).json({ message: 'No permission to operate this order' });
    }

    if (!['shipped', 'completed'].includes(order.status)) {
      return res.status(400).json({ message: 'Only shipped or completed orders can apply for return' });
    }

    order.status = 'returned';
    order.timeline.push({ title: 'Return Requested', time: new Date() });
    await order.save();

    res.json(mapOrderResponse(order));
  } catch (error) {
    next(error);
  }
};

export const confirmOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = req.user;

    if (!user) {
      return res.status(401).json({ message: 'Login required' });
    }

    // Only sales staff and warehouse managers can confirm orders
    if (user.role !== 'sales' && user.role !== 'warehouse') {
      return res.status(403).json({ message: 'Only sales staff and warehouse managers can confirm orders' });
    }

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ message: 'Order does not exist' });
    }

    // Only pending orders can be confirmed
    if (order.status !== 'pending') {
      return res.status(400).json({ message: 'Only pending orders can be confirmed' });
    }

    order.status = 'processing';
    order.timeline.push({ title: 'Order Confirmed', time: new Date() });
    await order.save();

    res.json(mapOrderResponse(order));
  } catch (error) {
    next(error);
  }
};

export const cancelOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const customerId = req.user?.id || req.user?._id;

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ message: 'Order does not exist' });
    }

    // Check if order belongs to the customer
    if (customerId && order.customerId !== customerId) {
      return res.status(403).json({ message: 'No permission to operate this order' });
    }

    // Only allow cancelling pending or processing orders
    if (!['pending', 'processing'].includes(order.status)) {
      return res.status(400).json({ message: 'Only pending or processing orders can be cancelled' });
    }

    order.status = 'cancelled';
    order.timeline.push({ title: 'Order Cancelled', time: new Date() });
    await order.save();

    res.json(mapOrderResponse(order));
  } catch (error) {
    next(error);
  }
};

export const shipOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = req.user;

    if (!user) {
      return res.status(401).json({ message: 'Login required' });
    }

    // Only sales staff can ship orders
    if (user.role !== 'sales') {
      return res.status(403).json({ message: 'Only sales staff can ship orders' });
    }

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ message: 'Order does not exist' });
    }

    // Only processing orders can be shipped
    if (order.status !== 'processing') {
      return res.status(400).json({ message: 'Only processing orders can be shipped' });
    }

    order.status = 'shipped';
    order.timeline.push({ title: 'Order Shipped', time: new Date() });
    await order.save();

    res.json(mapOrderResponse(order));
  } catch (error) {
    next(error);
  }
};

