'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { forgotPasswordSchema, type ForgotPasswordDto } from '@org/dto';
import { forgotPasswordThunk, useAppDispatch } from '@org/store';
import { Button, FormField, Input } from '@org/ui';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

export default function ForgotPasswordPage() {
  const dispatch = useAppDispatch();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordDto>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = handleSubmit(async (values) => {
    const result = await dispatch(forgotPasswordThunk(values));
    if (forgotPasswordThunk.fulfilled.match(result)) {
      toast.success('If an account exists, we sent a reset link.');
    } else {
      toast.error('Could not start reset flow.');
    }
  });

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-md p-8 bg-white rounded-lg shadow space-y-4"
      >
        <h1 className="text-xl font-semibold">Forgot password</h1>
        <FormField label="Email" error={errors.email?.message}>
          <Input type="email" invalid={!!errors.email} {...register('email')} />
        </FormField>
        <Button type="submit" isLoading={isSubmitting} className="w-full">
          Send reset link
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
