const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    const allowedRoles = Array.isArray(roles) ? roles : [roles];
    
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        code: 'PERMISSION_DENIED',
        required: allowedRoles,
        current: req.user.role
      });
    }

    next();
  };
};

const requireOwnerOrAdmin = requireRole(['owner', 'admin']);
const requireTeacher = requireRole(['owner', 'admin', 'teacher']);
const requireStudent = requireRole(['student']);
const requireParent = requireRole(['parent']);

const checkSchoolAccess = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      error: 'Authentication required',
      code: 'AUTH_REQUIRED'
    });
  }

  // Extract school_id from request parameters or body
  const requestedSchoolId = req.params.schoolId || req.body.school_id || req.query.school_id;
  
  if (requestedSchoolId && requestedSchoolId !== req.user.schoolId) {
    return res.status(403).json({ 
      error: 'Access denied to this school',
      code: 'SCHOOL_ACCESS_DENIED'
    });
  }

  next();
};

const checkResourceOwnership = (resourceType) => {
  return (req, res, next) => {
    const dbManager = require('../config/database');
    const db = dbManager.getDb();
    
    const resourceId = req.params.id;
    if (!resourceId) {
      return res.status(400).json({ 
        error: 'Resource ID required',
        code: 'RESOURCE_ID_MISSING'
      });
    }

    try {
      let query, params;
      
      switch (resourceType) {
        case 'assignment':
          // Check if user is the teacher who created the assignment or student assigned to it
          if (req.user.role === 'teacher') {
            query = `
              SELECT a.id FROM assignments a
              INNER JOIN teachers t ON t.id = a.created_by_teacher_id
              WHERE a.id = ? AND t.user_id = ? AND a.school_id = ?
            `;
            params = [resourceId, req.user.userId, req.user.schoolId];
          } else if (req.user.role === 'student') {
            query = `
              SELECT a.id FROM assignments a
              INNER JOIN students s ON s.id = a.student_id
              WHERE a.id = ? AND s.user_id = ? AND a.school_id = ?
            `;
            params = [resourceId, req.user.userId, req.user.schoolId];
          } else if (['owner', 'admin'].includes(req.user.role)) {
            query = `
              SELECT id FROM assignments
              WHERE id = ? AND school_id = ?
            `;
            params = [resourceId, req.user.schoolId];
          }
          break;
          
        case 'highlight':
          // Check if user is the teacher who created the highlight or student it belongs to
          if (req.user.role === 'teacher') {
            query = `
              SELECT h.id FROM highlights h
              INNER JOIN teachers t ON t.id = h.teacher_id
              WHERE h.id = ? AND t.user_id = ? AND h.school_id = ?
            `;
            params = [resourceId, req.user.userId, req.user.schoolId];
          } else if (req.user.role === 'student') {
            query = `
              SELECT h.id FROM highlights h
              INNER JOIN students s ON s.id = h.student_id
              WHERE h.id = ? AND s.user_id = ? AND h.school_id = ?
            `;
            params = [resourceId, req.user.userId, req.user.schoolId];
          } else if (['owner', 'admin'].includes(req.user.role)) {
            query = `
              SELECT id FROM highlights
              WHERE id = ? AND school_id = ?
            `;
            params = [resourceId, req.user.schoolId];
          }
          break;
          
        default:
          return res.status(400).json({ 
            error: 'Unknown resource type',
            code: 'UNKNOWN_RESOURCE_TYPE'
          });
      }

      if (!query) {
        return res.status(403).json({ 
          error: 'Access denied to this resource',
          code: 'RESOURCE_ACCESS_DENIED'
        });
      }

      const resource = db.prepare(query).get(...params);
      
      if (!resource) {
        return res.status(404).json({ 
          error: `${resourceType} not found or access denied`,
          code: 'RESOURCE_NOT_FOUND'
        });
      }

      next();
    } catch (error) {
      console.error('Error checking resource ownership:', error);
      return res.status(500).json({ 
        error: 'Error checking resource access',
        code: 'RESOURCE_CHECK_ERROR'
      });
    }
  };
};

module.exports = {
  requireRole,
  requireOwnerOrAdmin,
  requireTeacher,
  requireStudent,
  requireParent,
  checkSchoolAccess,
  checkResourceOwnership
};