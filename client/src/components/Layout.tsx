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
    <>
      {isLoggedIn && (
        <div className="d-flex flex-column flex-md-row align-items-center p-3 px-md-4 mb-3 bg-white border-bottom box-shadow">
          <h5 className="my-0 me-md-auto fw-normal text-primary">◉ StockPulse</h5>
          
          <nav className="my-2 my-md-0 me-md-3">
            <NavLink 
              to="/dashboard" 
              className={({ isActive }) => isActive ? 'p-2 text-primary fw-bold text-decoration-none' : 'p-2 text-dark text-decoration-none'}
            >
              Dashboard
            </NavLink>
            <NavLink 
              to="/feedback" 
              className={({ isActive }) => isActive ? 'p-2 text-primary fw-bold text-decoration-none' : 'p-2 text-dark text-decoration-none'}
            >
              Feedback
            </NavLink>
            {user?.role === 'admin' && (
              <NavLink 
                to="/admin" 
                className={({ isActive }) => isActive ? 'p-2 text-primary fw-bold text-decoration-none' : 'p-2 text-dark text-decoration-none'}
              >
                Admin
              </NavLink>
            )}
          </nav>
          
          <div className="d-flex align-items-center gap-3">
            <span className="text-muted small">
              {user?.name}
              <span className={`badge ms-2 ${user?.role === 'admin' ? 'bg-warning text-dark' : 'bg-secondary'}`}>
                {user?.role}
              </span>
            </span>
            <button onClick={handleLogout} className="btn btn-outline-danger btn-sm" type="button">
              Logout
            </button>
          </div>
        </div>
      )}

      <main>
        <Outlet />
      </main>
    </>
  );
}
