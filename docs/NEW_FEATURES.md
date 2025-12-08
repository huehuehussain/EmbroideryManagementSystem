# New Features - December 8, 2025

All features have been successfully implemented and the database has been cleared for fresh data entry.

## 1. ✅ Database Cleared

All dummy data has been deleted and sequence counters reset. You can now create new entries from scratch.

**Tables cleared:**
- users, machines, designs, threads, inventory_items, customer_orders, work_orders, operators_shifts, costing_records, alerts, audit_logs

---

## 2. ✅ Design Management (Full CRUD)

### Create Design
```bash
POST /api/designs/upload
Content-Type: multipart/form-data

Body:
- design_file: <file>
- design_name: "My Design"
- designer_name: "John Doe"
- estimated_stitches: 5000
- estimated_thread_usage: "Red: 50m, Blue: 30m"
```

### Update Design (Before Approval)
```bash
PATCH /api/designs/:id

Body:
{
  "design_name": "Updated Name",
  "designer_name": "Jane Doe",
  "estimated_stitches": 6000,
  "estimated_thread_usage": "Red: 60m, Blue: 40m"
}
```

### Delete Design
```bash
DELETE /api/designs/:id
```

### Approve Design (Admin/Manager Only)
```bash
PATCH /api/designs/:id/approve
```

### Reject Design (Admin/Manager Only)
```bash
PATCH /api/designs/:id/reject

Body:
{
  "rejection_reason": "Design does not meet specifications"
}
```

---

## 3. ✅ Machine Management (Full CRUD)

### Create Machine
```bash
POST /api/machines

Body:
{
  "name": "Machine 1",
  "model": "Brother PR1050X",
  "capacity_stitches_per_hour": 5000,
  "supported_thread_colors": ["red", "blue", "black", "white"],
  "location": "Floor 1"
}
```

### Update Machine
```bash
PATCH /api/machines/:id

Body:
{
  "name": "Machine 1 Updated",
  "status": "maintenance",
  "location": "Floor 2"
}
```

### Delete Machine
```bash
DELETE /api/machines/:id
```

---

## 4. ✅ Work Order Management (Full CRUD)

### Create Work Order
```bash
POST /api/work-orders

Body:
{
  "work_order_number": "WO-001",
  "machine_id": 1,
  "design_id": 1,
  "customer_order_id": 1,
  "quantity_to_produce": 100,
  "thread_colors_required": ["red", "blue"],
  "thread_quantities": [50, 30],
  "estimated_production_time": 120,
  "assigned_operator_id": 2
}
```

### Update Work Order (Pending Only)
```bash
PATCH /api/work-orders/:id

Body:
{
  "machine_id": 2,
  "quantity_to_produce": 150,
  "estimated_production_time": 180
}
```

⚠️ **Note:** Only pending work orders can be updated. Once started (in_progress), they cannot be modified.

### Delete Work Order (Pending Only)
```bash
DELETE /api/work-orders/:id
```

⚠️ **Note:** Only pending work orders can be deleted.

### Start Work Order
```bash
POST /api/work-orders/:id/start
```

**Automatically:**
- Validates design is approved
- Validates machine supports thread colors
- Deducts inventory for threads
- Creates reorder alerts if stock low
- Sets actual_start_time

### Complete Work Order
```bash
POST /api/work-orders/:id/complete

Body:
{
  "quantity_completed": 100
}
```

---

## 5. ✅ Customer Order Management (Full CRUD)

### Create Customer Order
```bash
POST /api/customer-orders

Body:
{
  "order_number": "ORD-001",
  "customer_name": "John Smith",
  "customer_email": "john@example.com",
  "customer_phone": "1234567890",
  "delivery_address": "123 Main St, City",
  "required_delivery_date": "2025-12-20",
  "total_quantity": 100,
  "total_price": 5000,
  "notes": "Urgent order"
}
```

