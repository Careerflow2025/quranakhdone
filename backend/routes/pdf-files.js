const express = require('express');
const Joi = require('joi');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();

const { authenticateToken } = require('../middleware/auth');
const { requireTeacher } = require('../middleware/roleCheck');

// Validation schema for PDF file upload
const uploadPdfSchema = Joi.object({
  qiraat_name: Joi.string().valid('hafs', 'warsh', 'qalun', 'duri', 'susi', 'khalaf').required(),
  display_name: Joi.string().required(),
  file_path: Joi.string().required(),
  total_pages: Joi.number().integer().min(1).required()
});

// GET /pdf-files - Get all PDF files (system defaults + school custom)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { data, error } = await req.supabase
      .from('quran_pdf_files')
      .select(`
        *,
        uploader:profiles(display_name)
      `)
      .or(`is_system_default.eq.true,school_id.eq.${req.user.schoolId}`)
      .order('is_system_default', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({
      pdf_files: data,
      count: data.length
    });

  } catch (error) {
    console.error('Error fetching PDF files:', error);
    res.status(500).json({
      error: 'Failed to fetch PDF files',
      details: error.message
    });
  }
});

// GET /pdf-files/:id - Get specific PDF file
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const pdfFileId = req.params.id;

    const { data: pdfFile, error } = await req.supabase
      .from('quran_pdf_files')
      .select(`
        *,
        uploader:profiles(display_name)
      `)
      .eq('id', pdfFileId)
      .or(`is_system_default.eq.true,school_id.eq.${req.user.schoolId}`)
      .single();

    if (error || !pdfFile) {
      return res.status(404).json({
        error: 'PDF file not found'
      });
    }

    res.json({
      pdf_file: pdfFile
    });

  } catch (error) {
    console.error('Error fetching PDF file:', error);
    res.status(500).json({
      error: 'Failed to fetch PDF file',
      details: error.message
    });
  }
});

// GET /pdf-files/:id/mappings - Get page-to-ayah mappings for a PDF
router.get('/:id/mappings', authenticateToken, async (req, res) => {
  try {
    const pdfFileId = req.params.id;
    const { page_number, surah } = req.query;

    let query = req.supabase
      .from('pdf_page_ayah_mapping')
      .select('*')
      .eq('pdf_file_id', pdfFileId);

    if (page_number) {
      query = query.eq('page_number', parseInt(page_number));
    }

    if (surah) {
      query = query.eq('surah', parseInt(surah));
    }

    query = query.order('page_number').order('surah').order('ayah_start');

    const { data, error } = await query;

    if (error) throw error;

    res.json({
      mappings: data,
      count: data.length
    });

  } catch (error) {
    console.error('Error fetching PDF mappings:', error);
    res.status(500).json({
      error: 'Failed to fetch PDF mappings',
      details: error.message
    });
  }
});

// POST /pdf-files - Upload custom PDF (teachers only)
router.post('/', authenticateToken, requireTeacher, async (req, res) => {
  try {
    const { error: validationError, value } = uploadPdfSchema.validate(req.body);
    if (validationError) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validationError.details.map(d => d.message)
      });
    }

    const { qiraat_name, display_name, file_path, total_pages } = value;

    // Create PDF file record
    const pdfFileId = uuidv4();

    const { data: createdPdfFile, error: createError } = await req.supabase
      .from('quran_pdf_files')
      .insert({
        id: pdfFileId,
        school_id: req.user.schoolId,
        qiraat_name,
        display_name,
        file_path,
        uploaded_by: req.user.userId,
        is_system_default: false,
        total_pages
      })
      .select(`
        *,
        uploader:profiles(display_name)
      `)
      .single();

    if (createError) throw createError;

    res.status(201).json({
      message: 'PDF file uploaded successfully',
      pdf_file: createdPdfFile
    });

  } catch (error) {
    console.error('Error uploading PDF file:', error);
    res.status(500).json({
      error: 'Failed to upload PDF file',
      details: error.message
    });
  }
});

// POST /pdf-files/:id/mappings - Create page-to-ayah mapping (teachers only, for custom PDFs)
router.post('/:id/mappings', authenticateToken, requireTeacher, async (req, res) => {
  try {
    const pdfFileId = req.params.id;
    const mappings = req.body.mappings; // Array of mapping objects

    if (!Array.isArray(mappings) || mappings.length === 0) {
      return res.status(400).json({
        error: 'Mappings array is required'
      });
    }

    // Verify PDF file belongs to teacher's school
    const { data: pdfFile, error: pdfError } = await req.supabase
      .from('quran_pdf_files')
      .select('id, school_id')
      .eq('id', pdfFileId)
      .eq('school_id', req.user.schoolId)
      .single();

    if (pdfError || !pdfFile) {
      return res.status(404).json({
        error: 'PDF file not found in your school'
      });
    }

    // Prepare mappings for insert
    const mappingsToInsert = mappings.map(m => ({
      id: uuidv4(),
      pdf_file_id: pdfFileId,
      page_number: m.page_number,
      surah: m.surah,
      ayah_start: m.ayah_start,
      ayah_end: m.ayah_end,
      x_start: m.x_start || null,
      y_start: m.y_start || null,
      x_end: m.x_end || null,
      y_end: m.y_end || null
    }));

    const { data: createdMappings, error: createError } = await req.supabase
      .from('pdf_page_ayah_mapping')
      .insert(mappingsToInsert)
      .select();

    if (createError) throw createError;

    res.status(201).json({
      message: 'Mappings created successfully',
      mappings: createdMappings,
      count: createdMappings.length
    });

  } catch (error) {
    console.error('Error creating PDF mappings:', error);
    res.status(500).json({
      error: 'Failed to create PDF mappings',
      details: error.message
    });
  }
});

// DELETE /pdf-files/:id - Delete custom PDF (teachers only)
router.delete('/:id', authenticateToken, requireTeacher, async (req, res) => {
  try {
    const pdfFileId = req.params.id;

    // Verify PDF is not a system default and belongs to teacher's school
    const { data: pdfFile, error: checkError } = await req.supabase
      .from('quran_pdf_files')
      .select('id, is_system_default')
      .eq('id', pdfFileId)
      .eq('school_id', req.user.schoolId)
      .single();

    if (checkError || !pdfFile) {
      return res.status(404).json({
        error: 'PDF file not found in your school'
      });
    }

    if (pdfFile.is_system_default) {
      return res.status(403).json({
        error: 'Cannot delete system default PDFs'
      });
    }

    // Delete PDF (mappings and annotations will cascade delete)
    const { error: deleteError } = await req.supabase
      .from('quran_pdf_files')
      .delete()
      .eq('id', pdfFileId);

    if (deleteError) throw deleteError;

    res.json({
      message: 'PDF file deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting PDF file:', error);
    res.status(500).json({
      error: 'Failed to delete PDF file',
      details: error.message
    });
  }
});

module.exports = router;
