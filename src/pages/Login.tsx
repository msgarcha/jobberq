import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  const redirectTo = searchParams.get('redirect') || '/';

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
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
      toast({ title: 'Account created', description: 'Please check your email and click the verification link before logging in.' });
      setEmail('');
      setPassword('');
      setDisplayName('');
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
    <div className={authShellClassName}>
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
    </div>
  );
}
