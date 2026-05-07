import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from 'axios';

export type TokenGetter = () => string | null | Promise<string | null>;
export type TokenRefresher = () => Promise<string | null>;
export type UnauthorizedHandler = () => void | Promise<void>;

export type HttpClientOptions = {
  baseURL: string;
  withCredentials?: boolean;
  getAccessToken?: TokenGetter;
  refreshAccessToken?: TokenRefresher;
  onUnauthorized?: UnauthorizedHandler;
};

export const createHttpClient = (
  options: HttpClientOptions,
): AxiosInstance => {
  const instance = axios.create({
    baseURL: options.baseURL,
    withCredentials: options.withCredentials ?? true,
    timeout: 30_000,
  });

  instance.interceptors.request.use(async (config) => {
    if (options.getAccessToken) {
      const token = await options.getAccessToken();
      if (token) {
        config.headers.set('Authorization', `Bearer ${token}`);
      }
    }
    return config;
  });

  let refreshing: Promise<string | null> | null = null;

  instance.interceptors.response.use(
    (r) => r,
    async (error: AxiosError) => {
      const original = error.config as AxiosRequestConfig & {
        _retried?: boolean;
      };

      if (
        error.response?.status === 401 &&
        original &&
        !original._retried &&
        options.refreshAccessToken
      ) {
        original._retried = true;
        refreshing ??= options.refreshAccessToken().finally(() => {
          refreshing = null;
        });
        const newToken = await refreshing;
        if (newToken) {
          original.headers = {
            ...(original.headers ?? {}),
            Authorization: `Bearer ${newToken}`,
          };
          return instance.request(original);
        }
        if (options.onUnauthorized) await options.onUnauthorized();
      }
      return Promise.reject(error);
    },
  );

  return instance;
};

export type HttpClient = ReturnType<typeof createHttpClient>;
