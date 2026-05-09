import './i18n';
import {
  createAuthService,
  createHttpClient,
  createUsersService,
} from '@org/api-client';
import { authActions, configureAppStore } from '@org/store';
import { StrictMode } from 'react';
import * as ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'sonner';
import App from './app/app';
import { APP_ENV } from './config';
import './styles.css';

const API_BASE_URL = APP_ENV.apiUrl;

// Separate client for refresh — no interceptors to avoid loops
const httpForRefresh = createHttpClient({
  baseURL: API_BASE_URL,
  withCredentials: true,
});
const authForRefresh = createAuthService(httpForRefresh);

// Main HTTP client with refresh interceptor
const http = createHttpClient({
  baseURL: API_BASE_URL,
  withCredentials: true,
  refreshAccessToken: async () => {
    try {
      const result = await authForRefresh.refresh({});
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
