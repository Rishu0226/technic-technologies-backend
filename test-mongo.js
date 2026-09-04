const mongoose = require('mongoose');
async function testConnection() {
  try {
    console.log('Testing 0.0.0.0...');
    await mongoose.connect('mongodb://0.0.0.0:27017/technictechnologies', { serverSelectionTimeoutMS: 2000 });
    console.log('Connected via 0.0.0.0!');
    process.exit(0);
  } catch (e) {
    console.log('0.0.0.0 failed:', e.message);
    process.exit(1);
  }
}
testConnection();
