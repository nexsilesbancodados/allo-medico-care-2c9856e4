import { createContext, useContext, useEffect, useState, useMemo, useCallback, ReactNode, useRef } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type AppRole = "patient" | "doctor" | "clinic" | "admin" | "receptionist" | "support" | "partner" | "affiliate";

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
  const fetchingRef = useRef(false);

  const fetchUserData = async (userId: string, retries = 2) => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    try {
      const [profileRes, rolesRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("user_id", userId).single(),
        supabase.from("user_roles").select("role").eq("user_id", userId),
      ]);

      if (profileRes.data) setProfile(profileRes.data as Profile);
      if (rolesRes.data) setRoles(rolesRes.data.map((r: any) => r.role as AppRole));

      // Retry if both failed (network issue)
      if (profileRes.error && rolesRes.error && retries > 0) {
        fetchingRef.current = false;
        await new Promise(r => setTimeout(r, 1000));
        return fetchUserData(userId, retries - 1);
      }
    } finally {
      fetchingRef.current = false;
    }
  };

  useEffect(() => {
    // Use only onAuthStateChange with INITIAL_SESSION for clean initialization
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          await fetchUserData(session.user.id);
        } else {
          setProfile(null);
          setRoles([]);
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setRoles([]);
  }, []);

  const refreshRoles = useCallback(async () => {
    if (user) await fetchUserData(user.id);
  }, [user]);

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
