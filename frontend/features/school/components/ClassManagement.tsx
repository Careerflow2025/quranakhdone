'use client';

import { useState } from 'react';
import { 
  Plus, 
  Calendar, 
  Users, 
  Clock,
  Edit,
  Trash2,
  ArrowRight,
  BookOpen,
  ChevronRight
} from 'lucide-react';
import { useSchoolStore } from '../state/useSchoolStore';
import { motion, AnimatePresence } from 'framer-motion';

export default function ClassManagement() {
  const { classes, teachers, students, addClass, updateClass, removeClass, reassignClass, updateTeacher } = useSchoolStore();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [selectedClassForReassign, setSelectedClassForReassign] = useState<string | null>(null);
  const [selectedClassForEdit, setSelectedClassForEdit] = useState<any>(null);
  const [newTeacherId, setNewTeacherId] = useState<string>('');
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    teacherId: '',
    schedule: '',
    room: '',
    level: 'Beginner'
  });
  
  const handleReassignTeacher = () => {
    if (selectedClassForReassign && newTeacherId) {
      reassignClass(selectedClassForReassign, newTeacherId);
      setShowReassignModal(false);
      setSelectedClassForReassign(null);
      setNewTeacherId('');
    }
  };
  
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Class Management</h2>
          <p className="text-sm text-gray-600 mt-1">Organize classes and assign teachers</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Create Class
        </button>
      </div>
      
      {/* Classes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {classes.map((cls) => {
          const teacher = teachers.find(t => t.id === cls.teacherId);
          const classStudents = students.filter(s => s.classId === cls.id);
          
          return (
            <motion.div
              key={cls.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl border hover:shadow-xl transition-all duration-300 overflow-hidden group"
            >
              {/* Class Header */}
              <div className="p-5 border-b bg-gradient-to-r from-blue-50 to-purple-50">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white">
                      <BookOpen className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">{cls.name}</h3>
                      {cls.level && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                          {cls.level}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    cls.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                  }`}>
                    {cls.status}
                  </span>
                </div>
                
                {/* Schedule */}
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span>{cls.schedule}</span>
                </div>
                {cls.room && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                    <Clock className="w-4 h-4" />
                    <span>Room {cls.room}</span>
                  </div>
                )}
              </div>
              
              {/* Teacher Section */}
              <div className="p-5 border-b">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Assigned Teacher</span>
                  <button
                    onClick={() => {
                      setSelectedClassForReassign(cls.id);
                      setShowReassignModal(true);
                    }}
                    className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    Reassign
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
                {teacher ? (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      {teacher.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{teacher.name}</p>
                      <p className="text-xs text-gray-500">{teacher.email}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 italic">No teacher assigned</p>
                )}
              </div>
              
              {/* Students Section */}
              <div className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-700">Students</span>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-bold text-gray-900">{classStudents.length}</span>
                  </div>
                </div>
                
                {/* Student Avatars */}
                <div className="flex -space-x-2">
                  {classStudents.slice(0, 5).map((student, idx) => (
                    <div
                      key={student.id}
                      className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold border-2 border-white"
                      style={{ zIndex: 5 - idx }}
                    >
                      {student.name.charAt(0).toUpperCase()}
                    </div>
                  ))}
                  {classStudents.length > 5 && (
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 text-xs font-bold border-2 border-white">
                      +{classStudents.length - 5}
                    </div>
                  )}
                </div>
                
                {/* Progress Overview */}
                <div className="mt-4 pt-4 border-t">
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="text-gray-600">Class Progress</span>
                    <span className="font-medium">
                      {classStudents.length > 0
                        ? Math.round(classStudents.reduce((acc, s) => acc + (typeof s.progress === 'number' ? s.progress : 0), 0) / classStudents.length)
                        : 0}%
                    </span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-400 to-purple-600"
                      style={{
                        width: `${classStudents.length > 0
                          ? Math.round(classStudents.reduce((acc, s) => acc + (typeof s.progress === 'number' ? s.progress : 0), 0) / classStudents.length)
                          : 0}%`
                      }}
                    />
                  </div>
                </div>
              </div>
              
              {/* Actions */}
              <div className="px-5 pb-5 flex items-center gap-2">
                <button 
                  onClick={() => {
                    setSelectedClassForEdit(cls);
                    setFormData({
                      name: cls.name,
                      teacherId: cls.teacherId,
                      schedule: cls.schedule,
                      room: cls.room || '',
                      level: cls.level || 'Beginner'
                    });
                    setShowEditModal(true);
                  }}
                  className="flex-1 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 text-sm font-medium flex items-center justify-center gap-2"
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </button>
                <button 
                  onClick={() => {
                    if (confirm(`Are you sure you want to delete ${cls.name}?`)) {
                      removeClass(cls.id);
                    }
                  }}
                  className="flex-1 px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 text-sm font-medium flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            </motion.div>
          );
        })}
        
        {/* Add New Class Card */}
        <motion.button
          onClick={() => setShowAddModal(true)}
          className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl p-8 hover:border-blue-400 hover:bg-blue-50 transition-all group flex flex-col items-center justify-center min-h-[400px]"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="w-16 h-16 bg-gray-200 group-hover:bg-blue-100 rounded-full flex items-center justify-center mb-4 transition-colors">
            <Plus className="w-8 h-8 text-gray-400 group-hover:text-blue-600" />
          </div>
          <p className="text-gray-600 group-hover:text-blue-600 font-medium">Create New Class</p>
          <p className="text-sm text-gray-400 mt-1">Click to add a new class</p>
        </motion.button>
      </div>
      
      {/* Add Class Modal */}
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
              <h3 className="text-xl font-bold mb-4">Create New Class</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Class Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Quran Memorization - Level 1"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Assign Teacher</label>
                  <select 
                    value={formData.teacherId}
                    onChange={(e) => setFormData({...formData, teacherId: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">Select a teacher</option>
                    {teachers.filter(t => t.status === 'active').map(teacher => (
                      <option key={teacher.id} value={teacher.id}>{teacher.name}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Schedule</label>
                  <input
                    type="text"
                    value={formData.schedule}
                    onChange={(e) => setFormData({...formData, schedule: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Mon, Wed, Fri - 4:00 PM"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Room (Optional)</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Room 101"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Level</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option>Beginner</option>
                    <option>Intermediate</option>
                    <option>Advanced</option>
                    <option>Memorization</option>
                  </select>
                </div>
              </div>
              
              <div className="flex items-center gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setFormData({ name: '', teacherId: '', schedule: '', room: '', level: 'Beginner' });
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    const teacher = teachers.find(t => t.id === formData.teacherId);
                    addClass({
                      id: crypto.randomUUID(),
                      name: formData.name || 'New Class',
                      teacherId: formData.teacherId || '',
                      teacherName: teacher?.name || '',
                      schedule: formData.schedule || 'TBD',
                      studentCount: 0,
                      status: 'active',
                      level: formData.level,
                      startDate: new Date().toISOString()
                    });
                    setShowAddModal(false);
                    setFormData({ name: '', teacherId: '', schedule: '', room: '', level: 'Beginner' });
                  }}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Create Class
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Reassign Teacher Modal */}
      <AnimatePresence>
        {showReassignModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={() => setShowReassignModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-xl p-6 w-full max-w-md"
            >
              <h3 className="text-xl font-bold mb-4">Reassign Teacher</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Select New Teacher</label>
                  <select 
                    value={newTeacherId}
                    onChange={(e) => setNewTeacherId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Choose a teacher</option>
                    {teachers.filter(t => t.status === 'active').map(teacher => (
                      <option key={teacher.id} value={teacher.id}>{teacher.name}</option>
                    ))}
                  </select>
                </div>
                
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-sm text-yellow-800">
                    ⚠️ The new teacher will have access to all student data and progress for this class.
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 mt-6">
                <button
                  onClick={() => setShowReassignModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReassignTeacher}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Reassign Teacher
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Edit Class Modal */}
      <AnimatePresence>
        {showEditModal && selectedClassForEdit && (
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
              <h3 className="text-xl font-bold mb-4">Edit Class</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Class Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Assign Teacher</label>
                  <select 
                    value={formData.teacherId}
                    onChange={(e) => setFormData({ ...formData, teacherId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select a teacher</option>
                    {teachers.filter(t => t.status === 'active').map(teacher => (
                      <option key={teacher.id} value={teacher.id}>{teacher.name}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Schedule</label>
                  <input
                    type="text"
                    value={formData.schedule}
                    onChange={(e) => setFormData({ ...formData, schedule: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Room (Optional)</label>
                  <input
                    type="text"
                    value={formData.room}
                    onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Level</label>
                  <select 
                    value={formData.level}
                    onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option>Beginner</option>
                    <option>Intermediate</option>
                    <option>Advanced</option>
                    <option>Memorization</option>
                  </select>
                </div>
              </div>
              
              <div className="flex items-center gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setFormData({ name: '', teacherId: '', schedule: '', room: '', level: 'Beginner' });
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (formData.name && formData.schedule) {
                      const teacher = teachers.find(t => t.id === formData.teacherId);
                      updateClass(selectedClassForEdit.id, {
                        name: formData.name,
                        teacherId: formData.teacherId,
                        teacherName: teacher?.name || '',
                        schedule: formData.schedule,
                        level: formData.level,
                        room: formData.room
                      });
                      
                      setShowEditModal(false);
                      setFormData({ name: '', teacherId: '', schedule: '', room: '', level: 'Beginner' });
                    }
                  }}
                  disabled={!formData.name || !formData.schedule}
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