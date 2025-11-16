const express = require('express');
const Joi = require('joi');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();

const dbManager = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { requireTeacher, checkResourceOwnership } = require('../middleware/roleCheck');

// Validation schemas
const createHighlightSchema = Joi.object({
  student_id: Joi.string().required(),
  script_id: Joi.string().required(),
  ayah_id: Joi.string().required(),
  token_start: Joi.number().integer().min(0).required(),
  token_end: Joi.number().integer().min(0).required(),
  mistake_type: Joi.string().valid('recap', 'tajweed', 'haraka', 'letter').required(),
  color: Joi.string().optional(),
  note: Joi.object({
    type: Joi.string().valid('text', 'audio').required(),
    text: Joi.when('type', { is: 'text', then: Joi.string().required(), otherwise: Joi.forbidden() }),
    audio_url: Joi.when('type', { is: 'audio', then: Joi.string().uri().required(), otherwise: Joi.forbidden() })
  }).optional()
});

const updateHighlightSchema = Joi.object({
  mistake_type: Joi.string().valid('recap', 'tajweed', 'haraka', 'letter').optional(),
  color: Joi.string().optional()
});

const createNoteSchema = Joi.object({
  type: Joi.string().valid('text', 'audio').required(),
  text: Joi.when('type', { is: 'text', then: Joi.string().required(), otherwise: Joi.forbidden() }),
  audio_url: Joi.when('type', { is: 'audio', then: Joi.string().uri().required(), otherwise: Joi.forbidden() })
});

// Color mapping for mistake types
const MISTAKE_COLORS = {
  recap: 'purple',
  tajweed: 'orange', 
  haraka: 'red',
  letter: 'brown'
};

