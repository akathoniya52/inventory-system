import { createContext, useContext, useState, type ReactNode } from "react";
import { authApi } from "@/api/endpoints";
import { clearToken, getToken, setToken } from "@/api/client";
import type { AuthUser } from "@/types";

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const USER_KEY = "inventorypro_user";

function loadStoredUser(): AuthUser | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() =>
    getToken() ? loadStoredUser() : null,
  );

  const login = async (email: string, password: string) => {
    const res = await authApi.login(email, password);
    setToken(res.access_token);
    localStorage.setItem(USER_KEY, JSON.stringify(res.user));
    setUser(res.user);
  };

  const logout = () => {
    clearToken();
    localStorage.removeItem(USER_KEY);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
