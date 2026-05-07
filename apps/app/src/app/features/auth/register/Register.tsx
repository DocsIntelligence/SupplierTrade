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
    <form onSubmit={onSubmit} className="space-y-4">
      <h2 className="text-lg font-semibold">Create account</h2>
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
      <Button type="submit" isLoading={status === 'pending'} className="w-full">
        Sign up
      </Button>
      <div className="text-sm">
        Already have an account?{' '}
        <Link to="/login" className="text-blue-600 hover:underline">
          Sign in
        </Link>
      </div>
    </form>
  );
}

export default Register;
