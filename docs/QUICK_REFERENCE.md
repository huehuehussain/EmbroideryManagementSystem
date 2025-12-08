# Quick Reference - New API Endpoints

## Designs
```
GET    /api/designs                    Get all designs
GET    /api/designs/:id                Get design by ID
POST   /api/designs/upload             Upload new design
PATCH  /api/designs/:id                Update design ✨ NEW
DELETE /api/designs/:id                Delete design ✨ NEW
PATCH  /api/designs/:id/approve        Approve design (admin/manager)
PATCH  /api/designs/:id/reject         Reject design (admin/manager)
PATCH  /api/designs/:id/review         Mark as reviewed (admin/manager)
```

## Machines
```
GET    /api/machines                   Get all machines
GET    /api/machines/:id               Get machine by ID
POST   /api/machines                   Create machine (admin/manager)
PATCH  /api/machines/:id               Update machine (admin/manager)
DELETE /api/machines/:id               Delete machine ✨ NEW (admin/manager)
POST   /api/machines/:id/validate-colors    Validate colors
POST   /api/machines/:id/validate-capacity  Validate capacity
```

## Work Orders
```
GET    /api/work-orders                Get all work orders
GET    /api/work-orders/:id            Get work order by ID
POST   /api/work-orders                Create work order
PATCH  /api/work-orders/:id            Update work order ✨ NEW (pending only)
DELETE /api/work-orders/:id            Delete work order ✨ NEW (pending only)
POST   /api/work-orders/:id/start      Start work order
POST   /api/work-orders/:id/complete   Complete work order
PATCH  /api/work-orders/:id/status     Update status
POST   /api/work-orders/:id/calculate-cost  Calculate cost
```

## Customer Orders
```
GET    /api/customer-orders            Get all orders
GET    /api/customer-orders/:id        Get order by ID
POST   /api/customer-orders            Create order
PATCH  /api/customer-orders/:id        Update order
PATCH  /api/customer-orders/:id/status Update status
DELETE /api/customer-orders/:id        Delete order ✨ NEW
```

---

## Auto-Status Update Logic

**When:** Work order status changes  
**What:** Customer order status automatically updates

```
All work orders completed/delivered → Customer order = "completed"
Any work order in_progress          → Customer order = "in_progress"
All work orders pending             → Customer order = "pending"
```

---

## Key Constraints

### Can Update
- ✅ Pending work orders (not started)
- ✅ Any unapproved designs
- ✅ Any machines
- ✅ Any customer orders

### Cannot Update
- ❌ In-progress work orders
- ❌ Completed work orders
- ❌ Delivered work orders
- ❌ Approved designs

### Can Delete
- ✅ Pending work orders only
- ✅ Any unapproved designs
- ✅ Any machines
- ✅ Any customer orders (cascades to work orders)

### Cannot Delete
- ❌ In-progress/completed/delivered work orders
- ❌ Approved designs
- ❌ Designs with active work orders

---

## Example: Complete Workflow

```bash
# 1. Create machine
POST /api/machines
{ "name": "Machine 1", "capacity_stitches_per_hour": 5000, 
  "supported_thread_colors": ["red", "blue"] }
→ Returns: machine ID = 1

# 2. Create design
POST /api/designs/upload
(upload file, name: "Design 1")
→ Returns: design ID = 1

# 3. Approve design
PATCH /api/designs/1/approve
→ Status: submitted → approved

# 4. Create customer order
POST /api/customer-orders
{ "order_number": "ORD-001", "customer_name": "ACME", 
  "total_quantity": 500 }
→ Returns: customer order ID = 1, status = "pending"

# 5. Create work order
POST /api/work-orders
{ "work_order_number": "WO-001", "machine_id": 1, "design_id": 1,
  "customer_order_id": 1, "quantity_to_produce": 500,
  "thread_colors_required": ["red", "blue"] }
→ Returns: work order ID = 1, status = "pending"

# 6. Start work order
POST /api/work-orders/1/start
→ Returns: work order status = "in_progress"
→ AUTO: Customer order 1 status changes to "in_progress"

# 7. Complete work order
POST /api/work-orders/1/complete
{ "quantity_completed": 500 }
→ Returns: work order status = "completed"
→ AUTO: Customer order 1 status changes to "completed"
```

---

## Database Changes Summary

**Cleared:** All dummy data + reset sequences  
**Added:** 1 new trigger for auto-status updates  
**Total Functions:** 8  
**Total Triggers:** 11  
**Total Procedures:** 5  

---

## Files Modified

- Controllers: 4 files
- Models: 3 files
- Services: 1 file
- Routes: 4 files
- Database: 1 file (procedures.sql)
- Docs: 2 new files

---

✅ **All features ready for use!**

Refer to `NEW_FEATURES.md` for detailed documentation and testing guide.