### Update Customer Order
```bash
PATCH /api/customer-orders/:id

Body:
{
  "customer_name": "Jane Smith",
  "delivery_address": "456 Oak Ave, City",
  "required_delivery_date": "2025-12-25"
}
```

### Delete Customer Order
```bash
DELETE /api/customer-orders/:id
```

### Update Customer Order Status (Manual)
```bash
PATCH /api/customer-orders/:id/status

Body:
{
  "status": "in_progress"
}
```

---

## 6. ✅ Automatic Customer Order Status Updates

**The system automatically updates customer order status based on work order status:**

| Scenario | Customer Order Status |
|----------|---------------------|
| All work orders pending | `pending` |
| Any work order in_progress | `in_progress` |
| All work orders completed/delivered | `completed` |

**How it works:**
1. When a work order status changes → Database trigger fires
2. Trigger checks all work orders for that customer order
3. Updates customer order status automatically

**Example:**
- Create Customer Order (status: pending)
- Create Work Order 1 for this order (status: pending)
- Create Work Order 2 for this order (status: pending)
- Start Work Order 1 → Customer Order status auto-changes to `in_progress`
- Complete Work Order 1 → Still `in_progress` (WO2 not done)
- Complete Work Order 2 → Customer Order status auto-changes to `completed`

---

## 7. Route Summary

### Design Routes
```
GET    /api/designs              - Get all designs
GET    /api/designs/:id          - Get design by ID
POST   /api/designs/upload       - Upload new design
PATCH  /api/designs/:id          - Update design (name, etc.)
DELETE /api/designs/:id          - Delete design
PATCH  /api/designs/:id/approve  - Approve design (Admin/Manager)
PATCH  /api/designs/:id/reject   - Reject design (Admin/Manager)
PATCH  /api/designs/:id/review   - Mark as reviewed (Admin/Manager)
```

### Machine Routes
```
GET    /api/machines              - Get all machines
GET    /api/machines/:id          - Get machine by ID
POST   /api/machines              - Create machine (Admin/Manager)
PATCH  /api/machines/:id          - Update machine (Admin/Manager)
DELETE /api/machines/:id          - Delete machine (Admin/Manager)
POST   /api/machines/:id/validate-colors   - Validate thread colors
POST   /api/machines/:id/validate-capacity - Validate capacity
```

### Work Order Routes
```
GET    /api/work-orders              - Get all work orders
GET    /api/work-orders/:id          - Get work order by ID
POST   /api/work-orders              - Create work order
PATCH  /api/work-orders/:id          - Update work order (Pending only)
DELETE /api/work-orders/:id          - Delete work order (Pending only)
POST   /api/work-orders/:id/start    - Start work order
POST   /api/work-orders/:id/complete - Complete work order
PATCH  /api/work-orders/:id/status   - Update status
POST   /api/work-orders/:id/calculate-cost - Calculate cost
```

### Customer Order Routes
```
GET    /api/customer-orders              - Get all orders
GET    /api/customer-orders/:id          - Get order by ID
POST   /api/customer-orders              - Create order
PATCH  /api/customer-orders/:id          - Update order
PATCH  /api/customer-orders/:id/status   - Update status (manual)
DELETE /api/customer-orders/:id          - Delete order
```

---

## 8. Constraints & Rules

### Work Order Rules
- ❌ Cannot create work order with unapproved design (blocked by DB trigger)
- ❌ Cannot start work order with incompatible machine/colors (blocked by DB trigger)
- ❌ Cannot update/delete in_progress, completed, or delivered work orders
- ✅ Inventory auto-deducts when work order starts
- ✅ Cost auto-calculated using database formula

### Customer Order Rules
- ✅ Status auto-updates based on work orders
- ✅ Can delete only if no associated work orders
- ✅ Can manually update status if needed

### Design Rules
- ❌ Cannot use unapproved designs in work orders
- ✅ Can update/delete only unapproved designs
- ✅ Can upload multiple file types (dst, pes, exp, jef, vip, png, jpg, jpeg)

