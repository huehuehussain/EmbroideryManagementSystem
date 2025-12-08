# Database-Driven Business Logic Implementation

## Overview

All core business logic has been moved from the Node.js backend into PostgreSQL using PL/pgSQL triggers, functions, and stored procedures. This ensures data consistency, enforces business rules at the database layer, and enables the backend to simply call SQL procedures.

**Key Benefit**: Business rules are enforced **at the database level**, not in application code. This prevents invalid states even if someone bypasses the backend.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Node.js Backend (Thin)                   │
│  Controllers → Services → Call SQL Procedures/Functions     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Role: Receive requests, call DB, return results           │
│  NO business logic, NO validation, NO calculations         │
│                                                              │
└────────────────────┬────────────────────────────────────────┘
                     │ SQL Calls
                     ▼
┌─────────────────────────────────────────────────────────────┐
│           PostgreSQL Database (Business Logic)              │
│                                                              │
│  ✓ Triggers: Enforce rules on data changes                │
│  ✓ Functions: Calculate, validate, return results         │
│  ✓ Procedures: Multi-step operations (transactions)        │
│  ✓ Constraints: Prevent invalid data at source            │
└─────────────────────────────────────────────────────────────┘
```

---

## Implemented Functions & Triggers

### 1. **Design Approval Validation** 🛑

**File**: `backend/src/config/procedures.sql` (Lines 14-35)

**Trigger**: `trg_validate_design_approval` on `work_orders`

**Rule**: Only approved designs can enter production (create work order).

**How it works**:
```sql
BEFORE INSERT OR UPDATE ON work_orders:
  IF design.status != 'approved' THEN
    RAISE EXCEPTION 'Cannot create work order: Design must be approved'
  END IF
```

**Prevents**: Creating work orders with submitted, reviewed, or rejected designs.

---

### 2. **Machine Validation** 🧠

**File**: `backend/src/config/procedures.sql` (Lines 38-80)

**Trigger**: `trg_validate_machine ON work_orders`

**Rules**:
- Machine must exist and have valid capacity
- All required thread colors must be supported by the machine

**How it works**:
```sql
BEFORE INSERT OR UPDATE ON work_orders:
  FOR EACH required_color IN work_order.thread_colors_required:
    IF required_color NOT IN machine.supported_thread_colors THEN
      RAISE EXCEPTION 'Machine does not support thread color: %'
    END IF
  END FOR
```

**Prevents**: Assigning incompatible designs/threads to machines.

---

### 3. **Auto-Deduct Inventory** 🔥

**File**: `backend/src/config/procedures.sql` (Lines 83-141)

**Trigger**: `trg_auto_deduct_inventory` on `work_orders`

**Rule**: When work order status changes to `in_progress`, automatically deduct thread inventory.

**How it works**:
```sql
BEFORE UPDATE ON work_orders:
  IF NEW.status = 'in_progress' AND OLD.status != 'in_progress' THEN
    FOR EACH (color, quantity) IN (colors_required, quantities):
      GET thread stock by color
      IF current_stock < quantity THEN
        RAISE EXCEPTION 'Insufficient stock'
      END IF
      UPDATE threads SET quantity_in_stock -= quantity
      
      IF new_stock < minimum_level THEN
        CREATE reorder alert
      END IF
    END FOR
  END IF
```

**Prevents**: 
- Starting work orders without sufficient thread stock
- Inventory going negative
- Missing reorder alerts

---

### 4. **Inventory Deduction Function** 📦

**File**: `backend/src/config/procedures.sql` (Lines 144-189)

**Function**: `fn_deduct_inventory_item(item_id, quantity)`

**Returns**: `{ success BOOLEAN, message TEXT }`

**Usage** (from backend):
```javascript
const result = await pool.query(
  `SELECT * FROM fn_deduct_inventory_item($1, $2)`,
  [itemId, quantity]
);
```

**What it does**:
- Validates item exists
- Validates sufficient stock
- Deducts inventory
- Creates low-stock alert if below minimum

---

### 5. **Cost Calculation** 💰

**File**: `backend/src/config/procedures.sql` (Lines 192-255)

**Function**: `fn_calculate_work_order_cost(work_order_id, estimated_minutes)`

**Formula**:
```
ThreadCost     = Σ(unit_cost × quantity) for each thread color
MachineCost    = $50/hour × estimated_hours
LaborCost      = $15/hour × estimated_hours
Overhead       = 15% of (Thread + Machine + Labor)
TotalCost      = ThreadCost + MachineCost + LaborCost + Overhead
```

**Usage** (from backend):
```javascript
const result = await pool.query(
  `SELECT * FROM fn_calculate_work_order_cost($1, $2)`,
  [workOrderId, estimatedMinutes]
);
const { thread_cost_out, machine_cost_out, labor_cost_out, 
        overhead_cost_out, total_cost_out } = result.rows[0];
