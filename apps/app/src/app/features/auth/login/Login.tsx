import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginDto } from '@org/dto';
import {
  loginThunk,
  selectAuth,
  useAppDispatch,
  useAppSelector,
} from '@org/store';
import { Button, FormField, Input } from '@org/ui';
import { useForm } from 'react-hook-form';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export function Login() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
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
      const target =
        (location.state as { from?: { pathname: string } } | null)?.from
          ?.pathname ?? '/dashboard';
      navigate(target, { replace: true });
    } else {
      toast.error('Invalid credentials');
    }
  });

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Sign in</h2>
        <p className="text-sm text-gray-500 mt-1">
          Enter your credentials to access your account
        </p>
      </div>

      <div className="space-y-4">
        <FormField label="Email or username" error={errors.identifier?.message}>
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

      <Button type="submit" isLoading={status === 'pending'} className="w-full">
        Sign in
      </Button>

      <div className="text-sm flex items-center justify-between pt-2">
        <Link to="/forgot-password" className="text-blue-600 hover:underline">
          Forgot password?
        </Link>
        <Link to="/register" className="text-blue-600 hover:underline">
          Create account
        </Link>
      </div>
    </form>
  );
}

export default Login;
