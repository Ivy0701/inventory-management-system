import bcrypt from 'bcryptjs';
import User from '../models/User.js';

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
  // 仓库管理员账号
  {
    account: 'warehouse001',
    password: '123456',
    name: '仓库管理员1',
    role: 'warehouse'
  },
  {
    account: 'warehouse002',
    password: '123456',
    name: '仓库管理员2',
    role: 'warehouse'
  }
];

// 自动初始化预设账号（静默运行，不退出进程）
export const initDefaultUsers = async () => {
  try {
    // 创建每个预设账号（如果不存在）
    for (const userData of defaultUsers) {
      const { account, password, name, role } = userData;
      
      // 检查账号是否已存在
      const existingUser = await User.findOne({ account });
      
      if (existingUser) {
        continue; // 已存在，跳过
      }
      
      // 加密密码
      const passwordHash = await bcrypt.hash(password, 10);
      
      // 创建用户
      await User.create({
        account,
        passwordHash,
        name,
        role
      });
      
      console.log(`✅ 自动创建预设账号: ${account} (${name}) - 角色: ${role}`);
    }
  } catch (error) {
    // 静默处理错误，不影响服务器启动
    console.error('⚠️  初始化预设账号时出错（不影响运行）:', error.message);
  }
};




