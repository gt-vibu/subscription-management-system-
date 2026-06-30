import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../hooks/useToast';
import planService from '../services/plan.service';
import subscriptionService from '../services/subscription.service';
import type { Plan, Subscription } from '../types';
import { Button } from '../components/ui/Button';
import { CatalogSkeleton } from '../components/ui/Skeletons';
import { Check, Search, Filter, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

export const Catalog: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [plans, setPlans] = useState<Plan[]>([]);
  const [activeSubs, setActiveSubs] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [selectedMonths, setSelectedMonths] = useState<Record<string, number>>({});

  // Filters state
  const [search, setSearch] = useState('');
  const [cycleFilter, setCycleFilter] = useState<'ALL' | 'MONTHLY' | 'ANNUAL'>('ALL');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const plansList = await planService.getPlans();
        setPlans(plansList);

        // Fetch current subscriptions if logged in as USER
        if (user && user.role === 'USER') {
          const details = await subscriptionService.getMySubscription();
          setActiveSubs(details.active || []);
        }
      } catch (err: any) {
        toast({
          title: 'Error Loading Catalog',
          description: err.message || 'Could not load subscription plans.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user, toast]);

  // Check if user is already subscribed to a specific plan
  const isSubscribedToPlan = (planId: string) => {
    return activeSubs.some(sub => sub.plan?._id === planId);
  };

  const handleAction = async (plan: Plan) => {
    if (!user) {
      toast({
        title: 'Authentication Required',
        description: 'Please sign in to subscribe to plans.',
      });
      navigate('/login', { state: { from: { pathname: '/' } } });
      return;
    }

    if (user.role !== 'USER') {
      toast({
        title: 'Action Restricted',
        description: 'Administrators and Super Admins cannot subscribe to billing plans.',
        variant: 'destructive',
      });
      return;
    }

    if (isSubscribedToPlan(plan._id)) {
      toast({
        title: 'Already Subscribed',
        description: `You are already subscribed to ${plan.name}. Go to your dashboard to manage it.`,
        variant: 'destructive',
      });
      return;
    }

    const months = selectedMonths[plan._id] || 1;
    setSubmittingId(plan._id);
    try {
      await subscriptionService.subscribe(plan._id, months);
      toast({
        title: 'Subscription Activated!',
        description: `You are now subscribed to the ${plan.name} plan for ${months} ${months === 1 ? 'month' : 'months'}.`,
        variant: 'success',
      });
      navigate('/dashboard');
    } catch (err: any) {
      toast({
        title: 'Subscription Action Failed',
        description: err.message || 'An error occurred during transaction.',
        variant: 'destructive',
      });
    } finally {
      setSubmittingId(null);
    }
  };

  // Filter calculations (Minimal time complexity: O(N) filtering in UI)
  const filteredPlans = plans.filter((plan) => {
    const matchesSearch = plan.name.toLowerCase().includes(search.toLowerCase()) || 
                          plan.description.toLowerCase().includes(search.toLowerCase());
    const matchesCycle = cycleFilter === 'ALL' || plan.billingCycle === cycleFilter;
    return matchesSearch && matchesCycle;
  });

  if (loading) {
    return (
      <div className="py-12">
        <div className="text-center space-y-4 max-w-xl mx-auto mb-10">
          <h1 className="text-3xl font-extrabold tracking-tight">Flexible SaaS Subscriptions</h1>
          <div className="h-4 bg-muted rounded w-3/4 mx-auto animate-pulse"></div>
        </div>
        <CatalogSkeleton />
      </div>
    );
  }

  return (
    <div className="py-6 space-y-10">
      {/* Title */}
      <div className="text-center space-y-3 max-w-xl mx-auto">
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl bg-gradient-to-r from-foreground to-foreground/75 bg-clip-text text-transparent">
          SaaS Pricing Plans
        </h1>
        <p className="text-md text-muted-foreground leading-relaxed">
          Subscribe to multiple plans to unlock different feature sets. Manage all from your dashboard.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center glass-card border border-border/30 rounded-xl p-4 max-w-4xl mx-auto">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search plans..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-10 w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
          <Filter className="h-4 w-4 text-muted-foreground hidden sm:block" />
          <div className="flex border border-border/20 rounded-md p-0.5 bg-background/50">
            {(['ALL', 'MONTHLY', 'ANNUAL'] as const).map((cycle) => (
              <button
                key={cycle}
                onClick={() => setCycleFilter(cycle)}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                  cycleFilter === cycle
                    ? 'bg-foreground text-background shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/10'
                }`}
              >
                {cycle.charAt(0) + cycle.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Active Subscriptions Count */}
      {activeSubs.length > 0 && (
        <div className="text-center">
          <span className="text-xs text-muted-foreground bg-white/5 border border-white/10 rounded-full px-4 py-1.5 inline-flex items-center gap-1.5">
            <Sparkles className="h-3 w-3 text-purple-400" />
            You have <span className="font-bold text-white">{activeSubs.length}</span> active {activeSubs.length === 1 ? 'subscription' : 'subscriptions'}
          </span>
        </div>
      )}

      {/* Catalog Cards Grid */}
      {filteredPlans.length === 0 ? (
        <div className="text-center py-12 border border-dashed rounded-xl max-w-2xl mx-auto space-y-4 glass-card">
          <p className="text-muted-foreground font-medium">No active pricing plans found matching criteria.</p>
          <Button variant="outline" size="sm" onClick={() => { setSearch(''); setCycleFilter('ALL'); }}>
            Reset Filters
          </Button>
        </div>
      ) : (
        <motion.div
          className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto px-2"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: {
                staggerChildren: 0.08
              }
            }
          }}
        >
          {filteredPlans.map((plan) => {
            const alreadySubscribed = isSubscribedToPlan(plan._id);
            
            let btnLabel = 'Subscribe';
            let btnVariant: 'default' | 'outline' | 'secondary' = 'default';
            
            if (alreadySubscribed) {
              btnLabel = 'Subscribed ✓';
              btnVariant = 'secondary';
            }

            const isPro = plan.name.toLowerCase().includes('pro');

            return (
              <motion.div
                key={plan._id}
                variants={{
                  hidden: { y: 20, opacity: 0 },
                  visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 120, damping: 20 } }
                }}
                whileHover={{
                  y: -8,
                  scale: 1.015,
                  boxShadow: '0 20px 40px -15px rgba(147, 51, 234, 0.15)',
                  borderColor: 'rgba(147, 51, 234, 0.35)'
                }}
                className={`relative flex flex-col justify-between rounded-2xl border bg-card/65 backdrop-blur-md glass-card p-8 shadow-sm transition-all duration-300 ${
                  alreadySubscribed ? 'ring-2 ring-purple-500 border-purple-500/40' : 'border-border/30'
                }`}
              >
                {/* Popular Badge indicator with float & icon */}
                {isPro && (
                  <motion.span
                    animate={{ y: [0, -3, 0] }}
                    transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                    className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-3.5 py-1 text-[10px] font-bold tracking-wider uppercase shadow-md flex items-center gap-1 border border-white/10"
                  >
                    <Sparkles className="h-3 w-3" /> Most Popular
                  </motion.span>
                )}

                <div className="space-y-6">
                  {/* Plan Meta */}
                  <div className="space-y-2">
                    <h3 className="text-2xl font-extrabold tracking-tight text-foreground">{plan.name}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed min-h-[40px]">
                      {plan.description}
                    </p>
                  </div>

                  {/* Price info */}
                  <div className="flex items-baseline text-foreground">
                    <span className="text-4xl font-extrabold tracking-tight">
                      ${(plan.price / 100).toFixed(2)}
                    </span>
                    <span className="ml-1 text-sm font-semibold text-muted-foreground">
                      /{plan.billingCycle === 'ANNUAL' ? 'yr' : 'mo'}
                    </span>
                  </div>

                  {/* Features list */}
                  <ul className="space-y-3.5 text-sm text-muted-foreground border-t border-border/20 pt-6">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-2.5">
                        <Check className="h-4 w-4 shrink-0 text-foreground" />
                        <span className="text-foreground/90">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Customizable Duration (Monthly only) */}
                  {plan.billingCycle === 'MONTHLY' && !alreadySubscribed && (
                    <div className="mt-6 flex items-center justify-between border-t border-border/10 pt-4">
                      <span className="text-xs text-zinc-400 font-medium">Duration:</span>
                      <select
                        value={selectedMonths[plan._id] || 1}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setSelectedMonths((prev) => ({ ...prev, [plan._id]: val }));
                        }}
                        className="bg-zinc-900 border border-white/10 rounded-md px-3 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-zinc-600 transition-all font-semibold"
                      >
                        {[1, 2, 3, 6, 12].map((m) => (
                          <option key={m} value={m} className="bg-zinc-950 text-xs">
                            {m} {m === 1 ? 'Month' : 'Months'}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {/* Call-to-action button */}
                <div className="mt-8">
                  <Button
                    onClick={() => handleAction(plan)}
                    className="w-full shadow-sm text-xs font-semibold py-2.5"
                    variant={btnVariant}
                    disabled={!!(user && user.role !== 'USER') || alreadySubscribed}
                    loading={submittingId === plan._id}
                  >
                    {btnLabel}
                  </Button>
                  {user && user.role !== 'USER' && (
                    <p className="text-[10px] text-center text-muted-foreground mt-2">
                      Disabled for Admin roles
                    </p>
                  )}
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
};
export default Catalog;
