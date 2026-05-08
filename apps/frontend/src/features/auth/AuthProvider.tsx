import { createContext, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { ApiError } from '../../services/apiClient';
import {
  getCurrentUserRequest,
  loginRequest,
  registerClienteRequest,
  registerProfissionalCompletoRequest,
  registerProfissionalRequest,
} from './authApi';
import { AUTH_STORAGE_KEYS, authStorage } from './authStorage';
import type {
  AuthLoginRequest,
  CadastroClienteRequest,
  CadastroProfissionalCompletoRequest,
  CadastroProfissionalRequest,
  CadastroUsuarioResponse,
  UsuarioAutenticado,
} from './types';

type AuthStatus = 'loading' | 'authenticated' | 'anonymous';

type AuthContextValue = {
  token: string | null;
  user: UsuarioAutenticado | null;
  status: AuthStatus;
  isAuthenticated: boolean;
  login: (payload: AuthLoginRequest) => Promise<UsuarioAutenticado>;
  registerCliente: (payload: CadastroClienteRequest) => Promise<CadastroUsuarioResponse>;
  registerProfissional: (payload: CadastroProfissionalRequest) => Promise<CadastroUsuarioResponse>;
  registerProfissionalCompleto: (payload: CadastroProfissionalCompletoRequest) => Promise<CadastroUsuarioResponse>;
  refreshUser: () => Promise<UsuarioAutenticado | null>;
  logout: () => void;
};

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const sessionRequestRef = useRef<{ token: string; promise: Promise<UsuarioAutenticado> } | null>(null);
  const sessionRevisionRef = useRef(0);
  const [token, setToken] = useState<string | null>(() => authStorage.getToken());
  const [user, setUser] = useState<UsuarioAutenticado | null>(null);
  const [status, setStatus] = useState<AuthStatus>(() => (authStorage.getToken() ? 'loading' : 'anonymous'));

  const clearSession = useCallback(() => {
    sessionRevisionRef.current += 1;
    sessionRequestRef.current = null;
    authStorage.clearToken();
    queryClient.clear();
    setToken(null);
    setUser(null);
    setStatus('anonymous');
  }, [queryClient]);

  const loadCurrentUser = useCallback((activeToken: string) => {
    if (sessionRequestRef.current?.token === activeToken) {
      return sessionRequestRef.current.promise;
    }

    const request = getCurrentUserRequest(activeToken);
    sessionRequestRef.current = { token: activeToken, promise: request };

    void request.finally(() => {
      if (sessionRequestRef.current?.promise === request) {
        sessionRequestRef.current = null;
      }
    }).catch(() => undefined);

    return request;
  }, []);

  const hydrateUser = useCallback(
    async (activeToken: string | null) => {
      if (!activeToken) {
        clearSession();
        return null;
      }

      const requestRevision = sessionRevisionRef.current;
      setStatus('loading');

      try {
        const currentUser = await loadCurrentUser(activeToken);

        if (sessionRevisionRef.current !== requestRevision || authStorage.getToken() !== activeToken) {
          return null;
        }

        setToken(activeToken);
        setUser(currentUser);
        setStatus('authenticated');
        return currentUser;
      } catch (error) {
        if (sessionRevisionRef.current !== requestRevision || authStorage.getToken() !== activeToken) {
          return null;
        }

        if (isUnauthorized(error)) {
          clearSession();
          return null;
        }

        setStatus((currentStatus) =>
          currentStatus === 'loading' ? (token === activeToken && user ? 'authenticated' : 'anonymous') : currentStatus,
        );
        throw error;
      }
    },
    [clearSession, loadCurrentUser, token, user],
  );

  useEffect(() => {
    let isActive = true;

    async function loadSession() {
      const storedToken = authStorage.getToken();
      const requestRevision = sessionRevisionRef.current;

      if (!storedToken) {
        if (isActive) {
          clearSession();
        }
        return;
      }

      try {
        const currentUser = await loadCurrentUser(storedToken);

        if (isActive && sessionRevisionRef.current === requestRevision && authStorage.getToken() === storedToken) {
          setToken(storedToken);
          setUser(currentUser);
          setStatus('authenticated');
        }
      } catch (error) {
        if (isActive && sessionRevisionRef.current === requestRevision && authStorage.getToken() === storedToken) {
          if (isUnauthorized(error)) {
            clearSession();
          } else {
            setStatus((currentStatus) => (currentStatus === 'loading' ? 'anonymous' : currentStatus));
          }
        }
      }
    }

    void loadSession();

    return () => {
      isActive = false;
    };
  }, [clearSession, loadCurrentUser]);

  useEffect(() => {
    function handleStorage(event: StorageEvent) {
      if (event.storageArea !== window.localStorage || (event.key && !AUTH_STORAGE_KEYS.includes(event.key))) {
        return;
      }

      const storedToken = authStorage.getToken();

      if (!storedToken) {
        clearSession();
        return;
      }

      if (storedToken !== token) {
        sessionRevisionRef.current += 1;
        sessionRequestRef.current = null;
        queryClient.clear();
        setToken(storedToken);
        setUser(null);
        setStatus('loading');
        void hydrateUser(storedToken).catch(() => undefined);
      }
    }

    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener('storage', handleStorage);
    };
  }, [clearSession, hydrateUser, queryClient, token]);

  const login = useCallback(async (payload: AuthLoginRequest) => {
    const response = await loginRequest(payload);

    sessionRevisionRef.current += 1;
    sessionRequestRef.current = null;
    queryClient.clear();

    authStorage.setToken(response.accessToken);
    setToken(response.accessToken);
    setUser(response.usuario);
    setStatus('authenticated');

    return response.usuario;
  }, [queryClient]);

  const refreshUser = useCallback(() => hydrateUser(token), [hydrateUser, token]);

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      user,
      status,
      isAuthenticated: status === 'authenticated' && Boolean(user),
      login,
      registerCliente: registerClienteRequest,
      registerProfissional: registerProfissionalRequest,
      registerProfissionalCompleto: registerProfissionalCompletoRequest,
      refreshUser,
      logout: clearSession,
    }),
    [clearSession, login, refreshUser, status, token, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

function isUnauthorized(error: unknown) {
  return error instanceof ApiError && error.status === 401;
}
