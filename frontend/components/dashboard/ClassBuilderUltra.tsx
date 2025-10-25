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
  RefreshCw,
  ChevronLeft,
  Building,
  UserMinus,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';

interface Student {
  id: string;
  name: string;
  email: string;
  grade?: string;
  age?: number;
  gender?: string;
  performance?: 'excellent' | 'good' | 'average' | 'needs-help';
  phone?: string;
  parent_phone?: string;
}

interface Teacher {
  id: string;
  name: string;
  email: string;
  subject?: string;
  qualification?: string;
  experience?: string;
  phone?: string;
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

interface ClassBuilderUltraProps {
  schoolId: string;
  onClose?: () => void;
  onSave?: () => void;
}

export default function ClassBuilderUltra({ schoolId, onClose, onSave }: ClassBuilderUltraProps) {
  // State
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [allTeachers, setAllTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // UI State
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [draggedItems, setDraggedItems] = useState<Student[] | null>(null);
  const [draggedTeacher, setDraggedTeacher] = useState<Teacher | null>(null);
  const [dragOverZone, setDragOverZone] = useState<string | null>(null);

  // Filters - Students
  const [studentSearchTerm, setStudentSearchTerm] = useState('');
  const [filterGrade, setFilterGrade] = useState('all');
  const [filterGender, setFilterGender] = useState('all');
  const [showOnlyUnassigned, setShowOnlyUnassigned] = useState(true);

  // Filters - Teachers
  const [teacherSearchTerm, setTeacherSearchTerm] = useState('');
  const [filterSubject, setFilterSubject] = useState('all');

  const dragImageRef = useRef<HTMLDivElement>(null);

  // Load data from database
  useEffect(() => {
    loadData();
  }, [schoolId]);

  const loadData = async () => {
    setLoading(true);
    console.log('Loading data for school:', schoolId);

    try {
      // Load classes with their enrollments
      const { data: classesData, error: classesError } = await supabase
        .from('classes')
        .select(`
          *,
          class_teachers(teacher_id),
          class_enrollments(student_id)
        `)
        .eq('school_id', schoolId)
        .order('name') as any;

      if (classesError) {
        console.error('Error loading classes:', classesError);
      } else {
        console.log('Loaded classes:', classesData?.length || 0);
      }

      // Try loading students - first try direct school_id, then through profiles
      let studentsData = null;
      let studentsError = null;

      // First try: direct school_id on students table
      const directStudentResult = await supabase
        .from('students')
        .select('*')
        .eq('school_id', schoolId)
        .order('name') as any;

      if (!directStudentResult.error && directStudentResult.data && directStudentResult.data.length > 0) {
        studentsData = directStudentResult.data;
        console.log('✅ Loaded students directly:', studentsData.length);
      } else {
        // Second try: through profiles relationship
        console.log('Trying to load students through profiles...');
        const profileStudentResult = await supabase
          .from('students')
          .select(`
            *,
            profiles:user_id(school_id, display_name, email)
          `) as any;

        if (!profileStudentResult.error && profileStudentResult.data) {
          // Filter by school_id manually if needed
          const filteredStudents = profileStudentResult.data.filter((s: any) =>
            s.school_id === schoolId || s.profiles?.school_id === schoolId
          );

          if (filteredStudents.length > 0) {
            studentsData = filteredStudents;
            console.log('✅ Loaded students through profiles:', studentsData.length);
          } else {
            // Third try: Just get all students and filter client-side
            console.log('Loading all students and filtering...');
            const allStudentsResult = await supabase
              .from('students')
              .select('*') as any;

            if (allStudentsResult.data) {
              studentsData = allStudentsResult.data;
              console.log('✅ Loaded all students (unfiltered):', studentsData.length);
            }
          }
        }

        studentsError = profileStudentResult.error;
      }

      if (studentsError) {
        console.error('Error loading students:', studentsError);
      }
      console.log('Sample student:', studentsData?.[0]);

      // Try loading teachers - first try direct school_id, then through profiles
      let teachersData = null;
      let teachersError = null;

      // First try: direct school_id on teachers table
      const directTeacherResult = await supabase
        .from('teachers')
        .select('*')
        .eq('school_id', schoolId)
        .order('name') as any;

      if (!directTeacherResult.error && directTeacherResult.data && directTeacherResult.data.length > 0) {
        teachersData = directTeacherResult.data;
        console.log('✅ Loaded teachers directly:', teachersData.length);
      } else {
        // Second try: through profiles relationship
        console.log('Trying to load teachers through profiles...');
        const profileTeacherResult = await supabase
          .from('teachers')
          .select(`
            *,
            profiles:user_id(school_id, display_name, email)
          `) as any;

        if (!profileTeacherResult.error && profileTeacherResult.data) {
          // Filter by school_id manually if needed
          const filteredTeachers = profileTeacherResult.data.filter((t: any) =>
            t.school_id === schoolId || t.profiles?.school_id === schoolId
          );

          if (filteredTeachers.length > 0) {
            teachersData = filteredTeachers;
            console.log('✅ Loaded teachers through profiles:', teachersData.length);
          } else {
            // Third try: Just get all teachers and filter client-side
            console.log('Loading all teachers and filtering...');
            const allTeachersResult = await supabase
              .from('teachers')
              .select('*') as any;

            if (allTeachersResult.data) {
              teachersData = allTeachersResult.data;
              console.log('✅ Loaded all teachers (unfiltered):', teachersData.length);
            }
          }
        }

        teachersError = profileTeacherResult.error;
      }

      if (teachersError) {
        console.error('Error loading teachers:', teachersError);
      }
      console.log('Sample teacher:', teachersData?.[0]);

      // Transform classes data
      if (classesData) {
        const transformedClasses = await Promise.all(classesData.map(async (cls: any) => {
          // Get teacher details with profiles relationship for name
          let teacher = null;
          if (cls.class_teachers?.length > 0) {
            const { data: teacherData } = await supabase
              .from('teachers')
              .select(`
                *,
                profiles:user_id(display_name, email)
              `)
              .eq('id', cls.class_teachers[0].teacher_id)
              .single() as any;

            // Transform teacher to include name from profiles
            if (teacherData) {
              const teacherName = teacherData.profiles?.display_name ||
                                 teacherData.profiles?.email?.split('@')[0] ||
                                 'Unknown Teacher';
              const teacherEmail = teacherData.profiles?.email || '';

              teacher = {
                id: teacherData.id,
                name: teacherName,
                email: teacherEmail,
                subject: teacherData.subject,
                qualification: teacherData.qualification,
                experience: teacherData.experience,
                phone: teacherData.phone
              };
            }
          }

          // Get student details
          const studentIds = cls.class_enrollments?.map((e: any) => e.student_id) || [];
          const students = studentsData?.filter((s: any) => studentIds.includes(s.id)) || [];

          return {
            id: cls.id,
            name: cls.name,
            room: cls.room,
            grade: cls.grade,
            capacity: cls.capacity || 30,
            teacher,
            students: students.sort((a: any, b: any) => {
              const nameA = a.name || '';
              const nameB = b.name || '';
              return nameA.localeCompare(nameB);
            }),
            schedule_json: cls.schedule_json
          };
        }));

        setClasses(transformedClasses);

        // Select first class by default
        if (transformedClasses.length > 0 && !selectedClass) {
          setSelectedClass(transformedClasses[0]);
        }
      }

      // Transform students data to include profile info
      const transformedStudents = (studentsData || []).map((student: any) => {
        // Get name from student table, profile display_name, or profile email
        let studentName = student.name ||
                         student.profiles?.display_name ||
                         student.profiles?.email?.split('@')[0] ||
                         'Unknown Student';

        let studentEmail = student.email || student.profiles?.email || '';

        return {
          id: student.id,
          name: studentName,
          email: studentEmail,
          grade: student.grade,
          age: student.age,
          gender: student.gender,
          phone: student.phone,
          parent_phone: student.parent_phone
        };
      });

      // Transform teachers data to include profile info
      const transformedTeachers = (teachersData || []).map((teacher: any) => {
        // Get name from teacher table, profile display_name, or profile email
        let teacherName = teacher.name ||
                         teacher.profiles?.display_name ||
                         teacher.profiles?.email?.split('@')[0] ||
                         'Unknown Teacher';

        let teacherEmail = teacher.email || teacher.profiles?.email || '';

        return {
          id: teacher.id,
          name: teacherName,
          email: teacherEmail,
          subject: teacher.subject,
          qualification: teacher.qualification,
          experience: teacher.experience,
          phone: teacher.phone
        };
      });

      setAllStudents(transformedStudents);
      setAllTeachers(transformedTeachers);
    } catch (error) {
      console.error('Error loading data:', error);
    }
    setLoading(false);
  };

  // Get all students (including assigned) - conflict detection will prevent invalid assignments
  const getUnassignedStudents = () => {
    // Return all students - they can be in multiple classes if schedules don't conflict
    return allStudents;
  };

  // Get all teachers (including assigned) - conflict detection will prevent invalid assignments
  const getUnassignedTeachers = () => {
    // Return all teachers - they can teach multiple classes if schedules don't conflict
    return allTeachers;
  };

  // Check for schedule conflicts
  const checkScheduleConflict = (entityId: string, entityType: 'student' | 'teacher', targetClassId: string): string | null => {
    const targetClass = classes.find((c: any) => c.id === targetClassId);
    if (!targetClass || !targetClass.schedule_json?.schedules) return null;

    const targetSchedules = targetClass.schedule_json.schedules || [];

    // Find all classes that this entity is already in
    const entityClasses = classes.filter((cls: any) => {
      if (cls.id === targetClassId) return false; // Skip the target class
      if (entityType === 'student') {
        return cls.students.some((s: any) => s.id === entityId);
      } else {
        return cls.teacher?.id === entityId;
      }
    });

    // Check each existing class for schedule conflicts
    for (const existingClass of entityClasses) {
      const existingSchedules = existingClass.schedule_json?.schedules || [];

      for (const targetSchedule of targetSchedules) {
        for (const existingSchedule of existingSchedules) {
          // Check if same day and overlapping time
          if (targetSchedule.day === existingSchedule.day) {
            const targetStart = parseTime(targetSchedule.startTime);
            const targetEnd = parseTime(targetSchedule.endTime);
            const existingStart = parseTime(existingSchedule.startTime);
            const existingEnd = parseTime(existingSchedule.endTime);

            // Check for time overlap
            if ((targetStart >= existingStart && targetStart < existingEnd) ||
                (targetEnd > existingStart && targetEnd <= existingEnd) ||
                (targetStart <= existingStart && targetEnd >= existingEnd)) {
              return `⚠️ Conflict: ${entityType === 'student' ? 'Student' : 'Teacher'} already has "${existingClass.name} on ${existingSchedule.day} at ${existingSchedule.startTime}`;
            }
          }
        }
      }
    }

    return null;
  };

  // Helper function to parse time string to minutes
  const parseTime = (timeStr: string): number => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + (minutes || 0);
  };

  // Filter students
  const getFilteredStudents = () => {
    let students = showOnlyUnassigned ? getUnassignedStudents() : allStudents;

    if (studentSearchTerm) {
      students = students.filter((s: any) =>
        s.name.toLowerCase().includes(studentSearchTerm.toLowerCase()) ||
        s.email.toLowerCase().includes(studentSearchTerm.toLowerCase())
      );
    }

    if (filterGrade !== 'all') {
      students = students.filter((s: any) => s.grade === filterGrade);
    }

    if (filterGender !== 'all') {
      students = students.filter((s: any) => s.gender === filterGender);
    }

    return students;
  };

  // Filter teachers - show ALL teachers, not just unassigned
  const getFilteredTeachers = () => {
    let teachers = allTeachers; // Show ALL teachers

    if (teacherSearchTerm) {
      teachers = teachers.filter((t: any) =>
        t.name.toLowerCase().includes(teacherSearchTerm.toLowerCase()) ||
        t.email.toLowerCase().includes(teacherSearchTerm.toLowerCase()) ||
        (t.subject && t.subject.toLowerCase().includes(teacherSearchTerm.toLowerCase()))
      );
    }

    if (filterSubject !== 'all') {
      teachers = teachers.filter((t: any) => t.subject === filterSubject);
    }

    return teachers;
  };

  // Handle student selection
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
  };

