import { zodResolver } from '@hookform/resolvers/zod';
import { resetPasswordSchema, type ResetPasswordDto } from '@org/dto';
import { resetPasswordThunk, useAppDispatch } from '@org/store';
import { Button, FormField, Input } from '@org/ui';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';

export function ResetPassword() {
  const [params] = useSearchParams();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordDto>({ resolver: zodResolver(resetPasswordSchema) });

  useEffect(() => {
    const token = params.get('token');
    if (token) setValue('token', token);
  }, [params, setValue]);

  const onSubmit = handleSubmit(async (values) => {
    const result = await dispatch(resetPasswordThunk(values));
    if (resetPasswordThunk.fulfilled.match(result)) {
      toast.success('Password updated. Sign in again.');
      navigate('/login');
    } else {
      toast.error('Invalid or expired token.');
    }
  });

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <h2 className="text-lg font-semibold">Reset password</h2>
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
        <Link to="/login" className="text-blue-600 hover:underline">
          Back to sign in
        </Link>
      </div>
    </form>
  );
}

export default ResetPassword;
