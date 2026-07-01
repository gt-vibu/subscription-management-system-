import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../hooks/useToast';
import planService from '../services/plan.service';
import subscriptionService from '../services/subscription.service';
import statsService from '../services/stats.service';
import type { Plan, Subscription, PublicStats } from '../types';
import { Button } from '../components/ui/Button';
import { IsometricMockup } from '../components/ui/IsometricMockup';
import { 
  Check, 
  Sparkles, 
  ArrowRight, 
  CreditCard, 
  Layers, 
  AlertCircle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const LandingPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [plans, setPlans] = useState<Plan[]>([]);
  const [activeSubs, setActiveSubs] = useState<Subscription[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [selectedMonths, setSelectedMonths] = useState<Record<string, number>>({});
  const [, setPublicStats] = useState<PublicStats | null>(null);
  const [resourcesOpen, setResourcesOpen] = useState(false);
  const [selectedCycle, setSelectedCycle] = useState<'MONTHLY' | 'ANNUAL'>('MONTHLY');

  // Pricing Plan Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const plansPerPage = 3;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [plansList, statsData] = await Promise.all([
          planService.getPlans(),
          statsService.getPublicStats().catch(err => {
            console.error('Error fetching public stats:', err);
            return null;
          })
        ]);
        
        setPlans(plansList || []);
        setPublicStats(statsData);

        if (user && user.role === 'USER') {
          const details = await subscriptionService.getMySubscription();
          setActiveSubs(details.active || []);
        }
      } catch (err: any) {
        console.error('Error fetching plans for landing page:', err);
      } finally {
        setLoadingPlans(false);
      }
    };
    fetchData();
  }, [user]);

  const isSubscribedToPlan = (planId: string) => {
    return activeSubs.some(sub => sub.plan?._id === planId);
  };

  const handleSubscribe = async (plan: Plan) => {
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
        description: 'Administrators cannot subscribe to billing plans.',
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

  // Pagination calculation
  const indexOfLastPlan = currentPage * plansPerPage;
  const indexOfFirstPlan = indexOfLastPlan - plansPerPage;
  const currentPlans = plans.slice(indexOfFirstPlan, indexOfLastPlan);
  const totalPages = Math.ceil(plans.length / plansPerPage);

  return (
    <div className="min-h-screen bg-[#F9FAFC] text-slate-900 selection:bg-indigo-500 selection:text-white relative overflow-x-hidden font-sans">
      {/* Drifting Aurora Gradient Blobs */}
      <div className="absolute top-[-10%] left-[-15%] w-[800px] h-[800px] rounded-full bg-gradient-to-tr from-[#6366F1]/10 to-[#8B5CF6]/6 blur-[130px] pointer-events-none z-0 animate-drift" />
      <div className="absolute top-[30%] right-[-15%] w-[700px] h-[700px] rounded-full bg-gradient-to-tr from-[#6366F1]/6 to-[#8B5CF6]/8 blur-[110px] pointer-events-none z-0 animate-drift-reverse" />
      <div className="absolute bottom-[10%] left-[-5%] w-[600px] h-[600px] rounded-full bg-gradient-to-tr from-[#6366F1]/8 to-[#8B5CF6]/6 blur-[120px] pointer-events-none z-0 animate-drift" />

      {/* Grid Overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(rgba(99,102,241,0.04)_1.5px,transparent_1.5px)] bg-[size:32px_32px] opacity-80 pointer-events-none z-0" />

      {/* TOP HEADER */}
      <header className="sticky top-0 z-[1000] backdrop-blur-xl bg-white/70 border-b border-slate-200/40 px-6 py-4 transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2">
            <span className="h-8 w-8 rounded-xl bg-gradient-to-tr from-[#6366F1] to-[#8B5CF6] text-white flex items-center justify-center font-extrabold text-sm shadow-md">
              S
            </span>
            <span className="font-extrabold tracking-tight text-lg text-slate-900">
              SubManage
            </span>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-8 text-xs font-bold text-slate-500 uppercase tracking-wider">
            <a href="#features" className="hover:text-slate-950 transition-colors">Features</a>
            <a href="#pricing" className="hover:text-slate-950 transition-colors">Pricing</a>
            <a href="#dashboard-preview" className="hover:text-slate-950 transition-colors">Integrations</a>
            <div 
              className="relative flex items-center gap-1 cursor-pointer hover:text-slate-950 transition-colors"
              onClick={() => setResourcesOpen(!resourcesOpen)}
              onMouseEnter={() => setResourcesOpen(true)}
              onMouseLeave={() => setResourcesOpen(false)}
            >
              <span>Resources</span>
              <svg className={`h-4 w-4 text-slate-400 transition-transform ${resourcesOpen ? 'rotate-180 text-slate-700' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
              </svg>

              {/* Popover */}
              <AnimatePresence>
                {resourcesOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute top-full right-[-50px] mt-2 w-64 bg-white border border-slate-200 rounded-2xl p-4 shadow-xl z-[1001] text-left cursor-default"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="space-y-4">
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Documentation</p>
                        <a href="#" onClick={(e) => e.preventDefault()} className="block mt-1.5 text-xs font-semibold text-slate-800 hover:text-indigo-650 transition-colors">
                          Getting Started Guide
                        </a>
                        <p className="text-[10px] text-slate-400 mt-0.5">Integrate SubManage in under 5 minutes</p>
                      </div>
                      
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Developer Reference</p>
                        <a href="#" onClick={(e) => e.preventDefault()} className="block mt-1.5 text-xs font-semibold text-slate-800 hover:text-indigo-650 transition-colors">
                          API Reference Manual
                        </a>
                        <p className="text-[10px] text-slate-400 mt-0.5">Configure endpoints, webhooks, and tokens</p>
                      </div>

                      <div className="border-t border-slate-100 pt-3 flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-500 uppercase">System Status</span>
                        <span className="inline-flex items-center gap-1 text-[9px] bg-emerald-50 text-emerald-600 font-bold px-2 py-0.5 rounded-full border border-emerald-100">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Operational
                        </span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </nav>

          {/* Auth buttons */}
          <div className="flex items-center space-x-4">
            {user ? (
              <Link to="/dashboard">
                <Button className="rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-6 py-2.5 font-bold shadow-md hover:-translate-y-0.5 transition-all">
                  Go to Dashboard
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/login" className="text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-slate-950 transition-colors px-2 py-1">
                  Sign In
                </Link>
                <Link to="/login">
                  <Button className="rounded-2xl bg-slate-900 text-white hover:bg-slate-800 text-xs px-6 py-2.5 font-bold shadow-md hover:-translate-y-0.5 transition-all">
                    Book a Demo
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative z-10 pt-20 pb-16 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-20">
          
          <div className="space-y-6 text-left">
            <motion.div 
              initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-1.5 bg-indigo-50 border border-indigo-100 rounded-full px-4 py-1.5 text-xs font-bold text-indigo-650 shadow-sm"
            >
              <Sparkles className="h-3.5 w-3.5 text-indigo-500 animate-pulse" /> Introducing SubManage 2.0
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
              className="text-4xl md:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.1]"
            >
              Subscription management made <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#6366F1] to-[#8B5CF6]">effortless.</span>
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}
              className="text-md text-slate-500 leading-relaxed max-w-xl font-medium"
            >
              All-in-one platform to orchestrate user plans, schedule recurring billing operations, and grow recurring cash flows faster.
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-4 pt-4"
            >
              <a href="#pricing">
                <Button className="rounded-2xl bg-indigo-600 text-white hover:bg-indigo-700 text-xs px-8 py-4 font-bold shadow-lg shadow-indigo-600/15 w-full sm:w-auto hover:-translate-y-0.5 transition-all">
                  Start Free Trial
                </Button>
              </a>
              <a href="#features">
                <Button variant="outline" className="rounded-2xl border-slate-200 hover:bg-slate-50 text-xs px-8 py-4 font-bold shadow-sm w-full sm:w-auto hover:-translate-y-0.5 transition-all bg-white">
                  Book a Demo
                </Button>
              </a>
            </motion.div>
          </div>

          <div className="flex justify-center lg:justify-end">
            <IsometricMockup />
          </div>

        </div>
      </section>

      {/* TRUSTED BY LOGO BAR */}
      <section className="py-8 bg-white border-y border-slate-100 relative z-10">
        <div className="max-w-7xl mx-auto px-6 text-center space-y-4">
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Powering subscription teams globally</p>
          <div className="flex flex-wrap justify-center items-center gap-x-12 gap-y-4 opacity-40 grayscale hover:grayscale-0 transition-all duration-500 cursor-default font-extrabold text-sm text-slate-600">
            <span>NETFLIX</span>
            <span>SPOTIFY</span>
            <span>ADOBE</span>
            <span>SLACK</span>
            <span>STRIPE</span>
          </div>
        </div>
      </section>

      {/* FEATURES / BENTO SECTION */}
      <section id="features" className="max-w-7xl mx-auto px-6 py-20 space-y-12">
        <div className="text-center space-y-3 max-w-xl mx-auto">
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">
            Everything you need to scale subscriptions
          </h2>
          <p className="text-slate-500 text-sm font-medium">
            Deploy secure entitlement rules, manage customer trials, and view key metrics.
          </p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 max-w-5xl mx-auto auto-rows-[minmax(160px,auto)]">
          {/* Revenue Card (Spans 8 cols, 2 rows) */}
          <div className="md:col-span-8 md:row-span-2 bg-white rounded-2xl p-6 border border-slate-200/50 shadow-[0_8px_30px_rgba(99,102,241,0.04)] relative overflow-hidden group hover:shadow-xl hover:shadow-indigo-500/5 transition-all">
            <div className="flex justify-between items-start mb-6">
              <div>
                <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest">Revenue Overview</p>
                <h3 className="text-2xl font-black text-slate-900 mt-1">$128,560<span className="text-[10px] text-emerald-600 ml-2 font-extrabold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">↑ 12.3%</span></h3>
              </div>
              <div className="bg-slate-50 rounded-xl p-1 flex gap-1 border border-slate-100">
                 <span className="text-[9px] font-extrabold px-2 py-1 bg-white shadow-sm rounded-lg text-slate-800">12M</span>
                 <span className="text-[9px] font-extrabold px-2 py-1 text-slate-400 cursor-pointer">30D</span>
                 <span className="text-[9px] font-extrabold px-2 py-1 text-slate-400 cursor-pointer">7D</span>
              </div>
            </div>
            
            {/* Smooth chart drawing */}
            <div className="absolute bottom-0 left-0 w-full h-32 pointer-events-none">
              <svg className="w-full h-full" viewBox="0 0 100 40" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="bentoGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366F1" stopOpacity="0.15" />
                    <stop offset="100%" stopColor="#6366F1" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path d="M 0 40 L 0 30 Q 15 23 25 28 T 50 12 T 75 18 T 100 3 L 100 40 Z" fill="url(#bentoGrad)" />
                <motion.path 
                  initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} transition={{ duration: 1.5, ease: "easeOut" }} viewport={{ once: true }}
                  d="M 0 30 Q 15 23 25 28 T 50 12 T 75 18 T 100 3" fill="none" stroke="#6366F1" strokeWidth="2" 
                />
              </svg>
            </div>
          </div>

          {/* AI Insights Card */}
          <div className="md:col-span-4 md:row-span-1 bg-gradient-to-br from-indigo-900 to-indigo-950 rounded-2xl p-6 shadow-xl text-white flex flex-col justify-between relative overflow-hidden group hover:shadow-2xl transition-all">
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#6366F1]/15 blur-xl rounded-full" />
            <div className="relative z-10 space-y-2">
              <div className="inline-flex items-center gap-1 bg-white/10 rounded-full px-2.5 py-1 text-[8px] font-extrabold uppercase tracking-wider text-indigo-200">
                ✨ AI Insights
              </div>
              <p className="text-[11px] font-medium text-slate-200 leading-relaxed">
                Total churn dropped <span className="text-emerald-400 font-extrabold">2.45%</span>. Net expansion cashflow estimated at <span className="text-indigo-300 font-extrabold">+$12.5k</span> next month.
              </p>
            </div>
            <button className="relative z-10 text-[9px] font-bold uppercase tracking-wider text-indigo-300 hover:text-white transition-colors mt-3 flex items-center gap-1">
              Analyze <ArrowRight className="h-3 w-3" />
            </button>
          </div>

          {/* Stat Card */}
          <div className="md:col-span-4 md:row-span-1 bg-white rounded-2xl p-6 border border-slate-200/50 shadow-[0_8px_30px_rgba(99,102,241,0.04)] flex flex-col justify-center items-center text-center group hover:shadow-lg transition-all">
             <div className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-650 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
               <Layers className="h-4.5 w-4.5" />
             </div>
             <h4 className="text-xl font-black text-slate-900">9,265</h4>
             <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest mt-0.5">Active Subscribers</p>
          </div>

          {/* Recent Activity */}
          <div className="md:col-span-4 md:row-span-2 bg-white rounded-2xl p-6 border border-slate-200/50 shadow-[0_8px_30px_rgba(99,102,241,0.04)] group hover:shadow-lg transition-all hidden md:block">
             <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest mb-4">Live Logs Stream</p>
             <div className="space-y-4">
                <div className="flex items-center group">
                  <div className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 shadow-sm z-10">
                    <Check className="h-2.5 w-2.5" />
                  </div>
                  <div className="ml-2.5 text-left">
                    <p className="text-[9px] font-bold text-slate-800">New subscription</p>
                    <p className="text-[8px] text-slate-400">Acme Corporation • Annual</p>
                  </div>
                </div>

                <div className="flex items-center group">
                  <div className="flex items-center justify-center w-5 h-5 rounded-full bg-indigo-50 text-indigo-650 shadow-sm z-10">
                    <CreditCard className="h-2.5 w-2.5" />
                  </div>
                  <div className="ml-2.5 text-left">
                    <p className="text-[9px] font-bold text-slate-800">Payment received</p>
                    <p className="text-[8px] text-slate-400">Globex Corp. • $899.00</p>
                  </div>
                </div>

                <div className="flex items-center group">
                  <div className="flex items-center justify-center w-5 h-5 rounded-full bg-rose-50 text-rose-600 shadow-sm z-10">
                    <AlertCircle className="h-2.5 w-2.5" />
                  </div>
                  <div className="ml-2.5 text-left">
                    <p className="text-[9px] font-bold text-slate-800">Payment failed</p>
                    <p className="text-[8px] text-slate-400">Initech • Monthly</p>
                  </div>
                </div>
             </div>
          </div>

          {/* Upcoming Renewals */}
          <div className="md:col-span-4 md:row-span-1 bg-white rounded-2xl p-6 border border-slate-200/50 shadow-[0_8px_30px_rgba(99,102,241,0.04)] flex flex-col justify-between group hover:shadow-lg transition-all">
             <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest mb-3">Expiring Soon</p>
             <div className="space-y-2">
               <div className="flex items-center justify-between text-xs">
                 <div className="flex items-center gap-2">
                   <div className="h-5 w-5 rounded bg-indigo-50 text-indigo-650 flex items-center justify-center font-bold text-[8px]">A</div>
                   <span className="font-bold text-slate-700 text-[10px]">Acme Corp</span>
                 </div>
                 <span className="font-extrabold text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded text-[8px]">2 days</span>
               </div>
               <div className="flex items-center justify-between text-xs">
                 <div className="flex items-center gap-2">
                   <div className="h-5 w-5 rounded bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-[8px]">G</div>
                   <span className="font-bold text-slate-700 text-[10px]">Globex Inc</span>
                 </div>
                 <span className="font-extrabold text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded text-[8px]">5 days</span>
               </div>
             </div>
          </div>

          {/* Calendar Widget */}
          <div className="md:col-span-4 md:row-span-1 bg-white rounded-2xl p-6 border border-slate-200/50 shadow-[0_8px_30px_rgba(99,102,241,0.04)] flex items-center justify-center relative overflow-hidden group hover:shadow-lg transition-all">
             <div className="text-center relative z-10">
                <p className="text-[8px] font-extrabold text-slate-400 uppercase tracking-widest">Active Cycle</p>
                <h4 className="text-md font-black text-slate-900 mt-0.5">July 2026</h4>
                <p className="text-[8px] font-extrabold text-indigo-650 mt-1 bg-indigo-50 rounded-full px-2 py-0.5">14 Days left</p>
             </div>
          </div>
        </div>
      </section>

      {/* PRICING SECTION */}
      <section id="pricing" className="max-w-7xl mx-auto px-6 py-20 space-y-12">
        <div className="text-center space-y-4 max-w-xl mx-auto">
          <div className="inline-flex items-center gap-1.5 bg-indigo-50 border border-indigo-100 rounded-full px-3 py-1 text-xs font-bold text-indigo-600 shadow-sm">
            <CreditCard className="h-3 w-3 text-indigo-500" /> Transparent Pricing
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">
            Simple pricing plans
          </h2>
          <p className="text-slate-500 text-sm font-medium">
            Toggle billing cycle to view discounted annual packages.
          </p>

          {/* Toggle switch for Monthly / Annually */}
          <div className="flex justify-center pt-2">
            <div className="flex border border-slate-200 rounded-[1.25rem] p-1 bg-slate-100/80 shadow-sm">
              <button
                onClick={() => setSelectedCycle('MONTHLY')}
                className={`px-5 py-2 text-xs font-bold rounded-xl transition-all ${
                  selectedCycle === 'MONTHLY'
                    ? 'bg-white text-slate-900 shadow border border-slate-200'
                    : 'text-slate-400 hover:text-slate-700'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setSelectedCycle('ANNUAL')}
                className={`px-5 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 ${
                  selectedCycle === 'ANNUAL'
                    ? 'bg-white text-slate-900 shadow border border-slate-200'
                    : 'text-slate-400 hover:text-slate-700'
                }`}
              >
                Annual
                <span className="text-[8px] bg-emerald-500 text-white font-extrabold px-1 py-0.5 rounded">Save 15%</span>
              </button>
            </div>
          </div>
        </div>

        {loadingPlans ? (
          <div className="text-center py-12 text-slate-400 text-xs font-semibold">
            Loading catalog details...
          </div>
        ) : plans.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-slate-200 bg-white rounded-2xl max-w-md mx-auto">
            <p className="text-slate-400 text-xs font-semibold">No pricing plans found.</p>
          </div>
        ) : (
          <div className="space-y-6 max-w-5xl mx-auto">
            {/* Pricing Grid (Strict Max 3 on 1 page screen) */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
              {currentPlans.map((plan) => {
                const alreadySubscribed = isSubscribedToPlan(plan._id);
                const isPro = plan.name.toLowerCase().includes('pro') || plan.name.toLowerCase().includes('standard');
                
                let btnLabel = 'Subscribe';
                if (alreadySubscribed) {
                  btnLabel = 'Subscribed ✓';
                }

                const monthlyPrice = plan.price / 100;
                const annualPricePerMonth = monthlyPrice * 0.85;
                const annualTotal = monthlyPrice * 12 * 0.85;
                const annualRegularTotal = monthlyPrice * 12;

                return (
                  <div 
                    key={plan._id} 
                    className={`bg-white rounded-2xl p-5 border relative flex flex-col justify-between transition-all duration-300 min-h-[300px] group ${
                      alreadySubscribed 
                        ? 'ring-2 ring-indigo-500 border-indigo-500 shadow-md' 
                        : 'border-slate-200 hover:shadow-md hover:border-slate-350'
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
                        <p className="text-[10px] text-slate-400 leading-normal min-h-[30px] font-medium">{plan.description}</p>
                      </div>

                      <div className="min-h-[60px] flex flex-col justify-center border-b border-slate-100 pb-3">
                        {selectedCycle === 'MONTHLY' ? (
                          <div className="flex items-baseline text-slate-900">
                            <span className="text-2xl font-black tracking-tight">
                              ${monthlyPrice.toFixed(2)}
                            </span>
                            <span className="ml-0.5 text-[10px] text-slate-400 font-bold">
                              /mo
                            </span>
                          </div>
                        ) : (
                          <div className="space-y-0.5 text-left">
                            <div className="flex items-baseline text-slate-900">
                              <span className="text-2xl font-black tracking-tight text-indigo-650">
                                ${annualPricePerMonth.toFixed(2)}
                              </span>
                              <span className="ml-0.5 text-[10px] text-slate-400 font-bold">
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

                      {/* Duration selector - Display only in Monthly cycle */}
                      {selectedCycle === 'MONTHLY' && !alreadySubscribed && (
                        <div className="mt-2.5 flex items-center justify-between p-1.5 bg-slate-50 border border-slate-150 rounded-xl">
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
                        onClick={() => handleSubscribe(plan)}
                        className={`w-full py-2.5 text-[10px] uppercase tracking-wider font-extrabold rounded-xl transition-all ${
                          alreadySubscribed 
                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200/50' 
                            : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                        }`}
                        loading={submittingId === plan._id}
                        disabled={alreadySubscribed || !!(user && user.role !== 'USER')}
                      >
                        {btnLabel}
                      </Button>
                      {user && user.role !== 'USER' && (
                        <p className="text-[8px] text-center text-rose-500 font-extrabold mt-2 uppercase tracking-wider">
                          Disabled for Admin roles
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 pt-6">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white text-slate-600 transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-[10px] font-bold text-slate-550 uppercase tracking-widest">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white text-slate-600 transition-colors"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        )}
      </section>

      {/* FOOTER */}
      <footer className="bg-slate-900 text-slate-400 py-12 px-6 relative z-10 border-t border-slate-800">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-5 gap-8">
          <div className="col-span-2 space-y-3">
            <div className="flex items-center space-x-2">
              <span className="h-6 w-6 rounded-lg bg-gradient-to-tr from-[#6366F1] to-[#8B5CF6] text-white flex items-center justify-center font-extrabold text-[10px] shadow-sm">
                S
              </span>
              <span className="font-extrabold text-white text-xs uppercase tracking-wider">
                SubManage
              </span>
            </div>
            <p className="text-[10px] text-slate-500 leading-relaxed max-w-xs">
              SaaS recurring subscription management platform and administrative workspace client.
            </p>
            <p className="text-[9px] text-slate-600 pt-2">
              © 2026 SubManage, Inc. All rights reserved.
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-[10px] font-bold text-white uppercase tracking-wider">Product</p>
            <ul className="space-y-1 text-[10px] text-slate-500 font-semibold">
              <li><a href="#features" className="hover:text-slate-350">Features</a></li>
              <li><a href="#pricing" className="hover:text-slate-350">Pricing</a></li>
            </ul>
          </div>

          <div className="space-y-2">
            <p className="text-[10px] font-bold text-white uppercase tracking-wider">Developers</p>
            <ul className="space-y-1 text-[10px] text-slate-500 font-semibold">
              <li><a href="#features" className="hover:text-slate-350">Entitlements</a></li>
              <li><a href="#pricing" className="hover:text-slate-350">Webhooks</a></li>
            </ul>
          </div>

          <div className="space-y-2">
            <p className="text-[10px] font-bold text-white uppercase tracking-wider">Company</p>
            <ul className="space-y-1 text-[10px] text-slate-500 font-semibold">
              <li><a href="#features" className="hover:text-slate-350">About Us</a></li>
              <li><a href="#pricing" className="hover:text-slate-350">Security Audit</a></li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
