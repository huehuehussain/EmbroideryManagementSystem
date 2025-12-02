import React, { useState, useEffect } from 'react';
import Navigation from '../components/Navigation';
import customerOrderAPI from '../services/customerOrderAPI';
import '../styles/CustomerOrdersPage.css';
import { formatNumber } from '../utils/numberUtils';

function CustomerOrdersPage({ user, onLogout }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    order_number: '',
    customer_name: '',
    customer_email: '',
    total_quantity: '',
    total_price: '',
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const ordersRes = await customerOrderAPI.getAllOrders();
        setOrders(ordersRes.data.orders || []);
      } catch (error) {
        console.error('Error fetching orders:', error);
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

  const handleCreateOrder = async (e) => {
    e.preventDefault();

    try {
      await customerOrderAPI.createOrder(formData);
      alert('Customer order created successfully!');
      setShowForm(false);
      setFormData({
        order_number: '',
        customer_name: '',
        customer_email: '',
        total_quantity: '',
        total_price: '',
      });
      const ordersRes = await customerOrderAPI.getAllOrders();
      setOrders(ordersRes.data.orders || []);
    } catch (error) {
      alert('Error creating order: ' + error.message);
    }
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

        <button onClick={() => setShowForm(!showForm)} className="btn-primary">
          {showForm ? 'Cancel' : 'Create Order'}
        </button>

        {showForm && (
          <form onSubmit={handleCreateOrder} className="form-container">
            <h2>Create New Customer Order</h2>

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

            <div className="form-row">
              <div className="form-group">
                <label>Total Quantity</label>
                <input
                  type="number"
                  name="total_quantity"
                  value={formData.total_quantity}
                  onChange={handleInputChange}
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
                />
              </div>
            </div>

            <button type="submit" className="btn-success">
              Create Order
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
                <th>Quantity</th>
                <th>Total Price</th>
                <th>Status</th>
                <th>Delivery Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td>{order.order_number}</td>
                  <td>{order.customer_name}</td>
                  <td>{order.total_quantity}</td>
                  <td>${formatNumber(order.total_price)}</td>
                  <td className={`status status-${order.status}`}>{order.status}</td>
                  <td>{order.required_delivery_date ? new Date(order.required_delivery_date).toLocaleDateString() : 'N/A'}</td>
                  <td className="actions">
                    {order.status !== 'delivered' && (
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

export default CustomerOrdersPage;
