-- PL/pgSQL Functions and Triggers for Business Logic
-- This file contains all database-driven business rules

-- ============================================================================
-- 1. DESIGN APPROVAL VALIDATION
-- ============================================================================

-- Trigger to prevent unapproved designs from entering work orders
CREATE OR REPLACE FUNCTION fn_validate_design_approval()
RETURNS TRIGGER AS $$
BEGIN
  DECLARE
    design_status_val design_status;
  BEGIN
    SELECT status INTO design_status_val FROM designs WHERE id = NEW.design_id;
    
    IF design_status_val != 'approved' THEN
      RAISE EXCEPTION 'Cannot create work order: Design must be approved (current status: %)', design_status_val;
    END IF;
    
    RETURN NEW;
  END;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_validate_design_approval ON work_orders;
CREATE TRIGGER trg_validate_design_approval
BEFORE INSERT OR UPDATE ON work_orders
FOR EACH ROW
EXECUTE FUNCTION fn_validate_design_approval();

-- ============================================================================
-- 2. MACHINE VALIDATION (Capacity & Thread Colors)
-- ============================================================================

CREATE OR REPLACE FUNCTION fn_validate_machine_capacity_and_colors()
RETURNS TRIGGER AS $$
BEGIN
  DECLARE
    machine_capacity INT;
    supported_colors TEXT[];
    required_colors TEXT[];
    i INT;
  BEGIN
    -- Get machine details
    SELECT capacity_stitches_per_hour, supported_thread_colors 
    INTO machine_capacity, supported_colors
    FROM machines WHERE id = NEW.machine_id;
    
    -- Validate capacity exists
    IF machine_capacity IS NULL THEN
      RAISE EXCEPTION 'Machine not found or has invalid capacity';
    END IF;
    
    -- Get required thread colors from the work order
    required_colors := NEW.thread_colors_required;
    
    -- Validate each required color is supported by the machine
    IF required_colors IS NOT NULL AND array_length(required_colors, 1) > 0 THEN
      FOR i IN 1..array_length(required_colors, 1) LOOP
        IF NOT (required_colors[i] = ANY(supported_colors)) THEN
          RAISE EXCEPTION 'Machine % does not support thread color: %', 
            NEW.machine_id, required_colors[i];
        END IF;
      END LOOP;
    END IF;
    
    RETURN NEW;
  END;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_validate_machine ON work_orders;
CREATE TRIGGER trg_validate_machine
BEFORE INSERT OR UPDATE ON work_orders
FOR EACH ROW
EXECUTE FUNCTION fn_validate_machine_capacity_and_colors();

-- ============================================================================
-- 3. AUTO-DEDUCT INVENTORY WHEN WORK ORDER STARTS
-- ============================================================================

CREATE OR REPLACE FUNCTION fn_auto_deduct_inventory()
RETURNS TRIGGER AS $$
BEGIN
  DECLARE
    thread_color TEXT;
    thread_qty DECIMAL(10, 2);
    current_stock DECIMAL(10, 2);
    min_level DECIMAL(10, 2);
    thread_id INT;
    i INT;
  BEGIN
    -- Only process when work order moves to 'in_progress'
    IF NEW.status = 'in_progress' AND (OLD.status IS NULL OR OLD.status != 'in_progress') THEN
      
      -- Iterate through thread colors and quantities
      IF NEW.thread_colors_required IS NOT NULL AND array_length(NEW.thread_colors_required, 1) > 0 THEN
        FOR i IN 1..array_length(NEW.thread_colors_required, 1) LOOP
          thread_color := NEW.thread_colors_required[i];
          thread_qty := NEW.thread_quantities[i];
          
          -- Get thread ID and current stock
          SELECT id, quantity_in_stock, minimum_stock_level 
          INTO thread_id, current_stock, min_level
          FROM threads WHERE color = thread_color;
          
          IF thread_id IS NULL THEN
            RAISE EXCEPTION 'Thread color % not found in inventory', thread_color;
          END IF;
          
          IF current_stock < thread_qty THEN
            RAISE EXCEPTION 'Insufficient stock for thread color %: available %, required %', 
              thread_color, current_stock, thread_qty;
          END IF;
          
          -- Deduct inventory
          UPDATE threads 
          SET quantity_in_stock = quantity_in_stock - thread_qty
          WHERE id = thread_id;
          
          -- Create reorder alert if stock falls below minimum
          IF (current_stock - thread_qty) < min_level THEN
            INSERT INTO alerts (alert_type, entity_type, entity_id, title, message)
            VALUES (
              'reorder',
              'thread',
              thread_id,
              'Thread stock below minimum: ' || thread_color,
              'Thread color ' || thread_color || ' has fallen below minimum stock level. Current: ' || 
              (current_stock - thread_qty) || ', Minimum: ' || min_level || '. Consider reordering.'
            );
          END IF;
        END LOOP;
      END IF;
      
    END IF;
    
    RETURN NEW;
  END;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_auto_deduct_inventory ON work_orders;
