# UML Diagrams

## Class Diagram - Backend Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      CONTROLLERS LAYER                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  AuthController          WorkOrderController                 │
│  ├── register()          ├── getAllWorkOrders()              │
│  ├── login()             ├── getWorkOrderById()              │
│  └── validateToken()     ├── createWorkOrder()               │
│                          ├── startWorkOrder()                │
│  InventoryController     ├── completeWorkOrder()             │
│  ├── getAllItems()       ├── updateStatus()                  │
│  ├── getItemById()       └── calculateCost()                 │
│  ├── createItem()                                            │
│  ├── deductStock()       MachineController                   │
│  ├── getLowStockItems()  ├── getAllMachines()                │
│  └── bulkDeductStock()   ├── getMachineById()                │
│                          ├── createMachine()                 │
│  DesignController        ├── updateMachine()                 │
│  ├── getAllDesigns()     ├── validateThreadColors()          │
│  ├── getDesignById()     └── validateCapacity()              │
│  ├── uploadDesign()                                          │
│  ├── approveDesign()     CustomerOrderController             │
│  ├── rejectDesign()      ├── getAllOrders()                  │
│  └── reviewDesign()      ├── getOrderById()                  │
│                          ├── createOrder()                   │
│  OperatorShiftController ├── updateOrder()                   │
│  ├── getAllShifts()      └── updateStatus()                  │
│  ├── getShiftById()                                          │
│  ├── getOperatorShifts() DashboardController                 │
│  ├── createShift()       ├── getProductionSummary()          │
│  └── updateShift()       ├── getMachineUtilization()         │
│                          ├── getOperatorPerformance()        │
│  AuditLogController      ├── getInventoryUsage()             │
│  ├── getAllAuditLogs()   ├── getPendingAlerts()              │
│  ├── getAuditLogById()   └── getDashboardOverview()          │
│  ├── exportAuditLogs()                                       │
│  ├── getUnresolvedAlerts() AlertController                   │
│  └── resolveAlert()      ├── getAlerts()                     │
│                          ├── resolveAlert()                  │
│                          └── deleteOldAlerts()               │
│                                                              │
└─────────────────────────────────────────────────────────────┘
                              ▲
                              │ uses
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      SERVICES LAYER                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  AuthService                   WorkOrderService              │
│  ├── registerUser()            ├── createWorkOrder()         │
│  ├── loginUser()               │  └─ validates design        │
│  ├── validateToken()           │  └─ validates machine       │
│  └── generateJWT()             ├── startWorkOrder()          │
│                                │  └─ deducts inventory       │
│  InventoryService              ├── completeWorkOrder()       │
│  ├── getAllInventory()         ├── calculateCost()           │
│  ├── deductInventory()         │  └─ formula: ThreadCost +   │
│  │  └─ creates reorder alert   │     MachineCost + Labor     │
│  ├── updateInventory()         │     + Overhead(15%)         │
│  ├── getLowStockItems()        ├── validateMachineColors()   │
│  └── triggerLowStockAlert()    └── validateInventory()       │
│                                                              │
└─────────────────────────────────────────────────────────────┘
                              ▲
                              │ uses
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      MODELS LAYER                            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  User              Machine            Design                 │
│  ├── findById()    ├── findById()      ├── findById()         │
│  ├── findByEmail() ├── getAll()        ├── getAll()           │
│  ├── create()      ├── create()        ├── create()           │
│  ├── update()      ├── update()        ├── updateStatus()     │
│  ├── getAll()      ├── validateColors()└── uploadFile()       │
│  └── delete()      └── validateCapacity()                     │
│                                                              │
│  Thread            InventoryItem       CustomerOrder          │
│  ├── findById()    ├── findById()      ├── findById()         │
│  ├── findByColor() ├── getAll()        ├── getAll()           │
│  ├── getAll()      ├── create()        ├── create()           │
│  ├── create()      ├── update()        ├── update()           │
│  ├── updateStock() ├── deductStock()   ├── updateStatus()     │
│  └── checkLow()    └── checkLowStock() └── findByNumber()     │
│                                                              │
│  WorkOrder         OperatorShift       CostingRecord   Alert  │
│  ├── findById()    ├── findById()      ├── create()   ├─ crud()
│  ├── getAll()      ├── getAll()        └── getByOrder ├─ resolve()
│  ├── create()      ├── create()                       └─ delete()
│  ├── update()      ├── update()                                 │
│  ├── updateStatus()└── getByOperator()                         │
│  └── withJoins()   └── withDateRange()                         │
│                                                              │
└─────────────────────────────────────────────────────────────┘
                              ▲
                              │ queries
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      DATABASE LAYER                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  PostgreSQL Database (11 Tables)                             │
│  ├── users                                                   │
│  ├── machines                                                │
│  ├── designs                                                 │
│  ├── threads                                                 │
│  ├── inventory_items                                         │
│  ├── customer_orders                                         │
│  ├── work_orders                                             │
│  ├── operators_shifts                                        │
│  ├── costing_records                                         │
│  ├── audit_logs                                              │
│  └── alerts                                                  │
│                                                              │
│  Features:                                                   │
│  ├── Foreign Key Constraints                                │
│  ├── Cascading Deletes                                       │
│  ├── Automatic Timestamp Triggers                            │
│  ├── Indexes on Frequently Queried Fields                    │
│  └── JSONB Support for Audit Data                            │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Sequence Diagram - Work Order Creation & Processing

