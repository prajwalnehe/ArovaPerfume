import { configDotenv } from 'dotenv';
import connectDB from '../config/DataBaseConnection.js';
import User from '../models/User.js';

async function fixAdmin() {
  try {
    configDotenv();
    await connectDB(process.env.MONGODB_URI || '');

    // Delete existing admin user
    await User.deleteOne({ email: 'admin@arova.com' });
    console.log('🗑️ Deleted existing admin user');

    // Create new admin user with correct password field
    const passwordHash = await User.hashPassword('admin123');
    const admin = new User({
      name: 'Admin User',
      email: 'admin@arova.com',
      passwordHash: passwordHash,
      isAdmin: true,
      provider: 'local',
    });

    await admin.save();
    console.log('✅ Admin user created successfully!');
    console.log('📧 Email: admin@arova.com');
    console.log('🔑 Password: admin123');
    
    // Test password
    const testUser = await User.findOne({ email: 'admin@arova.com' });
    const isValid = await testUser.comparePassword('admin123');
    console.log('🔐 Password test:', isValid ? '✅ PASS' : '❌ FAIL');
    
    process.exit(0);
  } catch (e) {
    console.error('❌ Error:', e?.message || e);
    process.exit(1);
  }
}

fixAdmin();
