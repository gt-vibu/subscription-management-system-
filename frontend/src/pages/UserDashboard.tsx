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
        <div className="h-10 w-1/4 bg-slate-200 rounded animate-pulse"></div>
        <div className="grid gap-6 md:grid-cols-3">
          <div className="h-[250px] bg-slate-100 rounded-xl animate-pulse"></div>
          <div className="md:col-span-2 h-[250px] bg-slate-100 rounded-xl animate-pulse"></div>
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
            className="text-3xl font-extrabold tracking-tight text-slate-900"
          >
            Welcome back, {user?.name}
          </motion.h1>
          <p className="text-slate-500 mt-1 text-sm">Manage your subscriptions and billing details.</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-600 bg-slate-100 border border-slate-200 rounded-full px-3 py-1 inline-flex items-center gap-1.5 font-semibold">
            <Sparkles className="h-3 w-3 text-indigo-600" />
            <span className="font-extrabold text-slate-900">{activeSubscriptions.length}</span> Active {activeSubscriptions.length === 1 ? 'Plan' : 'Plans'}
          </span>
          <Badge variant="success" className="px-2.5 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold">
            Active Status
          </Badge>
        </div>
      </div>

      {/* Profile Card */}
      <div className="glass-card bento-card p-6 rounded-2xl relative overflow-hidden">
        <div className="absolute -top-10 -left-10 w-24 h-24 rounded-full bg-indigo-500/5 blur-2xl pointer-events-none" />
        <div className="space-y-2 relative z-10">
          <h2 className="text-xs font-extrabold tracking-wider text-slate-400 uppercase flex items-center gap-2">
            <UserIcon className="h-4 w-4 text-indigo-600" /> Profile Details
          </h2>
          <div className="grid gap-4 sm:grid-cols-3 text-sm mt-3">
            <div className="py-2.5 flex justify-between sm:flex-col sm:gap-1">
              <span className="text-slate-500 font-medium">Name</span>
              <span className="font-bold text-slate-900">{user?.name}</span>
            </div>
            <div className="py-2.5 flex justify-between sm:flex-col sm:gap-1">
              <span className="text-slate-500 font-medium">Email Address</span>
              <span className="font-bold text-slate-900 truncate">{user?.email}</span>
            </div>
            <div className="py-2.5 flex justify-between sm:flex-col sm:gap-1">
              <span className="text-slate-500 font-medium">Access Level</span>
              <span className="font-bold text-indigo-600 uppercase tracking-wide flex items-center gap-1 text-xs">
                <Shield className="h-3.5 w-3.5" /> {user?.role}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Active Subscriptions Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black tracking-tight text-slate-900 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-indigo-600" /> Active Subscriptions
          </h2>
          <Link to="/catalog">
            <Button variant="outline" size="sm" className="gap-2 text-xs border-slate-200 hover:bg-slate-50 bg-white">
              <Plus className="h-3.5 w-3.5" /> Add Plan
            </Button>
          </Link>
        </div>

        {activeSubscriptions.length === 0 ? (
          <div className="glass-card border border-dashed border-slate-300 rounded-2xl p-10 text-center space-y-4">
            <div className="rounded-full bg-slate-100 border border-slate-200 p-3 inline-flex">
              <AlertTriangle className="h-5 w-5 text-slate-400 animate-pulse" />
            </div>
            <div className="space-y-1">
              <h3 className="text-md font-bold tracking-tight text-slate-900">No Active Subscriptions</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                You are not currently subscribed to any billing plans. Browse available plans to get started.
              </p>
            </div>
            <Link to="/catalog">
              <Button size="sm" className="text-xs bg-slate-900 text-white hover:bg-slate-800 rounded-xl">Browse Plans</Button>
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
                className="glass-card bento-card p-6 rounded-2xl flex flex-col justify-between relative overflow-hidden"
              >
                <div className="absolute -top-8 -right-8 w-20 h-20 rounded-full bg-indigo-500/5 blur-2xl pointer-events-none" />
                
                <div className="space-y-3 relative z-10">
                  <div className="flex justify-between items-start">
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Subscription</span>
                      <h3 className="text-lg font-black text-slate-900">{sub.plan?.name || 'Unknown Plan'}</h3>
                    </div>
                    <Badge variant="success" className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold">
                      {sub.status}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 border border-slate-100 rounded-xl p-3">
                    <div className="flex items-center space-x-2 col-span-2">
                      <CreditCard className="h-4 w-4 text-slate-400" />
                      <div>
                        <p className="text-[9px] text-slate-400 font-bold uppercase">Billing Details</p>
                        <p className="font-bold text-slate-900 text-xs">
                          {sub.billingCycle === 'ANNUAL' ? (
                            <>
                              ${(sub.pricePaid ? sub.pricePaid / 100 : (sub.plan?.price * 12 * 0.85) / 100).toFixed(2)}/yr
                              <span className="ml-1.5 text-[9px] bg-emerald-50 text-emerald-600 font-extrabold px-1 py-0.5 rounded border border-emerald-100">Annual</span>
                            </>
                          ) : (
                            <>
                              ${(sub.pricePaid ? sub.pricePaid / 100 : sub.plan?.price / 100).toFixed(2)}/mo
                              <span className="ml-1.5 text-[9px] bg-indigo-50 text-indigo-600 font-bold px-1 py-0.5 rounded border border-indigo-100">Monthly</span>
                            </>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 col-span-2 border-t border-slate-100 pt-2">
                      <Calendar className="h-4 w-4 text-slate-400" />
                      <div>
                        <p className="text-[9px] text-slate-400 font-bold uppercase">Renews / Ends On</p>
                        <p className="font-bold text-slate-900 text-xs">{new Date(sub.endDate).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-3 mt-4 relative z-10">
                  <Button
                    variant="destructive"
                    size="sm"
                    className="w-full text-xs rounded-xl"
                    loading={cancellingId === sub._id}
                    onClick={() => handleCancel(sub._id, sub.plan?.name || 'this plan')}
                  >
                    Cancel Subscription
                  </Button>
                </div>
              </motion.div>
            ))}

            {/* Add More Plan Card */}
            <Link to="/catalog">
              <motion.div
                whileHover={{ scale: 1.015, y: -4 }}
                className="glass-card border border-dashed border-slate-300 rounded-2xl p-6 flex flex-col items-center justify-center min-h-[200px] cursor-pointer hover:border-indigo-500/30 transition-colors"
              >
                <div className="rounded-full bg-slate-100 border border-slate-200 p-3 mb-3">
                  <Plus className="h-5 w-5 text-slate-500" />
                </div>
                <p className="text-sm font-semibold text-slate-700">Add Another Plan</p>
                <p className="text-[10px] text-slate-400 mt-1">Subscribe to more services</p>
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
          <div className="glass-card p-6 rounded-2xl space-y-4 relative overflow-hidden">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Plans</span>
              <Badge variant="outline" className="text-[9px] border-indigo-200 text-indigo-700 bg-indigo-50 font-bold">
                {activeSubscriptions.length} Active
              </Badge>
            </div>
            <div className="space-y-2">
              {activeSubscriptions.map((sub) => (
                <div key={sub._id} className="flex items-center justify-between text-xs bg-slate-50 border border-slate-100 rounded-lg px-3 py-2">
                  <span className="font-semibold text-slate-800">{sub.plan?.name}</span>
                  <span className="text-slate-500 font-bold">${sub.plan ? (sub.plan.price / 100).toFixed(2) : '0'}/mo</span>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card p-6 rounded-2xl space-y-4">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Access Credentials</span>
            <div className="space-y-2.5">
              <p className="text-[11px] text-slate-500">Use this token to authenticate your local client apps.</p>
              <div className="flex items-center justify-between bg-slate-50 border border-slate-200 p-2 rounded-xl text-xs font-mono">
                <span className="text-slate-600 truncate max-w-[170px]">sk_live_51Nv2jDsgFlK8qQ91</span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText('sk_live_51Nv2jDsgFlK8qQ91');
                    toast({ title: 'Token Copied', description: 'API Key copied to clipboard.', variant: 'success' });
                  }}
                  className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100"
                >
                  Copy
                </button>
              </div>
            </div>
          </div>

          <div className="glass-card p-6 rounded-2xl space-y-3">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Included Privileges</span>
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2 text-slate-600">
                <CheckCircle className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                <span>Unlimited API Integrations</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <CheckCircle className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                <span>24/7 Priority SLA Support</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <CheckCircle className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                <span>Custom Webhook Stream</span>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* History table */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-indigo-600" />
          <h2 className="text-lg font-black tracking-tight text-slate-900">Billing History</h2>
        </div>
        {history.length === 0 ? (
          <div className="border border-dashed border-slate-200 rounded-2xl p-8 text-center text-sm text-slate-400 glass-card">
            No previous transactions found.
          </div>
        ) : (
          <div className="border border-slate-200 rounded-2xl overflow-hidden glass-card shadow-sm bg-white">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/50 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="px-6 py-4">Plan Name</th>
                  <th className="px-6 py-4">Price</th>
                  <th className="px-6 py-4">Cycle</th>
                  <th className="px-6 py-4">Start Date</th>
                  <th className="px-6 py-4">End Date</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {history.map((h, i) => (
                  <motion.tr
                    key={h._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 + 0.15 }}
                    className="hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="px-6 py-4 font-semibold text-slate-800">{h.plan?.name || 'Deleted Plan'}</td>
                    <td className="px-6 py-4 text-slate-600">
                      {h.plan ? `$${(h.plan.price / 100).toFixed(2)}` : 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wide">
                      {h.plan?.billingCycle || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {new Date(h.startDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {new Date(h.endDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <Badge 
                        variant={h.status === 'EXPIRED' ? 'error' : 'warning'} 
                        className={`text-[9px] font-extrabold tracking-wide uppercase px-2 py-0.5 rounded ${
                          h.status === 'EXPIRED'
                            ? 'bg-rose-50 border border-rose-200 text-rose-700'
                            : 'bg-amber-50 border border-amber-200 text-amber-700'
                        }`}
                      >
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
