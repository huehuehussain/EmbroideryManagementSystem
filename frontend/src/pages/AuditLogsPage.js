import React, { useState, useEffect } from 'react';
import Navigation from '../components/Navigation';
import dashboardAPI from '../services/dashboardAPI';
import '../styles/AuditLogsPage.css';

function AuditLogsPage({ user, onLogout }) {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [limit] = useState(50);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const logsRes = await dashboardAPI.getAuditLogs({ limit, offset });
        setLogs(logsRes.data.logs || []);
        setTotal(logsRes.data.total || 0);
      } catch (error) {
        console.error('Error fetching audit logs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [offset, limit]);

  const handleExport = async (format) => {
    try {
      const response = await dashboardAPI.exportAuditLogs(format);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `audit_logs.${format}`);
      document.body.appendChild(link);
      link.click();
    } catch (error) {
      alert('Error exporting logs: ' + error.message);
    }
  };

  if (loading) {
    return <div className="loading">Loading audit logs...</div>;
  }

  return (
    <div className="audit-logs-page">
      <Navigation user={user} onLogout={onLogout} />

      <div className="page-container">
        <h1>Audit Logs</h1>

        <div className="export-section">
          <button onClick={() => handleExport('csv')} className="btn-secondary">
            Export as CSV
          </button>
          <button onClick={() => handleExport('json')} className="btn-secondary">
            Export as JSON
          </button>
        </div>

        <div className="table-container">
          <h2>System Activity Log ({total} total)</h2>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Action</th>
                <th>Entity Type</th>
                <th>User</th>
                <th>Timestamp</th>
                <th>IP Address</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id}>
                  <td>{log.id}</td>
                  <td>{log.action}</td>
                  <td>{log.entity_type}</td>
                  <td>{log.user_name || 'System'}</td>
                  <td>{new Date(log.created_at).toLocaleString()}</td>
                  <td className="ip">{log.ip_address}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="pagination">
            <button
              onClick={() => setOffset(Math.max(0, offset - limit))}
              disabled={offset === 0}
              className="btn-small"
            >
              Previous
            </button>
            <span>Page {Math.floor(offset / limit) + 1}</span>
            <button
              onClick={() => setOffset(offset + limit)}
              disabled={offset + limit >= total}
              className="btn-small"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AuditLogsPage;
