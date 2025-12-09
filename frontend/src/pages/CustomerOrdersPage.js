import React, { useState, useEffect } from 'react';
import Navigation from '../components/Navigation';
import customerOrderAPI from '../services/customerOrderAPI';
import designAPI from '../services/designAPI';
import '../styles/CustomerOrdersPage.css';
import { formatNumber } from '../utils/numberUtils';

function CustomerOrdersPage({ user, onLogout }) {
  const [orders, setOrders] = useState([]);
  const [designs, setDesigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [costBreakdown, setCostBreakdown] = useState(null);
  const [formData, setFormData] = useState({
    order_number: '',
    customer_name: '',
    customer_email: '',
    design_id: '',
    total_quantity: '',
    total_price: '',
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ordersRes, designsRes] = await Promise.all([
          customerOrderAPI.getAllOrders(),
          designAPI.getAllDesigns({ status: 'approved' })
        ]);
        setOrders(ordersRes.data.orders || []);
        setDesigns(designsRes.data.designs || []);
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

  const handleDesignChange = async (e) => {
    const designId = parseInt(e.target.value);
    setFormData((prev) => ({
      ...prev,
      design_id: designId || '',
    }));
    setCostBreakdown(null);

    if (designId && formData.total_quantity) {
      try {
        const res = await customerOrderAPI.calculateCost(designId, parseInt(formData.total_quantity));
        setCostBreakdown(res.data.cost_breakdown);
        setFormData((prev) => ({
          ...prev,
          total_price: res.data.cost_breakdown.total_cost,
        }));
      } catch (error) {
        console.error('Error calculating cost:', error);
      }
    }
  };

  const handleQuantityChange = async (e) => {
    const quantity = parseInt(e.target.value);
    setFormData((prev) => ({
      ...prev,
      total_quantity: quantity || '',
    }));
    setCostBreakdown(null);

    if (formData.design_id && quantity) {
      try {
        const res = await customerOrderAPI.calculateCost(formData.design_id, quantity);
        setCostBreakdown(res.data.cost_breakdown);
        setFormData((prev) => ({
          ...prev,
          total_price: res.data.cost_breakdown.total_cost,
        }));
      } catch (error) {
        console.error('Error calculating cost:', error);
      }
    }
  };

  const handleCreateOrder = async (e) => {
    e.preventDefault();

    try {
      if (editingId) {
        await customerOrderAPI.updateOrder(editingId, formData);
        alert('Customer order updated successfully!');
      } else {
        await customerOrderAPI.createOrder(formData);
        alert('Customer order created successfully!');
      }
      setShowForm(false);
      setEditingId(null);
      setCostBreakdown(null);
      setFormData({
        order_number: '',
        customer_name: '',
        customer_email: '',
        design_id: '',
        total_quantity: '',
        total_price: '',
      });
      const ordersRes = await customerOrderAPI.getAllOrders();
      setOrders(ordersRes.data.orders || []);
    } catch (error) {
      alert('Error saving order: ' + error.message);
    }
  };

  const handleEditOrder = (order) => {
    setEditingId(order.id);
    setFormData({
      order_number: order.order_number,
      customer_name: order.customer_name,
      customer_email: order.customer_email,
      design_id: order.design_id || '',
      total_quantity: order.total_quantity,
      total_price: order.total_price,
    });
    setCostBreakdown(null);
    setShowForm(true);
  };

  const handleDeleteOrder = async (id) => {
    if (window.confirm('Are you sure you want to delete this order?')) {
      try {
        await customerOrderAPI.deleteOrder(id);
        alert('Customer order deleted successfully!');
        const ordersRes = await customerOrderAPI.getAllOrders();
        setOrders(ordersRes.data.orders || []);
      } catch (error) {
        alert('Error deleting order: ' + error.message);
      }
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setCostBreakdown(null);
    setFormData({
      order_number: '',
      customer_name: '',
      customer_email: '',
      design_id: '',
      total_quantity: '',
      total_price: '',
    });
  };

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      await customerOrderAPI.updateOrderStatus(id, newStatus);
      alert('Order status updated!');
      const ordersRes = await customerOrderAPI.getAllOrders();
      setOrders(ordersRes.data.orders || []);
    } catch (error) {
      alert('Error updating order: ' + error.message);
    }
  };

  if (loading) {
    return <div className="loading">Loading orders...</div>;
  }

  return (
    <div className="customer-orders-page">
      <Navigation user={user} onLogout={onLogout} />

      <div className="page-container">
        <h1>Customer Orders Management</h1>

        <button onClick={() => {
          if (editingId) {
            handleCancel();
          } else {
            setShowForm(!showForm);
          }
        }} className="btn-primary">
          {showForm ? 'Cancel' : 'Create Order'}
        </button>

        {showForm && (
          <form onSubmit={handleCreateOrder} className="form-container">
            <h2>{editingId ? 'Edit Customer Order' : 'Create New Customer Order'}</h2>

            <div className="form-group">
              <label>Order Number</label>
              <input
                type="text"
                name="order_number"
                value={formData.order_number}
                onChange={handleInputChange}
                placeholder="ORD-2024-001"
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Customer Name</label>
                <input
                  type="text"
                  name="customer_name"
                  value={formData.customer_name}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Customer Email</label>
                <input
                  type="email"
                  name="customer_email"
                  value={formData.customer_email}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Design</label>
              <select
                name="design_id"
                value={formData.design_id}
                onChange={handleDesignChange}
                required
              >
                <option value="">Select a design</option>
                {designs.map((design) => (
                  <option key={design.id} value={design.id}>
                    {design.design_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Total Quantity</label>
                <input
                  type="number"
                  name="total_quantity"
                  value={formData.total_quantity}
                  onChange={handleQuantityChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Total Price</label>
                <input
                  type="number"
                  name="total_price"
                  value={formData.total_price}
                  onChange={handleInputChange}
                  step="0.01"
                  required
                  readOnly
                />
              </div>
            </div>

            {costBreakdown && (
              <div className="cost-breakdown">
                <h3>Cost Breakdown</h3>
                <div className="breakdown-row">
                  <span>Material Cost:</span>
                  <span>${formatNumber(costBreakdown.material_cost)}</span>
                </div>
                <div className="breakdown-row">
                  <span>Machine Cost:</span>
                  <span>${formatNumber(costBreakdown.machine_cost)}</span>
                </div>
                <div className="breakdown-row">
                  <span>Labor Cost:</span>
                  <span>${formatNumber(costBreakdown.labor_cost)}</span>
                </div>
                <div className="breakdown-row">
                  <span>Overhead Cost:</span>
                  <span>${formatNumber(costBreakdown.overhead_cost)}</span>
                </div>
                <div className="breakdown-row total">
                  <span>Total Cost:</span>
                  <span>${formatNumber(costBreakdown.total_cost)}</span>
                </div>
              </div>
            )}

            <button type="submit" className="btn-success">
              {editingId ? 'Update Order' : 'Create Order'}
            </button>
            <button type="button" onClick={handleCancel} className="btn-secondary">
              Cancel
            </button>
          </form>
        )}

        <div className="table-container">
          <h2>Customer Orders ({orders.length})</h2>
          <table>
            <thead>
              <tr>
                <th>Order #</th>
                <th>Customer</th>
                <th>Design</th>
                <th>Quantity</th>
                <th>Total Price</th>
                <th>Status</th>
                <th>Delivery Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => {
                const design = designs.find(d => d.id === order.design_id);
                return (
                <tr key={order.id}>
                  <td>{order.order_number}</td>
                  <td>{order.customer_name}</td>
                  <td>{design ? design.design_name : 'N/A'}</td>
                  <td>{order.total_quantity}</td>
                  <td>${formatNumber(order.total_price)}</td>
                  <td className={`status status-${order.status}`}>{order.status}</td>
                  <td>{order.required_delivery_date ? new Date(order.required_delivery_date).toLocaleDateString() : 'N/A'}</td>
                  <td className="actions">
                    {order.status !== 'delivered' && (
                      <>
                        <button onClick={() => handleEditOrder(order)} className="btn-small btn-edit">Edit</button>
                        <select
                          value=""
                          onChange={(e) => handleUpdateStatus(order.id, e.target.value)}
                          defaultValue=""
                          className="status-select"
                        >
                          <option value="">Change Status</option>
                          <option value="pending">Pending</option>
                          <option value="in_progress">In Progress</option>
                          <option value="completed">Completed</option>
                          <option value="delivered">Delivered</option>
                        </select>
                      </>
                    )}
                    <button onClick={() => handleDeleteOrder(order.id)} className="btn-small btn-delete">Delete</button>
                  </td>
                </tr>
              );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default CustomerOrdersPage;
