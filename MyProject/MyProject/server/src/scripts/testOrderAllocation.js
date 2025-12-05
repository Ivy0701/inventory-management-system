import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Order from '../models/Order.js';
import User from '../models/User.js';
import connectDb from '../config/db.js';

dotenv.config();

const testOrderAllocation = async () => {
  try {
    console.log('🔄 开始测试订单分配和查询逻辑...\n');
    
    // 连接数据库
    await connectDb();
    
    // 1. 检查华西销售员的 region 设置
    console.log('1. 检查华西销售员的 region 设置:');
    const westSalesUsers = await User.find({ 
      account: { $in: ['west_store1_sales_01', 'west_store1_sales_02', 'west_store2_sales_01', 'west_store2_sales_02'] }
    });
    
    westSalesUsers.forEach(user => {
      console.log(`   ${user.account}: region=${user.region}, accessibleLocationIds=${JSON.stringify(user.accessibleLocationIds)}`);
    });
    
    // 2. 查找所有新疆订单
    console.log('\n2. 查找所有新疆订单:');
    const xinjiangOrders = await Order.find({
      'shippingAddress.state': { $regex: /xinjiang/i }
    }).sort({ createdAt: -1 }).limit(5);
    
    console.log(`   找到 ${xinjiangOrders.length} 个新疆订单`);
    xinjiangOrders.forEach(order => {
      console.log(`   Order ${order.orderNumber}: state="${order.shippingAddress.state}", inventoryLocationId="${order.inventoryLocationId}"`);
    });
    
    // 3. 测试查询逻辑 - 模拟华西销售员查询
    console.log('\n3. 测试查询逻辑（模拟华西销售员）:');
    const westRegion = 'WEST';
    const query = {
      $or: [
        { inventoryLocationId: { $regex: new RegExp(`STORE-${westRegion}`, 'i') } },
        { inventoryLocationId: { $regex: new RegExp(`WH-${westRegion}`, 'i') } }
      ]
    };
    
    console.log(`   查询条件: ${JSON.stringify(query)}`);
    const westOrders = await Order.find(query).sort({ createdAt: -1 }).limit(10);
    console.log(`   找到 ${westOrders.length} 个华西区域订单`);
    westOrders.forEach(order => {
      console.log(`   Order ${order.orderNumber}: inventoryLocationId="${order.inventoryLocationId}", state="${order.shippingAddress?.state}"`);
    });
    
    // 4. 检查最近的订单分配
    console.log('\n4. 检查最近创建的订单:');
    const recentOrders = await Order.find().sort({ createdAt: -1 }).limit(5);
    recentOrders.forEach(order => {
      const state = order.shippingAddress?.state || 'N/A';
      const locationId = order.inventoryLocationId || 'N/A';
      console.log(`   Order ${order.orderNumber}: state="${state}", inventoryLocationId="${locationId}"`);
    });
    
    // 关闭数据库连接
    await mongoose.connection.close();
    console.log('\n✨ 测试完成！');
    process.exit(0);
  } catch (error) {
    console.error('❌ 测试失败:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

// 运行测试
testOrderAllocation();

