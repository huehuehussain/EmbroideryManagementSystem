import React, { useState, useEffect } from 'react';
import Navigation from '../components/Navigation';
import dashboardAPI from '../services/dashboardAPI';
import '../styles/DashboardPage.css';
import { formatNumber } from '../utils/numberUtils';

function DashboardPage({ user, onLogout }) {
  const [overview, setOverview] = useState(null);
  const [machineUtilization, setMachineUtilization] = useState([]);
  const [operatorPerformance, setOperatorPerformance] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const overviewRes = await dashboardAPI.getOverview();
        const machinesRes = await dashboardAPI.getMachineUtilization();
        const operatorsRes = await dashboardAPI.getOperatorPerformance();
        const alertsRes = await dashboardAPI.getPendingAlerts();

        setOverview(overviewRes.data);
        setMachineUtilization(machinesRes.data.machineUtilization);
        setOperatorPerformance(operatorsRes.data.operatorPerformance);
        setAlerts(alertsRes.data.alerts);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return <div className="loading">Loading dashboard...</div>;
  }

  return (
    <div className="dashboard-page">
      <Navigation user={user} onLogout={onLogout} />

      <div className="dashboard-container">
        <h1>Production Dashboard</h1>

        {/* Overview Cards */}
        <div className="overview-cards">
          <div className="card">
            <h3>Total Work Orders</h3>
            <p className="big-number">{overview?.workOrders?.total_work_orders || 0}</p>
          </div>
          <div className="card">
            <h3>Completed</h3>
            <p className="big-number completed">{overview?.workOrders?.completed || 0}</p>
          </div>
          <div className="card">
            <h3>In Progress</h3>
            <p className="big-number in-progress">{overview?.workOrders?.in_progress || 0}</p>
          </div>
          <div className="card">
            <h3>Pending</h3>
            <p className="big-number pending">{overview?.workOrders?.pending || 0}</p>
          </div>
          <div className="card">
            <h3>Available Machines</h3>
            <p className="big-number">{overview?.machines?.available || 0}</p>
          </div>
          <div className="card">
            <h3>Active Alerts</h3>
            <p className="big-number alert">{overview?.alerts?.unresolved || 0}</p>
          </div>
        </div>

        {/* Machine Utilization */}
        <div className="section">
          <h2>Machine Utilization</h2>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Machine Name</th>
                  <th>Status</th>
                  <th>Total Orders</th>
                  <th>Active Orders</th>
                  <th>Completed</th>
                </tr>
              </thead>
              <tbody>
                {machineUtilization.map((machine) => (
                  <tr key={machine.id}>
                    <td>{machine.name}</td>
                    <td className={`status ${machine.status}`}>{machine.status}</td>
                    <td>{machine.total_orders}</td>
                    <td>{machine.active_orders}</td>
                    <td>{machine.completed_orders}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Operator Performance */}
        <div className="section">
          <h2>Operator Performance</h2>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Operator Name</th>
                  <th>Total Shifts</th>
                  <th>Total Output</th>
                  <th>Avg Quality Score</th>
                  <th>Working Days</th>
                </tr>
              </thead>
              <tbody>
                {operatorPerformance.map((op) => (
                  <tr key={op.id}>
                    <td>{op.name}</td>
                    <td>{op.total_shifts || 0}</td>
                    <td>{op.total_output || 0}</td>
                    <td>{formatNumber(op.average_quality)}</td>
                    <td>{op.working_days || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pending Alerts */}
        <div className="section">
          <h2>Pending Alerts</h2>
          <div className="alerts-container">
            {alerts.length === 0 ? (
              <p>No pending alerts</p>
            ) : (
              alerts.map((alert) => (
                <div key={alert.id} className={`alert-item alert-${alert.alert_type}`}>
                  <strong>{alert.title}</strong>
                  <p>{alert.message}</p>
                  <small>{new Date(alert.created_at).toLocaleString()}</small>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;
