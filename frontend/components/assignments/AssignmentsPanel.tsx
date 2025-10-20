'use client';

import { useState, useEffect } from 'react';
import { useAssignments, CreateAssignmentData, SubmitAssignmentData, TransitionAssignmentData, ReopenAssignmentData } from '@/hooks/useAssignments';
import {
  FileText, Calendar, Clock, CheckCircle, AlertCircle, XCircle, RotateCcw,
  Plus, Eye, Send, CheckSquare, Loader, RefreshCw, X, Filter, ChevronLeft, ChevronRight,
  User, BookOpen, MessageSquare, Paperclip, Flag, Award
} from 'lucide-react';
import {
  AssignmentStatus,
  AssignmentWithDetails,
  STATUS_CONFIG,
  isAssignmentLate,
  getTimeRemaining,
  ASSIGNMENT_CONSTANTS
} from '@/lib/types/assignments';

interface AssignmentsPanelProps {
  userRole?: 'owner' | 'admin' | 'teacher' | 'student' | 'parent';
  studentId?: string; // Required for student/parent dashboards, optional for teachers
}

export default function AssignmentsPanel({ userRole = 'teacher', studentId }: AssignmentsPanelProps) {
  // Hook integration
  const {
    isLoading,
    error,
    assignments,
    currentAssignment,
    filters,
    summary,
    isSubmitting,
    currentPage,
    totalPages,
    totalItems,
    fetchAssignments,
    fetchAssignment,
    createAssignment,
    updateAssignment,
    deleteAssignment,
    submitAssignment,
    transitionStatus,
    reopenAssignment,
    updateFilters,
    clearFilters,
    changePage,
    navigateNext,
    navigatePrevious,
    clearCurrentAssignment,
    refreshData,
  } = useAssignments(studentId);

  // UI State - Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showReopenModal, setShowReopenModal] = useState(false);
  const [showFiltersModal, setShowFiltersModal] = useState(false);

  // UI State - Filters
  const [filterStatus, setFilterStatus] = useState<AssignmentStatus | ''>('');
  const [filterLateOnly, setFilterLateOnly] = useState(false);
  const [filterDueBefore, setFilterDueBefore] = useState('');
  const [filterDueAfter, setFilterDueAfter] = useState('');

  // UI State - Forms
  const [createFormData, setCreateFormData] = useState<Partial<CreateAssignmentData>>({
    student_id: studentId || '',
    title: '',
    description: '',
    due_at: '',
  });
  const [submitFormData, setSubmitFormData] = useState<Partial<SubmitAssignmentData>>({
    text: '',
  });
  const [reopenReason, setReopenReason] = useState('');

  // Initialize student if provided
  useEffect(() => {
    if (studentId && studentId !== filters.student_id) {
      updateFilters({ ...filters, student_id: studentId });
    }
  }, [studentId, filters, updateFilters]);

  // Get status badge style
  const getStatusBadgeStyle = (status: AssignmentStatus) => {
    const config = STATUS_CONFIG[status];
    const colorMap: Record<string, string> = {
      blue: 'bg-blue-100 text-blue-800 border-blue-300',
      purple: 'bg-purple-100 text-purple-800 border-purple-300',
      yellow: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      orange: 'bg-orange-100 text-orange-800 border-orange-300',
      green: 'bg-green-100 text-green-800 border-green-300',
      red: 'bg-red-100 text-red-800 border-red-300',
    };
    return `px-3 py-1 rounded-full text-xs font-medium border ${colorMap[config.color] || 'bg-gray-100 text-gray-800 border-gray-300'}`;
  };

  // Get status icon
  const getStatusIcon = (status: AssignmentStatus) => {
    const iconMap: Record<AssignmentStatus, React.ReactNode> = {
      assigned: <FileText className="w-4 h-4" />,
      viewed: <Eye className="w-4 h-4" />,
      submitted: <Send className="w-4 h-4" />,
      reviewed: <CheckSquare className="w-4 h-4" />,
      completed: <CheckCircle className="w-4 h-4" />,
      reopened: <RotateCcw className="w-4 h-4" />,
    };
    return iconMap[status];
  };

  // Handle view assignment
  const handleViewAssignment = async (assignmentId: string) => {
    await fetchAssignment(assignmentId);
    setShowViewModal(true);

    // If student viewing for first time, transition to 'viewed'
    if (userRole === 'student' && currentAssignment?.status === 'assigned') {
      await transitionStatus(assignmentId, { to_status: 'viewed' });
    }
  };

  // Handle create assignment
  const handleCreateAssignment = async () => {
    if (!createFormData.student_id || !createFormData.title || !createFormData.due_at) {
      return;
    }

    const success = await createAssignment(createFormData as CreateAssignmentData);
    if (success) {
      setShowCreateModal(false);
      setCreateFormData({
        student_id: studentId || '',
        title: '',
        description: '',
        due_at: '',
      });
    }
  };

  // Handle submit assignment
  const handleSubmitAssignment = async () => {
    if (!currentAssignment) return;

    if (!submitFormData.text && !submitFormData.attachments?.length) {
      return;
    }

    const success = await submitAssignment(currentAssignment.id, submitFormData as SubmitAssignmentData);
    if (success) {
      setShowSubmitModal(false);
      setSubmitFormData({ text: '' });
      setShowViewModal(false);
    }
  };

  // Handle transition status
  const handleTransitionStatus = async (assignmentId: string, toStatus: AssignmentStatus) => {
    const success = await transitionStatus(assignmentId, { to_status: toStatus });
    if (success && showViewModal) {
      await fetchAssignment(assignmentId);
    }
  };

  // Handle reopen assignment
  const handleReopenAssignment = async () => {
    if (!currentAssignment) return;

    const success = await reopenAssignment(currentAssignment.id, { reason: reopenReason });
    if (success) {
      setShowReopenModal(false);
      setReopenReason('');
      await fetchAssignment(currentAssignment.id);
    }
  };

  // Handle delete assignment
  const handleDeleteAssignment = async (assignmentId: string) => {
    if (!confirm('Are you sure you want to delete this assignment? This action cannot be undone.')) {
      return;
    }

    const success = await deleteAssignment(assignmentId);
    if (success && showViewModal) {
      setShowViewModal(false);
      clearCurrentAssignment();
    }
  };

  // Apply filters
  const handleApplyFilters = () => {
    const newFilters: any = {};
    if (filterStatus) newFilters.status = filterStatus;
    if (filterLateOnly) newFilters.late_only = true;
    if (filterDueBefore) newFilters.due_before = new Date(filterDueBefore).toISOString();
    if (filterDueAfter) newFilters.due_after = new Date(filterDueAfter).toISOString();
    if (studentId) newFilters.student_id = studentId;

    updateFilters(newFilters);
    setShowFiltersModal(false);
  };

  // Clear all filters
  const handleClearFilters = () => {
    setFilterStatus('');
    setFilterLateOnly(false);
    setFilterDueBefore('');
    setFilterDueAfter('');
    clearFilters();
    setShowFiltersModal(false);
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Loading state
  if (isLoading && assignments.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-3" />
          <p className="text-gray-600">Loading assignments...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && assignments.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <p className="text-red-600 font-medium mb-2">Error loading assignments</p>
          <p className="text-gray-600 text-sm mb-4">{error}</p>
          <button
            onClick={refreshData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm">
      {/* HEADER */}
      <div className="border-b border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Assignments</h2>
              <p className="text-sm text-gray-500">
                {userRole === 'student' && 'View and submit your assignments'}
                {userRole === 'teacher' && 'Create and review assignments'}
                {userRole === 'parent' && "View your child's assignments"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFiltersModal(true)}
              className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Filter assignments"
            >
              <Filter className="w-5 h-5" />
            </button>

            <button
              onClick={refreshData}
              disabled={isLoading}
              className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>

            {(userRole === 'teacher' || userRole === 'admin' || userRole === 'owner') && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                New Assignment
              </button>
            )}
          </div>
        </div>

        {/* SUMMARY STATS */}
        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {/* Total */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-5 h-5 text-gray-600" />
                <span className="text-sm font-medium text-gray-900">Total</span>
              </div>
              <div className="text-2xl font-bold text-gray-700">{summary.total_assignments}</div>
            </div>

            {/* Assigned */}
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                {STATUS_CONFIG.assigned.icon}
                <span className="text-sm font-medium text-blue-900">Assigned</span>
              </div>
              <div className="text-2xl font-bold text-blue-700">{summary.by_status.assigned || 0}</div>
            </div>

            {/* Submitted */}
            <div className="bg-yellow-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                {STATUS_CONFIG.submitted.icon}
                <span className="text-sm font-medium text-yellow-900">Submitted</span>
              </div>
              <div className="text-2xl font-bold text-yellow-700">{summary.by_status.submitted || 0}</div>
            </div>

            {/* Reviewed */}
            <div className="bg-orange-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                {STATUS_CONFIG.reviewed.icon}
                <span className="text-sm font-medium text-orange-900">Reviewed</span>
              </div>
              <div className="text-2xl font-bold text-orange-700">{summary.by_status.reviewed || 0}</div>
            </div>

            {/* Completed */}
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                {STATUS_CONFIG.completed.icon}
                <span className="text-sm font-medium text-green-900">Completed</span>
              </div>
              <div className="text-2xl font-bold text-green-700">{summary.by_status.completed || 0}</div>
            </div>

            {/* Late */}
            <div className="bg-red-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <span className="text-sm font-medium text-red-900">Late</span>
              </div>
              <div className="text-2xl font-bold text-red-700">{summary.late_count}</div>
            </div>
          </div>
        )}
      </div>

      {/* ASSIGNMENTS LIST */}
      <div className="p-6">
        {assignments.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No assignments found</p>
            {(userRole === 'teacher' || userRole === 'admin' || userRole === 'owner') && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Create First Assignment
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {assignments.map((assignment) => {
              const timeRemaining = getTimeRemaining(assignment.due_at);
              const isLate = isAssignmentLate(assignment.due_at, assignment.status);

              return (
                <div
                  key={assignment.id}
                  onClick={() => handleViewAssignment(assignment.id)}
                  className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{assignment.title}</h3>
                        <span className={getStatusBadgeStyle(assignment.status)}>
                          {getStatusIcon(assignment.status)}
                          <span className="ml-1">{STATUS_CONFIG[assignment.status].label}</span>
                        </span>
                        {isLate && (
                          <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full border border-red-300">
                            <Flag className="w-3 h-3 inline mr-1" />
                            Late
                          </span>
                        )}
                      </div>

                      {assignment.description && (
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{assignment.description}</p>
                      )}

                      <div className="flex items-center gap-6 text-sm text-gray-500">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          <span>
                            {userRole === 'student'
                              ? `Teacher: ${assignment.teacher.display_name}`
                              : `Student: ${assignment.student.display_name}`}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>Due: {formatDate(assignment.due_at)}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          <span className={isLate ? 'text-red-600 font-medium' : ''}>
                            {timeRemaining.formatted}
                          </span>
                        </div>

                        {assignment.submission && (
                          <div className="flex items-center gap-2 text-green-600">
                            <CheckCircle className="w-4 h-4" />
                            <span>Submitted</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* PAGINATION */}
      {totalPages > 1 && (
        <div className="border-t border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Showing {(currentPage - 1) * 20 + 1}-{Math.min(currentPage * 20, totalItems)} of {totalItems} assignments
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={navigatePrevious}
                disabled={currentPage === 1}
                className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => changePage(pageNum)}
                      className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                        currentPage === pageNum
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-600 hover:bg-blue-50 hover:text-blue-600'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={navigateNext}
                disabled={currentPage === totalPages}
                className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE ASSIGNMENT MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
              <h3 className="text-xl font-semibold text-gray-900">Create New Assignment</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Student <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={createFormData.student_id}
                  onChange={(e) => setCreateFormData({ ...createFormData, student_id: e.target.value })}
                  placeholder="Student ID"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={createFormData.title}
                  onChange={(e) => setCreateFormData({ ...createFormData, title: e.target.value })}
                  placeholder="Assignment title"
                  maxLength={ASSIGNMENT_CONSTANTS.MAX_TITLE_LENGTH}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {createFormData.title?.length || 0} / {ASSIGNMENT_CONSTANTS.MAX_TITLE_LENGTH} characters
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={createFormData.description}
                  onChange={(e) => setCreateFormData({ ...createFormData, description: e.target.value })}
                  placeholder="Assignment description and instructions"
                  rows={4}
                  maxLength={ASSIGNMENT_CONSTANTS.MAX_DESCRIPTION_LENGTH}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Due Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  value={createFormData.due_at}
                  onChange={(e) => setCreateFormData({ ...createFormData, due_at: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 sticky bottom-0 bg-white">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateAssignment}
                disabled={isSubmitting || !createFormData.student_id || !createFormData.title || !createFormData.due_at}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Create Assignment
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW ASSIGNMENT MODAL */}
      {showViewModal && currentAssignment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
              <div className="flex items-center gap-3">
                <h3 className="text-xl font-semibold text-gray-900">{currentAssignment.title}</h3>
                <span className={getStatusBadgeStyle(currentAssignment.status)}>
                  {getStatusIcon(currentAssignment.status)}
                  <span className="ml-1">{STATUS_CONFIG[currentAssignment.status].label}</span>
                </span>
                {isAssignmentLate(currentAssignment.due_at, currentAssignment.status) && (
                  <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full border border-red-300">
                    <Flag className="w-3 h-3 inline mr-1" />
                    Late
                  </span>
                )}
              </div>
              <button
                onClick={() => {
                  setShowViewModal(false);
                  clearCurrentAssignment();
                }}
                className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Assignment Details */}
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Assignment Details</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Student:</span>
                    <span className="ml-2 text-gray-900 font-medium">{currentAssignment.student.display_name}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Teacher:</span>
                    <span className="ml-2 text-gray-900 font-medium">{currentAssignment.teacher.display_name}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Due Date:</span>
                    <span className="ml-2 text-gray-900 font-medium">{formatDate(currentAssignment.due_at)}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Time Remaining:</span>
                    <span className={`ml-2 font-medium ${
                      getTimeRemaining(currentAssignment.due_at).isPast ? 'text-red-600' : 'text-gray-900'
                    }`}>
                      {getTimeRemaining(currentAssignment.due_at).formatted}
                    </span>
                  </div>
                </div>
              </div>

              {/* Description */}
              {currentAssignment.description && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">Description</h4>
                  <p className="text-gray-700 whitespace-pre-wrap">{currentAssignment.description}</p>
                </div>
              )}

              {/* Submission */}
              {currentAssignment.submission && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-green-900 mb-2">Submission</h4>
                  <div className="text-sm text-green-800 mb-2">
                    Submitted on: {formatDate(currentAssignment.submission.created_at)}
                  </div>
                  {currentAssignment.submission.text && (
                    <p className="text-gray-700 whitespace-pre-wrap mb-3">{currentAssignment.submission.text}</p>
                  )}
                  {currentAssignment.submission.attachments && currentAssignment.submission.attachments.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-green-900 mb-2">Attachments:</p>
                      <div className="space-y-2">
                        {currentAssignment.submission.attachments.map((attachment) => (
                          <div key={attachment.id} className="flex items-center gap-2">
                            <Paperclip className="w-4 h-4 text-green-600" />
                            <a
                              href={attachment.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline text-sm"
                            >
                              {attachment.url.split('/').pop()}
                            </a>
                            <span className="text-xs text-gray-500">({attachment.mime_type})</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-3">
                {/* Student Actions */}
                {userRole === 'student' && (
                  <>
                    {(currentAssignment.status === 'viewed' || currentAssignment.status === 'reopened') && (
                      <button
                        onClick={() => setShowSubmitModal(true)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
                      >
                        <Send className="w-4 h-4" />
                        Submit Assignment
                      </button>
                    )}
                  </>
                )}

                {/* Teacher Actions */}
                {(userRole === 'teacher' || userRole === 'admin' || userRole === 'owner') && (
                  <>
                    {currentAssignment.status === 'submitted' && (
                      <button
                        onClick={() => handleTransitionStatus(currentAssignment.id, 'reviewed')}
                        disabled={isSubmitting}
                        className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors inline-flex items-center gap-2 disabled:opacity-50"
                      >
                        {isSubmitting ? <Loader className="w-4 h-4 animate-spin" /> : <CheckSquare className="w-4 h-4" />}
                        Mark as Reviewed
                      </button>
                    )}

                    {currentAssignment.status === 'reviewed' && (
                      <button
                        onClick={() => handleTransitionStatus(currentAssignment.id, 'completed')}
                        disabled={isSubmitting}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors inline-flex items-center gap-2 disabled:opacity-50"
                      >
                        {isSubmitting ? <Loader className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                        Mark as Completed
                      </button>
                    )}

                    {currentAssignment.status === 'completed' && (
                      <button
                        onClick={() => setShowReopenModal(true)}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors inline-flex items-center gap-2"
                      >
                        <RotateCcw className="w-4 h-4" />
                        Reopen Assignment
                      </button>
                    )}

                    {(currentAssignment.status === 'assigned' || currentAssignment.status === 'viewed') && (
                      <button
                        onClick={() => handleDeleteAssignment(currentAssignment.id)}
                        disabled={isSubmitting}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors inline-flex items-center gap-2 disabled:opacity-50"
                      >
                        {isSubmitting ? <Loader className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                        Delete Assignment
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUBMIT ASSIGNMENT MODAL */}
      {showSubmitModal && currentAssignment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">Submit Assignment</h3>
              <button
                onClick={() => setShowSubmitModal(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Response
                </label>
                <textarea
                  value={submitFormData.text}
                  onChange={(e) => setSubmitFormData({ ...submitFormData, text: e.target.value })}
                  placeholder="Enter your assignment response here..."
                  rows={8}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
              <button
                onClick={() => setShowSubmitModal(false)}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitAssignment}
                disabled={isSubmitting || (!submitFormData.text && !submitFormData.attachments?.length)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Submit Assignment
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REOPEN ASSIGNMENT MODAL */}
      {showReopenModal && currentAssignment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">Reopen Assignment</h3>
              <button
                onClick={() => setShowReopenModal(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-600">
                This will allow the student to resubmit their work. You can reopen assignments up to {ASSIGNMENT_CONSTANTS.MAX_REOPEN_COUNT} times.
              </p>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Reason for Reopening</label>
                <textarea
                  value={reopenReason}
                  onChange={(e) => setReopenReason(e.target.value)}
                  placeholder="Optional: Explain why this assignment is being reopened"
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
              <button
                onClick={() => setShowReopenModal(false)}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                onClick={handleReopenAssignment}
                disabled={isSubmitting}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Reopening...
                  </>
                ) : (
                  <>
                    <RotateCcw className="w-4 h-4" />
                    Reopen Assignment
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FILTERS MODAL */}
      {showFiltersModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">Filter Assignments</h3>
              <button
                onClick={() => setShowFiltersModal(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as AssignmentStatus | '')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Statuses</option>
                  <option value="assigned">Assigned</option>
                  <option value="viewed">Viewed</option>
                  <option value="submitted">Submitted</option>
                  <option value="reviewed">Reviewed</option>
                  <option value="completed">Completed</option>
                  <option value="reopened">Reopened</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="late-only"
                  checked={filterLateOnly}
                  onChange={(e) => setFilterLateOnly(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <label htmlFor="late-only" className="text-sm font-medium text-gray-700">
                  Show only late assignments
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Due After</label>
                <input
                  type="date"
                  value={filterDueAfter}
                  onChange={(e) => setFilterDueAfter(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Due Before</label>
                <input
                  type="date"
                  value={filterDueBefore}
                  onChange={(e) => setFilterDueBefore(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
              <button
                onClick={handleClearFilters}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Clear All
              </button>
              <button
                onClick={handleApplyFilters}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
              >
                <Filter className="w-4 h-4" />
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
