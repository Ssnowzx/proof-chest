import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import * as bcrypt from 'bcryptjs';
import { toast } from 'sonner';

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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        // Buscar dados do usuário na tabela users
        const { data: userData, error } = await supabase
          .from('users')
          .select('id, username, is_admin')
          .eq('id', session.user.id)
          .single();

        if (userData && !error) {
          setUser(userData);
        }
      }
    } catch (error) {
      console.error('Error checking user:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      setLoading(true);
      
      // Buscar usuário pelo username
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .single();

      if (userError || !userData) {
        toast.error('Usuário não encontrado');
        return false;
      }

      // Verificar senha
      const validPassword = await bcrypt.compare(password, userData.password);
      if (!validPassword) {
        toast.error('Senha incorreta');
        return false;
      }

      // Fazer login no Supabase Auth usando o ID do usuário como email
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: `${userData.id}@proofchest.local`,
        password: userData.id // Usar o ID como senha temporária
      });

      if (signInError) {
        // Se o usuário não existe no auth, criar
        const { error: signUpError } = await supabase.auth.signUp({
          email: `${userData.id}@proofchest.local`,
          password: userData.id,
          options: {
            data: {
              user_id: userData.id
            }
          }
        });

        if (signUpError) {
          toast.error('Erro ao fazer login');
          return false;
        }
      }

      setUser({
        id: userData.id,
        username: userData.username,
        is_admin: userData.is_admin
      });

      toast.success('Login realizado com sucesso!');
      return true;
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Erro ao fazer login');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    toast.success('Logout realizado com sucesso!');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};