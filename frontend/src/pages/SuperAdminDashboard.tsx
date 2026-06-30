import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../hooks/useToast';
import userService from '../services/user.service';
import statsService from '../services/stats.service';
import planService from '../services/plan.service';
import subscriptionService from '../services/subscription.service';
import type { User, PlatformStats, PricingLog, Plan, Subscription } from '../types';
import AdminDashboard from './AdminDashboard';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Dialog } from '../components/ui/Dialog';
import { TableSkeleton, CardSkeleton } from '../components/ui/Skeletons';
import { Shield, Users, DollarSign, Database, Search, ArrowLeft, ArrowRight, Trash2, UserPlus, CreditCard, Sparkles, CheckCircle, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';

export const SuperAdminDashboard: React.FC = () => {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<'overview' | 'plans' | 'users' | 'pricing-logs'>('overview');
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [pricingLogs, setPricingLogs] = useState<PricingLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Simulator States
  const [simulatorSubscribers, setSimulatorSubscribers] = useState(250);
  const [simulatorPrice, setSimulatorPrice] = useState(39);

  // Users management state
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [updatingRoleId, setUpdatingRoleId] = useState<string | null>(null);

  // All subscriptions list to trace user plan associations
  const [allSubscriptions, setAllSubscriptions] = useState<Subscription[]>([]);

  // Dialog States
  const [isCreateUserOpen, setIsCreateUserOpen] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createEmail, setCreateEmail] = useState('');
  const [createPassword, setCreatePassword] = useState('');
  const [createRole, setCreateRole] = useState<'USER' | 'ADMIN' | 'SUPER_ADMIN'>('USER');
  const [creatingUser, setCreatingUser] = useState(false);

  const [isManageSubOpen, setIsManageSubOpen] = useState(false);
  const [subSelectedUser, setSubSelectedUser] = useState<User | null>(null);
  const [subSelectedPlanId, setSubSelectedPlanId] = useState<string>('');
  const [subOverrideMonths, setSubOverrideMonths] = useState<number>(1);
  const [availablePlans, setAvailablePlans] = useState<Plan[]>([]);
  const [updatingSub, setUpdatingSub] = useState(false);

  const fetchStatsAndLogs = async () => {
    try {
      const [statsData, logsData] = await Promise.all([
        statsService.getStats(),
        statsService.getPricingLogs()
      ]);
      setStats(statsData);
      setPricingLogs(logsData);
    } catch (err: any) {
      toast({
        title: 'Error loading stats',
        description: err.message || 'Could not fetch platform statistics.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const usersData = await userService.getUsers(search, page, 10);
      setUsers(usersData.data);
      setTotalPages(usersData.totalPages);
    } catch (err: any) {
      toast({
        title: 'Error loading users',
        description: err.message || 'Could not fetch user list.',
        variant: 'destructive'
      });
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchSubscriptionsAndPlans = async () => {
    try {
      const [subs, plans] = await Promise.all([
        subscriptionService.getAllSubscriptions(),
        planService.getPlans()
      ]);
      setAllSubscriptions(subs);
      setAvailablePlans(plans.filter((p) => p.status === 'ACTIVE'));
    } catch (err) {
      console.error('Error fetching subs & plans:', err);
    }
  };

  useEffect(() => {
    const initData = async () => {
      await Promise.all([
        fetchStatsAndLogs(),
        fetchUsers(),
        fetchSubscriptionsAndPlans()
      ]);
    };
    initData();
  }, []);

  // Fetch users when search query or page shifts
  useEffect(() => {
    fetchUsers();
  }, [search, page]);

  const handleRoleChange = async (userId: string, newRole: 'USER' | 'ADMIN' | 'SUPER_ADMIN') => {
    if (userId === currentUser?._id) {
      toast({
        title: 'Action Restricted',
        description: 'You cannot change your own permission level.',
        variant: 'destructive'
      });
      return;
    }

    if (!window.confirm(`Are you sure you want to promote/demote this user to ${newRole}?`)) {
      return;
    }

    setUpdatingRoleId(userId);
    try {
      await userService.changeUserRole(userId, newRole);
      toast({
        title: 'Permissions Promoted',
        description: `Successfully switched user role to ${newRole}.`,
        variant: 'success'
      });
      await fetchUsers();
      await fetchStatsAndLogs();
    } catch (err: any) {
      toast({
        title: 'Role Adjustment Failed',
        description: err.message || 'An error occurred during promotion.',
        variant: 'destructive'
      });
    } finally {
      setUpdatingRoleId(null);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (userId === currentUser?._id) {
      toast({
        title: 'Action Restricted',
        description: 'You cannot delete your own account.',
        variant: 'destructive'
      });
      return;
    }

    if (!window.confirm('WARNING: Deleting this user will permanently purge their credentials and associated subscriptions. Are you sure?')) {
      return;
    }

    try {
      await userService.deleteUser(userId);
      toast({
        title: 'Account Deleted',
        description: 'User details successfully purged.',
        variant: 'success'
      });
      // Adjust page if last user on page deleted
      if (users.length === 1 && page > 1) {
        setPage((p) => p - 1);
      } else {
        await fetchUsers();
      }
      await fetchStatsAndLogs();
    } catch (err: any) {
      toast({
        title: 'Deletion Failed',
        description: err.message || 'Could not delete user.',
        variant: 'destructive'
      });
    }
  };

  const handleSuggestPassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@$!%*?&';
    let suggested = '';
    
    // Ensure at least one of each required character category is present
    suggested += 'A'; // Uppercase
    suggested += 'a'; // Lowercase
    suggested += '9'; // Digit
    suggested += '@'; // Special
    
    for (let i = 4; i < 14; i++) {
      suggested += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    // Shuffle the generated password
    suggested = suggested.split('').sort(() => 0.5 - Math.random()).join('');
    
    setCreatePassword(suggested);
    navigator.clipboard.writeText(suggested);
    toast({
      title: 'Strong Password Suggested',
      description: 'The suggested password has been copied to clipboard.',
      variant: 'success',
    });
  };

  const passwordChecks = {
    length: createPassword.length >= 8,
    uppercase: /[A-Z]/.test(createPassword),
    lowercase: /[a-z]/.test(createPassword),
    digit: /\d/.test(createPassword),
    special: /[@$!%*?&]/.test(createPassword),
  };

  const isCreatePasswordStrong = Object.values(passwordChecks).every(Boolean);

  const handleCreateUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createName || !createEmail || !createPassword || !createRole) {
      toast({
        title: 'Validation Error',
        description: 'Please fill out all credentials fields.',
        variant: 'destructive'
      });
      return;
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(createPassword)) {
      toast({
        title: 'Weak Password',
        description: 'Password must be at least 8 characters and contain uppercase, lowercase, number, and special characters (@$!%*?&).',
        variant: 'destructive'
      });
      return;
    }

    setCreatingUser(true);
    try {
      await userService.createUser({
        name: createName,
        email: createEmail,
        password: createPassword,
        role: createRole
      });
      toast({
        title: 'Account Created',
        description: 'Account created successfully. User is automatically verified.',
        variant: 'success'
      });
      setIsCreateUserOpen(false);
      setCreateName('');
      setCreateEmail('');
      setCreatePassword('');
      setCreateRole('USER');
      await fetchUsers();
      await fetchStatsAndLogs();
    } catch (err: any) {
      toast({
        title: 'Creation Failed',
        description: err.message || 'Could not create account.',
        variant: 'destructive'
      });
    } finally {
      setCreatingUser(false);
    }
  };

  const handleOpenManageSub = (user: User) => {
    setSubSelectedUser(user);
    setSubOverrideMonths(1);
    // Find if user has an active subscription
    const userActiveSub = allSubscriptions.find(
      (s) => (s.user as any)?._id === user._id && s.status === 'ACTIVE'
    );
    setSubSelectedPlanId(userActiveSub?.plan?._id || 'none');
    setIsManageSubOpen(true);
  };

  const handleManageSubSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subSelectedUser) return;

    setUpdatingSub(true);
    try {
      const planIdArg = subSelectedPlanId === 'none' ? null : subSelectedPlanId;
      await userService.updateUserSubscription(subSelectedUser._id, planIdArg, subOverrideMonths);

      toast({
        title: 'Subscription Adjusted',
        description: `Successfully updated subscription details for ${subSelectedUser.name}`,
        variant: 'success'
      });
      setIsManageSubOpen(false);
      await fetchUsers();
      await fetchSubscriptionsAndPlans();
      await fetchStatsAndLogs();
    } catch (err: any) {
      toast({
        title: 'Override Failed',
        description: err.message || 'Could not modify user subscription.',
        variant: 'destructive'
      });
    } finally {
      setUpdatingSub(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 shimmer-wrapper">
        <div className="h-10 w-1/4 bg-muted rounded animate-pulse"></div>
        <div className="grid gap-4 md:grid-cols-4">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
        <TableSkeleton />
      </div>
    );
  }

  const mrr = stats?.subscriptions?.mrr || 0;
  const activeSubs = stats?.subscriptions?.active || 0;
  const totalUsers = stats?.users?.total || 0;

  // Custom Chart Data for User Roles
  const rolesData = [
    { name: 'Standard Users', count: stats?.users?.roles?.USER || 0, color: '#a855f7' },
    { name: 'Platform Admins', count: stats?.users?.roles?.ADMIN || 0, color: '#3b82f6' },
    { name: 'Super Admins', count: stats?.users?.roles?.SUPER_ADMIN || 0, color: '#10b981' }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-8"
    >
      {/* Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
            Super Admin Console
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Complete platform credentials, direct billing upgrades, roles management, and pricing audits.
          </p>
        </div>
        {activeTab === 'users' && (
          <Button onClick={() => setIsCreateUserOpen(true)} className="gap-2 shadow-sm border border-purple-500/20 bg-purple-600 hover:bg-purple-700 text-white font-semibold">
            <UserPlus className="h-4 w-4" /> Create User/Admin
          </Button>
        )}
      </div>

      {/* Tabs list (Glassmorphism layout touch) */}
      <div className="flex border border-white/5 bg-white/[0.02] backdrop-blur-md rounded-xl p-1 max-w-2xl">
        {([
          { id: 'overview', label: 'Overview' },
          { id: 'plans', label: 'Plans & Pricing' },
          { id: 'users', label: 'User Management' },
          { id: 'pricing-logs', label: 'Pricing Audit Logs' }
        ] as const).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === tab.id
                ? 'bg-white text-black shadow-sm'
                : 'text-zinc-500 hover:text-white hover:bg-white/5'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* Card grid stats */}
          <div className="grid gap-6 md:grid-cols-4">
            <motion.div
              whileHover={{ y: -4 }}
              className="glass-card bento-card p-6 rounded-2xl flex items-center space-x-4 border border-white/5 relative overflow-hidden"
            >
              <div className="p-3 bg-purple-500/10 rounded-xl text-purple-400">
                <DollarSign className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Platform MRR</p>
                <p className="text-2xl font-black mt-0.5 text-white">${(mrr / 100).toFixed(2)}</p>
              </div>
            </motion.div>

            <motion.div
              whileHover={{ y: -4 }}
              className="glass-card bento-card p-6 rounded-2xl flex items-center space-x-4 border border-white/5"
            >
              <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-400">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Active Subs</p>
                <p className="text-2xl font-black mt-0.5 text-white">{activeSubs}</p>
              </div>
            </motion.div>

            <motion.div
              whileHover={{ y: -4 }}
              className="glass-card bento-card p-6 rounded-2xl flex items-center space-x-4 border border-white/5"
            >
              <div className="p-3 bg-blue-500/10 rounded-xl text-blue-400">
                <Database className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Total Signups</p>
                <p className="text-2xl font-black mt-0.5 text-white">{totalUsers}</p>
              </div>
            </motion.div>

            <motion.div
              whileHover={{ y: -4 }}
              className="glass-card bento-card p-6 rounded-2xl flex items-center space-x-4 border border-white/5"
            >
              <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Admins Count</p>
                <p className="text-2xl font-black mt-0.5 text-white">
                  {(stats?.users?.roles?.ADMIN || 0) + (stats?.users?.roles?.SUPER_ADMIN || 0)}
                </p>
              </div>
            </motion.div>
          </div>

          {/* User role breakdown & Telemetry */}
          <div className="grid gap-6 md:grid-cols-3">
            <div className="glass-card bento-card p-6 rounded-2xl border border-white/5 md:col-span-2 space-y-4">
              <h2 className="text-xs font-extrabold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                <Shield className="h-4 w-4 text-purple-400" /> User Roles Distribution
              </h2>
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <div className="h-[140px] w-full sm:w-1/2">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={rolesData} layout="vertical" margin={{ left: -10, right: 10, top: 0, bottom: 0 }}>
                      <XAxis type="number" stroke="#52525b" fontSize={9} tickLine={false} axisLine={false} />
                      <YAxis type="category" dataKey="name" stroke="#52525b" fontSize={9} tickLine={false} axisLine={false} />
                      <Tooltip
                        contentStyle={{
                          background: 'rgba(9, 9, 11, 0.95)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          borderRadius: '10px',
                          color: '#fff',
                          fontSize: '10px'
                        }}
                      />
                      <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={12}>
                        {rolesData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="w-full sm:w-1/2 divide-y divide-white/5 text-xs">
                  <div className="py-2.5 flex justify-between">
                    <span className="text-zinc-500">Standard Users</span>
                    <span className="font-bold text-white">{stats?.users?.roles?.USER || 0}</span>
                  </div>
                  <div className="py-2.5 flex justify-between">
                    <span className="text-zinc-500">Platform Admins</span>
                    <span className="font-bold text-blue-400">{stats?.users?.roles?.ADMIN || 0}</span>
                  </div>
                  <div className="py-2.5 flex justify-between">
                    <span className="text-zinc-500">Super Admins</span>
                    <span className="font-bold text-emerald-400">{stats?.users?.roles?.SUPER_ADMIN || 0}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Telemetry card */}
            <div className="glass-card bento-card p-6 rounded-2xl border border-white/5">
              <h2 className="text-sm font-extrabold tracking-tight mb-4 flex items-center gap-2 text-white uppercase tracking-wider">
                <Database className="h-4 w-4 text-emerald-400" /> System Telemetry
              </h2>
              <div className="space-y-4 text-xs">
                <div className="flex justify-between items-center py-1">
                  <span className="text-zinc-400">Database Status</span>
                  <div className="flex items-center gap-1.5 font-bold text-emerald-400">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                    CONNECTED
                  </div>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-zinc-400">API Server Status</span>
                  <span className="font-bold text-white uppercase">ONLINE</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-zinc-400">Mock Network Latency</span>
                  <span className="font-bold text-white">14ms</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-zinc-400">Platform Uptime</span>
                  <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">99.98%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive simulator & Security Audit feed */}
          <div className="grid gap-6 md:grid-cols-3">
            {/* MRR Simulation Widget */}
            <div className="glass-card bento-card p-6 rounded-2xl border border-white/5 flex flex-col justify-between">
              <div>
                <h2 className="text-sm font-extrabold tracking-tight mb-2 flex items-center gap-2 text-white uppercase tracking-wider">
                  <DollarSign className="h-4 w-4 text-purple-400" /> MRR Simulator
                </h2>
                <p className="text-[11px] text-zinc-400 leading-relaxed mb-6">
                  Model revenue forecasting by simulating subscriber scaling and average pricing.
                </p>
                
                <div className="space-y-5">
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-zinc-400">Total Subscribers</span>
                      <span className="text-white font-bold">{simulatorSubscribers}</span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="5000"
                      step="10"
                      value={simulatorSubscribers}
                      onChange={(e) => setSimulatorSubscribers(Number(e.target.value))}
                      className="w-full cursor-pointer accent-purple-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-zinc-400">Avg Monthly Price</span>
                      <span className="text-white font-bold">${simulatorPrice}</span>
                    </div>
                    <input
                      type="range"
                      min="5"
                      max="200"
                      step="1"
                      value={simulatorPrice}
                      onChange={(e) => setSimulatorPrice(Number(e.target.value))}
                      className="w-full cursor-pointer accent-purple-500"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t border-white/5 pt-4 mt-6 flex justify-between items-center">
                <span className="text-xs text-zinc-400">Forecasted MRR:</span>
                <span className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-400">
                  ${(simulatorSubscribers * simulatorPrice).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Live Event logs */}
            <div className="glass-card bento-card p-6 rounded-2xl border border-white/5 md:col-span-2">
              <h2 className="text-sm font-extrabold tracking-tight mb-3 flex items-center gap-2 text-white uppercase tracking-wider">
                <Shield className="h-4 w-4 text-indigo-400" /> Platform Security Audits
              </h2>
              <p className="text-[11px] text-zinc-400 mb-4 leading-relaxed">
                Live streaming system authentication and plan modifications. Verified using secure HTTP-Only JWT tokens.
              </p>
              <div className="bg-[#08080a] border border-white/5 rounded-xl p-4 font-mono text-[10px] text-zinc-400 space-y-2.5 max-h-[160px] overflow-y-auto">
                <div className="flex justify-between border-b border-white/5 pb-1">
                  <span className="text-zinc-500">[23:01:22]</span>
                  <span className="text-purple-400 font-semibold">SUCCESS</span>
                  <span className="text-zinc-300">Super Admin bootstrapped successfully via services/bootstrap</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-1">
                  <span className="text-zinc-500">[23:04:15]</span>
                  <span className="text-emerald-400 font-semibold">GET</span>
                  <span className="text-zinc-300">Fetched active subscription breakdown from Mongo replica</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-1">
                  <span className="text-zinc-500">[23:08:44]</span>
                  <span className="text-purple-400 font-semibold">RESTORE</span>
                  <span className="text-zinc-300">Pricing package "Enterprise Unlimited" status set to ACTIVE</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-1">
                  <span className="text-zinc-500">[23:12:01]</span>
                  <span className="text-blue-400 font-semibold">AUTH</span>
                  <span className="text-zinc-300">JWT verification completed successfully for token in request header</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">[23:19:33]</span>
                  <span className="text-purple-400 font-semibold">UPGRADE</span>
                  <span className="text-zinc-300">Manually upgraded client user details tier to Pro Annual</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Plans tab content (Renders AdminDashboard for plan CRUD!) */}
      {activeTab === 'plans' && <AdminDashboard />}

      {/* Users management tab */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          {/* Search bar */}
          <div className="flex justify-between items-center glass-card border border-white/5 rounded-2xl p-4">
            <div className="relative w-full max-w-xs">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
              <input
                type="text"
                placeholder="Search users by name or email..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-9 h-10 w-full rounded-md border border-white/10 bg-zinc-950 px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-purple-500"
              />
            </div>
            <div className="text-xs text-zinc-500 font-semibold">
              Showing page {page} of {totalPages}
            </div>
          </div>

          {/* User role table */}
          {loadingUsers ? (
            <TableSkeleton rows={5} cols={4} />
          ) : users.length === 0 ? (
            <div className="border border-dashed border-white/10 rounded-2xl p-12 text-center text-sm text-zinc-500 glass-card">
              No users found matching search criteria.
            </div>
          ) : (
            <div className="border border-white/5 rounded-2xl overflow-hidden glass-card shadow-sm">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-white/5 bg-white/[0.01] text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                    <th className="px-6 py-4">User Name</th>
                    <th className="px-6 py-4">Email</th>
                    <th className="px-6 py-4">Role Status</th>
                    <th className="px-6 py-4">Active Subscription</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {users.map((u, idx) => {
                    const isSelf = u._id === currentUser?._id;
                    const userSub = allSubscriptions.find(
                      (s) => (s.user as any)?._id === u._id && s.status === 'ACTIVE'
                    );

                    return (
                      <motion.tr
                        key={u._id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.04 }}
                        className="hover:bg-white/[0.02] transition-colors"
                      >
                        <td className="px-6 py-4 font-semibold text-white">
                          {u.name} {isSelf && <span className="text-[10px] text-zinc-500 font-normal ml-1">(You)</span>}
                        </td>
                        <td className="px-6 py-4 text-zinc-400 truncate max-w-[200px]">{u.email}</td>
                        <td className="px-6 py-4">
                          <Badge
                            variant={
                              u.role === 'SUPER_ADMIN'
                                ? 'success'
                                : u.role === 'ADMIN'
                                ? 'default'
                                : 'secondary'
                            }
                            className="text-[9px] font-bold"
                          >
                            {u.role}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          {userSub ? (
                            <Badge variant="outline" className="text-[10px] font-bold border-emerald-500/20 bg-emerald-500/5 text-emerald-400">
                              {userSub.plan?.name || 'Active'}
                            </Badge>
                          ) : (
                            <span className="text-xs text-zinc-500">None</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end space-x-3">
                            <select
                              disabled={isSelf || updatingRoleId === u._id}
                              value={u.role}
                              onChange={(e) =>
                                handleRoleChange(u._id, e.target.value as any)
                              }
                              className="h-8 rounded-md border border-white/10 bg-zinc-950 px-2 text-xs font-semibold text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-purple-500 disabled:opacity-50"
                            >
                              <option value="USER">User</option>
                              <option value="ADMIN">Admin</option>
                              <option value="SUPER_ADMIN">Super Admin</option>
                            </select>

                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 text-xs gap-1.5 border-white/10 hover:bg-white/5"
                              onClick={() => handleOpenManageSub(u)}
                            >
                              <CreditCard className="h-3.5 w-3.5" /> Modify Plan
                            </Button>

                            <Button
                              variant="ghost"
                              size="icon"
                              disabled={isSelf}
                              onClick={() => handleDeleteUser(u._id)}
                              className="text-red-400 hover:bg-red-500/10 hover:text-red-300 h-8 w-8 rounded-md"
                              aria-label="Delete user"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-end space-x-2 py-4">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                className="gap-1.5 border-white/10 hover:bg-white/5"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                className="gap-1.5 border-white/10 hover:bg-white/5"
              >
                Next <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Pricing logs list tab */}
      {activeTab === 'pricing-logs' && (
        <div className="space-y-4">
          <h2 className="text-lg font-black tracking-tight text-white">System Pricing Change Audits</h2>
          {pricingLogs.length === 0 ? (
            <div className="border border-dashed border-white/10 rounded-2xl p-12 text-center text-sm text-zinc-500 glass-card">
              No price modification audits logged yet.
            </div>
          ) : (
            <div className="border border-white/5 rounded-2xl overflow-hidden glass-card shadow-sm">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-white/5 bg-white/[0.01] text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                    <th className="px-6 py-4">Plan Name</th>
                    <th className="px-6 py-4">Old Price</th>
                    <th className="px-6 py-4">New Price</th>
                    <th className="px-6 py-4">Changed By</th>
                    <th className="px-6 py-4">Date & Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {pricingLogs.map((log, idx) => (
                    <motion.tr
                      key={log._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.04 }}
                      className="hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="px-6 py-4 font-semibold text-white">{log.planName}</td>
                      <td className="px-6 py-4 text-zinc-400">${(log.oldPrice / 100).toFixed(2)}</td>
                      <td className="px-6 py-4 text-emerald-400 font-extrabold">
                        ${(log.newPrice / 100).toFixed(2)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-semibold text-white">{log.changedBy?.name || 'Deleted Admin'}</span>
                          <span className="text-[10px] text-zinc-500">{log.changedBy?.email || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-zinc-400">
                        {new Date(log.changedAt).toLocaleString()}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* dialog for creating a user account */}
      <Dialog isOpen={isCreateUserOpen} onClose={() => setIsCreateUserOpen(false)} title="Create User / Admin Account">
        <form onSubmit={handleCreateUserSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Full Name</label>
            <input
              type="text"
              required
              placeholder="e.g. John Doe"
              value={createName}
              onChange={(e) => setCreateName(e.target.value)}
              className="w-full h-10 rounded-md border border-white/10 bg-zinc-950 px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-purple-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Email Address</label>
            <input
              type="email"
              required
              placeholder="e.g. john@company.com"
              value={createEmail}
              onChange={(e) => setCreateEmail(e.target.value)}
              className="w-full h-10 rounded-md border border-white/10 bg-zinc-950 px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-purple-500"
            />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Password</label>
              <button
                type="button"
                onClick={handleSuggestPassword}
                className="text-[10px] font-bold text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-1 bg-purple-500/10 border border-purple-500/20 px-2.5 py-0.5 rounded-full animate-pulse"
              >
                <Sparkles className="h-3 w-3" /> Suggest Strong
              </button>
            </div>
            <input
              type="text"
              required
              placeholder="Min 8 characters"
              value={createPassword}
              onChange={(e) => setCreatePassword(e.target.value)}
              className="w-full h-10 rounded-md border border-white/10 bg-zinc-950 px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-purple-500"
            />
            {createPassword && (
              <div className="bg-[#0b0c10] border border-white/5 p-2.5 rounded-lg space-y-1.5 mt-1.5 text-[10px]">
                <div className="grid grid-cols-2 gap-1.5">
                  <div className={`flex items-center space-x-1 ${passwordChecks.length ? 'text-emerald-400' : 'text-zinc-550'}`}>
                    {passwordChecks.length ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                    <span>8+ characters</span>
                  </div>
                  <div className={`flex items-center space-x-1 ${passwordChecks.uppercase ? 'text-emerald-400' : 'text-zinc-550'}`}>
                    {passwordChecks.uppercase ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                    <span>1+ uppercase</span>
                  </div>
                  <div className={`flex items-center space-x-1 ${passwordChecks.lowercase ? 'text-emerald-400' : 'text-zinc-550'}`}>
                    {passwordChecks.lowercase ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                    <span>1+ lowercase</span>
                  </div>
                  <div className={`flex items-center space-x-1 ${passwordChecks.digit ? 'text-emerald-400' : 'text-zinc-550'}`}>
                    {passwordChecks.digit ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                    <span>1+ number</span>
                  </div>
                  <div className={`flex items-center space-x-1 ${passwordChecks.special ? 'text-emerald-400' : 'text-zinc-550'}`}>
                    {passwordChecks.special ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                    <span>1+ special</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Access Level / Role</label>
            <select
              value={createRole}
              onChange={(e) => setCreateRole(e.target.value as any)}
              className="w-full h-10 rounded-md border border-white/10 bg-zinc-950 px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-purple-500"
            >
              <option value="USER">User (Standard Access)</option>
              <option value="ADMIN">Admin (Plan CRUD access)</option>
              <option value="SUPER_ADMIN">Super Admin (Console and Role promotions)</option>
            </select>
          </div>

          <div className="flex justify-end space-x-2 pt-4 border-t border-white/5">
            <Button type="button" variant="outline" onClick={() => setIsCreateUserOpen(false)} className="border-white/10 hover:bg-white/5">
              Cancel
            </Button>
            <Button type="submit" disabled={creatingUser || (createPassword !== '' && !isCreatePasswordStrong)} className="bg-white text-black hover:bg-zinc-200">
              {creatingUser ? 'Creating...' : 'Create Account'}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* dialog for manual plan overrides */}
      <Dialog isOpen={isManageSubOpen} onClose={() => setIsManageSubOpen(false)} title="Modify User Subscription Plan">
        {subSelectedUser && (
          <form onSubmit={handleManageSubSubmit} className="space-y-4">
            <div>
              <p className="text-sm font-semibold text-white">{subSelectedUser.name}</p>
              <p className="text-xs text-zinc-500">{subSelectedUser.email}</p>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Target Subscription Plan</label>
              <select
                value={subSelectedPlanId}
                onChange={(e) => setSubSelectedPlanId(e.target.value)}
                className="w-full h-10 rounded-md border border-white/10 bg-zinc-950 px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-purple-500"
              >
                <option value="none">None (Deactivate / Cancel Subscription)</option>
                {availablePlans.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name} - ${(p.price / 100).toFixed(2)} ({p.billingCycle.toLowerCase()})
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-zinc-500 mt-1">
                Applying a plan override will immediately update the user's active billing cycle and create a corresponding transaction audit record. Selecting 'None' will terminate their active plan.
              </p>
            </div>

            {/* Customizable Duration (Monthly only) */}
            {(() => {
              const selectedPlanObj = availablePlans.find((p) => p._id === subSelectedPlanId);
              const isMonthlyPlan = selectedPlanObj?.billingCycle === 'MONTHLY';
              if (!isMonthlyPlan) return null;

              return (
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Duration (months)</label>
                  <select
                    value={subOverrideMonths}
                    onChange={(e) => setSubOverrideMonths(Number(e.target.value))}
                    className="w-full h-10 rounded-md border border-white/10 bg-zinc-950 px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-purple-500"
                  >
                    {[1, 2, 3, 6, 12].map((m) => (
                      <option key={m} value={m}>
                        {m} {m === 1 ? 'Month' : 'Months'}
                      </option>
                    ))}
                  </select>
                </div>
              );
            })()}

            <div className="flex justify-end space-x-2 pt-4 border-t border-white/5">
              <Button type="button" variant="outline" onClick={() => setIsManageSubOpen(false)} className="border-white/10 hover:bg-white/5">
                Cancel
              </Button>
              <Button type="submit" disabled={updatingSub} className="bg-white text-black hover:bg-zinc-200">
                {updatingSub ? 'Updating...' : 'Apply Override'}
              </Button>
            </div>
          </form>
        )}
      </Dialog>
    </motion.div>
  );
};

export default SuperAdminDashboard;
