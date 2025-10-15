'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
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
  Info,
  Save,
  RefreshCw
} from 'lucide-react';

interface Student {
  id: string;
  name: string;
  email: string;
  grade?: string;
  age?: number;
  gender?: string;
  performance?: 'excellent' | 'good' | 'average' | 'needs-help';
}

interface Teacher {
  id: string;
  name: string;
  email: string;
  subject?: string;
  qualification?: string;
}

interface Class {
  id: string;
  name: string;
  room?: string;
  grade?: string;
  capacity: number;
  teacher?: Teacher | null;
  students: Student[];
  schedule_json?: any;
}

interface ClassBuilderProProps {
  schoolId: string;
  onClose?: () => void;
}

export default function ClassBuilderPro({ schoolId, onClose }: ClassBuilderProProps) {
  // State
  const [classes, setClasses] = useState<Class[]>([]);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [allTeachers, setAllTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // UI State
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [draggedItems, setDraggedItems] = useState<Student[] | null>(null);
  const [draggedTeacher, setDraggedTeacher] = useState<Teacher | null>(null);
  const [dragOverClass, setDragOverClass] = useState<string | null>(null);
  const [activeClassId, setActiveClassId] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [teacherSearchTerm, setTeacherSearchTerm] = useState('');
  const [filterGrade, setFilterGrade] = useState('all');
  const [filterGender, setFilterGender] = useState('all');
  const [showOnlyUnassigned, setShowOnlyUnassigned] = useState(true);

  const dragImageRef = useRef<HTMLDivElement>(null);

  // Load data from database
  useEffect(() => {
    loadData();
  }, [schoolId]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load classes with their enrollments
      const { data: classesData } = await supabase
        .from('classes')
        .select(`
          *,
          class_teachers(teacher_id),
          class_enrollments(student_id)
        `)
        .eq('school_id', schoolId);

      // Load all students
      const { data: studentsData } = await supabase
        .from('students')
        .select('*')
        .eq('school_id', schoolId);

      // Load all teachers
      const { data: teachersData } = await supabase
        .from('teachers')
        .select('*')
        .eq('school_id', schoolId);

      // Transform classes data
      if (classesData) {
        const transformedClasses = await Promise.all(classesData.map(async (cls) => {
          // Get teacher details
          let teacher = null;
          if (cls.class_teachers?.length > 0) {
            const { data: teacherData } = await supabase
              .from('teachers')
              .select('*')
              .eq('id', cls.class_teachers[0].teacher_id)
              .single();
            teacher = teacherData;
          }

          // Get student details
          const studentIds = cls.class_enrollments?.map(e => e.student_id) || [];
          const students = studentsData?.filter(s => studentIds.includes(s.id)) || [];

          return {
            id: cls.id,
            name: cls.name,
            room: cls.room,
            grade: cls.grade,
            capacity: cls.capacity || 30,
            teacher,
            students,
            schedule_json: cls.schedule_json
          };
        }));

        setClasses(transformedClasses);
      }

      setAllStudents(studentsData || []);
      setAllTeachers(teachersData || []);
    } catch (error) {
      console.error('Error loading data:', error);
    }
    setLoading(false);
  };

  // Get unassigned students
  const getUnassignedStudents = () => {
    const assignedIds = classes.flatMap(cls => cls.students.map(s => s.id));
    return allStudents.filter(s => !assignedIds.includes(s.id));
  };

  // Get unassigned teachers
  const getUnassignedTeachers = () => {
    const assignedIds = classes.filter(cls => cls.teacher).map(cls => cls.teacher!.id);
    return allTeachers.filter(t => !assignedIds.includes(t.id));
  };

  // Filter students
  const getFilteredStudents = () => {
    let students = showOnlyUnassigned ? getUnassignedStudents() : allStudents;

    if (searchTerm) {
      students = students.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterGrade !== 'all') {
      students = students.filter(s => s.grade === filterGrade);
    }

    if (filterGender !== 'all') {
      students = students.filter(s => s.gender === filterGender);
    }

    return students;
  };

  // Filter teachers
  const getFilteredTeachers = () => {
    let teachers = getUnassignedTeachers();

    if (teacherSearchTerm) {
      teachers = teachers.filter(t =>
        t.name.toLowerCase().includes(teacherSearchTerm.toLowerCase()) ||
        (t.subject && t.subject.toLowerCase().includes(teacherSearchTerm.toLowerCase()))
      );
    }

    return teachers;
  };

  // Handle student selection
  const handleSelectStudent = (studentId: string, event?: React.MouseEvent) => {
    if (event?.shiftKey && selectedStudents.length > 0) {
      // Shift-click for range selection
      const students = getFilteredStudents();
      const clickedIndex = students.findIndex(s => s.id === studentId);
      const lastSelectedIndex = students.findIndex(s => selectedStudents.includes(s.id));

      if (clickedIndex !== -1 && lastSelectedIndex !== -1) {
        const start = Math.min(clickedIndex, lastSelectedIndex);
        const end = Math.max(clickedIndex, lastSelectedIndex);
        const rangeIds = students.slice(start, end + 1).map(s => s.id);
        setSelectedStudents(prev => [...new Set([...prev, ...rangeIds])]);
      }
    } else if (event?.ctrlKey || event?.metaKey) {
      // Ctrl/Cmd-click for toggle selection
      setSelectedStudents(prev =>
        prev.includes(studentId)
          ? prev.filter(id => id !== studentId)
          : [...prev, studentId]
      );
    } else {
      // Regular click
      setSelectedStudents(prev =>
        prev.includes(studentId)
          ? prev.filter(id => id !== studentId)
          : [...prev, studentId]
      );
    }
  };

  // Handle select all
  const handleSelectAll = () => {
    const filteredStudents = getFilteredStudents();
    if (selectedStudents.length === filteredStudents.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(filteredStudents.map(s => s.id));
    }
  };

  // Drag and Drop Handlers
  const handleDragStart = (e: React.DragEvent) => {
    if (selectedStudents.length > 0) {
      const students = allStudents.filter(s => selectedStudents.includes(s.id));
      setDraggedItems(students);
      e.dataTransfer.effectAllowed = 'move';
    }
  };

  const handleTeacherDragStart = (e: React.DragEvent, teacher: Teacher) => {
    setDraggedTeacher(teacher);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, classId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverClass(classId);
  };

  const handleDrop = (e: React.DragEvent, classId: string) => {
    e.preventDefault();
    setDragOverClass(null);

    // Handle student drop
    if (draggedItems && draggedItems.length > 0) {
      setClasses(prev => prev.map(cls => {
        if (cls.id === classId) {
          const availableSpace = cls.capacity - cls.students.length;
          const studentsToAdd = draggedItems.slice(0, availableSpace);

          if (studentsToAdd.length > 0) {
            return {
              ...cls,
              students: [...cls.students, ...studentsToAdd]
            };
          }
        }
        return cls;
      }));
      setSelectedStudents([]);
      setDraggedItems(null);
    }

    // Handle teacher drop
    if (draggedTeacher) {
      setClasses(prev => prev.map(cls => {
        if (cls.id === classId) {
          return {
            ...cls,
            teacher: draggedTeacher
          };
        }
        return cls;
      }));
      setDraggedTeacher(null);
    }
  };

  // Remove student from class
  const removeStudentFromClass = (classId: string, studentId: string) => {
    setClasses(prev => prev.map(cls => {
      if (cls.id === classId) {
        return {
          ...cls,
          students: cls.students.filter(s => s.id !== studentId)
        };
      }
      return cls;
    }));
  };

  // Remove teacher from class
  const removeTeacherFromClass = (classId: string) => {
    setClasses(prev => prev.map(cls => {
      if (cls.id === classId) {
        return {
          ...cls,
          teacher: null
        };
      }
      return cls;
    }));
  };

  // Save changes to database
  const saveChanges = async () => {
    setSaving(true);
    try {
      for (const cls of classes) {
        // Update teacher assignment
        await supabase
          .from('class_teachers')
          .delete()
          .eq('class_id', cls.id);

        if (cls.teacher) {
          await supabase
            .from('class_teachers')
            .insert({
              class_id: cls.id,
              teacher_id: cls.teacher.id
            });
        }

        // Update student enrollments
        await supabase
          .from('class_enrollments')
          .delete()
          .eq('class_id', cls.id);

        if (cls.students.length > 0) {
          const enrollments = cls.students.map(student => ({
            class_id: cls.id,
            student_id: student.id
          }));

          await supabase
            .from('class_enrollments')
            .insert(enrollments);
        }
      }

      alert('Changes saved successfully!');
    } catch (error) {
      console.error('Error saving changes:', error);
      alert('Failed to save changes');
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-lg">Loading class data...</div>
      </div>
    );
  }

  const filteredStudents = getFilteredStudents();
  const filteredTeachers = getFilteredTeachers();

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Class Builder Pro</h2>
            <p className="text-sm text-gray-500 mt-1">Drag and drop to assign teachers and students to classes</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={loadData}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </button>
            <button
              onClick={saveChanges}
              disabled={saving}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 flex items-center"
            >
              {saving ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Unassigned */}
        <div className="w-1/3 border-r bg-white flex flex-col">
          {/* Teachers Section */}
          <div className="border-b p-4">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
              <GraduationCap className="w-5 h-5 mr-2" />
              Available Teachers ({filteredTeachers.length})
            </h3>

            {/* Teacher Search */}
            <div className="relative mb-3">
              <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search teachers..."
                value={teacherSearchTerm}
                onChange={(e) => setTeacherSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm"
              />
            </div>

            {/* Teacher List */}
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {filteredTeachers.map(teacher => (
                <div
                  key={teacher.id}
                  draggable
                  onDragStart={(e) => handleTeacherDragStart(e, teacher)}
                  className="p-3 border rounded-lg cursor-move hover:bg-blue-50 hover:border-blue-300 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{teacher.name}</p>
                      <p className="text-xs text-gray-500">{teacher.subject || 'No subject'}</p>
                    </div>
                    <GraduationCap className="w-4 h-4 text-gray-400" />
                  </div>
                </div>
              ))}
              {filteredTeachers.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">No available teachers</p>
              )}
            </div>
          </div>

          {/* Students Section */}
          <div className="flex-1 flex flex-col p-4">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center justify-between">
              <span className="flex items-center">
                <Users className="w-5 h-5 mr-2" />
                Available Students ({filteredStudents.length})
              </span>
              <button
                onClick={handleSelectAll}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                {selectedStudents.length === filteredStudents.length ? 'Deselect All' : 'Select All'}
              </button>
            </h3>

            {/* Filters */}
            <div className="space-y-2 mb-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search students..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm"
                />
              </div>

              <div className="flex gap-2">
                <select
                  value={filterGrade}
                  onChange={(e) => setFilterGrade(e.target.value)}
                  className="flex-1 px-2 py-1 border rounded text-sm"
                >
                  <option value="all">All Grades</option>
                  <option value="KG">KG</option>
                  <option value="1">Grade 1</option>
                  <option value="2">Grade 2</option>
                  <option value="3">Grade 3</option>
                  <option value="4">Grade 4</option>
                  <option value="5">Grade 5</option>
                  <option value="6">Grade 6</option>
                  <option value="7">Grade 7</option>
                  <option value="8">Grade 8</option>
                  <option value="9">Grade 9</option>
                  <option value="10">Grade 10</option>
                  <option value="11">Grade 11</option>
                  <option value="12">Grade 12</option>
                </select>

                <select
                  value={filterGender}
                  onChange={(e) => setFilterGender(e.target.value)}
                  className="flex-1 px-2 py-1 border rounded text-sm"
                >
                  <option value="all">All Genders</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>

              <label className="flex items-center text-sm">
                <input
                  type="checkbox"
                  checked={showOnlyUnassigned}
                  onChange={(e) => setShowOnlyUnassigned(e.target.checked)}
                  className="mr-2"
                />
                Show only unassigned students
              </label>
            </div>

            {/* Selected Count */}
            {selectedStudents.length > 0 && (
              <div className="mb-3 p-2 bg-blue-50 rounded-lg">
                <p className="text-sm font-medium text-blue-900">
                  {selectedStudents.length} students selected - Drag to assign to a class
                </p>
              </div>
            )}

            {/* Student List */}
            <div
              className="flex-1 overflow-y-auto space-y-1"
              draggable={selectedStudents.length > 0}
              onDragStart={handleDragStart}
            >
              {filteredStudents.map(student => (
                <div
                  key={student.id}
                  onClick={(e) => handleSelectStudent(student.id, e)}
                  className={`p-3 border rounded-lg cursor-pointer transition-all ${
                    selectedStudents.includes(student.id)
                      ? 'bg-blue-50 border-blue-300'
                      : 'hover:bg-gray-50 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedStudents.includes(student.id)}
                      onChange={() => {}}
                      className="mr-3"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-sm">{student.name}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span>{student.email}</span>
                        {student.grade && <span>• Grade {student.grade}</span>}
                        {student.gender && <span>• {student.gender}</span>}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Panel - Classes */}
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {classes.map(cls => {
              const isOverCapacity = cls.students.length > cls.capacity;
              const utilization = (cls.students.length / cls.capacity) * 100;

              return (
                <div
                  key={cls.id}
                  onDragOver={(e) => handleDragOver(e, cls.id)}
                  onDragLeave={() => setDragOverClass(null)}
                  onDrop={(e) => handleDrop(e, cls.id)}
                  className={`bg-white rounded-xl shadow-sm border-2 transition-all ${
                    dragOverClass === cls.id
                      ? 'border-blue-400 shadow-lg scale-105'
                      : 'border-gray-200'
                  }`}
                >
                  {/* Class Header */}
                  <div className="p-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-bold text-lg">{cls.name}</h3>
                      <div className="flex items-center gap-2">
                        {cls.grade && (
                          <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs">
                            {cls.grade}
                          </span>
                        )}
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          isOverCapacity
                            ? 'bg-red-100 text-red-700'
                            : utilization > 80
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-green-100 text-green-700'
                        }`}>
                          {cls.students.length}/{cls.capacity}
                        </span>
                      </div>
                    </div>
                    {cls.room && (
                      <p className="text-sm text-gray-600 flex items-center">
                        <MapPin className="w-3 h-3 mr-1" />
                        {cls.room}
                      </p>
                    )}
                  </div>

                  {/* Teacher Section */}
                  <div className="p-4 border-b">
                    <p className="text-sm font-semibold text-gray-700 mb-2">Teacher</p>
                    {cls.teacher ? (
                      <div className="flex items-center justify-between p-2 bg-blue-50 rounded-lg">
                        <div>
                          <p className="font-medium text-sm">{cls.teacher.name}</p>
                          <p className="text-xs text-gray-500">{cls.teacher.subject}</p>
                        </div>
                        <button
                          onClick={() => removeTeacherFromClass(cls.id)}
                          className="text-red-500 hover:bg-red-50 p-1 rounded"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg text-center text-sm text-gray-500">
                        Drag teacher here
                      </div>
                    )}
                  </div>

                  {/* Students Section */}
                  <div className="p-4">
                    <p className="text-sm font-semibold text-gray-700 mb-2">
                      Students ({cls.students.length})
                    </p>
                    {cls.students.length > 0 ? (
                      <div className="space-y-1 max-h-48 overflow-y-auto">
                        {cls.students.map(student => (
                          <div
                            key={student.id}
                            className="flex items-center justify-between p-2 bg-gray-50 rounded hover:bg-gray-100"
                          >
                            <div className="flex-1">
                              <p className="text-sm font-medium">{student.name}</p>
                              <p className="text-xs text-gray-500">{student.grade || 'No grade'}</p>
                            </div>
                            <button
                              onClick={() => removeStudentFromClass(cls.id, student.id)}
                              className="text-red-500 hover:bg-red-50 p-1 rounded"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-8 border-2 border-dashed border-gray-300 rounded-lg text-center text-sm text-gray-500">
                        Drag students here
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {classes.length === 0 && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <School className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-xl text-gray-500">No classes created yet</p>
                <p className="text-sm text-gray-400 mt-2">Create a class first, then come back here to assign teachers and students</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Hidden drag image container */}
      <div
        ref={dragImageRef}
        style={{
          position: 'fixed',
          top: '-1000px',
          left: '-1000px',
          zIndex: -1
        }}
      />
    </div>
  );
}