import { createContext, useContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
});

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;

      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!mounted) return;

        setSession(data.session);
        setUser(data.session?.user ?? null);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Erro ao buscar sessão do Supabase:", error);

        if (!mounted) return;

        setSession(null);
        setUser(null);
        setLoading(false);
      });

    const timeout = setTimeout(() => {
      if (!mounted) return;

      console.warn("Timeout no AuthProvider. Liberando carregamento.");
      setLoading(false);
    }, 3000);

    return () => {
      mounted = false;
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, session, loading }}>
      {children}
    </AuthContext.Provider>
  );
};