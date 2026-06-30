import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../hooks/useToast';
import subscriptionService from '../services/subscription.service';
import type { UserSubscriptionDetails } from '../services/subscription.service';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { TableSkeleton } from '../components/ui/Skeletons';
import { CreditCard, Calendar, AlertTriangle, ArrowRight, User as UserIcon, Sparkles, Shield, TrendingUp, CheckCircle } from 'lucide-react';
import { motion, useMotionValue, useTransform } from 'framer-motion';

export const UserDashboard: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [data, setData] = useState<UserSubscriptionDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  // Mouse tilt motion values for Profile Card (Card 1)
  const x1 = useMotionValue(0);
  const y1 = useMotionValue(0);
  const rotateX1 = useTransform(y1, [-150, 150], [8, -8]);
  const rotateY1 = useTransform(x1, [-150, 150], [-8, 8]);

  // Mouse tilt motion values for Current Plan Card (Card 2)
  const x2 = useMotionValue(0);
  const y2 = useMotionValue(0);
  const rotateX2 = useTransform(y2, [-300, 300], [8, -8]);
  const rotateY2 = useTransform(x2, [-300, 300], [-8, 8]);

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

  const handleCancel = async () => {
    if (!window.confirm('Are you sure you want to cancel your subscription? You will lose access to premium features.')) {
      return;
    }

    setCancelling(true);
    try {
      await subscriptionService.cancelSubscription();
      toast({
        title: 'Subscription Cancelled',
        description: 'Your subscription status is now cancelled.',
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
      setCancelling(false);
    }
  };

  const handleMouseMove1 = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    x1.set(e.clientX - rect.left - rect.width / 2);
    y1.set(e.clientY - rect.top - rect.height / 2);
  };

  const handleMouseLeave1 = () => {
    x1.set(0);
    y1.set(0);
  };

  const handleMouseMove2 = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    x2.set(e.clientX - rect.left - rect.width / 2);
    y2.set(e.clientY - rect.top - rect.height / 2);
  };

  const handleMouseLeave2 = () => {
    x2.set(0);
    y2.set(0);
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

  const active = data?.active;
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
        <div className="text-xs text-muted-foreground flex items-center gap-2">
          Account Status: 
          <Badge variant="success" className="px-2.5 py-0.5 bg-emerald-500/10 border-emerald-500/20 text-emerald-400 font-bold">
            Active
          </Badge>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Profile Card with interactive 3D cursor-tilting */}
        <motion.div
          style={{ rotateX: rotateX1, rotateY: rotateY1, transformStyle: 'preserve-3d' }}
          onMouseMove={handleMouseMove1}
          onMouseLeave={handleMouseLeave1}
          whileHover={{ scale: 1.015 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          className="glass-card bento-card p-6 rounded-2xl border border-white/5 flex flex-col justify-between relative overflow-hidden cursor-default select-none"
        >
          {/* Subtle background glow */}
          <div className="absolute -top-10 -left-10 w-24 h-24 rounded-full bg-purple-500/5 blur-2xl pointer-events-none" />
          
          <div className="space-y-2 relative z-10" style={{ transform: 'translateZ(20px)' }}>
            <h2 className="text-sm font-extrabold tracking-wider text-zinc-400 uppercase flex items-center gap-2">
              <UserIcon className="h-4 w-4 text-purple-400" /> Profile Details
            </h2>
            <div className="divide-y divide-white/5 text-sm mt-3">
              <div className="py-2.5 flex justify-between">
                <span className="text-zinc-500">Name</span>
                <span className="font-semibold text-white">{user?.name}</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-zinc-500">Email</span>
                <span className="font-semibold text-white truncate max-w-[150px]">{user?.email}</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-zinc-500">Access Level</span>
                <span className="font-semibold text-purple-400 uppercase tracking-wide flex items-center gap-1">
                  <Shield className="h-3.5 w-3.5" /> {user?.role}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex justify-between items-end border-t border-white/5 pt-4 mt-6 relative z-10" style={{ transform: 'translateZ(10px)' }}>
            <div className="text-[10px] text-zinc-500">
              Signed up {user ? new Date(user.createdAt).toLocaleDateString() : ''}
            </div>
            
            {/* Interactive 3D Cube */}
            <div className="cube-container absolute bottom-4 right-4 opacity-75 pointer-events-none">
              <div className="cube">
                <div className="cube-face cube-face-front text-[8px]">SUB</div>
                <div className="cube-face cube-face-back text-[8px]">FLOW</div>
                <div className="cube-face cube-face-right text-[8px]">PRO</div>
                <div className="cube-face cube-face-left text-[8px]">60FPS</div>
                <div className="cube-face cube-face-top text-[8px]">S</div>
                <div className="cube-face cube-face-bottom text-[8px]">$</div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Current Plan Details with interactive 3D cursor-tilting */}
        <motion.div
          style={{ rotateX: rotateX2, rotateY: rotateY2, transformStyle: 'preserve-3d' }}
          onMouseMove={handleMouseMove2}
          onMouseLeave={handleMouseLeave2}
          whileHover={{ scale: 1.015 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          className="md:col-span-2 glass-card bento-card p-6 rounded-2xl border border-white/5 flex flex-col justify-between relative overflow-hidden cursor-default select-none"
        >
          {/* Subtle background glow */}
          <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-indigo-500/5 blur-2xl pointer-events-none" />

          {active ? (
            <>
              <div className="space-y-4" style={{ transform: 'translateZ(25px)' }}>
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-indigo-400" /> Current Subscription
                    </span>
                    <h3 className="text-2xl font-black text-white">{active.plan.name}</h3>
                  </div>
                  <Badge variant={active.status === 'ACTIVE' ? 'success' : 'warning'} className="bg-purple-500/10 border-purple-500/20 text-purple-400">
                    {active.status}
                  </Badge>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 text-sm bg-white/[0.02] border border-white/5 rounded-xl p-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-white/5 border border-white/10 rounded-lg">
                      <CreditCard className="h-4 w-4 text-zinc-400" />
                    </div>
                    <div>
                      <p className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">Pricing Tier</p>
                      <p className="font-bold text-white">
                        ${(active.plan.price / 100).toFixed(2)} /{' '}
                        {active.plan.billingCycle === 'ANNUAL' ? 'year' : 'month'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-white/5 border border-white/10 rounded-lg">
                      <Calendar className="h-4 w-4 text-zinc-400" />
                    </div>
                    <div>
                      <p className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">Renewal Date</p>
                      <p className="font-bold text-white">
                        {new Date(active.endDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center border-t border-white/5 pt-4 mt-6" style={{ transform: 'translateZ(15px)' }}>
                <Link to="/">
                  <Button variant="outline" size="sm" className="gap-2 text-xs border-white/10 hover:bg-white/5">
                    Change Plan <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
                {active.status === 'ACTIVE' && (
                  <Button
                    variant="destructive"
                    size="sm"
                    loading={cancelling}
                    onClick={handleCancel}
                    className="text-xs"
                  >
                    Cancel Subscription
                  </Button>
                )}
              </div>
            </>
          ) : (
            <div className="h-full flex flex-col justify-center items-center py-6 text-center space-y-4" style={{ transform: 'translateZ(20px)' }}>
              <div className="rounded-full bg-white/5 border border-white/10 p-3">
                <AlertTriangle className="h-5 w-5 text-zinc-400 animate-pulse" />
              </div>
              <div className="space-y-1">
                <h3 className="text-md font-bold tracking-tight text-white">No Active Subscription</h3>
                <p className="text-xs text-zinc-400 max-w-sm leading-relaxed">
                  You are not currently subscribed to any billing plan. Choose a plan to unlock
                  premium platform features.
                </p>
              </div>
              <Link to="/" className="pt-2">
                <Button size="sm" className="text-xs bg-white text-black hover:bg-zinc-200">Browse Available Plans</Button>
              </Link>
            </div>
          )}
        </motion.div>
      </div>

      {/* Premium Telemetry & Feature Metrics */}
      {active && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="grid gap-6 md:grid-cols-3"
        >
          {/* Card 1: API Credits Usage */}
          <div className="glass-card p-6 rounded-2xl border border-white/5 space-y-4 relative overflow-hidden">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">API Usage</span>
              <Badge variant="outline" className="text-[9px] border-purple-500/20 text-purple-400 bg-purple-500/5 font-semibold">
                86.2% Used
              </Badge>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-end">
                <span className="text-2xl font-black text-white">43,122</span>
                <span className="text-xs text-zinc-500">/ 50,000 credits</span>
              </div>
              {/* Progress bar */}
              <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: '86.2%' }}
                  transition={{ duration: 1, delay: 0.5 }}
                  className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full"
                />
              </div>
            </div>
            <p className="text-[10px] text-zinc-500 leading-relaxed">
              Credits reset automatically on renewal date ({new Date(active.endDate).toLocaleDateString()}).
            </p>
          </div>

          {/* Card 2: Security & API Keys */}
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

          {/* Card 3: Included Features */}
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
