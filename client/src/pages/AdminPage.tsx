import { useQuery } from '@tanstack/react-query';
import { useAllFeedback } from '../hooks/useFeedback';
import type { UsersResponse } from '../types';

function useAllUsers() {
  return useQuery({
    queryKey: ['adminUsers'],
    queryFn: async (): Promise<UsersResponse> => {
      const res = await fetch('/api/admin/users', { credentials: 'include' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to fetch users');
      }
      return res.json();
    },
    staleTime: 30_000,
  });
}

export default function AdminPage() {
  const { data: usersData, isLoading: usersLoading, isError: usersError } = useAllUsers();
  const { data: feedbackData, isLoading: feedbackLoading, isError: feedbackError } = useAllFeedback();

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
        <h1 className="display-4">Admin Panel</h1>
        <p className="lead">Manage users and review all feedback submitted across the platform.</p>
      </div>

      <div className="container">
        {/* Users Table */}
        <div className="card mb-4 box-shadow">
          <div className="card-header">
            <h4 className="my-0 font-weight-normal">All Users</h4>
          </div>
          <div className="card-body p-0">
            {usersLoading && (
              <div className="text-center p-4">
                <div className="spinner-border text-primary" />
                <p className="mt-2 text-muted">Loading users…</p>
              </div>
            )}

            {usersError && <div className="alert alert-danger m-3">Failed to load users.</div>}

            {usersData && (
              <div className="table-responsive">
                <table className="table table-hover table-striped mb-0">
                  <thead className="table-light">
                    <tr>
                      <th className="ps-4">ID</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usersData.users.map((u) => (
                      <tr key={u.id}>
                        <td className="ps-4">{u.id}</td>
                        <td>{u.name}</td>
                        <td>{u.email}</td>
                        <td>
                          <span className={`badge ${u.role === 'admin' ? 'bg-warning text-dark' : 'bg-secondary'}`}>
                            {u.role}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* All Feedback */}
        <div className="card mb-5 box-shadow">
          <div className="card-header d-flex justify-content-between align-items-center">
            <h4 className="my-0 font-weight-normal">All Feedback</h4>
            <span className="badge bg-primary rounded-pill">{feedbackData?.feedback.length ?? 0}</span>
          </div>
          <div className="card-body p-0">
            {feedbackLoading && (
              <div className="text-center p-4">
                <div className="spinner-border text-primary" />
                <p className="mt-2 text-muted">Loading feedback…</p>
              </div>
            )}

            {feedbackError && <div className="alert alert-danger m-3">Failed to load feedback.</div>}

            {feedbackData && feedbackData.feedback.length === 0 && (
              <p className="text-center text-muted p-4 mb-0">No feedback has been submitted yet.</p>
            )}

            {feedbackData && feedbackData.feedback.length > 0 && (
              <ul className="list-group list-group-flush">
                {feedbackData.feedback.map((item) => (
                  <li className="list-group-item p-4" key={item.id}>
                    <div className="d-flex w-100 justify-content-between align-items-center mb-2">
                      <h5 className="mb-0 fw-bold">{item.title}</h5>
                      <span className={`badge ${item.category === 'bug' ? 'bg-danger' : item.category === 'feature' ? 'bg-success' : 'bg-info'}`}>
                        {categoryLabel(item.category)}
                      </span>
                    </div>
                    <p className="mb-2 text-dark">{item.message}</p>
                    <div className="d-flex justify-content-between align-items-center mt-3">
                      <small className="text-muted">
                        Submitted by <span className="fw-bold text-dark">{item.user_name}</span> ({item.user_email})
                      </small>
                      <small className="text-muted">
                        {new Date(item.created_at + 'Z').toLocaleDateString('en-US', {
                          month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
                        })}
                      </small>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
