import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../hooks/useToast';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { ShieldCheck, Mail, ArrowRight, RefreshCw } from 'lucide-react';

export const VerifyEmail: React.FC = () => {
  const { verifyEmail, resendOtp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const [email, setEmail] = useState<string>('');
  const [otp, setOtp] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [resending, setResending] = useState<boolean>(false);
  const [countdown, setCountdown] = useState<number>(0);

  // Retrieve email from navigation state or fallback
  useEffect(() => {
    const stateEmail = (location.state as any)?.email;
    if (stateEmail) {
      setEmail(stateEmail);
    } else {
      // Look for query param if no navigation state
      const searchParams = new URLSearchParams(location.search);
      const queryEmail = searchParams.get('email');
      if (queryEmail) {
        setEmail(queryEmail);
      }
    }
  }, [location]);

  // Countdown timer effect
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast({
        title: 'Email Missing',
        description: 'Please specify the email address to verify.',
        variant: 'destructive',
      });
      return;
    }

    if (otp.length !== 6 || isNaN(Number(otp))) {
      toast({
        title: 'Invalid Code',
        description: 'Verification code must be exactly 6 digits.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      await verifyEmail(email, otp);
      toast({
        title: 'Verification Successful',
        description: 'Your email has been verified. Welcome aboard!',
        variant: 'success',
      });
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      toast({
        title: 'Verification Failed',
        description: err.message || 'Incorrect or expired verification code.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      toast({
        title: 'Email Missing',
        description: 'Please specify the email address.',
        variant: 'destructive',
      });
      return;
    }

    setResending(true);
    try {
      await resendOtp(email);
      toast({
        title: 'New Code Sent',
        description: 'A fresh verification OTP has been sent to your email address.',
        variant: 'success',
      });
      setCountdown(60); // Start 60-second cooldown
    } catch (err: any) {
      toast({
        title: 'Failed to Send Code',
        description: err.message || 'Could not resend verification code.',
        variant: 'destructive',
      });
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="relative flex min-h-[80vh] items-center justify-center overflow-hidden px-4">
      {/* Premium Ambient Background Glows */}
      <div className="glow-bg-blob-1 animate-drift opacity-60" />
      <div className="glow-bg-blob-2 animate-drift-reverse opacity-50" />

      {/* Grid Pattern Layout Overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

      {/* Glassmorphic Verification Card */}
      <div className="glass-card mx-auto w-full max-w-[420px] rounded-3xl p-8 relative z-10 border border-white/10 shadow-2xl transition-all duration-300 hover:border-white/20">
        
        {/* Shield Icon Header */}
        <div className="flex flex-col items-center text-center space-y-4 mb-8">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-purple-500/20 to-indigo-500/20 flex items-center justify-center border border-purple-500/30 text-purple-400">
            <ShieldCheck className="h-7 w-7 animate-pulse" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
              Verify your email
            </h1>
            <p className="text-sm text-zinc-400 mt-2 leading-relaxed">
              We've sent a 6-digit verification code to
            </p>
            {email ? (
              <span className="text-sm font-semibold text-purple-400 block mt-1 break-all">
                {email}
              </span>
            ) : (
              <span className="text-xs text-zinc-500 italic block mt-1">
                No email provided. Please go back or enter email manually.
              </span>
            )}
          </div>
        </div>

        {/* Verification Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {!email && (
            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4.5 w-4.5 text-zinc-500" />
                <Input
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-11 bg-black/40 border-zinc-800 focus:border-purple-500 transition-colors"
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block text-center">
              Verification Code (OTP)
            </label>
            <Input
              type="text"
              maxLength={6}
              placeholder="123456"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              className="h-14 text-center text-2xl font-mono tracking-[0.6em] bg-black/40 border-zinc-800 focus:border-purple-500 transition-all placeholder:text-zinc-700"
              disabled={loading}
              autoFocus
            />
          </div>

          <Button type="submit" className="w-full h-11 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white border-0 font-medium rounded-xl shadow-lg shadow-indigo-500/10 flex items-center justify-center gap-2 group transition-all" loading={loading}>
            Verify Account
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Button>
        </form>

        {/* Resend and Actions Footer */}
        <div className="mt-8 pt-6 border-t border-white/5 flex flex-col items-center space-y-4">
          <div className="text-sm text-zinc-400 flex items-center gap-1.5">
            Didn't receive the code?{' '}
            <button
              onClick={handleResend}
              disabled={countdown > 0 || resending}
              className="text-purple-400 font-semibold hover:text-purple-300 disabled:text-zinc-600 transition-colors flex items-center gap-1"
            >
              {resending ? (
                <>
                  <RefreshCw className="h-3 w-3 animate-spin" />
                  Sending...
                </>
              ) : countdown > 0 ? (
                `Resend in ${countdown}s`
              ) : (
                'Resend Code'
              )}
            </button>
          </div>
          
          <Link to="/login" className="text-xs text-zinc-500 hover:text-zinc-400 underline underline-offset-4">
            Back to Sign In
          </Link>
        </div>

      </div>
    </div>
  );
};

export default VerifyEmail;
