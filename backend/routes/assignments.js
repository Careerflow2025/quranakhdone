const express = require('express');
const Joi = require('joi');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();

const dbManager = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { requireTeacher, checkResourceOwnership } = require('../middleware/roleCheck');

// Validation schemas
const createAssignmentSchema = Joi.object({
  student_id: Joi.string().required(),
  title: Joi.string().min(1).max(200).required(),
  description: Joi.string().max(1000).optional(),
  due_at: Joi.date().iso().greater('now').required(),
  highlight_refs: Joi.array().items(Joi.string()).optional()
});

const updateAssignmentSchema = Joi.object({
  title: Joi.string().min(1).max(200).optional(),
  description: Joi.string().max(1000).optional(),
  due_at: Joi.date().iso().optional()
});

const transitionSchema = Joi.object({
  to_status: Joi.string().valid('viewed', 'submitted', 'reviewed', 'completed', 'reopened').required(),
  reason: Joi.string().max(500).optional()
});

const submitSchema = Joi.object({
  text: Joi.string().max(2000).optional(),
  attachments: Joi.array().items(Joi.string()).optional()
});

const gradeSchema = Joi.object({
  criterion_id: Joi.string().required(),
  score: Joi.number().min(0).required(),
  max_score: Joi.number().min(1).required()
});

// Valid status transitions
const VALID_TRANSITIONS = {
  'assigned': ['viewed'],
  'viewed': ['submitted'],
  'submitted': ['reviewed'],
  'reviewed': ['completed'],
  'completed': ['reopened'],
  'reopened': ['submitted']
};

