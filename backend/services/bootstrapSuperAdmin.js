const User = require('../models/User');

const bootstrapSuperAdmin = async () => {
  try {
    // Check if a super admin already exists
    const superAdminExists = await User.findOne({ role: 'SUPER_ADMIN' });

    if (superAdminExists) {
      console.log('Super Admin already exists. Bootstrapping skipped.');
      return;
    }

    // Retrieve bootstrap credentials from environment variables
    const name = process.env.SUPER_ADMIN_NAME || 'Super Admin';
    const email = process.env.SUPER_ADMIN_EMAIL || 'superadmin@platform.com';
    const password = process.env.SUPER_ADMIN_PASSWORD;

    if (!password) {
      console.warn('WARNING: SUPER_ADMIN_PASSWORD is not set in the environment variables. Super Admin bootstrap aborted.');
      return;
    }

    // Create the Super Admin user
    const newSuperAdmin = new User({
      name,
      email,
      password, // Password will be hashed by User pre-save hook
      role: 'SUPER_ADMIN',
      isActive: true,
      isVerified: true
    });

    await newSuperAdmin.save();
    console.log(`Successfully bootstrapped Super Admin: ${email}`);
  } catch (error) {
    console.error(`Error bootstrapping Super Admin: ${error.message}`);
  }
};

module.exports = bootstrapSuperAdmin;
