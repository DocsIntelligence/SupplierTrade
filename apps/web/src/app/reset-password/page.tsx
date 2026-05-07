'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { resetPasswordSchema, type ResetPasswordDto } from '@org/dto';
import { resetPasswordThunk, useAppDispatch } from '@org/store';
import { Button, Card, FormField, Input } from '@org/ui';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

export default function ResetPasswordPage() {
  const params = useSearchParams();
  const dispatch = useAppDispatch();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordDto>({
    resolver: zodResolver(resetPasswordSchema),
  });

  useEffect(() => {
    const token = params.get('token');
    if (token) setValue('token', token);
  }, [params, setValue]);

  const onSubmit = handleSubmit(async (values) => {
    const result = await dispatch(resetPasswordThunk(values));
    if (resetPasswordThunk.fulfilled.match(result)) {
      toast.success('Password updated. Sign in again.');
      router.push('/login');
    } else {
      toast.error('Invalid or expired token.');
    }
  });

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">@org/web</h1>
          <p className="text-sm text-gray-500 mt-1">Password recovery</p>
        </div>

        <Card padding="lg" className="rounded-xl">
          <form onSubmit={onSubmit} className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Reset password
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Choose a new password for your account
              </p>
            </div>

            <input type="hidden" {...register('token')} />

            <div className="space-y-4">
              <FormField label="New password" error={errors.password?.message}>
                <Input
                  type="password"
                  placeholder="••••••••"
                  invalid={!!errors.password}
                  {...register('password')}
                />
              </FormField>
            </div>

            <Button type="submit" isLoading={isSubmitting} className="w-full">
              Update password
            </Button>

            <div className="text-sm pt-2">
              <Link href="/login" className="text-blue-600 hover:underline">
                ← Back to sign in
              </Link>
            </div>
          </form>
        </Card>
      </div>
    </main>
  );
}
