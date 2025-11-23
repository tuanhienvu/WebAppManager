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
const PORT = process.env.PORT || 5000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// Middleware
app.use(morgan('dev'));

// CORS configuration - Allow multiple origins for development and production
const allowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://192.168.1.52:3000', // Local network IP
  'https://wam.vuleits.com', // Production frontend
  FRONTEND_URL
].filter(Boolean); // Remove any undefined values

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, or server-side)
    if (!origin) return callback(null, true);
    
    // Check if the origin is in the allowed list
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, origin); // Return the specific origin, not just 'true'
    } else {
      console.log(`⚠️  CORS blocked origin: ${origin}`);
      console.log(`   Allowed origins are: ${allowedOrigins.join(', ')}`);
      // In development, be more permissive - allow localhost on any port
      if (process.env.NODE_ENV !== 'production' && 
          (origin.includes('localhost') || origin.includes('127.0.0.1'))) {
        console.log(`   ✅ Allowing ${origin} in development mode`);
        callback(null, origin);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

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
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Backend server running on http://localhost:${PORT}`);
  console.log(`📝 Frontend URL: ${FRONTEND_URL}`);
});

export default app;

