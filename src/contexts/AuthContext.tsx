import { createContext, useContext, useEffect, useState, useMemo, useCallback, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type AppRole = "patient" | "doctor" | "clinic" | "admin" | "receptionist" | "support" | "partner" | "affiliate" | "laudista";

interface Profile {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  cpf: string | null;
  phone: string | null;
  avatar_url: string | null;
  date_of_birth: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  roles: AppRole[];
  loading: boolean;
  signOut: () => Promise<void>;
  refreshRoles: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  profile: null,
  roles: [],
  loading: true,
  signOut: async () => {},
  refreshRoles: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUserData = useCallback(async (userId: string) => {
    try {
      const [profileRes, rolesRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("user_id", userId).maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", userId),
      ]);
      if (profileRes.data) setProfile(profileRes.data as Profile);
      if (rolesRes.data) setRoles(rolesRes.data.map((r: any) => r.role as AppRole));
    } catch (e) {
      console.error("fetchUserData error:", e);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    // 1. Primary init: getSession (works even if onAuthStateChange is delayed)
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      if (!mounted) return;
      setSession(s);
      setUser(s?.user ?? null);

      if (s?.user) {
        fetchUserData(s.user.id).finally(() => { if (mounted) setLoading(false); });
      } else {
        setLoading(false);
      }
    }).catch(() => {
      if (mounted) setLoading(false);
    });

    // 2. Listen for subsequent auth changes (sign in/out/token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, s) => {
        if (!mounted) return;
        setSession(s);
        setUser(s?.user ?? null);

        if (s?.user) {
          fetchUserData(s.user.id);
        } else {
          setProfile(null);
          setRoles([]);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchUserData]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setRoles([]);
  }, []);

  const refreshRoles = useCallback(async () => {
    if (user) await fetchUserData(user.id);
  }, [user, fetchUserData]);

  const contextValue = useMemo(
    () => ({ user, session, profile, roles, loading, signOut, refreshRoles }),
    [user, session, profile, roles, loading, signOut, refreshRoles]
  );

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};
