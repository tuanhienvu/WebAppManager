# WebApp Manager

A full-stack web application for managing software versions, access tokens, and user permissions with role-based access control.

## 🏗️ Architecture

This is a **split frontend/backend** application:

- **Backend:** Express.js REST API (Port 5000)
- **Frontend:** Next.js React Application (Port 3000)
- **Database:** SQLite (Development) / MySQL (Production)

```
webapp-manager/
├── backend/          # Express.js API Server
├── frontend/         # Next.js React App
└── package.json      # Monorepo scripts
```

## ⚡ Quick Start

### Prerequisites

- Node.js >= 20.19.5
- npm >= 10.8.0

### Installation & Setup

```bash
# 1. Install all dependencies
npm run install:all

# 2. Configure backend environment
# Edit backend/.env with your database credentials
cp backend/.env.example backend/.env

# 3. Run database migrations
cd backend
npx prisma migrate dev
npm run seed

# 4. Start development servers
cd ..
npm run dev
```

**Access the application:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000


### Build
```bash
npm run build            # Build both projects
npm run build:backend    # Build backend only
npm run build:frontend   # Build frontend only
```

### Production
```bash
npm start                # Start both servers (production)
npm run start:backend    # Start backend only
npm run start:frontend   # Start frontend only
```

### Maintenance
```bash
npm run install:all      # Install all dependencies
npm run clean            # Clean all build artifacts
```

## 🎯 Features

### Core Functionality
- ✅ Software catalog management
- ✅ Version tracking and management
- ✅ Access token generation and validation
- ✅ Audit logging for security
- ✅ User management with role-based access
- ✅ Settings and configuration management
- ✅ File upload support
- ✅ Multi-language support (EN/VI)

## 🛠️ Tech Stack

### Backend
- **Runtime:** Node.js 20+
- **Framework:** Express.js
- **Database:** Prisma ORM (SQLite/MySQL)
- **Auth:** bcryptjs, cookie-based sessions
- **Language:** TypeScript

### Frontend
- **Framework:** Next.js 16
- **UI:** React 19
- **Styling:** Tailwind CSS 4
- **Language:** TypeScript
- **Icons:** React Icons

## 📁 Project Structure

### Backend (`backend/`)
```
backend/
├── src/
│   ├── routes/        # API endpoints
│   ├── lib/           # Utilities (auth, database, etc.)
│   ├── middleware/    # Express middleware
│   ├── types/         # TypeScript types
│   └── server.ts      # Main server file
├── prisma/
│   ├── schema.prisma  # Database schema
│   ├── migrations/    # Database migrations
│   └── seed.ts        # Database seeder
└── uploads/           # Uploaded files
```

### Frontend (`frontend/`)
```
frontend/
├── src/
│   ├── pages/         # Next.js pages
│   ├── components/    # React components
│   ├── contexts/      # React contexts
│   ├── hooks/         # Custom hooks
│   ├── lib/           # Utilities
│   └── styles/        # CSS styles
└── public/            # Static assets
```

## 🔧 Configuration


## 🚀 Deployment

### Backend Deployment
```bash
cd backend
npm run build
npm start
```

Deploy to: Heroku, AWS, DigitalOcean, Railway, Render

### Frontend Deployment
```bash
cd frontend
npm run build
npm start
```

Deploy to: Vercel, Netlify, AWS Amplify

### Environment Variables
Remember to set production environment variables:
- Backend: `DATABASE_URL`, `FRONTEND_URL`
- Frontend: `NEXT_PUBLIC_API_BASE_URL`


## 🗄️ Database Management

### Prisma Commands
```bash
cd backend

# View database in GUI
npx prisma studio

# Create new migration
npx prisma migrate dev --name migration_name

# Reset database
npx prisma migrate reset

# Seed database
npm run seed
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

Private - All rights reserved

## 🆘 Support

For issues or questions:
- Check the documentation files
- Review the code comments
- Open an issue on the repository

---

**Built with ❤️ using Next.js, Express, and Prisma**
