import type { AuthService, UsersService } from '@org/api-client';
import { combineReducers, configureStore } from '@reduxjs/toolkit';
import { APP_FEATURE_KEY, appReducer } from './slices/app.slice.js';
import { AUTH_FEATURE_KEY, authReducer } from './slices/auth.slice.js';
import { USERS_FEATURE_KEY, usersReducer } from './slices/users.slice.js';

export const rootReducer = combineReducers({
  [APP_FEATURE_KEY]: appReducer,
  [AUTH_FEATURE_KEY]: authReducer,
  [USERS_FEATURE_KEY]: usersReducer,
});

export type RootState = ReturnType<typeof rootReducer>;

export type StoreServices = {
  auth: AuthService;
  users: UsersService;
};

export type ConfigureAppStoreOptions = {
  services: StoreServices;
  preloadedState?: Partial<RootState>;
};

export const configureAppStore = ({
  services,
  preloadedState,
}: ConfigureAppStoreOptions) =>
  configureStore({
    reducer: rootReducer,
    preloadedState,
    middleware: (getDefault) =>
      getDefault({ thunk: { extraArgument: services } }),
  });

export type AppStore = ReturnType<typeof configureAppStore>;
export type AppDispatch = AppStore['dispatch'];
