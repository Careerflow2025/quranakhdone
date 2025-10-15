# QuranAkh Backend Installation Guide

This guide provides complete installation instructions for the QuranAkh Express.js backend.

## System Requirements

- **Node.js**: Version 18.0 or higher
- **npm**: Version 8.0 or higher (comes with Node.js)
- **Operating System**: Windows, macOS, or Linux

## Database Options

The backend supports two SQLite configurations:

### Option 1: better-sqlite3 (Recommended for production)
- **Pros**: Synchronous, faster, more reliable
- **Cons**: Requires compilation (C++ toolchain)

### Option 2: sqlite3 (Recommended for development/Windows)
- **Pros**: No compilation required, works on all systems
- **Cons**: Asynchronous, slightly slower

## Installation Instructions

### Windows Installation (Recommended: Option 2)

If you're on Windows and encounter compilation errors with better-sqlite3, use sqlite3:

1. **Replace package.json**:
```bash
mv package.json package-better-sqlite3.json
mv package-sqlite3.json package.json
```

2. **Update database import**:
```bash
mv config/database.js config/database-better-sqlite3.js
mv config/database-sqlite3.js config/database.js
```

3. **Install dependencies**:
```bash
npm install
```

### Linux/macOS Installation (Option 1 or 2)

Try Option 1 first, fallback to Option 2 if needed:

**Option 1 (better-sqlite3):**
```bash
npm install
```

**If Option 1 fails, use Option 2:**
```bash
# Switch to sqlite3 version
mv package.json package-better-sqlite3.json
mv package-sqlite3.json package.json
mv config/database.js config/database-better-sqlite3.js
mv config/database-sqlite3.js config/database.js

# Install dependencies
npm install
```

## Environment Configuration

1. **Copy environment template**:
```bash
cp .env .env.local
```

2. **Edit .env file**:
```env
PORT=5000
JWT_SECRET=your_super_secure_jwt_secret_key_at_least_32_characters_long
JWT_EXPIRE=24h
JWT_REFRESH_EXPIRE=7d
NODE_ENV=development
UPLOAD_DIR=uploads
MAX_FILE_SIZE=5242880
CLIENT_URL=http://localhost:3000
```

3. **Generate secure JWT secret**:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Starting the Server

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

The server will start on `http://localhost:5000` by default.

## Verification

### Check Server Health
```bash
curl http://localhost:5000/health
```

### Check API Documentation
Visit: `http://localhost:5000/api-docs`

### Test Database Connection
The server logs will show:
```
🗄️  Database: SQLite (/path/to/db/quranakh.db)
Database initialized successfully
```

## Directory Structure After Installation

```
backend/
├── config/
│   ├── database.js              # Active database configuration
│   ├── database-sqlite3.js      # Alternative sqlite3 version
│   └── database-better-sqlite3.js # Alternative better-sqlite3 version
├── middleware/
│   ├── auth.js                  # JWT authentication
│   └── roleCheck.js             # Role-based access control
├── routes/
│   ├── auth.js                  # Authentication endpoints
│   ├── schools.js               # School management
│   ├── highlights.js            # Quran highlights
│   ├── assignments.js           # Assignment management
│   └── uploads.js               # File upload handling
├── utils/
│   └── jwt.js                   # JWT utilities
├── uploads/                     # File upload storage
├── db/                          # SQLite database files
├── node_modules/                # Dependencies
├── package.json                 # Active package configuration
├── package-sqlite3.json         # Alternative package file
├── package-better-sqlite3.json  # Alternative package file
├── .env                         # Environment variables
├── server.js                    # Main application
├── start.js                     # Startup script with clustering
└── README.md                    # Documentation
```

## Troubleshooting

### better-sqlite3 Compilation Errors

**Error**: `gyp ERR! build error` or `prebuild-install warn`

**Solution**: Switch to sqlite3 version:
```bash
mv package.json package-better-sqlite3.json
mv package-sqlite3.json package.json
mv config/database.js config/database-better-sqlite3.js  
mv config/database-sqlite3.js config/database.js
npm install
```

### Port Already in Use

**Error**: `EADDRINUSE: address already in use :::5000`

**Solution**: Change port in .env file:
```env
PORT=5001
```

### Database Permission Errors

**Error**: `SQLITE_CANTOPEN` or permission denied

**Solution**: Ensure write permissions to db directory:
```bash
chmod 755 db/
chmod 664 db/quranakh.db  # if exists
```

### File Upload Errors

**Error**: `ENOENT: no such file or directory, open 'uploads/...'`

**Solution**: Ensure upload directories exist:
```bash
mkdir -p uploads/{voice-notes,attachments,profiles,school-logos}
```

## API Testing

### Register First User (School Owner)
```bash
curl -X POST http://localhost:5000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@school.com",
    "password": "password123",
    "displayName": "School Admin",
    "role": "owner",
    "schoolName": "My Quran School"
  }'
```

### Login and Test Authentication
```bash
curl -X POST http://localhost:5000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@school.com",
    "password": "password123"
  }'
```

### Test Socket.IO Connection
```javascript
// In browser console or Node.js
const io = require('socket.io-client');
const socket = io('http://localhost:5000', {
  auth: {
    token: 'your_jwt_token_here'
  }
});

socket.on('connect', () => {
  console.log('Connected to server');
});
```

## Production Deployment

### Environment Variables
```env
NODE_ENV=production
JWT_SECRET=your_production_secret_key
PORT=5000
CLIENT_URL=https://your-frontend-domain.com
```

### Process Management (PM2)
```bash
npm install -g pm2
pm2 start start.js --name quranakh-backend
pm2 startup
pm2 save
```

### Reverse Proxy (nginx)
```nginx
server {
    listen 80;
    server_name api.your-domain.com;
    
    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Static file serving for uploads
    location /uploads/ {
        alias /path/to/your/backend/uploads/;
        expires 30d;
        add_header Cache-Control "public, no-transform";
    }
}
```

## Support

For issues and questions:
1. Check this installation guide
2. Review server logs for specific errors
3. Check API documentation at `/api-docs`
4. Verify environment configuration
5. Test with curl commands provided above

The backend is now ready to serve the QuranAkh frontend application!