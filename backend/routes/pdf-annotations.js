const express = require('express');
const Joi = require('joi');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();

const dbManager = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { requireTeacher, checkResourceOwnership } = require('../middleware/roleCheck');

// Validation schemas
const createAnnotationSchema = Joi.object({
  student_id: Joi.string().required(),
  pdf_file_id: Joi.string().required(),
  page_number: Joi.number().integer().min(1).required(),
  x: Joi.number().min(0).max(1).required(),
  y: Joi.number().min(0).max(1).required(),
  width: Joi.number().min(0).max(1).required(),
  height: Joi.number().min(0).max(1).required(),
  surah: Joi.number().integer().min(1).max(114).required(),
  ayah_start: Joi.number().integer().min(1).required(),
  ayah_end: Joi.number().integer().min(1).required(),
  type: Joi.string().valid('homework', 'recap', 'tajweed', 'haraka', 'letter').required(),
  color: Joi.string().optional(),
  note: Joi.object({
    type: Joi.string().valid('text', 'audio').required(),
    text: Joi.when('type', { is: 'text', then: Joi.string().required(), otherwise: Joi.forbidden() }),
    audio_url: Joi.when('type', { is: 'audio', then: Joi.string().uri().required(), otherwise: Joi.forbidden() }),
    parent_note_id: Joi.string().uuid().optional(),
    visible_to_parent: Joi.boolean().default(true)
  }).optional()
});

const updateAnnotationSchema = Joi.object({
  type: Joi.string().valid('homework', 'recap', 'tajweed', 'haraka', 'letter').optional(),
  color: Joi.string().optional(),
  completed_at: Joi.date().iso().optional(),
  completed_by: Joi.string().uuid().optional()
});

const createNoteSchema = Joi.object({
  type: Joi.string().valid('text', 'audio').required(),
  text: Joi.when('type', { is: 'text', then: Joi.string().required(), otherwise: Joi.forbidden() }),
  audio_url: Joi.when('type', { is: 'audio', then: Joi.string().uri().required(), otherwise: Joi.forbidden() }),
  parent_note_id: Joi.string().uuid().optional(),
  visible_to_parent: Joi.boolean().default(true)
});

// Color mapping for annotation types
const ANNOTATION_COLORS = {
  homework: 'green',
  recap: 'purple',
  tajweed: 'orange',
  haraka: 'red',
  letter: 'brown'
};

// GET /pdf-annotations - Get annotations with filtering
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { data, error } = await req.supabase
      .from('pdf_annotations')
      .select(`
        *,
        teacher:teachers(id, user_id, profiles:profiles(display_name)),
        student:students(id, user_id, profiles:profiles(display_name)),
        pdf_file:quran_pdf_files(qiraat_name, display_name)
      `)
      .eq('school_id', req.user.schoolId);

    if (error) throw error;

    // Role-based filtering
    let filteredData = data;
    if (req.user.role === 'student') {
      const studentRecord = await req.supabase
        .from('students')
        .select('id')
        .eq('user_id', req.user.userId)
        .single();
      filteredData = data.filter(a => a.student_id === studentRecord.data.id);
    } else if (req.user.role === 'teacher') {
      const teacherRecord = await req.supabase
        .from('teachers')
        .select('id')
        .eq('user_id', req.user.userId)
        .single();
      filteredData = data.filter(a => a.teacher_id === teacherRecord.data.id);
    }

    // Apply query filters
    const { student_id, pdf_file_id, page_number, surah, type } = req.query;

    if (student_id) {
      filteredData = filteredData.filter(a => a.student_id === student_id);
    }
    if (pdf_file_id) {
      filteredData = filteredData.filter(a => a.pdf_file_id === pdf_file_id);
    }
    if (page_number) {
      filteredData = filteredData.filter(a => a.page_number === parseInt(page_number));
    }
    if (surah) {
      filteredData = filteredData.filter(a => a.surah === parseInt(surah));
    }
    if (type) {
      filteredData = filteredData.filter(a => a.type === type);
    }

    res.json({
      annotations: filteredData,
      count: filteredData.length
    });

  } catch (error) {
    console.error('Error fetching PDF annotations:', error);
    res.status(500).json({
      error: 'Failed to fetch PDF annotations',
      details: error.message
    });
  }
});

