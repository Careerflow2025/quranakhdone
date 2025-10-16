import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { AuthService } from './auth';
import { ApiResponse } from '@/types';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: process.env.NODE_ENV === 'development' ? 'http://localhost:5001' : '/api',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = AuthService.getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor to handle errors
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          
          // Token expired, logout user
          AuthService.logout();
          return Promise.reject(error);
        }

        return Promise.reject(error);
      }
    );
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse<T> = await this.client.get(url, config);
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return this.handleError(error);
    }
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse<T> = await this.client.post(url, data, config);
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return this.handleError(error);
    }
  }

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse<T> = await this.client.put(url, data, config);
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return this.handleError(error);
    }
  }

  async patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse<T> = await this.client.patch(url, data, config);
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return this.handleError(error);
    }
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse<T> = await this.client.delete(url, config);
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return this.handleError(error);
    }
  }

  private handleError(error: any): ApiResponse<never> {
    const message = error.response?.data?.message || error.message || 'An error occurred';
    return {
      success: false,
      error: message,
    };
  }

  // File upload method
  async uploadFile<T>(url: string, file: File, onUploadProgress?: (progress: number) => void): Promise<ApiResponse<T>> {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response: AxiosResponse<T> = await this.client.post(url, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (onUploadProgress && progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onUploadProgress(progress);
          }
        },
      });

      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return this.handleError(error);
    }
  }
}

// Create a singleton instance
export const apiClient = new ApiClient();

// API endpoints
export const authApi = {
  login: (credentials: { email: string; password: string }) =>
    apiClient.post('/auth/login', credentials),
  
  register: (userData: { 
    email: string; 
    password: string; 
    display_name: string; 
    role: string; 
    school_id?: string;
  }) =>
    apiClient.post('/auth/register', userData),
  
  refreshToken: () =>
    apiClient.post('/auth/refresh'),
  
  logout: () =>
    apiClient.post('/auth/logout'),
  
  getProfile: () =>
    apiClient.get('/auth/profile'),
};

export const assignmentApi = {
  getAssignments: (params?: { student_id?: string; teacher_id?: string; status?: string }) =>
    apiClient.get('/assignments', { params }),
  
  createAssignment: (data: any) =>
    apiClient.post('/assignments', data),
  
  getAssignment: (id: string) =>
    apiClient.get(`/assignments/${id}`),
  
  updateAssignment: (id: string, data: any) =>
    apiClient.put(`/assignments/${id}`, data),
  
  submitAssignment: (id: string, data: any) =>
    apiClient.post(`/assignments/${id}/submit`, data),
  
  transitionAssignment: (id: string, status: string) =>
    apiClient.post(`/assignments/${id}/transition`, { to_status: status }),
  
  deleteAssignment: (id: string) =>
    apiClient.delete(`/assignments/${id}`),
};

export const highlightApi = {
  getHighlights: (params?: { student_id?: string; ayah_id?: string }) =>
    apiClient.get('/highlights', { params }),
  
  createHighlight: (data: any) =>
    apiClient.post('/highlights', data),
  
  updateHighlight: (id: string, data: any) =>
    apiClient.put(`/highlights/${id}`, data),
  
  deleteHighlight: (id: string) =>
    apiClient.delete(`/highlights/${id}`),
};

export const noteApi = {
  createNote: (data: any) =>
    apiClient.post('/notes', data),
  
  updateNote: (id: string, data: any) =>
    apiClient.put(`/notes/${id}`, data),
  
  deleteNote: (id: string) =>
    apiClient.delete(`/notes/${id}`),
};

export const quranApi = {
  getAyahs: (params: { surah: number; script?: string }) =>
    apiClient.get('/quran/ayahs', { params }),
  
  getScripts: () =>
    apiClient.get('/quran/scripts'),
};

export const gradebookApi = {
  getGrades: (params?: { assignment_id?: string; student_id?: string }) =>
    apiClient.get('/grades', { params }),
  
  createGrade: (data: any) =>
    apiClient.post('/grades', data),
  
  updateGrade: (id: string, data: any) =>
    apiClient.put(`/grades/${id}`, data),
  
  getRubrics: () =>
    apiClient.get('/rubrics'),
  
  createRubric: (data: any) =>
    apiClient.post('/rubrics', data),
};

export const dashboardApi = {
  getStats: (role: string) =>
    apiClient.get(`/schools/my/stats?role=${role}`),

  getRecentActivity: () =>
    apiClient.get('/schools/my/stats'),
};

export const teacherApi = {
  getTeachers: (params?: { school_id?: string }) =>
    apiClient.get('/teachers', { params }),

  getTeacher: (id: string) =>
    apiClient.get(`/teachers/${id}`),

  createTeacher: (data: any) =>
    apiClient.post('/teachers', data),

  updateTeacher: (id: string, data: any) =>
    apiClient.put(`/teachers/${id}`, data),

  deleteTeacher: (id: string) =>
    apiClient.delete(`/teachers/${id}`),

  getTeacherClasses: (id: string) =>
    apiClient.get(`/teachers/${id}/classes`),

  getTeacherStudents: (id: string) =>
    apiClient.get(`/teachers/${id}/students`),
};

export const studentApi = {
  getStudents: (params?: { school_id?: string; class_id?: string }) =>
    apiClient.get('/students', { params }),

  getStudent: (id: string) =>
    apiClient.get(`/students/${id}`),

  createStudent: (data: any) =>
    apiClient.post('/students', data),

  updateStudent: (id: string, data: any) =>
    apiClient.put(`/students/${id}`, data),

  deleteStudent: (id: string) =>
    apiClient.delete(`/students/${id}`),

  getStudentProgress: (id: string) =>
    apiClient.get(`/students/${id}/progress`),

  getStudentAssignments: (id: string) =>
    apiClient.get(`/students/${id}/assignments`),

  bulkImport: (file: File, onProgress?: (progress: number) => void) =>
    apiClient.uploadFile('/students/bulk-import', file, onProgress),
};

export const classApi = {
  getClasses: (params?: { school_id?: string; teacher_id?: string }) =>
    apiClient.get('/classes', { params }),

  getClass: (id: string) =>
    apiClient.get(`/classes/${id}`),

  createClass: (data: any) =>
    apiClient.post('/classes', data),

  updateClass: (id: string, data: any) =>
    apiClient.put(`/classes/${id}`, data),

  deleteClass: (id: string) =>
    apiClient.delete(`/classes/${id}`),

  getClassStudents: (id: string) =>
    apiClient.get(`/classes/${id}/students`),

  addStudentToClass: (classId: string, studentId: string) =>
    apiClient.post(`/classes/${classId}/students`, { student_id: studentId }),

  removeStudentFromClass: (classId: string, studentId: string) =>
    apiClient.delete(`/classes/${classId}/students/${studentId}`),

  getClassTeachers: (id: string) =>
    apiClient.get(`/classes/${id}/teachers`),

  addTeacherToClass: (classId: string, teacherId: string) =>
    apiClient.post(`/classes/${classId}/teachers`, { teacher_id: teacherId }),
};