// Helper function to log assignment events
function logAssignmentEvent(db, assignmentId, eventType, actorUserId, fromStatus, toStatus, meta = null) {
  const eventId = uuidv4();
  db.prepare(`
    INSERT INTO assignment_events (id, assignment_id, event_type, actor_user_id, from_status, to_status, meta)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(eventId, assignmentId, eventType, actorUserId, fromStatus, toStatus, meta ? JSON.stringify(meta) : null);
}

// GET /assignments - Get assignments with filtering
router.get('/', authenticateToken, (req, res) => {
  try {
    const db = dbManager.getDb();
    const { 
      student_id, 
      status, 
      teacher_id,
      due_before,
      due_after,
      late,
      page = 1, 
      limit = 50 
    } = req.query;

    let whereClause = 'WHERE a.school_id = ?';
    const params = [req.user.schoolId];

    // Role-based filtering
    if (req.user.role === 'student') {
      // Students can only see their own assignments
      whereClause += ' AND s.user_id = ?';
      params.push(req.user.userId);
    } else if (req.user.role === 'teacher') {
      // Teachers can see assignments they created
      whereClause += ' AND t.user_id = ?';
      params.push(req.user.userId);
    } else if (req.user.role === 'parent') {
      // Parents can see their children's assignments
      whereClause += ` AND a.student_id IN (
        SELECT ps.student_id FROM parents p
        JOIN parent_students ps ON ps.parent_id = p.id
        WHERE p.user_id = ?
      )`;
      params.push(req.user.userId);
    }

    // Apply filters
    if (student_id) {
      whereClause += ' AND a.student_id = ?';
      params.push(student_id);
    }
    
    if (status) {
      whereClause += ' AND a.status = ?';
      params.push(status);
    }
    
    if (teacher_id) {
      whereClause += ' AND a.created_by_teacher_id = ?';
      params.push(teacher_id);
    }

    if (due_before) {
      whereClause += ' AND a.due_at <= ?';
      params.push(due_before);
    }

    if (due_after) {
      whereClause += ' AND a.due_at >= ?';
      params.push(due_after);
    }

    if (late !== undefined) {
      whereClause += ' AND a.late = ?';
      params.push(late === 'true' ? 1 : 0);
    }

    const offset = (page - 1) * limit;

    const assignments = db.prepare(`
      SELECT 
        a.*,
        t.id as teacher_internal_id,
        tp.display_name as teacher_name,
        s.id as student_internal_id,
        sp.display_name as student_name,
        COUNT(DISTINCT sub.id) as submission_count,
        COUNT(DISTINCT att.id) as attachment_count,
        CASE 
          WHEN datetime('now') > a.due_at AND a.status NOT IN ('completed') THEN 1
          ELSE 0
        END as is_late
      FROM assignments a
      LEFT JOIN teachers t ON t.id = a.created_by_teacher_id
      LEFT JOIN profiles tp ON tp.user_id = t.user_id
      LEFT JOIN students s ON s.id = a.student_id
      LEFT JOIN profiles sp ON sp.user_id = s.user_id
      LEFT JOIN assignment_submissions sub ON sub.assignment_id = a.id
      LEFT JOIN assignment_attachments att ON att.assignment_id = a.id
      ${whereClause}
      GROUP BY a.id
      ORDER BY a.due_at ASC, a.created_at DESC
      LIMIT ? OFFSET ?
    `).all(...params, limit, offset);

    const totalCount = db.prepare(`
      SELECT COUNT(DISTINCT a.id) as count
      FROM assignments a
      LEFT JOIN teachers t ON t.id = a.created_by_teacher_id
      LEFT JOIN students s ON s.id = a.student_id
      ${whereClause}
    `).get(...params).count;

    res.json({
      assignments: assignments.map(assignment => ({
        ...assignment,
        late: Boolean(assignment.is_late)
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching assignments:', error);
    res.status(500).json({
      error: 'Failed to fetch assignments'
    });
  }
});

// GET /assignments/:id - Get specific assignment with details
router.get('/:id', authenticateToken, (req, res) => {
  try {
    const db = dbManager.getDb();
    const assignmentId = req.params.id;

    const assignment = db.prepare(`
      SELECT 
        a.*,
        t.id as teacher_internal_id,
        tp.display_name as teacher_name,
        tp.email as teacher_email,
        s.id as student_internal_id,
        sp.display_name as student_name,
        sp.email as student_email,
        CASE 
          WHEN datetime('now') > a.due_at AND a.status NOT IN ('completed') THEN 1
          ELSE 0
        END as is_late
      FROM assignments a
      LEFT JOIN teachers t ON t.id = a.created_by_teacher_id
      LEFT JOIN profiles tp ON tp.user_id = t.user_id
      LEFT JOIN students s ON s.id = a.student_id
      LEFT JOIN profiles sp ON sp.user_id = s.user_id
      WHERE a.id = ? AND a.school_id = ?
    `).get(assignmentId, req.user.schoolId);

    if (!assignment) {
      return res.status(404).json({
        error: 'Assignment not found'
      });
    }

    // Check access permissions
    const hasAccess = 
      req.user.role === 'owner' || 
      req.user.role === 'admin' ||
      (req.user.role === 'teacher' && assignment.teacher_internal_id && db.prepare('SELECT id FROM teachers WHERE id = ? AND user_id = ?').get(assignment.teacher_internal_id, req.user.userId)) ||
      (req.user.role === 'student' && db.prepare('SELECT id FROM students WHERE id = ? AND user_id = ?').get(assignment.student_internal_id, req.user.userId)) ||
      (req.user.role === 'parent' && db.prepare(`
        SELECT ps.student_id FROM parents p
        JOIN parent_students ps ON ps.parent_id = p.id
        WHERE p.user_id = ? AND ps.student_id = ?
      `).get(req.user.userId, assignment.student_internal_id));

    if (!hasAccess) {
      return res.status(403).json({
        error: 'Access denied to this assignment'
      });
    }

    // Mark as viewed if student is accessing for the first time
    if (req.user.role === 'student' && assignment.status === 'assigned') {
      db.prepare('UPDATE assignments SET status = ? WHERE id = ?').run('viewed', assignmentId);
      logAssignmentEvent(db, assignmentId, 'status_transition', req.user.userId, 'assigned', 'viewed');
      assignment.status = 'viewed';
    }

    // Get submissions
    const submissions = db.prepare(`
      SELECT 
        sub.*,
        p.display_name as submitter_name
      FROM assignment_submissions sub
      LEFT JOIN profiles p ON p.user_id = sub.student_id
      WHERE sub.assignment_id = ?
      ORDER BY sub.created_at DESC
    `).all(assignmentId);

    // Get attachments
    const attachments = db.prepare(`
      SELECT 
        att.*,
        p.display_name as uploader_name
      FROM assignment_attachments att
      LEFT JOIN profiles p ON p.user_id = att.uploader_user_id
      WHERE att.assignment_id = ?
      ORDER BY att.created_at DESC
    `).all(assignmentId);

    // Get events/history
    const events = db.prepare(`
      SELECT 
        e.*,
        p.display_name as actor_name
      FROM assignment_events e
      LEFT JOIN profiles p ON p.user_id = e.actor_user_id
      WHERE e.assignment_id = ?
      ORDER BY e.created_at ASC
    `).all(assignmentId);

    // Get grades if rubric is attached
    const grades = db.prepare(`
      SELECT 
        g.*,
        rc.name as criterion_name,
        r.name as rubric_name
      FROM grades g
      LEFT JOIN rubric_criteria rc ON rc.id = g.criterion_id
      LEFT JOIN rubrics r ON r.id = rc.rubric_id
      WHERE g.assignment_id = ?
    `).all(assignmentId);

    res.json({
      assignment: {
        ...assignment,
        late: Boolean(assignment.is_late),
        submissions,
        attachments,
        events: events.map(e => ({
          ...e,
          meta: e.meta ? JSON.parse(e.meta) : null
        })),
        grades
      }
    });

  } catch (error) {
    console.error('Error fetching assignment:', error);
    res.status(500).json({
      error: 'Failed to fetch assignment'
    });
  }
});

// POST /assignments - Create new assignment (teachers only)
router.post('/', authenticateToken, requireTeacher, (req, res) => {
  try {
    const { error, value } = createAssignmentSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.details.map(d => d.message)
      });
    }

    const db = dbManager.getDb();
    const { student_id, title, description, due_at, highlight_refs } = value;

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

    // Create assignment
    const assignmentId = uuidv4();
    db.prepare(`
      INSERT INTO assignments (
        id, school_id, created_by_teacher_id, student_id, title, description, due_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      assignmentId, req.user.schoolId, teacher.id, student_id, title, 
      description || null, due_at
    );

    // Log creation event
    logAssignmentEvent(db, assignmentId, 'created', req.user.userId, null, 'assigned', {
      highlight_refs: highlight_refs || []
    });

    // Return created assignment with details
    const createdAssignment = db.prepare(`
      SELECT 
        a.*,
        tp.display_name as teacher_name,
        sp.display_name as student_name,
        CASE 
          WHEN datetime('now') > a.due_at AND a.status NOT IN ('completed') THEN 1
          ELSE 0
        END as is_late
      FROM assignments a
      LEFT JOIN teachers t ON t.id = a.created_by_teacher_id
      LEFT JOIN profiles tp ON tp.user_id = t.user_id
      LEFT JOIN students s ON s.id = a.student_id
      LEFT JOIN profiles sp ON sp.user_id = s.user_id
      WHERE a.id = ?
    `).get(assignmentId);

    res.status(201).json({
      message: 'Assignment created successfully',
      assignment: {
        ...createdAssignment,
        late: Boolean(createdAssignment.is_late)
      }
    });

  } catch (error) {
    console.error('Error creating assignment:', error);
    res.status(500).json({
      error: 'Failed to create assignment'
    });
  }
});

