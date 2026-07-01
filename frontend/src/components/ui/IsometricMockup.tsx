import React from 'react';
import { motion } from 'framer-motion';

export const IsometricMockup: React.FC = () => {
  return (
    <div className="relative w-full max-w-[640px] h-[360px] md:h-[480px] bg-transparent flex items-center justify-center pointer-events-none select-none">
      {/* Soft shadow below mockup */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-4/5 h-8 bg-indigo-900/5 blur-2xl rounded-full" />
      
      {/* 3D Isometric container */}
      <div className="relative w-full h-full flex items-center justify-center [transform-style:preserve-3d] [perspective:1000px]">
        {/* Isometric base grid representing a desk or workspace */}
        <div className="absolute w-[120%] h-[120%] bg-indigo-50/20 border border-indigo-100/30 rounded-[3rem] [transform:rotateX(60deg)_rotateZ(-45deg)] z-0 shadow-[inset_0_0_60px_rgba(99,102,241,0.02)]" />
        
        {/* Floating Device Mockup 1 (Main Dashboard window) */}
        <motion.div 
          animate={{ y: [0, -10, 0] }}
          transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
          className="absolute w-[280px] md:w-[360px] h-[180px] md:h-[240px] bg-white border border-slate-100 rounded-2xl shadow-[12px_24px_50px_rgba(99,102,241,0.08)] [transform:rotateX(60deg)_rotateZ(-45deg)_translateZ(40px)] z-10 p-3 flex flex-col justify-between"
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
              <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
            </div>
            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">submanage.io</div>
          </div>
          
          <div className="flex-1 flex gap-3 mt-3">
            <div className="w-1/3 bg-slate-50 rounded-lg p-2 flex flex-col justify-between">
              <div className="space-y-1.5">
                <div className="w-full h-2.5 bg-slate-200 rounded" />
                <div className="w-4/5 h-2 bg-slate-200/60 rounded" />
              </div>
              <div className="w-10 h-3 bg-indigo-100 rounded" />
            </div>
            <div className="flex-1 bg-slate-50/50 rounded-lg border border-dashed border-slate-200 p-2 flex flex-col justify-between">
              <div className="flex justify-between items-center">
                <div className="w-12 h-2.5 bg-slate-200 rounded" />
                <div className="w-8 h-2.5 bg-emerald-100 text-emerald-600 rounded text-[7px] font-extrabold flex items-center justify-center">+12.3%</div>
              </div>
              
              {/* Fake Chart Lines */}
              <div className="h-16 flex items-end gap-1.5 pt-2">
                {[40, 25, 45, 60, 55, 75, 90].map((h, i) => (
                  <div key={i} className="flex-1 bg-gradient-to-t from-indigo-500 to-violet-500 rounded-t-sm" style={{ height: `${h}%` }} />
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Floating card Widget 2 (Revenue stat card) */}
        <motion.div 
          animate={{ y: [0, -14, 0] }}
          transition={{ repeat: Infinity, duration: 5, ease: "easeInOut", delay: 0.5 }}
          className="absolute w-[140px] md:w-[170px] h-[90px] md:h-[110px] bg-white border border-slate-100 rounded-2xl shadow-[8px_16px_36px_rgba(99,102,241,0.08)] [transform:rotateX(60deg)_rotateZ(-45deg)_translateZ(120px)_translateX(110px)_translateY(-80px)] z-20 p-3 flex flex-col justify-between"
        >
          <div className="flex justify-between items-center">
            <span className="text-[8px] font-extrabold text-slate-400 uppercase tracking-widest">Total Revenue</span>
            <span className="h-4 w-4 rounded-full bg-indigo-50 text-indigo-500 flex items-center justify-center">💰</span>
          </div>
          <div>
            <h4 className="text-sm md:text-md font-black text-slate-900">$128,560</h4>
            <p className="text-[7px] font-extrabold text-emerald-600 uppercase tracking-widest mt-0.5">+12.5% vs last month</p>
          </div>
        </motion.div>

        {/* Floating card Widget 3 (Active Subscribers badge) */}
        <motion.div 
          animate={{ y: [0, -8, 0] }}
          transition={{ repeat: Infinity, duration: 7, ease: "easeInOut", delay: 1 }}
          className="absolute w-[130px] md:w-[160px] h-[80px] md:h-[100px] bg-[#6366F1] text-white rounded-2xl shadow-[6px_12px_28px_rgba(99,102,241,0.15)] [transform:rotateX(60deg)_rotateZ(-45deg)_translateZ(90px)_translateX(-120px)_translateY(60px)] z-30 p-3 flex flex-col justify-between"
        >
          <div className="flex justify-between items-center">
            <span className="text-[8px] font-extrabold text-indigo-200 uppercase tracking-widest">Subscribers</span>
            <span className="text-[9px]">⚡</span>
          </div>
          <div>
            <h4 className="text-sm md:text-md font-black">9,265</h4>
            <p className="text-[7px] font-bold text-indigo-200 uppercase tracking-widest mt-0.5">Active subscriptions</p>
          </div>
        </motion.div>

        {/* Floating decorative elements */}
        {/* Purple Sphere */}
        <motion.div 
          animate={{ y: [0, -18, 0] }}
          transition={{ repeat: Infinity, duration: 4, ease: "easeInOut", delay: 1.5 }}
          className="absolute w-6 h-6 rounded-full bg-gradient-to-tr from-violet-500 to-fuchsia-400 shadow-md [transform:rotateX(60deg)_rotateZ(-45deg)_translateZ(150px)_translateX(-40px)_translateY(-90px)] z-40" 
        />
        {/* Soft yellow bubble */}
        <motion.div 
          animate={{ y: [0, -12, 0] }}
          transition={{ repeat: Infinity, duration: 6, ease: "easeInOut", delay: 0.8 }}
          className="absolute w-4 h-4 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-300 shadow-sm [transform:rotateX(60deg)_rotateZ(-45deg)_translateZ(60px)_translateX(80px)_translateY(110px)] z-40" 
        />
      </div>
    </div>
  );
};
