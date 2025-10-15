'use client';

import { useState, useEffect } from 'react';
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
  Upload
} from 'lucide-react';
import { useSchoolStore } from '../state/useSchoolStore';
import { motion, AnimatePresence } from 'framer-motion';
import { generateSecurePassword } from '@/lib/auth-client';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function TeacherManagementV2() {
  const { teachers, classes, addTeacher, removeTeacher } = useSchoolStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [copiedCredentials, setCopiedCredentials] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState<any>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    qualifications: '',
    experience: '',
    assignedClasses: [] as string[]
  });
  
  const filteredTeachers = teachers.filter(teacher => {
    const matchesSearch = teacher.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          teacher.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || teacher.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handleCreateTeacher = async () => {
    if (!formData.name || !formData.email || !formData.password) {
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
      
      // Call API to create teacher
      const response = await fetch('/api/auth/create-teacher', {
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
        
        // Add to local store
        addTeacher({
          id: result.teacher.id,
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          certifications: formData.qualifications ? [formData.qualifications] : [],
          experience: formData.experience,
          joinDate: new Date().toISOString(),
          status: 'active',
          classCount: formData.assignedClasses.length,
          studentCount: 0,
          subjects: []
        });
      } else {
        setError(result.error || 'Failed to create teacher');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create teacher');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      password: '',
      qualifications: '',
      experience: '',
      assignedClasses: []
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
          <h2 className="text-2xl font-bold text-gray-900">Teacher Management</h2>
          <p className="text-sm text-gray-600 mt-1">Manage your teaching staff and assignments</p>
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
            Add Teacher
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
            placeholder="Search teachers by name or email..."
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-2 rounded-lg text-sm font-medium ${
              filterStatus === 'all' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            All ({teachers.length})
          </button>
          <button
            onClick={() => setFilterStatus('active')}
            className={`px-3 py-2 rounded-lg text-sm font-medium ${
              filterStatus === 'active' ? 'bg-green-100 text-green-700' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Active ({teachers.filter(t => t.status === 'active').length})
          </button>
          <button
            onClick={() => setFilterStatus('inactive')}
            className={`px-3 py-2 rounded-lg text-sm font-medium ${
              filterStatus === 'inactive' ? 'bg-gray-100 text-gray-700' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Inactive ({teachers.filter(t => t.status === 'inactive').length})
          </button>
        </div>
      </div>
      
      {/* Teachers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTeachers.map((teacher) => (
          <motion.div
            key={teacher.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl border p-5 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">{teacher.name}</h3>
                <div className="flex items-center gap-2 mt-1 text-sm text-gray-600">
                  <Mail className="w-3.5 h-3.5" />
                  {teacher.email}
                </div>
                {teacher.phone && (
                  <div className="flex items-center gap-2 mt-1 text-sm text-gray-600">
                    <Phone className="w-3.5 h-3.5" />
                    {teacher.phone}
                  </div>
                )}
              </div>
              <span className={`px-2 py-1 text-xs rounded-full ${
                teacher.status === 'active'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-700'
              }`}>
                {teacher.status}
              </span>
            </div>

            <div className="space-y-2 text-sm">
              {teacher.certifications && teacher.certifications.length > 0 && (
                <div>
                  <span className="text-gray-500">Certifications:</span>
                  <span className="ml-2 text-gray-700">{teacher.certifications.join(', ')}</span>
                </div>
              )}
              {teacher.experience && (
                <div>
                  <span className="text-gray-500">Experience:</span>
                  <span className="ml-2 text-gray-700">{teacher.experience}</span>
                </div>
              )}
              <div className="flex items-center justify-between pt-2 border-t">
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span>{teacher.classCount || 0} Classes</span>
                  <span>{teacher.studentCount || 0} Students</span>
                </div>
                <div className="flex items-center gap-1">
                  <button className="p-1.5 hover:bg-blue-50 rounded text-blue-600">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => {
                      if (confirm(`Are you sure you want to remove ${teacher.name}?`)) {
                        removeTeacher(teacher.id);
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
      
      {/* Add Teacher Modal */}
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
              <h3 className="text-xl font-bold mb-4">Create Teacher Account</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter teacher's full name"
                    disabled={isLoading || !!createdCredentials}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="teacher@example.com"
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
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
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
                        setFormData({ ...formData, password });
                      }}
                      className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
                      disabled={isLoading || !!createdCredentials}
                    >
                      Generate
                    </button>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="+1 234 567 8900"
                    disabled={isLoading || !!createdCredentials}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Qualifications</label>
                  <input
                    type="text"
                    value={formData.qualifications}
                    onChange={(e) => setFormData({ ...formData, qualifications: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Ijazah in Quran Recitation"
                    disabled={isLoading || !!createdCredentials}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Experience</label>
                  <input
                    type="text"
                    value={formData.experience}
                    onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., 5 years teaching"
                    disabled={isLoading || !!createdCredentials}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Assign Classes</label>
                  <div className="space-y-2 max-h-32 overflow-y-auto border border-gray-200 rounded-lg p-2">
                    {classes.map(cls => (
                      <label key={cls.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                        <input
                          type="checkbox"
                          checked={formData.assignedClasses.includes(cls.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({ ...formData, assignedClasses: [...formData.assignedClasses, cls.id] });
                            } else {
                              setFormData({ ...formData, assignedClasses: formData.assignedClasses.filter(id => id !== cls.id) });
                            }
                          }}
                          className="rounded text-blue-600 focus:ring-blue-500"
                          disabled={isLoading || !!createdCredentials}
                        />
                        <span className="text-sm">{cls.name}</span>
                      </label>
                    ))}
                    {classes.length === 0 && (
                      <p className="text-sm text-gray-500 text-center py-2">No classes available</p>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Error message */}
              {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}
              
              {/* Success message with credentials */}
              {createdCredentials && (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h4 className="font-medium text-green-800 mb-2">✅ Teacher Account Created Successfully!</h4>
                  <div className="space-y-2 bg-white p-3 rounded border border-green-300">
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
                      const text = `Teacher Login Credentials\n\nEmail: ${createdCredentials.email}\nPassword: ${createdCredentials.password}\nLogin URL: ${createdCredentials.loginUrl}`;
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
              
              <div className="flex items-center gap-3 mt-6">
                {createdCredentials ? (
                  <button
                    onClick={() => {
                      setShowAddModal(false);
                      resetForm();
                    }}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Close & Create Another
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
                      onClick={handleCreateTeacher}
                      disabled={!formData.name || !formData.email || !formData.password || isLoading}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? 'Creating...' : 'Create Teacher'}
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