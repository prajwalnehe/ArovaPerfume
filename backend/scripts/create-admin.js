import { configDotenv } from 'dotenv';
import connectDB from '../config/DataBaseConnection.js';
import User from '../models/User.js';
import bcrypt from 'bcryptjs';

async function createAdmin() {
  try {
    configDotenv();
    await connectDB(process.env.MONGODB_URI || '');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@arova.com' });
    if (existingAdmin) {
      console.log('Admin user already exists!');
      process.exit(0);
    }

    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 12);
    const admin = new User({
      name: 'Admin User',
      email: 'admin@arova.com',
      password: hashedPassword,
      isAdmin: true,
    });

    await admin.save();
    console.log('✅ Admin user created successfully!');
    console.log('📧 Email: admin@arova.com');
    console.log('🔑 Password: admin123');
    console.log('🔗 You can now login to the admin panel!');
    
    process.exit(0);
  } catch (e) {
    console.error('❌ Error creating admin:', e?.message || e);
    process.exit(1);
  }
}

createAdmin();
