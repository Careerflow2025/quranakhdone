const express = require('express');
const Joi = require('joi');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();

const dbManager = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { requireOwnerOrAdmin, checkSchoolAccess } = require('../middleware/roleCheck');

// Validation schemas
const updateSchoolSchema = Joi.object({
  name: Joi.string().min(2).max(200).optional(),
  logo_url: Joi.string().uri().optional(),
  timezone: Joi.string().optional()
});

const createUserSchema = Joi.object({
  email: Joi.string().email().required(),
  displayName: Joi.string().min(2).max(100).required(),
  role: Joi.string().valid('admin', 'teacher', 'student', 'parent').required(),
  password: Joi.string().min(8).required(),
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

// GET /schools/my - Get current user's school info
router.get('/my', authenticateToken, (req, res) => {
  try {
    const db = dbManager.getDb();
    
    const school = db.prepare(`
      SELECT 
        s.*,
        COUNT(DISTINCT p.user_id) as total_users,
        COUNT(DISTINCT CASE WHEN p.role = 'teacher' THEN p.user_id END) as total_teachers,
        COUNT(DISTINCT CASE WHEN p.role = 'student' THEN p.user_id END) as total_students,
        COUNT(DISTINCT CASE WHEN p.role = 'parent' THEN p.user_id END) as total_parents
      FROM schools s
      LEFT JOIN profiles p ON p.school_id = s.id
      WHERE s.id = ?
      GROUP BY s.id
    `).get(req.user.schoolId);

    if (!school) {
      return res.status(404).json({
        error: 'School not found'
      });
    }

    res.json({ school });

  } catch (error) {
    console.error('Error fetching school:', error);
    res.status(500).json({
      error: 'Failed to fetch school information'
    });
  }
});

// PUT /schools/my - Update current user's school
router.put('/my', authenticateToken, requireOwnerOrAdmin, (req, res) => {
  try {
    const { error, value } = updateSchoolSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.details.map(d => d.message)
      });
    }

    const db = dbManager.getDb();
    const updates = [];
    const params = [];

    Object.entries(value).forEach(([key, val]) => {
      updates.push(`${key} = ?`);
      params.push(val);
    });

    if (updates.length === 0) {
      return res.status(400).json({
        error: 'No valid fields to update'
      });
    }

    params.push(req.user.schoolId);
    
    const updateQuery = `
      UPDATE schools 
      SET ${updates.join(', ')} 
      WHERE id = ?
    `;

    const result = db.prepare(updateQuery).run(...params);

    if (result.changes === 0) {
      return res.status(404).json({
        error: 'School not found'
      });
    }

    // Return updated school
    const updatedSchool = db.prepare('SELECT * FROM schools WHERE id = ?').get(req.user.schoolId);

    res.json({
      message: 'School updated successfully',
      school: updatedSchool
    });

  } catch (error) {
    console.error('Error updating school:', error);
    res.status(500).json({
      error: 'Failed to update school'
    });
  }
});