// PUT /assignments/:id - Update assignment (teachers only)
router.put('/:id', authenticateToken, checkResourceOwnership('assignment'), (req, res) => {
  try {
    const { error, value } = updateAssignmentSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.details.map(d => d.message)
      });
    }

    const db = dbManager.getDb();
    const assignmentId = req.params.id;
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

    params.push(assignmentId);
    
    const result = db.prepare(`
      UPDATE assignments 
      SET ${updates.join(', ')} 
      WHERE id = ?
    `).run(...params);

    if (result.changes === 0) {
      return res.status(404).json({
        error: 'Assignment not found'
      });
    }

    // Log update event
    logAssignmentEvent(db, assignmentId, 'updated', req.user.userId, null, null, value);

    // Return updated assignment
    const updatedAssignment = db.prepare(`
      SELECT 
        a.*,
        tp.display_name as teacher_name,
        sp.display_name as student_name,
        CASE 
          WHEN datetime('now') > a.due_at AND a.status NOT IN ('completed') THEN 1
          ELSE 0
        END as is_late
      FROM assignments a
      LEFT JOIN teachers t ON t.id = a.created_by_teacher_id
      LEFT JOIN profiles tp ON tp.user_id = t.user_id
      LEFT JOIN students s ON s.id = a.student_id
      LEFT JOIN profiles sp ON sp.user_id = s.user_id
      WHERE a.id = ?
    `).get(assignmentId);

    res.json({
      message: 'Assignment updated successfully',
      assignment: {
        ...updatedAssignment,
        late: Boolean(updatedAssignment.is_late)
      }
    });

  } catch (error) {
    console.error('Error updating assignment:', error);
    res.status(500).json({
      error: 'Failed to update assignment'
    });
  }
});

