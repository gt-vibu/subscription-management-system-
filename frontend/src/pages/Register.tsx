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

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().min(1, 'Email is required').email('Please enter a valid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters long')
    .regex(
      passwordRegex,
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

  // Live password strength requirement flags
  const checks = {
    length: passwordValue.length >= 8,
    uppercase: /[A-Z]/.test(passwordValue),
    lowercase: /[a-z]/.test(passwordValue),
    digit: /\d/.test(passwordValue),
    special: /[@$!%*?&]/.test(passwordValue),
  };

  const isPasswordStrong = Object.values(checks).every(Boolean);

  const generateAndSuggestPassword = () => {
    const length = 16;
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const digits = '0123456789';
    const specials = '@$!%*?&';
    const all = uppercase + lowercase + digits + specials;

    let pass = '';
    pass += uppercase[Math.floor(Math.random() * uppercase.length)];
    pass += lowercase[Math.floor(Math.random() * lowercase.length)];
    pass += digits[Math.floor(Math.random() * digits.length)];
    pass += specials[Math.floor(Math.random() * specials.length)];

    for (let i = 4; i < length; i++) {
      pass += all[Math.floor(Math.random() * all.length)];
    }

    const suggested = pass.split('').sort(() => 0.5 - Math.random()).join('');

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
    <div className="relative flex min-h-[100vh] items-center justify-center overflow-hidden px-4 bg-slate-50 text-slate-900">
      {/* Drifting Glow Backdrops */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-200/20 blur-[120px] pointer-events-none z-0" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[450px] h-[450px] rounded-full bg-purple-200/20 blur-[100px] pointer-events-none z-0" />

      {/* Grid Pattern overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] bg-[size:32px_32px] opacity-70 pointer-events-none z-0" />

      <div className="glass-card mx-auto flex w-full flex-col justify-center space-y-6 max-w-[420px] rounded-3xl p-8 shadow-2xl relative z-10 bg-white/80 border border-slate-200">
        
        {/* Header */}
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
            Create an account
          </h1>
          <p className="text-xs text-slate-500">
            Enter your details to register as a new client
          </p>
        </div>

        {/* Register Form */}
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

            {/* Password strength real-time criteria checklist */}
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
            disabled={passwordValue !== '' && !isPasswordStrong}
          >
            Create Account
          </Button>
        </form>

        {/* Footer link */}
        <p className="px-8 text-center text-xs text-slate-500 border-t border-slate-100 pt-4">
          Already have an account?{' '}
          <Link to="/login" className="underline underline-offset-4 hover:text-indigo-600 font-bold transition-colors">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
