const User = require('../models/User');

const bootstrapSuperAdmin = async () => {
  try {
    // Sync model indexes to drop any stale/legacy indices on MongoDB (e.g. id_1) that are not in the schema
    await User.syncIndexes();

    // 1) Bootstrap Super Admin
    const superAdminEmail = process.env.SUPER_ADMIN_EMAIL || 'superadmin@platform.com';
    const superAdminExists = await User.findOne({ email: superAdminEmail.toLowerCase() });

    if (superAdminExists) {
      console.log(`Super Admin (${superAdminEmail}) already exists. Bootstrapping skipped.`);
    } else {
      const name = process.env.SUPER_ADMIN_NAME || 'Super Admin';
      const password = process.env.SUPER_ADMIN_PASSWORD;

      if (!password) {
        console.warn('WARNING: SUPER_ADMIN_PASSWORD is not set in the environment variables. Super Admin bootstrap aborted.');
      } else {
        try {
          const newSuperAdmin = new User({
            name,
            email: superAdminEmail,
            password,
            role: 'SUPER_ADMIN',
            isActive: true,
            isVerified: true
          });
          await newSuperAdmin.save();
          console.log(`Successfully bootstrapped Super Admin: ${superAdminEmail}`);
        } catch (err) {
          console.warn(`Could not bootstrap Super Admin: ${err.message}`);
        }
      }
    }

    // 2) Bootstrap Standard Admin
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@platform.com';
    const adminExists = await User.findOne({ email: adminEmail.toLowerCase() });

    if (adminExists) {
      console.log(`Standard Admin (${adminEmail}) already exists. Bootstrapping skipped.`);
    } else {
      const adminName = process.env.ADMIN_NAME || 'Standard Admin';
      const adminPassword = process.env.ADMIN_PASSWORD;

      if (!adminPassword) {
        console.warn('WARNING: ADMIN_PASSWORD is not set in the environment variables. Admin bootstrap aborted.');
      } else {
        try {
          const newAdmin = new User({
            name: adminName,
            email: adminEmail,
            password: adminPassword,
            role: 'ADMIN',
            isActive: true,
            isVerified: true
          });
          await newAdmin.save();
          console.log(`Successfully bootstrapped Standard Admin: ${adminEmail}`);
        } catch (err) {
          console.warn(`Could not bootstrap Standard Admin: ${err.message}`);
        }
      }
    }
  } catch (error) {
    console.error(`Error during administrative user bootstrapping process: ${error.message}`);
  }
};

module.exports = bootstrapSuperAdmin;
