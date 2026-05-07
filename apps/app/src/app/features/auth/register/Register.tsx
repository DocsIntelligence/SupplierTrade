import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema, type RegisterDto } from '@org/dto';
import {
  registerThunk,
  selectAuth,
  useAppDispatch,
  useAppSelector,
} from '@org/store';
import { Button, FormField, Input } from '@org/ui';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

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
            hasError={!!errors.name}
            {...hookRegister('name')}
          />
        </FormField>
        <FormField label="Username" error={errors.username?.message}>
          <Input
            placeholder="johndoe"
            hasError={!!errors.username}
            {...hookRegister('username')}
          />
        </FormField>
        <FormField label="Email" error={errors.email?.message}>
          <Input
            type="email"
            placeholder="you@example.com"
            hasError={!!errors.email}
            {...hookRegister('email')}
          />
        </FormField>
        <FormField label="Password" error={errors.password?.message}>
          <Input
            type="password"
            placeholder="••••••••"
            hasError={!!errors.password}
            {...hookRegister('password')}
          />
        </FormField>
      </div>

      <Button type="submit" isLoading={status === 'pending'} className="w-full">
        Sign up
      </Button>

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
