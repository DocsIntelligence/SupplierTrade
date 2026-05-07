import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema, type RegisterDto } from '@org/dto';
import {
  registerThunk,
  selectAuth,
  useAppDispatch,
  useAppSelector,
} from '@org/store';
import { Button, FormField, Input, OAuthButtons } from '@org/ui';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const API_BASE_URL =
  import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';

export function Register() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
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
      navigate('/dashboard', { replace: true });
    } else {
      toast.error('Registration failed');
    }
  });

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Create account</h2>
        <p className="text-sm text-gray-500 mt-1">
          Fill in your details to get started
        </p>
      </div>

      <div className="space-y-4">
        <FormField label="Name" error={errors.name?.message}>
          <Input
            placeholder="John Doe"
            autoComplete="name"
            hasError={!!errors.name}
            {...hookRegister('name')}
          />
        </FormField>
        <FormField label="Username" error={errors.username?.message}>
          <Input
            placeholder="johndoe"
            autoComplete="username"
            hasError={!!errors.username}
            {...hookRegister('username')}
          />
        </FormField>
        <FormField label="Email" error={errors.email?.message}>
          <Input
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            hasError={!!errors.email}
            {...hookRegister('email')}
          />
        </FormField>
        <FormField label="Password" error={errors.password?.message}>
          <Input
            type="password"
            placeholder="••••••••"
            autoComplete="new-password"
            hasError={!!errors.password}
            {...hookRegister('password')}
          />
        </FormField>
      </div>

      <Button type="submit" isLoading={status === 'pending'} className="w-full">
        Sign up
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

      <p className="text-sm text-center text-gray-600 pt-2">
        Already have an account?{' '}
        <Link to="/login" className="text-blue-600 hover:underline font-medium">
          Sign in
        </Link>
      </p>
    </form>
  );
}

export default Register;