```

**What it does**:
- Calculates all cost components
- Updates `work_orders` with costs
- Creates `costing_records` entry for audit trail

---

### 6. **Work Order Status Transitions** 🔒

**File**: `backend/src/config/procedures.sql` (Lines 258-308)

**Trigger**: `trg_validate_work_order_status` on `work_orders`

**Valid State Machine**:
```
pending → in_progress → completed → delivered
   ↓          ↓            ↓
  (stay)    (stay)      (stay)

No backward transitions allowed.
```

**How it works**:
```sql
BEFORE UPDATE ON work_orders:
  CASE OLD.status
    WHEN 'pending' THEN
      IF NEW.status NOT IN ('pending', 'in_progress') THEN
        RAISE EXCEPTION 'Invalid transition'
      END IF
    WHEN 'in_progress' THEN
      IF NEW.status NOT IN ('in_progress', 'completed') THEN
        RAISE EXCEPTION 'Invalid transition'
      END IF
    ... (and so on)
  END CASE
  
  IF transitioning to 'in_progress':
    SET actual_start_time = CURRENT_TIMESTAMP
  END IF
  
  IF transitioning to 'completed':
    SET actual_end_time = CURRENT_TIMESTAMP
  END IF
```

**Prevents**: Invalid state transitions (e.g., jumping from pending to delivered).

---

### 7. **Operator Shift Logging** 📌

**File**: `backend/src/config/procedures.sql` (Lines 311-338)

**Trigger**: `trg_log_operator_shift` on `operators_shifts`

**Rules**:
- Quality score must be between 0 and 5
- Shift duration calculated from start/end times

**How it works**:
```sql
BEFORE INSERT OR UPDATE ON operators_shifts:
  IF NEW.quality_score IS NOT NULL AND 
     (NEW.quality_score < 0 OR NEW.quality_score > 5) THEN
    RAISE EXCEPTION 'Quality score must be 0-5'
  END IF
```

**Prevents**: Invalid quality scores being recorded.

---

### 8. **Audit Logging** 📜

**File**: `backend/src/config/procedures.sql` (Lines 341-399)

**Trigger**: `trg_audit_*` on critical tables
- `trg_audit_work_orders` on `work_orders`
- `trg_audit_designs` on `designs`
- `trg_audit_inventory_items` on `inventory_items`
- `trg_audit_threads` on `threads`

**What it logs** (AFTER INSERT/UPDATE/DELETE):
```
action:      INSERT | UPDATE | DELETE
entity_type: work_orders | designs | inventory_items | threads
entity_id:   ID of affected row
old_values:  JSON of row before change
new_values:  JSON of row after change
created_at:  CURRENT_TIMESTAMP
```

**Example audit record**:
```json
{
  "action": "UPDATE",
  "entity_type": "work_orders",
  "entity_id": 5,
  "old_values": {"status": "pending", "total_cost": null},
  "new_values": {"status": "in_progress", "total_cost": 12500.00},
  "created_at": "2025-12-06T18:30:45Z"
}
```

**Prevents**: Untracked changes; enables compliance audits.

---

## Stored Procedures (Multi-Step Operations)

### `sp_start_work_order(work_order_id)`

**What it does**:
1. Validates work order exists
2. Validates status is 'pending'
3. Updates status to 'in_progress' (triggers inventory deduction & timestamp)
4. Returns success/error

**Usage**:
```javascript
// WorkOrderService.js
const result = await pool.query(
  `SELECT * FROM sp_start_work_order($1)`,
  [workOrderId]
);
const { success, message } = result.rows[0];
```

---

### `sp_complete_work_order(work_order_id, quantity_completed)`

**What it does**:
1. Validates work order exists
2. Validates status is 'in_progress'
3. Sets status to 'completed' & quantity_completed (triggers timestamp)
4. Returns success/error

---

### `sp_deliver_work_order(work_order_id)`

**What it does**:
1. Validates work order exists
2. Validates status is 'completed'
3. Sets status to 'delivered'
4. Returns success/error

---

### `sp_resolve_alert(alert_id, resolved_by_user_id)`

**What it does**:
1. Marks alert as resolved
2. Sets resolved_at & resolved_by timestamps
3. Returns success/error

---

### `sp_cleanup_old_audit_logs()`

**What it does**:
1. Deletes audit logs older than 90 days
2. Returns count of deleted records

---

## Backend Changes

### **Old Approach** ❌
```javascript
// WorkOrderService.js
static async startWorkOrder(workOrderId, userId) {
  // Validate design
  const design = await Design.findById(designId);
  if (design.status !== 'approved') throw new Error(...);
  
  // Validate machine
  const isValid = await Machine.validateThreadColors(...);
  if (!isValid) throw new Error(...);
  
  // Deduct inventory
  for (let i = 0; i < colors.length; i++) {
    const stock = await getThreadStock(colors[i]);
    if (stock < quantities[i]) throw new Error(...);
    await updateThreadStock(...);
    
    if (newStock < minimum) {
      await Alert.create(...);
    }
  }
  
  // Update status
  await workOrder.updateStatus('in_progress');
  return workOrder;
}
```

**Problems**:
- Business logic spread across backend
- Race conditions possible (validations then updates)
- Duplicated logic if multiple endpoints touch same data
- Hard to maintain consistency

### **New Approach** ✅
```javascript
// WorkOrderService.js
static async startWorkOrder(workOrderId, userId) {
  try {
    // Call database procedure
    const result = await pool.query(
      `SELECT * FROM sp_start_work_order($1)`,
      [workOrderId]
    );
    
    const { success, message } = result.rows[0];
    if (!success) throw new Error(message);
    
    return await this.getWorkOrderById(workOrderId);
  } catch (error) {
    throw new Error(error.message);
  }
}
```

**Benefits**:
- Thin backend, focused on HTTP handling
- All validation at database layer (atomic)
- Single source of truth
- Impossible to bypass business rules
- Easier to test (test procedures directly in psql)

---

## How to Load Procedures

### **On First Setup**:
```bash
# Schema already created:
psql -U postgres -d embroidery_management -f backend/src/config/schema.sql

