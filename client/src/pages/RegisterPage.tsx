import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema, type RegisterFormData } from '../schemas/feedbackSchema';
import { useAuthStore } from '../store/authStore';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register: registerUser } = useAuthStore();
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    setServerError('');
    try {
      await registerUser(data.name, data.email, data.password);
      navigate('/dashboard');
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Registration failed');
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <span className="auth-logo"></span>
          <h1>Create account</h1>
          <p className="auth-subtitle">Get started with StockPulse</p>
        </div>

        {serverError && (
          <div className="alert alert-error" role="alert">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="form-group">
            <label htmlFor="name">Full name</label>
            <input
              id="name"
              type="text"
              placeholder="Thiru"
              className={errors.name ? 'input input-error' : 'input'}
              {...register('name')}
            />
            {errors.name && <span className="field-error">{errors.name.message}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              className={errors.email ? 'input input-error' : 'input'}
              {...register('email')}
            />
            {errors.email && <span className="field-error">{errors.email.message}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder="Min. 6 characters"
              className={errors.password ? 'input input-error' : 'input'}
              {...register('password')}
            />
            {errors.password && <span className="field-error">{errors.password.message}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm password</label>
            <input
              id="confirmPassword"
              type="password"
              placeholder="Repeat your password"
              className={errors.confirmPassword ? 'input input-error' : 'input'}
              {...register('confirmPassword')}
            />
            {errors.confirmPassword && <span className="field-error">{errors.confirmPassword.message}</span>}
          </div>

          <button type="submit" className="btn btn-primary btn-full" disabled={isSubmitting}>
            {isSubmitting ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
