'use client';

import { useState } from 'react';
import { 
  Plus, 
  Search, 
  Mail, 
  Phone,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Copy,
  Check,
  Download,
  Upload,
  Users,
  User,
  Calendar
} from 'lucide-react';
import { useSchoolStore } from '../state/useSchoolStore';
import { useStudents } from '@/hooks/useStudents';
import { motion, AnimatePresence } from 'framer-motion';
import { generateSecurePassword } from '@/lib/auth-client';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function StudentManagementV2() {
  // Get students from API instead of local Zustand state
  const { students, isLoading: studentsLoading, error: studentsError, deleteStudent, refreshStudents } = useStudents();
  // Keep classes from Zustand for now (can be migrated later)
  const { classes } = useSchoolStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [filterClass, setFilterClass] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [copiedCredentials, setCopiedCredentials] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState<any>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    // Student info
    studentName: '',
    dateOfBirth: '',
    classId: '',
    
    // Parent info
    parentName: '',
    parentEmail: '',
    parentPassword: '',
    parentPhone: '',
    relationship: 'parent' as 'father' | 'mother' | 'guardian' | 'parent'
  });
  
  const filteredStudents = students.filter(student => {
    // Support both first_name/last_name and name formats
    const fullName = `${student.first_name || ''} ${student.last_name || ''}`.toLowerCase();
    const studentName = (student.name || '').toLowerCase();
    const matchesSearch = fullName.includes(searchTerm.toLowerCase()) ||
                          studentName.includes(searchTerm.toLowerCase()) ||
                          (student.email?.toLowerCase().includes(searchTerm.toLowerCase()) || false);
    const matchesClass = filterClass === 'all'; // Class filtering needs classId mapping
    return matchesSearch && matchesClass;
  });

  const handleCreateStudent = async () => {
    if (!formData.studentName || !formData.classId || !formData.parentEmail || !formData.parentPassword) {
      setError('Please fill all required fields');
      return;
    }

    setIsLoading(true);
    setError('');
    
    try {
      // Get current user session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('Please login as school administrator');
        setIsLoading(false);
        return;
      }
      
      // Call API to create student with parent
      const response = await fetch('/api/auth/create-student-parent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(formData)
      });
      
      const result = await response.json();
      
      if (result.success) {
        // Show success with credentials
        setCreatedCredentials(result.credentials);

        // Refresh students list from API instead of updating Zustand
        await refreshStudents();
      } else {
        setError(result.error || 'Failed to create student and parent accounts');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create accounts');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      studentName: '',
      dateOfBirth: '',
      classId: '',
      parentName: '',
      parentEmail: '',
      parentPassword: '',
      parentPhone: '',
      relationship: 'parent'
    });
    setError('');
    setCreatedCredentials(null);
    setShowPassword(false);
  };
  
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Student Management</h2>
          <p className="text-sm text-gray-600 mt-1">Manage students and their parent accounts</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2">
            <Upload className="w-4 h-4" />
            Import
          </button>
          <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Student
          </button>
        </div>
      </div>
      
      {/* Filters */}
      <div className="flex items-center gap-4 bg-white p-4 rounded-lg border">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search students by name or parent email..."
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <select
            value={filterClass}
            onChange={(e) => setFilterClass(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Classes</option>
            {classes.map(cls => (
              <option key={cls.id} value={cls.id}>{cls.name}</option>
            ))}
          </select>
        </div>
      </div>
      
      {/* Students Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredStudents.map((student) => (
          <motion.div
            key={student.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl border p-5 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">
                  {student.name || `${student.first_name || ''} ${student.last_name || ''}`.trim() || 'Unnamed Student'}
                </h3>
                <div className="text-sm text-gray-600 mt-1">
                  {student.grade ? `Grade: ${student.grade}` : 'Grade: Not Set'}
                </div>
              </div>
              <span className={`px-2 py-1 text-xs rounded-full ${
                student.active !== false
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-700'
              }`}>
                {student.active !== false ? 'active' : 'inactive'}
              </span>
            </div>

            <div className="space-y-2 text-sm">
              {student.email && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Mail className="w-3.5 h-3.5" />
                  <span className="truncate">{student.email}</span>
                </div>
              )}
              {student.phone && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Phone className="w-3.5 h-3.5" />
                  <span>{student.phone}</span>
                </div>
              )}
              {student.age && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Age: {student.age}</span>
                </div>
              )}

              <div className="flex items-center justify-between pt-2 border-t">
                <div className="text-xs text-gray-500">
                  ID: {student.id.substring(0, 8)}...
                </div>
                <div className="flex items-center gap-1">
                  <button className="p-1.5 hover:bg-blue-50 rounded text-blue-600">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={async () => {
                      const studentName = student.name || `${student.first_name || ''} ${student.last_name || ''}`.trim() || 'this student';
                      if (confirm(`Are you sure you want to remove ${studentName}?`)) {
                        const result = await deleteStudent(student.id);
                        if (!result.success) {
                          alert(`Failed to delete student: ${result.error}`);
                        }
                      }
                    }}
                    className="p-1.5 hover:bg-red-50 rounded text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
      
      {/* Add Student Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={() => !createdCredentials && setShowAddModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto"
            >
              <h3 className="text-xl font-bold mb-4">Create Student & Parent Account</h3>
              
              {/* Student Information */}
              <div className="mb-6">
                <h4 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Student Information
                </h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Student Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.studentName}
                      onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter student's full name"
                      disabled={isLoading || !!createdCredentials}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                    <input
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={isLoading || !!createdCredentials}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Class <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.classId}
                      onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={isLoading || !!createdCredentials}
                    >
                      <option value="">Select a class</option>
                      {classes.map(cls => (
                        <option key={cls.id} value={cls.id}>{cls.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              
              {/* Parent Information */}
              <div className="mb-4">
                <h4 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Parent Account Information
                </h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Parent Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.parentName}
                      onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter parent's full name"
                      disabled={isLoading || !!createdCredentials}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Parent Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={formData.parentEmail}
                      onChange={(e) => setFormData({ ...formData, parentEmail: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="parent@example.com"
                      disabled={isLoading || !!createdCredentials}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Password <span className="text-red-500">*</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={formData.parentPassword}
                          onChange={(e) => setFormData({ ...formData, parentPassword: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter password"
                          disabled={isLoading || !!createdCredentials}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const password = generateSecurePassword();
                          setFormData({ ...formData, parentPassword: password });
                        }}
                        className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
                        disabled={isLoading || !!createdCredentials}
                      >
                        Generate
                      </button>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Parent Phone</label>
                    <input
                      type="tel"
                      value={formData.parentPhone}
                      onChange={(e) => setFormData({ ...formData, parentPhone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="+1 234 567 8900"
                      disabled={isLoading || !!createdCredentials}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Relationship</label>
                    <select
                      value={formData.relationship}
                      onChange={(e) => setFormData({ ...formData, relationship: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={isLoading || !!createdCredentials}
                    >
                      <option value="parent">Parent</option>
                      <option value="father">Father</option>
                      <option value="mother">Mother</option>
                      <option value="guardian">Guardian</option>
                    </select>
                  </div>
                </div>
              </div>
              
              {/* Error message */}
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}
              
              {/* Success message with credentials */}
              {createdCredentials && (
                <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h4 className="font-medium text-green-800 mb-2">✅ Accounts Created Successfully!</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    Student "{createdCredentials.childName}" has been enrolled.
                  </p>
                  <div className="space-y-2 bg-white p-3 rounded border border-green-300">
                    <h5 className="font-medium text-gray-700">Parent Login Credentials:</h5>
                    <div className="text-sm">
                      <span className="text-gray-600">Email:</span>
                      <span className="ml-2 font-mono text-gray-900">{createdCredentials.email}</span>
                    </div>
                    <div className="text-sm">
                      <span className="text-gray-600">Password:</span>
                      <span className="ml-2 font-mono text-gray-900">{createdCredentials.password}</span>
                    </div>
                    <div className="text-sm">
                      <span className="text-gray-600">Login URL:</span>
                      <span className="ml-2 font-mono text-gray-900 text-xs break-all">{createdCredentials.loginUrl}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      const text = `Parent Login Credentials for ${createdCredentials.childName}\n\nEmail: ${createdCredentials.email}\nPassword: ${createdCredentials.password}\nLogin URL: ${createdCredentials.loginUrl}`;
                      navigator.clipboard.writeText(text);
                      setCopiedCredentials(true);
                      setTimeout(() => setCopiedCredentials(false), 2000);
                    }}
                    className="mt-3 w-full px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
                  >
                    {copiedCredentials ? (
                      <><Check className="w-4 h-4" /> Copied!</>
                    ) : (
                      <><Copy className="w-4 h-4" /> Copy Credentials</>
                    )}
                  </button>
                </div>
              )}
              
              <div className="flex items-center gap-3">
                {createdCredentials ? (
                  <button
                    onClick={() => {
                      setShowAddModal(false);
                      resetForm();
                    }}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Close & Add Another Student
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        setShowAddModal(false);
                        resetForm();
                      }}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleCreateStudent}
                      disabled={!formData.studentName || !formData.classId || !formData.parentEmail || !formData.parentPassword || isLoading}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? 'Creating...' : 'Create Accounts'}
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}