# Load procedures:
$env:PGPASSWORD='mohdhussain'
psql -U postgres -d embroidery_management -f backend/src/config/procedures.sql
```

### **To Reload Procedures** (after editing):
```bash
$env:PGPASSWORD='mohdhussain'
psql -U postgres -d embroidery_management -f backend/src/config/procedures.sql
```

---

## Testing Database Rules

### Test Design Approval Validation
```sql
-- This should FAIL (design is not approved)
INSERT INTO work_orders (
  work_order_number, machine_id, design_id, customer_order_id,
  quantity_to_produce, thread_colors_required, thread_quantities, status
) VALUES (
  'WO-001', 1, 1, 1, 100, ARRAY['Red'], ARRAY[10.5], 'pending'
);
-- ERROR: Cannot create work order: Design must be approved
```

### Test Machine Color Validation
```sql
-- This should FAIL (machine A1 doesn't support 'Purple')
INSERT INTO work_orders (
  work_order_number, machine_id, design_id, customer_order_id,
  quantity_to_produce, thread_colors_required, thread_quantities, status
) VALUES (
  'WO-002', 1, 3, 1, 100, ARRAY['Purple'], ARRAY[10.5], 'pending'
);
-- ERROR: Machine 1 does not support thread color: Purple
```

### Test Inventory Auto-Deduction
```sql
-- Start a work order (should deduct inventory)
UPDATE work_orders SET status = 'in_progress' WHERE id = 1;
-- Triggers: deduct threads, create alert if below minimum

-- Verify thread stock was reduced
SELECT color, quantity_in_stock FROM threads WHERE color = 'Red';
```

### Test Cost Calculation
```sql
-- Call cost function
SELECT * FROM fn_calculate_work_order_cost(1, 120);
-- Returns: thread_cost, machine_cost, labor_cost, overhead_cost, total_cost
```

### Test Status Transitions
```sql
-- Valid: pending → in_progress
UPDATE work_orders SET status = 'in_progress' WHERE id = 1;

-- Invalid: in_progress → pending (should FAIL)
UPDATE work_orders SET status = 'pending' WHERE id = 1;
-- ERROR: Invalid work order status transition: in_progress -> pending
```

---

## Audit Trail Example

After any change to work orders, inventory, designs, or threads, a record appears in `audit_logs`:

```sql
SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 5;

-- Example output:
-- id | action | entity_type | entity_id | old_values                      | new_values
-- 42 | UPDATE | work_orders | 1         | {"status":"pending"...}         | {"status":"in_progress"...}
-- 41 | UPDATE | threads     | 2         | {"quantity_in_stock":500}       | {"quantity_in_stock":490}
-- 40 | INSERT | alerts      | 15        | null                            | {"alert_type":"reorder"...}
```

---

## Summary of Files

| File | Purpose |
|------|---------|
| `backend/src/config/schema.sql` | 11 tables + indexes + base timestamp trigger |
| `backend/src/config/procedures.sql` | 🆕 All functions, triggers, procedures |
| `backend/src/services/WorkOrderService.js` | 🔄 Updated to call DB procedures |
| `backend/src/services/InventoryService.js` | 🔄 Updated to call DB functions |

---

## Key Principles

✅ **Single Responsibility**: Each trigger/function does ONE thing  
✅ **Atomic Operations**: Status changes + inventory deduction happen together  
✅ **No Duplicated Logic**: Business rules defined once in database  
✅ **Audit Trail**: Every change logged automatically  
✅ **Error Handling**: Database exceptions bubble up to backend/frontend  
✅ **Thin Backend**: Controllers just translate HTTP ↔ SQL  

---

## Next Steps

1. **Run `npm install` & `npm run dev`** to start backend
2. **Open frontend at http://localhost:3000**
3. **Test work order flows** - you'll see database validation in action
4. **Check `audit_logs`** table to see all changes being tracked
5. **View alerts** - reorder alerts auto-create when stock below minimum

All business logic now lives in the database. 🎉
