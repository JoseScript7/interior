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
    <>
      <div className="pricing-header px-3 py-3 pt-md-5 pb-md-4 mx-auto text-center">
        <h1 className="display-4">Feedback</h1>
        <p className="lead">Share your thoughts, report bugs, or suggest features.</p>
      </div>

      <div className="container">
        <div className="row mb-5">
          {/* Feedback Form */}
          <div className="col-md-6 mb-4">
            <div className="card box-shadow h-100">
              <div className="card-header">
                <h4 className="my-0 font-weight-normal">Submit Feedback</h4>
              </div>
              <div className="card-body">
                {createMutation.isSuccess && (
                  <div className="alert alert-success" role="alert">
                    Feedback submitted successfully!
                  </div>
                )}

                {createMutation.isError && (
                  <div className="alert alert-danger" role="alert">
                    {createMutation.error instanceof Error ? createMutation.error.message : 'Submission failed'}
                  </div>
                )}

                <form onSubmit={handleSubmit(onSubmit)} noValidate>
                  <div className="mb-3">
                    <label htmlFor="title" className="form-label">Title</label>
                    <input
                      id="title"
                      type="text"
                      placeholder="Brief summary of your feedback"
                      className={`form-control ${errors.title ? 'is-invalid' : ''}`}
                      {...register('title')}
                    />
                    {errors.title && <div className="invalid-feedback">{errors.title.message}</div>}
                  </div>

                  <div className="mb-3">
                    <label htmlFor="category" className="form-label">Category</label>
                    <select
                      id="category"
                      className={`form-select ${errors.category ? 'is-invalid' : ''}`}
                      {...register('category')}
                      defaultValue=""
                    >
                      <option value="" disabled>Select a category…</option>
                      <option value="bug">🐛 Bug Report</option>
                      <option value="feature">✨ Feature Request</option>
                      <option value="general">💬 General Feedback</option>
                    </select>
                    {errors.category && <div className="invalid-feedback">{errors.category.message}</div>}
                  </div>

                  <div className="mb-3">
                    <label htmlFor="message" className="form-label">Message</label>
                    <textarea
                      id="message"
                      placeholder="Describe your feedback in detail"
                      className={`form-control ${errors.message ? 'is-invalid' : ''}`}
                      rows={4}
                      {...register('message')}
                    />
                    {errors.message && <div className="invalid-feedback">{errors.message.message}</div>}
                  </div>

                  <button type="submit" className="btn btn-primary w-100" disabled={isSubmitting || createMutation.isPending}>
                    {createMutation.isPending ? 'Submitting…' : 'Submit Feedback'}
                  </button>
                </form>
              </div>
            </div>
          </div>

          {/* Feedback History */}
          <div className="col-md-6 mb-4">
            <div className="card box-shadow h-100">
              <div className="card-header">
                <h4 className="my-0 font-weight-normal">Your Feedback History</h4>
              </div>
              <div className="card-body overflow-auto" style={{ maxHeight: '500px' }}>
                {isLoading && (
                  <div className="text-center mt-4">
                    <div className="spinner-border text-primary" />
                    <p className="mt-2 text-muted">Loading your feedback…</p>
                  </div>
                )}

                {isError && (
                  <div className="alert alert-danger">Failed to load feedback history.</div>
                )}

                {data && data.feedback.length === 0 && (
                  <p className="text-center text-muted mt-4">No feedback submitted yet. Be the first!</p>
                )}

                {data && data.feedback.length > 0 && (
                  <div className="list-group list-group-flush">
                    {data.feedback.map((item) => (
                      <div className="list-group-item px-0 py-3" key={item.id}>
                        <div className="d-flex w-100 justify-content-between align-items-center mb-1">
                          <h6 className="mb-0 fw-bold">{item.title}</h6>
                          <span className={`badge ${item.category === 'bug' ? 'bg-danger' : item.category === 'feature' ? 'bg-success' : 'bg-info'}`}>
                            {categoryLabel(item.category)}
                          </span>
                        </div>
                        <p className="mb-1 text-muted small">{item.message}</p>
                        <small className="text-secondary">
                          {new Date(item.created_at + 'Z').toLocaleDateString('en-US', {
                            month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
                          })}
                        </small>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
