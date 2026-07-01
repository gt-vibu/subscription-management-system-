import React from 'react';
import { Link } from 'react-router-dom';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
  maxWidth?: string;
}

export const BrandHeader: React.FC = () => (
  <Link to="/" className="flex items-center justify-center space-x-2 shrink-0 mb-2">
    <span className="h-6 w-6 rounded-md bg-gradient-to-tr from-[#6366F1] to-[#8B5CF6] text-white flex items-center justify-center font-extrabold text-xs shadow-sm">
      S
    </span>
    <span className="font-extrabold tracking-tight text-sm text-slate-900">
      SubManage
    </span>
  </Link>
);

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children, title, subtitle, maxWidth = '380px' }) => {
  return (
    <div className="relative flex min-h-[100vh] items-center justify-center overflow-hidden px-4 bg-slate-50 text-slate-900">
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-200/20 blur-[120px] pointer-events-none z-0" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[450px] h-[450px] rounded-full bg-purple-200/20 blur-[100px] pointer-events-none z-0" />
      <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] bg-[size:32px_32px] opacity-70 pointer-events-none z-0" />

      <div
        className="glass-card mx-auto flex w-full flex-col justify-center space-y-6 rounded-3xl p-8 shadow-2xl relative z-10 bg-white/80 border border-slate-200"
        style={{ maxWidth }}
      >
        <div className="flex flex-col space-y-2 text-center">
          <BrandHeader />
          <h1 className="text-xl font-extrabold tracking-tight text-slate-900">
            {title}
          </h1>
          <p className="text-xs text-slate-500">
            {subtitle}
          </p>
        </div>

        {children}
      </div>
    </div>
  );
};

export default AuthLayout;