CREATE TRIGGER trg_auto_deduct_inventory
BEFORE UPDATE ON work_orders
FOR EACH ROW
EXECUTE FUNCTION fn_auto_deduct_inventory();

-- ============================================================================
-- 4. AUTO-DEDUCT GENERAL INVENTORY ITEMS
-- ============================================================================

CREATE OR REPLACE FUNCTION fn_deduct_inventory_item(
  p_item_id INT,
  p_quantity DECIMAL(10, 2)
)
RETURNS TABLE(success BOOLEAN, message TEXT) AS $$
BEGIN
  DECLARE
    current_qty DECIMAL(10, 2);
    min_level DECIMAL(10, 2);
    item_name VARCHAR(255);
  BEGIN
    -- Get item details
    SELECT quantity_available, minimum_stock_level, item_name
    INTO current_qty, min_level, item_name
    FROM inventory_items WHERE id = p_item_id;
    
    IF current_qty IS NULL THEN
      RETURN QUERY SELECT false::BOOLEAN, 'Item not found'::TEXT;
      RETURN;
    END IF;
    
    IF current_qty < p_quantity THEN
      RETURN QUERY SELECT false::BOOLEAN, 'Insufficient stock. Available: ' || current_qty || ', Required: ' || p_quantity;
      RETURN;
    END IF;
    
    -- Deduct inventory
    UPDATE inventory_items
    SET quantity_available = quantity_available - p_quantity
    WHERE id = p_item_id;
    
    -- Create alert if below minimum
    IF (current_qty - p_quantity) < min_level THEN
      INSERT INTO alerts (alert_type, entity_type, entity_id, title, message)
      VALUES (
        'low_inventory',
        'inventory_item',
        p_item_id,
        'Low stock alert: ' || item_name,
        'Inventory item ' || item_name || ' has fallen below minimum level. Current: ' || 
        (current_qty - p_quantity) || ', Minimum: ' || min_level
      );
    END IF;
    
    RETURN QUERY SELECT true::BOOLEAN, 'Inventory deducted successfully'::TEXT;
  END;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 5. COST CALCULATION FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION fn_calculate_work_order_cost(
  p_work_order_id INT,
  p_estimated_production_time_minutes INT
)
RETURNS TABLE(
  thread_cost_out DECIMAL(15, 2),
  machine_cost_out DECIMAL(15, 2),
  labor_cost_out DECIMAL(15, 2),
  overhead_cost_out DECIMAL(15, 2),
  total_cost_out DECIMAL(15, 2)
) AS $$
BEGIN
  DECLARE
    v_thread_cost DECIMAL(15, 2) := 0;
    v_machine_cost DECIMAL(15, 2) := 0;
    v_labor_cost DECIMAL(15, 2) := 0;
    v_overhead_subtotal DECIMAL(15, 2);
    v_overhead_cost DECIMAL(15, 2);
    v_total_cost DECIMAL(15, 2);
    v_hours DECIMAL(10, 2);
    v_colors TEXT[];
    v_quantities DECIMAL(10, 2)[];
    i INT;
    v_color_cost DECIMAL(10, 2);
  BEGIN
    -- Get work order details
    SELECT thread_colors_required, thread_quantities
    INTO v_colors, v_quantities
    FROM work_orders WHERE id = p_work_order_id;
    
    -- Calculate thread cost: sum(unit_cost × quantity for each color)
    IF v_colors IS NOT NULL AND array_length(v_colors, 1) > 0 THEN
      FOR i IN 1..array_length(v_colors, 1) LOOP
        SELECT unit_cost INTO v_color_cost FROM threads 
        WHERE color = v_colors[i];
        
        IF v_color_cost IS NOT NULL THEN
          v_thread_cost := v_thread_cost + (v_color_cost * v_quantities[i]);
        END IF;
      END LOOP;
    END IF;
    
    -- Calculate production hours from minutes
    v_hours := p_estimated_production_time_minutes::DECIMAL / 60.0;
    
    -- Machine cost: $50/hour
    v_machine_cost := v_hours * 50.00;
    
    -- Labor cost: $15/hour
    v_labor_cost := v_hours * 15.00;
    
    -- Overhead: 15% of (thread + machine + labor)
    v_overhead_subtotal := v_thread_cost + v_machine_cost + v_labor_cost;
    v_overhead_cost := v_overhead_subtotal * 0.15;
    
    -- Total cost
    v_total_cost := v_thread_cost + v_machine_cost + v_labor_cost + v_overhead_cost;
    
    -- Update work order with costs
    UPDATE work_orders
    SET 
      thread_cost = v_thread_cost,
      machine_cost = v_machine_cost,
      labor_cost = v_labor_cost,
      overhead_cost = v_overhead_cost,
      total_cost = v_total_cost,
      estimated_production_time = p_estimated_production_time_minutes
    WHERE id = p_work_order_id;
    
    -- Create costing record
    INSERT INTO costing_records (work_order_id, thread_cost, machine_cost, labor_cost, overhead_cost, total_cost)
    VALUES (p_work_order_id, v_thread_cost, v_machine_cost, v_labor_cost, v_overhead_cost, v_total_cost);
    
    -- Return values
    RETURN QUERY SELECT v_thread_cost, v_machine_cost, v_labor_cost, v_overhead_cost, v_total_cost;
  END;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 6. WORK ORDER STATUS TRANSITIONS (Pending → In Progress → Completed → Delivered)
