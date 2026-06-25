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
      case 'bug': return ' Bug';
      case 'feature': return ' Feature';
      default: return ' General';
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>Admin Panel</h1>
        <p className="page-subtitle">Manage users and review all feedback</p>
      </div>

      {/* Users Table */}
      <div className="card">
        <h2 className="card-title">All Users</h2>

        {usersLoading && (
          <div className="chart-loading">
            <div className="spinner" />
            <p>Loading users…</p>
          </div>
        )}

        {usersError && <div className="alert alert-error">Failed to load users.</div>}

        {usersData && (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                </tr>
              </thead>
              <tbody>
                {usersData.users.map((u) => (
                  <tr key={u.id}>
                    <td>{u.id}</td>
                    <td>{u.name}</td>
                    <td>{u.email}</td>
                    <td>
                      <span className={`role-badge ${u.role === 'admin' ? 'role-admin' : 'role-user'}`}>
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

      {/* All Feedback */}
      <div className="card">
        <h2 className="card-title">All Feedback ({feedbackData?.feedback.length ?? 0})</h2>

        {feedbackLoading && (
          <div className="chart-loading">
            <div className="spinner" />
            <p>Loading feedback…</p>
          </div>
        )}

        {feedbackError && <div className="alert alert-error">Failed to load feedback.</div>}

        {feedbackData && feedbackData.feedback.length === 0 && (
          <p className="empty-state">No feedback has been submitted yet.</p>
        )}

        {feedbackData && feedbackData.feedback.length > 0 && (
          <div className="feedback-list">
            {feedbackData.feedback.map((item) => (
              <div className="feedback-item" key={item.id}>
                <div className="feedback-header">
                  <h3>{item.title}</h3>
                  <span className={`chip chip-${item.category}`}>{categoryLabel(item.category)}</span>
                </div>
                <p className="feedback-message">{item.message}</p>
                <div className="feedback-meta">
                  <span className="feedback-author">by {item.user_name} ({item.user_email})</span>
                  <span className="feedback-date">
                    {new Date(item.created_at + 'Z').toLocaleDateString('en-US', {
                      month: 'short', day: 'numeric', year: 'numeric'
                    })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
