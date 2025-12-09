import React, { useState, useEffect } from 'react';
import Navigation from '../components/Navigation';
import designAPI from '../services/designAPI';
import inventoryAPI from '../services/inventoryAPI';
import '../styles/DesignsPage.css';

function DesignsPage({ user, onLogout }) {
  const [designs, setDesigns] = useState([]);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    design_name: '',
    designer_name: '',
    inventory_items: [],
  });
  const [uploadLoading, setUploadLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const designsRes = await designAPI.getAllDesigns({ status: selectedStatus });
        const itemsRes = await inventoryAPI.getAllItems();
        setDesigns(designsRes.data.designs || []);
        setInventoryItems(itemsRes.data.items || []);
      } catch (error) {
        console.error('Error fetching data:', error);
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

      if (editingId) {
        await designAPI.updateDesign(editingId, {
          design_name: formData.design_name,
          designer_name: formData.designer_name,
          inventory_items: formData.inventory_items,
        });
        alert('Design updated successfully!');
      } else {
        await designAPI.createDesign({
          design_name: formData.design_name,
          designer_name: formData.designer_name,
          inventory_items: formData.inventory_items,
        });
        alert('Design created successfully!');
      }
      
      setShowCreateModal(false);
      setEditingId(null);
      setFormData({
        design_name: '',
        designer_name: '',
        inventory_items: [],
      });

      const designsRes = await designAPI.getAllDesigns({ status: selectedStatus });
      setDesigns(designsRes.data.designs || []);
    } catch (error) {
      alert('Error saving design: ' + error.message);
    } finally {
      setUploadLoading(false);
    }
  };

  const handleEditDesign = (design) => {
    setEditingId(design.id);
    setFormData({
      design_name: design.design_name,
      designer_name: design.designer_name,
      inventory_items: design.inventory_items ? design.inventory_items.map(item => ({ 
        id: item.id, 
        quantity_required: item.quantity_required || 0 
      })) : [],
    });
    setShowCreateModal(true);
  };

  const handleDeleteDesign = async (id) => {
    if (window.confirm('Are you sure you want to delete this design?')) {
      try {
        await designAPI.deleteDesign(id);
        alert('Design deleted successfully!');
        const designsRes = await designAPI.getAllDesigns({ status: selectedStatus });
        setDesigns(designsRes.data.designs || []);
      } catch (error) {
        alert('Error deleting design: ' + error.message);
      }
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleInventoryItemToggle = (itemId) => {
    const currentItems = formData.inventory_items || [];
    const itemExists = currentItems.find(item => item.id === itemId);
    
    if (itemExists) {
      setFormData({
        ...formData,
        inventory_items: currentItems.filter(item => item.id !== itemId)
      });
    } else {
      setFormData({
        ...formData,
        inventory_items: [...currentItems, { id: itemId, quantity_required: 0 }]
      });
    }
  };

  const handleInventoryQuantityChange = (itemId, quantity) => {
    const currentItems = formData.inventory_items || [];
    const updatedItems = currentItems.map(item => 
      item.id === itemId ? { ...item, quantity_required: parseFloat(quantity) || 0 } : item
    );
    setFormData({ ...formData, inventory_items: updatedItems });
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
            onClick={() => {
              setEditingId(null);
              setFormData({
                design_name: '',
                designer_name: '',
                inventory_items: [],
              });
              setShowCreateModal(true);
            }} 
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
                <h2>{editingId ? 'Edit Design' : 'Add New Design'}</h2>
                <button 
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingId(null);
                    setFormData({
                      design_name: '',
                      designer_name: '',
                      inventory_items: [],
                    });
                  }} 
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
                  <label>Select Inventory Items</label>
                  <div className="inventory-items-selector">
                    {inventoryItems.map((item) => {
                      const selectedItem = (formData.inventory_items || []).find(i => i.id === item.id);
                      return (
                        <div key={item.id} className="inventory-item-with-quantity">
                          <label className="inventory-item-checkbox">
                            <input
                              type="checkbox"
                              checked={!!selectedItem}
                              onChange={() => handleInventoryItemToggle(item.id)}
                            />
                            <span>{item.item_name} ({item.item_type})</span>
                          </label>
                          {selectedItem && (
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={selectedItem.quantity_required || ''}
                              onChange={(e) => handleInventoryQuantityChange(item.id, e.target.value)}
                              placeholder="Quantity required per unit"
                              className="quantity-input"
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                  {inventoryItems.length === 0 && (
                    <p style={{ color: '#999', fontSize: '12px' }}>No inventory items available</p>
                  )}
                </div>

                <div className="form-actions">
                  <button 
                    type="submit" 
                    className="btn-success"
                    disabled={uploadLoading}
                  >
                    {uploadLoading ? 'Saving...' : (editingId ? 'Update Design' : 'Create Design')}
                  </button>
                  <button 
                    type="button" 
                    onClick={() => {
                      setShowCreateModal(false);
                      setEditingId(null);
                      setFormData({
                        design_name: '',
                        designer_name: '',
                        inventory_items: [],
                      });
                    }} 
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
              
              {design.inventory_items && design.inventory_items.length > 0 && (
                <div className="inventory-items-display">
                  <strong>Inventory Items:</strong>
                  <ul>
                    {design.inventory_items.map((item) => (
                      <li key={item.id}>{item.item_name} - Qty: {item.quantity_required}</li>
                    ))}
                  </ul>
                </div>
              )}
              
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

              <div className="actions" style={{ marginTop: '10px' }}>
                <button onClick={() => handleEditDesign(design)} className="btn-small btn-edit">Edit</button>
                <button onClick={() => handleDeleteDesign(design.id)} className="btn-small btn-delete">Delete</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default DesignsPage;
