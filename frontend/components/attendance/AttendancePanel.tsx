/**
 * AttendancePanel Component - Complete Attendance Management System
 * Created: 2025-10-22
 * Purpose: Attendance tracking, reporting, and management interface
 */

'use client';

import { useState, useEffect } from 'react';
import {
  Calendar, Check, X, Clock, FileText, Download, Filter,
  ChevronLeft, ChevronRight, Search, BarChart3, Users,
  AlertTriangle, TrendingUp, TrendingDown, Minus, Edit2,
  Save, RefreshCw, CheckCircle2, XCircle, AlertCircle as Alert
} from 'lucide-react';
import { useAttendance, MarkAttendanceData, AttendanceWithDetails, StudentAttendanceSummary } from '@/hooks/useAttendance';
import { useSchoolStore } from '@/store/schoolStore';

interface AttendancePanelProps {
  userRole?: 'owner' | 'admin' | 'teacher' | 'student' | 'parent';
  studentId?: string; // For student/parent views
  teacherClasses?: any[]; // Classes from teacher dashboard
  teacherStudents?: any[]; // Students from teacher dashboard
}

export default function AttendancePanel({
  userRole = 'teacher',
  studentId,
  teacherClasses,
  teacherStudents
}: AttendancePanelProps) {
  const {
    isLoading,
    error,
    records,
    stats,
    summary,
    isLoadingSummary,
    currentPage,
    totalPages,
    filters,
    fetchAttendance,
    markAttendance,
    updateAttendance,
    fetchSummary,
    exportToCSV,
    updateFilters,
    clearFilters,
    changePage,
    refreshData,
  } = useAttendance();

  const schoolStore = useSchoolStore();
  // Use teacher-provided classes/students if available, otherwise use store (for admin/owner)
  const classes = teacherClasses || schoolStore.classes || [];
  const students = teacherStudents || schoolStore.students || [];

  // View state
  const [activeView, setActiveView] = useState<'take' | 'history' | 'summary'>('take');

  // Take attendance state
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceMap, setAttendanceMap] = useState<Map<string, { status: 'present' | 'absent' | 'late' | 'excused'; notes: string }>>(new Map());
  const [isMarkingAttendance, setIsMarkingAttendance] = useState(false);

  // History view state
  const [historyClassFilter, setHistoryClassFilter] = useState('');
  const [historyStartDate, setHistoryStartDate] = useState('');
  const [historyEndDate, setHistoryEndDate] = useState('');
  const [historyStatusFilter, setHistoryStatusFilter] = useState<'' | 'present' | 'absent' | 'late' | 'excused'>('');
  const [searchQuery, setSearchQuery] = useState('');

  // Summary view state
  const [summaryClass, setSummaryClass] = useState('');
  const [summaryMonth, setSummaryMonth] = useState('');
  const [summaryStudent, setSummaryStudent] = useState('');

  // Edit modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState<AttendanceWithDetails | null>(null);
  const [editStatus, setEditStatus] = useState<'present' | 'absent' | 'late' | 'excused'>('present');
  const [editNotes, setEditNotes] = useState('');

  // Get enrolled students for selected class
  const getEnrolledStudents = () => {
    if (!selectedClass) return [];
    const classData = classes.find((c) => c.id === selectedClass);
    if (!classData) return [];
    
    // Get enrolled students for this class
    return students.filter((s) => {
      // In real implementation, check class_enrollments
      // For now, return all students (mock behavior)
      return s.active;
    });
  };

  // Auto-select first class on mount if available
  useEffect(() => {
    if (classes.length > 0 && !selectedClass && !historyClassFilter && !summaryClass) {
      const firstClass = classes[0].id;
      setSelectedClass(firstClass);
      setHistoryClassFilter(firstClass);
      setSummaryClass(firstClass);
    }
  }, [classes]);

  // Initialize attendance map when class changes
  useEffect(() => {
    const enrolledStudents = getEnrolledStudents();
    const newMap = new Map();
    enrolledStudents.forEach((student) => {
      newMap.set(student.id, { status: 'present', notes: '' });
    });
    setAttendanceMap(newMap);
  }, [selectedClass]);

  // Quick mark all
  const markAll = (status: 'present' | 'absent') => {
    const enrolledStudents = getEnrolledStudents();
    const newMap = new Map();
    enrolledStudents.forEach((student) => {
      newMap.set(student.id, { status, notes: '' });
    });
    setAttendanceMap(newMap);
  };

  // Toggle individual student status
  const toggleStudentStatus = (studentId: string, status: 'present' | 'absent' | 'late' | 'excused') => {
    const newMap = new Map(attendanceMap);
    const current = newMap.get(studentId) || { status: 'present', notes: '' };
    newMap.set(studentId, { ...current, status });
    setAttendanceMap(newMap);
  };

  // Update student notes
  const updateStudentNotes = (studentId: string, notes: string) => {
    const newMap = new Map(attendanceMap);
    const current = newMap.get(studentId) || { status: 'present', notes: '' };
    newMap.set(studentId, { ...current, notes });
    setAttendanceMap(newMap);
  };

  // Submit attendance
  const handleMarkAttendance = async () => {
    if (!selectedClass || !selectedDate) {
      alert('Please select a class and date');
      return;
    }

    const enrolledStudents = getEnrolledStudents();
    if (enrolledStudents.length === 0) {
      alert('No students enrolled in this class');
      return;
    }

    setIsMarkingAttendance(true);

    const attendanceData: MarkAttendanceData = {
      class_id: selectedClass,
      session_date: selectedDate,
      records: enrolledStudents.map((student) => {
        const record = attendanceMap.get(student.id) || { status: 'present', notes: '' };
        return {
          student_id: student.id,
          status: record.status,
          notes: record.notes || undefined,
        };
      }),
    };

    const success = await markAttendance(attendanceData);
    setIsMarkingAttendance(false);

    if (success) {
      alert(`Attendance marked successfully for ${enrolledStudents.length} students`);
      // Reset form
      setAttendanceMap(new Map());
      const newMap = new Map();
      enrolledStudents.forEach((student) => {
        newMap.set(student.id, { status: 'present', notes: '' });
      });
      setAttendanceMap(newMap);
    }
  };

  // Apply history filters
  const applyHistoryFilters = () => {
    const newFilters: any = {};
    if (historyClassFilter) newFilters.class_id = historyClassFilter;
    if (studentId) newFilters.student_id = studentId; // For student/parent views
    if (historyStartDate) newFilters.start_date = historyStartDate;
    if (historyEndDate) newFilters.end_date = historyEndDate;
    if (historyStatusFilter) newFilters.status = historyStatusFilter;

    updateFilters(newFilters);
  };

  // Auto-apply filters when historyClassFilter changes for history view
  useEffect(() => {
    if (historyClassFilter && activeView === 'history') {
      applyHistoryFilters();
    }
  }, [historyClassFilter, activeView]);

  // Load summary
  const loadSummary = () => {
    if (!summaryClass) {
      alert('Please select a class');
      return;
    }

    const options: any = {};
    if (summaryMonth) options.month = summaryMonth;
    if (summaryStudent) options.student_id = summaryStudent;

    fetchSummary(summaryClass, options);
  };

  // Auto-load summary when summaryClass changes for summary view
  useEffect(() => {
    if (summaryClass && activeView === 'summary') {
      loadSummary();
    }
  }, [summaryClass, summaryMonth, summaryStudent, activeView]);

  // Export attendance
  const handleExport = async () => {
    if (!historyClassFilter) {
      alert('Please select a class to export');
      return;
    }

    const options: any = {};
    if (historyStartDate) options.start_date = historyStartDate;
    if (historyEndDate) options.end_date = historyEndDate;
    if (studentId) options.student_id = studentId;

    await exportToCSV(historyClassFilter, options);
  };

  // Open edit modal
  const openEditModal = (record: AttendanceWithDetails) => {
    setEditingRecord(record);
    setEditStatus(record.status);
    setEditNotes(record.notes || '');
    setShowEditModal(true);
  };

  // Submit edit
  const handleEditSubmit = async () => {
    if (!editingRecord) return;

    const success = await updateAttendance(editingRecord.id, {
      status: editStatus,
      notes: editNotes,
    });

    if (success) {
      setShowEditModal(false);
      setEditingRecord(null);
    }
  };

  // Format date
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  // Get status color
  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'present': return 'bg-green-100 text-green-800 border-green-300';
      case 'absent': return 'bg-red-100 text-red-800 border-red-300';
      case 'late': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'excused': return 'bg-blue-100 text-blue-800 border-blue-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present': return <CheckCircle2 className="w-4 h-4" />;
      case 'absent': return <XCircle className="w-4 h-4" />;
      case 'late': return <Clock className="w-4 h-4" />;
      case 'excused': return <Alert className="w-4 h-4" />;
      default: return null;
    }
  };

  // Get trend icon
  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'declining': return <TrendingDown className="w-4 h-4 text-red-600" />;
      case 'stable': return <Minus className="w-4 h-4 text-gray-600" />;
      default: return null;
    }
  };

  // Render based on user role
  const canMarkAttendance = userRole === 'teacher' || userRole === 'owner' || userRole === 'admin';
  const isReadOnly = userRole === 'student' || userRole === 'parent';

  // Auto-load for student/parent views
  useEffect(() => {
    if (isReadOnly && studentId) {
      updateFilters({ student_id: studentId });
      setActiveView('history');
    }
  }, [isReadOnly, studentId]);

  return (
    <div className="bg-white rounded-lg shadow-sm">
      {/* Header */}
      <div className="border-b border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Attendance Management</h2>
            <p className="mt-1 text-sm text-gray-500">
              {canMarkAttendance ? 'Track and manage student attendance' : 'View attendance records'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={refreshData}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100"
              title="Refresh"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* View Tabs */}
        <div className="mt-6 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {canMarkAttendance && (
              <button
                onClick={() => setActiveView('take')}
                className={`${
                  activeView === 'take'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
              >
                <Check className="w-4 h-4" />
                Take Attendance
              </button>
            )}
            <button
              onClick={() => setActiveView('history')}
              className={`${
                activeView === 'history'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
            >
              <Calendar className="w-4 h-4" />
              History
            </button>
            {!isReadOnly && (
              <button
                onClick={() => setActiveView('summary')}
                className={`${
                  activeView === 'summary'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
              >
                <BarChart3 className="w-4 h-4" />
                Reports
              </button>
            )}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Error Display */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-800">Error</p>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* Take Attendance View */}
        {activeView === 'take' && canMarkAttendance && (
          <div>
            <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Class Selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Class
                </label>
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Choose a class...</option>
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date Selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Session Date
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {selectedClass && (
              <div>
                {/* Quick Actions */}
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex gap-2">
                    <button
                      onClick={() => markAll('present')}
                      className="px-3 py-1.5 text-sm bg-green-100 text-green-700 rounded-md hover:bg-green-200 flex items-center gap-1"
                    >
                      <Check className="w-4 h-4" />
                      Mark All Present
                    </button>
                    <button
                      onClick={() => markAll('absent')}
                      className="px-3 py-1.5 text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200 flex items-center gap-1"
                    >
                      <X className="w-4 h-4" />
                      Mark All Absent
                    </button>
                  </div>
                  <div className="text-sm text-gray-600">
                    {getEnrolledStudents().length} students enrolled
                  </div>
                </div>

                {/* Student List */}
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                    <div className="grid grid-cols-12 gap-4 text-sm font-medium text-gray-700">
                      <div className="col-span-4">Student</div>
                      <div className="col-span-5">Status</div>
                      <div className="col-span-3">Notes</div>
                    </div>
                  </div>
                  <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
                    {getEnrolledStudents().map((student) => {
                      const record = attendanceMap.get(student.id) || { status: 'present', notes: '' };
                      return (
                        <div key={student.id} className="px-4 py-3 hover:bg-gray-50">
                          <div className="grid grid-cols-12 gap-4 items-center">
                            <div className="col-span-4">
                              <p className="text-sm font-medium text-gray-900">{student.display_name || 'Unknown'}</p>
                              <p className="text-xs text-gray-500">{student.email}</p>
                            </div>
                            <div className="col-span-5 flex gap-2">
                              {(['present', 'absent', 'late', 'excused'] as const).map((status) => (
                                <button
                                  key={status}
                                  onClick={() => toggleStudentStatus(student.id, status)}
                                  className={`px-3 py-1.5 text-xs font-medium rounded-md border ${
                                    record.status === status
                                      ? getStatusColor(status)
                                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                  }`}
                                >
                                  {status.charAt(0).toUpperCase() + status.slice(1)}
                                </button>
                              ))}
                            </div>
                            <div className="col-span-3">
                              <input
                                type="text"
                                value={record.notes}
                                onChange={(e) => updateStudentNotes(student.id, e.target.value)}
                                placeholder="Notes..."
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Submit Button */}
                <div className="mt-6 flex justify-end">
                  <button
                    onClick={handleMarkAttendance}
                    disabled={isMarkingAttendance || getEnrolledStudents().length === 0}
                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isMarkingAttendance ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Save Attendance
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* History View */}
        {activeView === 'history' && (
          <div>
            {/* Filters */}
            <div className="mb-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Class
                  </label>
                  <select
                    value={historyClassFilter}
                    onChange={(e) => setHistoryClassFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Classes</option>
                    {classes.map((cls) => (
                      <option key={cls.id} value={cls.id}>
                        {cls.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={historyStartDate}
                    onChange={(e) => setHistoryStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={historyEndDate}
                    onChange={(e) => setHistoryEndDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={historyStatusFilter}
                    onChange={(e) => setHistoryStatusFilter(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Statuses</option>
                    <option value="present">Present</option>
                    <option value="absent">Absent</option>
                    <option value="late">Late</option>
                    <option value="excused">Excused</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={applyHistoryFilters}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
                >
                  <Filter className="w-4 h-4" />
                  Apply Filters
                </button>
                <button
                  onClick={() => {
                    setHistoryClassFilter('');
                    setHistoryStartDate('');
                    setHistoryEndDate('');
                    setHistoryStatusFilter('');
                    clearFilters();
                  }}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                >
                  Clear
                </button>
                <button
                  onClick={handleExport}
                  className="ml-auto px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Export CSV
                </button>
              </div>
            </div>

            {/* Statistics */}
            {stats && (
              <div className="mb-6 grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <p className="text-sm text-gray-600">Total Records</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total_records}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <p className="text-sm text-green-600">Present</p>
                  <p className="text-2xl font-bold text-green-900">{stats.present_count}</p>
                </div>
                <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                  <p className="text-sm text-red-600">Absent</p>
                  <p className="text-2xl font-bold text-red-900">{stats.absent_count}</p>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                  <p className="text-sm text-yellow-600">Late</p>
                  <p className="text-2xl font-bold text-yellow-900">{stats.late_count}</p>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-600">Excused</p>
                  <p className="text-2xl font-bold text-blue-900">{stats.excused_count}</p>
                </div>
              </div>
            )}

            {/* Records Table */}
            {isLoading ? (
              <div className="text-center py-12">
                <RefreshCw className="w-8 h-8 animate-spin text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Loading attendance records...</p>
              </div>
            ) : records.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No attendance records found</p>
                <p className="text-sm text-gray-400 mt-2">Try adjusting your filters</p>
              </div>
            ) : (
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Student
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Class
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Notes
                        </th>
                        {canMarkAttendance && (
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {records.map((record) => (
                        <tr key={record.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatDate(record.session_date)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{record.student_name}</div>
                            <div className="text-sm text-gray-500">{record.student_email}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {record.class_name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(record.status)}`}>
                              {getStatusIcon(record.status)}
                              {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {record.notes || '-'}
                          </td>
                          {canMarkAttendance && (
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <button
                                onClick={() => openEditModal(record)}
                                className="text-blue-600 hover:text-blue-900 flex items-center gap-1"
                              >
                                <Edit2 className="w-4 h-4" />
                                Edit
                              </button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 flex items-center justify-between">
                    <div className="text-sm text-gray-700">
                      Page {currentPage} of {totalPages}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => changePage(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="px-3 py-1 bg-white border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => changePage(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1 bg-white border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Summary View */}
        {activeView === 'summary' && !isReadOnly && (
          <div>
            {/* Summary Filters */}
            <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Class *
                </label>
                <select
                  value={summaryClass}
                  onChange={(e) => setSummaryClass(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a class...</option>
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Month (Optional)
                </label>
                <input
                  type="month"
                  value={summaryMonth}
                  onChange={(e) => setSummaryMonth(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Student (Optional)
                </label>
                <select
                  value={summaryStudent}
                  onChange={(e) => setSummaryStudent(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Students</option>
                  {students.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.display_name || student.email}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mb-6">
              <button
                onClick={loadSummary}
                disabled={!summaryClass}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <BarChart3 className="w-4 h-4" />
                Generate Report
              </button>
            </div>

            {/* Summary Display */}
            {isLoadingSummary ? (
              <div className="text-center py-12">
                <RefreshCw className="w-8 h-8 animate-spin text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Loading summary...</p>
              </div>
            ) : summary ? (
              <div>
                {/* Summary Header */}
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h3 className="text-lg font-semibold text-blue-900 mb-2">{summary.class_name}</h3>
                  <p className="text-sm text-blue-700">
                    Period: {summary.period} • {summary.total_sessions} sessions • {summary.total_students} students
                  </p>
                </div>

                {/* Overall Stats */}
                <div className="mb-6 grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <p className="text-sm text-gray-600">Avg. Attendance</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {summary.overall_stats.average_attendance_rate.toFixed(1)}%
                    </p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <p className="text-sm text-green-600">Present</p>
                    <p className="text-2xl font-bold text-green-900">{summary.overall_stats.present_count}</p>
                  </div>
                  <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                    <p className="text-sm text-red-600">Absent</p>
                    <p className="text-2xl font-bold text-red-900">{summary.overall_stats.absent_count}</p>
                  </div>
                  <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                    <p className="text-sm text-yellow-600">Late</p>
                    <p className="text-2xl font-bold text-yellow-900">{summary.overall_stats.late_count}</p>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <p className="text-sm text-blue-600">Excused</p>
                    <p className="text-2xl font-bold text-blue-900">{summary.overall_stats.excused_count}</p>
                  </div>
                </div>

                {/* Student Details */}
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                    <h4 className="text-sm font-medium text-gray-700">Student Attendance Details</h4>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Student
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Present
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Absent
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Late
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Excused
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Rate
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Trend
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {summary.students.map((student) => (
                          <tr key={student.student_id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{student.student_name}</div>
                              <div className="text-sm text-gray-500">{student.student_email}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                              {student.present}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-medium">
                              {student.absent}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-yellow-600 font-medium">
                              {student.late}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-medium">
                              {student.excused}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <div className="flex-1 bg-gray-200 rounded-full h-2 w-24">
                                  <div
                                    className={`h-2 rounded-full ${
                                      student.attendance_rate >= 90 ? 'bg-green-500' :
                                      student.attendance_rate >= 75 ? 'bg-yellow-500' :
                                      'bg-red-500'
                                    }`}
                                    style={{ width: `${student.attendance_rate}%` }}
                                  />
                                </div>
                                <span className="text-sm font-medium text-gray-900">
                                  {student.attendance_rate.toFixed(1)}%
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-1">
                                {getTrendIcon(student.trend)}
                                <span className="text-sm text-gray-600 capitalize">{student.trend}</span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Select a class and click "Generate Report" to view summary</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {showEditModal && editingRecord && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Edit Attendance Record</h3>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">Student: <span className="font-medium text-gray-900">{editingRecord.student_name}</span></p>
                  <p className="text-sm text-gray-600">Date: <span className="font-medium text-gray-900">{formatDate(editingRecord.session_date)}</span></p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="present">Present</option>
                    <option value="absent">Absent</option>
                    <option value="late">Late</option>
                    <option value="excused">Excused</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                  <textarea
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Optional notes..."
                  />
                </div>
              </div>

              <div className="mt-6 flex items-center justify-end gap-3">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEditSubmit}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