// GET /pdf-annotations/:id - Get specific annotation with notes
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const annotationId = req.params.id;

    const { data: annotation, error } = await req.supabase
      .from('pdf_annotations')
      .select(`
        *,
        teacher:teachers(id, user_id, profiles:profiles(display_name)),
        student:students(id, user_id, profiles:profiles(display_name)),
        pdf_file:quran_pdf_files(qiraat_name, display_name)
      `)
      .eq('id', annotationId)
      .eq('school_id', req.user.schoolId)
      .single();

    if (error || !annotation) {
      return res.status(404).json({
        error: 'Annotation not found'
      });
    }

    // Get threaded notes using the helper function
    const { data: notes, error: notesError } = await req.supabase
      .rpc('get_pdf_annotation_notes_thread', { annotation_id_param: annotationId });

    if (notesError) {
      console.error('Error fetching notes:', notesError);
    }

    res.json({
      annotation: {
        ...annotation,
        notes: notes || []
      }
    });

  } catch (error) {
    console.error('Error fetching PDF annotation:', error);
    res.status(500).json({
      error: 'Failed to fetch PDF annotation',
      details: error.message
    });
  }
});

// POST /pdf-annotations - Create new annotation (teachers only)
router.post('/', authenticateToken, requireTeacher, async (req, res) => {
  try {
    const { error: validationError, value } = createAnnotationSchema.validate(req.body);
    if (validationError) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validationError.details.map(d => d.message)
      });
    }

    const {
      student_id,
      pdf_file_id,
      page_number,
      x,
      y,
      width,
      height,
      surah,
      ayah_start,
      ayah_end,
      type,
      color,
      note
    } = value;

    // Get teacher ID
    const { data: teacher, error: teacherError } = await req.supabase
      .from('teachers')
      .select('id')
      .eq('user_id', req.user.userId)
      .single();

    if (teacherError || !teacher) {
      return res.status(403).json({
        error: 'Teacher profile not found'
      });
    }

    // Verify student belongs to same school
    const { data: student, error: studentError } = await req.supabase
      .from('students')
      .select('id, profiles:profiles!inner(school_id)')
      .eq('id', student_id)
      .eq('profiles.school_id', req.user.schoolId)
      .single();

    if (studentError || !student) {
      return res.status(400).json({
        error: 'Student not found in your school'
      });
    }

    // Verify PDF file exists
    const { data: pdfFile, error: pdfError } = await req.supabase
      .from('quran_pdf_files')
      .select('id')
      .eq('id', pdf_file_id)
      .single();

    if (pdfError || !pdfFile) {
      return res.status(400).json({
        error: 'PDF file not found'
      });
    }

    // Create annotation
    const annotationId = uuidv4();
    const finalColor = color || ANNOTATION_COLORS[type];

    const { data: createdAnnotation, error: createError } = await req.supabase
      .from('pdf_annotations')
      .insert({
        id: annotationId,
        school_id: req.user.schoolId,
        teacher_id: teacher.id,
        student_id,
        pdf_file_id,
        page_number,
        x,
        y,
        width,
        height,
        surah,
        ayah_start,
        ayah_end,
        type,
        color: finalColor
      })
      .select(`
        *,
        teacher:teachers(profiles:profiles(display_name)),
        student:students(profiles:profiles(display_name)),
        pdf_file:quran_pdf_files(qiraat_name, display_name)
      `)
      .single();

    if (createError) throw createError;

    // Add note if provided
    if (note) {
      const noteId = uuidv4();
      await req.supabase
        .from('notes')
        .insert({
          id: noteId,
          pdf_annotation_id: annotationId,
          author_user_id: req.user.userId,
          type: note.type,
          text: note.text || null,
          audio_url: note.audio_url || null,
          parent_note_id: note.parent_note_id || null,
          visible_to_parent: note.visible_to_parent
        });
    }

    // Emit socket event for real-time updates
    const io = req.app.get('io');
    if (io) {
      io.to(`school_${req.user.schoolId}`).emit('pdf_annotation_created', {
        annotation: createdAnnotation,
        teacher_id: req.user.userId
      });
    }

    res.status(201).json({
      message: 'PDF annotation created successfully',
      annotation: createdAnnotation
    });

  } catch (error) {
    console.error('Error creating PDF annotation:', error);
    res.status(500).json({
      error: 'Failed to create PDF annotation',
      details: error.message
    });
  }
});

