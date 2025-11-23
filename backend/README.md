# WebApp Manager - Backend API

Express.js REST API server for the WebApp Manager application.

## Tech Stack

- **Runtime:** Node.js 20+
- **Framework:** Express.js
- **Database:** MySQL
- **ORM:** Prisma
- **Language:** TypeScript

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Create a `.env` file in the backend directory:

```env
PORT=5000
NODE_ENV=development

# Database
DATABASE_URL="mysql://user:password@localhost:3306/webapp_manager"
DATABASE_URL_FALLBACK="mysql://user:password@localhost:3306/webapp_manager_fallback"

# CORS
FRONTEND_URL=http://localhost:3000
```

### 3. Database Setup

```bash
# Generate Prisma Client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# (Optional) Seed the database
npm run seed
```

### 4. Start Development Server

```bash
npm run dev
```

The API will be available at `http://localhost:5000`

## Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run prisma:generate` - Generate Prisma Client
- `npm run prisma:migrate` - Run database migrations
- `npm run prisma:studio` - Open Prisma Studio (database GUI)
- `npm run seed` - Seed the database with initial data
- `npm test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage

## Project Structure

```
backend/
├── src/
│   ├── routes/          # API route handlers
│   │   ├── auth.ts      # Authentication routes
│   │   ├── software.ts  # Software CRUD
│   │   ├── versions.ts  # Version management
│   │   ├── tokens.ts    # Token management
│   │   ├── users.ts     # User management
│   │   ├── settings.ts  # Settings
│   │   ├── audit-logs.ts # Audit logs
│   │   ├── roles.ts     # Role permissions
│   │   └── upload.ts    # File uploads
│   │
│   ├── lib/             # Shared utilities
│   │   ├── prisma.ts    # Prisma client
│   │   ├── password.ts  # Password hashing
│   │   ├── authorization.ts  # Permission system
│   │   └── prisma-constants.ts # Constants
│   │
│   ├── middleware/      # Express middleware
│   │   └── auth.ts      # Authentication middleware
│   │
│   ├── types/           # TypeScript types
│   │   └── session.ts   # Session types
│   │
│   └── server.ts        # Main server file
│
├── prisma/
│   ├── schema.prisma    # Database schema
│   ├── migrations/      # Database migrations
│   └── seed.ts          # Database seeder
│
├── database/            # SQL files
│   ├── README.md
│   └── *.sql
│
└── uploads/             # Uploaded files (created at runtime)
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user

### Software
- `GET /api/software` - List all software
- `POST /api/software` - Create software
- `GET /api/software/:id` - Get software by ID
- `PUT /api/software/:id` - Update software
- `DELETE /api/software/:id` - Delete software

### Versions
- `GET /api/versions` - List versions
- `POST /api/versions` - Create version
- `GET /api/versions/:id` - Get version
- `PUT /api/versions/:id` - Update version
- `DELETE /api/versions/:id` - Delete version

### Tokens
- `GET /api/tokens` - List tokens
- `POST /api/tokens` - Create token
- `GET /api/tokens/:id` - Get token
- `PUT /api/tokens/:id` - Update token
- `DELETE /api/tokens/:id` - Delete token
- `GET /api/tokens/validate/:token` - Validate token

### Users
- `GET /api/users` - List users
- `POST /api/users` - Create user
- `GET /api/users/:id` - Get user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user
- `GET /api/users/:id/permissions` - Get user permissions
- `POST /api/users/:id/permissions` - Add permission
- `DELETE /api/users/:id/permissions/:permissionId` - Remove permission

### Settings
- `GET /api/settings` - List settings
- `POST /api/settings` - Create/update setting
- `DELETE /api/settings/:id` - Delete setting

### Audit Logs
- `GET /api/audit-logs` - List audit logs
- `POST /api/audit-logs` - Create audit log
- `GET /api/audit-logs/:id` - Get audit log
- `DELETE /api/audit-logs/:id` - Delete audit log

### Roles
- `GET /api/roles/:role/permissions` - Get role permissions
- `POST /api/roles/:role/permissions` - Add role permission

### Upload
- `POST /api/upload` - Upload file

## Authentication

The API uses cookie-based session authentication:

1. Client sends credentials to `/api/auth/login`
2. Server validates and returns session cookie
3. Client includes cookie in subsequent requests
4. Protected routes verify session with `authMiddleware`

Session cookies expire after 5 minutes.

## Database Schema

See `prisma/schema.prisma` for the complete schema.

Main models:
- **User** - System users
- **Software** - Software catalog
- **Version** - Software versions
- **AccessToken** - Access tokens
- **AuditLog** - Activity logs
- **Settings** - App settings
- **RolePermission** - Role-based permissions
- **UserPermission** - User-specific permissions

## Error Handling

All routes include try-catch blocks and return appropriate HTTP status codes:

- `200` - Success
- `201` - Created
- `204` - No Content (delete)
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

## CORS

CORS is configured to allow requests from the frontend URL specified in `FRONTEND_URL` environment variable.

## File Uploads

Files are uploaded to `backend/uploads/` directory and served as static files at `/uploads/:filename`.

## Testing

Tests use Jest and can be run with:

```bash
npm test
```

## Production Deployment

1. Build the application:
   ```bash
   npm run build
   ```

2. Set production environment variables

3. Run migrations:
   ```bash
   npm run prisma:migrate
   ```

4. Start the server:
   ```bash
   npm start
   ```

## Troubleshooting

### Database Connection Issues
- Verify `DATABASE_URL` is correct
- Ensure MySQL is running
- Check firewall settings

### CORS Issues
- Verify `FRONTEND_URL` matches your frontend domain
- Check browser console for CORS errors

### Port Already in Use
- Change `PORT` in `.env`
- Or stop the process using port 5000

