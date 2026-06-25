import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { feedbackSchema, type FeedbackFormData } from '../schemas/feedbackSchema';
import { useUserFeedback, useCreateFeedback } from '../hooks/useFeedback';

export default function FeedbackPage() {
  const { data, isLoading, isError } = useUserFeedback();
  const createMutation = useCreateFeedback();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FeedbackFormData>({
    resolver: zodResolver(feedbackSchema),
    defaultValues: { title: '', message: '', category: undefined },
  });

  const onSubmit = async (formData: FeedbackFormData) => {
    await createMutation.mutateAsync(formData);
    reset();
  };

  const categoryLabel = (cat: string) => {
    switch (cat) {
      case 'bug': return '🐛 Bug';
      case 'feature': return '✨ Feature';
      default: return '💬 General';
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>Feedback</h1>
        <p className="page-subtitle">Share your thoughts, report bugs, or suggest features</p>
      </div>

      {/* Feedback Form */}
      <div className="card">
        <h2 className="card-title">Submit Feedback</h2>

        {createMutation.isSuccess && (
          <div className="alert alert-success" role="status">
            Feedback submitted successfully!
          </div>
        )}

        {createMutation.isError && (
          <div className="alert alert-error" role="alert">
            {createMutation.error instanceof Error ? createMutation.error.message : 'Submission failed'}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="form-group">
            <label htmlFor="title">Title</label>
            <input
              id="title"
              type="text"
              placeholder="Brief summary of your feedback"
              className={errors.title ? 'input input-error' : 'input'}
              {...register('title')}
            />
            {errors.title && <span className="field-error">{errors.title.message}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="category">Category</label>
            <select
              id="category"
              className={errors.category ? 'input input-error' : 'input'}
              {...register('category')}
              defaultValue=""
            >
              <option value="" disabled>Select a category…</option>
              <option value="bug">🐛 Bug Report</option>
              <option value="feature">✨ Feature Request</option>
              <option value="general">💬 General Feedback</option>
            </select>
            {errors.category && <span className="field-error">{errors.category.message}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="message">Message</label>
            <textarea
              id="message"
              placeholder="Describe your feedback in detail (min. 10 characters)"
              className={errors.message ? 'input textarea input-error' : 'input textarea'}
              rows={4}
              {...register('message')}
            />
            {errors.message && <span className="field-error">{errors.message.message}</span>}
          </div>

          <button type="submit" className="btn btn-primary" disabled={isSubmitting || createMutation.isPending}>
            {createMutation.isPending ? 'Submitting…' : 'Submit Feedback'}
          </button>
        </form>
      </div>

      {/* Feedback History */}
      <div className="card">
        <h2 className="card-title">Your Feedback History</h2>

        {isLoading && (
          <div className="chart-loading">
            <div className="spinner" />
            <p>Loading your feedback…</p>
          </div>
        )}

        {isError && (
          <div className="alert alert-error">Failed to load feedback history.</div>
        )}

        {data && data.feedback.length === 0 && (
          <p className="empty-state">No feedback submitted yet. Be the first!</p>
        )}

        {data && data.feedback.length > 0 && (
          <div className="feedback-list">
            {data.feedback.map((item) => (
              <div className="feedback-item" key={item.id}>
                <div className="feedback-header">
                  <h3>{item.title}</h3>
                  <span className={`chip chip-${item.category}`}>{categoryLabel(item.category)}</span>
                </div>
                <p className="feedback-message">{item.message}</p>
                <span className="feedback-date">
                  {new Date(item.created_at + 'Z').toLocaleDateString('en-US', {
                    month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
                  })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
