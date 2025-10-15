const jwtUtils = require('../utils/jwt');
const dbManager = require('../config/database');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ 
      error: 'Access token required',
      code: 'TOKEN_MISSING'
    });
  }

  try {
    const payload = jwtUtils.verifyAccessToken(token);
    
    // Get user profile from database
    const db = dbManager.getDb();
    const user = db.prepare(`
      SELECT 
        p.user_id,
        p.school_id,
        p.role,
        p.display_name,
        p.email,
        s.name as school_name
      FROM profiles p
      LEFT JOIN schools s ON s.id = p.school_id
      WHERE p.user_id = ?
    `).get(payload.userId);

    if (!user) {
      return res.status(401).json({ 
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    // Attach user info to request
    req.user = {
      userId: user.user_id,
      schoolId: user.school_id,
      role: user.role,
      displayName: user.display_name,
      email: user.email,
      schoolName: user.school_name
    };

    next();
  } catch (error) {
    return res.status(403).json({ 
      error: 'Invalid or expired token',
      code: 'TOKEN_INVALID'
    });
  }
};

const optionalAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const payload = jwtUtils.verifyAccessToken(token);
    const db = dbManager.getDb();
    const user = db.prepare(`
      SELECT 
        p.user_id,
        p.school_id,
        p.role,
        p.display_name,
        p.email,
        s.name as school_name
      FROM profiles p
      LEFT JOIN schools s ON s.id = p.school_id
      WHERE p.user_id = ?
    `).get(payload.userId);

    req.user = user ? {
      userId: user.user_id,
      schoolId: user.school_id,
      role: user.role,
      displayName: user.display_name,
      email: user.email,
      schoolName: user.school_name
    } : null;
  } catch (error) {
    req.user = null;
  }

  next();
};

module.exports = {
  authenticateToken,
  optionalAuth
};