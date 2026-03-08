import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { getTierByProductId, type TierKey } from '@/lib/subscriptionTiers';

interface SubscriptionState {
  subscribed: boolean;
  isTrialing: boolean;
  trialEndsAt: string | null;
  tier: TierKey | null;
  subscriptionEnd: string | null;
  loading: boolean;
}

interface TeamState {
  teamId: string | null;
  teamName: string | null;
  role: string | null;
  loading: boolean;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  subscription: SubscriptionState;
  team: TeamState;
  isSuperAdmin: boolean;
  checkSubscription: () => Promise<void>;
  signOut: () => Promise<void>;
}

const defaultSubscription: SubscriptionState = {
  subscribed: false,
  isTrialing: false,
  trialEndsAt: null,
  tier: null,
  subscriptionEnd: null,
  loading: true,
};

const defaultTeam: TeamState = {
  teamId: null,
  teamName: null,
  role: null,
  loading: true,
};

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  loading: true,
  subscription: defaultSubscription,
  team: defaultTeam,
  isSuperAdmin: false,
  checkSubscription: async () => {},
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<SubscriptionState>(defaultSubscription);
  const [team, setTeam] = useState<TeamState>(defaultTeam);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  const checkSubscription = useCallback(async () => {
    try {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (!currentSession) {
        setSubscription({ ...defaultSubscription, loading: false });
        return;
      }

      const { data, error } = await supabase.functions.invoke('check-subscription', {
        headers: { Authorization: `Bearer ${currentSession.access_token}` },
      });

      if (error) {
        console.error('Subscription check error:', error);
        setSubscription({ ...defaultSubscription, loading: false });
        return;
      }

      setSubscription({
        subscribed: data.subscribed || false,
        isTrialing: data.is_trialing || false,
        trialEndsAt: data.trial_ends_at || null,
        tier: getTierByProductId(data.product_id),
        subscriptionEnd: data.subscription_end || null,
        loading: false,
      });
    } catch (err) {
      console.error('Subscription check failed:', err);
      setSubscription({ ...defaultSubscription, loading: false });
    }
  }, []);

  const loadTeam = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('team_members')
        .select('team_id, role, teams(name)')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('Team load error:', error);
        setTeam({ ...defaultTeam, loading: false });
        return;
      }

      setTeam({
        teamId: data?.team_id || null,
        teamName: (data?.teams as any)?.name || null,
        role: data?.role || null,
        loading: false,
      });
    } catch (err) {
      console.error('Team load failed:', err);
      setTeam({ ...defaultTeam, loading: false });
    }
  }, []);

  const loadSuperAdmin = useCallback(async (userId: string) => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('is_super_admin')
        .eq('user_id', userId)
        .single();
      setIsSuperAdmin(data?.is_super_admin === true);
    } catch {
      setIsSuperAdmin(false);
    }
  }, []);

  useEffect(() => {
    const { data: { subscription: authSub } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    return () => authSub.unsubscribe();
  }, []);

  // Check subscription & team when session changes
  useEffect(() => {
    if (session) {
      checkSubscription();
      loadTeam(session.user.id);
      loadSuperAdmin(session.user.id);
    } else {
      setSubscription({ ...defaultSubscription, loading: false });
      setTeam({ ...defaultTeam, loading: false });
      setIsSuperAdmin(false);
    }
  }, [session, checkSubscription, loadTeam, loadSuperAdmin]);

  // Periodic refresh every 60s
  useEffect(() => {
    if (!session) return;
    const interval = setInterval(checkSubscription, 60_000);
    return () => clearInterval(interval);
  }, [session, checkSubscription]);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{
      session,
      user: session?.user ?? null,
      loading,
      subscription,
      team,
      checkSubscription,
      signOut,
    }}>
      {children}
    </AuthContext.Provider>
  );
}
