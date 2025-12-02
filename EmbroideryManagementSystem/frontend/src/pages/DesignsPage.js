import React, { useState, useEffect } from 'react';
import Navigation from '../components/Navigation';
import designAPI from '../services/designAPI';
import '../styles/DesignsPage.css';

function DesignsPage({ user, onLogout }) {
  const [designs, setDesigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const designsRes = await designAPI.getAllDesigns({ status: selectedStatus });
        setDesigns(designsRes.data.designs || []);
      } catch (error) {
        console.error('Error fetching designs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedStatus]);

  const handleApprove = async (id) => {
    try {
      await designAPI.approveDesign(id);
      alert('Design approved!');
      const designsRes = await designAPI.getAllDesigns({ status: selectedStatus });
      setDesigns(designsRes.data.designs || []);
    } catch (error) {
      alert('Error approving design: ' + error.message);
    }
  };

  const handleReject = async (id) => {
    const reason = prompt('Enter rejection reason:');
    if (reason) {
      try {
        await designAPI.rejectDesign(id, reason);
        alert('Design rejected!');
        const designsRes = await designAPI.getAllDesigns({ status: selectedStatus });
        setDesigns(designsRes.data.designs || []);
      } catch (error) {
        alert('Error rejecting design: ' + error.message);
      }
    }
  };

  if (loading) {
    return <div className="loading">Loading designs...</div>;
  }

  return (
    <div className="designs-page">
      <Navigation user={user} onLogout={onLogout} />

      <div className="page-container">
        <h1>Design Management & Approval</h1>

        <div className="filter-section">
          <label>Filter by Status:</label>
          <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}>
            <option value="">All Designs</option>
            <option value="submitted">Submitted</option>
            <option value="reviewed">Reviewed</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        <div className="designs-grid">
          {designs.map((design) => (
            <div key={design.id} className={`design-card design-${design.status}`}>
              <h3>{design.design_name}</h3>
              <p><strong>Designer:</strong> {design.designer_name}</p>
              <p><strong>Status:</strong> <span className={`status ${design.status}`}>{design.status}</span></p>
              <p><strong>Estimated Stitches:</strong> {design.estimated_stitches}</p>
              <p><strong>Submitted:</strong> {new Date(design.created_at).toLocaleDateString()}</p>

              {design.status === 'submitted' && (
                <div className="actions">
                  <button onClick={() => handleApprove(design.id)} className="btn-success">Approve</button>
                  <button onClick={() => handleReject(design.id)} className="btn-danger">Reject</button>
                </div>
              )}

              {design.status === 'reviewed' && (
                <div className="actions">
                  <button onClick={() => handleApprove(design.id)} className="btn-success">Approve</button>
                </div>
              )}

              {design.status === 'rejected' && design.rejection_reason && (
                <p><strong>Rejection Reason:</strong> {design.rejection_reason}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default DesignsPage;
