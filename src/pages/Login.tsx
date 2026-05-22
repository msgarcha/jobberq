import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator } from '@/components/ui/input-otp';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft } from 'lucide-react';
import QuickLinqLogo from '@/components/QuickLinqLogo';
import Seo from '@/components/Seo';

const authShellClassName = 'min-h-[100svh] bg-background px-4 py-8 sm:py-10';
const authContainerClassName = 'mx-auto flex w-full max-w-md min-w-0 flex-col';
const authCardClassName = 'w-full min-w-0 overflow-hidden border-border/50 shadow-warm-md';
const authHeaderClassName = 'px-4 pb-2 text-center sm:px-5';
const authContentClassName = 'px-4 pb-6 sm:px-5';
const authTabsClassName = 'w-full min-w-0';
const authTabsListClassName = 'grid h-12 w-full min-w-0 grid-cols-2 rounded-xl';
const authTabsTriggerClassName = 'min-w-0 rounded-lg px-2 sm:px-3';
const authTabsContentClassName = 'mt-3 w-full min-w-0';
const authFormClassName = 'w-full min-w-0 space-y-4 pt-1';
const authFieldClassName = 'w-full min-w-0 space-y-2';
const authInputClassName = 'w-full min-w-0 max-w-full rounded-lg';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetMode, setResetMode] = useState(false);
  const [otpMode, setOtpMode] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  const redirectTo = searchParams.get('redirect') || '/';

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  const startOtpFlow = (forEmail: string) => {
    setEmail(forEmail);
    setOtpMode(true);
    setOtpCode('');
    setResendCooldown(60);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      if (/confirm|verif/i.test(error.message)) {
        // Trigger resend and switch to OTP entry
        await supabase.auth.resend({ type: 'signup', email });
        toast({ title: 'Verify your email', description: 'We sent a 6-digit code to your inbox.' });
        startOtpFlow(email);
        return;
      }
      toast({ title: 'Login failed', description: error.message, variant: 'destructive' });
    } else {
      navigate(redirectTo);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName },
        emailRedirectTo: `${window.location.origin}${redirectTo}`,
      },
    });
    setLoading(false);
    if (error) {
      toast({ title: 'Sign up failed', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Check your email', description: 'Enter the 6-digit code we just sent you.' });
      startOtpFlow(email);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.length !== 8) return;
    setLoading(true);
    const { error } = await supabase.auth.verifyOtp({
      email,
      token: otpCode,
      type: 'email',
    });
    setLoading(false);
    if (error) {
      toast({ title: 'Verification failed', description: error.message, variant: 'destructive' });
      setOtpCode('');
    } else {
      toast({ title: 'Email verified', description: 'Welcome to QuickLinq!' });
      navigate(redirectTo);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    setLoading(true);
    const { error } = await supabase.auth.resend({ type: 'signup', email });
    setLoading(false);
    if (error) {
      toast({ title: 'Could not resend', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Code sent', description: 'Check your inbox for a new code.' });
      setResendCooldown(60);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Email sent', description: 'Check your inbox for a reset link.' });
      setResetMode(false);
    }
  };

  if (otpMode) {
    return (
      <main className={authShellClassName}>
        <Seo title="Verify Email — QuickLinq" description="Enter the 6-digit code we sent you." path="/login" />
        <div className={authContainerClassName}>
          <div className="mb-4">
            <button
              type="button"
              onClick={() => { setOtpMode(false); setOtpCode(''); }}
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" /> Use a different email
            </button>
          </div>
          <Card className={authCardClassName}>
            <CardHeader className={authHeaderClassName}>
              <Link to="/landing" className="mx-auto mb-4 flex max-w-full items-center justify-center hover:opacity-90 transition-opacity">
                <QuickLinqLogo size={44} type="full" variant="dark" className="h-11 w-auto max-w-[13rem] sm:max-w-[15rem]" />
              </Link>
              <CardTitle className="text-2xl">Verify your email</CardTitle>
              <CardDescription>
                Enter the 6-digit code we sent to <span className="font-medium text-foreground">{email}</span>
              </CardDescription>
            </CardHeader>
            <CardContent className={authContentClassName}>
              <form onSubmit={handleVerifyOtp} className={authFormClassName}>
                <div className="flex justify-center py-2">
                  <InputOTP maxLength={6} value={otpCode} onChange={setOtpCode}>
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                </div>
                <Button type="submit" className="w-full min-w-0 rounded-lg" disabled={loading || otpCode.length !== 6}>
                  {loading ? 'Verifying…' : 'Verify Email'}
                </Button>
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resendCooldown > 0 || loading}
                  className="w-full text-sm text-muted-foreground hover:text-foreground text-center py-1 transition-colors disabled:opacity-50"
                >
                  {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend code'}
                </button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  if (resetMode) {
    return (
      <main className={authShellClassName}>
        <Seo title="Reset Password — QuickLinq" description="Reset your QuickLinq password." path="/login" />

        <div className={authContainerClassName}>
          <div className="mb-4">
            <Link to="/landing" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" /> Back to Home
            </Link>
          </div>
          <Card className={authCardClassName}>
            <CardHeader className={authHeaderClassName}>
              <Link to="/landing" className="mx-auto mb-4 flex max-w-full items-center justify-center hover:opacity-90 transition-opacity">
                <QuickLinqLogo size={44} type="full" variant="dark" className="h-11 w-auto max-w-[13rem] sm:max-w-[15rem]" />
              </Link>
              <CardTitle className="text-2xl">Reset Password</CardTitle>
              <CardDescription>Enter your email to receive a reset link.</CardDescription>
            </CardHeader>
            <CardContent className={authContentClassName}>
            <form onSubmit={handleResetPassword} className={authFormClassName}>
              <div className={authFieldClassName}>
                <Label htmlFor="reset-email">Email</Label>
                <Input id="reset-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className={authInputClassName} />
              </div>
              <Button type="submit" className="w-full min-w-0 rounded-lg" disabled={loading}>
                {loading ? 'Sending…' : 'Send Reset Link'}
              </Button>
              <Button type="button" variant="ghost" className="w-full min-w-0" onClick={() => setResetMode(false)}>
                Back to login
              </Button>
            </form>
            </CardContent>
          </Card>
        </div>
      </main>

    );
  }

  return (
    <main className={authShellClassName}>
      <Seo title="Log In or Sign Up — QuickLinq" description="Log in to QuickLinq or create a free account to send quotes, manage jobs, and collect payments." path="/login" />

      <div className={`${authContainerClassName} animate-slide-up`}>
        <div className="mb-4">
          <Link to="/landing" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to Home
          </Link>
        </div>
        <Card className={authCardClassName}>
          <CardHeader className={authHeaderClassName}>
            <Link to="/landing" className="mx-auto mb-4 flex max-w-full items-center justify-center hover:opacity-90 transition-opacity">
              <QuickLinqLogo size={44} type="full" variant="dark" className="h-11 w-auto max-w-[13rem] sm:max-w-[15rem]" />
            </Link>
            <CardDescription>Send Quotes. Win Jobs. Get Paid.</CardDescription>
          </CardHeader>
          <CardContent className={authContentClassName}>
            <Tabs defaultValue="login" className={authTabsClassName}>
              <TabsList className={authTabsListClassName}>
                <TabsTrigger value="login" className={authTabsTriggerClassName}>Log In</TabsTrigger>
                <TabsTrigger value="signup" className={authTabsTriggerClassName}>Sign Up</TabsTrigger>
              </TabsList>
              <TabsContent value="login" className={authTabsContentClassName}>
                <form onSubmit={handleLogin} className={authFormClassName}>
                  <div className={authFieldClassName}>
                    <Label htmlFor="login-email">Email</Label>
                    <Input id="login-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className={authInputClassName} />
                  </div>
                  <div className={authFieldClassName}>
                    <Label htmlFor="login-password">Password</Label>
                    <Input id="login-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className={authInputClassName} />
                  </div>
                  <Button type="submit" className="w-full min-w-0 rounded-lg" disabled={loading}>
                    {loading ? 'Logging in…' : 'Log In'}
                  </Button>
                  <button type="button" data-variant="link" className="w-full text-sm text-muted-foreground hover:text-foreground text-center py-1 transition-colors" onClick={() => setResetMode(true)}>
                    Forgot password?
                  </button>
                </form>
              </TabsContent>
              <TabsContent value="signup" className={authTabsContentClassName}>
                <form onSubmit={handleSignUp} className={authFormClassName}>
                  <div className={authFieldClassName}>
                    <Label htmlFor="signup-name">Full Name</Label>
                    <Input id="signup-name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} required className={authInputClassName} />
                  </div>
                  <div className={authFieldClassName}>
                    <Label htmlFor="signup-email">Email</Label>
                    <Input id="signup-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className={authInputClassName} />
                  </div>
                  <div className={authFieldClassName}>
                    <Label htmlFor="signup-password">Password</Label>
                    <Input id="signup-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className={authInputClassName} />
                  </div>
                  <Button type="submit" className="w-full min-w-0 rounded-lg" disabled={loading}>
                    {loading ? 'Creating account…' : 'Create Account'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </main>

  );
}
