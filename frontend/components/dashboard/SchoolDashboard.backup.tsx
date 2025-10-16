'use client';

import { useState, Suspense } from 'react';
import ClassBuilder from './ClassBuilder';
import {
  Users,
  UserPlus,
  GraduationCap,
  BookOpen,
  Calendar,
  Bell,
  Settings,
  Search,
  Filter,
  Download,
  Upload,
  Edit,
  Trash2,
  Eye,
  Mail,
  Phone,
  MapPin,
  Award,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  TrendingUp,
  BarChart3,
  FileText,
  Briefcase,
  Home,
  ChevronRight,
  Plus,
  MoreVertical,
  Send,
  Link2,
  Copy,
  Share2,
  RefreshCw,
  Shield,
  Key,
  CreditCard,
  DollarSign,
  Target,
  Activity,
  Zap,
  Package,
  Grid,
  List,
  ChevronDown,
  School,
  PieChart,
  Move,
  ArrowRight,
  X
} from 'lucide-react';

export default function SchoolDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [showAddModal, setShowAddModal] = useState(false);
  const [addModalType, setAddModalType] = useState<'student' | 'teacher' | 'parent' | 'class'>('student');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [bulkUploadType, setBulkUploadType] = useState<'students' | 'teachers' | 'parents'>('students');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [activeSettingsPanel, setActiveSettingsPanel] = useState<string | null>(null);
  const [uploadedData, setUploadedData] = useState<any[]>([]);
  const [duplicates, setDuplicates] = useState<any[]>([]);
  const [showDuplicateReview, setShowDuplicateReview] = useState(false);
  const [showStudentDetails, setShowStudentDetails] = useState<any>(null);
  const [editingStudent, setEditingStudent] = useState<any>(null);
  
  // Assignment filters
  const [classFilter, setClassFilter] = useState('all');
  const [teacherFilter, setTeacherFilter] = useState('all');
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Reports filters
  const [reportDateRange, setReportDateRange] = useState('30days');
  const [performanceFilter, setPerformanceFilter] = useState('average');

  // Mock school data - Al-Noor Academy
  const schoolInfo = {
    name: 'Al-Noor Academy',
    id: 'SCH-001',
    location: 'New York, USA',
    established: '2015',
    principal: 'Dr. Ahmad Hassan',
    subscription: 'Premium',
    validUntil: '2025-12-31'
  };

  const stats = {
    totalStudents: 245,
    totalTeachers: 18,
    totalParents: 198,
    totalClasses: 12,
    activeAssignments: 156,
    completionRate: 82.5,
    attendanceToday: 94.2,
    upcomingEvents: 8
  };

  const [students, setStudents] = useState([
    { id: 'STU001', name: 'Fatima Al-Zahra', age: 12, grade: '6th Grade', class: 'Class 6A', email: 'fatima@example.com', phone: '+1 234-567-8901', parent: 'Ahmed Al-Zahra', joinDate: '2023-01-15', progress: 85, attendance: 96, status: 'active', memorized: '15 Juz' },
    { id: 'STU002', name: 'Abdullah Khan', age: 11, grade: '5th Grade', class: 'Class 5B', email: 'abdullah@example.com', phone: '+1 234-567-8902', parent: 'Omar Khan', joinDate: '2023-02-20', progress: 78, attendance: 92, status: 'active', memorized: '12 Juz' },
    { id: 'STU003', name: 'Aisha Ibrahim', age: 13, grade: '7th Grade', class: 'Class 7A', email: 'aisha@example.com', phone: '+1 234-567-8903', parent: 'Ibrahim Hassan', joinDate: '2022-09-01', progress: 92, attendance: 98, status: 'active', memorized: '20 Juz' },
    { id: 'STU004', name: 'Omar Hassan', age: 10, grade: '4th Grade', class: 'Class 4A', email: 'omar@example.com', phone: '+1 234-567-8904', parent: 'Hassan Ali', joinDate: '2023-03-10', progress: 65, attendance: 88, status: 'active', memorized: '8 Juz' },
    { id: 'STU005', name: 'Maryam Ahmed', age: 14, grade: '8th Grade', class: 'Class 8B', email: 'maryam@example.com', phone: '+1 234-567-8905', parent: 'Ahmed Rashid', joinDate: '2022-01-05', progress: 88, attendance: 95, status: 'active', memorized: '18 Juz' },
  ]);

  const teachers = [
    { id: 'TCH001', name: 'Sheikh Muhammad Ali', subject: 'Quran Memorization', classes: ['6A', '7A', '8B'], email: 'mali@alnoor.edu', phone: '+1 234-567-9001', joinDate: '2020-08-15', students: 45, status: 'active', qualification: 'Ijazah in Quran', experience: '10 years' },
    { id: 'TCH002', name: 'Ustadha Sarah Ahmed', subject: 'Tajweed', classes: ['5B', '6A'], email: 'sarah@alnoor.edu', phone: '+1 234-567-9002', joinDate: '2021-01-10', students: 38, status: 'active', qualification: 'Masters in Islamic Studies', experience: '8 years' },
    { id: 'TCH003', name: 'Imam Abdul Rahman', subject: 'Islamic Studies', classes: ['4A', '5B', '6A'], email: 'rahman@alnoor.edu', phone: '+1 234-567-9003', joinDate: '2019-09-01', students: 52, status: 'active', qualification: 'PhD Islamic Theology', experience: '15 years' },
    { id: 'TCH004', name: 'Sister Khadija Noor', subject: 'Arabic Language', classes: ['7A', '8B'], email: 'khadija@alnoor.edu', phone: '+1 234-567-9004', joinDate: '2022-03-20', students: 40, status: 'active', qualification: 'BA Arabic Literature', experience: '6 years' },
  ];

  const parents = [
    { id: 'PAR001', name: 'Ahmed Al-Zahra', children: ['Fatima Al-Zahra', 'Hassan Al-Zahra'], email: 'ahmed.zahra@email.com', phone: '+1 234-567-8001', occupation: 'Engineer', address: '123 Main St, NY', status: 'active', joinDate: '2023-01-15' },
    { id: 'PAR002', name: 'Omar Khan', children: ['Abdullah Khan'], email: 'omar.khan@email.com', phone: '+1 234-567-8002', occupation: 'Doctor', address: '456 Oak Ave, NY', status: 'active', joinDate: '2023-02-20' },
    { id: 'PAR003', name: 'Ibrahim Hassan', children: ['Aisha Ibrahim'], email: 'ibrahim.h@email.com', phone: '+1 234-567-8003', occupation: 'Teacher', address: '789 Elm St, NY', status: 'active', joinDate: '2022-09-01' },
    { id: 'PAR004', name: 'Hassan Ali', children: ['Omar Hassan', 'Ali Hassan'], email: 'hassan.ali@email.com', phone: '+1 234-567-8004', occupation: 'Business Owner', address: '321 Pine Rd, NY', status: 'active', joinDate: '2023-03-10' },
  ];

  const classes = [
    { id: 'CLS001', name: 'Class 4A', grade: '4th Grade', teacher: 'Imam Abdul Rahman', students: 20, schedule: 'Mon-Fri 8:00 AM', room: 'Room 101', subjects: ['Quran', 'Arabic', 'Islamic Studies'] },
    { id: 'CLS002', name: 'Class 5B', grade: '5th Grade', teacher: 'Ustadha Sarah Ahmed', students: 22, schedule: 'Mon-Fri 8:30 AM', room: 'Room 102', subjects: ['Quran', 'Tajweed', 'Arabic'] },
    { id: 'CLS003', name: 'Class 6A', grade: '6th Grade', teacher: 'Sheikh Muhammad Ali', students: 18, schedule: 'Mon-Fri 9:00 AM', room: 'Room 201', subjects: ['Quran Memorization', 'Tajweed', 'Islamic Studies'] },
    { id: 'CLS004', name: 'Class 7A', grade: '7th Grade', teacher: 'Sister Khadija Noor', students: 24, schedule: 'Mon-Fri 9:30 AM', room: 'Room 202', subjects: ['Advanced Quran', 'Arabic', 'Fiqh'] },
    { id: 'CLS005', name: 'Class 8B', grade: '8th Grade', teacher: 'Sheikh Muhammad Ali', students: 21, schedule: 'Mon-Fri 10:00 AM', room: 'Room 301', subjects: ['Quran Completion', 'Advanced Tajweed', 'Hadith'] },
  ];

  const recentActivities = [
    { id: 1, type: 'student_added', description: 'New student Zainab Ali enrolled in Class 5B', time: '2 hours ago', icon: UserPlus, color: 'text-green-600 bg-green-100' },
    { id: 2, type: 'assignment', description: 'Surah Al-Mulk assignment created for Class 7A', time: '4 hours ago', icon: FileText, color: 'text-blue-600 bg-blue-100' },
    { id: 3, type: 'achievement', description: 'Fatima Al-Zahra completed Juz 15', time: '1 day ago', icon: Award, color: 'text-purple-600 bg-purple-100' },
    { id: 4, type: 'meeting', description: 'Parent-teacher meeting scheduled for next week', time: '2 days ago', icon: Calendar, color: 'text-orange-600 bg-orange-100' },
  ];

  const upcomingEvents = [
    { id: 1, title: 'Quran Competition', date: '2025-01-15', time: '10:00 AM', type: 'competition' },
    { id: 2, title: 'Parent-Teacher Meeting', date: '2025-01-20', time: '2:00 PM', type: 'meeting' },
    { id: 3, title: 'Ramadan Program Begins', date: '2025-03-01', time: 'All Day', type: 'program' },
    { id: 4, title: 'Annual Graduation', date: '2025-06-15', time: '5:00 PM', type: 'ceremony' },
  ];

  const handleSelectUser = (userId: string) => {
    setSelectedUsers((prev: any) => 
      prev.includes(userId) 
        ? prev.filter((id: any) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSelectAll = () => {
    if (selectedUsers.length === students.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(students.map((s: any) => s.id));
    }
  };

  // Student Actions
  const handleDeleteStudents = (studentIds: string[]) => {
    if (confirm(`Are you sure you want to delete ${studentIds.length} student(s)?`)) {
      setStudents((prev: any) => prev.filter((s: any) => !studentIds.includes(s.id)));
      setSelectedUsers([]);
      alert(`Successfully deleted ${studentIds.length} student(s)`);
    }
  };

  const handleExportStudents = () => {
    const csv = [
      'ID,Name,Age,Grade,Class,Email,Phone,Parent,Progress,Attendance,Memorized',
      ...students.map((s: any) => 
        `${s.id},${s.name},${s.age},${s.grade},${s.class},${s.email},${s.phone},${s.parent},${s.progress},${s.attendance},${s.memorized}`
      )
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `students_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const handleSendEmail = (studentIds: string[]) => {
    const selectedStudents = students.filter((s: any) => studentIds.includes(s.id));
    const emails = selectedStudents.map((s: any) => s.email).join(', ');
    window.location.href = `mailto:${emails}`;
  };

  const handleEditStudent = (student: any) => {
    setEditingStudent({ ...student });
  };

  const handleSaveStudent = () => {
    if (editingStudent) {
      setStudents((prev: any) => prev.map((s: any) => 
        s.id === editingStudent.id ? editingStudent : s
      ));
      setEditingStudent(null);
      alert('Student updated successfully!');
    }
  };

  const renderAddModal = () => {
    if (!showAddModal) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Add New {addModalType.charAt(0).toUpperCase() + addModalType.slice(1)}</h2>
              <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          <div className="p-6">
            <form className="space-y-4">
              {addModalType === 'student' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                      <input type="text" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Enter student name" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Age *</label>
                      <input type="number" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Age" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Grade *</label>
                      <select className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
                        <option>Select Grade</option>
                        <option>4th Grade</option>
                        <option>5th Grade</option>
                        <option>6th Grade</option>
                        <option>7th Grade</option>
                        <option>8th Grade</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Class *</label>
                      <select className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
                        <option>Select Class</option>
                        {classes.map((cls: any) => (
                          <option key={cls.id}>{cls.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <input type="email" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="student@email.com" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                      <input type="tel" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="+1 234-567-8900" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Parent Name *</label>
                    <input type="text" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Parent full name" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                    <textarea className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" rows={2} placeholder="Home address"></textarea>
                  </div>
                </>
              )}

              {addModalType === 'teacher' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                      <input type="text" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Enter teacher name" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Subject *</label>
                      <select className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
                        <option>Select Subject</option>
                        <option>Quran Memorization</option>
                        <option>Tajweed</option>
                        <option>Islamic Studies</option>
                        <option>Arabic Language</option>
                        <option>Fiqh</option>
                        <option>Hadith</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                      <input type="email" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="teacher@alnoor.edu" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                      <input type="tel" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="+1 234-567-8900" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Qualification</label>
                      <input type="text" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="e.g., Ijazah, Masters" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Experience</label>
                      <input type="text" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="e.g., 5 years" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Assign Classes</label>
                    <div className="space-y-2">
                      {classes.map((cls: any) => (
                        <label key={cls.id} className="flex items-center">
                          <input type="checkbox" className="mr-2" />
                          <span className="text-sm">{cls.name} - {cls.grade}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {addModalType === 'parent' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                      <input type="text" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Enter parent name" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Occupation</label>
                      <input type="text" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Occupation" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                      <input type="email" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="parent@email.com" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                      <input type="tel" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="+1 234-567-8900" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                    <textarea className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" rows={2} placeholder="Home address"></textarea>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Link Children</label>
                    <select multiple className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" size={4}>
                      {students.map((student: any) => (
                        <option key={student.id}>{student.name}</option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple children</p>
                  </div>
                </>
              )}

              {addModalType === 'class' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Class Name *</label>
                      <input type="text" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="e.g., Class 9A" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Grade Level *</label>
                      <select className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
                        <option>Select Grade</option>
                        <option>4th Grade</option>
                        <option>5th Grade</option>
                        <option>6th Grade</option>
                        <option>7th Grade</option>
                        <option>8th Grade</option>
                        <option>9th Grade</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Room Number</label>
                      <input type="text" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="e.g., Room 101" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Schedule *</label>
                      <input type="text" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="e.g., Mon-Fri 8:00 AM" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Assign Teacher *</label>
                    <select className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
                      <option>Select Teacher</option>
                      {teachers.map((teacher: any) => (
                        <option key={teacher.id}>{teacher.name} - {teacher.subject}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Subjects</label>
                    <div className="grid grid-cols-2 gap-2">
                      {['Quran Memorization', 'Tajweed', 'Islamic Studies', 'Arabic', 'Fiqh', 'Hadith'].map((subject: any) => (
                        <label key={subject} className="flex items-center">
                          <input type="checkbox" className="mr-2" />
                          <span className="text-sm">{subject}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </form>
          </div>

          <div className="p-6 border-t bg-gray-50 flex justify-end space-x-3">
            <button onClick={() => setShowAddModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100">
              Cancel
            </button>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Add {addModalType.charAt(0).toUpperCase() + addModalType.slice(1)}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Confirm Upload Function
  const confirmUpload = (newRows: any[], duplicatesToAdd: any[]) => {
    const allRowsToAdd = [...newRows, ...duplicatesToAdd];
    
    if (bulkUploadType === 'students') {
      const formattedStudents = allRowsToAdd.map((row, index) => ({
        id: row.id || `STU${String(students.length + index + 1).padStart(3, '0')}`,
        name: row.Name || row.name,
        age: parseInt(row.Age) || 0,
        grade: row.Grade || row.grade,
        class: row.Class || row.class,
        email: row.Email || row.email,
        phone: row.Phone || row.phone,
        parent: row['Parent Name'] || row.parent || '',
        joinDate: row.joinDate || new Date().toISOString().split('T')[0],
        progress: row.progress || Math.floor(Math.random() * 30) + 60,
        attendance: row.attendance || Math.floor(Math.random() * 10) + 85,
        status: 'active',
        memorized: row.memorized || `${Math.floor(Math.random() * 10) + 1} Juz`
      }));
      
      setStudents((prev: any) => [...prev, ...formattedStudents]);
      
      // Show success message
      alert(`Successfully uploaded ${allRowsToAdd.length} students!${duplicatesToAdd.length > 0 ? ` (Including ${duplicatesToAdd.length} updated duplicates)` : ''}`);
    }
    
    // Reset states
    setShowBulkUpload(false);
    setShowDuplicateReview(false);
    setUploadedData([]);
    setDuplicates([]);
  };

  // Duplicate Review Modal
  const renderDuplicateReviewModal = () => {
    if (!showDuplicateReview) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b bg-gradient-to-r from-yellow-500 to-orange-600 text-white rounded-t-xl">
            <h2 className="text-2xl font-bold flex items-center">
              <AlertCircle className="w-6 h-6 mr-3" />
              Duplicate Records Detected
            </h2>
            <p className="text-yellow-100 mt-1">
              Found {duplicates.length} duplicate {bulkUploadType} and {uploadedData.length} new records
            </p>
          </div>

          <div className="p-6">
            <div className="mb-6">
              <div className="bg-blue-50 rounded-lg p-4 mb-4">
                <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
                  <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
                  New Records ({uploadedData.length})
                </h3>
                <p className="text-sm text-gray-600">These records will be added to the system.</p>
                {uploadedData.length > 0 && (
                  <div className="mt-3 max-h-32 overflow-y-auto">
                    {uploadedData.slice(0, 3).map((row, idx) => (
                      <div key={idx} className="text-sm text-gray-700 py-1">
                        • {row.Name || row.name} - {row.Email || row.email}
                      </div>
                    ))}
                    {uploadedData.length > 3 && (
                      <p className="text-sm text-gray-500 italic mt-1">
                        ...and {uploadedData.length - 3} more
                      </p>
                    )}
                  </div>
                )}
              </div>

              {duplicates.length > 0 && (
                <div className="bg-yellow-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
                    <AlertCircle className="w-5 h-5 mr-2 text-yellow-600" />
                    Duplicate Records Found ({duplicates.length})
                  </h3>
                  
                  {/* CSV Internal Duplicates */}
                  {duplicates.filter((d: any) => d.duplicateType === 'csv').length > 0 && (
                    <div className="mb-4">
                      <p className="text-sm font-semibold text-red-700 mb-2">
                        ⚠️ Duplicates within your CSV file:
                      </p>
                      <div className="space-y-2 max-h-32 overflow-y-auto">
                        {duplicates.filter((d: any) => d.duplicateType === 'csv').map((row, idx) => (
                          <div key={idx} className="flex items-center justify-between p-2 bg-red-50 rounded border border-red-300">
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900">
                                {row.Name || row.name}
                              </p>
                              <p className="text-xs text-gray-600">
                                {row.Email || row.email} • Line {row.originalLineNumber + 1}
                              </p>
                              <p className="text-xs text-red-600 font-medium">
                                {row.message}
                              </p>
                            </div>
                            <span className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded">
                              CSV Duplicate
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* System Duplicates */}
                  {duplicates.filter((d: any) => d.duplicateType === 'system').length > 0 && (
                    <div>
                      <p className="text-sm font-semibold text-yellow-700 mb-2">
                        ⚠️ Already exist in the system:
                      </p>
                      <div className="space-y-2 max-h-32 overflow-y-auto">
                        {duplicates.filter((d: any) => d.duplicateType === 'system').map((row, idx) => (
                          <div key={idx} className="flex items-center justify-between p-2 bg-yellow-50 rounded border border-yellow-300">
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900">
                                {row.Name || row.name}
                              </p>
                              <p className="text-xs text-gray-600">
                                {row.Email || row.email} • {row.Class || row.class}
                              </p>
                              <p className="text-xs text-yellow-700 font-medium">
                                {row.message}
                              </p>
                            </div>
                            <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-700 rounded">
                              System Duplicate
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Upload Summary</h4>
              <div className="grid grid-cols-4 gap-3 text-center">
                <div>
                  <p className="text-2xl font-bold text-green-600">{uploadedData.length}</p>
                  <p className="text-xs text-gray-500">New Records</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-red-600">
                    {duplicates.filter((d: any) => d.duplicateType === 'csv').length}
                  </p>
                  <p className="text-xs text-gray-500">CSV Duplicates</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-yellow-600">
                    {duplicates.filter((d: any) => d.duplicateType === 'system').length}
                  </p>
                  <p className="text-xs text-gray-500">System Duplicates</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-600">
                    {uploadedData.length + duplicates.length}
                  </p>
                  <p className="text-xs text-gray-500">Total in CSV</p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 border-t bg-gray-50 flex justify-between">
            <button 
              onClick={() => {
                setShowDuplicateReview(false);
                setUploadedData([]);
                setDuplicates([]);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
            >
              Cancel Upload
            </button>
            <div className="space-x-3">
              <button 
                onClick={() => confirmUpload(uploadedData, [])}
                className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
              >
                Skip All Duplicates
              </button>
              <button 
                onClick={() => confirmUpload(uploadedData, duplicates)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Update Duplicates
              </button>
              <button 
                onClick={() => confirmUpload(uploadedData, [])}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Upload New Only ({uploadedData.length})
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Bulk Upload Modal
  const renderBulkUploadModal = () => {
    if (!showBulkUpload) return null;

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const text = event.target?.result as string;
          processCsvData(text);
        };
        reader.readAsText(file);
      }
    };

    const processCsvData = (csvText: string) => {
      const lines = csvText.split('\n');
      const headers = lines[0].split(',').map((h: any) => h.trim());
      const data = [];
      
      for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim()) {
          const values = lines[i].split(',').map((v: any) => v.trim());
          const row: any = {};
          headers.forEach((header, index) => {
            row[header] = values[index] || '';
          });
          
          // Generate ID for new student
          if (bulkUploadType === 'students') {
            const nextId = students.length + data.length + 1;
            row.id = `STU${String(nextId).padStart(3, '0')}`;
            row.joinDate = new Date().toISOString().split('T')[0];
            row.progress = Math.floor(Math.random() * 30) + 60; // Random progress 60-90
            row.attendance = Math.floor(Math.random() * 10) + 85; // Random attendance 85-95
            row.status = 'active';
            row.memorized = `${Math.floor(Math.random() * 10) + 1} Juz`;
            row.originalLineNumber = i; // Track original line number for reporting
          }
          
          data.push(row);
        }
      }
      
      // FIRST: Check for duplicates WITHIN the CSV file itself
      const csvEmailMap = new Map();
      const csvInternalDuplicates = [];
      const uniqueInCsv = [];
      
      data.forEach((row: any) => {
        const email = (row.Email || row.email || '').toLowerCase();
        if (email) {
          if (csvEmailMap.has(email)) {
            // This is a duplicate within the CSV
            csvInternalDuplicates.push({
              ...row,
              duplicateOf: csvEmailMap.get(email).originalLineNumber
            });
          } else {
            csvEmailMap.set(email, row);
            uniqueInCsv.push(row);
          }
        } else {
          // No email, treat as unique but flag it
          uniqueInCsv.push({
            ...row,
            warning: 'No email provided'
          });
        }
      });
      
      // SECOND: Check the unique CSV records against existing students
      const existingEmails = students.map((s: any) => s.email.toLowerCase());
      const systemDuplicates = [];
      const newRows = [];
      
      uniqueInCsv.forEach((row: any) => {
        const email = (row.Email || row.email || '').toLowerCase();
        if (email && existingEmails.includes(email)) {
          // Find the existing student
          const existingStudent = students.find((s: any) => s.email.toLowerCase() === email);
          systemDuplicates.push({
            ...row,
            existingRecord: existingStudent
          });
        } else {
          newRows.push(row);
        }
      });
      
      // Combine all duplicates for review
      const allDuplicates = [
        ...csvInternalDuplicates.map((d: any) => ({
          ...d,
          duplicateType: 'csv',
          message: `Duplicate in CSV (line ${d.originalLineNumber} duplicates line ${d.duplicateOf})`
        })),
        ...systemDuplicates.map((d: any) => ({
          ...d,
          duplicateType: 'system',
          message: `Already exists in system: ${d.existingRecord?.name} (${d.existingRecord?.id})`
        }))
      ];
      
      setUploadedData(newRows);
      setDuplicates(allDuplicates);
      
      // Show duplicate review if ANY duplicates found
      if (allDuplicates.length > 0) {
        setShowDuplicateReview(true);
        setShowBulkUpload(false);
      } else if (newRows.length === 0) {
        alert('No valid records found in the CSV file.');
        setShowBulkUpload(false);
      } else {
        // No duplicates at all, proceed with upload
        confirmUpload(newRows, []);
      }
    };

    const sampleCsv = {
      students: 'Name,Age,Grade,Class,Email,Phone,Parent Name,Address\nJohn Doe,12,6th Grade,Class 6A,john@example.com,+1234567890,Jane Doe,123 Main St\nJane Smith,11,5th Grade,Class 5B,jane@example.com,+1234567891,John Smith,456 Oak Ave',
      teachers: 'Name,Subject,Email,Phone,Qualification,Experience,Classes\nDr. Ahmed Ali,Quran Studies,ahmed@school.edu,+1234567890,PhD Islamic Studies,10 years,"6A,7A,8B"\nSister Fatima,Tajweed,fatima@school.edu,+1234567891,Masters in Tajweed,5 years,"5A,5B"',
      parents: 'Name,Email,Phone,Children,Occupation,Address\nJohn Doe,parent1@example.com,+1234567890,"Jane Doe,John Jr",Engineer,123 Main St\nJane Smith,parent2@example.com,+1234567891,Sarah Smith,Doctor,456 Oak Ave'
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-t-xl">
            <h2 className="text-2xl font-bold flex items-center">
              <Upload className="w-6 h-6 mr-3" />
              Bulk Upload {bulkUploadType.charAt(0).toUpperCase() + bulkUploadType.slice(1)}
            </h2>
            <p className="text-blue-100 mt-1">Upload a CSV file to add multiple {bulkUploadType} at once</p>
          </div>

          <div className="p-6 space-y-6">
            {/* File Upload Area */}
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-400 transition-colors">
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-700 mb-2">Drop your CSV file here or click to browse</p>
              <p className="text-sm text-gray-500 mb-4">Maximum file size: 10MB</p>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
                id="csv-upload"
              />
              <label
                htmlFor="csv-upload"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer"
              >
                <Upload className="w-4 h-4 mr-2" />
                Select CSV File
              </label>
            </div>

            {/* CSV Format Guide */}
            <div className="bg-blue-50 rounded-xl p-4">
              <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
                <FileText className="w-5 h-5 mr-2 text-blue-600" />
                CSV Format Requirements
              </h3>
              <p className="text-sm text-gray-600 mb-3">Your CSV file should have the following columns:</p>
              <div className="bg-white rounded-lg p-3 font-mono text-xs overflow-x-auto">
                {bulkUploadType === 'students' && (
                  <div>
                    <p className="font-semibold text-gray-700 mb-1">Required columns:</p>
                    <p className="text-gray-600">Name, Age, Grade, Class, Email, Phone, Parent Name, Address</p>
                  </div>
                )}
                {bulkUploadType === 'teachers' && (
                  <div>
                    <p className="font-semibold text-gray-700 mb-1">Required columns:</p>
                    <p className="text-gray-600">Name, Subject, Email, Phone, Qualification, Experience, Classes</p>
                  </div>
                )}
                {bulkUploadType === 'parents' && (
                  <div>
                    <p className="font-semibold text-gray-700 mb-1">Required columns:</p>
                    <p className="text-gray-600">Name, Email, Phone, Children, Occupation, Address</p>
                  </div>
                )}
              </div>
            </div>

            {/* Sample CSV */}
            <div className="bg-gray-50 rounded-xl p-4">
              <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
                <Download className="w-5 h-5 mr-2 text-gray-600" />
                Sample CSV
              </h3>
              <p className="text-sm text-gray-600 mb-3">Here's an example of how your CSV should look:</p>
              <div className="bg-white rounded-lg p-3 font-mono text-xs overflow-x-auto whitespace-pre border border-gray-200">
                {sampleCsv[bulkUploadType]}
              </div>
              <button
                onClick={() => {
                  const blob = new Blob([sampleCsv[bulkUploadType]], { type: 'text/csv' });
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `sample_${bulkUploadType}.csv`;
                  a.click();
                }}
                className="mt-3 text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center"
              >
                <Download className="w-4 h-4 mr-1" />
                Download Sample CSV
              </button>
            </div>

            {/* Instructions */}
            <div className="bg-yellow-50 rounded-xl p-4">
              <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
                <AlertCircle className="w-5 h-5 mr-2 text-yellow-600" />
                Important Notes
              </h3>
              <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                <li>The first row must contain column headers exactly as shown above</li>
                <li>Each subsequent row represents one {bulkUploadType.slice(0, -1)}</li>
                <li>Email addresses must be unique</li>
                <li>For classes, use comma-separated values (e.g., "6A,7A,8B")</li>
                <li>Leave fields empty if data is not available</li>
                <li>Maximum 500 records per upload</li>
              </ul>
            </div>
          </div>

          <div className="p-6 border-t bg-gray-50 flex justify-end space-x-3">
            <button 
              onClick={() => setShowBulkUpload(false)} 
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
            >
              Cancel
            </button>
            <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center">
              <CheckCircle className="w-4 h-4 mr-2" />
              Upload & Process
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Student Details Modal
  const renderStudentDetailsModal = () => {
    if (!showStudentDetails) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-t-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Student Details</h2>
              <button 
                onClick={() => setShowStudentDetails(null)}
                className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="p-6 space-y-6">
            <div className="flex items-start space-x-6">
              <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-3xl font-bold text-blue-600">
                  {showStudentDetails?.name?.split(' ').map((n: string) => n[0]).join('')}
                </span>
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-gray-900">{showStudentDetails?.name}</h3>
                <p className="text-sm text-gray-600">Student ID: {showStudentDetails?.id}</p>
                <div className="flex items-center space-x-4 mt-2">
                  <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                    Active
                  </span>
                  <span className="text-sm text-gray-600">
                    Joined: {showStudentDetails?.joinDate}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Personal Information</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Age:</span>
                    <span className="text-sm font-medium">{showStudentDetails?.age} years</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Grade:</span>
                    <span className="text-sm font-medium">{showStudentDetails?.grade}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Class:</span>
                    <span className="text-sm font-medium">{showStudentDetails?.class}</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Contact Information</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Email:</span>
                    <span className="text-sm font-medium">{showStudentDetails?.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Phone:</span>
                    <span className="text-sm font-medium">{showStudentDetails?.phone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Parent:</span>
                    <span className="text-sm font-medium">{showStudentDetails?.parent}</span>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Academic Performance</h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-blue-50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-blue-600">{showStudentDetails?.progress}%</p>
                  <p className="text-sm text-gray-600">Overall Progress</p>
                </div>
                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-green-600">{showStudentDetails?.attendance}%</p>
                  <p className="text-sm text-gray-600">Attendance</p>
                </div>
                <div className="bg-purple-50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-purple-600">{showStudentDetails?.memorized}</p>
                  <p className="text-sm text-gray-600">Memorized</p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 border-t bg-gray-50 flex justify-end space-x-3">
            <button 
              onClick={() => {
                handleEditStudent(showStudentDetails);
                setShowStudentDetails(null);
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Edit Student
            </button>
            <button 
              onClick={() => setShowStudentDetails(null)}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Edit Student Modal
  const renderEditStudentModal = () => {
    if (!editingStudent) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b bg-gradient-to-r from-green-500 to-teal-600 text-white rounded-t-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Edit Student</h2>
              <button 
                onClick={() => setEditingStudent(null)}
                className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input 
                  type="text" 
                  value={editingStudent?.name || ''}
                  onChange={(e) => setEditingStudent({...editingStudent, name: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
                <input 
                  type="number" 
                  value={editingStudent?.age || ''}
                  onChange={(e) => setEditingStudent({...editingStudent, age: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Grade</label>
                <select 
                  value={editingStudent?.grade || ''}
                  onChange={(e) => setEditingStudent({...editingStudent, grade: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                >
                  <option value="4th Grade">4th Grade</option>
                  <option value="5th Grade">5th Grade</option>
                  <option value="6th Grade">6th Grade</option>
                  <option value="7th Grade">7th Grade</option>
                  <option value="8th Grade">8th Grade</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
                <input 
                  type="text" 
                  value={editingStudent?.class || ''}
                  onChange={(e) => setEditingStudent({...editingStudent, class: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input 
                  type="email" 
                  value={editingStudent?.email || ''}
                  onChange={(e) => setEditingStudent({...editingStudent, email: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input 
                  type="tel" 
                  value={editingStudent?.phone || ''}
                  onChange={(e) => setEditingStudent({...editingStudent, phone: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Parent Name</label>
              <input 
                type="text" 
                value={editingStudent?.parent || ''}
                onChange={(e) => setEditingStudent({...editingStudent, parent: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Progress (%)</label>
                <input 
                  type="number" 
                  min="0" 
                  max="100"
                  value={editingStudent?.progress || ''}
                  onChange={(e) => setEditingStudent({...editingStudent, progress: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Attendance (%)</label>
                <input 
                  type="number" 
                  min="0" 
                  max="100"
                  value={editingStudent?.attendance || ''}
                  onChange={(e) => setEditingStudent({...editingStudent, attendance: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Memorized</label>
                <input 
                  type="text" 
                  value={editingStudent?.memorized || ''}
                  onChange={(e) => setEditingStudent({...editingStudent, memorized: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>
          </div>

          <div className="p-6 border-t bg-gray-50 flex justify-end space-x-3">
            <button 
              onClick={() => setEditingStudent(null)}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
            >
              Cancel
            </button>
            <button 
              onClick={handleSaveStudent}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Settings Panels
  const renderSettingsPanel = () => {
    if (!activeSettingsPanel) return null;

    const panels: Record<string, any> = {
      'school-profile': {
        title: 'School Profile',
        icon: School,
        content: (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">School Name</label>
                <input type="text" defaultValue={schoolInfo.name} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">School ID</label>
                <input type="text" defaultValue={schoolInfo.id} disabled className="w-full px-4 py-2 border rounded-lg bg-gray-100" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                <input type="text" defaultValue={schoolInfo.location} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Established</label>
                <input type="text" defaultValue={schoolInfo.established} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Principal</label>
              <input type="text" defaultValue={schoolInfo.principal} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">School Logo</label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-sm text-gray-600">Click to upload or drag and drop</p>
                <p className="text-xs text-gray-500 mt-1">PNG, JPG up to 10MB</p>
              </div>
            </div>
          </div>
        )
      },
      'user-management': {
        title: 'User Management',
        icon: Users,
        content: (
          <div className="space-y-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3">User Roles & Permissions</h4>
              <div className="space-y-3">
                {['Admin', 'Teacher', 'Student', 'Parent'].map((role: any) => (
                  <div key={role} className="flex items-center justify-between p-3 bg-white rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Shield className="w-5 h-5 text-gray-500" />
                      <span className="font-medium">{role}</span>
                    </div>
                    <button className="text-sm text-blue-600 hover:text-blue-700">Configure</button>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Bulk User Actions</h4>
              <div className="grid grid-cols-2 gap-3">
                <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Export Users</button>
                <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Import Users</button>
                <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Reset Passwords</button>
                <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Deactivate Users</button>
              </div>
            </div>
          </div>
        )
      },
      'calendar': {
        title: 'Academic Calendar',
        icon: Calendar,
        content: (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Academic Year</label>
                <select className="w-full px-4 py-2 border rounded-lg">
                  <option>2024-2025</option>
                  <option>2023-2024</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Time Zone</label>
                <select className="w-full px-4 py-2 border rounded-lg">
                  <option>EST (UTC-5)</option>
                  <option>CST (UTC-6)</option>
                  <option>PST (UTC-8)</option>
                </select>
              </div>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Important Dates</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm">First Day of School</span>
                  <input type="date" className="px-3 py-1 border rounded" />
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm">Last Day of School</span>
                  <input type="date" className="px-3 py-1 border rounded" />
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm">Ramadan Break</span>
                  <input type="date" className="px-3 py-1 border rounded" />
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm">Eid Holidays</span>
                  <input type="date" className="px-3 py-1 border rounded" />
                </div>
              </div>
            </div>
          </div>
        )
      },
      'billing': {
        title: 'Billing & Subscription',
        icon: CreditCard,
        content: (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-100">Current Plan</p>
                  <p className="text-2xl font-bold mt-1">{schoolInfo.subscription}</p>
                  <p className="text-sm text-purple-100 mt-2">Valid until {schoolInfo.validUntil}</p>
                </div>
                <button className="px-4 py-2 bg-white text-purple-600 rounded-lg font-medium hover:bg-purple-50">
                  Upgrade Plan
                </button>
              </div>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Billing Information</h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
                  <div className="flex items-center space-x-3 p-3 border rounded-lg">
                    <CreditCard className="w-5 h-5 text-gray-500" />
                    <span className="text-sm">**** **** **** 4242</span>
                    <button className="ml-auto text-sm text-blue-600">Change</button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Billing Email</label>
                  <input type="email" defaultValue="billing@alnoor.edu" className="w-full px-4 py-2 border rounded-lg" />
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Usage Statistics</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Active Users</p>
                  <p className="text-xl font-bold">245 / 500</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Storage Used</p>
                  <p className="text-xl font-bold">12 GB / 50 GB</p>
                </div>
              </div>
            </div>
          </div>
        )
      },
      'security': {
        title: 'Security Settings',
        icon: Shield,
        content: (
          <div className="space-y-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Password Policy</h4>
              <div className="space-y-3">
                <label className="flex items-center space-x-3">
                  <input type="checkbox" defaultChecked className="rounded" />
                  <span className="text-sm">Require minimum 8 characters</span>
                </label>
                <label className="flex items-center space-x-3">
                  <input type="checkbox" defaultChecked className="rounded" />
                  <span className="text-sm">Require uppercase and lowercase letters</span>
                </label>
                <label className="flex items-center space-x-3">
                  <input type="checkbox" defaultChecked className="rounded" />
                  <span className="text-sm">Require numbers and special characters</span>
                </label>
                <label className="flex items-center space-x-3">
                  <input type="checkbox" className="rounded" />
                  <span className="text-sm">Enable two-factor authentication</span>
                </label>
              </div>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Session Management</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Session timeout</span>
                  <select className="px-3 py-1 border rounded">
                    <option>30 minutes</option>
                    <option>1 hour</option>
                    <option>2 hours</option>
                    <option>Never</option>
                  </select>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Maximum concurrent sessions</span>
                  <input type="number" defaultValue="3" className="w-20 px-3 py-1 border rounded" />
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Access Logs</h4>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                View Access Logs
              </button>
            </div>
          </div>
        )
      },
      'notifications': {
        title: 'Notification Preferences',
        icon: Bell,
        content: (
          <div className="space-y-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Email Notifications</h4>
              <div className="space-y-3">
                <label className="flex items-center justify-between">
                  <span className="text-sm">New student enrollment</span>
                  <input type="checkbox" defaultChecked className="rounded" />
                </label>
                <label className="flex items-center justify-between">
                  <span className="text-sm">Assignment submissions</span>
                  <input type="checkbox" defaultChecked className="rounded" />
                </label>
                <label className="flex items-center justify-between">
                  <span className="text-sm">Parent messages</span>
                  <input type="checkbox" defaultChecked className="rounded" />
                </label>
                <label className="flex items-center justify-between">
                  <span className="text-sm">System updates</span>
                  <input type="checkbox" className="rounded" />
                </label>
              </div>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Push Notifications</h4>
              <div className="space-y-3">
                <label className="flex items-center justify-between">
                  <span className="text-sm">Critical alerts</span>
                  <input type="checkbox" defaultChecked className="rounded" />
                </label>
                <label className="flex items-center justify-between">
                  <span className="text-sm">Daily summary</span>
                  <input type="checkbox" className="rounded" />
                </label>
              </div>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Notification Schedule</h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Quiet hours start</label>
                  <input type="time" defaultValue="20:00" className="w-full px-3 py-1 border rounded" />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Quiet hours end</label>
                  <input type="time" defaultValue="08:00" className="w-full px-3 py-1 border rounded" />
                </div>
              </div>
            </div>
          </div>
        )
      }
    }; // <-- This closes the panels object

    const panel = panels[activeSettingsPanel as string];
    if (!panel) return null;

    const IconComponent = panel.icon;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-t-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold flex items-center">
                <IconComponent className="w-6 h-6 mr-3" />
                {panel.title}
              </h2>
              <button 
                onClick={() => setActiveSettingsPanel(null)}
                className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="p-6">
            {panel.content}
          </div>

          <div className="p-6 border-t bg-gray-50 flex justify-end space-x-3">
            <button 
              onClick={() => setActiveSettingsPanel(null)} 
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
            >
              Cancel
            </button>
            <button 
              onClick={() => {
                alert('Settings saved successfully!');
                setActiveSettingsPanel(null);
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                <School className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{schoolInfo.name}</h1>
                <p className="text-sm text-gray-500">School ID: {schoolInfo.id} • {schoolInfo.location}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <span className="px-3 py-1 bg-purple-100 text-purple-700 text-sm rounded-full font-medium">
                {schoolInfo.subscription} Plan
              </span>
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 hover:bg-gray-100 rounded-lg relative"
              >
                <Bell className="w-5 h-5 text-gray-600" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
              </button>
              <button 
                onClick={() => setShowSettings(!showSettings)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <Settings className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>
        </div>
        
        {/* Notifications Dropdown */}
        {showNotifications && (
          <div className="absolute right-6 top-16 w-96 bg-white rounded-xl shadow-2xl border border-gray-200 z-50">
            <div className="p-4 border-b">
              <h3 className="font-semibold text-gray-900">Notifications</h3>
            </div>
            <div className="max-h-96 overflow-y-auto">
              <div className="p-4 hover:bg-gray-50 border-b cursor-pointer">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">New student enrolled</p>
                    <p className="text-xs text-gray-500">Ahmad Hassan joined Class 6A</p>
                    <p className="text-xs text-gray-400 mt-1">2 hours ago</p>
                  </div>
                </div>
              </div>
              <div className="p-4 hover:bg-gray-50 border-b cursor-pointer">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Assignment completed</p>
                    <p className="text-xs text-gray-500">15 students completed Surah Al-Fatihah memorization</p>
                    <p className="text-xs text-gray-400 mt-1">5 hours ago</p>
                  </div>
                </div>
              </div>
              <div className="p-4 hover:bg-gray-50 border-b cursor-pointer">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Parent meeting scheduled</p>
                    <p className="text-xs text-gray-500">Meeting with parents of Class 7A tomorrow at 3 PM</p>
                    <p className="text-xs text-gray-400 mt-1">Yesterday</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-3 border-t">
              <button className="w-full text-center text-sm text-blue-600 hover:text-blue-700 font-medium">
                View All Notifications
              </button>
            </div>
          </div>
        )}
        
        {/* Settings Dropdown */}
        {showSettings && (
          <div className="absolute right-6 top-16 w-80 bg-white rounded-xl shadow-2xl border border-gray-200 z-50">
            <div className="p-4 border-b">
              <h3 className="font-semibold text-gray-900">School Settings</h3>
            </div>
            <div className="p-2">
              <button 
                onClick={() => {
                  setActiveSettingsPanel('school-profile');
                  setShowSettings(false);
                }}
                className="w-full text-left px-4 py-2 hover:bg-gray-50 rounded-lg flex items-center space-x-3"
              >
                <School className="w-5 h-5 text-gray-600" />
                <span className="text-sm">School Profile</span>
              </button>
              <button 
                onClick={() => {
                  setActiveSettingsPanel('user-management');
                  setShowSettings(false);
                }}
                className="w-full text-left px-4 py-2 hover:bg-gray-50 rounded-lg flex items-center space-x-3"
              >
                <Users className="w-5 h-5 text-gray-600" />
                <span className="text-sm">User Management</span>
              </button>
              <button 
                onClick={() => {
                  setActiveSettingsPanel('calendar');
                  setShowSettings(false);
                }}
                className="w-full text-left px-4 py-2 hover:bg-gray-50 rounded-lg flex items-center space-x-3"
              >
                <Calendar className="w-5 h-5 text-gray-600" />
                <span className="text-sm">Academic Calendar</span>
              </button>
              <button 
                onClick={() => {
                  setActiveSettingsPanel('billing');
                  setShowSettings(false);
                }}
                className="w-full text-left px-4 py-2 hover:bg-gray-50 rounded-lg flex items-center space-x-3"
              >
                <CreditCard className="w-5 h-5 text-gray-600" />
                <span className="text-sm">Billing & Subscription</span>
              </button>
              <button 
                onClick={() => {
                  setActiveSettingsPanel('security');
                  setShowSettings(false);
                }}
                className="w-full text-left px-4 py-2 hover:bg-gray-50 rounded-lg flex items-center space-x-3"
              >
                <Shield className="w-5 h-5 text-gray-600" />
                <span className="text-sm">Security Settings</span>
              </button>
              <button 
                onClick={() => {
                  setActiveSettingsPanel('notifications');
                  setShowSettings(false);
                }}
                className="w-full text-left px-4 py-2 hover:bg-gray-50 rounded-lg flex items-center space-x-3"
              >
                <Bell className="w-5 h-5 text-gray-600" />
                <span className="text-sm">Notification Preferences</span>
              </button>
              <div className="border-t mt-2 pt-2">
                <button 
                  onClick={() => {
                    alert('Signing out...');
                    // Add actual sign out logic here
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-red-50 rounded-lg flex items-center space-x-3 text-red-600"
                >
                  <Key className="w-5 h-5" />
                  <span className="text-sm">Sign Out</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="bg-white border-b">
        <div className="px-6">
          <nav className="flex space-x-8">
            {['overview', 'students', 'teachers', 'parents', 'classes', 'class-builder', 'assignments', 'reports'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-1 border-b-2 font-medium text-sm capitalize transition-colors ${
                  activeTab === tab
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>
      </div>

      <div className="p-6">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Students</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalStudents}</p>
                    <p className="text-sm text-green-600 mt-2">+12 this month</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Teachers</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalTeachers}</p>
                    <p className="text-sm text-gray-500 mt-2">All active</p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <GraduationCap className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Attendance Today</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{stats.attendanceToday}%</p>
                    <p className="text-sm text-green-600 mt-2">Above average</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Completion Rate</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{stats.completionRate}%</p>
                    <p className="text-sm text-green-600 mt-2">+5% improvement</p>
                  </div>
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Target className="w-6 h-6 text-orange-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity & Events */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Activity */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                <div className="p-6 border-b">
                  <h2 className="text-lg font-semibold">Recent Activity</h2>
                </div>
                <div className="p-6 space-y-4">
                  {recentActivities.map((activity) => (
                    <div key={activity.id} className="flex items-start space-x-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${activity.color}`}>
                        <activity.icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-900">{activity.description}</p>
                        <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Upcoming Events */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                <div className="p-6 border-b">
                  <h2 className="text-lg font-semibold">Upcoming Events</h2>
                </div>
                <div className="p-6 space-y-4">
                  {upcomingEvents.map((event) => (
                    <div key={event.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Calendar className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{event.title}</p>
                          <p className="text-xs text-gray-500">{event.date} • {event.time}</p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-sm p-6 text-white">
              <h2 className="text-xl font-semibold mb-6">Quick Actions</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <button 
                  onClick={() => { setAddModalType('student'); setShowAddModal(true); }}
                  className="bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg p-4 flex flex-col items-center space-y-2 transition-all"
                >
                  <UserPlus className="w-6 h-6" />
                  <span className="text-sm">Add Student</span>
                </button>
                <button 
                  onClick={() => { setAddModalType('teacher'); setShowAddModal(true); }}
                  className="bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg p-4 flex flex-col items-center space-y-2 transition-all"
                >
                  <GraduationCap className="w-6 h-6" />
                  <span className="text-sm">Add Teacher</span>
                </button>
                <button 
                  onClick={() => { setAddModalType('class'); setShowAddModal(true); }}
                  className="bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg p-4 flex flex-col items-center space-y-2 transition-all"
                >
                  <BookOpen className="w-6 h-6" />
                  <span className="text-sm">Create Class</span>
                </button>
                <button className="bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg p-4 flex flex-col items-center space-y-2 transition-all">
                  <Eye className="w-6 h-6" />
                  <span className="text-sm">View Reports</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Students Tab */}
        {activeTab === 'students' && (
          <div className="space-y-6">
            {/* Actions Bar */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search students..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                  <Filter className="w-5 h-5 text-gray-600" />
                </button>
                <select className="px-3 py-2 border border-gray-300 rounded-lg">
                  <option>All Classes</option>
                  {classes.map((cls: any) => (
                    <option key={cls.id}>{cls.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center space-x-3">
                {selectedUsers.length > 0 && (
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">{selectedUsers.length} selected</span>
                    <button 
                      onClick={() => handleDeleteStudents(selectedUsers)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                      title="Delete selected students"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleSendEmail(selectedUsers)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                      title="Send email to selected"
                    >
                      <Mail className="w-4 h-4" />
                    </button>
                  </div>
                )}
                <button 
                  onClick={handleExportStudents}
                  className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  title="Export all students to CSV"
                >
                  <Download className="w-5 h-5 text-gray-600" />
                </button>
                <button 
                  onClick={() => {
                    setBulkUploadType('students');
                    setShowBulkUpload(true);
                  }}
                  className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  <Upload className="w-5 h-5 text-gray-600" />
                </button>
                <div className="flex items-center border border-gray-300 rounded-lg">
                  <button 
                    onClick={() => setViewMode('list')}
                    className={`p-2 ${viewMode === 'list' ? 'bg-gray-100' : ''}`}
                  >
                    <List className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => setViewMode('grid')}
                    className={`p-2 ${viewMode === 'grid' ? 'bg-gray-100' : ''}`}
                  >
                    <Grid className="w-4 h-4" />
                  </button>
                </div>
                <button 
                  onClick={() => { setAddModalType('student'); setShowAddModal(true); }}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Student</span>
                </button>
              </div>
            </div>

            {/* Students Table/Grid */}
            {viewMode === 'list' ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-6 py-3 text-left">
                        <input 
                          type="checkbox" 
                          onChange={handleSelectAll}
                          checked={selectedUsers.length === students.length}
                        />
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Class</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Progress</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Attendance</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Parent</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {students.map((student) => (
                      <tr key={student.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <input 
                            type="checkbox"
                            checked={selectedUsers.includes(student.id)}
                            onChange={() => handleSelectUser(student.id)}
                          />
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-sm font-semibold text-blue-600">
                                {student.name.split(' ').map((n: any) => n[0]).join('')}
                              </span>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">{student.name}</p>
                              <p className="text-xs text-gray-500">{student.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-gray-900">{student.class}</p>
                          <p className="text-xs text-gray-500">{student.grade}</p>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-green-500 h-2 rounded-full" 
                                style={{ width: `${student.progress}%` }}
                              ></div>
                            </div>
                            <span className="text-xs text-gray-600">{student.progress}%</span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">{student.memorized}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm font-medium text-gray-900">{student.attendance}%</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-gray-900">{student.parent}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700">
                            Active
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <button 
                              onClick={() => setShowStudentDetails(student)}
                              className="p-1 hover:bg-gray-100 rounded"
                              title="View details"
                            >
                              <Eye className="w-4 h-4 text-gray-600" />
                            </button>
                            <button 
                              onClick={() => handleEditStudent(student)}
                              className="p-1 hover:bg-gray-100 rounded"
                              title="Edit student"
                            >
                              <Edit className="w-4 h-4 text-gray-600" />
                            </button>
                            <button 
                              onClick={() => handleDeleteStudents([student.id])}
                              className="p-1 hover:bg-gray-100 rounded"
                              title="Delete student"
                            >
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {students.map((student) => (
                  <div key={student.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-lg font-semibold text-blue-600">
                            {student.name.split(' ').map((n: any) => n[0]).join('')}
                          </span>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{student.name}</p>
                          <p className="text-sm text-gray-500">{student.id}</p>
                        </div>
                      </div>
                      <button className="p-1 hover:bg-gray-100 rounded">
                        <MoreVertical className="w-4 h-4 text-gray-600" />
                      </button>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">Class</span>
                        <span className="text-sm font-medium">{student.class}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">Progress</span>
                        <span className="text-sm font-medium">{student.progress}%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">Memorized</span>
                        <span className="text-sm font-medium">{student.memorized}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">Attendance</span>
                        <span className="text-sm font-medium">{student.attendance}%</span>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t flex items-center justify-between">
                      <button className="text-blue-600 text-sm hover:underline">View Profile</button>
                      <div className="flex items-center space-x-2">
                        <button className="p-1 hover:bg-gray-100 rounded">
                          <Mail className="w-4 h-4 text-gray-600" />
                        </button>
                        <button className="p-1 hover:bg-gray-100 rounded">
                          <Phone className="w-4 h-4 text-gray-600" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Teachers Tab */}
        {activeTab === 'teachers' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Teachers Management</h2>
              <div className="flex items-center space-x-3">
                <button 
                  onClick={() => {
                    setBulkUploadType('teachers');
                    setShowBulkUpload(true);
                  }}
                  className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  <Upload className="w-4 h-4" />
                  <span>Bulk Upload</span>
                </button>
                <button 
                  onClick={() => { setAddModalType('teacher'); setShowAddModal(true); }}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Teacher</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {teachers.map((teacher) => (
                <div key={teacher.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                        <GraduationCap className="w-6 h-6 text-green-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{teacher.name}</p>
                        <p className="text-sm text-gray-500">{teacher.subject}</p>
                      </div>
                    </div>
                    <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700">Active</span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center space-x-2 text-gray-600">
                      <Mail className="w-4 h-4" />
                      <span>{teacher.email}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-gray-600">
                      <Phone className="w-4 h-4" />
                      <span>{teacher.phone}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-gray-600">
                      <BookOpen className="w-4 h-4" />
                      <span>Classes: {teacher.classes.join(', ')}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-gray-600">
                      <Users className="w-4 h-4" />
                      <span>{teacher.students} Students</span>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-xs text-gray-500">Qualification: {teacher.qualification}</p>
                    <p className="text-xs text-gray-500">Experience: {teacher.experience}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Parents Tab */}
        {activeTab === 'parents' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Parents Management</h2>
              <div className="flex items-center space-x-3">
                <button 
                  onClick={() => {
                    setBulkUploadType('parents');
                    setShowBulkUpload(true);
                  }}
                  className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  <Upload className="w-4 h-4" />
                  <span>Bulk Upload</span>
                </button>
                <button 
                  onClick={() => { setAddModalType('parent'); setShowAddModal(true); }}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Parent</span>
                </button>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Parent</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Children</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Address</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {parents.map((parent) => (
                    <tr key={parent.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{parent.name}</p>
                          <p className="text-xs text-gray-500">{parent.occupation}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-900">{parent.children.join(', ')}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-900">{parent.email}</p>
                        <p className="text-xs text-gray-500">{parent.phone}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-900">{parent.address}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700">Active</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <button className="p-1 hover:bg-gray-100 rounded">
                            <Mail className="w-4 h-4 text-gray-600" />
                          </button>
                          <button className="p-1 hover:bg-gray-100 rounded">
                            <Edit className="w-4 h-4 text-gray-600" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Classes Tab */}
        {activeTab === 'classes' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Classes Management</h2>
              <button 
                onClick={() => { setAddModalType('class'); setShowAddModal(true); }}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus className="w-4 h-4" />
                <span>Create Class</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {classes.map((cls) => (
                <div key={cls.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-gray-900">{cls.name}</h3>
                      <p className="text-sm text-gray-500">{cls.grade}</p>
                    </div>
                    <button className="p-1 hover:bg-gray-100 rounded">
                      <MoreVertical className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <GraduationCap className="w-4 h-4" />
                      <span>{cls.teacher}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Users className="w-4 h-4" />
                      <span>{cls.students} Students</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Clock className="w-4 h-4" />
                      <span>{cls.schedule}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <MapPin className="w-4 h-4" />
                      <span>{cls.room}</span>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-xs text-gray-500 mb-2">Subjects:</p>
                    <div className="flex flex-wrap gap-1">
                      {cls.subjects.map((subject, idx) => (
                        <span key={idx} className="px-2 py-1 text-xs bg-gray-100 rounded">
                          {subject}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Class Builder Tab - Drag & Drop */}
        {activeTab === 'class-builder' && (
          <Suspense fallback={<div className="flex items-center justify-center h-96"><div className="text-lg">Loading Class Builder...</div></div>}>
            <ClassBuilder />
          </Suspense>
        )}

        {/* Assignments Tab */}
        {activeTab === 'assignments' && (() => {
          // All assignments data
          const allAssignments = [
            { id: 1, title: 'Memorize Surah Al-Mulk', class: 'Class 7A', teacher: 'Sheikh Muhammad Ali', subject: 'Quran', dueDate: '2025-01-20', status: 'in-progress', submitted: 18, total: 24, priority: 'high' },
            { id: 2, title: 'Tajweed Rules Practice', class: 'Class 6A', teacher: 'Ustadha Sarah Ahmed', subject: 'Tajweed', dueDate: '2025-01-18', status: 'in-progress', submitted: 12, total: 18, priority: 'medium' },
            { id: 3, title: 'Islamic History Essay', class: 'Class 8B', teacher: 'Imam Abdul Rahman', subject: 'Islamic Studies', dueDate: '2025-01-15', status: 'overdue', submitted: 15, total: 21, priority: 'high' },
            { id: 4, title: 'Arabic Grammar Worksheet', class: 'Class 5B', teacher: 'Sister Khadija Noor', subject: 'Arabic', dueDate: '2025-01-22', status: 'not-started', submitted: 0, total: 22, priority: 'low' },
            { id: 5, title: 'Hadith Memorization', class: 'Class 8B', teacher: 'Brother Yusuf Khan', subject: 'Hadith', dueDate: '2025-01-25', status: 'in-progress', submitted: 8, total: 21, priority: 'medium' },
            { id: 6, title: 'Surah Al-Baqarah Review', class: 'Class 7A', teacher: 'Sheikh Muhammad Ali', subject: 'Quran', dueDate: '2025-01-19', status: 'completed', submitted: 24, total: 24, priority: 'low' },
            { id: 7, title: 'Fiqh Practice Questions', class: 'Class 7A', teacher: 'Sister Khadija Noor', subject: 'Fiqh', dueDate: '2025-01-23', status: 'not-started', submitted: 0, total: 24, priority: 'medium' },
            { id: 8, title: 'Quran Recitation Test', class: 'Class 4A', teacher: 'Imam Abdul Rahman', subject: 'Quran', dueDate: '2025-01-21', status: 'in-progress', submitted: 10, total: 20, priority: 'high' },
            { id: 9, title: 'Arabic Vocabulary Quiz', class: 'Class 5B', teacher: 'Sister Khadija Noor', subject: 'Arabic', dueDate: '2025-01-17', status: 'completed', submitted: 22, total: 22, priority: 'low' },
            { id: 10, title: 'Surah Yaseen Memorization', class: 'Class 6A', teacher: 'Sheikh Muhammad Ali', subject: 'Quran', dueDate: '2025-01-24', status: 'in-progress', submitted: 5, total: 18, priority: 'high' },
            { id: 11, title: 'Tajweed Makhraj Test', class: 'Class 5B', teacher: 'Ustadha Sarah Ahmed', subject: 'Tajweed', dueDate: '2025-01-16', status: 'overdue', submitted: 18, total: 22, priority: 'high' },
            { id: 12, title: 'Prophet Stories Essay', class: 'Class 4A', teacher: 'Imam Abdul Rahman', subject: 'Islamic Studies', dueDate: '2025-01-26', status: 'not-started', submitted: 0, total: 20, priority: 'medium' },
          ];
          
          // Filter assignments based on selected filters
          const filteredAssignments = allAssignments.filter((assignment: any) => {
            if (classFilter !== 'all' && assignment.class !== classFilter) return false;
            if (teacherFilter !== 'all' && assignment.teacher !== teacherFilter) return false;
            if (subjectFilter !== 'all' && assignment.subject !== subjectFilter) return false;
            if (statusFilter !== 'all' && assignment.status !== statusFilter) return false;
            return true;
          });
          
          return (
          <div className="space-y-6">
            {/* Header with Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm">Total Assignments</p>
                    <p className="text-3xl font-bold mt-1">156</p>
                    <p className="text-blue-200 text-xs mt-2">+23 this week</p>
                  </div>
                  <FileText className="w-8 h-8 text-blue-300" />
                </div>
              </div>
              <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm">Completed</p>
                    <p className="text-3xl font-bold mt-1">89</p>
                    <p className="text-green-200 text-xs mt-2">57% completion</p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-300" />
                </div>
              </div>
              <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-100 text-sm">In Progress</p>
                    <p className="text-3xl font-bold mt-1">45</p>
                    <p className="text-orange-200 text-xs mt-2">Due this week</p>
                  </div>
                  <Clock className="w-8 h-8 text-orange-300" />
                </div>
              </div>
              <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-xl p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-red-100 text-sm">Overdue</p>
                    <p className="text-3xl font-bold mt-1">12</p>
                    <p className="text-red-200 text-xs mt-2">Needs attention</p>
                  </div>
                  <AlertCircle className="w-8 h-8 text-red-300" />
                </div>
              </div>
            </div>

            {/* Live Monitoring Banner */}
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl p-4 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                    <div className="absolute inset-0 w-3 h-3 bg-white rounded-full animate-ping"></div>
                  </div>
                  <div>
                    <p className="font-semibold">Assignment Monitoring Dashboard</p>
                    <p className="text-purple-100 text-sm">Viewing all assignments created by teachers • Real-time updates</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="px-3 py-1 bg-white bg-opacity-20 rounded-full text-xs">
                    Last updated: 2 min ago
                  </span>
                  <button className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition">
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Filter and Export Bar */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <select 
                  className="px-4 py-2 border rounded-lg"
                  value={classFilter}
                  onChange={(e) => setClassFilter(e.target.value)}
                >
                  <option value="all">All Classes</option>
                  {classes.map((cls: any) => (
                    <option key={cls.id} value={cls.name}>{cls.name}</option>
                  ))}
                </select>
                <select 
                  className="px-4 py-2 border rounded-lg"
                  value={teacherFilter}
                  onChange={(e) => setTeacherFilter(e.target.value)}
                >
                  <option value="all">All Teachers</option>
                  {Array.from(new Set(allAssignments.map((a: any) => a.teacher))).map((teacher: any) => (
                    <option key={teacher} value={teacher}>{teacher}</option>
                  ))}
                </select>
                <select 
                  className="px-4 py-2 border rounded-lg"
                  value={subjectFilter}
                  onChange={(e) => setSubjectFilter(e.target.value)}
                >
                  <option value="all">All Subjects</option>
                  {Array.from(new Set(allAssignments.map((a: any) => a.subject))).sort().map((subject: any) => (
                    <option key={subject} value={subject}>{subject}</option>
                  ))}
                </select>
                <select 
                  className="px-4 py-2 border rounded-lg"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">All Status</option>
                  <option value="not-started">Not Started</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="overdue">Overdue</option>
                </select>
              </div>
              <div className="flex items-center space-x-3">
                <button className="flex items-center space-x-2 px-4 py-2 border rounded-lg hover:bg-gray-50">
                  <Download className="w-4 h-4" />
                  <span>Export Report</span>
                </button>
                <button className="flex items-center space-x-2 px-4 py-2 border rounded-lg hover:bg-gray-50">
                  <BarChart3 className="w-4 h-4" />
                  <span>Analytics</span>
                </button>
                <div className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg flex items-center space-x-2">
                  <Eye className="w-4 h-4" />
                  <span className="text-sm font-medium">View Only</span>
                </div>
              </div>
            </div>

            {/* Assignments Grid */}
            {filteredAssignments.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAssignments.map((assignment) => (
                <div key={assignment.id} className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-2xl transition-all transform hover:-translate-y-1">
                  <div className={`h-2 ${
                    assignment.status === 'completed' ? 'bg-green-500' :
                    assignment.status === 'overdue' ? 'bg-red-500' :
                    assignment.status === 'in-progress' ? 'bg-blue-500' :
                    'bg-gray-300'
                  }`}></div>
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 text-lg">{assignment.title}</h3>
                        <p className="text-sm text-gray-500 mt-1">{assignment.class} • {assignment.subject}</p>
                        <div className="flex items-center mt-2 space-x-2">
                          <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                            <GraduationCap className="w-3 h-3 text-white" />
                          </div>
                          <span className="text-sm font-medium text-gray-700">{assignment.teacher}</span>
                        </div>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        assignment.priority === 'high' ? 'bg-red-100 text-red-700' :
                        assignment.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {assignment.priority} priority
                      </span>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">Due Date</span>
                        <span className="text-sm font-medium">{assignment.dueDate}</span>
                      </div>
                      
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-gray-500">Submissions</span>
                          <span className="text-sm font-medium">{assignment.submitted}/{assignment.total}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              assignment.status === 'completed' ? 'bg-green-500' :
                              assignment.status === 'overdue' ? 'bg-red-500' :
                              'bg-blue-500'
                            }`}
                            style={{ width: `${(assignment.submitted / assignment.total) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className={`text-xs font-medium ${
                          assignment.status === 'completed' ? 'text-green-600' :
                          assignment.status === 'overdue' ? 'text-red-600' :
                          assignment.status === 'in-progress' ? 'text-blue-600' :
                          'text-gray-600'
                        }`}>
                          {assignment.status.replace('-', ' ').toUpperCase()}
                        </span>
                        <span className="text-xs text-gray-400">•</span>
                        <span className="text-xs text-gray-500">
                          Created {Math.floor(Math.random() * 7) + 1} days ago
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button className="flex items-center space-x-1 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition">
                          <Eye className="w-4 h-4" />
                          <span className="text-sm font-medium">View Details</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            ) : (
              <div className="bg-gray-50 rounded-xl p-12 text-center">
                <div className="max-w-md mx-auto">
                  <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Assignments Found</h3>
                  <p className="text-gray-600">No assignments match your current filters. Try adjusting the filters to see more results.</p>
                  <button 
                    onClick={() => {
                      setClassFilter('all');
                      setTeacherFilter('all');
                      setSubjectFilter('all');
                      setStatusFilter('all');
                    }}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Clear All Filters
                  </button>
                </div>
              </div>
            )}
          </div>
          );
        })()}

        {/* Reports Tab */}
        {activeTab === 'reports' && (
          <div className="space-y-6">
            {/* Report Type Selector */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">Analytics & Reports</h2>
                <div className="flex items-center space-x-3">
                  <select 
                    className="px-4 py-2 border rounded-lg"
                    value={reportDateRange}
                    onChange={(e) => {
                      setReportDateRange(e.target.value);
                      // Update stats based on date range
                      console.log(`Updating reports for: ${e.target.value}`);
                    }}
                  >
                    <option value="30days">Last 30 Days</option>
                    <option value="3months">Last 3 Months</option>
                    <option value="6months">Last 6 Months</option>
                    <option value="year">This Year</option>
                    <option value="custom">Custom Range</option>
                  </select>
                  <button 
                    onClick={() => {
                      // Generate PDF report
                      const reportData = {
                        school: schoolInfo.name,
                        dateRange: reportDateRange,
                        stats: {
                          attendance: '94.2%',
                          completion: '82.5%',
                          performance: '3.8',
                          totalHours: 156,
                          achievements: 28
                        },
                        generatedAt: new Date().toISOString()
                      };
                      
                      // Create downloadable content
                      const content = `
=================================
SCHOOL PERFORMANCE REPORT
=================================
School: ${reportData.school}
Date Range: ${reportDateRange === '30days' ? 'Last 30 Days' : 
                reportDateRange === '3months' ? 'Last 3 Months' : 
                reportDateRange === '6months' ? 'Last 6 Months' : 
                reportDateRange === 'year' ? 'This Year' : 'Custom'}
Generated: ${new Date().toLocaleDateString()}

---------------------------------
KEY METRICS
---------------------------------
Average Attendance: ${reportData.stats.attendance}
Completion Rate: ${reportData.stats.completion}
Average Performance: ${reportData.stats.performance}/5.0
Total Hours: ${reportData.stats.totalHours}
Achievements: ${reportData.stats.achievements}

---------------------------------
CLASS PERFORMANCE
---------------------------------
Class 4A: 92% attendance, 3.7 avg
Class 5B: 94% attendance, 3.8 avg
Class 6A: 96% attendance, 4.1 avg
Class 7A: 93% attendance, 3.9 avg
Class 8B: 95% attendance, 4.0 avg

---------------------------------
TOP PERFORMERS
---------------------------------
1. Fatima Al-Zahra - 96% avg
2. Aisha Ibrahim - 94% avg
3. Maryam Ahmed - 92% avg
4. Abdullah Khan - 90% avg
5. Omar Hassan - 88% avg
=================================
                      `;
                      
                      // Create blob and download
                      const blob = new Blob([content], { type: 'text/plain' });
                      const url = window.URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `School_Report_${reportData.school.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.txt`;
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      window.URL.revokeObjectURL(url);
                      
                      alert('Report exported successfully! Note: Full PDF export requires a PDF library integration.');
                    }}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    <Download className="w-4 h-4" />
                    <span>Export Report</span>
                  </button>
                </div>
              </div>

              {/* Quick Stats - Dynamic based on date range */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl">
                  <p className="text-3xl font-bold text-blue-600">
                    {reportDateRange === '30days' ? '94.2%' : 
                     reportDateRange === '3months' ? '92.8%' : 
                     reportDateRange === '6months' ? '91.5%' : 
                     reportDateRange === 'year' ? '90.3%' : '94.2%'}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">Avg Attendance</p>
                  <p className="text-xs text-green-600 mt-2">
                    ↑ {reportDateRange === '30days' ? '2.3%' : 
                       reportDateRange === '3months' ? '3.1%' : 
                       reportDateRange === '6months' ? '4.2%' : 
                       reportDateRange === 'year' ? '5.8%' : '2.3%'}
                  </p>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl">
                  <p className="text-3xl font-bold text-green-600">
                    {reportDateRange === '30days' ? '82.5%' : 
                     reportDateRange === '3months' ? '80.2%' : 
                     reportDateRange === '6months' ? '78.9%' : 
                     reportDateRange === 'year' ? '77.4%' : '82.5%'}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">Completion Rate</p>
                  <p className="text-xs text-green-600 mt-2">
                    ↑ {reportDateRange === '30days' ? '5.1%' : 
                       reportDateRange === '3months' ? '6.3%' : 
                       reportDateRange === '6months' ? '7.8%' : 
                       reportDateRange === 'year' ? '9.2%' : '5.1%'}
                  </p>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl">
                  <p className="text-3xl font-bold text-purple-600">
                    {reportDateRange === '30days' ? '3.8' : 
                     reportDateRange === '3months' ? '3.7' : 
                     reportDateRange === '6months' ? '3.6' : 
                     reportDateRange === 'year' ? '3.5' : '3.8'}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">Avg Performance</p>
                  <p className="text-xs text-green-600 mt-2">
                    ↑ {reportDateRange === '30days' ? '0.3' : 
                       reportDateRange === '3months' ? '0.4' : 
                       reportDateRange === '6months' ? '0.5' : 
                       reportDateRange === 'year' ? '0.6' : '0.3'}
                  </p>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl">
                  <p className="text-3xl font-bold text-orange-600">
                    {reportDateRange === '30days' ? '156' : 
                     reportDateRange === '3months' ? '468' : 
                     reportDateRange === '6months' ? '936' : 
                     reportDateRange === 'year' ? '1872' : '156'}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">Total Hours</p>
                  <p className="text-xs text-green-600 mt-2">
                    ↑ {reportDateRange === '30days' ? '12h' : 
                       reportDateRange === '3months' ? '36h' : 
                       reportDateRange === '6months' ? '72h' : 
                       reportDateRange === 'year' ? '144h' : '12h'}
                  </p>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-pink-50 to-pink-100 rounded-xl">
                  <p className="text-3xl font-bold text-pink-600">
                    {reportDateRange === '30days' ? '28' : 
                     reportDateRange === '3months' ? '84' : 
                     reportDateRange === '6months' ? '168' : 
                     reportDateRange === 'year' ? '336' : '28'}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">Achievements</p>
                  <p className="text-xs text-green-600 mt-2">
                    ↑ {reportDateRange === '30days' ? '8' : 
                       reportDateRange === '3months' ? '24' : 
                       reportDateRange === '6months' ? '48' : 
                       reportDateRange === 'year' ? '96' : '8'}
                  </p>
                </div>
              </div>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Performance Chart - Enhanced */}
              <div className="bg-gradient-to-br from-white via-blue-50/30 to-purple-50/30 rounded-xl shadow-xl border border-gray-100 overflow-hidden">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Student Performance Trends</h3>
                      <p className="text-sm text-gray-500 mt-1">Academic progress over time</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <select 
                        className="text-xs px-3 py-1.5 bg-white border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
                        value={performanceFilter}
                        onChange={(e) => setPerformanceFilter(e.target.value)}
                      >
                        <option value="average">Class Average</option>
                        <option value="top10">Top 10% Students</option>
                        <option value="all">All Students</option>
                        <option value="bottom10">Bottom 10% (Need Help)</option>
                      </select>
                      <div className="p-2 bg-white rounded-lg shadow-sm">
                        <BarChart3 className="w-4 h-4 text-purple-500" />
                      </div>
                    </div>
                  </div>
                  
                  {/* Chart with enhanced visuals */}
                  <div className="relative bg-white rounded-xl p-4 shadow-inner">
                    {/* Background pattern */}
                    <div className="absolute inset-0 opacity-5">
                      <div className="absolute inset-0" style={{
                        backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(59, 130, 246, 0.1) 35px, rgba(59, 130, 246, 0.1) 70px)`
                      }}></div>
                    </div>
                    
                    {/* Y-axis labels with lines */}
                    <div className="absolute left-0 top-0 h-72 flex flex-col justify-between text-xs font-medium text-gray-600 -ml-10 pt-4 pb-4">
                      <span className="flex items-center">100%</span>
                      <span className="flex items-center">80%</span>
                      <span className="flex items-center">60%</span>
                      <span className="flex items-center">40%</span>
                      <span className="flex items-center">20%</span>
                      <span className="flex items-center">0%</span>
                    </div>
                    
                    {/* Horizontal grid lines */}
                    <div className="absolute inset-0 h-72 flex flex-col justify-between pointer-events-none pt-4 pb-4">
                      {[100, 80, 60, 40, 20, 0].map((line) => (
                        <div key={line} className="w-full border-b border-gray-100 border-dashed"></div>
                      ))}
                    </div>
                    
                    {/* Chart bars container */}
                    <div className="h-72 flex items-end justify-between gap-2 relative z-10 pt-4 pb-4">
                      {(() => {
                        // Different data based on filter selection
                        let monthlyData;
                        if (performanceFilter === 'top10') {
                          monthlyData = reportDateRange === '30days' 
                            ? [92, 94, 96, 98] // Top performers
                            : reportDateRange === '3months'
                            ? [88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99]
                            : reportDateRange === '6months'
                            ? [85, 87, 89, 91, 93, 95]
                            : [85, 86, 88, 90, 91, 92, 93, 94, 95, 96, 97, 98];
                        } else if (performanceFilter === 'bottom10') {
                          monthlyData = reportDateRange === '30days' 
                            ? [45, 48, 52, 55] // Struggling students
                            : reportDateRange === '3months'
                            ? [40, 42, 44, 46, 48, 50, 52, 54, 56, 58, 60, 62]
                            : reportDateRange === '6months'
                            ? [35, 40, 45, 50, 55, 60]
                            : [35, 38, 42, 45, 48, 52, 55, 58, 62, 65, 68, 70];
                        } else if (performanceFilter === 'all') {
                          monthlyData = reportDateRange === '30days' 
                            ? [75, 78, 82, 85] // All students
                            : reportDateRange === '3months'
                            ? [65, 68, 70, 72, 74, 76, 78, 80, 82, 84, 86, 88]
                            : reportDateRange === '6months'
                            ? [60, 65, 70, 75, 80, 85]
                            : [60, 62, 65, 68, 70, 73, 75, 78, 80, 83, 85, 88];
                        } else { // average (default)
                          monthlyData = reportDateRange === '30days' 
                            ? [85, 88, 92, 94]
                            : reportDateRange === '3months'
                            ? [72, 75, 78, 82, 85, 88, 90, 92, 94, 89, 91, 95]
                            : reportDateRange === '6months'
                            ? [65, 68, 72, 75, 78, 82]
                            : [65, 72, 78, 82, 75, 88, 92, 85, 90, 94, 89, 95];
                        }
                        
                        const labels = reportDateRange === '30days'
                          ? ['Week 1', 'Week 2', 'Week 3', 'Week 4']
                          : reportDateRange === '3months'
                          ? ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7', 'W8', 'W9', 'W10', 'W11', 'W12']
                          : reportDateRange === '6months'
                          ? ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
                          : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                        
                        // Color schemes based on performance level
                        const getBarColor = (value, index) => {
                          if (performanceFilter === 'top10') {
                            return 'from-emerald-500 via-green-500 to-teal-500';
                          } else if (performanceFilter === 'bottom10') {
                            return 'from-orange-500 via-red-500 to-pink-500';
                          } else if (value >= 90) {
                            return 'from-green-500 via-emerald-500 to-teal-500';
                          } else if (value >= 75) {
                            return 'from-blue-500 via-indigo-500 to-purple-500';
                          } else if (value >= 60) {
                            return 'from-yellow-500 via-orange-500 to-amber-500';
                          } else {
                            return 'from-red-500 via-pink-500 to-rose-500';
                          }
                        };
                        
                        return monthlyData.map((value, index) => {
                          const isHighest = value === Math.max(...monthlyData);
                          const isLowest = value === Math.min(...monthlyData);
                          
                          return (
                            <div key={index} className="flex-1 flex flex-col items-center group relative">
                              {/* Enhanced Tooltip */}
                              <div className="absolute -top-16 bg-gradient-to-r from-gray-800 to-gray-900 text-white text-xs px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none whitespace-nowrap z-20 shadow-xl">
                                <div className="font-bold">{value}%</div>
                                <div className="text-gray-300">{labels[index]}</div>
                                {isHighest && <div className="text-yellow-400 text-xs mt-1">⭐ Peak</div>}
                                {isLowest && <div className="text-red-400 text-xs mt-1">⚠️ Low</div>}
                              </div>
                              
                              {/* Bar with animations */}
                              <div className="w-full flex flex-col items-center">
                                {/* Value label with badge style */}
                                <div className={`mb-2 transition-all duration-300 group-hover:scale-110 ${
                                  isHighest ? 'animate-pulse' : ''
                                }`}>
                                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                                    value >= 90 ? 'bg-green-100 text-green-700' :
                                    value >= 75 ? 'bg-blue-100 text-blue-700' :
                                    value >= 60 ? 'bg-yellow-100 text-yellow-700' :
                                    'bg-red-100 text-red-700'
                                  }`}>
                                    {value}%
                                  </span>
                                </div>
                                
                                {/* Animated bar */}
                                <div className="relative w-full">
                                  <div 
                                    className={`w-full bg-gradient-to-t ${getBarColor(value, index)} rounded-t-xl transition-all duration-500 ease-out cursor-pointer relative overflow-hidden shadow-lg hover:shadow-2xl transform hover:scale-105`}
                                    style={{ 
                                      height: `${(value / 100) * 256}px`,
                                      minHeight: '8px',
                                      transform: 'translateY(0)',
                                      opacity: 1
                                    }}
                                  >
                                    {/* Shimmer effect */}
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-30 transition-opacity duration-300"
                                      style={{
                                        backgroundSize: '200% 100%'
                                      }}
                                    ></div>
                                    
                                    {/* Top highlight */}
                                    <div className="absolute top-0 left-0 right-0 h-2 bg-white opacity-50 rounded-t-xl"></div>
                                  </div>
                                  
                                  {/* Special indicators */}
                                  {isHighest && (
                                    <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
                                      <span className="text-2xl animate-bounce">👑</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                              
                              {/* X-axis label with better styling */}
                              <span className="text-xs font-medium text-gray-600 mt-3 group-hover:text-gray-900 transition-colors">
                                {labels[index]}
                              </span>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </div>
                  
                  {/* Enhanced Legend and Stats */}
                  <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-6">
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 bg-gradient-to-t from-green-500 to-emerald-500 rounded"></div>
                          <span className="text-sm font-medium text-gray-700">Excellent (90%+)</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 bg-gradient-to-t from-blue-500 to-purple-500 rounded"></div>
                          <span className="text-sm font-medium text-gray-700">Good (75-89%)</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 bg-gradient-to-t from-yellow-500 to-orange-500 rounded"></div>
                          <span className="text-sm font-medium text-gray-700">Average (60-74%)</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 bg-gradient-to-t from-red-500 to-pink-500 rounded"></div>
                          <span className="text-sm font-medium text-gray-700">Needs Help (<60%)</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-3 flex items-center justify-between text-xs">
                      <span className="text-gray-600">
                        Showing: <span className="font-semibold text-gray-900">
                          {performanceFilter === 'average' ? 'Class Average' :
                           performanceFilter === 'top10' ? 'Top 10% Students' :
                           performanceFilter === 'bottom10' ? 'Bottom 10% (Need Support)' :
                           'All Students'}
                        </span>
                      </span>
                      <span className="text-gray-600">
                        Period: <span className="font-semibold text-gray-900">
                          {reportDateRange === '30days' ? 'Last 30 Days' : 
                           reportDateRange === '3months' ? 'Last 3 Months' : 
                           reportDateRange === '6months' ? 'Last 6 Months' : 
                           reportDateRange === 'year' ? 'This Year' : 'Custom'}
                        </span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Subject Distribution */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold">Subject Performance</h3>
                  <PieChart className="w-5 h-5 text-gray-400" />
                </div>
                <div className="space-y-4">
                  {[
                    { subject: 'Quran Memorization', percentage: 92, color: 'bg-green-500' },
                    { subject: 'Tajweed', percentage: 88, color: 'bg-blue-500' },
                    { subject: 'Islamic Studies', percentage: 85, color: 'bg-purple-500' },
                    { subject: 'Arabic Language', percentage: 78, color: 'bg-orange-500' },
                    { subject: 'Hadith Studies', percentage: 82, color: 'bg-pink-500' },
                  ].map((item, index) => (
                    <div key={index}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-gray-700">{item.subject}</span>
                        <span className="text-sm font-semibold">{item.percentage}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div 
                          className={`${item.color} h-3 rounded-full transition-all duration-500`}
                          style={{ width: `${item.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Top Students Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="p-6 border-b">
                <h3 className="text-lg font-semibold">Top Performing Students</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rank</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Class</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quran Progress</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg Score</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Attendance</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trend</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {[
                      { rank: 1, name: 'Fatima Al-Zahra', class: 'Class 7A', progress: 95, score: 98, attendance: 100 },
                      { rank: 2, name: 'Abdullah Khan', class: 'Class 8B', progress: 92, score: 96, attendance: 98 },
                      { rank: 3, name: 'Aisha Ibrahim', class: 'Class 7A', progress: 89, score: 94, attendance: 99 },
                      { rank: 4, name: 'Omar Hassan', class: 'Class 6A', progress: 87, score: 92, attendance: 97 },
                      { rank: 5, name: 'Maryam Ahmed', class: 'Class 8B', progress: 85, score: 90, attendance: 96 },
                    ].map((student) => (
                      <tr key={student.rank} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                            student.rank === 1 ? 'bg-yellow-500' :
                            student.rank === 2 ? 'bg-gray-400' :
                            student.rank === 3 ? 'bg-orange-600' :
                            'bg-gray-300'
                          }`}>
                            {student.rank}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm font-medium text-gray-900">{student.name}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-gray-900">{student.class}</p>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                              <div className="bg-green-500 h-2 rounded-full" style={{ width: `${student.progress}%` }}></div>
                            </div>
                            <span className="text-xs text-gray-600">{student.progress}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm font-semibold text-gray-900">{student.score}%</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-gray-900">{student.attendance}%</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-green-600 text-sm flex items-center">
                            <TrendingUp className="w-4 h-4 mr-1" />
                            Improving
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add Modal */}
      {renderAddModal()}
      
      {/* Bulk Upload Modal */}
      {renderBulkUploadModal()}
      
      {/* Duplicate Review Modal */}
      {renderDuplicateReviewModal()}
      
      {/* Student Details Modal */}
      {renderStudentDetailsModal()}
      
      {/* Edit Student Modal */}
      {renderEditStudentModal()}
      
      {/* Settings Panel */}
      {renderSettingsPanel()}
    </div>
  );
}