  // Handle select all - improved version
  const handleSelectAll = () => {
    const filteredStudents = getFilteredStudents();
    const filteredIds = filteredStudents.map((s: any) => s.id);

    // Check if all filtered students are selected
    const allSelected = filteredIds.every((id: any) => selectedStudents.includes(id));

    if (allSelected) {
      // Deselect all filtered students
      setSelectedStudents(selectedStudents.filter((id: any) => !filteredIds.includes(id)));
    } else {
      // Select all filtered students (merge with existing selection)
      const newSelection = [...new Set([...selectedStudents, ...filteredIds])];
      setSelectedStudents(newSelection);
    }
  };

  // Drag and Drop Handlers
  const handleDragStart = (e: React.DragEvent) => {
    if (selectedStudents.length > 0) {
      const students = allStudents.filter((s: any) => selectedStudents.includes(s.id));
      setDraggedItems(students);
      e.dataTransfer.effectAllowed = 'move';
    }
  };

  const handleTeacherDragStart = (e: React.DragEvent, teacher: Teacher) => {
    setDraggedTeacher(teacher);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverZone('class');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverZone(null);

    if (!selectedClass) return;

    // Handle student drop with conflict detection
    if (draggedItems && draggedItems.length > 0) {
      const conflicts: string[] = [];
      const studentsToAdd: Student[] = [];
      const availableSpace = selectedClass.capacity - selectedClass.students.length;

      for (const student of draggedItems) {
        // Skip if already in class
        if (selectedClass.students.some((s: any) => s.id === student.id)) continue;

        // Check for schedule conflict
        const conflict = checkScheduleConflict(student.id, 'student', selectedClass.id);
        if (conflict) {
          conflicts.push(`${student.name}: ${conflict}`);
        } else if (studentsToAdd.length < availableSpace) {
          studentsToAdd.push(student);
        }
      }

      // Show conflicts if any
      if (conflicts.length > 0) {
        alert(`Schedule Conflicts Detected:\n\n${conflicts.join('\n\n')}\n\nThese students were NOT added to the class.`);
      }

      if (studentsToAdd.length > 0) {
        const updatedClass = {
          ...selectedClass,
          students: [...selectedClass.students, ...studentsToAdd].sort((a: any, b: any) => {
            const nameA = a.name || '';
            const nameB = b.name || '';
            return nameA.localeCompare(nameB);
          })
        };

        setClasses((prev: any) => prev.map((cls: any) =>
          cls.id === selectedClass.id ? updatedClass : cls
        ));
        setSelectedClass(updatedClass);
        setSelectedStudents([]);
        setHasChanges(true);
      }

      setDraggedItems(null);
    }

    // Handle teacher drop with conflict detection
    if (draggedTeacher) {
      // Check for teacher conflicts
      const conflict = checkScheduleConflict(draggedTeacher.id, 'teacher', selectedClass.id);

      if (conflict) {
        alert(`Schedule Conflict Detected:\n\n${draggedTeacher.name}: ${conflict}\n\nThis teacher was NOT assigned to the class.`);
      } else {
        // Teacher can teach multiple classes - just assign to this class (don't remove from others)
        const updatedClass = {
          ...selectedClass,
          teacher: draggedTeacher
        };

        setClasses((prev: any) => prev.map((cls: any) =>
          cls.id === selectedClass.id ? updatedClass : cls
        ));
        setSelectedClass(updatedClass);
        setHasChanges(true);
      }

      setDraggedTeacher(null);
    }
  };