// POST /assignments/:id/transition - Change assignment status
router.post('/:id/transition', authenticateToken, checkResourceOwnership('assignment'), (req, res) => {
  try {
    const { error, value } = transitionSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.details.map(d => d.message)
      });
    }

    const db = dbManager.getDb();
    const assignmentId = req.params.id;
    const { to_status, reason } = value;

    // Get current assignment status
    const assignment = db.prepare('SELECT status FROM assignments WHERE id = ?').get(assignmentId);
    if (!assignment) {
      return res.status(404).json({
        error: 'Assignment not found'
      });
    }

    const fromStatus = assignment.status;

    // Check if transition is valid
    if (!VALID_TRANSITIONS[fromStatus] || !VALID_TRANSITIONS[fromStatus].includes(to_status)) {
      return res.status(400).json({
        error: 'Invalid status transition',
        from: fromStatus,
        to: to_status,
        valid_transitions: VALID_TRANSITIONS[fromStatus] || []
      });
    }

    // Handle reopen count
    let reopenCount = 0;
    if (to_status === 'reopened') {
      const currentCount = db.prepare('SELECT reopen_count FROM assignments WHERE id = ?').get(assignmentId).reopen_count;
      reopenCount = currentCount + 1;
      db.prepare('UPDATE assignments SET status = ?, reopen_count = ? WHERE id = ?').run(to_status, reopenCount, assignmentId);
    } else {
      db.prepare('UPDATE assignments SET status = ? WHERE id = ?').run(to_status, assignmentId);
    }

    // Log transition event
    logAssignmentEvent(db, assignmentId, 'status_transition', req.user.userId, fromStatus, to_status, {
      reason: reason || null,
      reopen_count: to_status === 'reopened' ? reopenCount : null
    });

    res.json({
      message: `Assignment status changed to ${to_status}`,
      from_status: fromStatus,
      to_status: to_status
    });

  } catch (error) {
    console.error('Error transitioning assignment:', error);
    res.status(500).json({
      error: 'Failed to transition assignment'
    });
  }
});

