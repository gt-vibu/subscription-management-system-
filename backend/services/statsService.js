const User = require('../models/User');
const Plan = require('../models/Plan');
const Subscription = require('../models/Subscription');
const PricingLog = require('../models/PricingLog');

/**
 * Get unified statistics for admin and super admin dashboards
 */
const getPlatformStats = async () => {
  // Run queries in parallel to minimize response latency
  const [
    totalUsers,
    roleCounts,
    activeSubscriptions,
    allSubscriptionsCount,
    plans
  ] = await Promise.all([
    User.countDocuments({}),
    User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ]),
    Subscription.find({ status: 'ACTIVE' }).populate('plan'),
    Subscription.countDocuments({}),
    Plan.find({})
  ]);

  // Format role counts into a clean key-value object
  const roles = { USER: 0, ADMIN: 0, SUPER_ADMIN: 0 };
  roleCounts.forEach((group) => {
    if (roles[group._id] !== undefined) {
      roles[group._id] = group.count;
    }
  });

  // Calculate MRR (Monthly Recurring Revenue) in cents
  let mrrInCents = 0;
  const planSubscribers = {}; // Map of planId -> count

  // Initialize subscribers counts for all plans
  plans.forEach((p) => {
    planSubscribers[p._id.toString()] = {
      id: p._id,
      name: p.name,
      price: p.price,
      billingCycle: p.billingCycle,
      status: p.status,
      activeSubscribers: 0,
      monthlyRevenue: 0
    };
  });

  activeSubscriptions.forEach((sub) => {
    if (!sub.plan) return;
    const planIdStr = sub.plan._id.toString();

    // Sum up MRR contribution
    const planPrice = sub.plan.price;
    const contribution = sub.plan.billingCycle === 'ANNUAL' ? Math.round(planPrice / 12) : planPrice;
    mrrInCents += contribution;

    // Track plan subscribers count
    if (planSubscribers[planIdStr]) {
      planSubscribers[planIdStr].activeSubscribers += 1;
      planSubscribers[planIdStr].monthlyRevenue += contribution;
    }
  });

  return {
    users: {
      total: totalUsers,
      roles
    },
    subscriptions: {
      active: activeSubscriptions.length,
      total: allSubscriptionsCount,
      mrr: mrrInCents // in cents
    },
    plans: Object.values(planSubscribers)
  };
};

/**
 * Get pricing logs (Super Admin audit log)
 */
const getPricingLogs = async () => {
  return await PricingLog.find({})
    .populate('changedBy', 'name email role')
    .sort({ changedAt: -1 });
};

/**
 * Get public platform stats for landing page dashboard mockup
 */
const getPublicPlatformStats = async () => {
  const [
    totalUsers,
    activeSubscriptionsCount,
    activeSubscriptionsList,
    recentSubscriptions
  ] = await Promise.all([
    User.countDocuments({}),
    Subscription.countDocuments({ status: 'ACTIVE' }),
    Subscription.find({ status: 'ACTIVE' }).populate('plan'),
    Subscription.find({})
      .populate('user', 'name email')
      .populate('plan', 'name')
      .sort({ createdAt: -1 })
      .limit(3)
  ]);

  // Calculate MRR
  let mrrInCents = 0;
  activeSubscriptionsList.forEach((sub) => {
    if (!sub.plan) return;
    const planPrice = sub.plan.price;
    const contribution = sub.plan.billingCycle === 'ANNUAL' ? Math.round(planPrice / 12) : planPrice;
    mrrInCents += contribution;
  });

  // Format recent subscribers securely
  const recent = recentSubscriptions.map((sub) => {
    const u = sub.user;
    const obfuscateEmail = (email) => {
      if (!email) return 'N/A';
      const parts = email.split('@');
      if (parts.length !== 2) return email;
      const name = parts[0];
      const domain = parts[1];
      if (name.length <= 2) return `${name[0]}***@${domain}`;
      return `${name.substring(0, 2)}***${name[name.length - 1]}@${domain}`;
    };

    return {
      id: sub._id,
      name: u ? u.name : 'Unknown User',
      email: u ? obfuscateEmail(u.email) : 'N/A',
      created: sub.createdAt,
      status: sub.status,
      planName: sub.plan ? sub.plan.name : 'Unknown Plan'
    };
  });

  return {
    totalUsers,
    activeSubs: activeSubscriptionsCount,
    totalMRR: mrrInCents,
    recentSubscribers: recent
  };
};

module.exports = {
  getPlatformStats,
  getPricingLogs,
  getPublicPlatformStats
};
