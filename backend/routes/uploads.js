const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();

const { authenticateToken } = require('../middleware/auth');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let uploadPath;
    
    // Determine upload path based on file type and user role
    if (file.fieldname === 'voice_note') {
      uploadPath = path.join(__dirname, '../uploads/voice-notes', req.user.schoolId, req.user.userId);
    } else if (file.fieldname === 'assignment_attachment') {
      uploadPath = path.join(__dirname, '../uploads/attachments', req.user.schoolId, req.user.userId);
    } else {
      uploadPath = path.join(__dirname, '../uploads/general', req.user.schoolId);
    }

    // Create directory if it doesn't exist
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // Generate unique filename with original extension
    const uniqueName = uuidv4() + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});

// File filter function
const fileFilter = (req, file, cb) => {
  const allowedTypes = {
    voice_note: ['audio/m4a', 'audio/mp4', 'audio/mpeg', 'audio/wav', 'audio/webm'],
    assignment_attachment: [
      'image/jpeg', 'image/png', 'image/gif',
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'text/plain',
      'audio/m4a', 'audio/mp4', 'audio/mpeg', 'audio/wav'
    ],
    profile_image: ['image/jpeg', 'image/png', 'image/gif'],
    school_logo: ['image/jpeg', 'image/png', 'image/gif', 'image/svg+xml']
  };

  const fieldAllowedTypes = allowedTypes[file.fieldname] || allowedTypes.assignment_attachment;
  
  if (fieldAllowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type. Allowed types for ${file.fieldname}: ${fieldAllowedTypes.join(', ')}`), false);
  }
};

// Configure multer with size limits
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024, // 5MB default
    files: 5 // Maximum 5 files per request
  }
});

// POST /uploads/voice-note - Upload voice note for teacher feedback
router.post('/voice-note', authenticateToken, upload.single('voice_note'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'No voice note file provided'
      });
    }

    // Only teachers can upload voice notes
    if (req.user.role !== 'teacher') {
      // Clean up uploaded file
      fs.unlinkSync(req.file.path);
      return res.status(403).json({
        error: 'Only teachers can upload voice notes'
      });
    }

    const fileUrl = `/uploads/voice-notes/${req.user.schoolId}/${req.user.userId}/${req.file.filename}`;

    res.status(201).json({
      message: 'Voice note uploaded successfully',
      file: {
        url: fileUrl,
        filename: req.file.filename,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size
      }
    });

  } catch (error) {
    // Clean up file if error occurs
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    console.error('Error uploading voice note:', error);
    res.status(500).json({
      error: 'Failed to upload voice note',
      details: error.message
    });
  }
});

// POST /uploads/assignment-attachments - Upload assignment attachments
router.post('/assignment-attachments', authenticateToken, upload.array('assignment_attachment', 5), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        error: 'No attachment files provided'
      });
    }

    // Students and teachers can upload assignment attachments
    if (!['student', 'teacher'].includes(req.user.role)) {
      // Clean up uploaded files
      req.files.forEach(file => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
      
      return res.status(403).json({
        error: 'Only students and teachers can upload assignment attachments'
      });
    }

    const uploadedFiles = req.files.map(file => {
      const fileUrl = `/uploads/attachments/${req.user.schoolId}/${req.user.userId}/${file.filename}`;
      return {
        url: fileUrl,
        filename: file.filename,
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size
      };
    });

    res.status(201).json({
      message: `${uploadedFiles.length} attachment(s) uploaded successfully`,
      files: uploadedFiles
    });

  } catch (error) {
    // Clean up files if error occurs
    if (req.files) {
      req.files.forEach(file => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
    }
    
    console.error('Error uploading attachments:', error);
    res.status(500).json({
      error: 'Failed to upload attachments',
      details: error.message
    });
  }
});

// POST /uploads/profile-image - Upload profile image
router.post('/profile-image', authenticateToken, upload.single('profile_image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'No profile image provided'
      });
    }

    const fileUrl = `/uploads/profiles/${req.user.schoolId}/${req.user.userId}/${req.file.filename}`;

    res.status(201).json({
      message: 'Profile image uploaded successfully',
      file: {
        url: fileUrl,
        filename: req.file.filename,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size
      }
    });

  } catch (error) {
    // Clean up file if error occurs
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    console.error('Error uploading profile image:', error);
    res.status(500).json({
      error: 'Failed to upload profile image',
      details: error.message
    });
  }
});

// POST /uploads/school-logo - Upload school logo (admin/owner only)
router.post('/school-logo', authenticateToken, upload.single('school_logo'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'No school logo provided'
      });
    }

    // Only admins and owners can upload school logos
    if (!['admin', 'owner'].includes(req.user.role)) {
      // Clean up uploaded file
      fs.unlinkSync(req.file.path);
      return res.status(403).json({
        error: 'Only admins and owners can upload school logos'
      });
    }

    const fileUrl = `/uploads/school-logos/${req.user.schoolId}/${req.file.filename}`;

    // Update school logo URL in database
    const dbManager = require('../config/database');
    const db = dbManager.getDb();
    
    db.prepare('UPDATE schools SET logo_url = ? WHERE id = ?').run(fileUrl, req.user.schoolId);

    res.status(201).json({
      message: 'School logo uploaded successfully',
      file: {
        url: fileUrl,
        filename: req.file.filename,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size
      }
    });

  } catch (error) {
    // Clean up file if error occurs
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    console.error('Error uploading school logo:', error);
    res.status(500).json({
      error: 'Failed to upload school logo',
      details: error.message
    });
  }
});

// DELETE /uploads/:type/:filename - Delete uploaded file
router.delete('/:type/:filename', authenticateToken, (req, res) => {
  try {
    const { type, filename } = req.params;
    const allowedTypes = ['voice-notes', 'attachments', 'profiles', 'school-logos'];
    
    if (!allowedTypes.includes(type)) {
      return res.status(400).json({
        error: 'Invalid file type'
      });
    }

    let filePath;
    
    // Construct file path based on type
    if (type === 'school-logos' && ['admin', 'owner'].includes(req.user.role)) {
      filePath = path.join(__dirname, '../uploads', type, req.user.schoolId, filename);
    } else if (['voice-notes', 'attachments', 'profiles'].includes(type)) {
      filePath = path.join(__dirname, '../uploads', type, req.user.schoolId, req.user.userId, filename);
    } else {
      return res.status(403).json({
        error: 'Insufficient permissions to delete this file'
      });
    }

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        error: 'File not found'
      });
    }

    // Delete file
    fs.unlinkSync(filePath);

    res.json({
      message: 'File deleted successfully',
      filename: filename
    });

  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({
      error: 'Failed to delete file',
      details: error.message
    });
  }
});

// GET /uploads/info/:type/:filename - Get file information
router.get('/info/:type/:filename', authenticateToken, (req, res) => {
  try {
    const { type, filename } = req.params;
    const allowedTypes = ['voice-notes', 'attachments', 'profiles', 'school-logos'];
    
    if (!allowedTypes.includes(type)) {
      return res.status(400).json({
        error: 'Invalid file type'
      });
    }

    let filePath;
    
    // Construct file path based on type and permissions
    if (type === 'school-logos') {
      filePath = path.join(__dirname, '../uploads', type, req.user.schoolId, filename);
    } else {
      filePath = path.join(__dirname, '../uploads', type, req.user.schoolId, req.user.userId, filename);
    }

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        error: 'File not found'
      });
    }

    // Get file stats
    const stats = fs.statSync(filePath);
    const fileInfo = {
      filename: filename,
      type: type,
      size: stats.size,
      created: stats.birthtime,
      modified: stats.mtime,
      url: `/uploads/${type}/${req.user.schoolId}/${type === 'school-logos' ? '' : req.user.userId + '/'}${filename}`
    };

    res.json({ file: fileInfo });

  } catch (error) {
    console.error('Error getting file info:', error);
    res.status(500).json({
      error: 'Failed to get file information',
      details: error.message
    });
  }
});

// Error handling middleware for multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: 'File too large',
        maxSize: process.env.MAX_FILE_SIZE || '5MB'
      });
    } else if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        error: 'Too many files',
        maxFiles: 5
      });
    } else if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        error: 'Unexpected field name'
      });
    }
  }

  if (error.message.includes('Invalid file type')) {
    return res.status(400).json({
      error: error.message
    });
  }

  next(error);
});

module.exports = router;