// GET /schools/my/users - Get all users in current school
router.get('/my/users', authenticateToken, requireOwnerOrAdmin, (req, res) => {
  try {
    const db = dbManager.getDb();
    const { role, active, page = 1, limit = 50 } = req.query;
    
    let whereClause = 'WHERE p.school_id = ?';
    const params = [req.user.schoolId];
    
    if (role && ['admin', 'teacher', 'student', 'parent'].includes(role)) {
      whereClause += ' AND p.role = ?';
      params.push(role);
    }

    if (active !== undefined) {
      whereClause += ' AND COALESCE(t.active, s.active, 1) = ?';
      params.push(active === 'true' ? 1 : 0);
    }

    const offset = (page - 1) * limit;
    
    const users = db.prepare(`
      SELECT 
        p.user_id,
        p.role,
        p.display_name,
        p.email,
        p.created_at,
        t.bio,
        t.active as teacher_active,
        s.dob,
        s.gender,
        s.active as student_active
      FROM profiles p
      LEFT JOIN teachers t ON t.user_id = p.user_id
      LEFT JOIN students s ON s.user_id = p.user_id
      ${whereClause}
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?
    `).all(...params, limit, offset);

    const totalCount = db.prepare(`
      SELECT COUNT(*) as count
      FROM profiles p
      LEFT JOIN teachers t ON t.user_id = p.user_id
      LEFT JOIN students s ON s.user_id = p.user_id
      ${whereClause}
    `).get(...params).count;

    res.json({
      users: users.map(user => ({
        ...user,
        active: user.teacher_active !== null ? user.teacher_active : 
               user.student_active !== null ? user.student_active : true
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      error: 'Failed to fetch users'
    });
  }
});

// POST /schools/my/users - Create new user in current school
router.post('/my/users', authenticateToken, requireOwnerOrAdmin, async (req, res) => {
  try {
    const { error, value } = createUserSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.details.map(d => d.message)
      });
    }

    const { email, displayName, role, password, bio, dob, gender } = value;
    const db = dbManager.getDb();

    // Check if user already exists
    const existingUser = db.prepare('SELECT user_id FROM profiles WHERE email = ?').get(email);
    if (existingUser) {
      return res.status(409).json({
        error: 'User already exists with this email'
      });
    }

    const bcrypt = require('bcryptjs');
    const passwordHash = await bcrypt.hash(password, 12);
    const userId = uuidv4();

    // Insert profile
    db.prepare(`
      INSERT INTO profiles (user_id, school_id, role, display_name, email, password_hash)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(userId, req.user.schoolId, role, displayName, email, passwordHash);

    // Create role-specific record
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

    // Return created user (without password)
    const newUser = db.prepare(`
      SELECT 
        p.user_id,
        p.role,
        p.display_name,
        p.email,
        p.created_at,
        t.bio,
        s.dob,
        s.gender
      FROM profiles p
      LEFT JOIN teachers t ON t.user_id = p.user_id
      LEFT JOIN students s ON s.user_id = p.user_id
      WHERE p.user_id = ?
    `).get(userId);

    res.status(201).json({
      message: 'User created successfully',
      user: newUser
    });

  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({
      error: 'Failed to create user'
    });
  }
});

// GET /schools/my/stats - Get school statistics
router.get('/my/stats', authenticateToken, requireOwnerOrAdmin, (req, res) => {
  try {
    const db = dbManager.getDb();
    
    const stats = db.prepare(`
      SELECT 
        COUNT(DISTINCT p.user_id) as total_users,
        COUNT(DISTINCT CASE WHEN p.role = 'teacher' THEN p.user_id END) as teachers,
        COUNT(DISTINCT CASE WHEN p.role = 'student' THEN p.user_id END) as students,
        COUNT(DISTINCT CASE WHEN p.role = 'parent' THEN p.user_id END) as parents,
        COUNT(DISTINCT c.id) as classes,
        COUNT(DISTINCT a.id) as assignments,
        COUNT(DISTINCT h.id) as highlights
      FROM profiles p
      LEFT JOIN classes c ON c.school_id = p.school_id
      LEFT JOIN assignments a ON a.school_id = p.school_id
      LEFT JOIN highlights h ON h.school_id = p.school_id
      WHERE p.school_id = ?
      GROUP BY p.school_id
    `).get(req.user.schoolId);

    const recentActivity = db.prepare(`
      SELECT 
        'assignment' as type,
        a.title as description,
        a.created_at
      FROM assignments a
      WHERE a.school_id = ?
      UNION ALL
      SELECT 
        'highlight' as type,
        'New highlight added' as description,
        h.created_at
      FROM highlights h
      WHERE h.school_id = ?
      ORDER BY created_at DESC
      LIMIT 10
    `).all(req.user.schoolId, req.user.schoolId);

    res.json({
      stats: stats || {
        total_users: 0,
        teachers: 0,
        students: 0,
        parents: 0,
        classes: 0,
        assignments: 0,
        highlights: 0
      },
      recent_activity: recentActivity
    });

  } catch (error) {
    console.error('Error fetching school stats:', error);
    res.status(500).json({
      error: 'Failed to fetch school statistics'
    });
  }
});

module.exports = router;