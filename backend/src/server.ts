import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';
import { config as loadEnv } from 'dotenv';

// Import routes
import authRoutes from './routes/auth';
import softwareRoutes from './routes/software';
import versionsRoutes from './routes/versions';
import tokensRoutes from './routes/tokens';
import usersRoutes from './routes/users';
import settingsRoutes from './routes/settings';
import auditLogsRoutes from './routes/audit-logs';
import rolesRoutes from './routes/roles';
import uploadRoutes from './routes/upload';

// Load environment variables
loadEnv();

const app = express();
// PORT configuration:
// - Development (localhost): Default to 5000
// - Production: Use PORT env var or NODE_PORT, or default to 3000 (MatBao compatible)
// - MatBao hosting uses 3000 or assigns a port automatically
const isProduction = process.env.NODE_ENV === 'production';
const defaultPort = isProduction ? '3000' : '5000';
const portString = process.env.PORT || process.env.NODE_PORT || defaultPort;
const PORT = parseInt(portString, 10);
const FRONTEND_URL = process.env.FRONTEND_URL || (isProduction ? 'https://wam.vuleits.com' : 'http://localhost:3000');

// Validate PORT is a valid number
if (isNaN(PORT) || PORT <= 0 || PORT > 65535) {
  console.error('❌ ERROR: PORT environment variable must be a valid port number (1-65535)');
  console.error(`   Current value: ${portString}`);
  console.error('   Please set PORT in your .env file or MatBao control panel');
  console.error('   Example: PORT=3000');
  process.exit(1);
}

// Middleware
app.use(morgan('dev'));

// CORS configuration - Allow multiple origins for development and production
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001', // Alternative frontend port
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001', // Alternative frontend port
  'http://192.168.1.52:3000', // Local network IP
  'https://wam.vuleits.com', // Production frontend
  FRONTEND_URL
].filter(Boolean); // Remove any undefined values

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, or server-side)
    if (!origin) return callback(null, true);
    
    // Normalize origin (remove trailing slash, convert to lowercase for comparison)
    const normalizedOrigin = origin.toLowerCase().replace(/\/$/, '');
    const normalizedAllowedOrigins = allowedOrigins.map(o => o.toLowerCase().replace(/\/$/, ''));
    
    // Check if the origin is in the allowed list (case-insensitive)
    if (normalizedAllowedOrigins.includes(normalizedOrigin)) {
      callback(null, origin); // Return the original origin for CORS header
    } else {
      console.log(`⚠️  CORS blocked origin: ${origin}`);
      console.log(`   Allowed origins are: ${allowedOrigins.join(', ')}`);
      // In development, be more permissive - allow localhost on any port
      if (process.env.NODE_ENV !== 'production' && 
          (origin.includes('localhost') || origin.includes('127.0.0.1'))) {
        console.log(`   ✅ Allowing ${origin} in development mode`);
        callback(null, origin);
      } else {
        console.error(`❌ CORS Error: ${origin} is not in allowed origins list`);
        callback(new Error('Not allowed by CORS'));
      }
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Length', 'X-Foo', 'X-Bar'],
  maxAge: 86400, // 24 hours
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Handle favicon requests - return 204 No Content to prevent redirects
app.get('/favicon.ico', (req, res) => {
  res.status(204).end();
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/software', softwareRoutes);
app.use('/api/versions', versionsRoutes);
app.use('/api/tokens', tokensRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/audit-logs', auditLogsRoutes);
app.use('/api/roles', rolesRoutes);
app.use('/api/upload', uploadRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  // Handle CORS errors specifically
  if (err.message === 'Not allowed by CORS') {
    console.error(`❌ CORS Error: Request from ${req.get('origin') || 'unknown origin'} blocked`);
    return res.status(403).json({ 
      error: 'CORS policy: Origin not allowed',
      origin: req.get('origin'),
      allowedOrigins: allowedOrigins
    });
  }
  
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Backend server running on http://localhost:${PORT}`);
  console.log(`📝 Frontend URL: ${FRONTEND_URL}`);
  console.log(`🌐 Allowed CORS origins: ${allowedOrigins.join(', ')}`);
  console.log(`✅ Server ready to accept connections`);
});

export default app;

