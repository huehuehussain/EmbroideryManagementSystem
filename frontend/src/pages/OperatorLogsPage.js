import React, { useState, useEffect } from 'react';
import Navigation from '../components/Navigation';
import operatorShiftAPI from '../services/operatorShiftAPI';
import '../styles/OperatorLogsPage.css';
import { formatNumber } from '../utils/numberUtils';

function OperatorLogsPage({ user, onLogout }) {
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    operator_id: user?.id || '',
    machine_id: '',
    shift_date: '',
    shift_start_time: '',
    output_quantity: '',
    quality_score: '',
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const shiftsRes = await operatorShiftAPI.getAllShifts();
        setShifts(shiftsRes.data.shifts || []);
      } catch (error) {
        console.error('Error fetching shifts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCreateShift = async (e) => {
    e.preventDefault();

    try {
      await operatorShiftAPI.createShift(formData);
      alert('Shift logged successfully!');
      setShowForm(false);
      setFormData({
        operator_id: user?.id || '',
        machine_id: '',
        shift_date: '',
        shift_start_time: '',
        output_quantity: '',
        quality_score: '',
      });
      const shiftsRes = await operatorShiftAPI.getAllShifts();
      setShifts(shiftsRes.data.shifts || []);
    } catch (error) {
      alert('Error logging shift: ' + error.message);
    }
  };

  if (loading) {
    return <div className="loading">Loading operator logs...</div>;
  }

  return (
    <div className="operator-logs-page">
      <Navigation user={user} onLogout={onLogout} />

      <div className="page-container">
        <h1>Operator Shift Logs</h1>

        <button onClick={() => setShowForm(!showForm)} className="btn-primary">
          {showForm ? 'Cancel' : 'Log New Shift'}
        </button>

        {showForm && (
          <form onSubmit={handleCreateShift} className="form-container">
            <h2>Log Operator Shift</h2>

            <div className="form-row">
              <div className="form-group">
                <label>Shift Date</label>
                <input
                  type="date"
                  name="shift_date"
                  value={formData.shift_date}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Shift Start Time</label>
                <input
                  type="datetime-local"
                  name="shift_start_time"
                  value={formData.shift_start_time}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Output Quantity</label>
                <input
                  type="number"
                  name="output_quantity"
                  value={formData.output_quantity}
                  onChange={handleInputChange}
                  placeholder="Items produced"
                  required
                />
              </div>

              <div className="form-group">
                <label>Quality Score (0-5)</label>
                <input
                  type="number"
                  name="quality_score"
                  value={formData.quality_score}
                  onChange={handleInputChange}
                  min="0"
                  max="5"
                  step="0.1"
                  required
                />
              </div>
            </div>

            <button type="submit" className="btn-success">
              Log Shift
            </button>
          </form>
        )}

        <div className="table-container">
          <h2>Shift Logs ({shifts.length})</h2>
          <table>
            <thead>
              <tr>
                <th>Operator</th>
                <th>Machine</th>
                <th>Shift Date</th>
                <th>Start Time</th>
                <th>Output</th>
                <th>Quality Score</th>
              </tr>
            </thead>
            <tbody>
              {shifts.map((shift) => (
                <tr key={shift.id}>
                  <td>{shift.operator_name}</td>
                  <td>{shift.machine_name}</td>
                  <td>{new Date(shift.shift_date).toLocaleDateString()}</td>
                  <td>{new Date(shift.shift_start_time).toLocaleTimeString()}</td>
                  <td>{shift.output_quantity}</td>
                  <td className="quality">{formatNumber(shift.quality_score)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default OperatorLogsPage;
