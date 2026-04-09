import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/arova';

async function dropSkuIndex() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Get the products collection
    const db = mongoose.connection.db;
    const collection = db.collection('products');
    
    // List all indexes
    const indexes = await collection.indexes();
    console.log('Current indexes:', indexes.map(i => i.name));
    
    // Drop the stock.sku_1 index if it exists
    try {
      await collection.dropIndex('stock.sku_1');
      console.log('Successfully dropped stock.sku_1 index');
    } catch (err) {
      if (err.message.includes('index not found')) {
        console.log('Index stock.sku_1 does not exist');
      } else {
        console.log('Error dropping index:', err.message);
      }
    }
    
    console.log('Done!');
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

dropSkuIndex();
