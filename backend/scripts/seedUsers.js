require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');

const seedUsers = async () => {
  try {
    // 1) Verify presence of required credentials in environment
    const superAdminName = process.env.SUPER_ADMIN_NAME;
    const superAdminEmail = process.env.SUPER_ADMIN_EMAIL;
    const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD;
    const adminName = process.env.ADMIN_NAME;
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (
      !superAdminName ||
      !superAdminEmail ||
      !superAdminPassword ||
      !adminName ||
      !adminEmail ||
      !adminPassword
    ) {
      console.error('Seeding Error: Missing one or more required environment variables (names, emails, or passwords).');
      process.exit(1);
    }

    // 2) Establish database connection
    await connectDB();

    // 3) Seed Super Admin user if not existing
    const superAdminExists = await User.findOne({ email: superAdminEmail.toLowerCase() });
    if (superAdminExists) {
      console.log(`Super Admin (${superAdminEmail}) already exists. Seeding skipped.`);
    } else {
      const newSuperAdmin = new User({
        name: superAdminName,
        email: superAdminEmail,
        password: superAdminPassword, // Saved plainly, model pre-save hook handles hashing
        role: 'SUPER_ADMIN',
        isActive: true,
        isVerified: true
      });
      await newSuperAdmin.save();
      console.log(`Successfully seeded Super Admin user: ${superAdminEmail}`);
    }

    // 4) Seed Standard Admin user if not existing
    const adminExists = await User.findOne({ email: adminEmail.toLowerCase() });
    if (adminExists) {
      console.log(`Standard Admin (${adminEmail}) already exists. Seeding skipped.`);
    } else {
      const newAdmin = new User({
        name: adminName,
        email: adminEmail,
        password: adminPassword, // Saved plainly, model pre-save hook handles hashing
        role: 'ADMIN',
        isActive: true,
        isVerified: true
      });
      await newAdmin.save();
      console.log(`Successfully seeded Standard Admin user: ${adminEmail}`);
    }
  } catch (error) {
    console.error(`Database seeding failed: ${error.message}`);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed.');
    process.exit(0);
  }
};

seedUsers();
