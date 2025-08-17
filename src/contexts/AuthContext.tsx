import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import * as bcrypt from "bcryptjs";
import { toast } from "sonner";

interface User {
  id: string;
  username: string;
  is_admin: boolean;
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  loading: boolean;
  signUp: (username: string, password: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        // Buscar dados do usuário na tabela users
        const { data: userData, error } = await supabase
          .from("users")
          .select("id, username, is_admin")
          .eq("id", session.user.id)
          .single();

        if (userData && !error) {
          setUser(userData);
          return;
        }
      }

      // DEV: restore persisted dev user so admin/dev keeps permissions across reloads
      if (import.meta.env.DEV) {
        const raw = localStorage.getItem("dev_user");
        if (raw) {
          try {
            const devUser = JSON.parse(raw) as User;
            setUser(devUser);
            return;
          } catch (e) {
            console.warn("Failed to parse dev_user from localStorage", e);
          }
        }
      }
    } catch (error) {
      console.error("Error checking user:", error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (
    username: string,
    password: string
  ): Promise<boolean> => {
    try {
      setLoading(true);

      // Development fallback: if the backend users query fails (e.g. 406) or you want
      // to test locally without proper auth setup, allow a dev login.
      // This branch only runs in development.
      if (import.meta.env.DEV) {
        // quick dev shortcut: accept admin/admin and admin/admin123 as local dev credentials
        if (
          username === "admin" &&
          (password === "admin" || password === "admin123")
        ) {
          const devUser: User = {
            id: "dev-admin",
            username: "admin",
            is_admin: true,
          };
          setUser(devUser);
          try {
            localStorage.setItem("dev_user", JSON.stringify(devUser));
          } catch (e) {
            console.warn("Could not persist dev_user", e);
          }
          toast.success("Login de desenvolvimento realizado");
          return true;
        }
      }

      // Buscar usuário pelo username
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("*")
        .eq("username", username)
        .single();

      if (userError || !userData) {
        toast.error("Usuário não encontrado");
        return false;
      }

      // Verificar senha
      const validPassword = await bcrypt.compare(password, userData.password);
      if (!validPassword) {
        toast.error("Senha incorreta");
        return false;
      }

      // Fazer login no Supabase Auth usando o ID do usuário como email
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: `${userData.id}@proofchest.local`,
        password: userData.id, // Usar o ID como senha temporária
      });

      if (signInError) {
        // Se o usuário não existe no auth, criar
        const { error: signUpError } = await supabase.auth.signUp({
          email: `${userData.id}@proofchest.local`,
          password: userData.id,
          options: {
            data: {
              user_id: userData.id,
            },
          },
        });

        if (signUpError) {
          toast.error("Erro ao fazer login");
          return false;
        }
      }

      setUser({
        id: userData.id,
        username: userData.username,
        is_admin: userData.is_admin,
      });

      toast.success("Login realizado com sucesso!");
      return true;
    } catch (error) {
      console.error("Login error:", error);

      // If there was an error querying the users table (e.g. PostgREST 406), and we are
      // in development, allow a fallback dev login so the app can be tested locally.
      if (import.meta.env.DEV) {
        const devUser: User = {
          id: "dev-fallback",
          username: username,
          is_admin: false,
        };
        setUser(devUser);
        try {
          localStorage.setItem("dev_user", JSON.stringify(devUser));
        } catch (e) {
          console.warn("Could not persist dev_user", e);
        }
        // toast.warn is not available in sonner typings — use a generic toast message instead
        toast("Login de desenvolvimento habilitado devido a erro no backend");
        return true;
      }

      toast.error("Erro ao fazer login");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (
    username: string,
    password: string
  ): Promise<boolean> => {
    try {
      setLoading(true);

      // Simple validation
      if (!username || !password) {
        toast.error("Preencha usuário e senha");
        return false;
      }

      const hashed = await bcrypt.hash(password, 10);

      // Insert user into users table; let DB generate id (uuid)
      const { data: inserted, error: insertError } = await supabase
        .from("users")
        .insert({ username, password: hashed, is_admin: false })
        .select("id, username, is_admin")
        .single();

      if (insertError || !inserted) {
        console.error("SignUp insert error:", insertError);
        // DEV fallback: persist a dev user locally so signup is possible offline
        if (import.meta.env.DEV) {
          const devUser: User = {
            id: `dev-${username}-${Date.now()}`,
            username,
            is_admin: false,
          };
          setUser(devUser);
          try {
            localStorage.setItem("dev_user", JSON.stringify(devUser));
            const existing = JSON.parse(
              localStorage.getItem("dev_documents") || "[]"
            );
            localStorage.setItem(
              "dev_documents",
              JSON.stringify(existing || [])
            );
          } catch (e) {
            console.warn("Could not persist dev_user", e);
          }
          toast.success("Conta criada (modo desenvolvimento)");
          return true;
        }

        toast.error("Erro ao criar conta");
        return false;
      }

      // Create auth user using id as password so login flow stays consistent
      const { error: authErr } = await supabase.auth.signUp({
        email: `${inserted.id}@proofchest.local`,
        password: inserted.id,
        options: {
          data: { user_id: inserted.id },
        },
      });

      if (authErr) {
        console.warn("Auth signup warning:", authErr);
        // Not fatal for the app if auth creation fails; continue
      }

      setUser({
        id: inserted.id,
        username: inserted.username,
        is_admin: inserted.is_admin,
      });
      toast.success("Conta criada com sucesso!");
      return true;
    } catch (error) {
      console.error("SignUp error:", error);
      toast.error("Erro ao criar conta");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn("Supabase signOut failed:", e);
    }
    setUser(null);
    // remove persisted dev user if any
    try {
      localStorage.removeItem("dev_user");
    } catch (e) {
      /* ignore */
    }
    toast.success("Logout realizado com sucesso!");
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, signUp }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
