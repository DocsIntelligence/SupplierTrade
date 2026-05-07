'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginDto } from '@org/dto';
import {
  loginThunk,
  selectAuth,
  useAppDispatch,
  useAppSelector,
} from '@org/store';
import { Button, Card, FormField, Input } from '@org/ui';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

export default function LoginPage() {
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
    <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">@org/web</h1>
          <p className="text-sm text-gray-500 mt-1">Welcome back</p>
        </div>

        <Card padding="lg" className="rounded-xl">
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
                  invalid={!!errors.identifier}
                  {...register('identifier')}
                />
              </FormField>
              <FormField label="Password" error={errors.password?.message}>
                <Input
                  type="password"
                  placeholder="••••••••"
                  invalid={!!errors.password}
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
      </div>
    </main>
  );
}
