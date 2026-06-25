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
    <div className="auth-wrapper">
      <main className="form-signup w-100 m-auto text-center">
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="mb-4">
            <span className="text-primary" style={{ fontSize: '3rem' }}>◉</span>
            <h1 className="h3 mb-3 fw-normal">Create an account</h1>
          </div>

          {serverError && (
            <div className="alert alert-danger" role="alert">
              {serverError}
            </div>
          )}

          <div className="form-floating">
            <input
              type="text"
              className={`form-control top-field ${errors.name ? 'is-invalid' : ''}`}
              id="floatingName"
              placeholder="John Doe"
              {...register('name')}
            />
            <label htmlFor="floatingName">Full name</label>
            {errors.name && <div className="invalid-feedback text-start mb-2">{errors.name.message}</div>}
          </div>

          <div className="form-floating">
            <input
              type="email"
              className={`form-control middle-field ${errors.email ? 'is-invalid' : ''}`}
              id="floatingEmail"
              placeholder="name@example.com"
              {...register('email')}
            />
            <label htmlFor="floatingEmail">Email address</label>
            {errors.email && <div className="invalid-feedback text-start mb-2">{errors.email.message}</div>}
          </div>

          <div className="form-floating">
            <input
              type="password"
              className={`form-control middle-field ${errors.password ? 'is-invalid' : ''}`}
              id="floatingPassword"
              placeholder="Password"
              {...register('password')}
            />
            <label htmlFor="floatingPassword">Password</label>
            {errors.password && <div className="invalid-feedback text-start mb-2">{errors.password.message}</div>}
          </div>

          <div className="form-floating">
            <input
              type="password"
              className={`form-control bottom-field ${errors.confirmPassword ? 'is-invalid' : ''}`}
              id="floatingConfirmPassword"
              placeholder="Confirm Password"
              {...register('confirmPassword')}
            />
            <label htmlFor="floatingConfirmPassword">Confirm Password</label>
            {errors.confirmPassword && <div className="invalid-feedback text-start">{errors.confirmPassword.message}</div>}
          </div>

          <button className="btn btn-primary w-100 py-2 mt-3" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Creating account…' : 'Register'}
          </button>
          
          <p className="mt-4 mb-3 text-body-secondary">
            Already have an account? <Link to="/login" className="text-decoration-none">Sign in</Link>
          </p>
        </form>
      </main>
    </div>
  );
}