// GET /highlights - Get highlights with filtering
router.get('/', authenticateToken, (req, res) => {
  try {
    const db = dbManager.getDb();
    const { 
      student_id, 
      ayah_id, 
      script_id,
      mistake_type,
      surah,
      page = 1, 
      limit = 50 
    } = req.query;

    let whereClause = 'WHERE h.school_id = ?';
    const params = [req.user.schoolId];

    // Role-based filtering
    if (req.user.role === 'student') {
      // Students can only see their own highlights
      whereClause += ' AND s.user_id = ?';
      params.push(req.user.userId);
    } else if (req.user.role === 'teacher') {
      // Teachers can see highlights they created
      whereClause += ' AND t.user_id = ?';
      params.push(req.user.userId);
    } else if (req.user.role === 'parent') {
      // Parents can see their children's highlights
      whereClause += ` AND h.student_id IN (
        SELECT ps.student_id FROM parents p
        JOIN parent_students ps ON ps.parent_id = p.id
        WHERE p.user_id = ?
      )`;
      params.push(req.user.userId);
    }

    // Apply filters
    if (student_id) {
      whereClause += ' AND h.student_id = ?';
      params.push(student_id);
    }
    
    if (ayah_id) {
      whereClause += ' AND h.ayah_id = ?';
      params.push(ayah_id);
    }
    
    if (script_id) {
      whereClause += ' AND h.script_id = ?';
      params.push(script_id);
    }
    
    if (mistake_type) {
      whereClause += ' AND h.mistake_type = ?';
      params.push(mistake_type);
    }

    if (surah) {
      whereClause += ' AND qa.surah = ?';
      params.push(surah);
    }

    const offset = (page - 1) * limit;

    const highlights = db.prepare(`
      SELECT 
        h.*,
        t.id as teacher_id,
        tp.display_name as teacher_name,
        s.id as student_internal_id,
        sp.display_name as student_name,
        qa.surah,
        qa.ayah,
        qa.text as ayah_text,
        qs.display_name as script_name,
        COUNT(n.id) as notes_count
      FROM highlights h
      LEFT JOIN teachers t ON t.id = h.teacher_id
      LEFT JOIN profiles tp ON tp.user_id = t.user_id
      LEFT JOIN students s ON s.id = h.student_id  
      LEFT JOIN profiles sp ON sp.user_id = s.user_id
      LEFT JOIN quran_ayahs qa ON qa.id = h.ayah_id
      LEFT JOIN quran_scripts qs ON qs.id = h.script_id
      LEFT JOIN notes n ON n.highlight_id = h.id
      ${whereClause}
      GROUP BY h.id
      ORDER BY h.created_at DESC
      LIMIT ? OFFSET ?
    `).all(...params, limit, offset);

    const totalCount = db.prepare(`
      SELECT COUNT(DISTINCT h.id) as count
      FROM highlights h
      LEFT JOIN teachers t ON t.id = h.teacher_id
      LEFT JOIN students s ON s.id = h.student_id
      LEFT JOIN quran_ayahs qa ON qa.id = h.ayah_id
      ${whereClause}
    `).get(...params).count;

    res.json({
      highlights,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching highlights:', error);
    res.status(500).json({
      error: 'Failed to fetch highlights'
    });
  }
});

// GET /highlights/:id - Get specific highlight with notes
router.get('/:id', authenticateToken, (req, res) => {
  try {
    const db = dbManager.getDb();
    const highlightId = req.params.id;

    const highlight = db.prepare(`
      SELECT 
        h.*,
        t.id as teacher_id,
        tp.display_name as teacher_name,
        s.id as student_internal_id,
        sp.display_name as student_name,
        qa.surah,
        qa.ayah,
        qa.text as ayah_text,
        qs.display_name as script_name
      FROM highlights h
      LEFT JOIN teachers t ON t.id = h.teacher_id
      LEFT JOIN profiles tp ON tp.user_id = t.user_id
      LEFT JOIN students s ON s.id = h.student_id
      LEFT JOIN profiles sp ON sp.user_id = s.user_id
      LEFT JOIN quran_ayahs qa ON qa.id = h.ayah_id
      LEFT JOIN quran_scripts qs ON qs.id = h.script_id
      WHERE h.id = ? AND h.school_id = ?
    `).get(highlightId, req.user.schoolId);

    if (!highlight) {
      return res.status(404).json({
        error: 'Highlight not found'
      });
    }

    // Check access permissions
    const hasAccess = 
      req.user.role === 'owner' || 
      req.user.role === 'admin' ||
      (req.user.role === 'teacher' && highlight.teacher_id && db.prepare('SELECT id FROM teachers WHERE id = ? AND user_id = ?').get(highlight.teacher_id, req.user.userId)) ||
      (req.user.role === 'student' && db.prepare('SELECT id FROM students WHERE id = ? AND user_id = ?').get(highlight.student_internal_id, req.user.userId)) ||
      (req.user.role === 'parent' && db.prepare(`
        SELECT ps.student_id FROM parents p
        JOIN parent_students ps ON ps.parent_id = p.id
        WHERE p.user_id = ? AND ps.student_id = ?
      `).get(req.user.userId, highlight.student_internal_id));

    if (!hasAccess) {
      return res.status(403).json({
        error: 'Access denied to this highlight'
      });
    }

    // Get notes for this highlight
    const notes = db.prepare(`
      SELECT 
        n.*,
        p.display_name as author_name
      FROM notes n
      LEFT JOIN profiles p ON p.user_id = n.author_user_id
      WHERE n.highlight_id = ?
      ORDER BY n.created_at ASC
    `).all(highlightId);

    res.json({
      highlight: {
        ...highlight,
        notes
      }
    });

  } catch (error) {
    console.error('Error fetching highlight:', error);
    res.status(500).json({
      error: 'Failed to fetch highlight'
    });
  }
});

// POST /highlights - Create new highlight (teachers only)
router.post('/', authenticateToken, requireTeacher, (req, res) => {
  try {
    const { error, value } = createHighlightSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.details.map(d => d.message)
      });
    }

    const db = dbManager.getDb();
    const {
      student_id,
      script_id,
      ayah_id,
      token_start,
      token_end,
      mistake_type,
      color,
      note
    } = value;

    // Get teacher ID
    const teacher = db.prepare('SELECT id FROM teachers WHERE user_id = ?').get(req.user.userId);
    if (!teacher) {
      return res.status(403).json({
        error: 'Teacher profile not found'
      });
    }

    // Verify student belongs to same school
    const student = db.prepare(`
      SELECT s.id FROM students s
      JOIN profiles p ON p.user_id = s.user_id
      WHERE s.id = ? AND p.school_id = ?
    `).get(student_id, req.user.schoolId);

    if (!student) {
      return res.status(400).json({
        error: 'Student not found in your school'
      });
    }

    // Parse ayah_id from "surah:ayah" format
    const [surahStr, ayahStr] = ayah_id.split(':');
    const surah = parseInt(surahStr, 10);
    const ayah = parseInt(ayahStr, 10);

    if (isNaN(surah) || isNaN(ayah) || surah < 1 || surah > 114) {
      return res.status(400).json({
        error: 'Invalid ayah_id format. Expected "surah:ayah" (e.g., "1:1")'
      });
    }

    // Get the actual ayah UUID from quran_ayahs table
    const ayahRecord = db.prepare(`
      SELECT id FROM quran_ayahs
      WHERE script_id = ? AND surah = ? AND ayah = ?
    `).get(script_id, surah, ayah);

    if (!ayahRecord) {
      return res.status(400).json({
        error: `Ayah ${surah}:${ayah} not found for this script`
      });
    }

    // Create highlight
    const highlightId = uuidv4();
    const finalColor = color || MISTAKE_COLORS[mistake_type];

    db.prepare(`
      INSERT INTO highlights (
        id, school_id, teacher_id, student_id, script_id, ayah_id,
        token_start, token_end, mistake_type, color, surah, ayah_start, ayah_end
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      highlightId, req.user.schoolId, teacher.id, student_id, script_id,
      ayahRecord.id, token_start, token_end, mistake_type, finalColor,
      surah, ayah, ayah
    );

    // Add note if provided
    if (note) {
      const noteId = uuidv4();
      db.prepare(`
        INSERT INTO notes (id, highlight_id, author_user_id, type, text, audio_url)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        noteId, highlightId, req.user.userId, note.type,
        note.text || null, note.audio_url || null
      );
    }

    // Return created highlight with details
    const createdHighlight = db.prepare(`
      SELECT 
        h.*,
        tp.display_name as teacher_name,
        sp.display_name as student_name,
        qa.surah,
        qa.ayah,
        qs.display_name as script_name
      FROM highlights h
      LEFT JOIN teachers t ON t.id = h.teacher_id
      LEFT JOIN profiles tp ON tp.user_id = t.user_id
      LEFT JOIN students s ON s.id = h.student_id
      LEFT JOIN profiles sp ON sp.user_id = s.user_id
      LEFT JOIN quran_ayahs qa ON qa.id = h.ayah_id
      LEFT JOIN quran_scripts qs ON qs.id = h.script_id
      WHERE h.id = ?
    `).get(highlightId);

    // Emit socket event for real-time updates
    const io = req.app.get('io');
    if (io) {
      io.to(`school_${req.user.schoolId}`).emit('highlight_created', {
        highlight: createdHighlight,
        teacher_id: req.user.userId
      });
    }

    res.status(201).json({
      message: 'Highlight created successfully',
      highlight: createdHighlight
    });

  } catch (error) {
    console.error('Error creating highlight:', error);
    res.status(500).json({
      error: 'Failed to create highlight'
    });
  }
});

