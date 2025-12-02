-- Embroidery Management System Database Schema

-- Drop existing tables if they exist (for fresh setup)
DROP TABLE IF EXISTS alerts CASCADE;
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS costing_records CASCADE;
DROP TABLE IF EXISTS operators_shifts CASCADE;
DROP TABLE IF EXISTS work_orders CASCADE;
DROP TABLE IF EXISTS customer_orders CASCADE;
DROP TABLE IF EXISTS designs CASCADE;
DROP TABLE IF EXISTS inventory_items CASCADE;
DROP TABLE IF EXISTS threads CASCADE;
DROP TABLE IF EXISTS machines CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Create enum types
CREATE TYPE user_role AS ENUM ('admin', 'manager', 'operator');
CREATE TYPE work_order_status AS ENUM ('pending', 'in_progress', 'completed', 'delivered');
CREATE TYPE design_status AS ENUM ('submitted', 'reviewed', 'approved', 'rejected');
CREATE TYPE alert_type AS ENUM ('reorder', 'machine_maintenance', 'low_inventory', 'overdue_order');

-- Users table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role user_role NOT NULL DEFAULT 'operator',
  phone VARCHAR(20),
  department VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- Machines table
CREATE TABLE machines (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  model VARCHAR(100) NOT NULL,
  capacity_stitches_per_hour INT NOT NULL,
  supported_thread_colors TEXT[] DEFAULT ARRAY[]::text[],
  status VARCHAR(50) DEFAULT 'available',
  location VARCHAR(100),
  installation_date DATE,
  last_maintenance_date DATE,
  maintenance_interval_days INT DEFAULT 90,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_machines_status ON machines(status);
CREATE INDEX idx_machines_name ON machines(name);

-- Threads table
CREATE TABLE threads (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  color VARCHAR(50) NOT NULL,
  supplier VARCHAR(100),
  unit_cost DECIMAL(10, 2) NOT NULL,
  quantity_in_stock DECIMAL(10, 2) DEFAULT 0,
  minimum_stock_level DECIMAL(10, 2) DEFAULT 0,
  unit_measurement VARCHAR(20) DEFAULT 'meter',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_threads_color ON threads(color);
CREATE INDEX idx_threads_name ON threads(name);

-- Inventory items table
CREATE TABLE inventory_items (
  id SERIAL PRIMARY KEY,
  item_name VARCHAR(255) NOT NULL,
  item_type VARCHAR(50) NOT NULL,
  description TEXT,
  quantity_available DECIMAL(10, 2) NOT NULL DEFAULT 0,
  minimum_stock_level DECIMAL(10, 2) DEFAULT 0,
  unit_cost DECIMAL(10, 2) NOT NULL,
  supplier VARCHAR(100),
  reorder_quantity DECIMAL(10, 2),
  unit_measurement VARCHAR(20),
  last_restocked_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_inventory_item_type ON inventory_items(item_type);
CREATE INDEX idx_inventory_quantity ON inventory_items(quantity_available);

-- Designs table
CREATE TABLE designs (
  id SERIAL PRIMARY KEY,
  design_name VARCHAR(255) NOT NULL,
  design_file_path VARCHAR(500),
  file_size INT,
  file_type VARCHAR(50),
  designer_name VARCHAR(100),
  status design_status DEFAULT 'submitted',
  approved_by INT REFERENCES users(id),
  approval_date TIMESTAMP,
  rejection_reason TEXT,
  estimated_stitches INT,
  estimated_thread_usage TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_designs_status ON designs(status);
CREATE INDEX idx_designs_created_at ON designs(created_at);

-- Customer orders table
CREATE TABLE customer_orders (
  id SERIAL PRIMARY KEY,
  order_number VARCHAR(50) UNIQUE NOT NULL,
  customer_name VARCHAR(255) NOT NULL,
  customer_email VARCHAR(255),
  customer_phone VARCHAR(20),
  delivery_address TEXT,
  order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  required_delivery_date DATE,
  actual_delivery_date DATE,
  total_quantity INT,
  total_price DECIMAL(15, 2),
  status VARCHAR(50) DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_customer_orders_status ON customer_orders(status);
CREATE INDEX idx_customer_orders_order_number ON customer_orders(order_number);
CREATE INDEX idx_customer_orders_customer_email ON customer_orders(customer_email);

-- Work orders table
CREATE TABLE work_orders (
  id SERIAL PRIMARY KEY,
  work_order_number VARCHAR(50) UNIQUE NOT NULL,
  machine_id INT NOT NULL REFERENCES machines(id) ON DELETE RESTRICT,
  design_id INT NOT NULL REFERENCES designs(id) ON DELETE RESTRICT,
  customer_order_id INT NOT NULL REFERENCES customer_orders(id) ON DELETE CASCADE,
  status work_order_status DEFAULT 'pending',
  quantity_to_produce INT NOT NULL,
  quantity_completed INT DEFAULT 0,
  thread_colors_required TEXT[],
  thread_quantities DECIMAL(10, 2)[],
  estimated_production_time INT,
  actual_start_time TIMESTAMP,
  actual_end_time TIMESTAMP,
  assigned_operator_id INT REFERENCES users(id),
  total_cost DECIMAL(15, 2),
  thread_cost DECIMAL(15, 2),
  machine_cost DECIMAL(15, 2),
  labor_cost DECIMAL(15, 2),
  overhead_cost DECIMAL(15, 2),
  cost_notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_work_orders_status ON work_orders(status);
CREATE INDEX idx_work_orders_machine_id ON work_orders(machine_id);
CREATE INDEX idx_work_orders_design_id ON work_orders(design_id);
CREATE INDEX idx_work_orders_customer_order_id ON work_orders(customer_order_id);
CREATE INDEX idx_work_orders_assigned_operator_id ON work_orders(assigned_operator_id);

-- Operators shifts table
CREATE TABLE operators_shifts (
  id SERIAL PRIMARY KEY,
  operator_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  work_order_id INT REFERENCES work_orders(id) ON DELETE SET NULL,
  machine_id INT REFERENCES machines(id) ON DELETE SET NULL,
  shift_date DATE NOT NULL,
  shift_start_time TIMESTAMP NOT NULL,
  shift_end_time TIMESTAMP,
  output_quantity INT DEFAULT 0,
  quality_score DECIMAL(3, 2),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_operators_shifts_operator_id ON operators_shifts(operator_id);
CREATE INDEX idx_operators_shifts_work_order_id ON operators_shifts(work_order_id);
CREATE INDEX idx_operators_shifts_shift_date ON operators_shifts(shift_date);

-- Costing records table
CREATE TABLE costing_records (
  id SERIAL PRIMARY KEY,
  work_order_id INT NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
  thread_cost DECIMAL(15, 2) NOT NULL,
  machine_cost DECIMAL(15, 2) NOT NULL,
  labor_cost DECIMAL(15, 2) NOT NULL,
  overhead_cost DECIMAL(15, 2) NOT NULL,
  total_cost DECIMAL(15, 2) NOT NULL,
  cost_breakdown TEXT,
  calculated_by INT REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_costing_records_work_order_id ON costing_records(work_order_id);

-- Audit logs table
CREATE TABLE audit_logs (
  id SERIAL PRIMARY KEY,
  action VARCHAR(255) NOT NULL,
  entity_type VARCHAR(100),
  entity_id INT,
  user_id INT REFERENCES users(id) ON DELETE SET NULL,
  old_values JSONB,
  new_values JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_logs_entity_type ON audit_logs(entity_type);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- Alerts table
CREATE TABLE alerts (
  id SERIAL PRIMARY KEY,
  alert_type alert_type NOT NULL,
  entity_type VARCHAR(100),
  entity_id INT,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  is_resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMP,
  resolved_by INT REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_alerts_alert_type ON alerts(alert_type);
CREATE INDEX idx_alerts_is_resolved ON alerts(is_resolved);
CREATE INDEX idx_alerts_created_at ON alerts(created_at);

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply timestamp triggers to all tables
CREATE TRIGGER update_users_timestamp BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER update_machines_timestamp BEFORE UPDATE ON machines FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER update_threads_timestamp BEFORE UPDATE ON threads FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER update_inventory_items_timestamp BEFORE UPDATE ON inventory_items FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER update_designs_timestamp BEFORE UPDATE ON designs FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER update_customer_orders_timestamp BEFORE UPDATE ON customer_orders FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER update_work_orders_timestamp BEFORE UPDATE ON work_orders FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER update_operators_shifts_timestamp BEFORE UPDATE ON operators_shifts FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER update_alerts_timestamp BEFORE UPDATE ON alerts FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- Add comments for documentation
COMMENT ON TABLE users IS 'Stores user profiles including admins, managers, and operators';
COMMENT ON TABLE machines IS 'Embroidery machines with capacity and color support';
COMMENT ON TABLE threads IS 'Thread inventory with colors and costs';
COMMENT ON TABLE designs IS 'Embroidery designs awaiting approval';
COMMENT ON TABLE customer_orders IS 'Customer orders containing multiple work items';
COMMENT ON TABLE work_orders IS 'Production work orders linked to machines, designs, and orders';
COMMENT ON TABLE operators_shifts IS 'Operator shift logs and production metrics';
COMMENT ON TABLE costing_records IS 'Cost breakdown for each work order';
COMMENT ON TABLE audit_logs IS 'System-wide audit trail for compliance';
COMMENT ON TABLE alerts IS 'System alerts for inventory, maintenance, and deadlines';