-- ============================================================================

CREATE OR REPLACE FUNCTION fn_validate_work_order_status()
RETURNS TRIGGER AS $$
BEGIN
  DECLARE
    valid_transition BOOLEAN := false;
  BEGIN
    -- If status is not changing, allow it
    IF OLD.status IS NULL OR NEW.status = OLD.status THEN
      RETURN NEW;
    END IF;
    
    -- Define valid transitions
    CASE OLD.status
      WHEN 'pending' THEN
        valid_transition := NEW.status IN ('in_progress', 'pending');
      WHEN 'in_progress' THEN
        valid_transition := NEW.status IN ('completed', 'in_progress');
      WHEN 'completed' THEN
        valid_transition := NEW.status IN ('delivered', 'completed');
      WHEN 'delivered' THEN
        valid_transition := NEW.status = 'delivered'; -- Cannot transition from delivered
    END CASE;
    
    IF NOT valid_transition THEN
      RAISE EXCEPTION 'Invalid work order status transition: % -> %', OLD.status, NEW.status;
    END IF;
    
    -- Set timestamps for state transitions
    IF NEW.status = 'in_progress' AND OLD.status = 'pending' THEN
      NEW.actual_start_time := CURRENT_TIMESTAMP;
    END IF;
    
    IF NEW.status = 'completed' AND OLD.status = 'in_progress' THEN
      NEW.actual_end_time := CURRENT_TIMESTAMP;
    END IF;
    
    RETURN NEW;
  END;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_validate_work_order_status ON work_orders;
CREATE TRIGGER trg_validate_work_order_status
BEFORE UPDATE ON work_orders
FOR EACH ROW
EXECUTE FUNCTION fn_validate_work_order_status();

-- ============================================================================
-- 7. OPERATOR SHIFT LOGGING WITH AUTO AUDIT
-- ============================================================================

CREATE OR REPLACE FUNCTION fn_log_operator_shift()
RETURNS TRIGGER AS $$
BEGIN
  DECLARE
    shift_duration INTERVAL;
    duration_hours DECIMAL(5, 2);
  BEGIN
    -- Calculate shift duration if end time is provided
    IF NEW.shift_end_time IS NOT NULL THEN
      shift_duration := NEW.shift_end_time - NEW.shift_start_time;
      duration_hours := EXTRACT(EPOCH FROM shift_duration) / 3600.0;
      
      -- Validate quality score is between 0 and 5
      IF NEW.quality_score IS NOT NULL AND (NEW.quality_score < 0 OR NEW.quality_score > 5) THEN
        RAISE EXCEPTION 'Quality score must be between 0 and 5, got %', NEW.quality_score;
      END IF;
    END IF;
    
    RETURN NEW;
  END;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_log_operator_shift ON operators_shifts;
CREATE TRIGGER trg_log_operator_shift
BEFORE INSERT OR UPDATE ON operators_shifts
FOR EACH ROW
EXECUTE FUNCTION fn_log_operator_shift();

