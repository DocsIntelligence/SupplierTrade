'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginDto } from '@org/dto';
import {
  loginThunk,
  selectAuth,
  useAppDispatch,
  useAppSelector,
} from '@org/store';
import { Button, FormField, Input } from '@org/ui';
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
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-md p-8 bg-white rounded-lg shadow space-y-4"
      >
        <h1 className="text-xl font-semibold">Sign in</h1>
        <FormField label="Email or username" error={errors.identifier?.message}>
          <Input invalid={!!errors.identifier} {...register('identifier')} />
        </FormField>
        <FormField label="Password" error={errors.password?.message}>
          <Input
            type="password"
            invalid={!!errors.password}
            {...register('password')}
          />
        </FormField>
        <Button
          type="submit"
          isLoading={status === 'pending'}
          className="w-full"
        >
          Sign in
        </Button>
        <div className="text-sm flex items-center justify-between">
          <Link href="/forgot-password" className="text-blue-600 hover:underline">
            Forgot password?
          </Link>
          <Link href="/register" className="text-blue-600 hover:underline">
            Create account
          </Link>
        </div>
      </form>
    </main>
  );
}
