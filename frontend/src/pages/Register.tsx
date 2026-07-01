import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../hooks/useToast';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Sparkles, CheckCircle, XCircle } from 'lucide-react';
import { AuthLayout } from '../components/AuthLayout';
import { PASSWORD_REGEX, getPasswordChecks, isPasswordStrong, generateStrongPassword } from '../utils/password';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().min(1, 'Email is required').email('Please enter a valid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters long')
    .regex(
      PASSWORD_REGEX,
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&).'
    ),
  confirmPassword: z.string().min(8, 'Confirm password is required'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ['confirmPassword'],
});

type RegisterSchemaType = z.infer<typeof registerSchema>;

export const Register: React.FC = () => {
  const { register: signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    trigger,
    formState: { errors },
  } = useForm<RegisterSchemaType>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    }
  });

  const passwordValue = watch('password', '');
  const checks = getPasswordChecks(passwordValue);
  const passwordStrong = isPasswordStrong(passwordValue);

  const generateAndSuggestPassword = () => {
    const suggested = generateStrongPassword();

    setValue('password', suggested, { shouldValidate: true });
    setValue('confirmPassword', suggested, { shouldValidate: true });
    trigger(['password', 'confirmPassword']);

    navigator.clipboard.writeText(suggested);

    toast({
      title: 'Strong Password Generated',
      description: 'The suggested password was auto-filled and copied to your clipboard.',
      variant: 'success',
    });
  };

  const onSubmit = async (data: RegisterSchemaType) => {
    setLoading(true);
    try {
      await signUp(data.name, data.email, data.password);
      toast({
        title: 'Registration Successful',
        description: 'Your account was successfully created.',
        variant: 'success',
      });
      navigate('/dashboard');
    } catch (err: any) {
      toast({
        title: 'Registration Failed',
        description: err.message || 'An error occurred during account creation.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Create an account"
      subtitle="Enter your details to register as a new client"
      maxWidth="420px"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1 text-left">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1" htmlFor="name">
            Full Name
          </label>
          <Input
            id="name"
            type="text"
            placeholder="John Doe"
            disabled={loading}
            className="bg-white border-slate-200 focus:border-indigo-500 text-slate-900 transition-colors h-10 rounded-xl"
            {...register('name')}
          />
          {errors.name && (
            <p className="text-xs text-destructive font-semibold mt-1">{errors.name.message}</p>
          )}
        </div>

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

        <div className="space-y-1 relative text-left">
          <div className="flex justify-between items-center mb-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider" htmlFor="password">
              Password
            </label>
            
            <button
              type="button"
              onClick={generateAndSuggestPassword}
              className="text-[9px] font-bold text-indigo-600 hover:text-indigo-700 transition-colors flex items-center gap-1 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full"
            >
              <Sparkles className="h-2.5 w-2.5" /> Suggest Strong
            </button>
          </div>
          
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              disabled={loading}
              className="bg-white border-slate-200 focus:border-indigo-500 text-slate-900 transition-colors h-10 rounded-xl pr-10"
              {...register('password')}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
            >
              {showPassword ? (
                <span className="text-[9px] font-bold uppercase">Hide</span>
              ) : (
                <span className="text-[9px] font-bold uppercase">Show</span>
              )}
            </button>
          </div>

          {passwordValue && (
            <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl space-y-2 mt-2 text-[10px]">
              <p className="font-bold text-slate-500">Password requirements:</p>
              <div className="grid grid-cols-2 gap-2">
                <div className={`flex items-center space-x-1.5 ${checks.length ? 'text-emerald-600 font-semibold' : 'text-slate-400'}`}>
                  {checks.length ? <CheckCircle className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                  <span>8+ characters</span>
                </div>
                <div className={`flex items-center space-x-1.5 ${checks.uppercase ? 'text-emerald-600 font-semibold' : 'text-slate-400'}`}>
                  {checks.uppercase ? <CheckCircle className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                  <span>1+ uppercase</span>
                </div>
                <div className={`flex items-center space-x-1.5 ${checks.lowercase ? 'text-emerald-600 font-semibold' : 'text-slate-400'}`}>
                  {checks.lowercase ? <CheckCircle className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                  <span>1+ lowercase</span>
                </div>
                <div className={`flex items-center space-x-1.5 ${checks.digit ? 'text-emerald-600 font-semibold' : 'text-slate-400'}`}>
                  {checks.digit ? <CheckCircle className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                  <span>1+ number</span>
                </div>
                <div className={`flex items-center space-x-1.5 ${checks.special ? 'text-emerald-600 font-semibold' : 'text-slate-400'}`}>
                  {checks.special ? <CheckCircle className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                  <span>1+ special symbol</span>
                </div>
              </div>
            </div>
          )}
          
          {errors.password && !passwordValue && (
            <p className="text-xs text-destructive font-semibold mt-1">{errors.password.message}</p>
          )}
        </div>

        <div className="space-y-1 text-left">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1" htmlFor="confirmPassword">
            Confirm Password
          </label>
          <Input
            id="confirmPassword"
            type="password"
            placeholder="••••••••"
            disabled={loading}
            className="bg-white border-slate-200 focus:border-indigo-500 text-slate-900 transition-colors h-10 rounded-xl"
            {...register('confirmPassword')}
          />
          {errors.confirmPassword && (
            <p className="text-xs text-destructive font-semibold mt-1">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        <Button 
          type="submit" 
          className="w-full h-11 bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] hover:opacity-90 text-white border-0 font-bold rounded-xl shadow-md mt-4" 
          loading={loading} 
          disabled={passwordValue !== '' && !passwordStrong}
        >
          Create Account
        </Button>
      </form>

      <p className="px-8 text-center text-xs text-slate-500 border-t border-slate-100 pt-4">
        Already have an account?{' '}
        <Link to="/login" className="underline underline-offset-4 hover:text-indigo-600 font-bold transition-colors">
          Sign In
        </Link>
      </p>
    </AuthLayout>
  );
};

export default Register;
