'use client';

import { fetchMeThunk, useAppDispatch } from '@org/store';
import { PageLoader } from '@org/ui';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect } from 'react';
import { toast } from 'sonner';

function CallbackHandler() {
  const params = useSearchParams();
  const router = useRouter();
  const dispatch = useAppDispatch();

  useEffect(() => {
    const status = params.get('status');
    const method = params.get('method');

    if (status === 'authenticated') {
      void dispatch(fetchMeThunk()).then(() => {
        toast.success(`Signed in with ${method ?? 'OAuth'}`);
        router.replace('/dashboard');
      });
    } else {
      toast.error('Authentication failed');
      router.replace('/login');
    }
  }, [params, router, dispatch]);

  return <PageLoader message="Completing sign in..." />;
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<PageLoader message="Completing sign in..." />}>
      <CallbackHandler />
    </Suspense>
  );
}
