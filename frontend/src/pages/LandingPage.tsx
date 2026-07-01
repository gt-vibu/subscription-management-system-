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
  const [selectedCycle, setSelectedCycle] = useState<'MONTHLY' | 'ANNUAL'>('MONTHLY');

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

  return (
    <div className="min-h-screen bg-[#F7F8FC] text-slate-900 selection:bg-indigo-500 selection:text-white relative overflow-x-hidden font-sans">
      {/* Drifting Aurora Gradient Blobs */}
      <div className="absolute top-[-10%] left-[-15%] w-[800px] h-[800px] rounded-full bg-gradient-to-tr from-[#6D5DF6]/12 to-[#4F8CFF]/8 blur-[130px] pointer-events-none z-0 animate-drift" />
      <div className="absolute top-[30%] right-[-15%] w-[700px] h-[700px] rounded-full bg-gradient-to-tr from-[#F56FFF]/8 to-[#4FD9FF]/8 blur-[110px] pointer-events-none z-0 animate-drift-reverse" />
      <div className="absolute bottom-[10%] left-[-5%] w-[600px] h-[600px] rounded-full bg-gradient-to-tr from-[#7DF9C8]/10 to-[#FFD56A]/6 blur-[120px] pointer-events-none z-0 animate-drift" />

      {/* Luxury Grid Overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(rgba(109,93,246,0.06)_1.5px,transparent_1.5px)] bg-[size:32px_32px] opacity-80 pointer-events-none z-0" />

      {/* FLOATING 3D GLASS OBJECTS */}
      {/* Glass Sphere 1 */}
      <div className="absolute top-[18%] left-[7%] w-16 h-16 rounded-full bg-gradient-to-tr from-white/30 to-white/10 backdrop-blur-md border border-white/40 shadow-[inset_0_4px_12px_rgba(255,255,255,0.4),_0_12px_28px_rgba(0,0,0,0.04)] animate-float pointer-events-none z-10 hidden md:block" />
      
      {/* Crystal rotating cube */}
      <div className="absolute right-[10%] top-[15%] cube-container pointer-events-none z-10 hidden lg:block">
        <div className="cube">
          <div className="cube-face cube-face-front bg-purple-500/10 border-purple-500/25"></div>
          <div className="cube-face cube-face-back bg-purple-500/10 border-purple-500/25"></div>
          <div className="cube-face cube-face-right bg-purple-500/10 border-purple-500/25"></div>
          <div className="cube-face cube-face-left bg-purple-500/10 border-purple-500/25"></div>
          <div className="cube-face cube-face-top bg-purple-500/10 border-purple-500/25"></div>
          <div className="cube-face cube-face-bottom bg-purple-500/10 border-purple-500/25"></div>
        </div>
      </div>

      {/* Floating premium rings */}
      <div className="absolute top-[48%] left-[4%] w-24 h-24 rounded-full border-[10px] border-indigo-500/8 animate-float pointer-events-none z-10 hidden xl:block" />
      
      {/* Glass Credit Card */}
      <div className="absolute bottom-[28%] right-[5%] w-28 h-18 rounded-2xl bg-gradient-to-br from-white/20 to-white/5 backdrop-blur-lg border border-white/35 shadow-xl rotate-[-8deg] animate-float-slow pointer-events-none z-10 hidden lg:block">
        <div className="p-3 flex flex-col justify-between h-full">
          <div className="flex justify-between items-start">
            <div className="w-5 h-4 bg-white/25 rounded-md" />
            <div className="w-4 h-4 rounded-full bg-indigo-500/20" />
          </div>
          <div className="w-16 h-1.5 bg-white/25 rounded" />
        </div>
      </div>

      {/* TOP HEADER */}
      <header className="sticky top-0 z-[1000] backdrop-blur-xl bg-white/60 border-b border-slate-200/40 px-6 py-4 transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2">
            <span className="h-8 w-8 rounded-xl bg-gradient-to-tr from-[#6D5DF6] to-[#4F8CFF] text-white flex items-center justify-center font-extrabold text-sm shadow-lg shadow-indigo-500/25">
              S
            </span>
            <span className="font-extrabold tracking-tight text-lg text-slate-900 uppercase">
              SubFlow
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
                    className="absolute top-full right-[-50px] mt-2 w-64 bg-white/95 backdrop-blur-md border border-slate-200/80 rounded-2xl p-4 shadow-2xl z-[1001] text-left cursor-default"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="space-y-4">
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Documentation</p>
                        <a href="#" onClick={(e) => e.preventDefault()} className="block mt-1.5 text-xs font-semibold text-slate-800 hover:text-indigo-600 transition-colors">
                          Getting Started Guide
                        </a>
                        <p className="text-[10px] text-slate-400 mt-0.5">Integrate SubFlow in under 5 minutes</p>
                      </div>
                      
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Developer Reference</p>
                        <a href="#" onClick={(e) => e.preventDefault()} className="block mt-1.5 text-xs font-semibold text-slate-800 hover:text-indigo-600 transition-colors">
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
                <Button className="rounded-2xl bg-indigo-650 hover:bg-indigo-700 text-white text-xs px-6 py-2.5 font-bold shadow-lg shadow-indigo-650/15 hover:-translate-y-0.5 transition-all">
                  Go to Dashboard
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/login" className="text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-slate-950 transition-colors px-2 py-1">
                  Sign In
                </Link>
                <Link to="/login">
                  <Button className="rounded-2xl bg-[#0b0f19] text-white hover:bg-slate-900 text-xs px-6 py-2.5 font-bold shadow-lg shadow-slate-950/10 hover:-translate-y-0.5 transition-all">
                    Book a Demo
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative z-10 pt-28 pb-20 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 text-center space-y-8 relative z-20">
          <motion.div 
            initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-1.5 bg-white/70 backdrop-blur-md border border-indigo-100 rounded-full px-4 py-1.5 text-xs font-bold text-indigo-600 shadow-sm"
          >
            <Sparkles className="h-3.5 w-3.5 text-indigo-500 animate-pulse" /> Introducing SubFlow 2.0
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
            className="text-5xl md:text-7xl font-extrabold text-slate-900 tracking-tight leading-[1.08] max-w-4xl mx-auto"
          >
            Manage Every Subscription.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#6D5DF6] via-[#4F8CFF] to-[#F56FFF]">
              Effortlessly.
            </span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg text-slate-550 leading-relaxed max-w-2xl mx-auto font-medium"
          >
            Centralize your recurring billing models, orchestrate global billing schedules, and optimize system revenue with Stripe-level fidelity.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row justify-center gap-4 pt-4"
          >
            <a href="#pricing">
              <Button className="rounded-2xl bg-indigo-650 text-white hover:bg-indigo-700 text-sm px-8 py-6 font-bold shadow-xl shadow-indigo-600/15 w-full sm:w-auto hover:-translate-y-1 hover:shadow-2xl transition-all">
                Start Free Trial
              </Button>
            </a>
            <a href="#features">
              <Button variant="outline" className="rounded-2xl border-slate-200 hover:bg-slate-50 text-sm px-8 py-6 font-bold shadow-sm w-full sm:w-auto hover:-translate-y-1 transition-all bg-white/70 backdrop-blur-md">
                Book a Demo
              </Button>
            </a>
          </motion.div>
        </div>
      </section>

      {/* TRUSTED BY LOGO BAR */}
      <section className="py-10 bg-white/40 border-y border-slate-200/50 backdrop-blur-md relative z-10">
        <div className="max-w-7xl mx-auto px-6 text-center space-y-4">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Powering subscription teams globally</p>
          <div className="flex flex-wrap justify-center items-center gap-x-14 gap-y-6 opacity-45 grayscale hover:grayscale-0 transition-all duration-700 cursor-default">
            <span className="text-xl font-black text-slate-900 tracking-tighter">NETFLIX</span>
            <span className="text-xl font-black text-slate-900 tracking-tighter">Spotify</span>
            <span className="text-xl font-bold text-slate-900 tracking-tight">Adobe</span>
            <span className="text-xl font-black text-slate-900 tracking-tight lowercase">slack</span>
            <span className="text-xl font-black text-slate-900 tracking-tight lowercase">stripe</span>
          </div>
        </div>
      </section>

      {/* FEATURES / BENTO SECTION */}
      <section id="features" className="max-w-7xl mx-auto px-6 py-24 space-y-16">
        <div className="text-center space-y-3 max-w-xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-slate-900">
            Engineered for growth
          </h2>
          <p className="text-slate-550 text-base font-medium">
            Everything you need to run high-performance SaaS recurring cash flow models.
          </p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 max-w-6xl mx-auto auto-rows-[minmax(180px,auto)]">
          {/* Revenue Card (Spans 8 cols, 2 rows) */}
          <div className="md:col-span-8 md:row-span-2 bg-white rounded-[2rem] p-8 border border-slate-200/60 shadow-sm relative overflow-hidden group hover:shadow-xl hover:shadow-indigo-500/5 transition-all">
            <div className="flex justify-between items-start mb-6">
              <div>
                <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Revenue Overview</p>
                <h3 className="text-3xl font-black text-slate-900 mt-1">$124,500<span className="text-xs text-emerald-500 ml-2 font-extrabold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">↑ 14%</span></h3>
              </div>
              <div className="bg-slate-100 rounded-xl p-1 flex gap-1 border border-slate-200/50">
                 <span className="text-[10px] font-extrabold px-2 py-1 bg-white shadow-sm rounded-lg text-slate-800">12M</span>
                 <span className="text-[10px] font-extrabold px-2 py-1 text-slate-400 cursor-pointer hover:text-slate-650 transition-colors">30D</span>
                 <span className="text-[10px] font-extrabold px-2 py-1 text-slate-400 cursor-pointer hover:text-slate-650 transition-colors">7D</span>
              </div>
            </div>
            
            {/* Smooth chart drawing */}
            <div className="absolute bottom-0 left-0 w-full h-44 pointer-events-none">
              <svg className="w-full h-full" viewBox="0 0 100 40" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="bentoGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6D5DF6" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#6D5DF6" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path d="M 0 40 L 0 30 Q 15 23 25 28 T 50 12 T 75 18 T 100 3 L 100 40 Z" fill="url(#bentoGrad)" />
                <motion.path 
                  initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} transition={{ duration: 1.8, ease: "easeOut" }} viewport={{ once: true }}
                  d="M 0 30 Q 15 23 25 28 T 50 12 T 75 18 T 100 3" fill="none" stroke="#6D5DF6" strokeWidth="2.5" 
                />
              </svg>
            </div>
          </div>

          {/* AI Insights Card */}
          <div className="md:col-span-4 md:row-span-1 bg-gradient-to-br from-indigo-950 to-slate-900 rounded-[2rem] p-6 shadow-xl text-white flex flex-col justify-between relative overflow-hidden group hover:shadow-2xl hover:shadow-indigo-500/10 transition-all">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#6D5DF6]/20 blur-2xl rounded-full group-hover:bg-[#6D5DF6]/30 transition-colors" />
            <div className="relative z-10 space-y-3">
              <div className="inline-flex items-center gap-1.5 bg-white/10 rounded-full px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-wider text-indigo-200 mb-1 backdrop-blur-md border border-white/5">
                ✨ AI Analytics
              </div>
              <p className="text-xs font-medium text-slate-200 leading-relaxed">
                Platform churn dropped <span className="text-emerald-400 font-extrabold">3.2%</span>.<br/>
                Expected cash flow: <span className="text-indigo-300 font-extrabold">+$12.5k</span> next week.
              </p>
            </div>
            <button className="relative z-10 text-[10px] font-bold uppercase tracking-wider text-indigo-300 hover:text-white transition-colors text-left mt-4 inline-flex items-center gap-1 w-fit">
              View Insights <ArrowRight className="h-3 w-3" />
            </button>
          </div>

          {/* Stat Card */}
          <div className="md:col-span-4 md:row-span-1 bg-white rounded-[2rem] p-6 border border-slate-200/60 shadow-sm flex flex-col justify-center items-center text-center group hover:shadow-lg transition-all">
             <div className="h-11 w-11 rounded-2xl bg-indigo-50 text-indigo-650 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-sm">
               <Layers className="h-5 w-5" />
             </div>
             <h4 className="text-2xl font-black text-slate-900">1,204</h4>
             <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mt-1">Active Subscribers</p>
          </div>

          {/* Recent Activity */}
          <div className="md:col-span-4 md:row-span-2 bg-white rounded-[2rem] p-6 border border-slate-200/60 shadow-sm group hover:shadow-lg transition-all hidden md:block">
             <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-6">Live Events Log</p>
             <div className="space-y-4 relative before:absolute before:inset-0 before:ml-[11px] before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
                <div className="relative flex items-center group">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full border border-white bg-emerald-100 text-emerald-600 shadow shrink-0 z-10">
                    <Check className="h-3 w-3" />
                  </div>
                  <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-100 ml-3 group-hover:scale-[1.01] transition-transform w-full">
                    <p className="text-[10px] font-bold text-slate-800">Subscription renewed</p>
                    <p className="text-[9px] text-slate-400 mt-0.5">Spotify Pro Plan</p>
                  </div>
                </div>

                <div className="relative flex items-center group">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full border border-white bg-indigo-100 text-indigo-600 shadow shrink-0 z-10">
                    <CreditCard className="h-3 w-3" />
                  </div>
                  <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-100 ml-3 group-hover:scale-[1.01] transition-transform w-full">
                    <p className="text-[10px] font-bold text-slate-800">Payment received</p>
                    <p className="text-[9px] text-slate-400 mt-0.5">$899.00 / Annual</p>
                  </div>
                </div>

                <div className="relative flex items-center group">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full border border-white bg-amber-100 text-amber-600 shadow shrink-0 z-10">
                    <AlertCircle className="h-3 w-3" />
                  </div>
                  <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-100 ml-3 group-hover:scale-[1.01] transition-transform w-full">
                    <p className="text-[10px] font-bold text-slate-800">Trial expiring</p>
                    <p className="text-[9px] text-slate-400 mt-0.5">3 records renew soon</p>
                  </div>
                </div>
             </div>
          </div>

          {/* Upcoming Renewals */}
          <div className="md:col-span-4 md:row-span-1 bg-white rounded-[2rem] p-6 border border-slate-200/60 shadow-sm flex flex-col justify-between group hover:shadow-lg transition-all">
             <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-4">Upcoming Renewals</p>
             <div className="space-y-3">
               <div className="flex items-center justify-between text-xs">
                 <div className="flex items-center gap-2">
                   <div className="h-6 w-6 rounded bg-red-50 text-red-500 flex items-center justify-center font-bold text-[9px]">A</div>
                   <span className="font-bold text-slate-800">Adobe Creative</span>
                 </div>
                 <span className="font-extrabold text-slate-900 bg-slate-50 border border-slate-200/60 px-1.5 py-0.5 rounded text-[10px]">Tomorrow</span>
               </div>
               <div className="flex items-center justify-between text-xs">
                 <div className="flex items-center gap-2">
                   <div className="h-6 w-6 rounded bg-green-50 text-green-500 flex items-center justify-center font-bold text-[9px]">S</div>
                   <span className="font-bold text-slate-800">Spotify Family</span>
                 </div>
                 <span className="font-extrabold text-slate-500 bg-slate-50 border border-slate-200/60 px-1.5 py-0.5 rounded text-[10px]">In 3 days</span>
               </div>
             </div>
          </div>

          {/* Calendar Widget */}
          <div className="md:col-span-4 md:row-span-1 bg-white rounded-[2rem] p-6 border border-slate-200/60 shadow-sm flex items-center justify-center relative overflow-hidden group hover:shadow-lg transition-all">
             <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] bg-[size:12px_12px] opacity-35" />
             <div className="relative z-10 text-center">
                <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest mb-0.5">Current Cycle</p>
                <h4 className="text-lg font-black text-slate-950">July 2026</h4>
                <p className="text-[10px] font-extrabold text-indigo-650 mt-1 bg-indigo-50 border border-indigo-100/50 rounded-full px-2.5 py-0.5">14 Days Remaining</p>
             </div>
          </div>
        </div>
      </section>

      {/* MOCKUP PRODUCT PREVIEW */}
      <section id="dashboard-preview" className="py-24 bg-white/40 border-y border-slate-200/40 backdrop-blur-md relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 text-center space-y-16">
          <div className="space-y-3 max-w-xl mx-auto relative z-20">
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-slate-900">
              Handcrafted UI
            </h2>
            <p className="text-slate-550 text-base font-medium">
              Seamless responsive views engineered for cross-device operational control.
            </p>
          </div>

          <div className="relative h-[350px] sm:h-[550px] flex items-center justify-center perspective-[1200px]">
            {/* Desktop Mockup */}
            <motion.div 
              animate={{ y: [0, -8, 0] }} transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
              className="absolute z-10 w-full max-w-[760px] h-[280px] sm:h-[420px] bg-white rounded-t-2xl rounded-b-lg border-[6px] border-slate-950 shadow-2xl overflow-hidden hidden sm:block"
            >
               <div className="h-7 bg-slate-950 flex items-center px-4 gap-1.5 border-b border-slate-800">
                  <div className="h-2 w-2 rounded-full bg-red-400" />
                  <div className="h-2 w-2 rounded-full bg-amber-400" />
                  <div className="h-2 w-2 rounded-full bg-green-400" />
               </div>
               {/* representational inner mockup */}
               <div className="w-full h-full bg-[#F7F8FC] p-6 flex gap-4">
                  <div className="w-40 bg-white border border-slate-200 rounded-2xl h-full shadow-sm" />
                  <div className="flex-1 flex flex-col gap-4">
                     <div className="h-12 bg-white border border-slate-200 rounded-2xl w-full shadow-sm" />
                     <div className="flex-1 bg-white border border-slate-200 rounded-2xl w-full flex items-center justify-center shadow-sm">
                        <BarChart3 className="h-12 w-12 text-[#6D5DF6]/15" />
                     </div>
                  </div>
               </div>
            </motion.div>

            {/* Tablet Mockup */}
            <motion.div 
              animate={{ y: [0, 12, 0] }} transition={{ repeat: Infinity, duration: 7, ease: "easeInOut", delay: 1 }}
              className="absolute z-20 -left-4 sm:-left-8 lg:left-12 bottom-0 sm:bottom-8 w-[190px] sm:w-[280px] h-[280px] sm:h-[370px] bg-white rounded-2xl border-8 border-slate-950 shadow-2xl overflow-hidden"
            >
               <div className="w-full h-full bg-[#F7F8FC] p-4 flex flex-col gap-3">
                  <div className="h-10 bg-white border border-slate-200 rounded-xl w-full shadow-sm" />
                  <div className="flex-1 bg-white border border-slate-200 rounded-xl w-full flex items-center justify-center shadow-sm">
                     <Layers className="h-8 w-8 text-[#6D5DF6]/15" />
                  </div>
                  <div className="h-20 bg-white border border-slate-200 rounded-xl w-full shadow-sm" />
               </div>
            </motion.div>

            {/* Mobile Mockup */}
            <motion.div 
              animate={{ y: [0, -12, 0] }} transition={{ repeat: Infinity, duration: 5, ease: "easeInOut", delay: 2 }}
              className="absolute z-30 -right-4 sm:-right-4 lg:right-16 -bottom-8 w-[130px] sm:w-[170px] h-[260px] sm:h-[340px] bg-white rounded-[2rem] border-[9px] border-slate-950 shadow-2xl overflow-hidden"
            >
               <div className="absolute top-0 left-1/2 -translate-x-1/2 w-14 h-3.5 bg-slate-950 rounded-b-xl z-40" />
               <div className="w-full h-full bg-[#F7F8FC] p-3 pt-5 flex flex-col gap-2">
                  <div className="h-8 bg-white border border-slate-200 rounded-xl w-full shadow-sm" />
                  <div className="flex-1 bg-white border border-slate-200 rounded-xl w-full flex flex-col gap-2 p-2 shadow-sm">
                     <div className="h-6 bg-slate-100 rounded" />
                     <div className="h-6 bg-slate-100 rounded" />
                  </div>
               </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* PRICING SECTION */}
      <section id="pricing" className="max-w-7xl mx-auto px-6 py-28 space-y-16">
        <div className="text-center space-y-4 max-w-xl mx-auto">
          <div className="inline-flex items-center gap-1.5 bg-indigo-50 border border-indigo-100 rounded-full px-3.5 py-1.5 text-xs font-bold text-indigo-600 shadow-sm">
            <CreditCard className="h-3.5 w-3.5 text-indigo-500" /> Subscription Pricing
          </div>
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-slate-900">
            Simple, honest plans
          </h2>
          <p className="text-slate-550 text-base font-medium">
            Dynamic monthly or annual cycles with instant 15% discount.
          </p>

          {/* Toggle switch for Monthly / Annually */}
          <div className="flex justify-center pt-4">
            <div className="flex border border-slate-200/80 rounded-[1.25rem] p-1 bg-slate-100/90 shadow-sm">
              <button
                onClick={() => setSelectedCycle('MONTHLY')}
                className={`px-5 py-2 text-xs font-bold uppercase tracking-wider rounded-xl transition-all ${
                  selectedCycle === 'MONTHLY'
                    ? 'bg-white text-slate-900 shadow border border-slate-200'
                    : 'text-slate-400 hover:text-slate-900'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setSelectedCycle('ANNUAL')}
                className={`px-5 py-2 text-xs font-bold uppercase tracking-wider rounded-xl transition-all flex items-center gap-1.5 ${
                  selectedCycle === 'ANNUAL'
                    ? 'bg-white text-slate-900 shadow border border-slate-200'
                    : 'text-slate-400 hover:text-slate-900'
                }`}
              >
                Annual
                <span className="text-[9px] bg-emerald-500 text-white font-extrabold px-1.5 py-0.5 rounded">Save 15%</span>
              </button>
            </div>
          </div>
        </div>

        {loadingPlans ? (
          <div className="text-center py-12 text-slate-400 text-xs font-semibold">
            <div className="animate-pulse flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-3 border-indigo-200 border-t-indigo-650 rounded-full animate-spin" />
              Loading subscription catalog...
            </div>
          </div>
        ) : plans.length === 0 ? (
          <div className="text-center py-14 border border-dashed border-slate-200 bg-slate-50/50 rounded-3xl max-w-lg mx-auto">
            <p className="text-slate-400 text-sm font-semibold">No available plans.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto items-stretch">
            {plans.map((plan) => {
              const alreadySubscribed = isSubscribedToPlan(plan._id);
              const isPro = plan.name.toLowerCase().includes('pro') || plan.name.toLowerCase().includes('standard');
              
              let btnLabel = 'Subscribe';
              if (alreadySubscribed) {
                btnLabel = 'Active Plan ✓';
              }

              const monthlyPrice = plan.price / 100;
              const annualPricePerMonth = monthlyPrice * 0.85;
              const annualTotal = monthlyPrice * 12 * 0.85;
              const annualRegularTotal = monthlyPrice * 12;

              return (
                <div 
                  key={plan._id} 
                  className={`bg-white rounded-[2.5rem] p-8 md:p-10 relative flex flex-col justify-between transition-all duration-300 min-h-[520px] group ${
                    isPro 
                      ? 'ring-4 ring-indigo-500/80 shadow-2xl shadow-indigo-500/25 md:scale-105 z-10' 
                      : 'border border-slate-200 hover:shadow-xl hover:border-slate-350'
                  }`}
                >
                  {isPro && (
                    <span className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-[#6D5DF6] to-[#4F8CFF] text-white px-4 py-1.5 text-[9px] font-black tracking-widest uppercase shadow-lg flex items-center gap-1">
                      <Sparkles className="h-3 w-3 animate-pulse" /> Popular
                    </span>
                  )}

                  <div className="space-y-8">
                    <div className="space-y-2">
                      <h3 className={`text-2xl font-black ${isPro ? 'text-indigo-650' : 'text-slate-900'}`}>{plan.name}</h3>
                      <p className="text-xs text-slate-500 leading-relaxed min-h-[36px] font-semibold">{plan.description}</p>
                    </div>

                    <div className="min-h-[85px] flex flex-col justify-center">
                      {selectedCycle === 'MONTHLY' ? (
                        <div className="flex items-baseline text-slate-900">
                          <span className="text-5xl font-black tracking-tight">
                            ${monthlyPrice.toFixed(2)}
                          </span>
                          <span className="ml-1 text-xs text-slate-400 font-bold">
                            /mo
                          </span>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <div className="flex items-baseline text-slate-900">
                            <span className="text-5xl font-black tracking-tight text-indigo-650">
                              ${annualPricePerMonth.toFixed(2)}
                            </span>
                            <span className="ml-1 text-xs text-slate-400 font-bold">
                              /mo
                            </span>
                          </div>
                          <p className="text-[10px] font-extrabold text-emerald-600 uppercase tracking-wide">
                            Billed Annually (${annualTotal.toFixed(2)}/yr)
                          </p>
                          <p className="text-[9px] text-slate-400 line-through">
                            Regular: ${annualRegularTotal.toFixed(2)}/yr
                          </p>
                        </div>
                      )}
                    </div>

                    <ul className="space-y-3.5 text-xs text-slate-600 font-semibold border-t border-slate-100 pt-6">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2.5">
                          <Check className={`h-4.5 w-4.5 shrink-0 mt-0.5 ${isPro ? 'text-indigo-500' : 'text-emerald-500'}`} />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>

                    {/* Duration slider/select */}
                    {selectedCycle === 'MONTHLY' && !alreadySubscribed && (
                      <div className="mt-6 flex items-center justify-between p-3 bg-slate-50 border border-slate-200/60 rounded-2xl">
                        <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider">Duration</span>
                        <select
                          value={selectedMonths[plan._id] || 1}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setSelectedMonths((prev) => ({ ...prev, [plan._id]: val }));
                          }}
                          className="bg-white border border-slate-200 rounded-xl px-3 py-1 text-xs font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all cursor-pointer"
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

                  <div className="mt-8">
                    <Button 
                      onClick={() => handleSubscribe(plan)}
                      className={`w-full py-4 text-xs uppercase tracking-wider font-extrabold rounded-2xl transition-all ${
                        alreadySubscribed 
                          ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200/50' 
                          : isPro
                            ? 'bg-indigo-650 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-650/15 hover:-translate-y-0.5'
                            : 'bg-[#0b0f19] hover:bg-slate-900 text-white shadow-lg shadow-slate-900/10 hover:-translate-y-0.5'
                      }`}
                      loading={submittingId === plan._id}
                      disabled={alreadySubscribed || !!(user && user.role !== 'USER')}
                    >
                      {btnLabel}
                    </Button>
                    {user && user.role !== 'USER' && (
                      <p className="text-[9px] text-center text-rose-500 font-extrabold mt-3 uppercase tracking-wider">
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

      {/* FOOTER */}
      <footer className="bg-[#0b0f19] text-slate-400 py-16 px-6 relative z-10 border-t border-slate-800/60">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-5 gap-10">
          <div className="col-span-2 space-y-4">
            <div className="flex items-center space-x-2">
              <span className="h-7 w-7 rounded-xl bg-gradient-to-tr from-[#6D5DF6] to-[#4F8CFF] text-white flex items-center justify-center font-extrabold text-xs shadow-md">
                S
              </span>
              <span className="font-extrabold text-white text-sm uppercase tracking-wider">
                SubFlow
              </span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed max-w-sm">
              Professional-grade billing orchestration and user entitlement console. Built for high-growth teams.
            </p>
            <p className="text-[10px] text-slate-650 pt-4">
              © 2026 SubFlow, Inc. All rights reserved.
            </p>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-bold text-white uppercase tracking-wider">Product</p>
            <ul className="space-y-2 text-xs text-slate-500 font-semibold">
              <li><a href="#features" className="hover:text-slate-300">Features</a></li>
              <li><a href="#pricing" className="hover:text-slate-300">Pricing</a></li>
              <li><a href="#dashboard-preview" className="hover:text-slate-300">API Documentation</a></li>
            </ul>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-bold text-white uppercase tracking-wider">Developers</p>
            <ul className="space-y-2 text-xs text-slate-500 font-semibold">
              <li><a href="#features" className="hover:text-slate-300">Entitlements</a></li>
              <li><a href="#pricing" className="hover:text-slate-300">Webhooks</a></li>
              <li><a href="#dashboard-preview" className="hover:text-slate-300">Support</a></li>
            </ul>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-bold text-white uppercase tracking-wider">Company</p>
            <ul className="space-y-2 text-xs text-slate-500 font-semibold">
              <li><a href="#features" className="hover:text-slate-300">About Us</a></li>
              <li><a href="#pricing" className="hover:text-slate-300">Security Audit</a></li>
              <li><a href="#dashboard-preview" className="hover:text-slate-300">Legal Terms</a></li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
