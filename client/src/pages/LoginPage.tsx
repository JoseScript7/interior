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
    <div className="auth-wrapper">
      <main className="form-signin w-100 m-auto text-center">
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="mb-4">
            <span className="text-primary" style={{ fontSize: '3rem' }}>◉</span>
            <h1 className="h3 mb-3 fw-normal">Please sign in</h1>
          </div>

          {serverError && (
            <div className="alert alert-danger" role="alert">
              {serverError}
            </div>
          )}

          <div className="form-floating">
            <input
              type="email"
              className={`form-control ${errors.email ? 'is-invalid' : ''}`}
              id="floatingInput"
              placeholder="name@example.com"
              {...register('email')}
            />
            <label htmlFor="floatingInput">Email address</label>
            {errors.email && <div className="invalid-feedback text-start">{errors.email.message}</div>}
          </div>
          
          <div className="form-floating">
            <input
              type="password"
              className={`form-control ${errors.password ? 'is-invalid' : ''}`}
              id="floatingPassword"
              placeholder="Password"
              {...register('password')}
            />
            <label htmlFor="floatingPassword">Password</label>
            {errors.password && <div className="invalid-feedback text-start">{errors.password.message}</div>}
          </div>

          <button className="btn btn-primary w-100 py-2 mt-3" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Signing in…' : 'Sign in'}
          </button>
          
          <p className="mt-4 mb-3 text-body-secondary">
            Don't have an account? <Link to="/register" className="text-decoration-none">Register</Link>
          </p>
        </form>
      </main>
    </div>
  );
}
