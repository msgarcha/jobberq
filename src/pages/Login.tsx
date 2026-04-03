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
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="w-full max-w-md">
          <div className="mb-4">
            <Link to="/landing" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" /> Back to Home
            </Link>
          </div>
          <Card className="shadow-warm-md border-border/50">
            <CardHeader className="text-center pb-2">
<Link to="/landing" className="mx-auto mb-4 flex items-center justify-center hover:opacity-90 transition-opacity"><QuickLinqLogo size={44} type="full" variant="dark" /></Link>
              <CardTitle className="text-2xl">Reset Password</CardTitle>
              <CardDescription>Enter your email to receive a reset link.</CardDescription>
            </CardHeader>
          <CardContent>
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reset-email">Email</Label>
                <Input id="reset-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="rounded-lg" />
              </div>
              <Button type="submit" className="w-full rounded-lg" disabled={loading}>
                {loading ? 'Sending…' : 'Send Reset Link'}
              </Button>
              <Button type="button" variant="ghost" className="w-full" onClick={() => setResetMode(false)}>
                Back to login
              </Button>
            </form>
          </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md animate-slide-up">
        <div className="mb-4">
          <Link to="/landing" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to Home
          </Link>
        </div>
        <Card className="shadow-warm-md border-border/50 overflow-hidden">
          <CardHeader className="text-center pb-2 px-5">
            <Link to="/landing" className="mx-auto mb-4 flex items-center justify-center hover:opacity-90 transition-opacity"><QuickLinqLogo size={44} variant="green" /></Link>
            <CardTitle className="text-2xl">QuickLinq</CardTitle>
            <CardDescription>Send Quotes. Win Jobs. Get Paid.</CardDescription>
          </CardHeader>
          <CardContent className="px-5 pb-6">
            <Tabs defaultValue="login">
              <TabsList className="grid w-full grid-cols-2 rounded-lg">
                <TabsTrigger value="login" className="rounded-md">Log In</TabsTrigger>
                <TabsTrigger value="signup" className="rounded-md">Sign Up</TabsTrigger>
              </TabsList>
              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <Input id="login-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="rounded-lg" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Password</Label>
                    <Input id="login-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="rounded-lg" />
                  </div>
                  <Button type="submit" className="w-full rounded-lg" disabled={loading}>
                    {loading ? 'Logging in…' : 'Log In'}
                  </Button>
                  <button type="button" data-variant="link" className="w-full text-sm text-muted-foreground hover:text-foreground text-center py-1 transition-colors" onClick={() => setResetMode(true)}>
                    Forgot password?
                  </button>
                </form>
              </TabsContent>
              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Full Name</Label>
                    <Input id="signup-name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} required className="rounded-lg" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input id="signup-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="rounded-lg" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <Input id="signup-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className="rounded-lg" />
                  </div>
                  <Button type="submit" className="w-full rounded-lg" disabled={loading}>
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
