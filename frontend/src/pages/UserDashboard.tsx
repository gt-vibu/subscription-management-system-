import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../hooks/useToast';
import subscriptionService from '../services/subscription.service';
import type { UserSubscriptionDetails } from '../services/subscription.service';
import type { Subscription } from '../types';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { TableSkeleton } from '../components/ui/Skeletons';
import { CreditCard, Calendar, AlertTriangle, User as UserIcon, Sparkles, Shield, TrendingUp, CheckCircle, Plus } from 'lucide-react';
import { motion } from 'framer-motion';

export const UserDashboard: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [data, setData] = useState<UserSubscriptionDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const fetchSubscription = async () => {
    try {
      const details = await subscriptionService.getMySubscription();
      setData(details);
    } catch (err: any) {
      toast({
        title: 'Error loading subscriptions',
        description: err.message || 'Could not fetch your billing history.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscription();
  }, []);

  const handleCancel = async (subscriptionId: string, planName: string) => {
    if (!window.confirm(`Are you sure you want to cancel your "${planName}" subscription?`)) {
      return;
    }

    setCancellingId(subscriptionId);
    try {
      await subscriptionService.cancelSubscription(subscriptionId);
      toast({
        title: 'Subscription Cancelled',
        description: `Your "${planName}" subscription has been cancelled.`,
        variant: 'success',
      });
      await fetchSubscription();
    } catch (err: any) {
      toast({
        title: 'Cancellation Failed',
        description: err.message || 'An error occurred during cancellation.',
        variant: 'destructive',
      });
    } finally {
      setCancellingId(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 shimmer-wrapper">
        <div className="h-10 w-1/4 bg-muted rounded animate-pulse"></div>
        <div className="grid gap-6 md:grid-cols-3">
          <div className="h-[250px] bg-muted/40 rounded-xl animate-pulse"></div>
          <div className="md:col-span-2 h-[250px] bg-muted/40 rounded-xl animate-pulse"></div>
        </div>
        <TableSkeleton />
      </div>
    );
  }

  const activeSubscriptions = data?.active || [];
  const history = data?.history || [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-8"
    >
      {/* Welcome banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <motion.h1
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent"
          >
            Welcome back, {user?.name}
          </motion.h1>
          <p className="text-muted-foreground mt-1 text-sm">Manage your subscriptions and billing details.</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground bg-white/5 border border-white/10 rounded-full px-3 py-1 inline-flex items-center gap-1.5">
            <Sparkles className="h-3 w-3 text-purple-400" />
            <span className="font-bold text-white">{activeSubscriptions.length}</span> Active {activeSubscriptions.length === 1 ? 'Plan' : 'Plans'}
          </span>
          <Badge variant="success" className="px-2.5 py-0.5 bg-emerald-500/10 border-emerald-500/20 text-emerald-400 font-bold">
            Active
          </Badge>
        </div>
      </div>

      {/* Profile Card */}
      <div className="glass-card bento-card p-6 rounded-2xl border border-white/5 relative overflow-hidden">
        <div className="absolute -top-10 -left-10 w-24 h-24 rounded-full bg-purple-500/5 blur-2xl pointer-events-none" />
        <div className="space-y-2 relative z-10">
          <h2 className="text-sm font-extrabold tracking-wider text-zinc-400 uppercase flex items-center gap-2">
            <UserIcon className="h-4 w-4 text-purple-400" /> Profile Details
          </h2>
          <div className="grid gap-4 sm:grid-cols-3 text-sm mt-3">
            <div className="py-2.5 flex justify-between sm:flex-col sm:gap-1">
              <span className="text-zinc-500">Name</span>
              <span className="font-semibold text-white">{user?.name}</span>
            </div>
            <div className="py-2.5 flex justify-between sm:flex-col sm:gap-1">
              <span className="text-zinc-500">Email</span>
              <span className="font-semibold text-white truncate">{user?.email}</span>
            </div>
            <div className="py-2.5 flex justify-between sm:flex-col sm:gap-1">
              <span className="text-zinc-500">Access Level</span>
              <span className="font-semibold text-purple-400 uppercase tracking-wide flex items-center gap-1">
                <Shield className="h-3.5 w-3.5" /> {user?.role}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Active Subscriptions Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-indigo-400" /> Active Subscriptions
          </h2>
          <Link to="/">
            <Button variant="outline" size="sm" className="gap-2 text-xs border-white/10 hover:bg-white/5">
              <Plus className="h-3.5 w-3.5" /> Add Plan
            </Button>
          </Link>
        </div>

        {activeSubscriptions.length === 0 ? (
          <div className="glass-card border border-dashed border-white/10 rounded-2xl p-10 text-center space-y-4">
            <div className="rounded-full bg-white/5 border border-white/10 p-3 inline-flex">
              <AlertTriangle className="h-5 w-5 text-zinc-400 animate-pulse" />
            </div>
            <div className="space-y-1">
              <h3 className="text-md font-bold tracking-tight text-white">No Active Subscriptions</h3>
              <p className="text-xs text-zinc-400 max-w-sm mx-auto leading-relaxed">
                You are not currently subscribed to any billing plans. Browse available plans to get started.
              </p>
            </div>
            <Link to="/">
              <Button size="sm" className="text-xs bg-white text-black hover:bg-zinc-200">Browse Plans</Button>
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {activeSubscriptions.map((sub: Subscription, index: number) => (
              <motion.div
                key={sub._id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.08 }}
                whileHover={{ scale: 1.015, y: -4 }}
                className="glass-card bento-card p-6 rounded-2xl border border-white/5 flex flex-col justify-between relative overflow-hidden"
              >
                <div className="absolute -top-8 -right-8 w-20 h-20 rounded-full bg-indigo-500/5 blur-2xl pointer-events-none" />
                
                <div className="space-y-3 relative z-10">
                  <div className="flex justify-between items-start">
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Subscription</span>
                      <h3 className="text-xl font-black text-white">{sub.plan?.name || 'Unknown Plan'}</h3>
                    </div>
                    <Badge variant="success" className="bg-emerald-500/10 border-emerald-500/20 text-emerald-400 text-[10px]">
                      {sub.status}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm bg-white/[0.02] border border-white/5 rounded-xl p-3">
                    <div className="flex items-center space-x-2">
                      <CreditCard className="h-3.5 w-3.5 text-zinc-500" />
                      <div>
                        <p className="text-[9px] text-zinc-500 font-semibold uppercase">Price</p>
                        <p className="font-bold text-white text-xs">
                          ${sub.plan ? (sub.plan.price / 100).toFixed(2) : '0.00'}
                          <span className="text-zinc-500 font-normal">/{sub.plan?.billingCycle === 'ANNUAL' ? 'yr' : 'mo'}</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-3.5 w-3.5 text-zinc-500" />
                      <div>
                        <p className="text-[9px] text-zinc-500 font-semibold uppercase">Renews</p>
                        <p className="font-bold text-white text-xs">{new Date(sub.endDate).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t border-white/5 pt-3 mt-4 relative z-10">
                  <Button
                    variant="destructive"
                    size="sm"
                    className="w-full text-xs"
                    loading={cancellingId === sub._id}
                    onClick={() => handleCancel(sub._id, sub.plan?.name || 'this plan')}
                  >
                    Cancel
                  </Button>
                </div>
              </motion.div>
            ))}

            {/* Add More Plan Card */}
            <Link to="/">
              <motion.div
                whileHover={{ scale: 1.015, y: -4 }}
                className="glass-card border border-dashed border-white/10 rounded-2xl p-6 flex flex-col items-center justify-center min-h-[220px] cursor-pointer hover:border-purple-500/30 transition-colors"
              >
                <div className="rounded-full bg-white/5 border border-white/10 p-3 mb-3">
                  <Plus className="h-5 w-5 text-zinc-400" />
                </div>
                <p className="text-sm font-semibold text-zinc-400">Add Another Plan</p>
                <p className="text-[10px] text-zinc-500 mt-1">Subscribe to more services</p>
              </motion.div>
            </Link>
          </div>
        )}
      </div>

      {/* Telemetry Widgets */}
      {activeSubscriptions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="grid gap-6 md:grid-cols-3"
        >
          <div className="glass-card p-6 rounded-2xl border border-white/5 space-y-4 relative overflow-hidden">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Active Plans</span>
              <Badge variant="outline" className="text-[9px] border-purple-500/20 text-purple-400 bg-purple-500/5 font-semibold">
                {activeSubscriptions.length} Active
              </Badge>
            </div>
            <div className="space-y-2">
              {activeSubscriptions.map((sub) => (
                <div key={sub._id} className="flex items-center justify-between text-xs bg-white/[0.02] border border-white/5 rounded-lg px-3 py-2">
                  <span className="font-semibold text-white">{sub.plan?.name}</span>
                  <span className="text-zinc-500">${sub.plan ? (sub.plan.price / 100).toFixed(2) : '0'}/mo</span>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card p-6 rounded-2xl border border-white/5 space-y-4">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Access Credentials</span>
            <div className="space-y-2.5">
              <p className="text-[11px] text-zinc-400">Use this token to authenticate your local client apps.</p>
              <div className="flex items-center justify-between bg-zinc-950/60 border border-white/5 p-2 rounded-xl text-xs font-mono">
                <span className="text-zinc-400 truncate max-w-[170px]">sk_live_51Nv2jDsgFlK8qQ91</span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText('sk_live_51Nv2jDsgFlK8qQ91');
                    toast({ title: 'Token Copied', description: 'API Key copied to clipboard.', variant: 'success' });
                  }}
                  className="text-[10px] font-bold text-purple-400 hover:text-purple-300 transition-colors bg-purple-500/10 px-2.5 py-1 rounded-lg border border-purple-500/10"
                >
                  Copy
                </button>
              </div>
            </div>
          </div>

          <div className="glass-card p-6 rounded-2xl border border-white/5 space-y-3">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Included Privileges</span>
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2 text-zinc-300">
                <CheckCircle className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                <span>Unlimited API Integrations</span>
              </div>
              <div className="flex items-center gap-2 text-zinc-300">
                <CheckCircle className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                <span>24/7 Priority SLA Support</span>
              </div>
              <div className="flex items-center gap-2 text-zinc-300">
                <CheckCircle className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                <span>Custom Webhook Stream</span>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* History table */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-purple-400" />
          <h2 className="text-lg font-black tracking-tight text-white">Billing History</h2>
        </div>
        {history.length === 0 ? (
          <div className="border border-dashed border-white/10 rounded-2xl p-8 text-center text-sm text-zinc-500 glass-card">
            No previous transactions found.
          </div>
        ) : (
          <div className="border border-white/5 rounded-2xl overflow-hidden glass-card shadow-sm">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-white/5 bg-white/[0.01] text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                  <th className="px-6 py-4">Plan Name</th>
                  <th className="px-6 py-4">Price</th>
                  <th className="px-6 py-4">Cycle</th>
                  <th className="px-6 py-4">Start Date</th>
                  <th className="px-6 py-4">End Date</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {history.map((h, i) => (
                  <motion.tr
                    key={h._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 + 0.15 }}
                    className="hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="px-6 py-4 font-semibold text-white">{h.plan?.name || 'Deleted Plan'}</td>
                    <td className="px-6 py-4 text-zinc-300">
                      {h.plan ? `$${(h.plan.price / 100).toFixed(2)}` : 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wide">
                      {h.plan?.billingCycle || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-zinc-400">
                      {new Date(h.startDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-zinc-400">
                      {new Date(h.endDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={h.status === 'EXPIRED' ? 'error' : 'warning'} className="text-[10px] font-bold tracking-wide">
                        {h.status}
                      </Badge>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default UserDashboard;
