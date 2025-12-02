import React, { useState, useEffect } from 'react';
import Navigation from '../components/Navigation';
import inventoryAPI from '../services/inventoryAPI';
import '../styles/InventoryPage.css';
import { formatNumber } from '../utils/numberUtils';

function InventoryPage({ user, onLogout }) {
  const [items, setItems] = useState([]);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    item_name: '',
    item_type: 'thread',
    quantity_available: '',
    minimum_stock_level: '',
    unit_cost: '',
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const itemsRes = await inventoryAPI.getAllItems();
        const lowStockRes = await inventoryAPI.getLowStockItems();

        setItems(itemsRes.data.items || []);
        setLowStockItems(lowStockRes.data.items || []);
      } catch (error) {
        console.error('Error fetching inventory:', error);
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

  const handleCreateItem = async (e) => {
    e.preventDefault();

    try {
      await inventoryAPI.createItem(formData);
      alert('Inventory item created successfully!');
      setShowForm(false);
      setFormData({
        item_name: '',
        item_type: 'thread',
        quantity_available: '',
        minimum_stock_level: '',
        unit_cost: '',
      });
      const itemsRes = await inventoryAPI.getAllItems();
      setItems(itemsRes.data.items || []);
    } catch (error) {
      alert('Error creating item: ' + error.message);
    }
  };

  if (loading) {
    return <div className="loading">Loading inventory...</div>;
  }

  return (
    <div className="inventory-page">
      <Navigation user={user} onLogout={onLogout} />

      <div className="page-container">
        <h1>Inventory Management</h1>

        <button onClick={() => setShowForm(!showForm)} className="btn-primary">
          {showForm ? 'Cancel' : 'Add Inventory Item'}
        </button>

        {showForm && (
          <form onSubmit={handleCreateItem} className="form-container">
            <h2>Add New Inventory Item</h2>

            <div className="form-group">
              <label>Item Name</label>
              <input
                type="text"
                name="item_name"
                value={formData.item_name}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Item Type</label>
                <select name="item_type" value={formData.item_type} onChange={handleInputChange}>
                  <option value="thread">Thread</option>
                  <option value="needle">Needle</option>
                  <option value="backing_cloth">Backing Cloth</option>
                  <option value="stabilizer">Stabilizer</option>
                </select>
              </div>

              <div className="form-group">
                <label>Quantity Available</label>
                <input
                  type="number"
                  name="quantity_available"
                  value={formData.quantity_available}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Minimum Stock Level</label>
                <input
                  type="number"
                  name="minimum_stock_level"
                  value={formData.minimum_stock_level}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Unit Cost</label>
                <input
                  type="number"
                  name="unit_cost"
                  value={formData.unit_cost}
                  onChange={handleInputChange}
                  step="0.01"
                  required
                />
              </div>
            </div>

            <button type="submit" className="btn-success">
              Add Item
            </button>
          </form>
        )}

        {lowStockItems.length > 0 && (
          <div className="alert-section">
            <h2>Low Stock Alerts ({lowStockItems.length})</h2>
            <div className="alert-container">
              {lowStockItems.map((item) => (
                <div key={item.id} className="alert-item alert-warning">
                  <strong>{item.item_name}</strong>
                  <p>Current: {item.quantity_available} | Minimum: {item.minimum_stock_level}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="table-container">
          <h2>Inventory Items ({items.length})</h2>
          <table>
            <thead>
              <tr>
                <th>Item Name</th>
                <th>Type</th>
                <th>Available</th>
                <th>Min Level</th>
                <th>Unit Cost</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const isLowStock = item.quantity_available <= item.minimum_stock_level;
                return (
                  <tr key={item.id} className={isLowStock ? 'low-stock' : ''}>
                    <td>{item.item_name}</td>
                    <td>{item.item_type}</td>
                    <td>{item.quantity_available}</td>
                    <td>{item.minimum_stock_level}</td>
                    <td>${formatNumber(item.unit_cost)}</td>
                    <td className={`status ${isLowStock ? 'low' : 'ok'}`}>
                      {isLowStock ? 'Low Stock' : 'OK'}
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

export default InventoryPage;
