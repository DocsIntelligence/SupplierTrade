'use client';

import {
  fetchMeThunk,
  logoutThunk,
  selectUser,
  useAppDispatch,
  useAppSelector,
} from '@org/store';
import { Avatar, Button, Card } from '@org/ui';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function DashboardPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const user = useAppSelector(selectUser);

  useEffect(() => {
    if (!user) void dispatch(fetchMeThunk());
  }, [dispatch, user]);

  const onLogout = async () => {
    await dispatch(logoutThunk());
    router.replace('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-10 border-b border-gray-200 bg-white">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <h1 className="text-lg font-semibold text-gray-900">@org/web</h1>
          <div className="flex items-center gap-4">
            {user && (
              <div className="flex items-center gap-2">
                <Avatar name={user.name} size="sm" />
                <span className="text-sm text-gray-700 hidden sm:inline">
                  {user.email}
                </span>
              </div>
            )}
            <Button variant="ghost" size="sm" onClick={onLogout}>
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Dashboard</h2>
          <p className="text-gray-500 mt-1">
            {user ? `Welcome back, ${user.name}` : 'Loading profile…'}
          </p>
        </div>

        {user && (
          <Card padding="lg" className="rounded-xl">
            <div className="flex items-center gap-4">
              <Avatar name={user.name} size="lg" />
              <div>
                <p className="font-medium text-gray-900">{user.name}</p>
                <p className="text-sm text-gray-500">{user.email}</p>
                <span className="inline-block mt-1 text-xs font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                  {user.role}
                </span>
              </div>
            </div>
          </Card>
        )}
      </main>
    </div>
  );
}
