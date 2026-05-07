'use client';

import { useMemo, type ReactNode } from 'react';
import { Provider } from 'react-redux';
import { createAuthService, createHttpClient, createUsersService } from '@org/api-client';
import { authActions, configureAppStore, type AppStore } from '@org/store';

const API_BASE_URL =
  (process.env['NEXT_PUBLIC_API_URL'] as string | undefined) ??
  'http://localhost:3000/api';

let storeRef: AppStore | null = null;

const buildStore = (): AppStore => {
  const httpForRefresh = createHttpClient({ baseURL: API_BASE_URL });
  const authForRefresh = createAuthService(httpForRefresh);

  const http = createHttpClient({
    baseURL: API_BASE_URL,
    withCredentials: true,
    getAccessToken: () => storeRef?.getState().auth.accessToken ?? null,
    refreshAccessToken: async () => {
      const refreshToken = storeRef?.getState().auth.refreshToken;
      if (!refreshToken || !storeRef) return null;
      try {
        const result = await authForRefresh.refresh({ refreshToken });
        storeRef.dispatch(
          authActions.setTokens({
            accessToken: result.accessToken,
            refreshToken: result.refreshToken,
          }),
        );
        storeRef.dispatch(authActions.setUser(result.user));
        return result.accessToken;
      } catch {
        storeRef.dispatch(authActions.clearAuth());
        return null;
      }
    },
    onUnauthorized: () => {
      storeRef?.dispatch(authActions.clearAuth());
    },
  });

  const auth = createAuthService(http);
  const users = createUsersService(http);

  return configureAppStore({ services: { auth, users } });
};

export function Providers({ children }: { children: ReactNode }) {
  const store = useMemo(() => {
    storeRef = storeRef ?? buildStore();
    return storeRef;
  }, []);
  return <Provider store={store}>{children}</Provider>;
}
