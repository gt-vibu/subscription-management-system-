import React from 'react';

export const SystemCore3D: React.FC = () => {
  return (
    <div className="relative w-full h-[180px] bg-slate-950 rounded-2xl border border-slate-900 flex items-center justify-center overflow-hidden shadow-inner group">
      {/* Grid Pattern Background */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(99,102,241,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(99,102,241,0.05)_1px,transparent_1px)] bg-[size:16px_16px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-80" />

      {/* Holographic light glow from bottom */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-48 h-12 bg-indigo-500/15 blur-2xl rounded-full" />
      
      {/* 3D Scene Wrapper */}
      <div 
        className="relative flex items-center justify-center transform transition-transform duration-500 group-hover:scale-105"
        style={{ perspective: '800px' }}
      >
        {/* Rotating Base Ring */}
        <div 
          className="absolute w-44 h-44 rounded-full border border-indigo-500/20 border-dashed animate-[spin_20s_linear_infinite]"
          style={{ transform: 'rotateX(70deg) rotateY(0deg) translateZ(-40px)' }}
        />
        
        {/* Outer Orbiting Sphere Ring */}
        <div 
          className="absolute w-36 h-36 rounded-full border-2 border-indigo-600/30 animate-[spin_10s_linear_infinite]"
          style={{ transform: 'rotateX(70deg) rotateY(15deg) translateZ(-20px)' }}
        >
          {/* Orbiting dot */}
          <div className="absolute -top-1.5 left-1/2 w-3 h-3 bg-indigo-400 rounded-full shadow-[0_0_8px_#818cf8] animate-pulse" />
        </div>

        {/* Server Blade 1 (Bottom Layer) */}
        <div 
          className="absolute w-28 h-28 bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700/80 rounded-xl shadow-lg transition-transform duration-500 group-hover:translate-z-[-30px]"
          style={{ transform: 'rotateX(65deg) rotateZ(-45deg) translateZ(-30px)' }}
        >
          <div className="absolute top-2 left-2 flex gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_4px_#10b981]" />
          </div>
          <div className="absolute bottom-2 right-2 w-12 h-1.5 bg-slate-700 rounded-full overflow-hidden">
            <div className="h-full w-3/4 bg-indigo-500 rounded-full animate-[pulse_2s_infinite]" />
          </div>
          {/* Port dots */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex gap-1.5">
            <span className="w-1 h-1 rounded-full bg-indigo-500 shadow-[0_0_4px_#6366f1]" />
            <span className="w-1 h-1 rounded-full bg-indigo-400 shadow-[0_0_4px_#818cf8] animate-pulse" />
            <span className="w-1 h-1 rounded-full bg-slate-700" />
          </div>
        </div>

        {/* Server Blade 2 (Middle Layer) */}
        <div 
          className="absolute w-28 h-28 bg-gradient-to-br from-slate-900 to-slate-850 border border-slate-700/80 rounded-xl shadow-lg transition-transform duration-500 group-hover:translate-z-[0px]"
          style={{ transform: 'rotateX(65deg) rotateZ(-45deg) translateZ(0px)' }}
        >
          <div className="absolute top-2 left-2 flex gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_4px_#10b981]" />
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_4px_#3b82f6] animate-pulse" />
          </div>
          <div className="absolute bottom-2 right-2 w-12 h-1.5 bg-slate-700 rounded-full overflow-hidden">
            <div className="h-full w-1/2 bg-blue-500 rounded-full animate-[pulse_1.5s_infinite]" />
          </div>
          {/* Micro circuit line details */}
          <div className="absolute inset-x-4 top-1/2 h-[1px] bg-indigo-500/20" />
        </div>

        {/* Server Blade 3 (Top Layer) */}
        <div 
          className="absolute w-28 h-28 bg-gradient-to-br from-slate-900 to-slate-850 border border-indigo-500/50 rounded-xl shadow-[0_0_15px_rgba(99,102,241,0.2)] transition-transform duration-500 group-hover:translate-z-[30px]"
          style={{ transform: 'rotateX(65deg) rotateZ(-45deg) translateZ(30px)' }}
        >
          <div className="absolute top-2 left-2 flex gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 shadow-[0_0_6px_#818cf8] animate-ping" />
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_4px_#6366f1]" />
          </div>
          <div className="absolute bottom-2 right-2 w-12 h-1.5 bg-slate-700 rounded-full overflow-hidden">
            <div className="h-full w-5/6 bg-indigo-500 rounded-full" />
          </div>
          <div className="absolute top-1/2 left-3 flex flex-col gap-1">
            <span className="text-[6px] text-indigo-400 font-extrabold uppercase tracking-wide">CPU STATUS</span>
            <span className="text-[8px] text-white font-black">99.8% OK</span>
          </div>
        </div>

        {/* Central Holographic Laser beam */}
        <div 
          className="absolute w-1 h-36 bg-gradient-to-t from-indigo-500 via-indigo-400 to-transparent shadow-[0_0_10px_#6366f1] opacity-75"
          style={{ transform: 'translateY(-20px)' }}
        />
        
        {/* Floating Ring at top */}
        <div 
          className="absolute w-12 h-12 rounded-full border border-indigo-400/40 shadow-[0_0_8px_rgba(99,102,241,0.2)] animate-[spin_5s_linear_infinite]"
          style={{ transform: 'rotateX(65deg) rotateY(0deg) translateZ(55px)' }}
        />
      </div>

      {/* Real-time Telemetry Stats Overlay */}
      <div className="absolute bottom-3 left-4 text-left">
        <p className="text-[7px] text-slate-500 font-extrabold uppercase tracking-wider">Cluster Telemetry</p>
        <p className="text-[9px] text-emerald-400 font-bold flex items-center gap-1 mt-0.5">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Active Nodes: 3/3 Online
        </p>
      </div>
      <div className="absolute bottom-3 right-4 text-right">
        <p className="text-[7px] text-slate-500 font-extrabold uppercase tracking-wider">Load balancer</p>
        <p className="text-[9px] text-white font-bold">1.04 req/s</p>
      </div>
    </div>
  );
};
export default SystemCore3D;