-- ============================================================================
-- 8. AUDIT LOG TRIGGER (Auto-log all changes)
-- ============================================================================

CREATE OR REPLACE FUNCTION fn_audit_log()
RETURNS TRIGGER AS $$
BEGIN
  DECLARE
    action_type VARCHAR(50);
    old_vals JSONB;
    new_vals JSONB;
  BEGIN
    -- Determine action type
    IF TG_OP = 'INSERT' THEN
      action_type := 'INSERT';
      new_vals := row_to_json(NEW);
      old_vals := NULL;
    ELSIF TG_OP = 'UPDATE' THEN
      action_type := 'UPDATE';
      old_vals := row_to_json(OLD);
      new_vals := row_to_json(NEW);
    ELSIF TG_OP = 'DELETE' THEN
      action_type := 'DELETE';
      old_vals := row_to_json(OLD);
      new_vals := NULL;
    END IF;
    
    -- Insert audit log record
    INSERT INTO audit_logs (action, entity_type, entity_id, old_values, new_values)
    VALUES (action_type, TG_TABLE_NAME, COALESCE(NEW.id, OLD.id), old_vals, new_vals);
    
    IF TG_OP = 'DELETE' THEN
      RETURN OLD;
    END IF;
    RETURN NEW;
  END;
END;
$$ LANGUAGE plpgsql;

-- Apply audit logging to key tables
DROP TRIGGER IF EXISTS trg_audit_work_orders ON work_orders;
CREATE TRIGGER trg_audit_work_orders
AFTER INSERT OR UPDATE OR DELETE ON work_orders
FOR EACH ROW
EXECUTE FUNCTION fn_audit_log();

DROP TRIGGER IF EXISTS trg_audit_designs ON designs;
CREATE TRIGGER trg_audit_designs
AFTER INSERT OR UPDATE OR DELETE ON designs
FOR EACH ROW
EXECUTE FUNCTION fn_audit_log();

DROP TRIGGER IF EXISTS trg_audit_inventory_items ON inventory_items;
CREATE TRIGGER trg_audit_inventory_items
AFTER INSERT OR UPDATE OR DELETE ON inventory_items
FOR EACH ROW
EXECUTE FUNCTION fn_audit_log();

DROP TRIGGER IF EXISTS trg_audit_threads ON threads;
CREATE TRIGGER trg_audit_threads
AFTER INSERT OR UPDATE OR DELETE ON threads
FOR EACH ROW
EXECUTE FUNCTION fn_audit_log();

-- ============================================================================
-- 9. HELPER PROCEDURES
-- ============================================================================

-- Procedure to start a work order (with validation and inventory deduction)
CREATE OR REPLACE FUNCTION sp_start_work_order(
  p_work_order_id INT
)
RETURNS TABLE(success BOOLEAN, message TEXT, actual_start_time TIMESTAMP) AS $$
BEGIN
  DECLARE
    v_current_status work_order_status;
    v_start_time TIMESTAMP;
  BEGIN
    -- Get current status
    SELECT status INTO v_current_status FROM work_orders WHERE id = p_work_order_id;
    
    IF v_current_status IS NULL THEN
      RETURN QUERY SELECT false, 'Work order not found'::TEXT, NULL::TIMESTAMP;
      RETURN;
    END IF;
    
    IF v_current_status != 'pending' THEN
      RETURN QUERY SELECT false, 'Work order must be pending to start'::TEXT, NULL::TIMESTAMP;
      RETURN;
    END IF;
    
    -- Set actual_start_time and update status to in_progress
    v_start_time := CURRENT_TIMESTAMP;
    UPDATE work_orders 
    SET status = 'in_progress', actual_start_time = v_start_time 
    WHERE id = p_work_order_id;
    
    RETURN QUERY SELECT true, 'Work order started successfully'::TEXT, v_start_time;
  END;
END;
$$ LANGUAGE plpgsql;

-- Procedure to complete a work order
CREATE OR REPLACE FUNCTION sp_complete_work_order(
  p_work_order_id INT,
  p_quantity_completed INT
)
RETURNS TABLE(success BOOLEAN, message TEXT) AS $$
BEGIN
  DECLARE
    v_current_status work_order_status;
  BEGIN
    -- Get current status
    SELECT status INTO v_current_status FROM work_orders WHERE id = p_work_order_id;
    
    IF v_current_status IS NULL THEN
      RETURN QUERY SELECT false, 'Work order not found'::TEXT;
      RETURN;
    END IF;
    
    IF v_current_status != 'in_progress' THEN
      RETURN QUERY SELECT false, 'Work order must be in progress to complete'::TEXT;
      RETURN;
    END IF;
    
    -- Update status, quantity, and actual_end_time
    UPDATE work_orders 
    SET 
      status = 'completed',
      quantity_completed = p_quantity_completed,
      actual_end_time = CURRENT_TIMESTAMP
    WHERE id = p_work_order_id;
    
    RETURN QUERY SELECT true, 'Work order completed successfully'::TEXT;
  END;
