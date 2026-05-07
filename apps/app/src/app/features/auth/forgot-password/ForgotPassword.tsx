import { zodResolver } from '@hookform/resolvers/zod';
import { forgotPasswordSchema, type ForgotPasswordDto } from '@org/dto';
import { forgotPasswordThunk, useAppDispatch } from '@org/store';
import { Button, FormField, Input } from '@org/ui';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

export function ForgotPassword() {
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
    <form onSubmit={onSubmit} className="space-y-4">
      <h2 className="text-lg font-semibold">Forgot password</h2>
      <FormField label="Email" error={errors.email?.message}>
        <Input type="email" invalid={!!errors.email} {...register('email')} />
      </FormField>
      <Button type="submit" isLoading={isSubmitting} className="w-full">
        Send reset link
      </Button>
      <div className="text-sm">
        <Link to="/login" className="text-blue-600 hover:underline">
          Back to sign in
        </Link>
      </div>
    </form>
  );
}

export default ForgotPassword;