// PUT /highlights/:id - Update highlight
router.put('/:id', authenticateToken, checkResourceOwnership('highlight'), (req, res) => {
  try {
    const { error, value } = updateHighlightSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.details.map(d => d.message)
      });
    }

    const db = dbManager.getDb();
    const highlightId = req.params.id;
    const updates = [];
    const params = [];

    Object.entries(value).forEach(([key, val]) => {
      if (key === 'mistake_type' && !value.color) {
        // Auto-update color when mistake_type changes
        updates.push('mistake_type = ?', 'color = ?');
        params.push(val, MISTAKE_COLORS[val]);
      } else {
        updates.push(`${key} = ?`);
        params.push(val);
      }
    });

    if (updates.length === 0) {
      return res.status(400).json({
        error: 'No valid fields to update'
      });
    }

    params.push(highlightId);
    
    const result = db.prepare(`
      UPDATE highlights 
      SET ${updates.join(', ')} 
      WHERE id = ?
    `).run(...params);

    if (result.changes === 0) {
      return res.status(404).json({
        error: 'Highlight not found'
      });
    }

    // Return updated highlight
    const updatedHighlight = db.prepare(`
      SELECT 
        h.*,
        tp.display_name as teacher_name,
        sp.display_name as student_name,
        qa.surah,
        qa.ayah,
        qs.display_name as script_name
      FROM highlights h
      LEFT JOIN teachers t ON t.id = h.teacher_id
      LEFT JOIN profiles tp ON tp.user_id = t.user_id
      LEFT JOIN students s ON s.id = h.student_id
      LEFT JOIN profiles sp ON sp.user_id = s.user_id
      LEFT JOIN quran_ayahs qa ON qa.id = h.ayah_id
      LEFT JOIN quran_scripts qs ON qs.id = h.script_id
      WHERE h.id = ?
    `).get(highlightId);

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.to(`school_${req.user.schoolId}`).emit('highlight_updated', {
        highlight: updatedHighlight,
        updated_by: req.user.userId
      });
    }

    res.json({
      message: 'Highlight updated successfully',
      highlight: updatedHighlight
    });

  } catch (error) {
    console.error('Error updating highlight:', error);
    res.status(500).json({
      error: 'Failed to update highlight'
    });
  }
});

