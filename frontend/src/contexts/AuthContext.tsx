import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../services/authService';
import type { LoginResponse } from '../services/authService';
import { tokenStorage } from '../services/tokenStorage';

export type UserRole = 'UNIVERSIDAD' | 'DOCENTE' | 'ESTUDIANTE';

export interface UserProfile {
  id: number;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  fullName: string;
  roles: string[];
  permissions: string[];
  department?: string;
  avatar?: string;
}

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  role: UserRole | null;
  roles: string[];
  permissions: string[];
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (usernameOrEmail: string, password: string, remember?: boolean) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (patch: Partial<UserProfile>) => void;
  hasPermission: (permission: string) => boolean;
  hasAnyRole: (...roles: string[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const mapAuthUser = (data: LoginResponse): UserProfile => ({
  id: data.user.id,
  username: data.user.username,
  email: data.user.email,
  firstName: data.user.firstName,
  lastName: data.user.lastName,
  fullName: data.user.fullName,
  roles: Array.isArray(data.roles) ? data.roles : Array.isArray(data.user.roles) ? data.user.roles : [],
  permissions: Array.isArray(data.permissions) ? data.permissions : Array.isArray(data.user.permissions) ? data.user.permissions : [],
  department: data.user.department,
  avatar: data.user.avatar,
});

const normalizeUser = (value: unknown): UserProfile | null => {
  if (!value || typeof value !== 'object') return null;
  const candidate = value as UserProfile;
  if (typeof candidate.username !== 'string') return null;
  return {
    ...candidate,
    roles: Array.isArray(candidate.roles) ? candidate.roles : [],
    permissions: Array.isArray(candidate.permissions) ? candidate.permissions : [],
  };
};

const loadStoredUser = (): UserProfile | null => {
  const parsed = tokenStorage.getUser<UserProfile>();
  if (!parsed) return null;
  if (!Array.isArray(parsed.roles) || !Array.isArray(parsed.permissions)) return null;
  return normalizeUser(parsed);
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(loadStoredUser);
  const [token, setToken] = useState<string | null>(() => tokenStorage.getAccessToken());
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    tokenStorage.saveUser(user);
  }, [user]);

  // El interceptor de Axios renueva el token en segundo plano; mantenemos el estado sincronizado.
  useEffect(() => {
    const alRenovar = (evento: Event) => {
      const detalle = (evento as CustomEvent<string>).detail;
      if (detalle) setToken(detalle);
    };
    window.addEventListener('gestoracad:token-renovado', alRenovar);
    return () => window.removeEventListener('gestoracad:token-renovado', alRenovar);
  }, []);

  // Refresca el perfil desde el servidor al cargar (evita datos obsoletos y alinea con el token)
  useEffect(() => {
    const storedToken = tokenStorage.getAccessToken();
    if (!storedToken) return;
    authService
      .getProfile()
      .then((res) => {
        if (res.success && res.data) {
          setUser((current) =>
            current
              ? {
                  ...current,
                  username: res.data.username,
                  email: res.data.email,
                  firstName: res.data.firstName,
                  lastName: res.data.lastName,
                  fullName: res.data.fullName,
                  department: res.data.department,
                  avatar: res.data.avatar,
                  roles: Array.isArray(res.data.roles) ? res.data.roles : current.roles,
                  permissions: Array.isArray(res.data.permissions) ? res.data.permissions : current.permissions,
                }
              : current
          );
        }
      })
      .catch(() => undefined);
  }, []);

  // Latido de presencia: mantiene "última conexión" actualizada mientras la sesión está activa
  useEffect(() => {
    if (!user) return;
    authService.heartbeat().catch(() => undefined);
    const id = window.setInterval(() => {
      authService.heartbeat().catch(() => undefined);
    }, 30000);
    return () => window.clearInterval(id);
  }, [user]);

  const login = useCallback(async (usernameOrEmail: string, password: string, remember = false) => {
    setIsLoading(true);
    try {
      const response = await authService.login({ usernameOrEmail, password });
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Error de autenticación');
      }
      const profile = mapAuthUser(response.data);
      tokenStorage.saveTokens(response.data.token, response.data.refreshToken, remember);
      tokenStorage.saveUser(profile, remember);
      setToken(response.data.token);
      setUser(profile);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      const refreshToken = tokenStorage.getRefreshToken();
      if (tokenStorage.getAccessToken()) {
        await authService.logout(refreshToken ?? undefined);
      }
    } catch {
      // La sesión local se limpia aunque falle la llamada al backend
    } finally {
      tokenStorage.clear();
      setToken(null);
      setUser(null);
    }
  }, []);

  const hasPermission = useCallback(
    (permission: string) => !!user && (user.permissions ?? []).includes(permission),
    [user]
  );

  const hasAnyRole = useCallback(
    (...roles: string[]) => !!user && roles.some((r) => (user.roles ?? []).includes(r)),
    [user]
  );

  const updateUser = useCallback((patch: Partial<UserProfile>) => {
    setUser((current) => (current ? { ...current, ...patch } : current));
  }, []);

  const role: UserRole | null = (() => {
    const userRoles = user?.roles ?? [];
    if (userRoles.includes('ROLE_UNIVERSIDAD')) return 'UNIVERSIDAD';
    if (userRoles.includes('ROLE_DOCENTE')) return 'DOCENTE';
    if (userRoles.includes('ROLE_ESTUDIANTE')) return 'ESTUDIANTE';
    return null;
  })();

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        role,
        roles: user?.roles || [],
        permissions: user?.permissions || [],
        isAuthenticated: !!user && !!token,
        isLoading,
        login,
        logout,
        updateUser,
        hasPermission,
        hasAnyRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser utilizado dentro de un AuthProvider');
  }
  return context;
};