END;
$$ LANGUAGE plpgsql;

-- Procedure to mark work order as delivered
CREATE OR REPLACE FUNCTION sp_deliver_work_order(
  p_work_order_id INT
)
RETURNS TABLE(success BOOLEAN, message TEXT) AS $$
BEGIN
  DECLARE
    v_current_status work_order_status;
  BEGIN
    -- Get current status
    SELECT status INTO v_current_status FROM work_orders WHERE id = p_work_order_id;
    
    IF v_current_status IS NULL THEN
      RETURN QUERY SELECT false, 'Work order not found'::TEXT;
      RETURN;
    END IF;
    
    IF v_current_status != 'completed' THEN
      RETURN QUERY SELECT false, 'Work order must be completed before delivery'::TEXT;
      RETURN;
    END IF;
    
    UPDATE work_orders SET status = 'delivered' WHERE id = p_work_order_id;
    
    RETURN QUERY SELECT true, 'Work order delivered successfully'::TEXT;
  END;
END;
$$ LANGUAGE plpgsql;

-- Procedure to resolve alerts
CREATE OR REPLACE FUNCTION sp_resolve_alert(
  p_alert_id INT,
  p_resolved_by INT
)
RETURNS TABLE(success BOOLEAN, message TEXT) AS $$
BEGIN
  UPDATE alerts 
  SET 
    is_resolved = true,
    resolved_at = CURRENT_TIMESTAMP,
    resolved_by = p_resolved_by
  WHERE id = p_alert_id AND is_resolved = false;
  
  IF FOUND THEN
    RETURN QUERY SELECT true, 'Alert resolved successfully'::TEXT;
  ELSE
    RETURN QUERY SELECT false, 'Alert not found or already resolved'::TEXT;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Clean up old audit logs (older than 90 days)
CREATE OR REPLACE FUNCTION sp_cleanup_old_audit_logs()
RETURNS TABLE(deleted_count INT) AS $$
BEGIN
  DELETE FROM audit_logs WHERE created_at < CURRENT_TIMESTAMP - INTERVAL '90 days';
  RETURN QUERY SELECT ROW_COUNT()::INT;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 9. AUTO-UPDATE CUSTOMER ORDER STATUS BASED ON WORK ORDERS
-- ============================================================================

CREATE OR REPLACE FUNCTION fn_update_customer_order_status()
RETURNS TRIGGER AS $$
BEGIN
  DECLARE
    v_customer_order_id INT;
    v_all_completed BOOLEAN;
    v_any_in_progress BOOLEAN;
    v_new_status VARCHAR(50);
  BEGIN
    -- Get the customer order ID
    SELECT customer_order_id INTO v_customer_order_id FROM work_orders WHERE id = NEW.id;
    
    IF v_customer_order_id IS NULL THEN
      RETURN NEW;
    END IF;
    
    -- Check if all work orders for this customer order are completed
    SELECT COALESCE(BOOL_AND(status = 'completed' OR status = 'delivered'), false)
    INTO v_all_completed
    FROM work_orders 
    WHERE customer_order_id = v_customer_order_id;
    
    -- Check if any work orders are in progress
    SELECT COALESCE(BOOL_OR(status = 'in_progress'), false)
    INTO v_any_in_progress
    FROM work_orders 
    WHERE customer_order_id = v_customer_order_id;
    
    -- Determine new status for customer order
    IF v_all_completed THEN
      v_new_status := 'completed';
    ELSIF v_any_in_progress THEN
      v_new_status := 'in_progress';
    ELSE
      v_new_status := 'pending';
    END IF;
    
    -- Update customer order status
    UPDATE customer_orders 
    SET status = v_new_status, updated_at = CURRENT_TIMESTAMP
    WHERE id = v_customer_order_id;
    
    RETURN NEW;
  END;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_customer_order_status ON work_orders;
CREATE TRIGGER trg_update_customer_order_status
AFTER UPDATE ON work_orders
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION fn_update_customer_order_status();

