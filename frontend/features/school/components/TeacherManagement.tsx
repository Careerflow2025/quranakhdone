'use client';

import { useState } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Mail, 
  Phone,
  Edit,
  Trash2,
  UserCheck,
  UserX,
  Download,
  Upload,
  Eye,
  EyeOff,
  Copy,
  Check
} from 'lucide-react';
import { useSchoolStore } from '../state/useSchoolStore';
import { motion, AnimatePresence } from 'framer-motion';
import { generateSecurePassword } from '@/lib/supabase-auth-service';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function TeacherManagement() {
  const { teachers, classes, addTeacher, updateTeacher, removeTeacher } = useSchoolStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<any>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [copiedCredentials, setCopiedCredentials] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState<{email: string; password: string} | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    specialization: '',
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
              filterStatus === 'inactive' ? 'bg-gray-200 text-gray-700' : 'text-gray-600 hover:bg-gray-100'
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
            className="bg-white rounded-lg border hover:shadow-lg transition-shadow p-5"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                  {teacher.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{teacher.name}</h3>
                  <p className="text-xs text-gray-500">{teacher.specialization || 'Quran Teacher'}</p>
                </div>
              </div>
              <button className="p-1 hover:bg-gray-100 rounded">
                <MoreVertical className="w-4 h-4 text-gray-400" />
              </button>
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <Mail className="w-4 h-4" />
                <span className="text-xs">{teacher.email}</span>
              </div>
              {teacher.phone && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Phone className="w-4 h-4" />
                  <span className="text-xs">{teacher.phone}</span>
                </div>
              )}
            </div>
            
            <div className="mt-4 pt-4 border-t grid grid-cols-2 gap-3 text-center">
              <div>
                <p className="text-2xl font-bold text-gray-900">{teacher.classCount}</p>
                <p className="text-xs text-gray-500">Classes</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{teacher.studentCount}</p>
                <p className="text-xs text-gray-500">Students</p>
              </div>
            </div>
            
            {teacher.performance && (
              <div className="mt-4 pt-4 border-t">
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="text-gray-600">Student Progress</span>
                  <span className="font-medium">{teacher.performance.avgStudentProgress}%</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-green-400 to-green-600"
                    style={{ width: `${teacher.performance.avgStudentProgress}%` }}
                  />
                </div>
              </div>
            )}
            
            <div className="mt-4 flex items-center justify-between">
              <span className={`text-xs px-2 py-1 rounded-full ${
                teacher.status === 'active' ? 'bg-green-100 text-green-700' :
                teacher.status === 'inactive' ? 'bg-gray-100 text-gray-700' :
                'bg-yellow-100 text-yellow-700'
              }`}>
                {teacher.status}
              </span>
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => {
                    setSelectedTeacher(teacher);
                    setFormData({
                      name: teacher.name,
                      email: teacher.email,
                      phone: teacher.phone || '',
                      password: '',
                      specialization: teacher.specialization || 'Quran Memorization',
                      qualifications: teacher.certifications?.join(', ') || '',
                      experience: teacher.experience || '',
                      assignedClasses: []
                    });
                    setShowEditModal(true);
                  }}
                  className="p-1.5 hover:bg-blue-50 rounded text-blue-600"
                >
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
            onClick={() => setShowAddModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-xl p-6 w-full max-w-md"
            >
              <h3 className="text-xl font-bold mb-4">Add New Teacher</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter teacher's full name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="teacher@example.com"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="+1 234 567 8900"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Specialization</label>
                  <select 
                    value={formData.specialization}
                    onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option>Quran Memorization</option>
                    <option>Tajweed</option>
                    <option>Islamic Studies</option>
                    <option>Arabic Language</option>
                  </select>
                </div>
              </div>
              
              <div className="flex items-center gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setFormData({ name: '', email: '', phone: '', password: '', specialization: 'Quran Memorization', qualifications: '', experience: '', assignedClasses: [] });
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (formData.name && formData.email) {
                      addTeacher({
                        id: crypto.randomUUID(),
                        name: formData.name,
                        email: formData.email,
                        phone: formData.phone,
                        specialization: formData.specialization,
                        joinDate: new Date().toISOString(),
                        status: 'active',
                        classCount: 0,
                        studentCount: 0,
                        subjects: []
                      });
                      setShowAddModal(false);
                      setFormData({ name: '', email: '', phone: '', password: '', specialization: 'Quran Memorization', qualifications: '', experience: '', assignedClasses: [] });
                    }
                  }}
                  disabled={!formData.name || !formData.email}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add Teacher
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Edit Teacher Modal */}
      <AnimatePresence>
        {showEditModal && selectedTeacher && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={() => setShowEditModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-xl p-6 w-full max-w-md"
            >
              <h3 className="text-xl font-bold mb-4">Edit Teacher</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Specialization</label>
                  <select 
                    value={formData.specialization}
                    onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option>Quran Memorization</option>
                    <option>Tajweed</option>
                    <option>Islamic Studies</option>
                    <option>Arabic Language</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select 
                    value={selectedTeacher.status}
                    onChange={(e) => setSelectedTeacher({ ...selectedTeacher, status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="on_leave">On Leave</option>
                  </select>
                </div>
              </div>
              
              <div className="flex items-center gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setFormData({ name: '', email: '', phone: '', password: '', specialization: 'Quran Memorization', qualifications: '', experience: '', assignedClasses: [] });
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (formData.name && formData.email) {
                      updateTeacher(selectedTeacher.id, {
                        name: formData.name,
                        email: formData.email,
                        phone: formData.phone,
                        specialization: formData.specialization,
                        status: selectedTeacher.status
                      });
                      setShowEditModal(false);
                      setFormData({ name: '', email: '', phone: '', password: '', specialization: 'Quran Memorization', qualifications: '', experience: '', assignedClasses: [] });
                    }
                  }}
                  disabled={!formData.name || !formData.email}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Save Changes
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}