  // Remove student from class
  const removeStudentFromClass = (studentId: string) => {
    if (!selectedClass) return;

    const updatedClass = {
      ...selectedClass,
      students: selectedClass.students.filter((s: any) => s.id !== studentId)
    };

    setClasses((prev: any) => prev.map((cls: any) =>
      cls.id === selectedClass.id ? updatedClass : cls
    ));
    setSelectedClass(updatedClass);
    setHasChanges(true);
  };

  // Remove teacher from class
  const removeTeacherFromClass = () => {
    if (!selectedClass) return;

    const updatedClass = {
      ...selectedClass,
      teacher: null
    };

    setClasses((prev: any) => prev.map((cls: any) =>
      cls.id === selectedClass.id ? updatedClass : cls
    ));
    setSelectedClass(updatedClass);
    setHasChanges(true);
  };

  // Save changes to database
  const saveChanges = async () => {
    setSaving(true);
    setSaveSuccess(false);
    try {
      console.log('🔄 Starting to save class assignments...');

      for (const cls of classes) {
        console.log(`📝 Processing class: ${cls.name} (ID: ${cls.id})`);

        // Update teacher assignment
        console.log('  🗑️ Deleting old teacher assignments...');
        const { error: deleteTeacherError } = await supabase
          .from('class_teachers')
          .delete()
          .eq('class_id', cls.id);

        if (deleteTeacherError) {
          console.error('  ❌ Failed to delete teacher assignments:', deleteTeacherError);
          throw new Error(`Failed to delete teacher assignments for ${cls.name}: ${deleteTeacherError.message}`);
        }

        if (cls.teacher) {
          console.log(`  ➕ Assigning teacher: ${cls.teacher.name} (ID: ${cls.teacher.id})`);
          const { error: insertTeacherError } = await supabase
            .from('class_teachers')
            .insert({
              class_id: cls.id,
              teacher_id: cls.teacher.id
            } as any);

          if (insertTeacherError) {
            console.error('  ❌ Failed to insert teacher assignment:', insertTeacherError);
            throw new Error(`Failed to assign teacher to ${cls.name}: ${insertTeacherError.message}`);
          }
          console.log('  ✅ Teacher assigned successfully');
        }

        // Update student enrollments
        console.log('  🗑️ Deleting old student enrollments...');
        const { error: deleteStudentsError } = await supabase
          .from('class_enrollments')
          .delete()
          .eq('class_id', cls.id);

        if (deleteStudentsError) {
          console.error('  ❌ Failed to delete student enrollments:', deleteStudentsError);
          throw new Error(`Failed to delete student enrollments for ${cls.name}: ${deleteStudentsError.message}`);
        }

        if (cls.students.length > 0) {
          console.log(`  ➕ Enrolling ${cls.students.length} students...`);
          const enrollments = cls.students.map((student: any) => ({
            class_id: cls.id,
            student_id: student.id
          }));

          const { error: insertStudentsError } = await supabase
            .from('class_enrollments')
            .insert(enrollments as any);

          if (insertStudentsError) {
            console.error('  ❌ Failed to insert student enrollments:', insertStudentsError);
            console.error('  📋 Attempted enrollments:', enrollments);
            throw new Error(`Failed to enroll students in ${cls.name}: ${insertStudentsError.message}`);
          }
          console.log(`  ✅ ${cls.students.length} students enrolled successfully`);
        } else {
          console.log('  ℹ️ No students to enroll for this class');
        }

        console.log(`✅ Class ${cls.name} saved successfully\n`);
      }

      console.log('🎉 All class assignments saved successfully!');
      setSaveSuccess(true);
      setHasChanges(false);
      setTimeout(() => setSaveSuccess(false), 3000);

      // Call the onSave callback to refresh parent data
      if (onSave) {
        console.log('🔄 Refreshing parent data...');
        onSave();
      }
    } catch (error: any) {
      console.error('❌ Error saving changes:', error);
      alert(`Failed to save changes: ${error.message}`);
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-lg font-medium text-gray-700">Loading class data...</p>
        </div>
      </div>
    );
  }

