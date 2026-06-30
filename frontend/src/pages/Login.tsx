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
    <div className="relative flex min-h-[80vh] items-center justify-center overflow-hidden px-4">
      {/* Drifting Glow Backdrops */}
      <div className="glow-bg-blob-1 animate-drift opacity-50" />
      <div className="glow-bg-blob-2 animate-drift-reverse opacity-45" />

      {/* Grid Pattern overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

      <div className="glass-card mx-auto flex w-full flex-col justify-center space-y-6 max-w-[380px] rounded-3xl p-8 border border-white/10 shadow-2xl relative z-10">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
            Welcome back
          </h1>
          <p className="text-xs text-zinc-400">
            Enter your credentials to access your dashboard
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block" htmlFor="email">
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
              className="bg-black/30 border-zinc-800 focus:border-purple-500 transition-colors h-10 rounded-xl"
              {...register('email')}
            />
            {errors.email && (
              <p className="text-xs text-destructive font-medium mt-1">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block" htmlFor="password">
              Password
            </label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              disabled={loading}
              className="bg-black/30 border-zinc-800 focus:border-purple-500 transition-colors h-10 rounded-xl"
              {...register('password')}
            />
            {errors.password && (
              <p className="text-xs text-destructive font-medium mt-1">{errors.password.message}</p>
            )}
          </div>

          <Button type="submit" className="w-full h-10 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white border-0 font-medium rounded-xl shadow-lg mt-4" loading={loading}>
            Sign In
          </Button>
        </form>

        <p className="px-8 text-center text-xs text-zinc-400 border-t border-white/5 pt-4">
          Don't have an account?{' '}
          <Link to="/register" className="underline underline-offset-4 hover:text-purple-400 font-semibold transition-colors">
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
