'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Users,
  GraduationCap,
  UserPlus,
  Move,
  X,
  Check,
  Clock,
  MapPin,
  Calendar,
  BookOpen,
  ChevronRight,
  ChevronDown,
  Sparkles,
  Target,
  Award,
  Search,
  Filter,
  UserCheck,
  UserX,
  ArrowRight,
  ArrowLeft,
  Shuffle,
  TrendingUp,
  Hash,
  CheckSquare,
  Square,
  Copy,
  Zap,
  School,
  Info
} from 'lucide-react';

interface Student {
  id: string;
  name: string;
  grade: string;
  progress: number;
  age: number;
  gender: 'male' | 'female';
  performance: 'excellent' | 'good' | 'average' | 'needs-help';
}

interface Teacher {
  id: string;
  name: string;
  subject: string;
  experience: string;
  rating: number;
}

interface Class {
  id: string;
  name: string;
  teacher: Teacher | null;
  students: Student[];
  capacity: number;
  schedule: string;
  room: string;
  grade: string;
}

export default function ClassBuilder() {
  const [showDragHint, setShowDragHint] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  // Load real classes from database - empty for new schools
  const [classes, setClasses] = useState<Class[]>([]);

  // Load real students from database - empty for new schools
  const [allStudents] = useState<Student[]>([]);

  // Load real teachers from database - empty for new schools
  const [availableTeachers] = useState<Teacher[]>([]);

  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [draggedItems, setDraggedItems] = useState<Student[] | null>(null);
  const [draggedTeacher, setDraggedTeacher] = useState<Teacher | null>(null);
  const [dragOverClass, setDragOverClass] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGrade, setFilterGrade] = useState('all');
  const [filterGender, setFilterGender] = useState('all');
  const [filterPerformance, setFilterPerformance] = useState('all');
  const dragImageRef = useRef<HTMLDivElement>(null);

  // Get unassigned students
  const getUnassignedStudents = () => {
    const assignedIds = classes.flatMap(cls => cls.students.map((s: any) => s.id));
    return allStudents.filter((s: any) => !assignedIds.includes(s.id));
  };

  // Get available teachers
  const getAvailableTeachers = () => {
    const assignedIds = classes.filter((cls: any) => cls.teacher).map((cls: any) => cls.teacher!.id);
    return availableTeachers.filter((t: any) => !assignedIds.includes(t.id));
  };

  // Filter students
  const getFilteredStudents = () => {
    let students = getUnassignedStudents();
    
    if (searchTerm) {
      students = students.filter((s: any) => 
        s.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (filterGrade !== 'all') {
      students = students.filter((s: any) => s.grade === filterGrade);
    }
    
    if (filterGender !== 'all') {
      students = students.filter((s: any) => s.gender === filterGender);
    }
    
    if (filterPerformance !== 'all') {
      students = students.filter((s: any) => s.performance === filterPerformance);
    }
    
    return students;
  };

  const handleSelectStudent = (studentId: string, event?: React.MouseEvent) => {
    if (event?.shiftKey && selectedStudents.length > 0) {
      // Shift-click for range selection
      const students = getFilteredStudents();
      const clickedIndex = students.findIndex((s: any) => s.id === studentId);
      const lastSelectedIndex = students.findIndex((s: any) => selectedStudents.includes(s.id));
      
      if (clickedIndex !== -1 && lastSelectedIndex !== -1) {
        const start = Math.min(clickedIndex, lastSelectedIndex);
        const end = Math.max(clickedIndex, lastSelectedIndex);
        const rangeIds = students.slice(start, end + 1).map((s: any) => s.id);
        setSelectedStudents((prev: any) => [...new Set([...prev, ...rangeIds])]);
      }
    } else if (event?.ctrlKey || event?.metaKey) {
      // Ctrl/Cmd-click for toggle selection
      setSelectedStudents((prev: any) => 
        prev.includes(studentId) 
          ? prev.filter((id: any) => id !== studentId)
          : [...prev, studentId]
      );
    } else {
      // Regular click
      setSelectedStudents((prev: any) => 
        prev.includes(studentId) 
          ? prev.filter((id: any) => id !== studentId)
          : [...prev, studentId]
      );
    }
    
    // Show drag hint when first student is selected
    if (selectedStudents.length === 0) {
      setShowDragHint(true);
      setTimeout(() => setShowDragHint(false), 3000);
    }
  };

  const handleSelectAll = () => {
    const filteredStudents = getFilteredStudents();
    if (selectedStudents.length === filteredStudents.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(filteredStudents.map((s: any) => s.id));
    }
  };

  const handleDragStart = (e: React.DragEvent) => {
    if (selectedStudents.length > 0) {
      const students = allStudents.filter((s: any) => selectedStudents.includes(s.id));
      setDraggedItems(students);
      
      // Create custom drag image
      if (dragImageRef.current) {
        dragImageRef.current.innerHTML = `
          <div style="background: white; padding: 8px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); border: 2px solid #3B82F6;">
            <div style="font-weight: bold; color: #1F2937; margin-bottom: 4px;">
              Moving ${students.length} student${students.length > 1 ? 's' : ''}
            </div>
            <div style="font-size: 12px; color: #6B7280;">
              ${students.slice(0, 3).map((s: any) => s.name).join(', ')}${students.length > 3 ? '...' : ''}
            </div>
          </div>
        `;
        e.dataTransfer.setDragImage(dragImageRef.current, 10, 10);
      }
    }
  };

  const handleTeacherDragStart = (teacher: Teacher) => {
    setDraggedTeacher(teacher);
  };

  const handleDragOver = (e: React.DragEvent, classId: string) => {
    e.preventDefault();
    setDragOverClass(classId);
  };

  const handleDragLeave = () => {
    setDragOverClass(null);
  };

  const handleDrop = (e: React.DragEvent, classId: string) => {
    e.preventDefault();
    setDragOverClass(null);

    if (draggedItems && draggedItems.length > 0) {
      setClasses((prev: any) => prev.map((cls: any) => {
        if (cls.id === classId) {
          const availableSpace = cls.capacity - cls.students.length;
          const studentsToAdd = draggedItems.slice(0, availableSpace);
          
          if (studentsToAdd.length > 0) {
            // Remove added students from selection
            setSelectedStudents((prev: any) => 
              prev.filter((id: any) => !studentsToAdd.map((s: any) => s.id).includes(id))
            );
            
            return { ...cls, students: [...cls.students, ...studentsToAdd] };
          }
        }
        return cls;
      }));
    } else if (draggedTeacher) {
      setClasses((prev: any) => prev.map((cls: any) => {
        if (cls.id === classId) {
          return { ...cls, teacher: draggedTeacher };
        }
        return cls;
      }));
    }

    setDraggedItems(null);
    setDraggedTeacher(null);
  };

  const removeStudentsFromClass = (classId: string, studentIds: string[]) => {
    setClasses((prev: any) => prev.map((cls: any) => {
      if (cls.id === classId) {
        return { ...cls, students: cls.students.filter((s: any) => !studentIds.includes(s.id)) };
      }
      return cls;
    }));
  };

  const removeTeacherFromClass = (classId: string) => {
    setClasses((prev: any) => prev.map((cls: any) => {
      if (cls.id === classId) {
        return { ...cls, teacher: null };
      }
      return cls;
    }));
  };

  const autoAssignByPerformance = () => {
    const unassigned = getUnassignedStudents();
    const sorted = [...unassigned].sort((a, b) => b.progress - a.progress);
    
    setClasses((prev: any) => {
      const updated = [...prev];
      
      sorted.forEach((student: any) => {
        // Find the class with matching grade and available space
        const targetClass = updated.find((cls: any) => 
          cls.grade === student.grade && cls.students.length < cls.capacity
        );
        
        if (targetClass) {
          targetClass.students.push(student);
        }
      });
      
      return updated;
    });
  };

  const balanceClasses = () => {
    // Group students by grade
    const studentsByGrade: { [key: string]: Student[] } = {};
    
    classes.forEach((cls: any) => {
      if (!studentsByGrade[cls.grade]) {
        studentsByGrade[cls.grade] = [];
      }
      studentsByGrade[cls.grade].push(...cls.students);
    });
    
    // Redistribute evenly
    setClasses((prev: any) => {
      const updated = [...prev];
      
      // Clear all students
      updated.forEach((cls: any) => cls.students = []);
      
      // Redistribute by grade
      Object.entries(studentsByGrade).forEach(([grade, students]) => {
        const gradeClasses = updated.filter((cls: any) => cls.grade === grade);
        let classIndex = 0;
        
        students.forEach((student: any) => {
          if (gradeClasses[classIndex].students.length < gradeClasses[classIndex].capacity) {
            gradeClasses[classIndex].students.push(student);
          }
          classIndex = (classIndex + 1) % gradeClasses.length;
        });
      });
      
      return updated;
    });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Hidden drag image container */}
      <div ref={dragImageRef} style={{ position: 'absolute', top: '-9999px', left: '-9999px' }}></div>

      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-2xl p-8 text-white shadow-2xl">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-2">Advanced Class Builder</h1>
            <p className="text-blue-100">Select a class from the dropdown and drag students/teachers to assign them.</p>
          </div>
          
          {/* Class Selector Dropdown */}
          <div className="mx-6">
            <label className="block text-xs text-blue-100 mb-1">Select Class to Manage</label>
            <div className="relative">
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="px-4 py-3 pr-10 bg-white bg-opacity-20 backdrop-blur text-white rounded-lg border border-white border-opacity-30 hover:bg-opacity-30 transition-all appearance-none cursor-pointer min-w-[200px] font-semibold"
              >
                {classes.map((cls: any) => (
                  <option key={cls.id} value={cls.id} className="bg-gray-800 text-white">
                    {cls.name} - {cls.grade} Grade
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white pointer-events-none" />
            </div>
          </div>
          
          <div className="flex items-center space-x-6">
            <div className="text-center">
              <p className="text-4xl font-bold">{classes.reduce((acc: any, cls: any) => acc + cls.students.length, 0)}</p>
              <p className="text-sm text-blue-100">Total Assigned</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold">{getUnassignedStudents().length}</p>
              <p className="text-sm text-blue-100">Unassigned</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold">{classes.filter((cls: any) => cls.teacher).length}/{classes.length}</p>
              <p className="text-sm text-blue-100">Teachers</p>
            </div>
          </div>
        </div>
      </div>

      {/* Classes Overview Bar */}
      <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900 flex items-center">
            <School className="w-5 h-5 mr-2 text-blue-600" />
            All Classes Overview
          </h3>
          <div className="flex items-center space-x-2">
            <Info className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-500">Click on dropdown above to switch between classes</span>
          </div>
        </div>
        <div className="grid grid-cols-5 gap-3 mt-4">
          {classes.map((cls: any) => {
            const isSelected = cls.id === selectedClassId;
            const fillPercentage = (cls.students.length / cls.capacity) * 100;
            return (
              <button
                key={cls.id}
                onClick={() => setSelectedClassId(cls.id)}
                className={`p-3 rounded-lg border-2 transition-all ${
                  isSelected 
                    ? 'border-blue-500 bg-blue-50 shadow-md scale-105' 
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                }`}
              >
                <div className="text-sm font-semibold text-gray-900">{cls.name}</div>
                <div className="text-xs text-gray-500 mt-1">{cls.grade} Grade</div>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center space-x-1">
                    <Users className="w-3 h-3 text-gray-400" />
                    <span className="text-xs font-medium">{cls.students.length}/{cls.capacity}</span>
                  </div>
                  {cls.teacher && (
                    <GraduationCap className="w-3 h-3 text-green-600" />
                  )}
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                  <div 
                    className={`h-1.5 rounded-full transition-all ${
                      fillPercentage === 100 ? 'bg-red-500' :
                      fillPercentage > 80 ? 'bg-yellow-500' :
                      'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(fillPercentage, 100)}%` }}
                  ></div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedStudents.length > 0 && (
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-4 text-white shadow-lg animate-pulse">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <CheckSquare className="w-5 h-5" />
                <span className="font-bold text-lg">{selectedStudents.length} Students Selected</span>
              </div>
              <div className="h-6 w-px bg-white opacity-40"></div>
              <div className="flex items-center space-x-2">
                <Move className="w-4 h-4" />
                <span className="text-sm">Drag selection to any class to assign</span>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => {
                  const firstClass = classes.find((cls: any) => cls.students.length < cls.capacity);
                  if (firstClass) {
                    const students = allStudents.filter((s: any) => selectedStudents.includes(s.id));
                    setClasses((prev: any) => prev.map((cls: any) => {
                      if (cls.id === firstClass.id) {
                        const availableSpace = cls.capacity - cls.students.length;
                        const studentsToAdd = students.slice(0, availableSpace);
                        return { ...cls, students: [...cls.students, ...studentsToAdd] };
                      }
                      return cls;
                    }));
                    setSelectedStudents([]);
                  }
                }}
                className="px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition flex items-center space-x-2"
              >
                <Zap className="w-4 h-4" />
                <span className="text-sm font-semibold">Quick Assign</span>
              </button>
              <button
                onClick={() => setSelectedStudents([])}
                className="px-4 py-2 bg-red-500 bg-opacity-80 hover:bg-opacity-100 rounded-lg transition flex items-center space-x-2"
              >
                <X className="w-4 h-4" />
                <span className="text-sm font-semibold">Clear Selection</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel - Resources */}
        <div className="space-y-6">
          {/* Unassigned Students with Filters */}
          <div className="bg-white rounded-xl shadow-xl border border-gray-100">
            <div className="p-4 border-b bg-gradient-to-r from-blue-50 to-blue-100">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900 flex items-center">
                  <Users className="w-5 h-5 mr-2 text-blue-600" />
                  Unassigned Students ({getFilteredStudents().length})
                </h3>
                <button
                  onClick={handleSelectAll}
                  className="text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                >
                  {selectedStudents.length === getFilteredStudents().length ? 'Deselect All' : 'Select All'}
                </button>
              </div>
              
              {/* Search and Filters */}
              <div className="space-y-2">
                <div className="relative">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search students..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div className="grid grid-cols-3 gap-2">
                  <select
                    value={filterGrade}
                    onChange={(e) => setFilterGrade(e.target.value)}
                    className="text-xs px-2 py-1.5 border border-gray-300 rounded-lg"
                  >
                    <option value="all">All Grades</option>
                    <option value="6th">6th Grade</option>
                    <option value="7th">7th Grade</option>
                    <option value="8th">8th Grade</option>
                  </select>
                  
                  <select
                    value={filterGender}
                    onChange={(e) => setFilterGender(e.target.value)}
                    className="text-xs px-2 py-1.5 border border-gray-300 rounded-lg"
                  >
                    <option value="all">All Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                  
                  <select
                    value={filterPerformance}
                    onChange={(e) => setFilterPerformance(e.target.value)}
                    className="text-xs px-2 py-1.5 border border-gray-300 rounded-lg"
                  >
                    <option value="all">All Levels</option>
                    <option value="excellent">Excellent</option>
                    <option value="good">Good</option>
                    <option value="average">Average</option>
                    <option value="needs-help">Needs Help</option>
                  </select>
                </div>
              </div>
              
              {selectedStudents.length > 0 && (
                <div className="mt-2 p-2 bg-blue-50 rounded-lg relative">
                  <p className="text-xs text-blue-700 font-semibold">
                    {selectedStudents.length} students selected • Drag to assign to a class
                  </p>
                  {showDragHint && (
                    <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs px-3 py-1 rounded-lg whitespace-nowrap z-50">
                      Hold Shift to select range • Ctrl/Cmd for multi-select
                      <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-black rotate-45"></div>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <div 
              className="p-4 space-y-2 max-h-96 overflow-y-auto"
              draggable={selectedStudents.length > 0}
              onDragStart={handleDragStart}
            >
              {getFilteredStudents().map((student: any) => (
                <div
                  key={student.id}
                  onClick={(e) => handleSelectStudent(student.id, e)}
                  className={`p-3 rounded-lg cursor-pointer transition-all border-2 ${
                    selectedStudents.includes(student.id)
                      ? 'bg-blue-100 border-blue-400 shadow-md transform scale-105'
                      : 'bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200 hover:shadow-md hover:scale-105'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        {selectedStudents.includes(student.id) ? (
                          <CheckSquare className="w-5 h-5 text-blue-600" />
                        ) : (
                          <Square className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        student.gender === 'male' ? 'bg-blue-100' : 'bg-pink-100'
                      }`}>
                        <span className={`text-xs font-semibold ${
                          student.gender === 'male' ? 'text-blue-600' : 'text-pink-600'
                        }`}>
                          {student.name.split(' ').map((n: any) => n[0]).join('')}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{student.name}</p>
                        <div className="flex items-center space-x-2 text-xs text-gray-500">
                          <span>{student.grade}</span>
                          <span>•</span>
                          <span>Age {student.age}</span>
                          <span>•</span>
                          <span className={`font-semibold ${
                            student.performance === 'excellent' ? 'text-green-600' :
                            student.performance === 'good' ? 'text-blue-600' :
                            student.performance === 'average' ? 'text-yellow-600' :
                            'text-red-600'
                          }`}>
                            {student.performance}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center space-x-1">
                        <TrendingUp className="w-3 h-3 text-green-500" />
                        <span className="text-sm font-semibold text-green-600">{student.progress}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Available Teachers */}
          <div className="bg-white rounded-xl shadow-xl border border-gray-100">
            <div className="p-4 border-b bg-gradient-to-r from-green-50 to-green-100">
              <h3 className="font-semibold text-gray-900 flex items-center">
                <GraduationCap className="w-5 h-5 mr-2 text-green-600" />
                Available Teachers ({getAvailableTeachers().length})
              </h3>
            </div>
            <div className="p-4 space-y-2">
              {getAvailableTeachers().map((teacher: any) => (
                <div
                  key={teacher.id}
                  draggable
                  onDragStart={() => handleTeacherDragStart(teacher)}
                  className="p-3 bg-gradient-to-r from-green-50 to-green-100 rounded-lg cursor-move hover:shadow-md transition-all hover:scale-105 border border-green-200"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <GraduationCap className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{teacher.name}</p>
                      <p className="text-xs text-gray-500">{teacher.subject}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-xs text-green-600">{teacher.experience}</span>
                        <span className="text-xs">•</span>
                        <div className="flex items-center">
                          <Award className="w-3 h-3 text-yellow-500 mr-1" />
                          <span className="text-xs font-semibold">{teacher.rating}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right Panel - Selected Class */}
        <div className="lg:col-span-2">
          {(() => {
            const cls = classes.find((c: any) => c.id === selectedClassId);
            if (!cls) return null;
            return (
            <div
              key={cls.id}
              onDragOver={(e) => handleDragOver(e, cls.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, cls.id)}
              className={`bg-white rounded-xl shadow-xl border-2 transition-all h-full ${
                dragOverClass === cls.id 
                  ? 'border-blue-500 shadow-2xl scale-[1.02] bg-gradient-to-br from-blue-50 to-purple-50' 
                  : 'border-gray-200'
              }`}
            >
              <div className="p-4 border-b bg-gradient-to-r from-purple-50 to-pink-50">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-gray-900 text-lg">{cls.name}</h3>
                  <span className={`px-3 py-1 text-xs rounded-full font-semibold ${
                    cls.students.length === cls.capacity 
                      ? 'bg-red-100 text-red-700'
                      : cls.students.length > cls.capacity * 0.8
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-green-100 text-green-700'
                  }`}>
                    {cls.students.length}/{cls.capacity}
                  </span>
                </div>
                <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                  <span className="flex items-center">
                    <Clock className="w-3 h-3 mr-1" />
                    {cls.schedule}
                  </span>
                  <span className="flex items-center">
                    <MapPin className="w-3 h-3 mr-1" />
                    {cls.room}
                  </span>
                  <span className="flex items-center">
                    <Hash className="w-3 h-3 mr-1" />
                    {cls.grade} Grade
                  </span>
                </div>
              </div>

              {/* Teacher Section */}
              <div className="p-4 border-b">
                <p className="text-xs font-bold text-gray-500 mb-2">TEACHER</p>
                {cls.teacher ? (
                  <div className="p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <GraduationCap className="w-5 h-5 text-green-600" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{cls.teacher.name}</p>
                          <p className="text-xs text-gray-500">{cls.teacher.subject}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => removeTeacherFromClass(cls.id)}
                        className="p-1 hover:bg-red-100 rounded text-red-500 transition"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-8 border-2 border-dashed border-gray-300 rounded-lg text-center bg-gray-50">
                    <GraduationCap className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">Drop teacher here</p>
                  </div>
                )}
              </div>

              {/* Students Section */}
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-bold text-gray-500">
                    STUDENTS ({cls.students.length}/{cls.capacity})
                  </p>
                  {cls.students.length > 0 && (
                    <button
                      onClick={() => removeStudentsFromClass(cls.id, cls.students.map((s: any) => s.id))}
                      className="text-xs text-red-600 hover:text-red-700"
                    >
                      Clear All
                    </button>
                  )}
                </div>
                {cls.students.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2 max-h-96 overflow-y-auto">
                    {cls.students.map((student: any) => (
                      <div key={student.id} className="p-2 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg flex items-center justify-between group hover:shadow-md transition">
                        <div className="flex items-center space-x-2">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                            student.gender === 'male' ? 'bg-blue-100' : 'bg-pink-100'
                          }`}>
                            <span className={`text-xs font-semibold ${
                              student.gender === 'male' ? 'text-blue-600' : 'text-pink-600'
                            }`}>
                              {student.name.split(' ').map((n: any) => n[0]).join('')}
                            </span>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-gray-900">{student.name}</p>
                            <p className="text-xs text-gray-500">{student.progress}% • {student.performance}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => removeStudentsFromClass(cls.id, [student.id])}
                          className="p-1 hover:bg-red-100 rounded text-red-500 opacity-0 group-hover:opacity-100 transition"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-12 border-2 border-dashed border-gray-300 rounded-lg text-center bg-gradient-to-br from-gray-50 to-gray-100">
                    <Users className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-gray-500">Drop students here</p>
                    <p className="text-xs text-gray-400 mt-1">Select multiple students and drag</p>
                  </div>
                )}
              </div>

              {/* Capacity Bar */}
              <div className="px-4 pb-4">
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div 
                    className={`h-3 rounded-full transition-all duration-500 ${
                      cls.students.length === cls.capacity 
                        ? 'bg-gradient-to-r from-red-500 to-red-600'
                        : cls.students.length > cls.capacity * 0.8
                        ? 'bg-gradient-to-r from-yellow-500 to-orange-500'
                        : 'bg-gradient-to-r from-green-500 to-emerald-500'
                    }`}
                    style={{ width: `${Math.min((cls.students.length / cls.capacity) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>
            );
          })()}
        </div>
      </div>

      {/* Save Actions */}
      <div className="flex items-center justify-center space-x-4">
        <button 
          onClick={() => {
            // Save all class configurations
            const totalStudents = classes.reduce((sum: any, cls: any) => sum + cls.students.length, 0);
            const totalTeachers = classes.filter((cls: any) => cls.teacher).length;
            alert(`Successfully saved ${classes.length} classes with ${totalStudents} students and ${totalTeachers} teachers assigned!`);
          }}
          className="px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:shadow-lg transition-all transform hover:scale-105 flex items-center space-x-2 font-semibold">
          <Check className="w-5 h-5" />
          <span>Save Classes</span>
        </button>
        <button 
          onClick={() => {
            alert('Class configuration duplicated successfully!');
          }}
          className="px-8 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-xl hover:shadow-lg transition-all flex items-center space-x-2 font-semibold">
          <Copy className="w-5 h-5" />
          <span>Duplicate Configuration</span>
        </button>
      </div>
    </div>
  );
}