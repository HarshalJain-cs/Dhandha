# Setup Guide - Jewellery ERP Desktop Software

## What's Been Completed (Day 1 Foundation)

### Backend Infrastructure
- Database connection module with Sequelize ORM
- Complete PostgreSQL schema (50+ tables)
- Core Sequelize models (User, Product, Customer)
- Authentication service with JWT
- IPC handlers for Electron main-renderer communication

### Frontend Structure
- React 18 + TypeScript setup
- Redux Toolkit for state management
- Ant Design UI components
- Login page with authentication
- Dashboard with basic layout
- Protected routes

### Configuration
- Docker Compose for PostgreSQL + pgAdmin
- TypeScript configuration
- Vite build configuration
- Webpack configuration for Electron
- Environment variables template

## Quick Start

### Prerequisites
Make sure you have installed:
- Node.js 18+ LTS
- PostgreSQL 15 (or use Docker)
- Docker Desktop (optional, recommended)
- Git

### Installation Steps

#### 1. Install Dependencies
```bash
npm install
```

#### 2. Start Database (Option A: Docker - Recommended)
```bash
docker-compose up -d
```

This will start:
- PostgreSQL on `localhost:5432`
- pgAdmin on `http://localhost:5050`

#### 2. Start Database (Option B: Manual PostgreSQL)
```bash
# Create database
createdb jewellery_erp

# The schema will be automatically applied on first run
```

#### 3. Configure Environment
```bash
# Copy the example environment file
cp .env.example .env

# Edit .env if needed (default values work with Docker setup)
```

#### 4. Run the Application

**Development Mode:**
```bash
# Terminal 1 - Start Vite dev server for React
npm run dev

# Terminal 2 - Start Electron
npm start
```

The application will:
1. Connect to the database
2. Run the schema automatically (first time only)
3. Initialize all models
4. Open the Electron window with login screen

#### 5. Login
Default credentials:
- **Username:** `admin`
- **Password:** `admin123`

**IMPORTANT:** Change the default password immediately after first login!

## Project Structure

```
Dhandha/
├── src/
│   ├── main/                    # Electron main process
│   │   ├── database/
│   │   │   ├── connection.ts   # Database connection
│   │   │   └── models/         # Sequelize models
│   │   ├── services/           # Business logic
│   │   │   └── authService.ts
│   │   ├── ipc/                # IPC handlers
│   │   │   ├── authHandlers.ts
│   │   │   └── index.ts
│   │   └── index.ts            # Main entry point
│   ├── preload/
│   │   └── index.ts            # Preload script (IPC bridge)
│   └── renderer/               # React frontend
│       ├── pages/
│       │   ├── Login.tsx
│       │   └── Dashboard.tsx
│       ├── components/
│       │   └── PrivateRoute.tsx
│       ├── store/              # Redux
│       │   ├── slices/
│       │   │   └── authSlice.ts
│       │   └── index.ts
│       ├── styles/
│       │   └── index.css
│       ├── App.tsx
│       └── index.tsx
├── database/
│   └── schema.sql              # Complete database schema
├── docker-compose.yml
├── package.json
├── tsconfig.json
├── vite.config.ts
├── forge.config.ts
└── .env.example
```

## Database Access

### Using pgAdmin (if using Docker)
1. Open `http://localhost:5050`
2. Login: `admin@admin.com` / `admin`
3. Add new server:
   - Host: `postgres`
   - Port: `5432`
   - Database: `jewellery_erp`
   - Username: `erp_admin`
   - Password: `jewellery2024`

### Using psql
```bash
psql -h localhost -U erp_admin -d jewellery_erp
# Password: jewellery2024
```

## Testing the Setup

1. **Database Connection:**
   - Run the app and check console logs
   - Should see "✓ Database connection established successfully"

2. **Login Functionality:**
   - Try logging in with default credentials
   - Should redirect to dashboard on success

3. **Token Persistence:**
   - Refresh the app after login
   - Should remain logged in (token in localStorage)

## Common Issues

### Issue: Database connection failed
**Solution:**
- Check if PostgreSQL is running: `docker ps` or `pg_ctl status`
- Verify credentials in `.env` match your database setup

### Issue: Schema not created
**Solution:**
- Delete the database and recreate: `dropdb jewellery_erp && createdb jewellery_erp`
- Restart the application

### Issue: Cannot login
**Solution:**
- Check if schema has the default admin user
- Run this SQL to verify: `SELECT * FROM users WHERE username = 'admin';`

### Issue: Port 5173 already in use
**Solution:**
- Kill the process using port 5173
- Or change the port in `vite.config.ts`

## Next Steps (Day 2-3)

### Backend Tasks
1. Create remaining models (Category, MetalType, Invoice, etc.)
2. Create product service and IPC handlers
3. Create customer service and IPC handlers
4. Add validation and error handling

### Frontend Tasks
1. Create Products page (list, add, edit, delete)
2. Create Customers page
3. Create Invoice/Billing page
4. Add form validation
5. Add loading states and error handling

### Additional Features
1. Settings page for user management
2. Password change functionality
3. Role-based access control
4. Audit logging

## Development Workflow

### Adding a New Feature
1. Create database model (if needed)
2. Create service in `src/main/services/`
3. Create IPC handlers in `src/main/ipc/`
4. Create Redux slice in `src/renderer/store/slices/`
5. Create React components/pages
6. Add routes to `App.tsx`
7. Update preload script to expose IPC methods

### Testing
```bash
npm test
```

### Building for Production
```bash
# Build the application
npm run build

# Package as executable
npm run make
```

## Team Collaboration

### Git Workflow
```bash
# Create feature branch
git checkout -b feature/product-management

# Make changes and commit
git add .
git commit -m "Add product management module"

# Push to remote
git push origin feature/product-management
```

### Code Review Checklist
- [ ] TypeScript types are properly defined
- [ ] Error handling is implemented
- [ ] IPC handlers have proper validation
- [ ] Redux actions are dispatched correctly
- [ ] UI components follow Ant Design patterns
- [ ] Database queries are optimized
- [ ] No sensitive data in console logs

## Support

For issues and questions:
- Check this guide first
- Review console logs for errors
- Check database logs: `docker logs dhandha_postgres_1`
- Create an issue in the repository

---

**Built with ❤️ for Jewellery Businesses**