// DELETE /highlights/:id - Delete highlight
router.delete('/:id', authenticateToken, checkResourceOwnership('highlight'), (req, res) => {
  try {
    const db = dbManager.getDb();
    const highlightId = req.params.id;

    const result = db.prepare('DELETE FROM highlights WHERE id = ?').run(highlightId);

    if (result.changes === 0) {
      return res.status(404).json({
        error: 'Highlight not found'
      });
    }

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.to(`school_${req.user.schoolId}`).emit('highlight_deleted', {
        highlight_id: highlightId,
        deleted_by: req.user.userId
      });
    }

    res.json({
      message: 'Highlight deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting highlight:', error);
    res.status(500).json({
      error: 'Failed to delete highlight'
    });
  }
});

// POST /highlights/:id/notes - Add note to highlight
router.post('/:id/notes', authenticateToken, (req, res) => {
  try {
    const { error, value } = createNoteSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.details.map(d => d.message)
      });
    }

    const db = dbManager.getDb();
    const highlightId = req.params.id;
    const { type, text, audio_url } = value;

    // Verify highlight exists and user has access
    const highlight = db.prepare(`
      SELECT h.id FROM highlights h
      WHERE h.id = ? AND h.school_id = ?
    `).get(highlightId, req.user.schoolId);

    if (!highlight) {
      return res.status(404).json({
        error: 'Highlight not found'
      });
    }

    // Create note
    const noteId = uuidv4();
    db.prepare(`
      INSERT INTO notes (id, highlight_id, author_user_id, type, text, audio_url)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(noteId, highlightId, req.user.userId, type, text || null, audio_url || null);

    // Return created note with author info
    const createdNote = db.prepare(`
      SELECT 
        n.*,
        p.display_name as author_name
      FROM notes n
      LEFT JOIN profiles p ON p.user_id = n.author_user_id
      WHERE n.id = ?
    `).get(noteId);

    res.status(201).json({
      message: 'Note added successfully',
      note: createdNote
    });

  } catch (error) {
    console.error('Error adding note:', error);
    res.status(500).json({
      error: 'Failed to add note'
    });
  }
});

module.exports = router;