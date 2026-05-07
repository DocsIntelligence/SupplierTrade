'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { resetPasswordSchema, type ResetPasswordDto } from '@org/dto';
import { resetPasswordThunk, useAppDispatch } from '@org/store';
import { Button, FormField, Input } from '@org/ui';
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
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-md p-8 bg-white rounded-lg shadow space-y-4"
      >
        <h1 className="text-xl font-semibold">Reset password</h1>
        <input type="hidden" {...register('token')} />
        <FormField label="New password" error={errors.password?.message}>
          <Input
            type="password"
            invalid={!!errors.password}
            {...register('password')}
          />
        </FormField>
        <Button type="submit" isLoading={isSubmitting} className="w-full">
          Update password
        </Button>
        <div className="text-sm">
          <Link href="/login" className="text-blue-600 hover:underline">
            Back to sign in
          </Link>
        </div>
      </form>
    </main>
  );
}
