# Embroidery Management System - Complete Documentation

## Overview

A full-stack web application for managing embroidery production workflows, inventory, machines, work orders, operators, customer orders, costing, and dashboards.

## Tech Stack

- **Frontend**: React with Tailwind CSS & CSS Modules
- **Backend**: Node.js (Express)
- **Database**: PostgreSQL
- **Authentication**: JWT (JSON Web Tokens)
- **File Upload**: Multer
- **API**: REST API

## Project Structure

```
EmbroideryManagementSystem/
├── backend/
│   ├── src/
│   │   ├── controllers/      # Request handlers
│   │   ├── services/         # Business logic
│   │   ├── models/          # Database queries
│   │   ├── routes/          # API endpoints
│   │   ├── middleware/      # Express middleware
│   │   ├── utils/           # Utilities & constants
│   │   ├── config/          # Database & configuration
│   │   └── server.js        # Main app entry
│   ├── uploads/             # File uploads directory
│   ├── package.json
│   ├── .env.example
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/      # Reusable components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API client & services
│   │   ├── styles/         # CSS modules
│   │   ├── utils/          # Utilities
│   │   ├── hooks/          # Custom React hooks
│   │   ├── App.js          # Main app
│   │   └── index.js        # React entry
│   ├── public/
│   ├── package.json
│   ├── .env.example
│   └── Dockerfile
├── docs/                     # Documentation
├── docker-compose.yml
├── .gitignore
└── README.md
```

## Installation & Setup

### Prerequisites
- Node.js v16+
- PostgreSQL 12+
- Docker (optional)
- npm or yarn

### Option 1: Local Development Setup

#### Backend Setup

```bash
cd backend
cp .env.example .env
npm install
```

Update `.env`:
```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=embroidery_management
DB_USER=postgres
DB_PASSWORD=your_password
JWT_SECRET=your_secret_key
PORT=5000
```

Create PostgreSQL database:
```bash
createdb embroidery_management
psql -U postgres -d embroidery_management -f src/config/schema.sql
```

Seed sample data:
```bash
npm run seed
```

Start backend:
```bash
npm run dev
```

#### Frontend Setup

```bash
cd frontend
cp .env.example .env
npm install
```

Update `.env`:
```
REACT_APP_API_BASE_URL=http://localhost:5000
```

Start frontend:
```bash
npm start
```

### Option 2: Docker Setup

```bash
cd EmbroideryManagementSystem
docker-compose up -d
```

Services will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- PostgreSQL: localhost:5432

## Demo Credentials

```
Admin:
  Email: admin@embroidery.com
  Password: admin123

Manager:
  Email: manager@embroidery.com
  Password: manager123

Operator:
  Email: alice@embroidery.com
  Password: operator123
```

## Core Features

### 1. Work Orders Management
- Create and assign work orders to machines
- Link to designs, customer orders, and machines
- Track thread colors and quantities
- Enforce machine capacity and thread color restrictions
- Automatic cost calculation
- Status transitions: Pending → In Progress → Completed → Delivered

### 2. Inventory Management
- Track consumables (threads, needles, backing cloth, etc.)
- Auto-deduct inventory when work orders start
- Low stock alerts and reorder notifications
- Minimum stock level tracking

### 3. Machine Management
- Machine capacity tracking
- Supported thread colors per machine
- Machine status (available/busy)
- Maintenance scheduling

### 4. Design & Approval Workflow
- Upload embroidery designs
- Status tracking: Submitted → Reviewed → Approved/Rejected
- Only approved designs can enter production
- Design preview and information

### 5. Customer Order Management
- Create and track customer orders
- Order lifecycle management
- Link designs and work orders
- Delivery tracking

### 6. Operator Shift Logging
- Log shift timings
- Track machine assignments
- Record output quantities
- Quality score tracking

### 7. Production Dashboard
- Daily production summary
- Machine utilization metrics
- Operator performance analytics
- Inventory usage tracking
- Pending alerts overview

