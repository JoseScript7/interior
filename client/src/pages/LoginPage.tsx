import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginFormData } from '../schemas/feedbackSchema';
import { useAuthStore } from '../store/authStore';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setServerError('');
    try {
      await login(data.email, data.password);
      navigate('/dashboard');
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Login failed');
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <span className="auth-logo">◉</span>
          <h1>Welcome back</h1>
          <p className="auth-subtitle">Sign in to your account</p>
        </div>

        {serverError && (
          <div className="alert alert-error" role="alert">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              placeholder="you@gmail.com"
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
              placeholder="••••••••"
              className={errors.password ? 'input input-error' : 'input'}
              {...register('password')}
            />
            {errors.password && <span className="field-error">{errors.password.message}</span>}
          </div>

          <button type="submit" className="btn btn-primary btn-full" disabled={isSubmitting}>
            {isSubmitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="auth-footer">
          Don't have an account? <Link to="/register">Register</Link>
        </p>
      </div>
    </div>
  );
}
