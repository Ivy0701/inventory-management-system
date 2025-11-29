import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import connectDb from '../config/db.js';

dotenv.config();

// 预设账号配置
const defaultUsers = [
  // 销售员账号
  {
    account: 'sales001',
    password: '123456',
    name: '销售员1',
    role: 'sales'
  },
  {
    account: 'sales002',
    password: '123456',
    name: '销售员2',
    role: 'sales'
  },
  // 区域仓库管理员账号
  {
    account: 'regional001',
    password: '123456',
    name: '区域仓库管理员1',
    role: 'regionalManager'
  },
  {
    account: 'regional002',
    password: '123456',
    name: '区域仓库管理员2',
    role: 'regionalManager'
  },
  // 总仓库管理员账号
  {
    account: 'central001',
    password: '123456',
    name: '总仓库管理员1',
    role: 'centralManager'
  },
  {
    account: 'central002',
    password: '123456',
    name: '总仓库管理员2',
    role: 'centralManager'
  }
];

const initUsers = async () => {
  try {
    console.log('🔄 开始初始化预设账号...');
    
    // 连接数据库
    await connectDb();
    
    // 创建每个预设账号
    for (const userData of defaultUsers) {
      const { account, password, name, role } = userData;
      
      // 检查账号是否已存在
      const existingUser = await User.findOne({ account });
      
      if (existingUser) {
        console.log(`⏭️  账号 ${account} 已存在，跳过创建`);
        continue;
      }
      
      // 加密密码
      const passwordHash = await bcrypt.hash(password, 10);
      
      // 创建用户
      const user = await User.create({
        account,
        passwordHash,
        name,
        role
      });
      
      console.log(`✅ 成功创建账号: ${account} (${name}) - 角色: ${role}`);
    }
    
    console.log('✨ 预设账号初始化完成！');
    console.log('\n📋 预设账号列表：');
    console.log('销售员账号：');
    console.log('  账号: sales001, 密码: 123456');
    console.log('  账号: sales002, 密码: 123456');
    console.log('\n区域仓库管理员账号：');
    console.log('  账号: regional001, 密码: 123456');
    console.log('  账号: regional002, 密码: 123456');
    console.log('\n总仓库管理员账号：');
    console.log('  账号: central001, 密码: 123456');
    console.log('  账号: central002, 密码: 123456');
    
    // 关闭数据库连接
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ 初始化失败:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

// 运行初始化
initUsers();




