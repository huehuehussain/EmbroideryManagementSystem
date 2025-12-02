import React, { useState, useEffect } from 'react';
import Navigation from '../components/Navigation';
import machineAPI from '../services/machineAPI';
import '../styles/MachinesPage.css';

function MachinesPage({ user, onLogout }) {
  const [machines, setMachines] = useState([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return <div className="loading">Loading machines...</div>;
  }

  return (
    <div className="machines-page">
      <Navigation user={user} onLogout={onLogout} />

      <div className="page-container">
        <h1>Machines Management</h1>

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
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default MachinesPage;
