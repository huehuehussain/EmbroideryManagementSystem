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
  const [editingId, setEditingId] = useState(null);
  const [showRestockModal, setShowRestockModal] = useState(false);
  const [restockingId, setRestockingId] = useState(null);
  const [restockQuantity, setRestockQuantity] = useState('');
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
      const dataToSend = {
        item_name: formData.item_name,
        item_type: formData.item_type,
        quantity_available: parseFloat(formData.quantity_available),
        minimum_stock_level: parseFloat(formData.minimum_stock_level),
        unit_cost: parseFloat(formData.unit_cost),
      };

      console.log('Sending data:', dataToSend, 'Editing ID:', editingId);

      if (editingId) {
        await inventoryAPI.updateItem(editingId, dataToSend);
        alert('Inventory item updated successfully!');
      } else {
        await inventoryAPI.createItem(dataToSend);
        alert('Inventory item created successfully!');
      }
      setShowForm(false);
      setEditingId(null);
      setFormData({
        item_name: '',
        item_type: 'thread',
        quantity_available: '',
        minimum_stock_level: '',
        unit_cost: '',
      });
      const itemsRes = await inventoryAPI.getAllItems();
      const lowStockRes = await inventoryAPI.getLowStockItems();
      setItems(itemsRes.data.items || []);
      setLowStockItems(lowStockRes.data.items || []);
    } catch (error) {
      console.error('Error details:', error);
      alert('Error saving item: ' + error.message);
    }
  };

  const handleEditItem = (item) => {
    // Clear form first, then populate with new data
    setFormData({
      item_name: item.item_name || '',
      item_type: item.item_type || 'thread',
      quantity_available: item.quantity_available ? parseFloat(item.quantity_available) : '',
      minimum_stock_level: item.minimum_stock_level ? parseFloat(item.minimum_stock_level) : '',
      unit_cost: item.unit_cost ? parseFloat(item.unit_cost) : '',
    });
    setEditingId(item.id);
    setShowForm(true);
  };

  const handleDeleteItem = async (id) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        await inventoryAPI.deleteItem(id);
        alert('Inventory item deleted successfully!');
        const itemsRes = await inventoryAPI.getAllItems();
        setItems(itemsRes.data.items || []);
      } catch (error) {
        alert('Error deleting item: ' + error.message);
      }
    }
  };

  const handleRestockClick = (item) => {
    setRestockingId(item.id);
    setRestockQuantity('');
    setShowRestockModal(true);
  };

  const handleRestockSubmit = async (e) => {
    e.preventDefault();

    if (!restockQuantity || parseInt(restockQuantity) <= 0) {
      alert('Please enter a valid restock quantity');
      return;
    }

    try {
      const quantity = parseInt(restockQuantity);
      await inventoryAPI.restockItem(restockingId, quantity);
      alert('Item restocked successfully!');
      setShowRestockModal(false);
      setRestockingId(null);
      setRestockQuantity('');
      
      // Refresh the inventory list
      const itemsRes = await inventoryAPI.getAllItems();
      setItems(itemsRes.data.items || []);
      const lowStockRes = await inventoryAPI.getLowStockItems();
      setLowStockItems(lowStockRes.data.items || []);
    } catch (error) {
      alert('Error restocking item: ' + error.message);
    }
  };

  const handleRestockCancel = () => {
    setShowRestockModal(false);
    setRestockingId(null);
    setRestockQuantity('');
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({
      item_name: '',
      item_type: 'thread',
      quantity_available: '',
      minimum_stock_level: '',
      unit_cost: '',
    });
  };

  if (loading) {
    return <div className="loading">Loading inventory...</div>;
  }

  return (
    <div className="inventory-page">
      <Navigation user={user} onLogout={onLogout} />

      <div className="page-container">
        <h1>Inventory Management</h1>

        <button onClick={() => {
          if (showForm) {
            handleCancel();
          } else {
            setShowForm(true);
          }
        }} className="btn-primary">
          {showForm ? 'Cancel' : 'Add Inventory Item'}
        </button>

        {showForm && (
          <form onSubmit={handleCreateItem} className="form-container">
            <h2>{editingId ? 'Edit Inventory Item' : 'Add New Inventory Item'}</h2>

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
                  step="0.01"
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
                  step="0.01"
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
                  step="0.01"
                  name="unit_cost"
                  value={formData.unit_cost}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <button type="submit" className="btn-success">
              {editingId ? 'Update Item' : 'Add Item'}
            </button>
            <button type="button" onClick={handleCancel} className="btn-secondary">
              Cancel
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
                <th>Actions</th>
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
                    <td className="actions">
                      <button onClick={() => handleEditItem(item)} className="btn-small btn-edit">Edit</button>
                      <button onClick={() => handleDeleteItem(item.id)} className="btn-small btn-delete">Delete</button>
                      {isLowStock && (
                        <button onClick={() => handleRestockClick(item)} className="btn-small btn-restock">Restock</button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {showRestockModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h2>Restock Item</h2>
              <form onSubmit={handleRestockSubmit}>
                <div className="form-group">
                  <label>Restock Quantity</label>
                  <input
                    type="number"
                    value={restockQuantity}
                    onChange={(e) => setRestockQuantity(e.target.value)}
                    placeholder="Enter quantity to add"
                    required
                    min="1"
                  />
                </div>
                <div className="modal-actions">
                  <button type="submit" className="btn-success">Confirm Restock</button>
                  <button type="button" onClick={handleRestockCancel} className="btn-secondary">Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default InventoryPage;
