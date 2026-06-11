import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ROLE_DASH: Record<string, string> = {
  ADMIN: '/admin',
  HQ_MANAGER: '/hq',
  BRANCH_MANAGER: '/branch-manager',
  CHEF: '/chef',
  CASHIER: '/cashier',
  CUSTOMER: '/customer',
};

export default function NavBar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/');
  }

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">STEAK<span>Z</span></Link>
      <div className="nav-links">
        <Link to="/" className="nav-link">Home</Link>
        <Link to="/menu" className="nav-link">Menu</Link>
        <Link to="/branches" className="nav-link">Branches</Link>
        <Link to="/book" className="nav-link">Reservation</Link>
        {user ? (
          <>
            <Link to={ROLE_DASH[user.role]} className="nav-link">Dashboard</Link>
            <button type="button" className="btn btn-outline btn-sm" onClick={handleLogout}>Logout</button>
          </>
        ) : (
          <>
            <Link to="/login" className="nav-link">Login</Link>
            <Link to="/register" className="btn btn-primary btn-sm">Reserve</Link>
          </>
        )}
      </div>
    </nav>
  );
}
