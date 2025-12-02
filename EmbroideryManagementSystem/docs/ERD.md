# Entity Relationship Diagram (ERD)

## Database Schema Relationships

```
┌─────────────────┐
│     users       │
├─────────────────┤
│ id (PK)         │
│ name            │
│ email (UNIQUE)  │
│ password_hash   │
│ role            │
│ is_active       │
│ created_at      │
└────────┬────────┘
         │
         ├─────────────────────────────────────────┐
         │                                         │
         ▼                                         ▼
┌─────────────────────┐              ┌──────────────────────┐
│  designs            │              │  operators_shifts    │
├─────────────────────┤              ├──────────────────────┤
│ id (PK)             │              │ id (PK)              │
│ design_name         │              │ operator_id (FK)     │
│ design_file_path    │              │ work_order_id (FK)   │
│ status              │              │ machine_id (FK)      │
│ approved_by (FK)    │              │ shift_date           │
│ approval_date       │              │ output_quantity      │
│ estimated_stitches  │              │ quality_score        │
└────────┬────────────┘              └──────────────────────┘
         │
         │
         ▼
┌─────────────────────────────────┐
│      work_orders                │
├─────────────────────────────────┤
│ id (PK)                         │
│ work_order_number (UNIQUE)      │
│ machine_id (FK) ────────────┐   │
│ design_id (FK) ─────┬───────┤   │
│ customer_order_id (FK) ─┐   │   │
│ assigned_operator_id (FK)│   │   │
│ status                   │   │   │
│ quantity_to_produce      │   │   │
│ thread_colors_required[] │   │   │
│ thread_quantities[]      │   │   │
│ total_cost               │   │   │
│ thread_cost              │   │   │
│ machine_cost             │   │   │
│ labor_cost               │   │   │
│ overhead_cost            │   │   │
└────────┬────────────────┘   │   │
         │                    │   │
         │                    │   │
         ▼                    │   │
    ┌─────────────────┐       │   │
    │   machines      │       │   │
    ├─────────────────┤       │   │
    │ id (PK)         │◄──────┘   │
    │ name            │           │
    │ model           │           │
    │ capacity_      │           │
    │  stitches_hour │           │
    │ supported_     │           │
    │  thread_colors │           │
    │ status          │           │
    │ location        │           │
    └─────────────────┘           │
                                  │
    ┌─────────────────────────┐   │
    │  customer_orders        │◄──┘
    ├─────────────────────────┤
    │ id (PK)                 │
    │ order_number (UNIQUE)   │
    │ customer_name           │
    │ customer_email          │
    │ total_quantity          │
    │ total_price             │
    │ status                  │
    │ required_delivery_date  │
    │ actual_delivery_date    │
    └─────────────────────────┘

┌──────────────────────┐
│   threads            │
├──────────────────────┤
│ id (PK)              │
│ name                 │
│ color                │
│ unit_cost            │
│ quantity_in_stock    │
│ minimum_stock_level  │
└──────────────────────┘

┌──────────────────────┐
│ inventory_items      │
├──────────────────────┤
│ id (PK)              │
│ item_name            │
│ item_type            │
│ quantity_available   │
│ minimum_stock_level  │
│ unit_cost            │
│ supplier             │
│ reorder_quantity     │
└──────────────────────┘

┌──────────────────────┐
│ costing_records      │
├──────────────────────┤
│ id (PK)              │
│ work_order_id (FK)   │
│ thread_cost          │
│ machine_cost         │
│ labor_cost           │
│ overhead_cost        │
│ total_cost           │
│ calculated_by (FK)   │
└──────────────────────┘

┌──────────────────────┐
│  audit_logs          │
├──────────────────────┤
│ id (PK)              │
│ action               │
│ entity_type          │
│ entity_id            │
│ user_id (FK)         │
│ old_values (JSONB)   │
│ new_values (JSONB)   │
│ created_at           │
└──────────────────────┘

┌──────────────────────┐
│  alerts              │
├──────────────────────┤
│ id (PK)              │
│ alert_type           │
│ entity_type          │
│ entity_id            │
│ title                │
│ message              │
│ is_resolved          │
│ resolved_by (FK)     │
│ created_at           │
└──────────────────────┘
```

## Key Relationships

1. **users** (1) ---> (M) **work_orders** - Operators assigned to work orders
2. **users** (1) ---> (M) **operators_shifts** - Operators logging shifts
3. **machines** (1) ---> (M) **work_orders** - Multiple orders per machine
4. **machines** (1) ---> (M) **operators_shifts** - Multiple shifts per machine
5. **designs** (1) ---> (M) **work_orders** - Design used in multiple orders
6. **customer_orders** (1) ---> (M) **work_orders** - Order broken into work orders
7. **work_orders** (1) ---> (M) **costing_records** - Cost history per order
8. **work_orders** (1) ---> (M) **operators_shifts** - Shifts per work order

## Enum Types

- **user_role**: admin | manager | operator
- **work_order_status**: pending | in_progress | completed | delivered
- **design_status**: submitted | reviewed | approved | rejected
- **alert_type**: reorder | machine_maintenance | low_inventory | overdue_order
