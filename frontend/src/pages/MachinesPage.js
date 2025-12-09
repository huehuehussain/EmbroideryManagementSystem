import React, { useState, useEffect } from 'react';
import Navigation from '../components/Navigation';
import machineAPI from '../services/machineAPI';
import '../styles/MachinesPage.css';

function MachinesPage({ user, onLogout }) {
  const [machines, setMachines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    model: '',
    capacity_stitches_per_hour: '',
    supported_thread_colors: [],
    location: '',
  });

  const availableColors = [
    'all', 'red', 'blue', 'black', 'white', 'green', 'yellow', 'orange', 'purple',
    'pink', 'brown', 'gray', 'navy', 'gold', 'silver', 'cyan'
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const machinesRes = await machineAPI.getAllMachines();
        setMachines(machinesRes.data.machines || []);
      } catch (error) {
        console.error('Error fetching machines:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleColorToggle = (color) => {
    setFormData(prev => {
      const colors = prev.supported_thread_colors;
      if (colors.includes(color)) {
        return {
          ...prev,
          supported_thread_colors: colors.filter(c => c !== color)
        };
      } else {
        return {
          ...prev,
          supported_thread_colors: [...colors, color]
        };
      }
    });
  };

  const handleCreateMachine = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.model || !formData.capacity_stitches_per_hour) {
      alert('Name, model, and capacity are required');
      return;
    }

    try {
      setCreateLoading(true);
      
      if (editingId) {
        await machineAPI.updateMachine(editingId, {
          name: formData.name,
          model: formData.model,
          capacity_stitches_per_hour: parseInt(formData.capacity_stitches_per_hour),
          supported_thread_colors: formData.supported_thread_colors,
          location: formData.location,
        });
        alert('Machine updated successfully!');
      } else {
        await machineAPI.createMachine({
          name: formData.name,
          model: formData.model,
          capacity_stitches_per_hour: parseInt(formData.capacity_stitches_per_hour),
          supported_thread_colors: formData.supported_thread_colors,
          location: formData.location,
        });
        alert('Machine created successfully!');
      }

      setShowCreateModal(false);
      setEditingId(null);
      setFormData({
        name: '',
        model: '',
        capacity_stitches_per_hour: '',
        supported_thread_colors: [],
        location: '',
      });

      const machinesRes = await machineAPI.getAllMachines();
      setMachines(machinesRes.data.machines || []);
    } catch (error) {
      alert('Error saving machine: ' + error.message);
    } finally {
      setCreateLoading(false);
    }
  };

  const handleEditMachine = (machine) => {
    setEditingId(machine.id);
    setFormData({
      name: machine.name,
      model: machine.model,
      capacity_stitches_per_hour: machine.capacity_stitches_per_hour,
      supported_thread_colors: machine.supported_thread_colors || [],
      location: machine.location,
    });
    setShowCreateModal(true);
  };

  const handleDeleteMachine = async (id) => {
    if (window.confirm('Are you sure you want to delete this machine?')) {
      try {
        await machineAPI.deleteMachine(id);
        alert('Machine deleted successfully!');
        const machinesRes = await machineAPI.getAllMachines();
        setMachines(machinesRes.data.machines || []);
      } catch (error) {
        alert('Error deleting machine: ' + error.message);
      }
    }
  };

  if (loading) {
    return <div className="loading">Loading machines...</div>;
  }

  return (
    <div className="machines-page">
      <Navigation user={user} onLogout={onLogout} />

      <div className="page-container">
        <h1>Machines Management</h1>

        <div className="header-controls">
          <button 
            onClick={() => {
              setEditingId(null);
              setFormData({
                name: '',
                model: '',
                capacity_stitches_per_hour: '',
                supported_thread_colors: [],
                location: '',
              });
              setShowCreateModal(true);
            }} 
            className="btn-primary btn-create"
          >
            + Add Machine
          </button>
        </div>

        {showCreateModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h2>{editingId ? 'Edit Machine' : 'Add New Machine'}</h2>
                <button 
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingId(null);
                    setFormData({
                      name: '',
                      model: '',
                      capacity_stitches_per_hour: '',
                      supported_thread_colors: [],
                      location: '',
                    });
                  }} 
                  className="btn-close"
                >
                  ✕
                </button>
              </div>
              <form onSubmit={handleCreateMachine}>
                <div className="form-group">
                  <label>Machine Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="e.g., Brother PR1050X"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Model *</label>
                  <input
                    type="text"
                    name="model"
                    value={formData.model}
                    onChange={handleInputChange}
                    placeholder="e.g., PR1050X"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Capacity (stitches/hour) *</label>
                  <input
                    type="number"
                    name="capacity_stitches_per_hour"
                    value={formData.capacity_stitches_per_hour}
                    onChange={handleInputChange}
                    placeholder="e.g., 5000"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Supported Thread Colors</label>
                  <div className="color-selector">
                    {availableColors.map((color) => (
                      <label key={color} className="color-checkbox">
                        <input
                          type="checkbox"
                          checked={formData.supported_thread_colors.includes(color)}
                          onChange={() => handleColorToggle(color)}
                        />
                        <span className="color-label">{color}</span>
                        <span 
                          className="color-preview" 
                          style={{ backgroundColor: color }}
                        ></span>
                      </label>
                    ))}
                  </div>
                  <small>{formData.supported_thread_colors.length} color(s) selected</small>
                </div>

                <div className="form-group">
                  <label>Location</label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    placeholder="e.g., Floor 1, Section A"
                  />
                </div>

                <div className="form-actions">
                  <button 
                    type="submit" 
                    className="btn-success"
                    disabled={createLoading}
                  >
                    {createLoading ? 'Saving...' : (editingId ? 'Update Machine' : 'Create Machine')}
                  </button>
                  <button 
                    type="button" 
                    onClick={() => {
                      setShowCreateModal(false);
                      setEditingId(null);
                      setFormData({
                        name: '',
                        model: '',
                        capacity_stitches_per_hour: '',
                        supported_thread_colors: [],
                        location: '',
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

        <div className="machines-grid">
          {machines.map((machine) => (
            <div key={machine.id} className="machine-card">
              <h3>{machine.name}</h3>
              <p><strong>Model:</strong> {machine.model}</p>
              <p><strong>Capacity:</strong> {machine.capacity_stitches_per_hour} stitches/hour</p>
              <p><strong>Status:</strong> <span className={`status ${machine.status}`}>{machine.status}</span></p>
              <div className="supported-colors">
                <strong>Supported Colors:</strong>
                <div className="colors-list">
                  {machine.supported_thread_colors?.map((color, idx) => (
                    <span key={idx} className="color-badge">{color}</span>
                  ))}
                </div>
              </div>
              <div className="actions" style={{ marginTop: '10px' }}>
                <button onClick={() => handleEditMachine(machine)} className="btn-small btn-edit">Edit</button>
                <button onClick={() => handleDeleteMachine(machine.id)} className="btn-small btn-delete">Delete</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default MachinesPage;
