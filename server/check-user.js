import mongoose from 'mongoose';
import User from './models/User.js';
import dotenv from 'dotenv';

dotenv.config();

const checkUser = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sdszk');
    console.log('Connected to MongoDB');
    
    const user = await User.findOne({ username: 'admin' }).select('+password');
    
    if (user) {
      console.log('Found user:', {
        username: user.username,
        hasPassword: !!user.password,
        passwordLength: user.password ? user.password.length : 0,
        role: user.role,
        active: user.active,
        isActive: user.isActive
      });
      
      // 测试密码验证
      const isPasswordCorrect = await user.correctPassword('Admin123456', user.password);
      console.log('Password verification result:', isPasswordCorrect);
    } else {
      console.log('No admin user found');
    }
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

checkUser();