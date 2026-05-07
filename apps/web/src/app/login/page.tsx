'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginDto } from '@org/dto';
import {
  loginThunk,
  selectAuth,
  useAppDispatch,
  useAppSelector,
} from '@org/store';
import { Button, Card, FormField, Input, OAuthButtons } from '@org/ui';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

const API_BASE_URL =
  process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3000/api';

function LoginForm() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const params = useSearchParams();
  const { status } = useAppSelector(selectAuth);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginDto>({ resolver: zodResolver(loginSchema) });

  const onSubmit = handleSubmit(async (values) => {
    const result = await dispatch(loginThunk(values));
    if (loginThunk.fulfilled.match(result)) {
      toast.success('Welcome back!');
      router.replace(params.get('next') ?? '/dashboard');
    } else {
      toast.error('Invalid credentials');
    }
  });

  return (
    <Card className="rounded-xl p-8">
      <form onSubmit={onSubmit} className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Sign in</h2>
          <p className="text-sm text-gray-500 mt-1">
            Enter your credentials to access your account
          </p>
        </div>

        <div className="space-y-4">
          <FormField
            label="Email or username"
            error={errors.identifier?.message}
          >
            <Input
              placeholder="you@example.com"
              hasError={!!errors.identifier}
              {...register('identifier')}
            />
          </FormField>
          <FormField label="Password" error={errors.password?.message}>
            <Input
              type="password"
              placeholder="••••••••"
              hasError={!!errors.password}
              {...register('password')}
            />
          </FormField>
        </div>

        <Button
          type="submit"
          isLoading={status === 'pending'}
          className="w-full"
        >
          Sign in
        </Button>

        <div className="relative py-2">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-background px-2 text-foreground/60">
              or continue with
            </span>
          </div>
        </div>

        <OAuthButtons apiUrl={API_BASE_URL} />

        <div className="text-sm flex items-center justify-between pt-2">
          <Link
            href="/forgot-password"
            className="text-blue-600 hover:underline"
          >
            Forgot password?
          </Link>
          <Link href="/register" className="text-blue-600 hover:underline">
            Create account
          </Link>
        </div>
      </form>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-foreground">@org/web</h1>
          <p className="text-sm text-foreground/60 mt-1">Welcome back</p>
        </div>
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}