```
User              Frontend             Backend            Database
│                   │                    │                   │
├─ Fill Form ──────>│                    │                   │
│                   ├─ POST /workorders─>│                   │
│                   │                    ├─ Validate Design  │
│                   │                    │  (must be approved)│
│                   │                    ├─ Validate Machine │
│                   │                    │  (color support)  │
│                   │                    ├─ Create WorkOrder │
│                   │                    │ ───────────────────>│
│                   │                    │<─ ID returned ────│
│                   │                    ├─ Audit Log Entry  │
│                   │                    │ ───────────────────>│
│                   │<─ {success} ──────│                   │
│<─ Confirmation ───│                    │                   │
│                   │                    │                   │
│ (Click START)     │                    │                   │
├─────────────────>│                    │                   │
│                   ├─ POST /workorders/:id/start──>         │
│                   │                    ├─ Check Inventory   │
│                   │                    │  (for each thread) │
│                   │                    ├─ Validate Qty >= Req
│                   │                    │                   │
│                   │                    ├─ Deduct Inventory  │
│                   │                    │ ───────────────────>│
│                   │                    │<─ Confirmed ──────│
│                   │                    │                   │
│                   │                    ├─ If Stock < Min:  │
│                   │                    │  Create Alert      │
│                   │                    │ ───────────────────>│
│                   │                    │                   │
│                   │                    ├─ Update Status    │
│                   │                    │  to in_progress    │
│                   │                    │ ───────────────────>│
│                   │                    │                   │
│                   │<─ {success} ──────│                   │
│<─ Order Started ──│                    │                   │
│                   │                    │                   │
│ (Click COMPLETE)  │                    │                   │
├─────────────────>│                    │                   │
│                   ├─ POST /workorders/:id/complete        │
│                   │                    ├─ Prompt for Qty   │
│                   │                    │  Produced         │
│ (Enter Qty) ──────>│                    │                   │
│                   ├─ POST /workorders/:id/calculate-cost──>
│                   │                    ├─ Thread Cost      │
│                   │                    │  = Σ(color_cost × qty)
│                   │                    ├─ Machine Cost     │
│                   │                    │  = $50 × hours    │
│                   │                    ├─ Labor Cost       │
│                   │                    │  = $15 × hours    │
│                   │                    ├─ Overhead         │
│                   │                    │  = 15% subtotal   │
│                   │<─ {total_cost} ───│                   │
│                   ├─ PATCH /workorders/:id/status ──────>│
│                   │                    ├─ Update Status    │
│                   │                    │  to completed     │
│                   │                    │ ───────────────────>│
│                   │                    │                   │
│                   │                    ├─ Create Costing   │
│                   │                    │  Record           │
│                   │                    │ ───────────────────>│
│                   │                    │<─ Confirmed ──────│
│                   │<─ {success} ──────│                   │
│<─ Complete Conf ──│                    │                   │
│                   │                    │                   │
```

## Sequence Diagram - Authentication Flow

