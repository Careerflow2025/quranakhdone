import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5002';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if it exists
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle responses and errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

// Authentication functions
export async function login(email, password) {
  try {
    const { data } = await api.post('/auth/login', { email, password });
    if (data.token) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
    }
    return data;
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Login failed');
  }
}

export async function register(userData) {
  try {
    const { data } = await api.post('/auth/register', userData);
    if (data.token) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
    }
    return data;
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Registration failed');
  }
}

export async function logout() {
  try {
    await api.post('/auth/logout');
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
  }
}

export async function getCurrentUser() {
  try {
    const { data } = await api.get('/auth/me');
    return data;
  } catch (error) {
    return null;
  }
}

// School functions
export async function getMySchool() {
  try {
    const { data } = await api.get('/schools/my');
    return data;
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Failed to fetch school');
  }
}

export async function getSchoolUsers(filters = {}) {
  try {
    const params = new URLSearchParams(filters).toString();
    const { data } = await api.get(`/schools/my/users${params ? `?${params}` : ''}`);
    return data;
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Failed to fetch users');
  }
}

export async function getSchoolStats() {
  try {
    const { data } = await api.get('/schools/my/stats');
    return data;
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Failed to fetch stats');
  }
}

export async function createSchoolUser(userData) {
  try {
    const { data } = await api.post('/schools/my/users', userData);
    return data;
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Failed to create user');
  }
}

// Assignment functions
export async function getAssignments(filters = {}) {
  try {
    const params = new URLSearchParams(filters).toString();
    const { data } = await api.get(`/assignments${params ? `?${params}` : ''}`);
    return data;
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Failed to fetch assignments');
  }
}

export async function createAssignment(assignmentData) {
  try {
    const { data } = await api.post('/assignments', assignmentData);
    return data;
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Failed to create assignment');
  }
}

export async function updateAssignmentStatus(id, status) {
  try {
    const { data } = await api.patch(`/assignments/${id}/status`, { status });
    return data;
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Failed to update assignment');
  }
}

export async function submitAssignment(id, submissionData) {
  try {
    const { data } = await api.post(`/assignments/${id}/submit`, submissionData);
    return data;
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Failed to submit assignment');
  }
}

// Highlight functions
export async function getHighlights(filters = {}) {
  try {
    const params = new URLSearchParams(filters).toString();
    const { data } = await api.get(`/highlights${params ? `?${params}` : ''}`);
    return data;
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Failed to fetch highlights');
  }
}

export async function createHighlight(highlightData) {
  try {
    const { data } = await api.post('/highlights', highlightData);
    return data;
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Failed to create highlight');
  }
}

export async function deleteHighlight(id) {
  try {
    await api.delete(`/highlights/${id}`);
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Failed to delete highlight');
  }
}

// File upload
export async function uploadFile(file, type = 'voice') {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    const { data } = await api.post('/uploads', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return data;
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Failed to upload file');
  }
}

// Helper functions for compatibility
export async function getStudents(schoolId) {
  const users = await getSchoolUsers();
  return users.filter(user => user.role === 'student');
}

export async function getStudentHomework(studentId) {
  return await getAssignments({ student_id: studentId });
}

export async function createHomework(teacherId, studentId, surahNumber, ayahStart, ayahEnd, note, dueDate) {
  return await createAssignment({
    student_id: studentId,
    title: `Surah ${surahNumber}: Ayah ${ayahStart}-${ayahEnd}`,
    description: note,
    due_at: dueDate,
    type: 'homework'
  });
}

export async function getTeacherClasses(teacherId) {
  // This would need a specific endpoint in backend
  return [];
}

export async function getParentChildren(parentId) {
  // This would need a specific endpoint in backend
  return [];
}

export async function markAttendance(classId, studentId, status, teacherId) {
  // This would need a specific endpoint in backend
  return null;
}

export async function sendMessage(senderId, recipientId, subject, content) {
  // This would need a specific endpoint in backend
  return null;
}

export default api;