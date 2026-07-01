import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../hooks/useToast';
import planService from '../services/plan.service';
import subscriptionService from '../services/subscription.service';
import statsService from '../services/stats.service';
import type { Plan, Subscription, PublicStats } from '../types';
import { Button } from '../components/ui/Button';
import { 
  Check, 
  Sparkles, 
  ArrowRight, 
  CreditCard, 
  BarChart3, 
  Layers, 
  Users, 
  AlertCircle
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

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-indigo-500 selection:text-white relative overflow-x-hidden font-sans">
      {/* Subtle light background blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] rounded-full bg-indigo-200/25 blur-[120px] pointer-events-none z-0" />
      <div className="absolute top-[40%] right-[-10%] w-[500px] h-[500px] rounded-full bg-purple-200/20 blur-[100px] pointer-events-none z-0" />
      <div className="absolute bottom-[5%] left-[-5%] w-[450px] h-[450px] rounded-full bg-sky-200/30 blur-[110px] pointer-events-none z-0" />

      {/* Grid Overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] bg-[size:32px_32px] opacity-70 pointer-events-none z-0" />

      {/* TOP HEADER */}
      <header className="sticky top-0 z-[1000] backdrop-blur-md bg-slate-50/70 border-b border-slate-200/50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="h-7 w-7 rounded-lg bg-slate-900 text-white flex items-center justify-center font-extrabold text-sm shadow-md shadow-indigo-900/10">
              S
            </span>
            <span className="font-extrabold tracking-tight text-lg text-slate-900 uppercase">
              Subscripto
            </span>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-8 text-sm font-semibold text-slate-600">
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
                    className="absolute top-full right-[-50px] mt-2 w-64 bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xl z-[1001] text-left cursor-default"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="space-y-4">
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Documentation</p>
                        <a href="#" onClick={(e) => e.preventDefault()} className="block mt-1.5 text-xs font-semibold text-slate-800 hover:text-indigo-650 transition-colors">
                          Getting Started Guide
                        </a>
                        <p className="text-[10px] text-slate-400 mt-0.5">Integrate Subscripto in under 5 minutes</p>
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
                <Button className="rounded-full bg-slate-900 text-white hover:bg-slate-800 text-xs px-5 py-2.5 font-bold shadow-md shadow-slate-950/10">
                  Go to Dashboard
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/login" className="text-sm font-bold text-slate-600 hover:text-slate-950 transition-colors px-2 py-1">
                  Sign In
                </Link>
                <Link to="/login">
                  <Button className="rounded-full bg-slate-900 text-white hover:bg-slate-800 text-xs px-5 py-2.5 font-bold shadow-md shadow-slate-950/10">
                    Book a Demo
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative z-10 pt-32 pb-24 overflow-hidden bg-gradient-to-b from-white to-slate-50/50">
        <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] bg-[size:32px_32px] opacity-40 pointer-events-none -z-10" />

        {/* Floating Abstract UI Background (behind text) */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-6xl h-full pointer-events-none -z-10">
           <motion.div animate={{ y: [0, -20, 0] }} transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }} className="absolute top-[10%] left-[10%] w-64 h-64 bg-indigo-100 rounded-full blur-3xl opacity-50" />
           <motion.div animate={{ y: [0, 30, 0] }} transition={{ repeat: Infinity, duration: 8, ease: "easeInOut" }} className="absolute bottom-[20%] right-[10%] w-72 h-72 bg-purple-100 rounded-full blur-3xl opacity-50" />
           
           {/* Abstract floating UI cards */}
           <motion.div 
             animate={{ y: [0, 15, 0], rotate: [0, -2, 0] }} 
             transition={{ repeat: Infinity, duration: 7, ease: "easeInOut" }}
             className="absolute top-[20%] left-[5%] w-48 h-32 bg-white/40 backdrop-blur-md border border-slate-200/50 rounded-2xl shadow-xl hidden lg:block"
           />
           <motion.div 
             animate={{ y: [0, -25, 0], rotate: [0, 3, 0] }} 
             transition={{ repeat: Infinity, duration: 9, ease: "easeInOut" }}
             className="absolute top-[30%] right-[5%] w-56 h-40 bg-white/40 backdrop-blur-md border border-slate-200/50 rounded-2xl shadow-xl hidden lg:block"
           />
        </div>

        <div className="max-w-7xl mx-auto px-6 text-center space-y-8 relative z-20">
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-1.5 bg-indigo-50/50 backdrop-blur-sm border border-indigo-100 rounded-full px-4 py-1.5 text-xs font-semibold text-indigo-600 shadow-sm"
          >
            <Sparkles className="h-3.5 w-3.5" /> Introducing Version 2.0
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
            className="text-6xl md:text-8xl font-black text-slate-900 tracking-tight leading-[1.05]"
          >
            Manage Every Subscription.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-900 to-slate-400">Beautifully.</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}
            className="text-xl text-slate-500 leading-relaxed max-w-2xl mx-auto"
          >
            Centralize management, automate renewals, and optimize pricing with the most intuitive platform for growing businesses.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row justify-center gap-4 pt-4"
          >
            <a href="#pricing">
              <Button className="rounded-2xl bg-slate-900 text-white hover:bg-slate-800 text-base px-10 py-7 font-bold shadow-xl shadow-slate-900/10 w-full sm:w-auto hover:-translate-y-0.5 transition-transform">
                Start Free Trial
              </Button>
            </a>
            <a href="#features">
              <Button variant="outline" className="rounded-2xl border-slate-200 hover:bg-slate-50 text-base px-10 py-7 font-bold shadow-sm w-full sm:w-auto hover:-translate-y-0.5 transition-transform bg-white/50 backdrop-blur-sm">
                Book a Demo
              </Button>
            </a>
          </motion.div>
        </div>
      </section>

      {/* TRUSTED BY LOGO BAR */}
      <section className="bg-white py-12 border-y border-slate-100 relative z-10">
        <div className="max-w-7xl mx-auto px-6 text-center space-y-6">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Trusted by teams using</p>
          <div className="flex flex-wrap justify-center items-center gap-x-16 gap-y-8 opacity-40 grayscale hover:grayscale-0 transition-all duration-700 cursor-default">
            <span className="text-2xl font-black text-slate-900 tracking-tighter">NETFLIX</span>
            <span className="text-2xl font-black text-slate-900 tracking-tighter">Spotify</span>
            <span className="text-2xl font-bold text-slate-900 tracking-tight">Adobe</span>
            <span className="text-2xl font-black text-slate-900 tracking-tight lowercase">slack</span>
            <span className="text-2xl font-black text-slate-900 tracking-tight lowercase">stripe</span>
          </div>
        </div>
      </section>

      {/* BENTO DASHBOARD PREVIEW & FEATURES */}
      <section id="features" className="max-w-7xl mx-auto px-6 py-24 space-y-16">
        <div className="text-center space-y-3 max-w-xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-black tracking-tight text-slate-900">
            A dashboard that works for you
          </h2>
          <p className="text-slate-500 text-base">
            Everything you need to orchestrate recurring billing models, in a beautiful bento grid layout.
          </p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 max-w-6xl mx-auto auto-rows-[minmax(180px,auto)]">
          
          {/* Large Revenue Chart (Spans 8 columns, 2 rows) */}
          <div className="md:col-span-8 md:row-span-2 bg-white rounded-3xl p-8 border border-slate-200/60 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
            <div className="flex justify-between items-start mb-6">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Revenue Overview</p>
                <h3 className="text-3xl font-black text-slate-900 mt-1">$124,500<span className="text-sm text-emerald-500 ml-2">↑ 14%</span></h3>
              </div>
              <div className="bg-slate-50 rounded-lg p-1 flex gap-1">
                 <span className="text-[10px] font-bold px-2 py-1 bg-white shadow-sm rounded text-slate-800">12M</span>
                 <span className="text-[10px] font-bold px-2 py-1 text-slate-400 cursor-pointer hover:text-slate-600">30D</span>
                 <span className="text-[10px] font-bold px-2 py-1 text-slate-400 cursor-pointer hover:text-slate-600">7D</span>
              </div>
            </div>
            {/* Smooth chart drawing mockup */}
            <div className="absolute bottom-0 left-0 w-full h-48 pointer-events-none">
              <svg className="w-full h-full" viewBox="0 0 100 40" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="bentoGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path d="M 0 40 L 0 30 Q 15 25 25 30 T 50 15 T 75 20 T 100 5 L 100 40 Z" fill="url(#bentoGrad)" />
                <motion.path 
                  initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} transition={{ duration: 2, ease: "easeOut" }} viewport={{ once: true }}
                  d="M 0 30 Q 15 25 25 30 T 50 15 T 75 20 T 100 5" fill="none" stroke="#8b5cf6" strokeWidth="2" 
                />
              </svg>
            </div>
          </div>

          {/* AI Insights Card (Spans 4 columns) */}
          <div className="md:col-span-4 md:row-span-1 bg-gradient-to-br from-indigo-900 to-slate-900 rounded-3xl p-6 shadow-lg text-white flex flex-col justify-between relative overflow-hidden group hover:shadow-indigo-900/20 hover:shadow-2xl transition-all">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 blur-2xl rounded-full group-hover:bg-indigo-500/30 transition-colors" />
            <div className="relative z-10">
              <div className="inline-flex items-center gap-1.5 bg-white/10 rounded-full px-2.5 py-1 text-[10px] font-bold text-indigo-200 mb-3 backdrop-blur-md border border-white/5">
                ✨ AI Insights
              </div>
              <p className="text-sm font-medium text-slate-200 leading-relaxed">
                Your churn risk increased <span className="text-rose-400 font-bold">8%</span> this week. <br/>
                3 subscriptions renew tomorrow. <br/>
                Potential savings: <span className="text-emerald-400 font-bold">$1,240</span>.
              </p>
            </div>
            <button className="relative z-10 text-[11px] font-bold text-indigo-300 hover:text-white transition-colors text-left mt-4 inline-flex items-center gap-1 w-fit">
              [ View Suggestions ] <ArrowRight className="h-3 w-3" />
            </button>
          </div>

          {/* Medium Subscription Summary (Spans 4 columns) */}
          <div className="md:col-span-4 md:row-span-1 bg-white rounded-3xl p-6 border border-slate-200/60 shadow-sm flex flex-col justify-center items-center text-center group hover:shadow-md transition-all">
             <div className="h-12 w-12 rounded-2xl bg-sky-50 text-sky-500 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
               <Layers className="h-6 w-6" />
             </div>
             <h4 className="text-2xl font-black text-slate-900">1,204</h4>
             <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mt-1">Active Subscribers</p>
          </div>

          {/* Activity Feed / Visual Timeline (Spans 4 columns, 2 rows) */}
          <div className="md:col-span-4 md:row-span-2 bg-white rounded-3xl p-6 border border-slate-200/60 shadow-sm group hover:shadow-md transition-all hidden md:block">
             <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">Recent Activity</p>
             <div className="space-y-6 relative before:absolute before:inset-0 before:ml-[11px] before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
                <div className="relative flex items-center group is-active">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full border border-white bg-emerald-100 text-emerald-600 shadow shrink-0 z-10">
                    <Check className="h-3 w-3" />
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 ml-4 group-hover:scale-[1.02] transition-transform w-full">
                    <p className="text-[10px] font-bold text-slate-800">Subscription renewed</p>
                    <p className="text-[9px] text-slate-400 mt-0.5">Spotify Premium</p>
                  </div>
                </div>

                <div className="relative flex items-center group is-active">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full border border-white bg-indigo-100 text-indigo-600 shadow shrink-0 z-10">
                    <CreditCard className="h-3 w-3" />
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 ml-4 group-hover:scale-[1.02] transition-transform w-full">
                    <p className="text-[10px] font-bold text-slate-800">Payment received</p>
                    <p className="text-[9px] text-slate-400 mt-0.5">$899.00 Enterprise</p>
                  </div>
                </div>

                <div className="relative flex items-center group is-active">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full border border-white bg-amber-100 text-amber-600 shadow shrink-0 z-10">
                    <AlertCircle className="h-3 w-3" />
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 ml-4 group-hover:scale-[1.02] transition-transform w-full">
                    <p className="text-[10px] font-bold text-slate-800">Trial expiring</p>
                    <p className="text-[9px] text-slate-400 mt-0.5">3 users in 2 days</p>
                  </div>
                </div>

                <div className="relative flex items-center group is-active">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full border border-white bg-sky-100 text-sky-600 shadow shrink-0 z-10">
                    <Users className="h-3 w-3" />
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 ml-4 group-hover:scale-[1.02] transition-transform w-full">
                    <p className="text-[10px] font-bold text-slate-800">New customer added</p>
                    <p className="text-[9px] text-slate-400 mt-0.5">Acme Corp signed up</p>
                  </div>
                </div>
             </div>
          </div>

          {/* Compact Upcoming Renewals (Spans 4 columns) */}
          <div className="md:col-span-4 md:row-span-1 bg-white rounded-3xl p-6 border border-slate-200/60 shadow-sm flex flex-col justify-between group hover:shadow-md transition-all">
             <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Upcoming Renewals</p>
             <div className="space-y-3">
               <div className="flex items-center justify-between text-sm">
                 <div className="flex items-center gap-2">
                   <div className="h-6 w-6 rounded bg-red-50 text-red-500 flex items-center justify-center font-bold text-[10px]">A</div>
                   <span className="font-semibold text-slate-800 text-xs">Adobe Creative Cloud</span>
                 </div>
                 <span className="font-bold text-slate-900 text-[11px]">Tomorrow</span>
               </div>
               <div className="flex items-center justify-between text-sm">
                 <div className="flex items-center gap-2">
                   <div className="h-6 w-6 rounded bg-green-50 text-green-500 flex items-center justify-center font-bold text-[10px]">S</div>
                   <span className="font-semibold text-slate-800 text-xs">Spotify Family</span>
                 </div>
                 <span className="font-bold text-slate-500 text-[11px]">In 3 days</span>
               </div>
             </div>
          </div>

          {/* Calendar Widget (Spans 4 columns) */}
          <div className="md:col-span-4 md:row-span-1 bg-white rounded-3xl p-6 border border-slate-200/60 shadow-sm flex items-center justify-center relative overflow-hidden group hover:shadow-md transition-all">
             <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] bg-[size:12px_12px] opacity-30" />
             <div className="relative z-10 text-center">
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Current Cycle</p>
               <h4 className="text-xl font-black text-slate-900">July 2026</h4>
               <p className="text-[11px] font-bold text-indigo-500 mt-1">14 Days Remaining</p>
             </div>
          </div>

        </div>
      </section>

      {/* INTERACTIVE DEVICE MOCKUPS */}
      <section className="py-24 bg-slate-50/50 border-y border-slate-200/50 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 text-center space-y-16">
          <div className="space-y-3 max-w-xl mx-auto relative z-20">
            <h2 className="text-3xl md:text-5xl font-black tracking-tight text-slate-900">
              Beautiful on every device
            </h2>
            <p className="text-slate-500 text-base">
              Manage subscriptions seamlessly across desktop, tablet, and mobile with our responsive premium design.
            </p>
          </div>

          <div className="relative h-[400px] sm:h-[600px] flex items-center justify-center perspective-[1200px]">
            {/* Desktop Mockup */}
            <motion.div 
              animate={{ y: [0, -10, 0] }} transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
              className="absolute z-10 w-full max-w-[800px] h-[300px] sm:h-[450px] bg-white rounded-t-xl rounded-b-md border-[6px] border-slate-800 shadow-2xl overflow-hidden hidden sm:block"
            >
               <div className="h-6 bg-slate-800 flex items-center px-3 gap-1.5 border-b border-slate-700">
                  <div className="h-2 w-2 rounded-full bg-red-400" />
                  <div className="h-2 w-2 rounded-full bg-amber-400" />
                  <div className="h-2 w-2 rounded-full bg-green-400" />
               </div>
               {/* Minimal Dashboard image representation */}
               <div className="w-full h-full bg-slate-50 p-6 flex gap-4">
                  <div className="w-48 bg-white border border-slate-200 rounded-xl h-full shadow-sm" />
                  <div className="flex-1 flex flex-col gap-4">
                     <div className="h-16 bg-white border border-slate-200 rounded-xl w-full shadow-sm" />
                     <div className="flex-1 bg-white border border-slate-200 rounded-xl w-full flex items-center justify-center shadow-sm">
                        <BarChart3 className="h-16 w-16 text-slate-200" />
                     </div>
                  </div>
               </div>
            </motion.div>

            {/* Tablet Mockup */}
            <motion.div 
              animate={{ y: [0, 15, 0] }} transition={{ repeat: Infinity, duration: 7, ease: "easeInOut", delay: 1 }}
              className="absolute z-20 -left-4 sm:-left-10 lg:left-10 bottom-0 sm:bottom-10 w-[200px] sm:w-[300px] h-[300px] sm:h-[400px] bg-white rounded-2xl border-8 border-slate-800 shadow-2xl overflow-hidden"
            >
               <div className="w-full h-full bg-slate-50 p-4 flex flex-col gap-3">
                  <div className="h-12 bg-white border border-slate-200 rounded-xl w-full shadow-sm" />
                  <div className="flex-1 bg-white border border-slate-200 rounded-xl w-full flex items-center justify-center shadow-sm">
                     <Layers className="h-10 w-10 text-slate-200" />
                  </div>
                  <div className="h-24 bg-white border border-slate-200 rounded-xl w-full shadow-sm" />
               </div>
            </motion.div>

            {/* Mobile Mockup */}
            <motion.div 
              animate={{ y: [0, -15, 0] }} transition={{ repeat: Infinity, duration: 5, ease: "easeInOut", delay: 2 }}
              className="absolute z-30 -right-4 sm:-right-5 lg:right-20 -bottom-10 w-[140px] sm:w-[180px] h-[280px] sm:h-[360px] bg-white rounded-[2rem] border-[10px] border-slate-800 shadow-2xl overflow-hidden"
            >
               <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-4 bg-slate-800 rounded-b-xl z-40" />
               <div className="w-full h-full bg-slate-50 p-3 pt-6 flex flex-col gap-2">
                  <div className="h-10 bg-white border border-slate-200 rounded-xl w-full shadow-sm" />
                  <div className="flex-1 bg-white border border-slate-200 rounded-xl w-full flex flex-col gap-2 p-2 shadow-sm">
                     <div className="h-8 bg-slate-100 rounded" />
                     <div className="h-8 bg-slate-100 rounded" />
                     <div className="h-8 bg-slate-100 rounded" />
                  </div>
               </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* PRICING PLANS CATALOG SECTION */}
      <section id="pricing" className="max-w-7xl mx-auto px-6 py-32 space-y-16">
        <div className="text-center space-y-4 max-w-xl mx-auto">
          <div className="inline-flex items-center gap-1.5 bg-indigo-50 border border-indigo-100 rounded-full px-3.5 py-1 text-xs font-semibold text-indigo-600">
            <CreditCard className="h-3.5 w-3.5" /> Transparent Pricing
          </div>
          <h2 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900">
            Choose your perfect plan
          </h2>
          <p className="text-slate-500 text-base">
            Simple, scalable pricing that grows with your business. No hidden fees.
          </p>
        </div>

        {loadingPlans ? (
          <div className="text-center py-10 text-slate-400 text-xs font-semibold">
            <div className="animate-pulse flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
              Loading subscription catalog...
            </div>
          </div>
        ) : plans.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-slate-200 bg-slate-50 rounded-3xl max-w-lg mx-auto">
            <p className="text-slate-400 text-sm font-semibold">No plans have been published by admins yet.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto items-center">
            {plans.map((plan) => {
              const alreadySubscribed = isSubscribedToPlan(plan._id);
              const isPro = plan.name.toLowerCase().includes('pro') || plan.name.toLowerCase().includes('standard');
              
              let btnLabel = 'Subscribe';
              if (alreadySubscribed) {
                btnLabel = 'Active Subscription ✓';
              }

              return (
                <div 
                  key={plan._id} 
                  className={`bg-white rounded-[2.5rem] p-8 md:p-10 relative flex flex-col justify-between transition-all duration-300 min-h-[460px] group ${
                    isPro 
                      ? 'ring-4 ring-indigo-500 shadow-2xl shadow-indigo-500/20 md:scale-105 z-10' 
                      : 'border border-slate-200 hover:shadow-xl hover:shadow-slate-200/50 hover:border-slate-300'
                  }`}
                >
                  {isPro && (
                    <span className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-4 py-1.5 text-[10px] font-black tracking-widest uppercase shadow-lg flex items-center gap-1.5">
                      <Sparkles className="h-3 w-3" /> Recommended
                    </span>
                  )}

                  <div className="space-y-8">
                    <div className="space-y-2">
                      <h3 className={`text-2xl font-black ${isPro ? 'text-indigo-600' : 'text-slate-900'}`}>{plan.name}</h3>
                      <p className="text-sm text-slate-500 leading-relaxed min-h-[40px] font-medium">{plan.description}</p>
                    </div>

                    <div className="flex items-baseline text-slate-900">
                      <span className="text-6xl font-black tracking-tight">
                        ${(plan.price / 100).toFixed(2)}
                      </span>
                      <span className="ml-2 text-sm text-slate-400 font-bold">
                        /{plan.billingCycle === 'ANNUAL' ? 'yr' : 'mo'}
                      </span>
                    </div>

                    <ul className="space-y-4 text-sm text-slate-600 font-medium">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-3">
                          <Check className={`h-5 w-5 shrink-0 mt-0.5 ${isPro ? 'text-indigo-500' : 'text-emerald-500'}`} />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>

                    {/* customizable billing months */}
                    {plan.billingCycle === 'MONTHLY' && !alreadySubscribed && (
                      <div className="mt-6 flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Duration</span>
                        <select
                          value={selectedMonths[plan._id] || 1}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setSelectedMonths((prev) => ({ ...prev, [plan._id]: val }));
                          }}
                          className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-bold cursor-pointer shadow-sm"
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

                  <div className="mt-10">
                    <Button 
                      onClick={() => handleSubscribe(plan)}
                      className={`w-full py-4 text-sm font-black rounded-2xl transition-all ${
                        alreadySubscribed 
                          ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200/50' 
                          : isPro
                            ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 hover:-translate-y-0.5'
                            : 'bg-slate-900 text-white hover:bg-slate-800 shadow-lg shadow-slate-900/10 hover:-translate-y-0.5'
                      }`}
                      loading={submittingId === plan._id}
                      disabled={alreadySubscribed || !!(user && user.role !== 'USER')}
                    >
                      {btnLabel}
                    </Button>
                    {user && user.role !== 'USER' && (
                      <p className="text-[10px] text-center text-rose-500 font-bold mt-3">
                        Only client user roles can subscribe
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* FOOTER (DARK BLUE/BLACK) */}
      <footer className="bg-[#0b0f19] text-slate-400 py-16 px-6 relative z-10 border-t border-slate-800">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-5 gap-10">
          {/* Brand block */}
          <div className="col-span-2 space-y-4">
            <div className="flex items-center space-x-2">
              <span className="h-6 w-6 rounded bg-indigo-600 text-white flex items-center justify-center font-extrabold text-xs shadow-md">
                S
              </span>
              <span className="font-extrabold text-white text-sm uppercase tracking-wide">
                Subscripto
              </span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed max-w-sm">
              Professional and commercially available subscription management system. Designed for companies looking to optimize recurring cash flows.
            </p>
            <p className="text-[10px] text-slate-600 pt-4">
              © 2026 Subscripto, Inc. All rights reserved.
            </p>
          </div>

          {/* Links 1 */}
          <div className="space-y-3">
            <p className="text-xs font-extrabold text-white uppercase tracking-wider">Home</p>
            <ul className="space-y-2 text-xs text-slate-500">
              <li><a href="#features" className="hover:text-slate-300">Features</a></li>
              <li><a href="#pricing" className="hover:text-slate-300">Pricing</a></li>
              <li><a href="#dashboard-preview" className="hover:text-slate-300">Integrations</a></li>
            </ul>
          </div>

          {/* Links 2 */}
          <div className="space-y-3">
            <p className="text-xs font-extrabold text-white uppercase tracking-wider">Resources</p>
            <ul className="space-y-2 text-xs text-slate-500">
              <li><a href="#features" className="hover:text-slate-300">Documentation</a></li>
              <li><a href="#pricing" className="hover:text-slate-300">Guides</a></li>
              <li><a href="#dashboard-preview" className="hover:text-slate-300">Support</a></li>
            </ul>
          </div>

          {/* Links 3 */}
          <div className="space-y-3">
            <p className="text-xs font-extrabold text-white uppercase tracking-wider">Footer</p>
            <ul className="space-y-2 text-xs text-slate-500">
              <li><a href="#features" className="hover:text-slate-300">About Us</a></li>
              <li><a href="#pricing" className="hover:text-slate-300">Contact Us</a></li>
              <li><a href="#dashboard-preview" className="hover:text-slate-300">Legal Policies</a></li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
