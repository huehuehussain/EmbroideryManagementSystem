import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../styles/Navigation.css';

function Navigation({ user, onLogout }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          🧵 EMS
        </Link>

        <div className="navbar-menu">
          <Link to="/" className="nav-link">Dashboard</Link>
          <Link to="/work-orders" className="nav-link">Work Orders</Link>
          <Link to="/inventory" className="nav-link">Inventory</Link>
          <Link to="/machines" className="nav-link">Machines</Link>
          <Link to="/designs" className="nav-link">Designs</Link>
          <Link to="/customer-orders" className="nav-link">Orders</Link>
          <Link to="/operator-logs" className="nav-link">Logs</Link>
          {user?.role === 'admin' && (
            <Link to="/audit-logs" className="nav-link">Audit</Link>
          )}
        </div>

        <div className="navbar-user">
          <span className="user-name">{user?.name}</span>
          <span className="user-role">({user?.role})</span>
          <button onClick={handleLogout} className="logout-btn">Logout</button>
        </div>
      </div>
    </nav>
  );
}

export default Navigation;
