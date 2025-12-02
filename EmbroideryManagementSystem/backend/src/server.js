const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

const errorHandler = require('./middleware/errorHandler');
const auditMiddleware = require('./middleware/auditMiddleware');

const authRoutes = require('./routes/authRoutes');
const workOrderRoutes = require('./routes/workOrderRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const machineRoutes = require('./routes/machineRoutes');
const designRoutes = require('./routes/designRoutes');
const customerOrderRoutes = require('./routes/customerOrderRoutes');
const operatorShiftRoutes = require('./routes/operatorShiftRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(auditMiddleware);

// Static file serving
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/work-orders', workOrderRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/machines', machineRoutes);
app.use('/api/designs', designRoutes);
app.use('/api/customer-orders', customerOrderRoutes);
app.use('/api/operator-shifts', operatorShiftRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'API is running' });
});

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;
