import type { AuthService } from '@org/api-client';
import type {
  AuthResponse,
  ChangePasswordDto,
  ForgotPasswordDto,
  LoginDto,
  RegisterDto,
  ResetPasswordDto,
  User,
} from '@org/dto';
import {
  createAsyncThunk,
  createSlice,
  type PayloadAction,
} from '@reduxjs/toolkit';

export const AUTH_FEATURE_KEY = 'auth';

export type LoadingStatus = 'idle' | 'pending' | 'succeeded' | 'failed';

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  status: LoadingStatus;
  error: string | null;
}

export const initialAuthState: AuthState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  status: 'idle',
  error: null,
};

type Thunks = { extra: { auth: AuthService } };

export const loginThunk = createAsyncThunk<AuthResponse, LoginDto, Thunks>(
  'auth/login',
  async (payload, { extra, rejectWithValue }) => {
    try {
      return await extra.auth.login(payload);
    } catch (e: unknown) {
      return rejectWithValue(extractMessage(e));
    }
  },
);

export const registerThunk = createAsyncThunk<
  AuthResponse,
  RegisterDto,
  Thunks
>('auth/register', async (payload, { extra, rejectWithValue }) => {
  try {
    return await extra.auth.register(payload);
  } catch (e: unknown) {
    return rejectWithValue(extractMessage(e));
  }
});

export const fetchMeThunk = createAsyncThunk<User, void, Thunks>(
  'auth/me',
  async (_, { extra, rejectWithValue }) => {
    try {
      return await extra.auth.me();
    } catch (e: unknown) {
      return rejectWithValue(extractMessage(e));
    }
  },
);

export const logoutThunk = createAsyncThunk<void, void, Thunks>(
  'auth/logout',
  async (_, { extra }) => {
    try {
      await extra.auth.logout();
    } catch {
      /* ignore network errors on logout */
    }
  },
);

export const forgotPasswordThunk = createAsyncThunk<
  void,
  ForgotPasswordDto,
  Thunks
>('auth/forgotPassword', async (payload, { extra, rejectWithValue }) => {
  try {
    await extra.auth.forgotPassword(payload);
  } catch (e: unknown) {
    return rejectWithValue(extractMessage(e));
  }
});

export const resetPasswordThunk = createAsyncThunk<
  void,
  ResetPasswordDto,
  Thunks
>('auth/resetPassword', async (payload, { extra, rejectWithValue }) => {
  try {
    await extra.auth.resetPassword(payload);
  } catch (e: unknown) {
    return rejectWithValue(extractMessage(e));
  }
});

export const changePasswordThunk = createAsyncThunk<
  void,
  ChangePasswordDto,
  Thunks
>('auth/changePassword', async (payload, { extra, rejectWithValue }) => {
  try {
    await extra.auth.changePassword(payload);
  } catch (e: unknown) {
    return rejectWithValue(extractMessage(e));
  }
});

const pending = (state: AuthState) => {
  state.status = 'pending';
  state.error = null;
};

const rejected = (
  state: AuthState,
  action: { payload?: unknown; error: { message?: string } },
) => {
  state.status = 'failed';
  state.error =
    typeof action.payload === 'string'
      ? action.payload
      : (action.error?.message ?? 'Unknown error');
};

const extractMessage = (e: unknown): string => {
  if (typeof e === 'object' && e && 'message' in e) {
    const message = (e as { message?: unknown }).message;
    if (typeof message === 'string') return message;
  }
  return 'Unknown error';
};

const authSlice = createSlice({
  name: AUTH_FEATURE_KEY,
  initialState: initialAuthState,
  reducers: {
    setTokens(
      state,
      action: PayloadAction<{ accessToken: string; refreshToken: string }>,
    ) {
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
    },
    setUser(state, action: PayloadAction<User | null>) {
      state.user = action.payload;
    },
    clearAuth(state) {
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.status = 'idle';
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    const onAuthFulfilled = (
      state: AuthState,
      action: PayloadAction<AuthResponse>,
    ) => {
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      state.status = 'succeeded';
      state.error = null;
    };

    builder
      .addCase(loginThunk.pending, pending)
      .addCase(loginThunk.fulfilled, onAuthFulfilled)
      .addCase(loginThunk.rejected, rejected)
      .addCase(registerThunk.pending, pending)
      .addCase(registerThunk.fulfilled, onAuthFulfilled)
      .addCase(registerThunk.rejected, rejected)
      .addCase(fetchMeThunk.pending, pending)
      .addCase(fetchMeThunk.fulfilled, (state, action) => {
        state.user = action.payload;
        state.status = 'succeeded';
      })
      .addCase(fetchMeThunk.rejected, rejected)
      .addCase(logoutThunk.fulfilled, (state) => {
        state.user = null;
        state.accessToken = null;
        state.refreshToken = null;
        state.status = 'idle';
      });
  },
});

export const authReducer = authSlice.reducer;
export const authActions = authSlice.actions;

export const selectAuth = (state: { [AUTH_FEATURE_KEY]: AuthState }) =>
  state[AUTH_FEATURE_KEY];
export const selectUser = (state: { [AUTH_FEATURE_KEY]: AuthState }) =>
  state[AUTH_FEATURE_KEY].user;
export const selectIsAuthenticated = (state: {
  [AUTH_FEATURE_KEY]: AuthState;
}) => Boolean(state[AUTH_FEATURE_KEY].accessToken);
export const selectAccessToken = (state: {
  [AUTH_FEATURE_KEY]: AuthState;
}) => state[AUTH_FEATURE_KEY].accessToken;
export const selectAuthStatus = (state: {
  [AUTH_FEATURE_KEY]: AuthState;
}) => state[AUTH_FEATURE_KEY].status;