// POST /assignments/:id/submit - Submit assignment (students only)
router.post('/:id/submit', authenticateToken, (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({
        error: 'Only students can submit assignments'
      });
    }

    const { error, value } = submitSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.details.map(d => d.message)
      });
    }

    const db = dbManager.getDb();
    const assignmentId = req.params.id;
    const { text, attachments } = value;

    // Get student ID and verify assignment access
    const student = db.prepare('SELECT id FROM students WHERE user_id = ?').get(req.user.userId);
    if (!student) {
      return res.status(403).json({
        error: 'Student profile not found'
      });
    }

    const assignment = db.prepare(`
      SELECT id, status, student_id FROM assignments 
      WHERE id = ? AND student_id = ? AND school_id = ?
    `).get(assignmentId, student.id, req.user.schoolId);

    if (!assignment) {
      return res.status(404).json({
        error: 'Assignment not found or access denied'
      });
    }

    // Check if submission is allowed
    if (!['viewed', 'reopened'].includes(assignment.status)) {
      return res.status(400).json({
        error: 'Assignment cannot be submitted in current status',
        current_status: assignment.status
      });
    }

    // Create submission
    const submissionId = uuidv4();
    db.prepare(`
      INSERT INTO assignment_submissions (id, assignment_id, student_id, text)
      VALUES (?, ?, ?, ?)
    `).run(submissionId, assignmentId, student.id, text || null);

    // Handle attachments if provided
    if (attachments && attachments.length > 0) {
      const insertAttachment = db.prepare(`
        INSERT INTO assignment_attachments (id, assignment_id, uploader_user_id, url, mime_type)
        VALUES (?, ?, ?, ?, ?)
      `);

      attachments.forEach(attachment => {
        insertAttachment.run(
          uuidv4(),
          assignmentId,
          req.user.userId,
          attachment,
          'application/octet-stream' // Default mime type, should be determined from actual file
        );
      });
    }

    // Update assignment status to submitted
    db.prepare('UPDATE assignments SET status = ? WHERE id = ?').run('submitted', assignmentId);

    // Log submission event
    logAssignmentEvent(db, assignmentId, 'submitted', req.user.userId, assignment.status, 'submitted', {
      submission_id: submissionId,
      attachments_count: attachments ? attachments.length : 0
    });

    res.status(201).json({
      message: 'Assignment submitted successfully',
      submission_id: submissionId
    });

  } catch (error) {
    console.error('Error submitting assignment:', error);
    res.status(500).json({
      error: 'Failed to submit assignment'
    });
  }
});

// POST /assignments/:id/grade - Grade assignment (teachers only)
router.post('/:id/grade', authenticateToken, requireTeacher, checkResourceOwnership('assignment'), (req, res) => {
  try {
    const { error, value } = gradeSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.details.map(d => d.message)
      });
    }

    const db = dbManager.getDb();
    const assignmentId = req.params.id;
    const { criterion_id, score, max_score } = value;

    // Verify criterion belongs to a rubric attached to this assignment
    const criterion = db.prepare(`
      SELECT rc.id, r.name as rubric_name, rc.name as criterion_name
      FROM rubric_criteria rc
      JOIN rubrics r ON r.id = rc.rubric_id
      JOIN assignment_rubrics ar ON ar.rubric_id = r.id
      WHERE rc.id = ? AND ar.assignment_id = ?
    `).get(criterion_id, assignmentId);

    if (!criterion) {
      return res.status(400).json({
        error: 'Criterion not found or not attached to this assignment'
      });
    }

    // Get student ID from assignment
    const assignment = db.prepare('SELECT student_id FROM assignments WHERE id = ?').get(assignmentId);

    // Insert or update grade
    const existingGrade = db.prepare(`
      SELECT id FROM grades 
      WHERE assignment_id = ? AND student_id = ? AND criterion_id = ?
    `).get(assignmentId, assignment.student_id, criterion_id);

    if (existingGrade) {
      db.prepare(`
        UPDATE grades SET score = ?, max_score = ? WHERE id = ?
      `).run(score, max_score, existingGrade.id);
    } else {
      db.prepare(`
        INSERT INTO grades (id, assignment_id, student_id, criterion_id, score, max_score)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(uuidv4(), assignmentId, assignment.student_id, criterion_id, score, max_score);
    }

    // Log grading event
    logAssignmentEvent(db, assignmentId, 'graded', req.user.userId, null, null, {
      criterion_id,
      criterion_name: criterion.criterion_name,
      score,
      max_score
    });

    res.json({
      message: 'Grade recorded successfully',
      criterion: criterion.criterion_name,
      score,
      max_score
    });

  } catch (error) {
    console.error('Error grading assignment:', error);
    res.status(500).json({
      error: 'Failed to grade assignment'
    });
  }
});

// DELETE /assignments/:id - Delete assignment
router.delete('/:id', authenticateToken, checkResourceOwnership('assignment'), (req, res) => {
  try {
    const db = dbManager.getDb();
    const assignmentId = req.params.id;

    const result = db.prepare('DELETE FROM assignments WHERE id = ?').run(assignmentId);

    if (result.changes === 0) {
      return res.status(404).json({
        error: 'Assignment not found'
      });
    }

    res.json({
      message: 'Assignment deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting assignment:', error);
    res.status(500).json({
      error: 'Failed to delete assignment'
    });
  }
});

module.exports = router;