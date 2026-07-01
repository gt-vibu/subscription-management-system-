import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../hooks/useToast';
import planService from '../services/plan.service';
import subscriptionService from '../services/subscription.service';
import type { Plan, Subscription } from '../types';
import { Button } from '../components/ui/Button';
import { CatalogSkeleton } from '../components/ui/Skeletons';
import { Check, Search, Sparkles } from 'lucide-react';
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
  const [selectedCycle, setSelectedCycle] = useState<'MONTHLY' | 'ANNUAL'>('MONTHLY');

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

    const months = selectedCycle === 'MONTHLY' ? (selectedMonths[plan._id] || 1) : 12;
    setSubmittingId(plan._id);
    try {
      await subscriptionService.subscribe(plan._id, selectedCycle, months);
      toast({
        title: 'Subscription Activated!',
        description: `You are now subscribed to the ${plan.name} plan ${selectedCycle === 'ANNUAL' ? 'annually' : `for ${months} ${months === 1 ? 'month' : 'months'}`}.`,
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
    return matchesSearch;
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
    <div className="py-6 space-y-10 text-slate-900">
      {/* Title */}
      <div className="text-center space-y-3 max-w-xl mx-auto">
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl text-slate-900">
          SaaS Pricing Plans
        </h1>
        <p className="text-md text-slate-500 leading-relaxed">
          Subscribe to multiple plans to unlock different feature sets. Manage all from your dashboard.
        </p>
      </div>

      {/* Toggle switch for Monthly / Annually */}
      <div className="flex flex-col items-center space-y-2">
        <div className="flex border border-slate-200 rounded-2xl p-1 bg-slate-100/80 shadow-sm">
          <button
            onClick={() => setSelectedCycle('MONTHLY')}
            className={`px-5 py-2 text-xs font-bold rounded-xl transition-all ${
              selectedCycle === 'MONTHLY'
                ? 'bg-white text-slate-900 shadow border border-slate-200'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Monthly Billing
          </button>
          <button
            onClick={() => setSelectedCycle('ANNUAL')}
            className={`px-5 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 ${
              selectedCycle === 'ANNUAL'
                ? 'bg-white text-slate-900 shadow border border-slate-200'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Annual Billing
            <span className="text-[10px] bg-emerald-500 text-white font-extrabold px-1.5 py-0.5 rounded-md">Save 15%</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white border border-slate-200 rounded-2xl p-4 max-w-4xl mx-auto shadow-sm">
        <div className="relative w-full">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search plans by name or feature details..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500"
          />
        </div>
      </div>

      {/* Active Subscriptions Count */}
      {activeSubs.length > 0 && (
        <div className="text-center">
          <span className="text-xs text-slate-650 bg-slate-100 border border-slate-200 rounded-full px-4 py-1.5 inline-flex items-center gap-1.5 font-semibold">
            <Sparkles className="h-3 w-3 text-indigo-600" />
            You have <span className="font-bold text-slate-900">{activeSubs.length}</span> active {activeSubs.length === 1 ? 'subscription' : 'subscriptions'}
          </span>
        </div>
      )}

      {/* Catalog Cards Grid */}
      {filteredPlans.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-slate-300 rounded-2xl max-w-2xl mx-auto space-y-4 bg-white shadow-sm">
          <p className="text-slate-500 font-medium">No active pricing plans found matching criteria.</p>
          <Button variant="outline" size="sm" className="rounded-xl border-slate-200 text-slate-700" onClick={() => { setSearch(''); }}>
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
            
            if (alreadySubscribed) {
              btnLabel = 'Subscribed ✓';
            }

            const isPro = plan.name.toLowerCase().includes('pro');

            // Price calculation details
            const monthlyPrice = plan.price / 100;
            const annualPricePerMonth = monthlyPrice * 0.85;
            const annualTotal = monthlyPrice * 12 * 0.85;
            const annualRegularTotal = monthlyPrice * 12;

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
                  boxShadow: '0 20px 40px -15px rgba(99, 102, 241, 0.08)',
                  borderColor: '#818cf8'
                }}
                className={`relative flex flex-col justify-between rounded-2xl border p-8 shadow-sm transition-all duration-300 bg-white ${
                  alreadySubscribed ? 'ring-2 ring-indigo-650 border-indigo-650 shadow-indigo-100/50' : 'border-slate-200'
                }`}
              >
                {/* Popular Badge indicator with float & icon */}
                {isPro && (
                  <motion.span
                    animate={{ y: [0, -3, 0] }}
                    transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                    className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-indigo-600 to-indigo-700 text-white px-3.5 py-1 text-[10px] font-bold tracking-wider uppercase shadow-md flex items-center gap-1 border border-indigo-500/20"
                  >
                    <Sparkles className="h-3 w-3" /> Most Popular
                  </motion.span>
                )}

                <div className="space-y-6">
                  {/* Plan Meta */}
                  <div className="space-y-2">
                    <h3 className="text-2xl font-extrabold tracking-tight text-slate-900">{plan.name}</h3>
                    <p className="text-sm text-slate-550 leading-relaxed min-h-[40px]">
                      {plan.description}
                    </p>
                  </div>

                  {/* Price info */}
                  <div className="min-h-[85px] flex flex-col justify-center">
                    {selectedCycle === 'MONTHLY' ? (
                      <div className="flex items-baseline text-slate-900">
                        <span className="text-4xl font-extrabold tracking-tight">
                          ${monthlyPrice.toFixed(2)}
                        </span>
                        <span className="ml-1 text-sm font-semibold text-slate-550">
                          /mo
                        </span>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <div className="flex items-baseline text-slate-900">
                          <span className="text-4xl font-extrabold tracking-tight text-indigo-650">
                            ${annualPricePerMonth.toFixed(2)}
                          </span>
                          <span className="ml-1 text-sm font-semibold text-slate-550">
                            /mo
                          </span>
                        </div>
                        <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-wide">
                          Billed Annually (${annualTotal.toFixed(2)}/yr)
                        </p>
                        <p className="text-[10px] text-slate-450 line-through">
                          Regular: ${annualRegularTotal.toFixed(2)}/yr
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Features list */}
                  <ul className="space-y-3.5 text-sm text-slate-650 border-t border-slate-100 pt-6">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-2.5">
                        <Check className="h-4 w-4 shrink-0 text-slate-950" />
                        <span className="text-slate-700 font-semibold">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Customizable Duration (Monthly only) */}
                  {selectedCycle === 'MONTHLY' && !alreadySubscribed && (
                    <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
                      <span className="text-xs text-slate-500 font-medium">Duration:</span>
                      <select
                          value={selectedMonths[plan._id] || 1}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setSelectedMonths((prev) => ({ ...prev, [plan._id]: val }));
                          }}
                          className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all font-semibold"
                      >
                        {[1, 2, 3, 6, 12].map((m) => (
                            <option key={m} value={m} className="bg-white text-xs">
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
                    className={`w-full shadow-sm text-xs font-semibold py-2.5 rounded-xl ${
                      alreadySubscribed
                        ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-250 cursor-default'
                        : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                    }`}
                    disabled={!!(user && user.role !== 'USER') || alreadySubscribed}
                    loading={submittingId === plan._id}
                  >
                    {btnLabel}
                  </Button>
                  {user && user.role !== 'USER' && (
                    <p className="text-[10px] text-center text-slate-500 mt-2 font-semibold">
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