```
User              Frontend             Backend            Database
│                   │                    │                   │
├─ Enter Creds ────>│                    │                   │
│                   ├─ POST /auth/login─>│                   │
│                   │                    ├─ Query User       │
│                   │                    │ ───────────────────>│
│                   │                    │<─ User Data ──────│
│                   │                    ├─ Compare Password │
│                   │                    │  (bcryptjs)       │
│                   │                    ├─ Generate JWT     │
│                   │                    │  payload: {       │
│                   │                    │   id, email, role │
│                   │                    │  }                │
│                   │<─ {token, user}───│                   │
│<─ Redirect Home ──│                    │                   │
│ (Store Token)     │                    │                   │
│                   │                    │                   │
│ (Navigate)        │                    │                   │
├─────────────────>│                    │                   │
│                   ├─ GET /api/data ────┤                   │
│                   │  Authorization:    │                   │
│                   │  Bearer <token>    ├─ Verify Token     │
│                   │                    │  (jwt-simple)    │
│                   │                    ├─ Extract user_id  │
│                   │                    │  and role         │
│                   │                    ├─ Check Role       │
│                   │                    │  Authorization    │
│                   │                    ├─ Query Data       │
│                   │                    │ ───────────────────>│
│                   │                    │<─ Data ───────────│
│                   │                    ├─ Log Action       │
│                   │                    │ ───────────────────>│
│                   │<─ {data} ─────────│                   │
│<─ Display Data ───│                    │                   │
│                   │                    │                   │
│ (Click Logout)    │                    │                   │
├─────────────────>│                    │                   │
│ (Clear Token)     │                    │                   │
│<─ Login Page ─────│                    │                   │
│                   │                    │                   │
```

## Component Hierarchy - React Frontend

```
┌─────────────────────────────────────────────────────────────┐
│                      App.js                                  │
│  ├─ State: token, user (from localStorage)                  │
│  ├─ Routes:                                                 │
│  │  ├─ /login → LoginPage                                   │
│  │  ├─ /dashboard → DashboardPage (protected)               │
│  │  ├─ /workorders → WorkOrdersPage (protected)             │
│  │  ├─ /inventory → InventoryPage (protected)               │
│  │  ├─ /machines → MachinesPage (protected)                 │
│  │  ├─ /designs → DesignsPage (protected)                   │
│  │  ├─ /orders → CustomerOrdersPage (protected)             │
│  │  ├─ /shifts → OperatorLogsPage (protected)               │
│  │  └─ /audit → AuditLogsPage (protected)                   │
│  │                                                          │
│  └─ Layout:                                                 │
│     ├─ <Navigation /> (if logged in)                        │
│     └─ <Routes> / Page Components                           │
│                                                              │
└─────────────────────────────────────────────────────────────┘
                           │
         ┌─────────────────┼─────────────────┐
         │                 │                 │
         ▼                 ▼                 ▼
    ┌─────────────┐  ┌──────────────┐  ┌───────────────┐
    │ LoginPage   │  │ DashboardPage│  │ WorkOrdersPage
    └─────────────┘  ├──────────────┤  ├───────────────┤
                     │ useState:    │  │ useState:     │
                     │ ├─ metrics  │  │ ├─ orders    │
                     │ ├─ machines │  │ ├─ selectedId│
                     │ └─ alerts   │  │ └─ formData  │
                     │              │  │              │
                     │ Components: │  │ Components: │
                     │ ├─ Cards   │  │ ├─ Form     │
                     │ ├─ Tables  │  │ ├─ Table    │
                     │ └─ Charts  │  │ └─ Buttons  │
                     │              │  │              │
                     │ API Calls:   │  │ API Calls:   │
                     │ ├─ overview │  │ ├─ getAll    │
                     │ ├─ metrics  │  │ ├─ create    │
                     │ ├─ alerts   │  │ ├─ start     │
                     │ └─ audit    │  │ ├─ complete  │
                     │              │  │ └─ calculate│
                     │              │  │   Cost      │
                     │              │  │              │
                     └──────────────┘  └───────────────┘

    ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
    │InventoryPage│  │ MachinesPage │  │ DesignsPage  │
    ├──────────────┤  ├──────────────┤  ├──────────────┤
    │ useState:    │  │ useState:    │  │ useState:    │
    │ ├─ items   │  │ ├─ machines  │  │ ├─ designs  │
    │ ├─ alerts  │  │ └─ filter    │  │ ├─ status   │
    │ └─ formData│  │              │  │ └─ file     │
    │            │  │ Components: │  │              │
    │ Components:│  │ ├─ Card Grid│  │ Components: │
    │ ├─ Form   │  │ └─ Status   │  │ ├─ Filter   │
    │ ├─ Table  │  │   Badge     │  │ ├─ Upload   │
    │ └─ Alerts │  │              │  │ ├─ Cards    │
    │            │  │ API Calls:   │  │ └─ Actions  │
    │ API Calls:│  │ ├─ getAll    │  │              │
    │ ├─ getAll  │  │ ├─ create    │  │ API Calls:  │
    │ ├─ create  │  │ ├─ update    │  │ ├─ getAll   │
    │ ├─ deduct  │  │ ├─ validateC │  │ ├─ upload   │
    │ ├─ low     │  │ │  olors     │  │ ├─ approve  │
    │ │ stock    │  │ └─ validateC │  │ ├─ reject   │
    │ └─ update  │  │    apacity   │  │ └─ review   │
    │            │  │              │  │              │
    └──────────────┘  └──────────────┘  └──────────────┘

    ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
    │CustomerOrder │  │OperatorLogsPage
    │Page          │  ├──────────────┤  │ AuditLogsPage
    ├──────────────┤  │ useState:    │  ├──────────────┤
    │ useState:    │  │ ├─ shifts   │  │ useState:    │
    │ ├─ orders   │  │ ├─ operators│  │ ├─ logs     │
    │ ├─ status   │  │ ├─ machines │  │ ├─ filter   │
    │ └─ formData │  │ └─ formData │  │ └─ page     │
    │             │  │              │  │              │
    │ Components: │  │ Components: │  │ Components: │
    │ ├─ Form    │  │ ├─ Form     │  │ ├─ Filter   │
    │ ├─ Table   │  │ ├─ Table    │  │ ├─ Table    │
    │ └─ Status  │  │ └─ Scores   │  │ ├─ Export   │
    │   Dropdown │  │              │  │ └─ Pagination
    │             │  │ API Calls:   │  │              │
    │ API Calls: │  │ ├─ getAll    │  │ API Calls:  │
    │ ├─ getAll   │  │ ├─ getByOp   │  │ ├─ getAll   │
    │ ├─ create   │  │ ├─ create    │  │ ├─ export   │
    │ ├─ update   │  │ └─ update    │  │ └─ filters  │
    │ └─ status   │  │              │  │              │
    │             │  │              │  │              │
    └──────────────┘  └──────────────┘  └──────────────┘

                      ┌──────────────┐
                      │ Navigation   │
                      ├──────────────┤
                      │ Props:       │
                      │ ├─ user      │
                      │ ├─ onLogout  │
                      │              │
                      │ Components: │
                      │ ├─ Logo     │
                      │ ├─ Nav Links│
                      │ ├─ User Info│
                      │ └─ Logout   │
                      │   Button    │
                      │              │
                      │ Features:   │
                      │ ├─ Role-    │
                      │ │ Aware     │
                      │ │ Menu      │
                      │ └─ Sticky   │
                      │   Position  │
                      │              │
                      └──────────────┘
```

