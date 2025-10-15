const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config();

// Import Supabase client
const { supabase } = require('./config/supabase');

// Import middleware
const { authenticateToken, optionalAuth } = require('./middleware/auth');
const jwtUtils = require('./utils/jwt');

// Import routes
const authRoutes = require('./routes/auth-simple'); // Using simple auth for now
const schoolRoutes = require('./routes/schools');
const highlightRoutes = require('./routes/highlights');
const assignmentRoutes = require('./routes/assignments');
const uploadRoutes = require('./routes/uploads');

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Initialize Socket.IO
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true
  }
});

// Store io instance in app for use in routes
app.set('io', io);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Auth specific rate limiting (stricter)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Increased for development/testing
  message: {
    error: 'Too many authentication attempts, please try again later.'
  }
});

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  },
  crossOriginEmbedderPolicy: false
}));

// CORS configuration
app.use(cors({
  origin: function (origin, callback) {
    // In development, allow ALL origins including file:// and null
    if (process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }
    
    // Allow requests with no origin (mobile apps, etc.)
    if (!origin) return callback(null, true);
    
    // Allow all localhost origins for development
    if (origin.startsWith('http://localhost:')) {
      return callback(null, true);
    }
    
    const allowedOrigins = [
      'https://quranakh.com',
      'https://www.quranakh.com'
    ];
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Request logging
app.use(morgan('combined'));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Apply rate limiting
app.use(limiter);
app.use('/auth', authLimiter);

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API routes
app.use('/auth', authRoutes);
app.use('/schools', schoolRoutes);
app.use('/highlights', highlightRoutes);
app.use('/assignments', assignmentRoutes);
app.use('/uploads', uploadRoutes);

// Socket.IO authentication middleware
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication error'));
    }

    const payload = jwtUtils.verifyAccessToken(token);

    const { data: user, error } = await supabase
      .from('profiles')
      .select(`
        user_id,
        school_id,
        role,
        display_name,
        email,
        schools (name)
      `)
      .eq('user_id', payload.userId)
      .single();

    if (error || !user) {
      return next(new Error('User not found'));
    }

    socket.user = {
      userId: user.user_id,
      schoolId: user.school_id,
      role: user.role,
      displayName: user.display_name,
      email: user.email,
      schoolName: user.schools?.name
    };

    next();
  } catch (error) {
    next(new Error('Authentication error'));
  }
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`User ${socket.user.displayName} connected from ${socket.user.schoolName}`);
  
  // Join user to their school room for real-time updates
  socket.join(`school_${socket.user.schoolId}`);
  
  // Join user-specific room
  socket.join(`user_${socket.user.userId}`);
  
  // Handle real-time highlight updates
  socket.on('highlight_updated', (data) => {
    // Broadcast to all users in the same school
    socket.to(`school_${socket.user.schoolId}`).emit('highlight_updated', {
      ...data,
      updated_by: {
        userId: socket.user.userId,
        displayName: socket.user.displayName,
        role: socket.user.role
      }
    });
  });
  
  // Handle assignment status updates
  socket.on('assignment_status_changed', (data) => {
    socket.to(`school_${socket.user.schoolId}`).emit('assignment_status_changed', {
      ...data,
      changed_by: {
        userId: socket.user.userId,
        displayName: socket.user.displayName,
        role: socket.user.role
      }
    });
  });

  // Handle new assignment notifications
  socket.on('assignment_created', (data) => {
    // Notify the student who was assigned
    if (data.student_id) {
      const { data: studentUser } = await supabase
        .from('students')
        .select('user_id')
        .eq('id', data.student_id)
        .single();
      
      if (studentUser) {
        socket.to(`user_${studentUser.user_id}`).emit('new_assignment', {
          ...data,
          created_by: {
            userId: socket.user.userId,
            displayName: socket.user.displayName,
            role: socket.user.role
          }
        });
      }
    }
  });

  // Handle voice note uploads for real-time feedback
  socket.on('voice_note_uploaded', (data) => {
    // Notify relevant users (student and parents)
    if (data.student_id) {
      // Get student user ID
      const { data: studentUser } = await supabase
        .from('students')
        .select('user_id')
        .eq('id', data.student_id)
        .single();
      
      if (studentUser) {
        socket.to(`user_${studentUser.user_id}`).emit('new_voice_note', {
          ...data,
          from_teacher: {
            userId: socket.user.userId,
            displayName: socket.user.displayName
          }
        });
        
        // Also notify parents
        const { data: parents } = await supabase
          .from('parent_students')
          .select('parents(user_id)')
          .eq('student_id', data.student_id);
        
        parents?.forEach(parent => {
          socket.to(`user_${parent.parents.user_id}`).emit('new_voice_note', {
            ...data,
            from_teacher: {
              userId: socket.user.userId,
              displayName: socket.user.displayName
            },
            for_child: true
          });
        });
      }
    }
  });

  // Handle typing indicators for collaborative features
  socket.on('typing_start', (data) => {
    socket.to(`school_${socket.user.schoolId}`).emit('user_typing', {
      userId: socket.user.userId,
      displayName: socket.user.displayName,
      context: data.context // e.g., 'highlight_notes', 'assignment_comment'
    });
  });

  socket.on('typing_stop', (data) => {
    socket.to(`school_${socket.user.schoolId}`).emit('user_stop_typing', {
      userId: socket.user.userId,
      context: data.context
    });
  });

  // Handle presence updates
  socket.on('user_active', () => {
    socket.to(`school_${socket.user.schoolId}`).emit('user_online', {
      userId: socket.user.userId,
      displayName: socket.user.displayName,
      role: socket.user.role
    });
  });

  socket.on('disconnect', (reason) => {
    console.log(`User ${socket.user.displayName} disconnected: ${reason}`);
    
    // Notify school that user went offline
    socket.to(`school_${socket.user.schoolId}`).emit('user_offline', {
      userId: socket.user.userId,
      displayName: socket.user.displayName,
      role: socket.user.role
    });
  });

  // Error handling
  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });
});

