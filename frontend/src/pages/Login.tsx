import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../hooks/useToast';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginSchemaType = z.infer<typeof loginSchema>;

export const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const from = (location.state as any)?.from?.pathname || '/dashboard';

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginSchemaType>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginSchemaType) => {
    setLoading(true);
    try {
      await login(data.email, data.password);
      toast({
        title: 'Welcome Back',
        description: 'You have logged in successfully.',
        variant: 'success',
      });
      navigate(from, { replace: true });
    } catch (err: any) {
      toast({
        title: 'Authentication Failed',
        description: err.message || 'Incorrect email or password.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-[100vh] items-center justify-center overflow-hidden px-4 bg-slate-50 text-slate-900">
      {/* Drifting Glow Backdrops */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-200/20 blur-[120px] pointer-events-none z-0" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[450px] h-[450px] rounded-full bg-purple-200/20 blur-[100px] pointer-events-none z-0" />

      {/* Grid Pattern overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] bg-[size:32px_32px] opacity-70 pointer-events-none z-0" />

      <div className="glass-card mx-auto flex w-full flex-col justify-center space-y-6 max-w-[380px] rounded-3xl p-8 shadow-2xl relative z-10 bg-white/80 border border-slate-200">
        <div className="flex flex-col space-y-2 text-center">
          <Link to="/" className="flex items-center justify-center space-x-2 shrink-0 mb-2">
            <span className="h-6 w-6 rounded-md bg-gradient-to-tr from-[#6366F1] to-[#8B5CF6] text-white flex items-center justify-center font-extrabold text-xs shadow-sm">
              S
            </span>
            <span className="font-extrabold tracking-tight text-sm text-slate-900">
              SubManage
            </span>
          </Link>
          <h1 className="text-xl font-extrabold tracking-tight text-slate-900">
            Welcome back
          </h1>
          <p className="text-xs text-slate-500">
            Enter your credentials to access your dashboard
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1 text-left">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1" htmlFor="email">
              Email Address
            </label>
            <Input
              id="email"
              type="email"
              placeholder="name@example.com"
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect="off"
              disabled={loading}
              className="bg-white border-slate-200 focus:border-indigo-500 text-slate-900 transition-colors h-10 rounded-xl"
              {...register('email')}
            />
            {errors.email && (
              <p className="text-xs text-destructive font-semibold mt-1">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-1 text-left">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1" htmlFor="password">
              Password
            </label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              disabled={loading}
              className="bg-white border-slate-200 focus:border-indigo-500 text-slate-900 transition-colors h-10 rounded-xl"
              {...register('password')}
            />
            {errors.password && (
              <p className="text-xs text-destructive font-semibold mt-1">{errors.password.message}</p>
            )}
          </div>

          <Button 
            type="submit" 
            className="w-full h-10 bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] hover:opacity-90 text-white border-0 font-bold rounded-xl shadow-md mt-4" 
            loading={loading}
          >
            Sign In
          </Button>
        </form>

        <p className="px-8 text-center text-xs text-slate-500 border-t border-slate-100 pt-4">
          Don't have an account?{' '}
          <Link to="/register" className="underline underline-offset-4 hover:text-indigo-600 font-bold transition-colors">
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
