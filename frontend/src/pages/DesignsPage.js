import React, { useState, useEffect } from 'react';
import Navigation from '../components/Navigation';
import designAPI from '../services/designAPI';
import '../styles/DesignsPage.css';

function DesignsPage({ user, onLogout }) {
  const [designs, setDesigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    design_name: '',
    designer_name: '',
    estimated_stitches: '',
    estimated_thread_usage: '',
  });
  const [uploadLoading, setUploadLoading] = useState(false);

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

  const handleCreateDesign = async (e) => {
    e.preventDefault();
    
    if (!formData.design_name) {
      alert('Design name is required');
      return;
    }

    try {
      setUploadLoading(true);

      await designAPI.createDesign({
        design_name: formData.design_name,
        designer_name: formData.designer_name,
        estimated_stitches: formData.estimated_stitches,
        estimated_thread_usage: formData.estimated_thread_usage,
      });
      alert('Design created successfully!');
      
      setShowCreateModal(false);
      setFormData({
        design_name: '',
        designer_name: '',
        estimated_stitches: '',
        estimated_thread_usage: '',
      });

      const designsRes = await designAPI.getAllDesigns({ status: selectedStatus });
      setDesigns(designsRes.data.designs || []);
    } catch (error) {
      alert('Error creating design: ' + error.message);
    } finally {
      setUploadLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  if (loading) {
    return <div className="loading">Loading designs...</div>;
  }

  return (
    <div className="designs-page">
      <Navigation user={user} onLogout={onLogout} />

      <div className="page-container">
        <h1>Design Management & Approval</h1>

        <div className="header-controls">
          <button 
            onClick={() => setShowCreateModal(true)} 
            className="btn-primary btn-create"
          >
            + Add Design
          </button>
        </div>

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

        {showCreateModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h2>Add New Design</h2>
                <button 
                  onClick={() => setShowCreateModal(false)} 
                  className="btn-close"
                >
                  ✕
                </button>
              </div>
              <form onSubmit={handleCreateDesign}>
                <div className="form-group">
                  <label>Design Name *</label>
                  <input
                    type="text"
                    name="design_name"
                    value={formData.design_name}
                    onChange={handleInputChange}
                    placeholder="Enter design name"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Designer Name</label>
                  <input
                    type="text"
                    name="designer_name"
                    value={formData.designer_name}
                    onChange={handleInputChange}
                    placeholder="Designer name"
                  />
                </div>

                <div className="form-group">
                  <label>Estimated Stitches</label>
                  <input
                    type="number"
                    name="estimated_stitches"
                    value={formData.estimated_stitches}
                    onChange={handleInputChange}
                    placeholder="e.g., 5000"
                  />
                </div>

                <div className="form-group">
                  <label>Thread Usage</label>
                  <input
                    type="text"
                    name="estimated_thread_usage"
                    value={formData.estimated_thread_usage}
                    onChange={handleInputChange}
                    placeholder="e.g., Red: 50m, Blue: 30m"
                  />
                </div>

                <div className="form-actions">
                  <button 
                    type="submit" 
                    className="btn-success"
                    disabled={uploadLoading}
                  >
                    {uploadLoading ? 'Creating...' : 'Create Design'}
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setShowCreateModal(false)} 
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

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
