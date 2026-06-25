import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export default function Layout() {
  const { user, isLoggedIn, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="app-layout">
      {isLoggedIn && (
        <nav className="navbar" role="navigation" aria-label="Main navigation">
          <div className="nav-brand">
            <span className="nav-logo">◉</span>
            <span className="nav-title">StockPulse</span>
          </div>

          <div className="nav-links">
            <NavLink to="/dashboard" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
              Dashboard
            </NavLink>
            <NavLink to="/feedback" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
              Feedback
            </NavLink>
            {user?.role === 'admin' && (
              <NavLink to="/admin" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                Admin
              </NavLink>
            )}
          </div>

          <div className="nav-user">
            <span className="nav-user-name">{user?.name}</span>
            <span className={`role-badge ${user?.role === 'admin' ? 'role-admin' : 'role-user'}`}>
              {user?.role}
            </span>
            <button onClick={handleLogout} className="btn btn-ghost" type="button">
              Logout
            </button>
          </div>
        </nav>
      )}

      <main className={isLoggedIn ? 'main-content' : 'main-content-full'}>
        <Outlet />
      </main>
    </div>
  );
}
