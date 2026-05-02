/**
 * Seed script to create an Admin user.
 * 
 * Usage:  node src/seed-admin.js
 *
 * This creates an admin account if one doesn't already exist.
 * Edit the credentials below before running.
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const User = require('./models/user.model');

const ADMIN = {
  name: 'Admin User',
  email: 'admin@taskflow.com',
  password: 'admin@1234',
  role: 'ADMIN',
};

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const existing = await User.findOne({ email: ADMIN.email });
    if (existing) {
      console.log(`⚠️  Admin already exists: ${existing.email} (role: ${existing.role})`);
    } else {
      const user = await User.create(ADMIN);
      console.log(`🎉 Admin created successfully!`);
      console.log(`   Name:     ${user.name}`);
      console.log(`   Email:    ${user.email}`);
      console.log(`   Password: ${ADMIN.password}`);
      console.log(`   Role:     ${user.role}`);
    }
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await mongoose.connection.close();
    console.log('👋 Done.');
  }
}

seed();
