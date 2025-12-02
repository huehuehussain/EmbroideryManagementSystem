import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './styles/App.css';

// Pages
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import WorkOrdersPage from './pages/WorkOrdersPage';
import InventoryPage from './pages/InventoryPage';
import MachinesPage from './pages/MachinesPage';
import DesignsPage from './pages/DesignsPage';
import CustomerOrdersPage from './pages/CustomerOrdersPage';
import OperatorLogsPage from './pages/OperatorLogsPage';
import AuditLogsPage from './pages/AuditLogsPage';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (token && storedUser) {
      setIsAuthenticated(true);
      setUser(JSON.parse(storedUser));
    }

    setLoading(false);
  }, []);

  const handleLogin = (token, userData) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setIsAuthenticated(true);
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    setUser(null);
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <Router>
      <Routes>
        <Route
          path="/login"
          element={<LoginPage onLogin={handleLogin} />}
        />

        {isAuthenticated ? (
          <>
            <Route path="/" element={<DashboardPage user={user} onLogout={handleLogout} />} />
            <Route path="/work-orders" element={<WorkOrdersPage user={user} onLogout={handleLogout} />} />
            <Route path="/inventory" element={<InventoryPage user={user} onLogout={handleLogout} />} />
            <Route path="/machines" element={<MachinesPage user={user} onLogout={handleLogout} />} />
            <Route path="/designs" element={<DesignsPage user={user} onLogout={handleLogout} />} />
            <Route path="/customer-orders" element={<CustomerOrdersPage user={user} onLogout={handleLogout} />} />
            <Route path="/operator-logs" element={<OperatorLogsPage user={user} onLogout={handleLogout} />} />
            <Route path="/audit-logs" element={<AuditLogsPage user={user} onLogout={handleLogout} />} />
          </>
        ) : (
          <Route path="*" element={<Navigate to="/login" />} />
        )}
      </Routes>
    </Router>
  );
}

export default App;
