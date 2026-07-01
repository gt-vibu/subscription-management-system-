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
import { motion } from 'framer-motion';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';

export const SuperAdminDashboard: React.FC = () => {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<'overview' | 'plans' | 'users' | 'pricing-logs'>('overview');
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [pricingLogs, setPricingLogs] = useState<PricingLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Users management state
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [updatingRoleId, setUpdatingRoleId] = useState<string | null>(null);

  // Sorting, filtering, pinning states
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | ''>('');
  const [pinnedUserIds, setPinnedUserIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('pinnedUserIds');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [pinNameColumn, setPinNameColumn] = useState<boolean>(false);
  const [pinActionsColumn, setPinActionsColumn] = useState<boolean>(false);
  const [subBillingCycle, setSubBillingCycle] = useState<'MONTHLY' | 'ANNUAL'>('MONTHLY');

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
      const activeRole = roleFilter === 'ALL' ? undefined : roleFilter;
      const activeSortBy = sortBy || undefined;
      const activeSortOrder = sortOrder || undefined;
      
      const usersData = await userService.getUsers(
        search, 
        page, 
        10, 
        activeRole, 
        activeSortBy, 
        activeSortOrder as any
      );
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
        fetchSubscriptionsAndPlans()
      ]);
    };
    initData();
  }, []);

  // Fetch users when search query, page, filter, or sorting shifts
  useEffect(() => {
    fetchUsers();
  }, [search, page, roleFilter, sortBy, sortOrder]);

  const toggleRowPin = (userId: string) => {
    setPinnedUserIds((prev) => {
      const next = prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId];
      localStorage.setItem('pinnedUserIds', JSON.stringify(next));
      return next;
    });
    toast({
      title: pinnedUserIds.includes(userId) ? 'Row Unpinned' : 'Row Pinned',
      description: 'Anchor row order has been updated.',
      variant: 'success'
    });
  };

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
      await userService.changeRole(userId, newRole);
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
    setSubSelectedPlanId('none');
    setIsManageSubOpen(true);
  };

  const handleCancelUserSubscription = async (subscriptionId: string, planName: string) => {
    if (!subSelectedUser) return;
    if (!window.confirm(`Are you sure you want to cancel ${subSelectedUser.name}'s "${planName}" subscription?`)) {
      return;
    }

    setUpdatingSub(true);
    try {
      await userService.updateUserSubscription(subSelectedUser._id, null, undefined, 'cancel', subscriptionId);
      toast({
        title: 'Subscription Cancelled',
        description: `Successfully cancelled "${planName}" for ${subSelectedUser.name}.`,
        variant: 'success'
      });
      await fetchUsers();
      await fetchSubscriptionsAndPlans();
      await fetchStatsAndLogs();
    } catch (err: any) {
      toast({
        title: 'Cancellation Failed',
        description: err.message || 'Could not cancel user subscription.',
        variant: 'destructive'
      });
    } finally {
      setUpdatingSub(false);
    }
  };

  const handleAddUserSubscriptionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subSelectedUser || !subSelectedPlanId || subSelectedPlanId === 'none') {
      toast({
        title: 'Validation Error',
        description: 'Please select a plan to add.',
        variant: 'destructive'
      });
      return;
    }

    setUpdatingSub(true);
    try {
      const billingCycleToSend = subBillingCycle;
      const monthsToSend = billingCycleToSend === 'ANNUAL' ? 12 : subOverrideMonths;

      await userService.updateUserSubscription(
        subSelectedUser._id,
        subSelectedPlanId,
        monthsToSend,
        'subscribe',
        undefined,
        billingCycleToSend
      );
      toast({
        title: 'Subscription Added',
        description: `Successfully subscribed ${subSelectedUser.name} to the selected plan.`,
        variant: 'success'
      });
      setSubSelectedPlanId('none');
      setSubOverrideMonths(1);
      await fetchUsers();
      await fetchSubscriptionsAndPlans();
      await fetchStatsAndLogs();
    } catch (err: any) {
      toast({
        title: 'Subscription Action Failed',
        description: err.message || 'Could not subscribe user to plan.',
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
      className="space-y-8 text-slate-900"
    >
      {/* Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
            Super Admin Console
          </h1>
          <p className="text-slate-500 mt-1 text-sm">
            Complete platform credentials, direct billing upgrades, roles management, and pricing audits.
          </p>
        </div>
        {activeTab === 'users' && (
          <Button onClick={() => setIsCreateUserOpen(true)} className="gap-2 shadow-sm border border-indigo-500/20 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl">
            <UserPlus className="h-4 w-4" /> Create User/Admin
          </Button>
        )}
      </div>

      {/* Tabs list (Glassmorphism layout touch) */}
      <div className="flex border border-slate-200 bg-slate-100 rounded-xl p-1 max-w-2xl">
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
                ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/50'
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
              className="glass-card p-6 rounded-2xl flex items-center space-x-4 border border-slate-200 bg-white relative overflow-hidden shadow-sm"
            >
              <div className="p-3 bg-purple-50 rounded-xl text-purple-600">
                <DollarSign className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Platform MRR</p>
                <p className="text-2xl font-black mt-0.5 text-slate-900">${(mrr / 100).toFixed(2)}</p>
              </div>
            </motion.div>

            <motion.div
              whileHover={{ y: -4 }}
              className="glass-card p-6 rounded-2xl flex items-center space-x-4 border border-slate-200 bg-white shadow-sm"
            >
              <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Active Subs</p>
                <p className="text-2xl font-black mt-0.5 text-slate-900">{activeSubs}</p>
              </div>
            </motion.div>

            <motion.div
              whileHover={{ y: -4 }}
              className="glass-card p-6 rounded-2xl flex items-center space-x-4 border border-slate-200 bg-white shadow-sm"
            >
              <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
                <Database className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Total Signups</p>
                <p className="text-2xl font-black mt-0.5 text-slate-900">{totalUsers}</p>
              </div>
            </motion.div>

            <motion.div
              whileHover={{ y: -4 }}
              className="glass-card p-6 rounded-2xl flex items-center space-x-4 border border-slate-200 bg-white shadow-sm"
            >
              <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Admins Count</p>
                <p className="text-2xl font-black mt-0.5 text-slate-900">
                  {(stats?.users?.roles?.ADMIN || 0) + (stats?.users?.roles?.SUPER_ADMIN || 0)}
                </p>
              </div>
            </motion.div>
          </div>

          {/* User role breakdown & Telemetry */}
          <div className="grid gap-6 md:grid-cols-3">
            <div className="glass-card p-6 rounded-2xl border border-slate-200 bg-white shadow-sm md:col-span-2 space-y-4">
              <h2 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                <Shield className="h-4 w-4 text-indigo-600" /> User Roles Distribution
              </h2>
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <div className="h-[140px] w-full sm:w-1/2">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={rolesData} layout="vertical" margin={{ left: -10, right: 10, top: 0, bottom: 0 }}>
                      <XAxis type="number" stroke="#64748b" fontSize={9} tickLine={false} axisLine={false} />
                      <YAxis type="category" dataKey="name" stroke="#64748b" fontSize={9} tickLine={false} axisLine={false} />
                      <Tooltip
                        contentStyle={{
                          background: 'rgba(255, 255, 255, 0.95)',
                          border: '1px solid #e2e8f0',
                          borderRadius: '10px',
                          color: '#0f172a',
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
                <div className="w-full sm:w-1/2 divide-y divide-slate-100 text-xs">
                  <div className="py-2.5 flex justify-between">
                    <span className="text-slate-500">Standard Users</span>
                    <span className="font-bold text-slate-900">{stats?.users?.roles?.USER || 0}</span>
                  </div>
                  <div className="py-2.5 flex justify-between">
                    <span className="text-slate-500">Platform Admins</span>
                    <span className="font-bold text-blue-600">{stats?.users?.roles?.ADMIN || 0}</span>
                  </div>
                  <div className="py-2.5 flex justify-between">
                    <span className="text-slate-500">Super Admins</span>
                    <span className="font-bold text-emerald-600">{stats?.users?.roles?.SUPER_ADMIN || 0}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Telemetry card */}
            <div className="glass-card p-6 rounded-2xl border border-slate-200 bg-white shadow-sm">
              <h2 className="text-sm font-extrabold mb-4 flex items-center gap-2 text-slate-900 uppercase tracking-wider">
                <Database className="h-4 w-4 text-emerald-600" /> System Telemetry
              </h2>
              <div className="space-y-4 text-xs">
                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-500">Database Status</span>
                  <div className="flex items-center gap-1.5 font-bold text-emerald-600">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    CONNECTED
                  </div>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-500">API Server Status</span>
                  <span className="font-bold text-slate-900 uppercase">ONLINE</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-500">Network Latency</span>
                  <span className="font-bold text-slate-900">14ms</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-500">Platform Uptime</span>
                  <span className="font-bold text-emerald-600">99.98%</span>
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
          {/* Filters, search and pinning controls */}
          <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <div className="relative min-w-[240px]">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="pl-9 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500"
                />
              </div>

              {/* Role filter dropdown */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Role</span>
                <select
                  value={roleFilter}
                  onChange={(e) => {
                    setRoleFilter(e.target.value);
                    setPage(1);
                  }}
                  className="h-10 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500"
                >
                  <option value="ALL">All Roles</option>
                  <option value="USER">User Only</option>
                  <option value="ADMIN">Admin Only</option>
                  <option value="SUPER_ADMIN">Super Admin Only</option>
                </select>
              </div>
            </div>

            {/* Column Pinning configuration panel */}
            <div className="flex items-center gap-3 w-full md:w-auto justify-end">
              <span className="text-[10px] font-bold text-slate-550 uppercase tracking-wider">Pin Columns:</span>
              <button
                onClick={() => setPinNameColumn(!pinNameColumn)}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-all ${
                  pinNameColumn
                    ? 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {pinNameColumn ? '📌 Name Pinned' : 'Pin Name (Left)'}
              </button>
              <button
                onClick={() => setPinActionsColumn(!pinActionsColumn)}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-all ${
                  pinActionsColumn
                    ? 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {pinActionsColumn ? '📌 Actions Pinned' : 'Pin Actions (Right)'}
              </button>
            </div>
          </div>

          {/* User role table */}
          {loadingUsers ? (
            <TableSkeleton rows={5} cols={5} />
          ) : users.length === 0 ? (
            <div className="border border-dashed border-slate-200 rounded-2xl p-12 text-center text-sm text-slate-500 bg-white shadow-sm">
              No users found matching search criteria.
            </div>
          ) : (
            <div className="border border-slate-200 rounded-2xl overflow-x-auto bg-white shadow-sm relative">
              <table className="w-full text-left text-sm border-collapse min-w-[850px]">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/50 text-[10px] font-bold text-slate-500 uppercase tracking-wider select-none">
                    <th className="px-3 py-4 w-12 text-center">Pin</th>
                    <th 
                      onClick={() => {
                        if (sortBy === 'name') {
                          setSortOrder(sortOrder === 'asc' ? 'desc' : sortOrder === 'desc' ? '' : 'asc');
                          if (sortOrder === 'desc') setSortBy('');
                        } else {
                          setSortBy('name');
                          setSortOrder('asc');
                        }
                        setPage(1);
                      }}
                      className={`px-6 py-4 cursor-pointer hover:bg-slate-100/60 transition-colors ${
                        pinNameColumn 
                          ? 'sticky left-0 bg-slate-50/95 z-20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] border-r border-slate-200/60' 
                          : ''
                      }`}
                    >
                      <div className="flex items-center gap-1">
                        User Name {sortBy === 'name' ? (sortOrder === 'asc' ? '▲' : '▼') : '↕'}
                      </div>
                    </th>
                    <th 
                      onClick={() => {
                        if (sortBy === 'email') {
                          setSortOrder(sortOrder === 'asc' ? 'desc' : sortOrder === 'desc' ? '' : 'asc');
                          if (sortOrder === 'desc') setSortBy('');
                        } else {
                          setSortBy('email');
                          setSortOrder('asc');
                        }
                        setPage(1);
                      }}
                      className="px-6 py-4 cursor-pointer hover:bg-slate-100/60 transition-colors"
                    >
                      <div className="flex items-center gap-1">
                        Email Address {sortBy === 'email' ? (sortOrder === 'asc' ? '▲' : '▼') : '↕'}
                      </div>
                    </th>
                    <th 
                      onClick={() => {
                        if (sortBy === 'role') {
                          setSortOrder(sortOrder === 'asc' ? 'desc' : sortOrder === 'desc' ? '' : 'asc');
                          if (sortOrder === 'desc') setSortBy('');
                        } else {
                          setSortBy('role');
                          setSortOrder('asc');
                        }
                        setPage(1);
                      }}
                      className="px-6 py-4 cursor-pointer hover:bg-slate-100/60 transition-colors"
                    >
                      <div className="flex items-center gap-1">
                        Role Status {sortBy === 'role' ? (sortOrder === 'asc' ? '▲' : '▼') : '↕'}
                      </div>
                    </th>
                    <th className="px-6 py-4">Active Subscription</th>
                    <th 
                      className={`px-6 py-4 text-right ${
                        pinActionsColumn 
                          ? 'sticky right-0 bg-slate-50/95 z-20 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.1)] border-l border-slate-200/60' 
                          : ''
                      }`}
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {(() => {
                    const pinned = users.filter((u) => pinnedUserIds.includes(u._id));
                    const unpinned = users.filter((u) => !pinnedUserIds.includes(u._id));
                    const reordered = [...pinned, ...unpinned];

                    return reordered.map((u, idx) => {
                      const isSelf = u._id === currentUser?._id;
                      const isPinned = pinnedUserIds.includes(u._id);
                      const userActiveSubs = allSubscriptions.filter(
                        (s) => (s.user as any)?._id === u._id && s.status === 'ACTIVE'
                      );

                      return (
                        <motion.tr
                          key={u._id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.03 }}
                          className={`hover:bg-slate-50/50 transition-colors ${
                            isPinned ? 'bg-amber-50/30 hover:bg-amber-50/40 border-l-2 border-l-amber-500' : ''
                          }`}
                        >
                          {/* Row pin column cell */}
                          <td className="px-3 py-4 text-center">
                            <button
                              onClick={() => toggleRowPin(u._id)}
                              className={`p-1.5 rounded-lg transition-colors ${
                                isPinned
                                  ? 'text-amber-500 hover:text-amber-600 bg-amber-50'
                                  : 'text-slate-300 hover:text-slate-500 hover:bg-slate-50'
                              }`}
                              title={isPinned ? 'Unpin User' : 'Pin User to Top'}
                            >
                              📌
                            </button>
                          </td>

                          <td 
                            className={`px-6 py-4 font-semibold text-slate-900 ${
                              pinNameColumn 
                                ? `sticky left-0 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] border-r border-slate-200/60 ${
                                    isPinned ? 'bg-[#fef9eb]' : 'bg-white'
                                  }` 
                                : ''
                            }`}
                          >
                            <div className="flex items-center gap-1.5">
                              {u.name} 
                              {isSelf && <span className="text-[10px] text-slate-400 font-normal">(You)</span>}
                              {isPinned && (
                                <span className="text-[9px] bg-amber-100 text-amber-800 font-extrabold px-1 rounded">PINNED</span>
                              )}
                            </div>
                          </td>
                          
                          <td className="px-6 py-4 text-slate-500 truncate max-w-[200px]">{u.email}</td>
                          
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
                            <div className="flex flex-wrap gap-1.5 max-w-[200px]">
                              {userActiveSubs.length > 0 ? (
                                userActiveSubs.map((sub) => (
                                  <Badge
                                    key={sub._id}
                                    variant="outline"
                                    className="text-[10px] font-bold border-emerald-250 bg-emerald-50 text-emerald-700 flex items-center gap-1"
                                  >
                                    {sub.plan?.name || 'Active'}
                                    <span className="text-[9px] text-slate-400">({sub.billingCycle?.toLowerCase() || 'mo'})</span>
                                  </Badge>
                                ))
                              ) : (
                                <span className="text-xs text-slate-400">None</span>
                              )}
                            </div>
                          </td>
                          
                          <td 
                            className={`px-6 py-4 text-right ${
                              pinActionsColumn 
                                ? `sticky right-0 z-10 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.1)] border-l border-slate-200/60 ${
                                    isPinned ? 'bg-[#fef9eb]' : 'bg-white'
                                  }` 
                                : ''
                            }`}
                          >
                            <div className="flex items-center justify-end space-x-3">
                              <select
                                disabled={isSelf || updatingRoleId === u._id}
                                value={u.role}
                                onChange={(e) =>
                                  handleRoleChange(u._id, e.target.value as any)
                                }
                                className="h-8 rounded-xl border border-slate-200 bg-white px-2 text-xs font-semibold text-slate-700 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500 disabled:opacity-50"
                              >
                                <option value="USER">User</option>
                                <option value="ADMIN">Admin</option>
                                <option value="SUPER_ADMIN">Super Admin</option>
                              </select>

                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 text-xs gap-1.5 border-slate-200 hover:bg-slate-50 text-slate-700 bg-white rounded-xl"
                                onClick={() => handleOpenManageSub(u)}
                              >
                                <CreditCard className="h-3.5 w-3.5" /> Modify Plan
                              </Button>

                              <Button
                                variant="ghost"
                                size="icon"
                                disabled={isSelf}
                                onClick={() => handleDeleteUser(u._id)}
                                className="text-red-650 hover:bg-red-50 hover:text-red-700 h-8 w-8 rounded-xl"
                                aria-label="Delete user"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </motion.tr>
                      );
                    });
                  })()}
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
                className="gap-1.5 border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                className="gap-1.5 border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl"
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
          <h2 className="text-lg font-black tracking-tight text-slate-900">System Pricing Change Audits</h2>
          {pricingLogs.length === 0 ? (
            <div className="border border-dashed border-slate-200 rounded-2xl p-12 text-center text-sm text-slate-500 bg-white shadow-sm">
              No price modification audits logged yet.
            </div>
          ) : (
            <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/50 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="px-6 py-4">Plan Name</th>
                    <th className="px-6 py-4">Old Price</th>
                    <th className="px-6 py-4">New Price</th>
                    <th className="px-6 py-4">Changed By</th>
                    <th className="px-6 py-4">Date & Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {pricingLogs.map((log, idx) => (
                    <motion.tr
                      key={log._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.04 }}
                      className="hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="px-6 py-4 font-semibold text-slate-900">{log.planName}</td>
                      <td className="px-6 py-4 text-slate-500">${(log.oldPrice / 100).toFixed(2)}</td>
                      <td className="px-6 py-4 text-emerald-600 font-extrabold">
                        ${(log.newPrice / 100).toFixed(2)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-900">{log.changedBy?.name || 'Deleted Admin'}</span>
                          <span className="text-[10px] text-slate-400">{log.changedBy?.email || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-500">
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
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Full Name</label>
            <input
              type="text"
              required
              placeholder="e.g. John Doe"
              value={createName}
              onChange={(e) => setCreateName(e.target.value)}
              className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Email Address</label>
            <input
              type="email"
              required
              placeholder="e.g. john@company.com"
              value={createEmail}
              onChange={(e) => setCreateEmail(e.target.value)}
              className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500"
            />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Password</label>
              <button
                type="button"
                onClick={handleSuggestPassword}
                className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 transition-colors flex items-center gap-1 bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 rounded-full"
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
              className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500"
            />
            {createPassword && (
              <div className="bg-slate-55 border border-slate-200 p-2.5 rounded-xl space-y-1.5 mt-1.5 text-[10px]">
                <div className="grid grid-cols-2 gap-1.5">
                  <div className={`flex items-center space-x-1 ${passwordChecks.length ? 'text-emerald-600' : 'text-slate-400'}`}>
                    {passwordChecks.length ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                    <span>8+ characters</span>
                  </div>
                  <div className={`flex items-center space-x-1 ${passwordChecks.uppercase ? 'text-emerald-600' : 'text-slate-400'}`}>
                    {passwordChecks.uppercase ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                    <span>1+ uppercase</span>
                  </div>
                  <div className={`flex items-center space-x-1 ${passwordChecks.lowercase ? 'text-emerald-600' : 'text-slate-400'}`}>
                    {passwordChecks.lowercase ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                    <span>1+ lowercase</span>
                  </div>
                  <div className={`flex items-center space-x-1 ${passwordChecks.digit ? 'text-emerald-600' : 'text-slate-400'}`}>
                    {passwordChecks.digit ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                    <span>1+ number</span>
                  </div>
                  <div className={`flex items-center space-x-1 ${passwordChecks.special ? 'text-emerald-600' : 'text-slate-400'}`}>
                    {passwordChecks.special ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                    <span>1+ special</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Access Level / Role</label>
            <select
              value={createRole}
              onChange={(e) => setCreateRole(e.target.value as any)}
              className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500"
            >
              <option value="USER">User (Standard Access)</option>
              <option value="ADMIN">Admin (Plan CRUD access)</option>
              <option value="SUPER_ADMIN">Super Admin (Console and Role promotions)</option>
            </select>
          </div>

          <div className="flex justify-end space-x-2 pt-4 border-t border-slate-200">
            <Button type="button" variant="outline" onClick={() => setIsCreateUserOpen(false)} className="border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl">
              Cancel
            </Button>
            <Button type="submit" disabled={creatingUser || (createPassword !== '' && !isCreatePasswordStrong)} className="bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl">
              {creatingUser ? 'Creating...' : 'Create Account'}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* dialog for manual plan overrides */}
      <Dialog isOpen={isManageSubOpen} onClose={() => setIsManageSubOpen(false)} title="Manage User Subscriptions">
        {subSelectedUser && (
          <div className="space-y-6">
            <div>
              <p className="text-sm font-semibold text-slate-900">{subSelectedUser.name}</p>
              <p className="text-xs text-slate-500">{subSelectedUser.email}</p>
            </div>

            {/* Active Subscriptions List */}
            <div className="space-y-3">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Active Subscriptions</label>
              {(() => {
                const activeSubs = allSubscriptions.filter(
                  (s) => (s.user as any)?._id === subSelectedUser._id && s.status === 'ACTIVE'
                );

                if (activeSubs.length === 0) {
                  return (
                    <div className="text-xs text-slate-500 border border-dashed border-slate-200 rounded-xl p-4 text-center bg-slate-50">
                      No active subscriptions.
                    </div>
                  );
                }

                return (
                  <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                    {activeSubs.map((sub) => (
                      <div key={sub._id} className="flex justify-between items-center bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs">
                        <div className="space-y-0.5">
                          <p className="font-semibold text-slate-900">{sub.plan?.name || 'Unknown Plan'}</p>
                          <p className="text-[10px] text-slate-550">
                            ${sub.plan ? (sub.plan.price / 100).toFixed(2) : '0'} / {sub.plan?.billingCycle.toLowerCase()} • Renews {new Date(sub.endDate).toLocaleDateString()}
                          </p>
                        </div>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="h-8 text-xs font-semibold px-3 rounded-xl"
                          disabled={updatingSub}
                          onClick={() => handleCancelUserSubscription(sub._id, sub.plan?.name || '')}
                        >
                          Cancel
                        </Button>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>

            {/* Add Subscription Form */}
            <form onSubmit={handleAddUserSubscriptionSubmit} className="space-y-4 border-t border-slate-250 pt-4">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Add New Subscription</label>
              
              <div className="space-y-2">
                <select
                  value={subSelectedPlanId}
                  onChange={(e) => setSubSelectedPlanId(e.target.value)}
                  className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500"
                >
                  <option value="none">Select plan to add...</option>
                  {(() => {
                    const activeSubs = allSubscriptions.filter(
                      (s) => (s.user as any)?._id === subSelectedUser._id && s.status === 'ACTIVE'
                    );
                    // Filter out plans the user is already subscribed to
                    const unsubscribedPlans = availablePlans.filter(
                      (p) => !activeSubs.some((sub) => sub.plan?._id === p._id)
                    );
                    return unsubscribedPlans.map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.name} - ${(p.price / 100).toFixed(2)} ({p.billingCycle.toLowerCase()})
                      </option>
                    ));
                  })()}
                </select>
              </div>

              {/* Billing Cycle Selection */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Billing Cycle</label>
                <select
                  value={subBillingCycle}
                  onChange={(e) => setSubBillingCycle(e.target.value as any)}
                  className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500"
                >
                  <option value="MONTHLY">Monthly Billing Cycle</option>
                  <option value="ANNUAL">Annual Billing Cycle (15% Automated Discount Applied)</option>
                </select>
              </div>

              {/* Customizable Duration (Monthly only) */}
              {subBillingCycle === 'MONTHLY' && (
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Duration (months)</label>
                  <select
                    value={subOverrideMonths}
                    onChange={(e) => setSubOverrideMonths(Number(e.target.value))}
                    className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500"
                  >
                    {[1, 2, 3, 6, 12].map((m) => (
                      <option key={m} value={m}>
                        {m} {m === 1 ? 'Month' : 'Months'}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex justify-end space-x-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setIsManageSubOpen(false)} className="border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl">
                  Close
                </Button>
                <Button
                  type="submit"
                  disabled={updatingSub || subSelectedPlanId === 'none'}
                  className="bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl"
                >
                  {updatingSub ? 'Adding...' : 'Add Subscription'}
                </Button>
              </div>
            </form>
          </div>
        )}
      </Dialog>
    </motion.div>
  );
};

export default SuperAdminDashboard;
