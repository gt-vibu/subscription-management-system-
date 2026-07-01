import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../hooks/useToast';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { AuthLayout } from '../components/AuthLayout';

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
    <AuthLayout
      title="Welcome back"
      subtitle="Enter your credentials to access your dashboard"
    >
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
    </AuthLayout>
  );
};

export default Login;
