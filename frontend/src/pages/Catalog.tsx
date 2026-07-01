import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../hooks/useToast';
import planService from '../services/plan.service';
import subscriptionService from '../services/subscription.service';
import type { Plan, Subscription } from '../types';
import { Button } from '../components/ui/Button';
import { CatalogSkeleton } from '../components/ui/Skeletons';
import { Check, Search, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
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

  // Pagination state (Max 3 plans displayed per page)
  const [currentPage, setCurrentPage] = useState(1);
  const plansPerPage = 3;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const plansList = await planService.getPlans();
        setPlans(plansList);

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

  // Reset pagination on search filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

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

  const filteredPlans = plans.filter((plan) => {
    return plan.name.toLowerCase().includes(search.toLowerCase()) || 
           plan.description.toLowerCase().includes(search.toLowerCase());
  });

  // Calculate Paginated subset
  const indexOfLastPlan = currentPage * plansPerPage;
  const indexOfFirstPlan = indexOfLastPlan - plansPerPage;
  const currentPlans = filteredPlans.slice(indexOfFirstPlan, indexOfLastPlan);
  const totalPages = Math.ceil(filteredPlans.length / plansPerPage);

  if (loading) {
    return (
      <div className="py-12">
        <div className="text-center space-y-4 max-w-xl mx-auto mb-10">
          <h1 className="text-2xl font-extrabold tracking-tight">Flexible SaaS Subscriptions</h1>
          <div className="h-4 bg-muted rounded w-3/4 mx-auto animate-pulse"></div>
        </div>
        <CatalogSkeleton />
      </div>
    );
  }

  return (
    <div className="py-6 space-y-8 text-slate-900">
      {/* Title */}
      <div className="text-center space-y-2.5 max-w-xl mx-auto">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
          SaaS Pricing Plans
        </h1>
        <p className="text-xs text-slate-500 leading-relaxed font-semibold">
          Subscribe to plans to activate entitlement features. Cycle discount saves 15% instantly.
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
            Monthly
          </button>
          <button
            onClick={() => setSelectedCycle('ANNUAL')}
            className={`px-5 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 ${
              selectedCycle === 'ANNUAL'
                ? 'bg-white text-slate-900 shadow border border-slate-200'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Annual
            <span className="text-[9px] bg-emerald-500 text-white font-extrabold px-1.5 py-0.5 rounded">Save 15%</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white border border-slate-200 rounded-2xl p-3.5 max-w-4xl mx-auto shadow-sm">
        <div className="relative w-full">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search plans by name or details..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500 font-semibold"
          />
        </div>
      </div>

      {/* Active Subscriptions Count */}
      {activeSubs.length > 0 && (
        <div className="text-center">
          <span className="text-[10px] text-slate-600 bg-slate-100 border border-slate-200 rounded-full px-3.5 py-1 inline-flex items-center gap-1.5 font-semibold">
            <Sparkles className="h-3 w-3 text-indigo-600" />
            You have <span className="font-extrabold text-slate-900">{activeSubs.length}</span> active subscription{activeSubs.length === 1 ? '' : 's'}
          </span>
        </div>
      )}

      {/* Catalog Cards Grid */}
      {filteredPlans.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-slate-200 bg-white rounded-2xl max-w-lg mx-auto space-y-3">
          <p className="text-slate-400 text-xs font-semibold">No active pricing plans found matching criteria.</p>
          <Button variant="outline" size="sm" className="rounded-xl border-slate-200 text-slate-700" onClick={() => { setSearch(''); }}>
            Reset Filter
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          <motion.div
            className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto px-2"
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: {
                  staggerChildren: 0.05
                }
              }
            }}
          >
            {currentPlans.map((plan) => {
              const alreadySubscribed = isSubscribedToPlan(plan._id);
              let btnLabel = 'Subscribe';
              if (alreadySubscribed) {
                btnLabel = 'Subscribed ✓';
              }

              const isPro = plan.name.toLowerCase().includes('pro') || plan.name.toLowerCase().includes('standard');

              const monthlyPrice = plan.price / 100;
              const annualPricePerMonth = monthlyPrice * 0.85;
              const annualTotal = monthlyPrice * 12 * 0.85;
              const annualRegularTotal = monthlyPrice * 12;

              return (
                <motion.div
                  key={plan._id}
                  variants={{
                    hidden: { y: 15, opacity: 0 },
                    visible: { y: 0, opacity: 1 }
                  }}
                  className={`relative flex flex-col justify-between rounded-2xl border p-5 bg-white transition-all duration-300 min-h-[300px] ${
                    alreadySubscribed ? 'ring-2 ring-indigo-500 border-indigo-500 shadow-md' : 'border-slate-200 hover:shadow-md hover:border-slate-350'
                  }`}
                >
                  {isPro && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-indigo-650 text-white px-2.5 py-0.5 text-[8px] font-extrabold tracking-wider uppercase shadow">
                      Popular
                    </span>
                  )}

                  <div className="space-y-4 text-left">
                    <div className="space-y-0.5">
                      <h3 className="text-sm font-extrabold text-slate-900">{plan.name}</h3>
                      <p className="text-[10px] text-slate-500 leading-normal min-h-[30px] font-medium">
                        {plan.description}
                      </p>
                    </div>

                    <div className="min-h-[60px] flex flex-col justify-center border-b border-slate-100 pb-3">
                      {selectedCycle === 'MONTHLY' ? (
                        <div className="flex items-baseline text-slate-900">
                          <span className="text-2xl font-black tracking-tight">
                            ${monthlyPrice.toFixed(2)}
                          </span>
                          <span className="ml-0.5 text-[10px] font-bold text-slate-400">
                            /mo
                          </span>
                        </div>
                      ) : (
                        <div className="space-y-0.5">
                          <div className="flex items-baseline text-slate-900">
                            <span className="text-2xl font-black tracking-tight text-indigo-650">
                              ${annualPricePerMonth.toFixed(2)}
                            </span>
                            <span className="ml-0.5 text-[10px] font-bold text-slate-400">
                              /mo
                            </span>
                          </div>
                          <p className="text-[8px] font-extrabold text-emerald-650 uppercase tracking-wide">
                            Billed Annually (${annualTotal.toFixed(2)}/yr)
                          </p>
                          <p className="text-[8px] text-slate-400 line-through">
                            Regular: ${annualRegularTotal.toFixed(2)}/yr
                          </p>
                        </div>
                      )}
                    </div>

                    <ul className="space-y-1.5 text-[10px] text-slate-500 font-semibold">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-center gap-1.5">
                          <Check className="h-3.5 w-3.5 shrink-0 text-indigo-500" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>

                    {/* Customizable Duration (Monthly only) */}
                    {selectedCycle === 'MONTHLY' && !alreadySubscribed && (
                      <div className="mt-4 flex items-center justify-between p-2 bg-slate-50 border border-slate-150 rounded-xl">
                        <span className="text-[8px] text-slate-400 font-extrabold uppercase tracking-wider">Duration</span>
                        <select
                          value={selectedMonths[plan._id] || 1}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setSelectedMonths((prev) => ({ ...prev, [plan._id]: val }));
                          }}
                          className="bg-white border border-slate-200 rounded-lg px-2 py-0.5 text-[10px] font-bold text-slate-700 focus:outline-none"
                        >
                          {[1, 2, 3, 6, 12].map((m) => (
                            <option key={m} value={m}>
                              {m} {m === 1 ? 'Month' : 'Months'}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  <div className="mt-6">
                    <Button
                      onClick={() => handleAction(plan)}
                      className={`w-full py-2.5 text-[10px] font-extrabold uppercase tracking-wider rounded-xl transition-all ${
                        alreadySubscribed
                          ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200/50'
                          : 'bg-indigo-650 hover:bg-indigo-700 text-white'
                      }`}
                      disabled={!!(user && user.role !== 'USER') || alreadySubscribed}
                      loading={submittingId === plan._id}
                    >
                      {btnLabel}
                    </Button>
                    {user && user.role !== 'USER' && (
                      <p className="text-[8px] text-center text-rose-500 font-extrabold mt-2 uppercase tracking-wider">
                        Disabled for Admin roles
                      </p>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </motion.div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 pt-4">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 text-slate-600 transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 text-slate-600 transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Catalog;
