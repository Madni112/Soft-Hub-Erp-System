import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from './supabaseClient';
import * as RoleRoutes from '../Navigation/Roles';
import { UserRole } from '../constant/auth';

interface AuthContextType {
  isAuthenticated: boolean;
  role: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  getRoleBasedRoutes: () => any[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      handleAuthState(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      handleAuthState(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleAuthState = (session: any) => {
    if (session) {
      setIsAuthenticated(true);
      setRole(session.user.user_metadata.role || UserRole.STUDENT);
    } else {
      setIsAuthenticated(false);
      setRole(null);
    }
  };

  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    navigate('/');
  };

  const logout = async () => {
    await supabase.auth.signOut();
    navigate('/auth/signin');
  };

  const getRoleBasedRoutes = () => {
    switch (role) {
      case UserRole.ADMIN: return RoleRoutes.adminRoutes;
      case UserRole.TEACHER: return RoleRoutes.adminRoutes;
      case UserRole.STUDENT: return RoleRoutes.adminRoutes;
      default: return [];
    }
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, role, loading, login, logout, getRoleBasedRoutes }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
