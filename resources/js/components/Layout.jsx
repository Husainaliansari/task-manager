import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ActivityIcon, CheckIcon, ListChecksIcon, LogOutIcon, UsersIcon } from './icons';
import { Avatar } from './ui';

export default function Layout() {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate('/login', { replace: true });
  }

  return (
    <div className="shell">
      <aside className="sidebar">
        <NavLink to="/" className="brand">
          <span className="brand__mark" aria-hidden="true">
            <CheckIcon size={16} strokeWidth={3} />
          </span>
          <span className="brand__name">Tasks</span>
        </NavLink>

        <nav className="sidebar__nav" aria-label="Main">
          <p className="sidebar__label">Workspace</p>
          <NavLink to="/" end className="nav-link">
            <ListChecksIcon />
            <span>{isAdmin ? 'All tasks' : 'My board'}</span>
          </NavLink>

          {/* Admin links are not rendered at all for regular users. */}
          {isAdmin && (
            <>
              <p className="sidebar__label">Admin</p>
              <NavLink to="/team" className="nav-link">
                <UsersIcon />
                <span>Team</span>
              </NavLink>
              <NavLink to="/activity" className="nav-link">
                <ActivityIcon />
                <span>Activity</span>
              </NavLink>
            </>
          )}
        </nav>

        <div className="sidebar__user">
          <Avatar name={user.name} />
          <div className="sidebar__who">
            <span className="sidebar__name">{user.name}</span>
            <span className="sidebar__meta">
              {isAdmin && <span className="role-pill">Admin</span>}
              <span className="sidebar__email">{user.email}</span>
            </span>
          </div>
          <button type="button" className="icon-btn" onClick={handleLogout} aria-label="Log out" title="Log out">
            <LogOutIcon />
          </button>
        </div>
      </aside>

      <main className="main">
        <div className="container">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