### Machine Rules
- ✅ Can create/update/delete machines
- ✅ Validates supported thread colors when used in work orders
- ✅ Validates capacity (stitches/hour) when used in work orders

---

## 9. Testing Flow

### Step 1: Create a User (if needed)
```bash
POST /api/auth/register
{
  "name": "Manager User",
  "email": "manager@company.com",
  "password": "password123",
  "role": "manager"
}
```

### Step 2: Create a Machine
```bash
POST /api/machines
{
  "name": "Brother PR1050X",
  "model": "PR1050X",
  "capacity_stitches_per_hour": 5000,
  "supported_thread_colors": ["red", "blue", "black"],
  "location": "Floor 1"
}
```

### Step 3: Create a Design
```bash
POST /api/designs/upload
[multipart form with design file]
```

### Step 4: Approve the Design (Admin/Manager)
```bash
PATCH /api/designs/1/approve
```

### Step 5: Create a Customer Order
```bash
POST /api/customer-orders
{
  "order_number": "ORD-2025-001",
  "customer_name": "ACME Corp",
  "customer_email": "orders@acme.com",
  "delivery_address": "123 Business St",
  "required_delivery_date": "2025-12-20",
  "total_quantity": 500,
  "total_price": 25000
}
```

### Step 6: Create a Work Order
```bash
POST /api/work-orders
{
  "work_order_number": "WO-2025-001",
  "machine_id": 1,
  "design_id": 1,
  "customer_order_id": 1,
  "quantity_to_produce": 500,
  "thread_colors_required": ["red", "blue", "black"],
  "thread_quantities": [200, 150, 100],
  "estimated_production_time": 480,
  "assigned_operator_id": 2
}
```

### Step 7: Start Work Order
```bash
POST /api/work-orders/1/start

Response: Customer Order status → "in_progress" (auto-updated!)
```

### Step 8: Complete Work Order
```bash
POST /api/work-orders/1/complete
{
  "quantity_completed": 500
}

Response: Customer Order status → "completed" (auto-updated!)
```

---

## 10. Summary of Changes

### Database
- ✅ All dummy data cleared
- ✅ Sequence counters reset to 1
- ✅ New trigger: `trg_update_customer_order_status` - Auto-updates customer order status

### Backend Controllers
- ✅ `DesignController` - Added updateDesign, deleteDesign methods
- ✅ `MachineController` - Added deleteMachine method
- ✅ `WorkOrderController` - Added updateWorkOrder, deleteWorkOrder methods
- ✅ `CustomerOrderController` - Added deleteOrder method

### Backend Models
- ✅ `Design` - Added update, delete methods
- ✅ `Machine` - Added delete method
- ✅ `CustomerOrder` - Added delete method

### Backend Services
- ✅ `WorkOrderService` - Added updateWorkOrder, deleteWorkOrder methods

### Backend Routes
- ✅ `designRoutes` - Added PATCH and DELETE endpoints
- ✅ `machineRoutes` - Added DELETE endpoint
- ✅ `workOrderRoutes` - Added PATCH and DELETE endpoints
- ✅ `customerOrderRoutes` - Added DELETE endpoint

### Database Procedures
- ✅ Added new function: `fn_update_customer_order_status()`
- ✅ Added new trigger: `trg_update_customer_order_status`

---

## 11. Testing Checklist

- [ ] Create and delete designs
- [ ] Create and update machines
- [ ] Create customer orders
- [ ] Create work orders with proper validations
- [ ] Start work order → verify customer order status changes to "in_progress"
- [ ] Complete work order → verify customer order status changes to "completed"
- [ ] Try to create work order with unapproved design → should fail
- [ ] Update pending work order → should succeed
- [ ] Try to update in_progress work order → should fail
- [ ] Delete pending work order → should succeed
- [ ] Delete in_progress work order → should fail

---

All features are ready for testing! The system maintains full audit logging and all business rules are enforced at the database level.