  const filteredStudents = getFilteredStudents();
  const filteredTeachers = getFilteredTeachers();
  const utilization = selectedClass ? (selectedClass.students.length / selectedClass.capacity) * 100 : 0;

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-gray-50 via-white to-blue-50">
      {/* Header with Class Selector */}
      <div className="bg-white border-b shadow-sm">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6 flex-1">
              <div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Class Builder Ultra
                </h2>
                <p className="text-sm text-gray-500 mt-0.5">Professional class management system</p>
              </div>

              {/* Class Selector */}
              <div className="flex-1 max-w-md">
                <label className="block text-xs font-medium text-gray-700 mb-1">Select Class to Manage</label>
                <select
                  value={selectedClass?.id || ''}
                  onChange={(e) => {
                    const cls = classes.find((c: any) => c.id === e.target.value);
                    setSelectedClass(cls || null);
                  }}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium bg-white shadow-sm hover:border-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Choose a class...</option>
                  {classes.map((cls: any) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name} {cls.room && `- ${cls.room}`} ({cls.students.length}/{cls.capacity} students)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {hasChanges && (
                <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  Unsaved Changes
                </span>
              )}

              {saveSuccess && (
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium flex items-center animate-pulse">
                  <CheckCircle2 className="w-4 h-4 mr-1" />
                  Saved!
                </span>
              )}

              <button
                onClick={loadData}
                className="px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center font-medium shadow-sm"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </button>

              <button
                onClick={saveChanges}
                disabled={saving || !hasChanges}
                className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-lg hover:from-emerald-700 hover:to-green-700 disabled:opacity-50 flex items-center font-medium shadow-sm disabled:cursor-not-allowed"
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

        {/* Class Stats Bar */}
        {selectedClass && (
          <div className="px-6 pb-4">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4">
              <div className="grid grid-cols-5 gap-4">
                <div className="text-center">
                  <p className="text-xs text-gray-600 mb-1">Class</p>
                  <p className="text-lg font-bold text-gray-900">{selectedClass.name}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-600 mb-1">Room</p>
                  <p className="text-lg font-semibold text-gray-700">{selectedClass.room || 'Not Set'}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-600 mb-1">Grade</p>
                  <p className="text-lg font-semibold text-gray-700">{selectedClass.grade || 'All'}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-600 mb-1">Capacity</p>
                  <div className="flex items-center justify-center">
                    <p className={`text-lg font-bold ${
                      utilization > 100 ? 'text-red-600' :
                      utilization > 80 ? 'text-yellow-600' :
                      'text-green-600'
                    }`}>
                      {selectedClass.students.length}/{selectedClass.capacity}
                    </p>
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-600 mb-1">Teacher</p>
                  <p className="text-lg font-semibold text-gray-700">
                    {selectedClass.teacher ? '✅ Assigned' : '❌ None'}
                  </p>
                </div>
              </div>

              {/* Capacity Progress Bar */}
              <div className="mt-3">
                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      utilization > 100 ? 'bg-red-500' :
                      utilization > 80 ? 'bg-yellow-500' :
                      'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(utilization, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1 text-center">
                  {utilization.toFixed(0)}% Full
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {!selectedClass ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <School className="w-20 h-20 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No Class Selected</h3>
            <p className="text-gray-500">Please select a class from the dropdown above to start managing students and teachers</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex overflow-hidden">
          {/* Left Panel - Students */}
          <div className="w-1/3 border-r bg-white flex flex-col shadow-sm">
            <div className="p-4 border-b bg-gradient-to-r from-blue-50 to-cyan-50">
              <h3 className="font-bold text-gray-900 mb-3 flex items-center justify-between">
                <span className="flex items-center">
                  <Users className="w-5 h-5 mr-2 text-blue-600" />
                  Available Students
                  <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                    {filteredStudents.length}
                  </span>
                </span>
                <button
                  onClick={handleSelectAll}
                  className="text-xs px-3 py-1 bg-blue-600 text-white rounded-full hover:bg-blue-700 font-medium"
                >
                  {selectedStudents.length === filteredStudents.length ? 'Deselect' : 'Select All'}
                </button>
              </h3>

              {/* Student Filters */}
              <div className="space-y-2">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search students by name or email..."
                    value={studentSearchTerm}
                    onChange={(e) => setStudentSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex gap-2">
                  <select
                    value={filterGrade}
                    onChange={(e) => setFilterGrade(e.target.value)}
                    className="flex-1 px-2 py-1.5 text-sm border rounded-lg"
                  >
                    <option value="all">All Grades</option>
                    {['KG', ...Array.from({length: 12}, (_, i) => i + 1)].map((grade: any) => (
                      <option key={grade} value={grade.toString()}>
                        {grade === 'KG' ? 'KG' : `Grade ${grade}`}
                      </option>
                    ))}
                  </select>

                  <select
                    value={filterGender}
                    onChange={(e) => setFilterGender(e.target.value)}
                    className="flex-1 px-2 py-1.5 text-sm border rounded-lg"
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
                    className="mr-2 rounded"
                  />
                  <span className="text-gray-700">Show only unassigned students</span>
                </label>
              </div>
            </div>

            {/* Selected Students Info */}
            {selectedStudents.length > 0 && (
              <div className="px-4 py-3 bg-blue-50 border-b">
                <p className="text-sm font-semibold text-blue-900">
                  {selectedStudents.length} student{selectedStudents.length !== 1 && 's'} selected
                </p>
                <p className="text-xs text-blue-700 mt-0.5">Drag to add to {selectedClass.name}</p>
              </div>
            )}

            {/* Student List */}
            <div
              className="flex-1 overflow-y-auto p-4 space-y-2"
              draggable={selectedStudents.length > 0}
              onDragStart={handleDragStart}
            >
              {filteredStudents.length === 0 ? (
                <div className="text-center py-8">
                  <UserX className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">No students found</p>
                  <p className="text-gray-400 text-xs mt-1">Try adjusting your filters</p>
                </div>
              ) : (
                filteredStudents.map((student: any) => (
                  <div
                    key={student.id}
                    onClick={(e) => handleSelectStudent(student.id, e)}
                    className={`p-3 rounded-lg border-2 cursor-pointer transition-all transform hover:scale-[1.02] ${
                      selectedStudents.includes(student.id)
                        ? 'bg-blue-50 border-blue-400 shadow-sm'
                        : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm'
                    }`}
                  >
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedStudents.includes(student.id)}
                        onChange={() => {}}
                        className="mr-3 h-4 w-4 text-blue-600 rounded"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-gray-900 truncate">{student.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-gray-500 truncate">{student.email}</span>
                        </div>
                        {(student.grade || student.gender) && (
                          <div className="flex items-center gap-2 mt-1">
                            {student.grade && (
                              <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded text-xs">
                                {student.grade}
                              </span>
                            )}
                            {student.gender && (
                              <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                                {student.gender}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Center Panel - Current Class */}
          <div
            className="flex-1 flex flex-col bg-white"
            onDragOver={handleDragOver}
            onDragLeave={() => setDragOverZone(null)}
            onDrop={handleDrop}
          >
            <div className="p-6 flex-1 overflow-y-auto">
              <div className={`h-full rounded-xl border-2 transition-all ${
                dragOverZone === 'class'
                  ? 'border-blue-400 bg-blue-50 shadow-xl'
                  : 'border-gray-200 bg-gray-50'
              }`}>
                {/* Teacher Assignment */}
                <div className="p-6 border-b bg-white rounded-t-xl">
                  <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                    <GraduationCap className="w-5 h-5 mr-2 text-purple-600" />
                    Class Teacher
                  </h4>
                  {selectedClass.teacher ? (
                    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg border border-purple-200">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                          <GraduationCap className="w-6 h-6 text-purple-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{selectedClass.teacher.name}</p>
                          <p className="text-sm text-gray-600">{selectedClass.teacher.subject || 'General'}</p>
                          {selectedClass.teacher.email && (
                            <p className="text-xs text-gray-500 mt-0.5">{selectedClass.teacher.email}</p>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={removeTeacherFromClass}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <UserMinus className="w-5 h-5" />
                      </button>
                    </div>
                  ) : (
                    <div className="p-8 border-2 border-dashed border-purple-300 rounded-lg text-center bg-purple-50">
                      <GraduationCap className="w-12 h-12 text-purple-300 mx-auto mb-3" />
                      <p className="text-sm font-medium text-purple-700">No teacher assigned</p>
                      <p className="text-xs text-purple-500 mt-1">Drag a teacher from the right panel</p>
                    </div>
                  )}
                </div>

                {/* Students List */}
                <div className="p-6">
                  <h4 className="font-semibold text-gray-900 mb-4 flex items-center justify-between">
                    <span className="flex items-center">
                      <Users className="w-5 h-5 mr-2 text-blue-600" />
                      Enrolled Students
                      <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                        {selectedClass.students.length}
                      </span>
                    </span>
                    {selectedClass.students.length > 0 && (
                      <button
                        onClick={() => {
                          if (confirm(`Remove all ${selectedClass.students.length} students from this class?`)) {
                            const updatedClass = { ...selectedClass, students: [] };
                            setClasses((prev: any) => prev.map((cls: any) =>
                              cls.id === selectedClass.id ? updatedClass : cls
                            ));
                            setSelectedClass(updatedClass);
                            setHasChanges(true);
                          }
                        }}
                        className="text-xs px-3 py-1 text-red-600 hover:bg-red-50 rounded-full font-medium"
                      >
                        Remove All
                      </button>
                    )}
                  </h4>

                  {selectedClass.students.length === 0 ? (
                    <div className="py-16 text-center">
                      <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500 font-medium">No students enrolled</p>
                      <p className="text-sm text-gray-400 mt-2">
                        Select students from the left panel and drag them here
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-2">
                      {selectedClass.students.map((student: any, index: any) => (
                        <div
                          key={student.id}
                          className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-all group"
                        >
                          <div className="flex items-center space-x-3 flex-1 min-w-0">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                              <span className="text-xs font-bold text-blue-600">{index + 1}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm text-gray-900 truncate">{student.name}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                {student.grade && (
                                  <span className="text-xs text-gray-500">{student.grade}</span>
                                )}
                                {student.gender && (
                                  <span className="text-xs text-gray-400">• {student.gender}</span>
                                )}
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => removeStudentFromClass(student.id)}
                            className="opacity-0 group-hover:opacity-100 p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-all"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel - Teachers */}
          <div className="w-1/3 border-l bg-white flex flex-col shadow-sm">
            <div className="p-4 border-b bg-gradient-to-r from-purple-50 to-pink-50">
              <h3 className="font-bold text-gray-900 mb-3 flex items-center">
                <GraduationCap className="w-5 h-5 mr-2 text-purple-600" />
                Available Teachers
                <span className="ml-2 px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                  {filteredTeachers.length}
                </span>
              </h3>

              {/* Teacher Search */}
              <div className="space-y-2">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search teachers..."
                    value={teacherSearchTerm}
                    onChange={(e) => setTeacherSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                {/* Subject Filter */}
                <select
                  value={filterSubject}
                  onChange={(e) => setFilterSubject(e.target.value)}
                  className="w-full px-2 py-1.5 text-sm border rounded-lg"
                >
                  <option value="all">All Subjects</option>
                  {Array.from(new Set(allTeachers.map((t: any) => t.subject).filter(Boolean))).map((subject: any) => (
                    <option key={subject} value={subject}>{subject}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Teacher List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {filteredTeachers.length === 0 ? (
                <div className="text-center py-8">
                  <UserX className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">No available teachers</p>
                  <p className="text-gray-400 text-xs mt-1">All teachers may be assigned</p>
                </div>
              ) : (
                filteredTeachers.map((teacher: any) => {
                  // Find which class this teacher is assigned to
                  const assignedClass = classes.find((cls: any) => cls.teacher?.id === teacher.id);
                  const isAssigned = !!assignedClass;

                  return (
                    <div
                      key={teacher.id}
                      draggable
                      onDragStart={(e) => handleTeacherDragStart(e, teacher)}
                      className={`p-4 rounded-lg border-2 cursor-move transition-all transform hover:scale-[1.02] group ${
                        isAssigned
                          ? 'border-orange-300 bg-orange-50 hover:border-orange-400'
                          : 'border-gray-200 bg-white hover:border-purple-400'
                      } hover:shadow-md`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                          isAssigned
                            ? 'bg-orange-200 group-hover:bg-orange-300'
                            : 'bg-purple-100 group-hover:bg-purple-200'
                        }`}>
                          <GraduationCap className={`w-5 h-5 ${
                            isAssigned ? 'text-orange-700' : 'text-purple-600'
                          }`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-gray-900 truncate">{teacher.name}</p>
                          <p className="text-xs text-gray-600 truncate">{teacher.subject || 'General Teacher'}</p>
                          {isAssigned && (
                            <div className="flex items-center mt-1">
                              <CheckCircle2 className="w-3 h-3 mr-1 text-orange-600" />
                              <p className="text-xs text-orange-700 font-medium truncate">
                                Teaching: {assignedClass.name}
                              </p>
                            </div>
                          )}
                          {!isAssigned && teacher.qualification && (
                            <p className="text-xs text-gray-500 mt-0.5 truncate">{teacher.qualification}</p>
                          )}
                        </div>
                        <Move className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Info Section */}
            <div className="p-4 border-t bg-gradient-to-r from-purple-50 to-pink-50">
              <div className="p-3 bg-white rounded-lg border border-purple-200">
                <p className="text-xs text-purple-700 font-medium flex items-start">
                  <Info className="w-3 h-3 mr-1 mt-0.5 flex-shrink-0" />
                  <span>
                    Drag teachers to assign them to the selected class. Each class can have one main teacher.
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

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