## State Flow Diagram

```
┌──────────────────┐
│  User Lands      │
│  on /login       │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  LoginPage       │
│  Displays Form   │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐      No
│  Credentials     ├─────────────────────┐
│  Valid?          │                     │
└────────┬─────────┘                     │
         │ Yes                           │
         ▼                               │
┌──────────────────┐                     │
│  API /auth/login │                     │
│  Returns {token} │                     │
└────────┬─────────┘                     │
         │                               │
         ▼                               │
┌──────────────────┐                     │
│  Store in        │                     │
│  localStorage    │                     │
│  ├─ token        │                     │
│  └─ user         │                     │
└────────┬─────────┘                     │
         │                               │
         ▼                               ▼
┌──────────────────────────────────────┐
│  App.js State Update                 │
│  ├─ setToken(token)                  │
│  └─ setUser(user)                    │
└────────┬─────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│  Routes Available                    │
│  ├─ Protected Routes Unlocked        │
│  ├─ Navigation Component Renders     │
│  └─ Redirect to /dashboard           │
└────────┬─────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│  DashboardPage                       │
│  ├─ useEffect fetches data           │
│  ├─ Renders metrics cards            │
│  ├─ Displays tables                  │
│  └─ Shows alerts                     │
└────────┬─────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│  All API Requests Include            │
│  ├─ Authorization: Bearer {token}    │
│  ├─ Token from localStorage          │
│  └─ Via axios interceptor            │
└────────┬─────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│  User Clicks Logout                  │
│  ├─ Clear localStorage               │
│  ├─ Clear App.js state               │
│  └─ Redirect to /login               │
└──────────────────────────────────────┘
```