### 8. Audit & Logging
- Complete audit trail of all actions
- Export logs as CSV/JSON
- Compliance tracking
- User activity monitoring

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/validate` - Validate JWT token

### Work Orders
- `GET /api/work-orders` - Get all work orders
- `GET /api/work-orders/:id` - Get work order details
- `POST /api/work-orders` - Create work order
- `POST /api/work-orders/:id/start` - Start work order
- `POST /api/work-orders/:id/complete` - Complete work order
- `PATCH /api/work-orders/:id/status` - Update status
- `POST /api/work-orders/:id/calculate-cost` - Calculate costs

### Inventory
- `GET /api/inventory` - Get all inventory items
- `GET /api/inventory/:id` - Get item details
- `POST /api/inventory` - Create inventory item
- `PATCH /api/inventory/:id` - Update item
- `POST /api/inventory/:id/deduct` - Deduct stock
- `GET /api/inventory/low-stock` - Get low stock items

### Machines
- `GET /api/machines` - Get all machines
- `GET /api/machines/:id` - Get machine details
- `POST /api/machines` - Create machine
- `PATCH /api/machines/:id` - Update machine
- `POST /api/machines/:id/validate-colors` - Validate thread colors
- `POST /api/machines/:id/validate-capacity` - Validate capacity

### Designs
- `GET /api/designs` - Get all designs
- `GET /api/designs/:id` - Get design details
- `POST /api/designs/upload` - Upload design
- `PATCH /api/designs/:id/approve` - Approve design
- `PATCH /api/designs/:id/reject` - Reject design
- `PATCH /api/designs/:id/review` - Mark as reviewed

### Customer Orders
- `GET /api/customer-orders` - Get all orders
- `GET /api/customer-orders/:id` - Get order details
- `POST /api/customer-orders` - Create order
- `PATCH /api/customer-orders/:id` - Update order
- `PATCH /api/customer-orders/:id/status` - Update status

### Operator Shifts
- `GET /api/operator-shifts` - Get all shifts
- `GET /api/operator-shifts/:id` - Get shift details
- `POST /api/operator-shifts` - Log shift
- `PATCH /api/operator-shifts/:id` - Update shift

### Dashboard
- `GET /api/dashboard/overview` - Dashboard overview
- `GET /api/dashboard/production-summary` - Production metrics
- `GET /api/dashboard/machine-utilization` - Machine stats
- `GET /api/dashboard/operator-performance` - Operator stats
- `GET /api/dashboard/inventory-usage` - Inventory stats
- `GET /api/dashboard/pending-alerts` - Active alerts

### Audit & Alerts
- `GET /api/dashboard/audit-logs` - Get audit logs
- `GET /api/dashboard/audit-logs/export/:format` - Export logs
- `GET /api/dashboard/alerts` - Get all alerts
- `PATCH /api/dashboard/alerts/:id/resolve` - Resolve alert

## Business Rules

1. **Work Order Validation**
   - Design must be approved before production
   - Machine must support all required thread colors
   - Machine capacity must accommodate the order

2. **Inventory Management**
   - Auto-deduct from inventory when work order starts
   - Trigger reorder alerts when stock < minimum level
   - Track consumption history

3. **Cost Calculation**
   - Formula: TotalCost = ThreadCost + MachineCost + LaborCost + Overhead
   - Machine cost: $50/hour
   - Labor cost: $15/hour
   - Overhead: 15% of subtotal

4. **Status Workflow**
   - Work Orders: Pending → In Progress → Completed → Delivered
   - Designs: Submitted → Reviewed → Approved/Rejected
   - Orders: Pending → In Progress → Completed → Delivered

5. **Access Control**
   - Admin: Full system access
   - Manager: Production & inventory management
   - Operator: View and update own shifts & work orders

## Environment Variables

### Backend (.env)
```
NODE_ENV=development
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=embroidery_management
DB_USER=postgres
DB_PASSWORD=password123
JWT_SECRET=your_secret_key
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760
LOG_LEVEL=info
```

### Frontend (.env)
```
REACT_APP_API_BASE_URL=http://localhost:5000
REACT_APP_ENV=development
```

## Database Schema

### Core Tables
- `users` - System users with roles
- `machines` - Embroidery machines
- `threads` - Thread inventory
- `inventory_items` - General inventory
- `designs` - Design files and approval
- `customer_orders` - Customer orders
- `work_orders` - Production work orders
- `operators_shifts` - Operator shift logs
- `costing_records` - Cost breakdowns
- `audit_logs` - System audit trail
- `alerts` - System alerts

## Testing

### API Testing with Curl

```bash
# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@embroidery.com","password":"admin123"}'

# Get work orders
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5000/api/work-orders
```

### Testing with Postman

Import the Postman collection from `docs/Embroidery_API.postman_collection.json`

## Troubleshooting

### Database Connection Issues
```bash
# Check PostgreSQL is running
psql -U postgres -d embroidery_management

# Verify schema
\dt
```

### Port Already in Use
```bash
# Change PORT in .env or:
PORT=5001 npm start
```

### Frontend API Connection Issues
- Check `REACT_APP_API_BASE_URL` in .env
- Verify backend is running
- Check CORS configuration

## Deployment

### Heroku Deployment

```bash
# Install Heroku CLI
heroku login

# Create app
heroku create your-app-name

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=your_secret

# Add PostgreSQL addon
heroku addons:create heroku-postgresql:hobby-dev

# Deploy
git push heroku main
```

### AWS/DigitalOcean Deployment

See `docs/DEPLOYMENT.md` for detailed instructions.

## Performance Optimization

- Database indexes on frequently queried fields
- Pagination for large data sets
- JWT token caching
- API response compression
- Frontend lazy loading

## Security Best Practices

- JWT token expiration
- Password hashing with bcrypt
- SQL injection prevention with parameterized queries
- CORS configuration
- Audit logging for compliance
- Input validation and sanitization

## Contributing

1. Create feature branch
2. Make changes
3. Test thoroughly
4. Submit pull request

## Support

For issues or questions, contact the development team or create an issue in the repository.

## License

MIT License - See LICENSE file for details.