// API documentation endpoint
app.get('/api-docs', (req, res) => {
  res.json({
    name: 'QuranAkh Backend API',
    version: '1.0.0',
    description: 'Express.js backend for QuranAkh assignment gradebook PWA',
    endpoints: {
      auth: {
        'POST /auth/register': 'Register new user',
        'POST /auth/login': 'Login user',
        'POST /auth/refresh': 'Refresh access token',
        'POST /auth/logout': 'Logout user',
        'GET /auth/me': 'Get current user info'
      },
      schools: {
        'GET /schools/my': 'Get current user\'s school',
        'PUT /schools/my': 'Update school (admin/owner only)',
        'GET /schools/my/users': 'Get school users (admin/owner only)',
        'POST /schools/my/users': 'Create school user (admin/owner only)',
        'GET /schools/my/stats': 'Get school statistics (admin/owner only)'
      },
      highlights: {
        'GET /highlights': 'Get highlights with filtering',
        'GET /highlights/:id': 'Get specific highlight',
        'POST /highlights': 'Create highlight (teacher only)',
        'PUT /highlights/:id': 'Update highlight',
        'DELETE /highlights/:id': 'Delete highlight',
        'POST /highlights/:id/notes': 'Add note to highlight'
      },
      assignments: {
        'GET /assignments': 'Get assignments with filtering',
        'GET /assignments/:id': 'Get specific assignment',
        'POST /assignments': 'Create assignment (teacher only)',
        'PUT /assignments/:id': 'Update assignment',
        'POST /assignments/:id/transition': 'Change assignment status',
        'POST /assignments/:id/submit': 'Submit assignment (student only)',
        'POST /assignments/:id/grade': 'Grade assignment (teacher only)',
        'DELETE /assignments/:id': 'Delete assignment'
      },
      uploads: {
        'POST /uploads/voice-note': 'Upload voice note (teacher only)',
        'POST /uploads/assignment-attachments': 'Upload assignment attachments',
        'POST /uploads/profile-image': 'Upload profile image',
        'POST /uploads/school-logo': 'Upload school logo (admin/owner only)',
        'DELETE /uploads/:type/:filename': 'Delete uploaded file',
        'GET /uploads/info/:type/:filename': 'Get file information'
      }
    },
    socket_events: {
      client_to_server: [
        'highlight_updated',
        'assignment_status_changed',
        'assignment_created',
        'voice_note_uploaded',
        'typing_start',
        'typing_stop',
        'user_active'
      ],
      server_to_client: [
        'highlight_created',
        'highlight_updated',
        'highlight_deleted',
        'assignment_status_changed',
        'new_assignment',
        'new_voice_note',
        'user_typing',
        'user_stop_typing',
        'user_online',
        'user_offline'
      ]
    }
  });
});

// Catch-all for unmatched routes
app.all('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.path,
    method: req.method
  });
});

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);

  // Multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      error: 'File too large'
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: 'Invalid token'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: 'Token expired'
    });
  }

  // Database errors
  if (err.code === '23505') { // PostgreSQL unique violation
    return res.status(409).json({
      error: 'Duplicate entry'
    });
  }

  if (err.code === '23503') { // PostgreSQL foreign key violation
    return res.status(400).json({
      error: 'Invalid reference'
    });
  }

  // CORS errors
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({
      error: 'CORS policy violation'
    });
  }

  // Default error response
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
});

// Graceful shutdown handling
process.on('SIGINT', () => {
  console.log('\nReceived SIGINT. Gracefully shutting down...');
  
  server.close(() => {
    console.log('HTTP server closed');
    
    // Supabase client doesn't need explicit closing
    console.log('Shutting down gracefully');
    
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('Received SIGTERM. Gracefully shutting down...');
  
  server.close(() => {
    console.log('HTTP server closed');
    
    // Supabase client doesn't need explicit closing
    console.log('Shutting down gracefully');
    
    process.exit(0);
  });
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

// Start server
const PORT = process.env.PORT || 5001;

server.listen(PORT, () => {
  console.log(`🚀 QuranAkh Backend Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🗄️  Database: Supabase (PostgreSQL)`);
  console.log(`📁 Uploads directory: ${path.join(__dirname, 'uploads')}`);
  console.log(`🌐 CORS enabled for frontend`);
  console.log(`⚡ Socket.IO enabled for real-time updates`);
  console.log(`📖 API Documentation: http://localhost:${PORT}/api-docs`);
  console.log(`❤️  Health check: http://localhost:${PORT}/health`);
});

module.exports = { app, server, io };