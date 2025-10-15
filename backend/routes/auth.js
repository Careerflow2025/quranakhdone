const express = require('express');
const bcrypt = require('bcryptjs');
const Joi = require('joi');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();

const dbManager = require('../config/database');
const jwtUtils = require('../utils/jwt');
const { authenticateToken } = require('../middleware/auth');

// Validation schemas
const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  displayName: Joi.string().min(2).max(100).required(),
  role: Joi.string().valid('owner', 'admin', 'teacher', 'student', 'parent').required(),
  schoolId: Joi.string().when('role', {
    is: 'owner',
    then: Joi.optional(),
    otherwise: Joi.required()
  }),
  schoolName: Joi.string().when('role', {
    is: 'owner',
    then: Joi.required(),
    otherwise: Joi.optional()
  }),
  bio: Joi.string().when('role', {
    is: 'teacher',
    then: Joi.optional(),
    otherwise: Joi.forbidden()
  }),
  dob: Joi.date().when('role', {
    is: 'student',
    then: Joi.optional(),
    otherwise: Joi.forbidden()
  }),
  gender: Joi.string().valid('male', 'female').when('role', {
    is: 'student',
    then: Joi.optional(),
    otherwise: Joi.forbidden()
  })
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

const refreshSchema = Joi.object({
  refreshToken: Joi.string().required()
});

// POST /auth/register
router.post('/register', async (req, res) => {
  try {
    const { error, value } = registerSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.details.map(d => d.message)
      });
    }

    const { email, password, displayName, role, schoolId, schoolName, bio, dob, gender } = value;
    const db = dbManager.getDb();

    // Check if user already exists
    const existingUser = db.prepare('SELECT user_id FROM profiles WHERE email = ?').get(email);
    if (existingUser) {
      return res.status(409).json({
        error: 'User already exists with this email'
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);
    const userId = uuidv4();

    // Begin transaction
    const insertProfile = db.prepare(`
      INSERT INTO profiles (user_id, school_id, role, display_name, email, password_hash)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    let finalSchoolId = schoolId;

    // If owner role, create a new school
    if (role === 'owner') {
      const newSchoolId = uuidv4();
      const insertSchool = db.prepare(`
        INSERT INTO schools (id, name) VALUES (?, ?)
      `);
      insertSchool.run(newSchoolId, schoolName);
      finalSchoolId = newSchoolId;
    } else {
      // Verify school exists
      const school = db.prepare('SELECT id FROM schools WHERE id = ?').get(schoolId);
      if (!school) {
        return res.status(400).json({
          error: 'School not found'
        });
      }
    }

    // Insert profile
    insertProfile.run(userId, finalSchoolId, role, displayName, email, passwordHash);

    // Create role-specific records
    const roleId = uuidv4();
    switch (role) {
      case 'teacher':
        db.prepare(`
          INSERT INTO teachers (id, user_id, bio, active)
          VALUES (?, ?, ?, ?)
        `).run(roleId, userId, bio || null, 1);
        break;
      case 'student':
        db.prepare(`
          INSERT INTO students (id, user_id, dob, gender, active)
          VALUES (?, ?, ?, ?, ?)
        `).run(roleId, userId, dob || null, gender || null, 1);
        break;
      case 'parent':
        db.prepare(`
          INSERT INTO parents (id, user_id)
          VALUES (?, ?)
        `).run(roleId, userId);
        break;
    }

    // Generate tokens
    const userPayload = {
      userId,
      schoolId: finalSchoolId,
      role,
      displayName,
      email
    };

    const tokens = jwtUtils.generateTokenPair(userPayload);

    res.status(201).json({
      message: 'User registered successfully',
      user: userPayload,
      ...tokens
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      error: 'Registration failed',
      details: error.message
    });
  }
});

// POST /auth/login
router.post('/login', async (req, res) => {
  try {
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.details.map(d => d.message)
      });
    }

    const { email, password } = value;
    const db = dbManager.getDb();

    // Get user with school info
    const user = db.prepare(`
      SELECT 
        p.user_id,
        p.school_id,
        p.role,
        p.display_name,
        p.email,
        p.password_hash,
        s.name as school_name
      FROM profiles p
      LEFT JOIN schools s ON s.id = p.school_id
      WHERE p.email = ?
    `).get(email);

    if (!user) {
      return res.status(401).json({
        error: 'Invalid credentials'
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({
        error: 'Invalid credentials'
      });
    }

    // Generate tokens
    const userPayload = {
      userId: user.user_id,
      schoolId: user.school_id,
      role: user.role,
      displayName: user.display_name,
      email: user.email,
      schoolName: user.school_name
    };

    const tokens = jwtUtils.generateTokenPair(userPayload);

    res.json({
      message: 'Login successful',
      user: userPayload,
      ...tokens
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: 'Login failed',
      details: error.message
    });
  }
});

// POST /auth/refresh
router.post('/refresh', async (req, res) => {
  try {
    const { error, value } = refreshSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.details.map(d => d.message)
      });
    }

    const { refreshToken } = value;
    
    // Verify refresh token
    const payload = jwtUtils.verifyRefreshToken(refreshToken);
    const db = dbManager.getDb();

    // Get current user info
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
        error: 'User not found'
      });
    }

    // Generate new access token
    const userPayload = {
      userId: user.user_id,
      schoolId: user.school_id,
      role: user.role,
      displayName: user.display_name,
      email: user.email,
      schoolName: user.school_name
    };

    const accessToken = jwtUtils.generateAccessToken(userPayload);

    res.json({
      accessToken,
      expiresIn: jwtUtils.accessTokenExpiry,
      user: userPayload
    });

  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(401).json({
      error: 'Invalid or expired refresh token'
    });
  }
});

// POST /auth/logout
router.post('/logout', authenticateToken, (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const refreshToken = req.body.refreshToken;

    if (refreshToken) {
      // Revoke specific refresh token
      const payload = jwtUtils.verifyRefreshToken(refreshToken);
      jwtUtils.revokeRefreshToken(payload.tokenId);
    } else {
      // Revoke all refresh tokens for this user
      jwtUtils.revokeAllRefreshTokens(req.user.userId);
    }

    res.json({
      message: 'Logout successful'
    });

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      error: 'Logout failed'
    });
  }
});

// GET /auth/me
router.get('/me', authenticateToken, (req, res) => {
  res.json({
    user: req.user
  });
});

// Cleanup expired tokens periodically
setInterval(() => {
  jwtUtils.cleanupExpiredTokens();
}, 24 * 60 * 60 * 1000); // Run daily

module.exports = router;