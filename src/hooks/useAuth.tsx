// src/hooks/useAuth.tsx
import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { auth } from "@/integrations/supabase/client";

interface User {
  id: string;
  name: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<AuthResult>;
  register: (name: string, email: string, password: string) => Promise<AuthResult>;
  logout: () => void;
}
type AuthResult = { error?: { message: string } };

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      // Можно сделать GET /auth/me, если backend поддерживает
      // иначе оставляем user null, авторизация через login/register
    }
  }, []);

  const login = async (email: string, password: string): Promise<AuthResult> => {
    try {
      const res = await auth.login({ email, password });
      setUser(res.user);
      return {};
    } catch (err) {
      return { error: { message: err.message || "Login failed" } };
    }
  };

  const register = async (name: string, email: string, password: string): Promise<AuthResult> => {
    try {
      const res = await auth.register({ name, email, password });
      setUser(res.user);
      return {};
    } catch (err: unknown) {
      if (err instanceof Error) {
        return { error: { message: err.message } };
      }
      return { error: { message: "Unknown error" } };
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};