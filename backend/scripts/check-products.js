import { configDotenv } from 'dotenv';
import connectDB from '../config/DataBaseConnection.js';
import { Product } from '../models/Product.js';

async function checkProducts() {
  try {
    configDotenv();
    await connectDB(process.env.MONGODB_URI || '');
    
    const products = await Product.find({});
    console.log('📦 Total products found:', products.length);
    if (products.length > 0) {
      console.log('📝 First product title:', products[0].title || products[0].name || 'No title');
      console.log('💰 First product price:', products[0].pricing?.mrp || products[0].mrp || 'No price');
    } else {
      console.log('❌ No products found in database');
      console.log('💡 Creating sample products...');
      
      // Create sample products
      const sampleProducts = [
        {
          title: 'Sample Product 1',
          name: 'Sample Product 1',
          description: 'This is a sample product',
          category: 'electronics',
          pricing: {
            mrp: 999,
            salePrice: 799,
            discountPercent: 20
          },
          images: {
            image1: 'https://via.placeholder.com/300x300'
          }
        },
        {
          title: 'Sample Product 2',
          name: 'Sample Product 2',
          description: 'This is another sample product',
          category: 'clothing',
          pricing: {
            mrp: 1999,
            salePrice: 1499,
            discountPercent: 25
          },
          images: {
            image1: 'https://via.placeholder.com/300x300'
          }
        }
      ];
      
      await Product.insertMany(sampleProducts);
      console.log('✅ Created 2 sample products');
    }
    process.exit(0);
  } catch (e) {
    console.error('❌ Error:', e.message);
    process.exit(1);
  }
}

checkProducts();
