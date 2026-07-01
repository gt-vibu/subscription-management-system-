import React, { useState, useEffect } from 'react';
import { useToast } from '../hooks/useToast';
import planService from '../services/plan.service';
import subscriptionService from '../services/subscription.service';
import statsService from '../services/stats.service';
import type { Plan, Subscription, PlatformStats } from '../types';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { Dialog } from '../components/ui/Dialog';
import { CardSkeleton, TableSkeleton } from '../components/ui/Skeletons';
import { Plus, Edit2, Trash2, RotateCcw, Users, DollarSign, Activity, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export const AdminDashboard: React.FC = () => {
  const { toast } = useToast();

  const [plans, setPlans] = useState<Plan[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [submittingPlan, setSubmittingPlan] = useState(false);

  // Form Fields
  const [planName, setPlanName] = useState('');
  const [planDesc, setPlanDesc] = useState('');
  const [planPrice, setPlanPrice] = useState(''); // in dollars
  const [planCycle, setPlanCycle] = useState<'MONTHLY' | 'ANNUAL'>('MONTHLY');
  const [planFeatures, setPlanFeatures] = useState(''); // comma separated

  const loadData = async () => {
    try {
      const [plansList, subsList, statsData] = await Promise.all([
        planService.getPlans(),
        subscriptionService.getAllSubscriptions(),
        statsService.getStats()
      ]);
      setPlans(plansList);
      setSubscriptions(subsList);
      setStats(statsData);
    } catch (err: any) {
      toast({
        title: 'Error loading admin data',
        description: err.message || 'Could not fetch records.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreateModal = () => {
    setEditingPlan(null);
    setPlanName('');
    setPlanDesc('');
    setPlanPrice('');
    setPlanCycle('MONTHLY');
    setPlanFeatures('');
    setIsModalOpen(true);
  };

  const openEditModal = (plan: Plan) => {
    setEditingPlan(plan);
    setPlanName(plan.name);
    setPlanDesc(plan.description);
    setPlanPrice((plan.price / 100).toFixed(2));
    setPlanCycle(plan.billingCycle);
    setPlanFeatures(plan.features.join(', '));
    setIsModalOpen(true);
  };

  const handleSubmitPlan = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!planName.trim() || !planDesc.trim() || !planPrice || !planFeatures.trim()) {
      toast({
        title: 'Validation Error',
        description: 'All fields are required.',
        variant: 'destructive'
      });
      return;
    }

    const priceInCents = Math.round(parseFloat(planPrice) * 100);
    if (isNaN(priceInCents) || priceInCents < 0) {
      toast({
        title: 'Validation Error',
        description: 'Please provide a valid price.',
        variant: 'destructive'
      });
      return;
    }

    setSubmittingPlan(true);
    try {
      const payload = {
        name: planName.trim(),
        description: planDesc.trim(),
        price: priceInCents,
        billingCycle: planCycle,
        features: planFeatures.split(',').map((f) => f.trim()).filter(Boolean)
      };

      if (editingPlan) {
        await planService.updatePlan(editingPlan._id, payload);
        toast({
          title: 'Plan Updated',
          description: `Successfully modified details for plan "${planName}".`,
          variant: 'success'
        });
      } else {
        await planService.createPlan(payload);
        toast({
          title: 'Plan Created',
          description: `Successfully added pricing plan "${planName}" to catalog.`,
          variant: 'success'
        });
      }

      setIsModalOpen(false);
      await loadData();
    } catch (err: any) {
      toast({
        title: 'Operation Failed',
        description: err.message || 'Error occurred while saving plan.',
        variant: 'destructive'
      });
    } finally {
      setSubmittingPlan(false);
    }
  };

  const handleToggleArchive = async (plan: Plan) => {
    try {
      if (plan.status === 'ACTIVE') {
        await planService.archivePlan(plan._id);
        toast({
          title: 'Plan Archived',
          description: `"${plan.name}" will no longer accept new subscriptions.`,
          variant: 'success'
        });
      } else {
        await planService.restorePlan(plan._id);
        toast({
          title: 'Plan Restored',
          description: `"${plan.name}" is now active in the catalog.`,
          variant: 'success'
        });
      }
      await loadData();
    } catch (err: any) {
      toast({
        title: 'Action Failed',
        description: err.message || 'Could not archive or restore plan.',
        variant: 'destructive'
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 shimmer-wrapper">
        <div className="h-10 w-1/4 bg-muted rounded animate-pulse"></div>
        <div className="grid gap-4 md:grid-cols-3">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
        <TableSkeleton />
      </div>
    );
  }

  const mrr = stats?.subscriptions?.mrr || 0;
  const activeSubsCount = stats?.subscriptions?.active || 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-10 text-slate-900"
    >
      {/* Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
            Admin Dashboard
          </h1>
          <p className="text-slate-500 mt-1 text-sm">
            Configure platform subscription tiers, trace user billing rates, and examine system revenues.
          </p>
        </div>
        <Button onClick={openCreateModal} className="gap-2 shadow-sm border border-indigo-500/20 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl">
          <Plus className="h-4 w-4" /> Create New Plan
        </Button>
      </div>

      {/* Stats Widgets */}
      <div className="bento-grid">
        <motion.div
          whileHover={{ y: -4 }}
          className="glass-card bento-card p-6 rounded-2xl flex items-center space-x-4 border border-slate-200 relative overflow-hidden"
        >
          <div className="p-3 bg-purple-50 rounded-xl text-purple-600">
            <DollarSign className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">MRR</p>
            <p className="text-2xl font-black text-slate-900 mt-0.5">${(mrr / 100).toFixed(2)}</p>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ y: -4 }}
          className="glass-card bento-card p-6 rounded-2xl flex items-center space-x-4 border border-slate-200"
        >
          <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Active Subs</p>
            <p className="text-2xl font-black text-slate-900 mt-0.5">{activeSubsCount}</p>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ y: -4 }}
          className="glass-card bento-card p-6 rounded-2xl flex items-center space-x-4 border border-slate-200"
        >
          <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Pricing Plans</p>
            <p className="text-2xl font-black text-slate-900 mt-0.5">{plans.length}</p>
          </div>
        </motion.div>
      </div>

      {/* Recharts revenue gradient graph */}
      {stats?.plans && stats.plans.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="glass-card p-6 rounded-2xl border border-slate-200 space-y-4"
        >
          <h2 className="text-sm font-extrabold text-slate-500 uppercase tracking-wider flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-indigo-600" /> Plan Monthly Revenue Stream
          </h2>
          <div className="h-[250px] w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.plans} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="purpleArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis
                  stroke="#64748b"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => `$${(val / 100).toFixed(0)}`}
                />
                <Tooltip
                  contentStyle={{
                    background: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    color: '#0f172a',
                    fontSize: '11px'
                  }}
                  formatter={(val: any) => [`$${(val / 100).toFixed(2)}`, 'Revenue']}
                />
                <Area type="monotone" dataKey="monthlyRevenue" stroke="#4f46e5" strokeWidth={2} fillOpacity={1} fill="url(#purpleArea)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      )}

      {/* Plan management grid */}
      <div className="space-y-4">
        <h2 className="text-lg font-black tracking-tight text-white">Subscription Plans & Management</h2>
        <motion.div
          className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: { staggerChildren: 0.05 }
            }
          }}
        >
          {plans.map((plan) => (
            <motion.div
              key={plan._id}
              variants={{
                hidden: { y: 15, opacity: 0 },
                visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 100 } }
              }}
              whileHover={{ y: -4 }}
              className="glass-card p-6 rounded-2xl border border-slate-200 bg-white flex flex-col justify-between space-y-4 shadow-sm"
            >
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <h3 className="font-extrabold text-md text-slate-900">{plan.name}</h3>
                  <Badge variant={plan.status === 'ACTIVE' ? 'success' : 'error'} className="text-[9px] font-bold">
                    {plan.status}
                  </Badge>
                </div>
                <p className="text-xs text-slate-500 min-h-[40px] leading-relaxed">
                  {plan.description}
                </p>
                <div className="space-y-1">
                  <div className="text-xs font-bold text-slate-900">
                    Monthly: ${(plan.price / 100).toFixed(2)}<span className="text-[10px] text-slate-400 font-normal"> / mo</span>
                  </div>
                  <div className="text-xs font-bold text-indigo-650">
                    Annual: ${((plan.price * 12 * 0.85) / 100).toFixed(2)}<span className="text-[10px] text-slate-400 font-normal"> / yr</span>
                    <span className="ml-1.5 text-[9px] bg-emerald-50 text-emerald-600 font-extrabold px-1 py-0.5 rounded border border-emerald-100">15% Off</span>
                  </div>
                </div>
              </div>

              <div className="flex space-x-2 pt-4 border-t border-slate-200 mt-4">
                <Button variant="outline" size="sm" className="flex-1 gap-1 text-xs border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl" onClick={() => openEditModal(plan)}>
                  <Edit2 className="h-3.5 w-3.5" /> Edit
                </Button>
                <Button
                  variant={plan.status === 'ACTIVE' ? 'destructive' : 'secondary'}
                  size="sm"
                  className="flex-1 gap-1 text-xs rounded-xl"
                  onClick={() => handleToggleArchive(plan)}
                >
                  {plan.status === 'ACTIVE' ? (
                    <>
                      <Trash2 className="h-3.5 w-3.5" /> Archive
                    </>
                  ) : (
                    <>
                      <RotateCcw className="h-3.5 w-3.5" /> Restore
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Plan statistics summary */}
      <div className="space-y-4">
        <h2 className="text-lg font-black tracking-tight text-slate-900">Plan Subscription & Revenue Stats</h2>
        {stats?.plans && stats.plans.length > 0 ? (
          <div className="border border-slate-200 rounded-2xl overflow-hidden glass-card shadow-sm bg-white">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/50 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="px-6 py-4">Plan Name</th>
                  <th className="px-6 py-4">Monthly Price</th>
                  <th className="px-6 py-4">Annual Price</th>
                  <th className="px-6 py-4">Active Subscribers</th>
                  <th className="px-6 py-4">Monthly Revenue</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {stats.plans.map((ps) => (
                  <tr key={ps.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-semibold text-slate-900">{ps.name}</td>
                    <td className="px-6 py-4 text-slate-600">${(ps.price / 100).toFixed(2)}</td>
                    <td className="px-6 py-4 text-indigo-650 font-semibold">${((ps.price * 12 * 0.85) / 100).toFixed(2)}</td>
                    <td className="px-6 py-4 font-extrabold text-slate-900">{ps.activeSubscribers}</td>
                    <td className="px-6 py-4 text-emerald-600 font-extrabold">
                      ${(ps.monthlyRevenue / 100).toFixed(2)}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={ps.status === 'ACTIVE' ? 'success' : 'error'} className="text-[9px] font-bold">
                        {ps.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-xs text-slate-500 border border-slate-200 p-6 rounded-2xl glass-card text-center bg-white">
            No active plan statistics available.
          </div>
        )}
      </div>

      {/* Subscriptions Table */}
      <div className="space-y-4">
        <h2 className="text-lg font-black tracking-tight text-slate-900">Platform Active Subscriptions</h2>
        {subscriptions.length === 0 ? (
          <div className="border border-dashed border-slate-200 rounded-2xl p-12 text-center text-sm text-slate-500 glass-card bg-white">
            No active subscription records found.
          </div>
        ) : (
          <div className="border border-slate-200 rounded-2xl overflow-hidden glass-card shadow-sm bg-white">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/50 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">Plan</th>
                  <th className="px-6 py-4">Billing Rate Paid</th>
                  <th className="px-6 py-4">Billing Cycle Chosen</th>
                  <th className="px-6 py-4">Billing End Date</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {subscriptions.map((s) => {
                  const clientUser = s.user as any;
                  const currentRatePaid = s.pricePaid !== undefined && s.pricePaid !== null
                    ? s.pricePaid
                    : (s.billingCycle === 'ANNUAL' ? Math.round(s.plan?.price * 12 * 0.85) : s.plan?.price || 0);

                  return (
                    <tr key={s._id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-semibold text-slate-900">{clientUser?.name || 'Unknown'}</td>
                      <td className="px-6 py-4 text-slate-500 truncate max-w-[180px]">
                        {clientUser?.email || 'N/A'}
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-900">{s.plan?.name || 'N/A'}</td>
                      <td className="px-6 py-4 text-slate-650 font-bold">
                        ${(currentRatePaid / 100).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        <Badge variant="secondary" className="text-[9px] font-bold uppercase">
                          {s.billingCycle || 'MONTHLY'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-slate-500">
                        {new Date(s.endDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <Badge
                          variant={
                            s.status === 'ACTIVE'
                              ? 'success'
                              : s.status === 'CANCELLED'
                              ? 'warning'
                              : 'error'
                          }
                          className="text-[9px] font-bold"
                        >
                          {s.status}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Plan creation & edit dialog modal */}
      <Dialog
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingPlan ? 'Edit Pricing Plan' : 'Create New Plan'}
      >
        <form onSubmit={handleSubmitPlan} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Plan Name</label>
            <Input
              type="text"
              placeholder="e.g. Pro Unlimited"
              value={planName}
              onChange={(e) => setPlanName(e.target.value)}
              className="bg-white border-slate-200 text-slate-900 rounded-xl"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Description</label>
            <textarea
              className="flex w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500 min-h-[80px]"
              placeholder="Provide a brief plan summary..."
              value={planDesc}
              onChange={(e) => setPlanDesc(e.target.value)}
            />
          </div>

          <div className="grid gap-4 grid-cols-2 items-start">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Monthly Price (USD)</label>
              <Input
                type="number"
                step="0.01"
                placeholder="29.99"
                value={planPrice}
                onChange={(e) => setPlanPrice(e.target.value)}
                className="bg-white border-slate-200 text-slate-900 rounded-xl"
              />
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider block">Auto-Derived Annual Rate</span>
              {planPrice && !isNaN(parseFloat(planPrice)) ? (
                <div>
                  <p className="text-sm font-bold text-slate-800">
                    ${(parseFloat(planPrice) * 12 * 0.85).toFixed(2)}/yr
                  </p>
                  <p className="text-[10px] text-emerald-600 font-bold">
                    Includes 15% discount (${(parseFloat(planPrice) * 0.85).toFixed(2)}/mo equivalent)
                  </p>
                </div>
              ) : (
                <p className="text-[10px] text-slate-400 italic">Enter monthly price to view...</p>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Features (comma-separated list)</label>
            <Input
              type="text"
              placeholder="e.g. Unlimited API Keys, 24/7 Support, Analytics"
              value={planFeatures}
              onChange={(e) => setPlanFeatures(e.target.value)}
              className="bg-white border-slate-200 text-slate-900 rounded-xl"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4 border-t border-slate-200 mt-6">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl">
              Cancel
            </Button>
            <Button type="submit" loading={submittingPlan} className="bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl">
              {editingPlan ? 'Save Changes' : 'Create Plan'}
            </Button>
          </div>
        </form>
      </Dialog>
    </motion.div>
  );
};

export default AdminDashboard;