// PUT /pdf-annotations/:id - Update annotation
router.put('/:id', authenticateToken, requireTeacher, async (req, res) => {
  try {
    const { error: validationError, value } = updateAnnotationSchema.validate(req.body);
    if (validationError) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validationError.details.map(d => d.message)
      });
    }

    const annotationId = req.params.id;

    // Get teacher ID and verify ownership
    const { data: teacher, error: teacherError } = await req.supabase
      .from('teachers')
      .select('id')
      .eq('user_id', req.user.userId)
      .single();

    if (teacherError || !teacher) {
      return res.status(403).json({
        error: 'Teacher profile not found'
      });
    }

    // Verify annotation exists and teacher owns it
    const { data: existing, error: checkError } = await req.supabase
      .from('pdf_annotations')
      .select('id, type, color')
      .eq('id', annotationId)
      .eq('teacher_id', teacher.id)
      .single();

    if (checkError || !existing) {
      return res.status(404).json({
        error: 'Annotation not found or access denied'
      });
    }

    // Handle completion: store previous color when marking complete
    const updateData = { ...value };
    if (value.completed_at && !existing.completed_at) {
      updateData.previous_color = existing.color;
      updateData.color = 'gold'; // Completed annotations turn gold
    }

    // Auto-update color when type changes (unless explicitly completing)
    if (value.type && !value.completed_at) {
      updateData.color = ANNOTATION_COLORS[value.type];
    }

    const { data: updatedAnnotation, error: updateError } = await req.supabase
      .from('pdf_annotations')
      .update(updateData)
      .eq('id', annotationId)
      .select(`
        *,
        teacher:teachers(profiles:profiles(display_name)),
        student:students(profiles:profiles(display_name)),
        pdf_file:quran_pdf_files(qiraat_name, display_name)
      `)
      .single();

    if (updateError) throw updateError;

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.to(`school_${req.user.schoolId}`).emit('pdf_annotation_updated', {
        annotation: updatedAnnotation,
        updated_by: req.user.userId
      });
    }

    res.json({
      message: 'PDF annotation updated successfully',
      annotation: updatedAnnotation
    });

  } catch (error) {
    console.error('Error updating PDF annotation:', error);
    res.status(500).json({
      error: 'Failed to update PDF annotation',
      details: error.message
    });
  }
});

// DELETE /pdf-annotations/:id - Delete annotation
router.delete('/:id', authenticateToken, requireTeacher, async (req, res) => {
  try {
    const annotationId = req.params.id;

    // Get teacher ID
    const { data: teacher, error: teacherError } = await req.supabase
      .from('teachers')
      .select('id')
      .eq('user_id', req.user.userId)
      .single();

    if (teacherError || !teacher) {
      return res.status(403).json({
        error: 'Teacher profile not found'
      });
    }

    // Delete annotation (notes will cascade delete)
    const { error: deleteError } = await req.supabase
      .from('pdf_annotations')
      .delete()
      .eq('id', annotationId)
      .eq('teacher_id', teacher.id);

    if (deleteError) throw deleteError;

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.to(`school_${req.user.schoolId}`).emit('pdf_annotation_deleted', {
        annotation_id: annotationId,
        deleted_by: req.user.userId
      });
    }

    res.json({
      message: 'PDF annotation deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting PDF annotation:', error);
    res.status(500).json({
      error: 'Failed to delete PDF annotation',
      details: error.message
    });
  }
});

// POST /pdf-annotations/:id/notes - Add threaded note to annotation
router.post('/:id/notes', authenticateToken, async (req, res) => {
  try {
    const { error: validationError, value } = createNoteSchema.validate(req.body);
    if (validationError) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validationError.details.map(d => d.message)
      });
    }

    const annotationId = req.params.id;
    const { type, text, audio_url, parent_note_id, visible_to_parent } = value;

    // Verify annotation exists and user has access
    const { data: annotation, error: annotationError } = await req.supabase
      .from('pdf_annotations')
      .select('id')
      .eq('id', annotationId)
      .eq('school_id', req.user.schoolId)
      .single();

    if (annotationError || !annotation) {
      return res.status(404).json({
        error: 'Annotation not found'
      });
    }

    // If replying to a note, verify parent exists
    if (parent_note_id) {
      const { data: parentNote, error: parentError } = await req.supabase
        .from('notes')
        .select('id')
        .eq('id', parent_note_id)
        .eq('pdf_annotation_id', annotationId)
        .single();

      if (parentError || !parentNote) {
        return res.status(400).json({
          error: 'Parent note not found'
        });
      }
    }

    // Create note
    const noteId = uuidv4();
    const { data: createdNote, error: createError } = await req.supabase
      .from('notes')
      .insert({
        id: noteId,
        pdf_annotation_id: annotationId,
        author_user_id: req.user.userId,
        type,
        text: text || null,
        audio_url: audio_url || null,
        parent_note_id: parent_note_id || null,
        visible_to_parent
      })
      .select(`
        *,
        author:profiles!author_user_id(display_name, role)
      `)
      .single();

    if (createError) throw createError;

    // Emit socket event for real-time updates
    const io = req.app.get('io');
    if (io) {
      io.to(`school_${req.user.schoolId}`).emit('pdf_annotation_note_created', {
        note: createdNote,
        annotation_id: annotationId
      });
    }

    res.status(201).json({
      message: 'Note added successfully',
      note: createdNote
    });

  } catch (error) {
    console.error('Error adding note:', error);
    res.status(500).json({
      error: 'Failed to add note',
      details: error.message
    });
  }
});

module.exports = router;
