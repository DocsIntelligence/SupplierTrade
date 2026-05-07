'use client';

import {
  fetchMeThunk,
  logoutThunk,
  selectIsAuthenticated,
  selectUser,
  useAppDispatch,
  useAppSelector,
} from '@org/store';
import { Button } from '@org/ui';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function DashboardPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const user = useAppSelector(selectUser);
  const isAuth = useAppSelector(selectIsAuthenticated);

  useEffect(() => {
    if (!isAuth) {
      router.replace('/login');
    } else if (!user) {
      void dispatch(fetchMeThunk());
    }
  }, [dispatch, isAuth, router, user]);

  const onLogout = async () => {
    await dispatch(logoutThunk());
    router.replace('/login');
  };

  return (
    <main className="min-h-screen p-8 max-w-3xl mx-auto space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <Button variant="danger" size="sm" onClick={onLogout}>
          Logout
        </Button>
      </header>
      <section className="space-y-2 text-gray-700">
        <p>Welcome{user?.name ? `, ${user.name}` : ''}.</p>
        {user ? (
          <p>
            Signed in as <strong>{user.email}</strong> ({user.role}).
          </p>
        ) : null}
      </section>
    </main>
  );
}
