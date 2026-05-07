'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema, type RegisterDto } from '@org/dto';
import {
  registerThunk,
  selectAuth,
  useAppDispatch,
  useAppSelector,
} from '@org/store';
import { Button, FormField, Input } from '@org/ui';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

export default function RegisterPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { status } = useAppSelector(selectAuth);

  const {
    register: hookRegister,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterDto>({ resolver: zodResolver(registerSchema) });

  const onSubmit = handleSubmit(async (values) => {
    const result = await dispatch(registerThunk(values));
    if (registerThunk.fulfilled.match(result)) {
      toast.success('Account created');
      router.replace('/dashboard');
    } else {
      toast.error('Registration failed');
    }
  });

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-md p-8 bg-white rounded-lg shadow space-y-4"
      >
        <h1 className="text-xl font-semibold">Create account</h1>
        <FormField label="Name" error={errors.name?.message}>
          <Input invalid={!!errors.name} {...hookRegister('name')} />
        </FormField>
        <FormField label="Username" error={errors.username?.message}>
          <Input invalid={!!errors.username} {...hookRegister('username')} />
        </FormField>
        <FormField label="Email" error={errors.email?.message}>
          <Input
            type="email"
            invalid={!!errors.email}
            {...hookRegister('email')}
          />
        </FormField>
        <FormField label="Password" error={errors.password?.message}>
          <Input
            type="password"
            invalid={!!errors.password}
            {...hookRegister('password')}
          />
        </FormField>
        <Button
          type="submit"
          isLoading={status === 'pending'}
          className="w-full"
        >
          Sign up
        </Button>
        <div className="text-sm">
          Already have an account?{' '}
          <Link href="/login" className="text-blue-600 hover:underline">
            Sign in
          </Link>
        </div>
      </form>
    </main>
  );
}
