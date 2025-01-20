const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

async function checkMongoConnection() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/church_management');
    console.log('✅ MongoDB is connected and running!');
    process.exit(0);
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error.message);
    console.log('\nPlease make sure:');
    console.log('1. MongoDB is installed on your system');
    console.log('2. MongoDB service is running');
    console.log('3. MongoDB is running on the default port (27017)');
    process.exit(1);
  }
}

checkMongoConnection(); 