# Quick Start Guide

Get your WebApp Manager up and running in 5 minutes!

## Prerequisites

- ✅ Node.js 20+ installed
- ✅ MySQL database running
- ✅ Git installed

## Step 1: Clone and Install

```bash
# Clone the repository
git clone <repository-url>
cd webapp-manager

# Install all dependencies (root, backend, and frontend)
npm run install:all
```

## Step 2: Configure Backend

```bash
cd backend

# Create .env file
echo "PORT=5000
NODE_ENV=development
DATABASE_URL='mysql://root:password@localhost:3306/webapp_manager'
FRONTEND_URL=http://localhost:3000" > .env

# Update DATABASE_URL with your actual MySQL credentials
```

## Step 3: Setup Database

```bash
# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Seed database with sample data
npm run seed
```

## Step 4: Configure Frontend

```bash
cd ../frontend

# Create .env.local file
echo "NEXT_PUBLIC_API_BASE_URL=http://localhost:5000" > .env.local
```

## Step 5: Start Development Servers

### Option A: Run Both Together (Recommended)

```bash
# From the root directory
cd ..
npm run dev
```

This will start:
- 🔹 Backend API on http://localhost:5000
- 🔹 Frontend app on http://localhost:3000

### Option B: Run Separately

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend (new terminal)
cd frontend
npm run dev
```

## Step 6: Access the Application

Open your browser and go to:
- 🌐 **Frontend:** http://localhost:3000
- 🔌 **Backend API:** http://localhost:5000
- 🗄️ **Database GUI:** Run `cd backend && npx prisma studio`

## Default Login Credentials

After seeding, you can login with:
- **Email:** admin@example.com
- **Password:** admin123

> ⚠️ Change these credentials in production!

## Verify Everything Works

1. ✅ Visit http://localhost:3000
2. ✅ Login with default credentials
3. ✅ Navigate through different pages
4. ✅ Create a software entry
5. ✅ Check backend logs for API calls

## Common Issues

### Backend Won't Start

```bash
# Check if port 5000 is already in use
# Windows:
netstat -ano | findstr :5000

# Kill the process if needed
taskkill /PID <process_id> /F
```

### Database Connection Error

```bash
# Verify MySQL is running
# Check DATABASE_URL credentials
# Ensure database exists or run:
mysql -u root -p
CREATE DATABASE webapp_manager;
```

### Frontend Can't Connect to Backend

```bash
# Verify backend is running on port 5000
# Check NEXT_PUBLIC_API_BASE_URL in frontend/.env.local
# Look for CORS errors in browser console
```

### Missing Dependencies

```bash
# Clean install everything
rm -rf node_modules backend/node_modules frontend/node_modules
npm run install:all
```

## Development Workflow

### Making Changes

**Backend Changes:**
- Edit files in `backend/src/`
- Server will auto-restart (using tsx watch)

**Frontend Changes:**
- Edit files in `frontend/src/`
- Page will hot-reload automatically

### Database Changes

```bash
cd backend

# Create a new migration
npx prisma migrate dev --name your_migration_name

# Reset database (⚠️ deletes all data)
npx prisma migrate reset

# View data in GUI
npx prisma studio
```

### Testing

```bash
# Backend tests
cd backend
npm test

# Frontend linting
cd frontend
npm run lint
```

## Production Build

```bash
# Build backend
cd backend
npm run build

# Build frontend
cd frontend
npm run build
```

## Next Steps

- 📖 Read [README.md](README.md) for detailed information
- 📖 Read [MIGRATION-GUIDE.md](MIGRATION-GUIDE.md) to understand the architecture
- 🔒 Change default passwords
- ⚙️ Configure environment variables for production
- 🚀 Set up deployment pipelines

## Helpful Commands

```bash
# View all available scripts
npm run

# Backend Prisma commands
cd backend
npx prisma studio        # Database GUI
npx prisma format        # Format schema
npx prisma validate      # Validate schema

# Frontend Next.js commands
cd frontend
npm run build            # Production build
npm run start            # Start production server
```

## Getting Help

- Check the console logs for errors
- Review [README.md](README.md) for detailed docs
- Check [MIGRATION-GUIDE.md](MIGRATION-GUIDE.md) for architecture details
- Look at the code - it's well commented!

## Project Structure Overview

```
webapp-manager/
├── backend/          # Express API (Port 5000)
│   ├── src/         # Source code
│   ├── prisma/      # Database schema
│   └── package.json
│
├── frontend/         # Next.js App (Port 3000)
│   ├── src/         # Source code
│   ├── public/      # Static files
│   └── package.json
│
└── package.json      # Root scripts
```

Happy coding! 🚀

