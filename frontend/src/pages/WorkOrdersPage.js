import React, { useState, useEffect } from 'react';
import Navigation from '../components/Navigation';
import workOrderAPI from '../services/workOrderAPI';
import machineAPI from '../services/machineAPI';
import designAPI from '../services/designAPI';
import customerOrderAPI from '../services/customerOrderAPI';
import '../styles/WorkOrdersPage.css';

function WorkOrdersPage({ user, onLogout }) {
  const [workOrders, setWorkOrders] = useState([]);
  const [machines, setMachines] = useState([]);
  const [designs, setDesigns] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    work_order_number: '',
    machine_id: '',
    design_id: '',
    customer_order_id: '',
    quantity_to_produce: '',
    thread_colors_required: [],
    thread_quantities: [],
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const woRes = await workOrderAPI.getAllWorkOrders();
        const mRes = await machineAPI.getAllMachines();
        const dRes = await designAPI.getAllDesigns({ status: 'approved' });
        const oRes = await customerOrderAPI.getAllOrders();

        setWorkOrders(woRes.data.workOrders || []);
        setMachines(mRes.data.machines || []);
        setDesigns(dRes.data.designs || []);
        setOrders(oRes.data.orders || []);
      } catch (error) {
        console.error('Error fetching data:', error);
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

  const handleCreateWorkOrder = async (e) => {
    e.preventDefault();

    try {
      await workOrderAPI.createWorkOrder(formData);
      alert('Work order created successfully!');
      setShowForm(false);
      setFormData({
        work_order_number: '',
        machine_id: '',
        design_id: '',
        customer_order_id: '',
        quantity_to_produce: '',
      });
      // Refresh work orders
      const woRes = await workOrderAPI.getAllWorkOrders();
      setWorkOrders(woRes.data.workOrders || []);
    } catch (error) {
      alert('Error creating work order: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleStartWorkOrder = async (id) => {
    try {
      await workOrderAPI.startWorkOrder(id);
      alert('Work order started successfully!');
      const woRes = await workOrderAPI.getAllWorkOrders();
      setWorkOrders(woRes.data.workOrders || []);
    } catch (error) {
      alert('Error starting work order: ' + error.message);
    }
  };

  const handleCompleteWorkOrder = async (id) => {
    const quantity = prompt('Enter quantity completed:');
    if (quantity) {
      try {
        await workOrderAPI.completeWorkOrder(id, quantity);
        alert('Work order completed!');
        const woRes = await workOrderAPI.getAllWorkOrders();
        setWorkOrders(woRes.data.workOrders || []);
      } catch (error) {
        alert('Error completing work order: ' + error.message);
      }
    }
  };

  if (loading) {
    return <div className="loading">Loading work orders...</div>;
  }

  return (
    <div className="work-orders-page">
      <Navigation user={user} onLogout={onLogout} />

      <div className="page-container">
        <h1>Work Orders Management</h1>

        <button onClick={() => setShowForm(!showForm)} className="btn-primary">
          {showForm ? 'Cancel' : 'Create Work Order'}
        </button>

        {showForm && (
          <form onSubmit={handleCreateWorkOrder} className="form-container">
            <h2>Create New Work Order</h2>

            <div className="form-group">
              <label>Work Order Number</label>
              <input
                type="text"
                name="work_order_number"
                value={formData.work_order_number}
                onChange={handleInputChange}
                placeholder="WO-2024-001"
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Machine</label>
                <select
                  name="machine_id"
                  value={formData.machine_id}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select Machine</option>
                  {machines.map((machine) => (
                    <option key={machine.id} value={machine.id}>
                      {machine.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Design (Approved Only)</label>
                <select
                  name="design_id"
                  value={formData.design_id}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select Design</option>
                  {designs.map((design) => (
                    <option key={design.id} value={design.id}>
                      {design.design_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Customer Order</label>
                <select
                  name="customer_order_id"
                  value={formData.customer_order_id}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select Customer Order</option>
                  {orders.map((order) => (
                    <option key={order.id} value={order.id}>
                      {order.order_number} - {order.customer_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Quantity to Produce</label>
                <input
                  type="number"
                  name="quantity_to_produce"
                  value={formData.quantity_to_produce}
                  onChange={handleInputChange}
                  placeholder="100"
                  required
                />
              </div>
            </div>

            <button type="submit" className="btn-success">
              Create Work Order
            </button>
          </form>
        )}

        <div className="table-container">
          <h2>Work Orders List</h2>
          <table>
            <thead>
              <tr>
                <th>WO #</th>
                <th>Customer</th>
                <th>Machine</th>
                <th>Design</th>
                <th>Status</th>
                <th>Quantity</th>
                <th>Completed</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {workOrders.map((wo) => (
                <tr key={wo.id}>
                  <td>{wo.work_order_number}</td>
                  <td>{wo.customer_name || 'N/A'}</td>
                  <td>{wo.machine_name}</td>
                  <td>{wo.design_name}</td>
                  <td className={`status status-${wo.status}`}>{wo.status}</td>
                  <td>{wo.quantity_to_produce}</td>
                  <td>{wo.quantity_completed || 0}</td>
                  <td className="actions">
                    {wo.status === 'pending' && (
                      <button
                        onClick={() => handleStartWorkOrder(wo.id)}
                        className="btn-small btn-start"
                      >
                        Start
                      </button>
                    )}
                    {wo.status === 'in_progress' && (
                      <button
                        onClick={() => handleCompleteWorkOrder(wo.id)}
                        className="btn-small btn-complete"
                      >
                        Complete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default WorkOrdersPage;
