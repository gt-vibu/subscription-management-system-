require('dotenv').config();
const connectDB = require('../config/db');
const userService = require('../services/userService');
const mongoose = require('mongoose');

const run = async () => {
  await connectDB();
  
  console.log('--- TESTING ALL ---');
  const all = await userService.getUsers('', 1, 10, 'ALL');
  console.log('Total:', all.total);
  console.log('Roles found:', all.users.map(u => u.role));

  console.log('--- TESTING USER ---');
  const users = await userService.getUsers('', 1, 10, 'USER');
  console.log('Total:', users.total);
  console.log('Roles found:', users.users.map(u => u.role));

  console.log('--- TESTING ADMIN ---');
  const admins = await userService.getUsers('', 1, 10, 'ADMIN');
  console.log('Total:', admins.total);
  console.log('Roles found:', admins.users.map(u => u.role));

  console.log('--- TESTING SUPER_ADMIN ---');
  const superadmins = await userService.getUsers('', 1, 10, 'SUPER_ADMIN');
  console.log('Total:', superadmins.total);
  console.log('Roles found:', superadmins.users.map(u => u.role));

  await mongoose.disconnect();
};

run().catch(console.error);
