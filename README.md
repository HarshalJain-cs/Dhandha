# Jewellery ERP Desktop Software

Complete Inventory Management Desktop Software for Jewellery Business

## Tech Stack

- **Frontend**: React 18 + TypeScript + Ant Design
- **Backend**: Node.js + Express + Sequelize ORM
- **Database**: PostgreSQL 15
- **Desktop**: Electron
- **Hardware**: RFID, Barcode Scanner, Thermal Printer, Weighing Scale

## Features

- ✅ Complete Inventory Management (Products, Categories, Stock)
- ✅ Sales & Billing with GST Compliance
- ✅ Customer Management with Metal Account
- ✅ Bhav Cutting (Old Gold Exchange)
- ✅ Karigar (Goldsmith) Management
- ✅ Multi-Branch Support
- ✅ Accounting & Ledgers
- ✅ 40+ Reports (Sales, Inventory, GST)
- ✅ E-Invoice Integration (IRN, QR Code)
- ✅ Hardware Integration (RFID, Scale, Printer)
- ✅ User Management & RBAC
- ✅ Diamond & Stone Tracking

## Day 1 Setup (Quick Start)

### Prerequisites

- Node.js 18+ LTS
- PostgreSQL 15
- Docker (optional, for easy database setup)
- Git

### Installation Steps

#### 1. Clone & Install Dependencies

```bash
# Clone the repository
git clone <your-repo-url>
cd Dhandha

# Install dependencies
npm install
```

#### 2. Database Setup (Option A: Docker - Recommended)

```bash
# Start PostgreSQL using Docker Compose
docker-compose up -d

# Database will be available at:
# - PostgreSQL: localhost:5432
# - pgAdmin: http://localhost:5050
```

#### 2. Database Setup (Option B: Manual PostgreSQL)

```bash
# Create database
createdb jewellery_erp

# Run schema
psql -U postgres -d jewellery_erp -f database/schema.sql
```

#### 3. Configure Environment

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your settings
# (Database credentials are pre-configured for Docker setup)
```

#### 4. Run the Application

```bash
# Development mode
npm run dev

# Or start Electron app
npm start
```

### Default Login Credentials

- **Username**: `admin`
- **Password**: `admin123`

**⚠️ IMPORTANT**: Change the default password immediately after first login!

## Project Structure

```
Dhandha/
├── src/
│   ├── main/                 # Electron main process
│   │   ├── database/        # Database models & connection
│   │   ├── services/        # Business logic
│   │   ├── ipc/             # IPC handlers
│   │   └── hardware/        # Hardware integrations
│   └── renderer/            # React frontend
│       ├── pages/           # Page components
│       ├── components/      # Reusable components
│       ├── store/           # Redux state management
│       └── services/        # API services
├── database/
│   ├── schema.sql           # Complete database schema
│   ├── migrations/          # Database migrations
│   └── seeds/               # Seed data
└── docs/                    # Documentation
```

## Database Schema

The system includes 50+ tables covering:

- **Core**: Users, Roles, Permissions, Branches
- **Inventory**: Products, Categories, Metal Types, Stones
- **Sales**: Invoices, Invoice Items, Old Gold Transactions
- **Customers**: Customer Management, Metal Accounts
- **Karigar**: Goldsmith Orders, Metal Issue/Receive
- **Accounting**: Ledgers, Vouchers, Payments
- **System**: Settings, Notifications, Audit Logs

## Hardware Integration

### Supported Devices

1. **Barcode Scanner**: Zebra DS8178 (USB/Wireless)
2. **RFID Reader**: Zebra RFD90
3. **Thermal Printer**: Zebra GX430t
4. **Weighing Scale**: iScale i-32

### Configuration

Hardware configuration is in `.env` file. Set COM ports and connection settings as needed.

## Development Workflow

### Running Tests

```bash
npm test
```

### Build for Production

```bash
# Build application
npm run build

# Package for Windows
npm run make
```

### Code Quality

```bash
# Run linter
npm run lint

# Fix linting issues
npm run lint -- --fix
```

## Team Structure

This project is designed for a team of 4-5 developers:

1. **Backend Lead** - Database, APIs, Business Logic
2. **Frontend Lead** - React UI, State Management
3. **Integration Specialist** - Hardware, E-Invoice, Reports
4. **Full Stack** - Features across backend/frontend
5. **QA + DevOps** - Testing, Build, Deployment

## Timeline

- **Week 1-2**: Foundation & Core Modules (Auth, Inventory)
- **Week 3-4**: Core Inventory Module
- **Week 5-6**: Customer & Sales Module
- **Week 7**: Karigar Management
- **Week 8-9**: Accounting & Reports
- **Week 10-11**: Advanced Features (E-Invoice, Hardware)
- **Week 12**: Testing & Deployment

## Key Features Detail

### Inventory Management

- Product master with HUID, Hallmark details
- Category hierarchy
- Metal types with purity tracking
- Diamond & stone tracking with 4C's
- Real-time stock tracking
- RFID & Barcode support

### Billing

- GST-compliant invoicing
- Multiple making charge types (per gram, percentage, fixed, slab)
- Wastage calculation
- Old gold (Bhav cutting) exchange
- E-invoice generation (IRN, QR Code)
- Multiple payment modes

### Reporting

40+ Reports including:
- Sales reports (daily, category-wise, customer-wise)
- Stock reports (valuation, movement, low stock)
- GST reports (GSTR-1, GSTR-3B, HSN summary)
- Karigar reports (pending orders, wastage analysis)
- Accounting reports (trial balance, ledger, day book)

## License

MIT License - See LICENSE file for details

## Support

For issues and questions:
- Create an issue in the repository
- Email: support@jewellerysoftware.com

---

**Built with ❤️ for Jewellery Businesses**
