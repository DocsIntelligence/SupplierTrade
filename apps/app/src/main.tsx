import { createAuthService, createHttpClient, createUsersService } from '@org/api-client';
import { authActions, configureAppStore } from '@org/store';
import { StrictMode } from 'react';
import * as ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'sonner';
import App from './app/app';

const API_BASE_URL =
  (import.meta.env.VITE_API_URL as string | undefined) ??
  'http://localhost:3000/api';

const httpForRefresh = createHttpClient({ baseURL: API_BASE_URL });
const authForRefresh = createAuthService(httpForRefresh);

const http = createHttpClient({
  baseURL: API_BASE_URL,
  withCredentials: true,
  getAccessToken: () => store.getState().auth.accessToken,
  refreshAccessToken: async () => {
    const refreshToken = store.getState().auth.refreshToken;
    if (!refreshToken) return null;
    try {
      const result = await authForRefresh.refresh({ refreshToken });
      store.dispatch(
        authActions.setTokens({
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
        }),
      );
      store.dispatch(authActions.setUser(result.user));
      return result.accessToken;
    } catch {
      store.dispatch(authActions.clearAuth());
      return null;
    }
  },
  onUnauthorized: () => {
    store.dispatch(authActions.clearAuth());
  },
});

const auth = createAuthService(http);
const users = createUsersService(http);

const store = configureAppStore({ services: { auth, users } });

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement,
);

root.render(
  <Provider store={store}>
    <StrictMode>
      <BrowserRouter>
        <App />
        <Toaster richColors position="top-right" />
      </BrowserRouter>
    </StrictMode>
  </Provider>,
);
