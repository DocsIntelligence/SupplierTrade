'use client';

import { useMemo, type ReactNode } from 'react';
import { Provider } from 'react-redux';
import {
  createAuthService,
  createHttpClient,
  createUsersService,
} from '@org/api-client';
import { authActions, configureAppStore, type AppStore } from '@org/store';
import { WEB_ENV } from '../config';

const API_BASE_URL = WEB_ENV.apiUrl;

let storeRef: AppStore | null = null;

const buildStore = (): AppStore => {
  const httpForRefresh = createHttpClient({
    baseURL: API_BASE_URL,
    withCredentials: true,
  });
  const authForRefresh = createAuthService(httpForRefresh);

  const http = createHttpClient({
    baseURL: API_BASE_URL,
    withCredentials: true,
    // Cookies are sent automatically — no need for getAccessToken
    refreshAccessToken: async () => {
      if (!storeRef) return null;
      try {
        // Cookie-based refresh: browser sends refresh_token cookie automatically
        const result = await authForRefresh.refresh({} as never);
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
