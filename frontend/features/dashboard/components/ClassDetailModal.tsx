'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  X,
  Search,
  User,
  Mail,
  Phone,
  MoreVertical,
  ExternalLink,
  UserCheck,
  BookOpen,
  Clock,
  MapPin,
  Calendar,
  Award,
  TrendingUp,
  AlertCircle,
  Download,
  Filter
} from 'lucide-react';
import { Student, useDashboardStore } from '../state/useDashboardStore';

type ViewMode = 'grid' | 'list';
type SortBy = 'name' | 'recent' | 'performance';

export default function ClassDetailModal() {
  const router = useRouter();
  const {
    selectedClass,
    isClassDetailModalOpen,
    setClassDetailModalOpen,
    selectClass,
    removeStudentFromClass
  } = useDashboardStore();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortBy>('name');
  const [showFilters, setShowFilters] = useState(false);
  
  if (!selectedClass) return null;
  
  const handleClose = () => {
    setClassDetailModalOpen(false);
    selectClass(null);
  };
  
  const handleStudentClick = (student: Student) => {
    // Create URL-safe slug from student name and class name
    const studentSlug = student.name.toLowerCase().replace(/\s+/g, '-');
    const classSlug = selectedClass?.name.toLowerCase().replace(/\s+/g, '-');
    
    // Store the student and class info in sessionStorage for the annotation page
    sessionStorage.setItem('currentStudent', JSON.stringify({
      id: student.id,
      name: student.name,
      className: selectedClass?.name
    }));
    
    router.push(`/teacher/students/${student.id}`);
  };
  
  const handleRemoveStudent = (studentId: string, studentName: string) => {
    if (confirm(`Remove ${studentName} from ${selectedClass.name}?`)) {
      removeStudentFromClass(studentId, selectedClass.id);
    }
  };
  
  const filteredStudents = selectedClass.students.filter((student) =>
    student.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const sortedStudents = [...filteredStudents].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'recent':
        return 0; // Would sort by last activity
      case 'performance':
        return 0; // Would sort by performance metrics
      default:
        return 0;
    }
  });
  
  const getDaysString = (days?: string[]) => {
    if (!days || days.length === 0) return 'No schedule set';
    return days.join(', ');
  };
  
  return (
    <AnimatePresence>
      {isClassDetailModalOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-50"
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 40 }}
            transition={{ type: 'spring', damping: 25 }}
            className="fixed inset-0 flex items-center justify-center z-50 p-6"
          >
            <div className="w-[90vw] max-w-6xl h-[85vh] bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col">
              {/* Header */}
            <div 
              className="relative p-8 text-white"
              style={{
                background: `linear-gradient(135deg, ${selectedClass.color}dd 0%, ${selectedClass.color}99 100%)`
              }}
            >
              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute inset-0" style={{
                  backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(255,255,255,.1) 35px, rgba(255,255,255,.1) 70px)`
                }} />
              </div>
              
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                      <BookOpen className="w-8 h-8" />
                    </div>
                    <div>
                      <h2 className="text-3xl font-bold mb-1">{selectedClass.name}</h2>
                      {selectedClass.code && (
                        <p className="text-white/80 font-mono">{selectedClass.code}</p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={handleClose}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
                
                {/* Class Info */}
                <div className="grid grid-cols-4 gap-4 mt-6">
                  <div className="bg-white/10 backdrop-blur rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <User className="w-4 h-4" />
                      <p className="text-xs text-white/70">Students</p>
                    </div>
                    <p className="text-xl font-bold">{selectedClass.studentCount} / {selectedClass.capacity}</p>
                  </div>
                  
                  {selectedClass.schedule && (
                    <div className="bg-white/10 backdrop-blur rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Calendar className="w-4 h-4" />
                        <p className="text-xs text-white/70">Schedule</p>
                      </div>
                      <p className="text-sm font-medium">{getDaysString(selectedClass.schedule.days)}</p>
                    </div>
                  )}
                  
                  {selectedClass.schedule && (
                    <div className="bg-white/10 backdrop-blur rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Clock className="w-4 h-4" />
                        <p className="text-xs text-white/70">Time</p>
                      </div>
                      <p className="text-sm font-medium">
                        {selectedClass.schedule.start} - {selectedClass.schedule.end}
                      </p>
                    </div>
                  )}
                  
                  {selectedClass.room && (
                    <div className="bg-white/10 backdrop-blur rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <MapPin className="w-4 h-4" />
                        <p className="text-xs text-white/70">Location</p>
                      </div>
                      <p className="text-sm font-medium">{selectedClass.room}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Controls Bar */}
            <div className="bg-gray-50 border-b px-8 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search students..."
                      className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-64"
                    />
                  </div>
                  
                  {/* Filter Button */}
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-100 flex items-center gap-2"
                  >
                    <Filter className="w-4 h-4" />
                    Filters
                  </button>
                  
                  {/* Sort */}
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortBy)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="name">Sort by Name</option>
                    <option value="recent">Sort by Recent Activity</option>
                    <option value="performance">Sort by Performance</option>
                  </select>
                </div>
                
                <div className="flex items-center gap-2">
                  {/* View Mode Toggle */}
                  <div className="bg-white border border-gray-300 rounded-lg p-1 flex">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`px-3 py-1 rounded text-sm ${
                        viewMode === 'grid' ? 'bg-gray-800 text-white' : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      Grid
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`px-3 py-1 rounded text-sm ${
                        viewMode === 'list' ? 'bg-gray-800 text-white' : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      List
                    </button>
                  </div>
                  
                  {/* Export Button */}
                  <button className="px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-100 flex items-center gap-2">
                    <Download className="w-4 h-4" />
                    Export
                  </button>
                </div>
              </div>
            </div>
            
            {/* Student List/Grid */}
            <div className="flex-1 overflow-y-auto p-8">
              {sortedStudents.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                  <User className="w-16 h-16 mb-4 opacity-50" />
                  <p className="text-lg font-medium">No students found</p>
                  <p className="text-sm mt-1">Add students to this class from the sidebar</p>
                </div>
              ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-3 gap-4">
                  {sortedStudents.map((student) => (
                    <motion.div
                      key={student.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      whileHover={{ y: -4 }}
                      className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all p-5 cursor-pointer relative group"
                      onClick={() => handleStudentClick(student)}
                    >
                      {/* Avatar */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
                          {student.name.charAt(0).toUpperCase()}
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveStudent(student.id, student.name);
                          }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-100 rounded"
                        >
                          <MoreVertical className="w-4 h-4 text-gray-400" />
                        </button>
                      </div>
                      
                      {/* Name */}
                      <h4 className="font-semibold text-gray-800 mb-1">{student.name}</h4>
                      
                      {/* Contact Info */}
                      {student.email && (
                        <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                          <Mail className="w-3 h-3" />
                          <span className="truncate">{student.email}</span>
                        </div>
                      )}
                      
                      {student.phone && (
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Phone className="w-3 h-3" />
                          <span>{student.phone}</span>
                        </div>
                      )}
                      
                      {/* View Student */}
                      <div className="mt-3 pt-3 border-t flex items-center justify-end">
                        <ExternalLink className="w-3 h-3 text-gray-400" />
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {sortedStudents.map((student) => (
                    <motion.div
                      key={student.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="bg-white rounded-lg shadow-sm hover:shadow-md transition-all p-4 cursor-pointer flex items-center justify-between group"
                      onClick={() => handleStudentClick(student)}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold">
                          {student.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-800">{student.name}</h4>
                          <div className="flex items-center gap-4 mt-1">
                            {student.email && (
                              <span className="text-xs text-gray-500">{student.email}</span>
                            )}
                            {student.phone && (
                              <span className="text-xs text-gray-500">{student.phone}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <ExternalLink className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Footer Stats */}
            <div className="bg-gray-50 border-t px-8 py-4">
              <div className="flex items-center justify-between text-sm text-gray-600">
                <div className="flex items-center gap-6">
                  <span>
                    Showing {sortedStudents.length} of {selectedClass.students.length} students
                  </span>
                  {selectedClass.studentCount >= selectedClass.capacity && (
                    <div className="flex items-center gap-2 text-orange-600">
                      <AlertCircle className="w-4 h-4" />
                      <span>Class is at full capacity</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-green-500" />
                  <span>All students active</span>
                </div>
              </div>
            </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}