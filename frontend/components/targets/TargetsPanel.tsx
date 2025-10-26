/**
 * TargetsPanel Component
 * Complete UI for managing student targets (goals) system
 *
 * Created: 2025-10-22
 * Purpose: Frontend component for WORKFLOW #5 Targets
 * Pattern: Follows AttendancePanel.tsx pattern with 3 views
 *
 * Views:
 * 1. List View - Browse all targets with filters
 * 2. Detail View - View single target with milestones
 * 3. Create/Edit Form - Create or edit targets
 *
 * Features:
 * - Role-based access control
 * - Target type support (individual, class, school)
 * - Milestone management
 * - Progress tracking
 * - Filtering and pagination
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useTargets } from '@/hooks/useTargets';
import { supabase } from '@/lib/supabase';
import {
  TargetWithDetails,
  CreateTargetRequest,
  TargetType,
  TargetStatus,
  Milestone,
  CreateMilestoneRequest,
  TARGET_TYPE_CONFIG,
  TARGET_STATUS_CONFIG,
  CATEGORY_CONFIG,
  TARGET_CONSTANTS,
  calculateTargetProgress,
  isTargetOverdue,
  getDaysRemaining,
} from '@/lib/types/targets';

// ============================================================================
// TYPES
// ============================================================================

type ViewMode = 'list' | 'detail' | 'create' | 'edit';

interface TargetsPanelProps {
  studentId?: string; // For student/parent view (filter by student)
  classId?: string; // For class view
  showCreateButton?: boolean; // Default true for teachers
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function TargetsPanel({
  studentId,
  classId,
  showCreateButton = true,
}: TargetsPanelProps) {
  const { user } = useAuthStore();
  const {
    targets,
    selectedTarget,
    isLoading,
    isLoadingTarget,
    error,
    pagination,
    filters,
    fetchTargets,
    fetchTargetById,
    createTarget,
    updateTargetProgress,
    deleteTarget,
    updateFilters,
    clearFilters,
    changePage,
    setSelectedTarget,
    clearError,
  } = useTargets();

  // View management
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [formData, setFormData] = useState<Partial<CreateTargetRequest>>({});
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Teacher's classes and students for dynamic dropdowns
  const [teacherClasses, setTeacherClasses] = useState<any[]>([]);
  const [teacherStudents, setTeacherStudents] = useState<any[]>([]);
  const [isLoadingClasses, setIsLoadingClasses] = useState(false);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  const [studentSearchFilter, setStudentSearchFilter] = useState('');
  const [schoolInfo, setSchoolInfo] = useState<{ id: string; name: string } | null>(null);

  // Check user role
  const userRole = user?.role || 'student';
  const canCreate = ['teacher', 'admin', 'owner'].includes(userRole);
  const canEdit = ['teacher', 'admin', 'owner'].includes(userRole);
  const canDelete = ['admin', 'owner'].includes(userRole);

  // ============================================================================
  // EFFECTS
  // ============================================================================

  // Apply initial filters based on props
  useEffect(() => {
    if (studentId) {
      updateFilters({ student_id: studentId });
    }
    if (classId) {
      updateFilters({ class_id: classId });
    }
  }, [studentId, classId, updateFilters]);

  // Fetch teacher's classes and students for dynamic dropdowns
  useEffect(() => {
    const fetchTeacherData = async () => {
      if (!canCreate) return; // Only fetch for teachers/admins

      try {
        // Get auth session
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        // Fetch teacher's classes
        setIsLoadingClasses(true);
        const classesResponse = await fetch('/api/classes/my-classes', {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        });

        if (classesResponse.ok) {
          const classesData = await classesResponse.json();
          setTeacherClasses(classesData.data || []);

          // Extract all students from all classes
          const allStudents: any[] = [];
          (classesData.data || []).forEach((cls: any) => {
            if (cls.students) {
              cls.students.forEach((student: any) => {
                // Avoid duplicates
                if (!allStudents.find(s => s.id === student.id)) {
                  allStudents.push(student);
                }
              });
            }
          });
          setTeacherStudents(allStudents);
        }
        setIsLoadingClasses(false);

        // Fetch school info for school targets
        const { data: profile } = await supabase
          .from('profiles')
          .select('school_id, schools!profiles_school_id_fkey(id, name)')
          .eq('user_id', user?.id)
          .single();

        if (profile && profile.schools) {
          setSchoolInfo({
            id: profile.schools.id,
            name: profile.schools.name
          });
        }

      } catch (error) {
        console.error('Error fetching teacher data:', error);
        setIsLoadingClasses(false);
      }
    };

    fetchTeacherData();
  }, [canCreate, user?.id]);

  // ============================================================================
  // HANDLERS - NAVIGATION
  // ============================================================================

  const handleViewTarget = async (target: TargetWithDetails) => {
    const result = await fetchTargetById(target.id);
    if (result.success) {
      setViewMode('detail');
    }
  };

  const handleCreateNew = () => {
    setFormData({
      type: 'individual',
      category: 'memorization',
      milestones: [],
    });
    setFormErrors({});
    setViewMode('create');
  };

  const handleEdit = (target: TargetWithDetails) => {
    setFormData({
      title: target.title,
      description: target.description || '',
      type: target.type,
      category: target.category || undefined,
      student_id: studentId,
      class_id: classId,
      start_date: target.start_date || undefined,
      due_date: target.due_date || undefined,
      milestones: target.milestones || [],
    });
    setSelectedTarget(target);
    setViewMode('edit');
  };

  const handleBackToList = () => {
    setViewMode('list');
    setSelectedTarget(null);
    setFormData({});
    setFormErrors({});
  };

  // ============================================================================
  // HANDLERS - TARGET ACTIONS
  // ============================================================================

  const handleCreateTarget = async () => {
    try {
      // Validation
      const errors: Record<string, string> = {};

      if (!formData.title || formData.title.trim().length === 0) {
        errors.title = 'Title is required';
      }
      if (formData.title && formData.title.length > TARGET_CONSTANTS.MAX_TITLE_LENGTH) {
        errors.title = `Title must be ${TARGET_CONSTANTS.MAX_TITLE_LENGTH} characters or less`;
      }
      if (!formData.type) {
        errors.type = 'Target type is required';
      }
      if (formData.type === 'individual' && !formData.student_id) {
        errors.student_id = 'Student is required for individual targets';
      }
      if (formData.type === 'class' && !formData.class_id) {
        errors.class_id = 'Class is required for class targets';
      }

      if (Object.keys(errors).length > 0) {
        setFormErrors(errors);
        return;
      }

      const result = await createTarget(formData as CreateTargetRequest);

      if (result.success) {
        handleBackToList();
      } else {
        setFormErrors({ general: result.error || 'Failed to create target' });
      }
    } catch (err: any) {
      setFormErrors({ general: err.message || 'An error occurred' });
    }
  };

  const handleDeleteTarget = async (targetId: string) => {
    if (!confirm('Are you sure you want to delete this target? This action cannot be undone.')) {
      return;
    }

    const result = await deleteTarget(targetId);
    if (result.success) {
      handleBackToList();
    }
  };

  const handleMarkComplete = async (targetId: string) => {
    const result = await updateTargetProgress(targetId, {
      status: 'completed',
      progress_percentage: 100,
      completed_by: user?.id,
    });

    if (result.success) {
      // Refresh target details
      await fetchTargetById(targetId);
    }
  };

  const handleMarkCancelled = async (targetId: string) => {
    if (!confirm('Are you sure you want to cancel this target?')) {
      return;
    }

    const result = await updateTargetProgress(targetId, {
      status: 'cancelled',
    });

    if (result.success) {
      // Refresh target details
      await fetchTargetById(targetId);
    }
  };

  // ============================================================================
  // HANDLERS - FORM
  // ============================================================================

  const handleFormChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (formErrors[field]) {
      setFormErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleAddMilestone = () => {
    const newMilestone: CreateMilestoneRequest = {
      title: '',
      description: '',
      order: (formData.milestones?.length || 0) + 1,
    };
    setFormData((prev) => ({
      ...prev,
      milestones: [...(prev.milestones || []), newMilestone],
    }));
  };

  const handleRemoveMilestone = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      milestones: prev.milestones?.filter((_, i) => i !== index) || [],
    }));
  };

  const handleMilestoneChange = (index: number, field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      milestones: prev.milestones?.map((m, i) =>
        i === index ? { ...m, [field]: value } : m
      ) || [],
    }));
  };

  // ============================================================================
  // RENDER HELPERS
  // ============================================================================

  const getStatusColor = (status: TargetStatus) => {
    const config = TARGET_STATUS_CONFIG[status];
    const colorMap: Record<string, string> = {
      blue: 'bg-blue-100 text-blue-800',
      green: 'bg-green-100 text-green-800',
      gray: 'bg-gray-100 text-gray-800',
    };
    return colorMap[config.color] || 'bg-gray-100 text-gray-800';
  };

  const getTypeColor = (type: TargetType) => {
    const colorMap: Record<TargetType, string> = {
      individual: 'bg-purple-100 text-purple-800',
      class: 'bg-indigo-100 text-indigo-800',
      school: 'bg-pink-100 text-pink-800',
    };
    return colorMap[type];
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // ============================================================================
  // RENDER - LIST VIEW
  // ============================================================================

  const renderListView = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Targets & Goals</h2>
          <p className="text-sm text-gray-600 mt-1">
            Track student progress towards Quran memorization and learning goals
          </p>
        </div>
        {canCreate && showCreateButton && (
          <button
            onClick={handleCreateNew}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            + Create Target
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type
            </label>
            <select
              value={filters.type || ''}
              onChange={(e) => updateFilters({ type: e.target.value as TargetType || undefined })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Types</option>
              <option value="individual">Individual</option>
              <option value="class">Class</option>
              <option value="school">School</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={filters.status || ''}
              onChange={(e) => updateFilters({ status: e.target.value as TargetStatus || undefined })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              value={filters.category || ''}
              onChange={(e) => updateFilters({ category: e.target.value || undefined })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Categories</option>
              {TARGET_CONSTANTS.CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {CATEGORY_CONFIG[cat]?.label || cat}
                </option>
              ))}
            </select>
          </div>

          {/* Include Completed */}
          <div className="flex items-end">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={filters.include_completed || false}
                onChange={(e) => updateFilters({ include_completed: e.target.checked })}
                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-sm text-gray-700">Include Completed</span>
            </label>
          </div>
        </div>

        {/* Clear Filters */}
        {(filters.type || filters.status || filters.category) && (
          <button
            onClick={clearFilters}
            className="mt-3 text-sm text-indigo-600 hover:text-indigo-700"
          >
            Clear all filters
          </button>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <div className="flex justify-between items-center">
            <span>{error}</span>
            <button onClick={clearError} className="text-red-900 hover:text-red-700">
              ×
            </button>
          </div>
        </div>
      )}

      {/* Targets List */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <p className="mt-2 text-gray-600">Loading targets...</p>
        </div>
      ) : targets.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <div className="text-6xl mb-4">🎯</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Targets Found</h3>
          <p className="text-gray-600 mb-4">
            {canCreate
              ? 'Create your first target to start tracking student goals'
              : 'No targets have been assigned yet'}
          </p>
          {canCreate && showCreateButton && (
            <button
              onClick={handleCreateNew}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Create First Target
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {targets.map((target) => (
            <div
              key={target.id}
              className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => handleViewTarget(target)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {/* Title and Type */}
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {target.title}
                    </h3>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(target.type)}`}>
                      {TARGET_TYPE_CONFIG[target.type]?.icon} {TARGET_TYPE_CONFIG[target.type]?.label}
                    </span>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(target.status)}`}>
                      {TARGET_STATUS_CONFIG[target.status]?.icon} {TARGET_STATUS_CONFIG[target.status]?.label}
                    </span>
                  </div>

                  {/* Description */}
                  {target.description && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {target.description}
                    </p>
                  )}

                  {/* Metadata */}
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                    {target.category && (
                      <div className="flex items-center gap-1">
                        <span>{CATEGORY_CONFIG[target.category]?.icon}</span>
                        <span>{CATEGORY_CONFIG[target.category]?.label}</span>
                      </div>
                    )}
                    {target.due_date && (
                      <div className="flex items-center gap-1">
                        <span>📅</span>
                        <span>
                          Due: {formatDate(target.due_date)}
                          {isTargetOverdue(target) && (
                            <span className="ml-1 text-red-600 font-medium">(Overdue)</span>
                          )}
                        </span>
                      </div>
                    )}
                    {target.milestones && target.milestones.length > 0 && (
                      <div className="flex items-center gap-1">
                        <span>✓</span>
                        <span>
                          {target.milestones.filter(m => m.completed).length} / {target.milestones.length} milestones
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Progress Circle */}
                {target.stats && (
                  <div className="ml-4 flex flex-col items-center">
                    <div className="relative w-20 h-20">
                      <svg className="transform -rotate-90 w-20 h-20">
                        <circle
                          cx="40"
                          cy="40"
                          r="36"
                          stroke="currentColor"
                          strokeWidth="8"
                          fill="none"
                          className="text-gray-200"
                        />
                        <circle
                          cx="40"
                          cy="40"
                          r="36"
                          stroke="currentColor"
                          strokeWidth="8"
                          fill="none"
                          strokeDasharray={`${2 * Math.PI * 36}`}
                          strokeDashoffset={`${2 * Math.PI * 36 * (1 - target.stats.progress_percentage / 100)}`}
                          className={
                            target.stats.progress_percentage === 100
                              ? 'text-green-500'
                              : target.stats.progress_percentage >= 50
                              ? 'text-blue-500'
                              : 'text-yellow-500'
                          }
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-lg font-bold text-gray-900">
                          {target.stats.progress_percentage}%
                        </span>
                      </div>
                    </div>
                    <span className="text-xs text-gray-600 mt-1">Progress</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.total_pages > 1 && (
        <div className="flex items-center justify-between bg-white px-4 py-3 rounded-lg border border-gray-200">
          <div className="text-sm text-gray-700">
            Showing <span className="font-medium">{((pagination.page - 1) * pagination.limit) + 1}</span> to{' '}
            <span className="font-medium">
              {Math.min(pagination.page * pagination.limit, pagination.total)}
            </span>{' '}
            of <span className="font-medium">{pagination.total}</span> targets
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => changePage(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => changePage(pagination.page + 1)}
              disabled={pagination.page === pagination.total_pages}
              className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );

  // ============================================================================
  // RENDER - DETAIL VIEW
  // ============================================================================

  const renderDetailView = () => {
    if (!selectedTarget) {
      return (
        <div className="text-center py-12">
          <p className="text-gray-600">Target not found</p>
          <button
            onClick={handleBackToList}
            className="mt-4 text-indigo-600 hover:text-indigo-700"
          >
            ← Back to list
          </button>
        </div>
      );
    }

    const target = selectedTarget;
    const daysRemaining = getDaysRemaining(target.due_date);
    const isOverdue = isTargetOverdue(target);

    return (
      <div className="space-y-6">
        {/* Header with Back Button */}
        <div className="flex items-center justify-between">
          <button
            onClick={handleBackToList}
            className="text-indigo-600 hover:text-indigo-700 flex items-center gap-2"
          >
            ← Back to list
          </button>
          {canEdit && (
            <div className="flex gap-2">
              {target.status === 'active' && (
                <>
                  <button
                    onClick={() => handleMarkComplete(target.id)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    ✓ Mark Complete
                  </button>
                  <button
                    onClick={() => handleMarkCancelled(target.id)}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                  >
                    Cancel Target
                  </button>
                </>
              )}
              <button
                onClick={() => handleEdit(target)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                Edit
              </button>
              {canDelete && (
                <button
                  onClick={() => handleDeleteTarget(target.id)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Delete
                </button>
              )}
            </div>
          )}
        </div>

        {/* Target Details Card */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          {/* Title and Badges */}
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className={`px-3 py-1 text-sm font-medium rounded-full ${getTypeColor(target.type)}`}>
                  {TARGET_TYPE_CONFIG[target.type]?.icon} {TARGET_TYPE_CONFIG[target.type]?.label}
                </span>
                <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(target.status)}`}>
                  {TARGET_STATUS_CONFIG[target.status]?.icon} {TARGET_STATUS_CONFIG[target.status]?.label}
                </span>
                {target.category && (
                  <span className="px-3 py-1 text-sm bg-gray-100 text-gray-800 rounded-full">
                    {CATEGORY_CONFIG[target.category]?.icon} {CATEGORY_CONFIG[target.category]?.label}
                  </span>
                )}
              </div>
              <h1 className="text-3xl font-bold text-gray-900">{target.title}</h1>
              {target.description && (
                <p className="mt-2 text-gray-600">{target.description}</p>
              )}
            </div>

            {/* Progress Circle */}
            {target.stats && (
              <div className="flex flex-col items-center">
                <div className="relative w-24 h-24">
                  <svg className="transform -rotate-90 w-24 h-24">
                    <circle
                      cx="48"
                      cy="48"
                      r="44"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="none"
                      className="text-gray-200"
                    />
                    <circle
                      cx="48"
                      cy="48"
                      r="44"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="none"
                      strokeDasharray={`${2 * Math.PI * 44}`}
                      strokeDashoffset={`${2 * Math.PI * 44 * (1 - target.stats.progress_percentage / 100)}`}
                      className={
                        target.stats.progress_percentage === 100
                          ? 'text-green-500'
                          : target.stats.progress_percentage >= 50
                          ? 'text-blue-500'
                          : 'text-yellow-500'
                      }
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center flex-col">
                    <span className="text-2xl font-bold text-gray-900">
                      {target.stats.progress_percentage}%
                    </span>
                  </div>
                </div>
                <span className="text-sm text-gray-600 mt-2">Progress</span>
              </div>
            )}
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-200">
            <div>
              <p className="text-sm text-gray-600">Start Date</p>
              <p className="text-base font-medium text-gray-900">
                {formatDate(target.start_date)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Due Date</p>
              <p className={`text-base font-medium ${isOverdue ? 'text-red-600' : 'text-gray-900'}`}>
                {formatDate(target.due_date)}
                {isOverdue && <span className="ml-1 text-xs">(Overdue)</span>}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Days Remaining</p>
              <p className={`text-base font-medium ${(daysRemaining || 0) < 0 ? 'text-red-600' : 'text-gray-900'}`}>
                {daysRemaining !== undefined ? (
                  daysRemaining >= 0 ? `${daysRemaining} days` : `${Math.abs(daysRemaining)} days overdue`
                ) : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Created</p>
              <p className="text-base font-medium text-gray-900">
                {formatDate(target.created_at)}
              </p>
            </div>
          </div>
        </div>

        {/* Milestones Section */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Milestones ({target.milestones?.filter(m => m.completed).length || 0} / {target.milestones?.length || 0})
          </h2>

          {target.milestones && target.milestones.length > 0 ? (
            <div className="space-y-3">
              {target.milestones
                .sort((a, b) => a.order - b.order)
                .map((milestone, index) => (
                  <div
                    key={milestone.id}
                    className={`p-4 rounded-lg border-2 ${
                      milestone.completed
                        ? 'bg-green-50 border-green-200'
                        : 'bg-white border-gray-200'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="mt-1">
                          {milestone.completed ? (
                            <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-white text-sm">
                              ✓
                            </div>
                          ) : (
                            <div className="w-6 h-6 rounded-full border-2 border-gray-300 flex items-center justify-center text-gray-400 text-sm">
                              {index + 1}
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <h3 className={`font-medium ${milestone.completed ? 'text-green-900' : 'text-gray-900'}`}>
                            {milestone.title}
                          </h3>
                          {milestone.description && (
                            <p className={`text-sm mt-1 ${milestone.completed ? 'text-green-700' : 'text-gray-600'}`}>
                              {milestone.description}
                            </p>
                          )}
                          {milestone.target_value && (
                            <div className="mt-2 text-sm">
                              <span className={milestone.completed ? 'text-green-700' : 'text-gray-600'}>
                                Progress: {milestone.current_value || 0} / {milestone.target_value}
                              </span>
                            </div>
                          )}
                          {milestone.completed_at && (
                            <p className="text-xs text-green-600 mt-1">
                              Completed on {formatDate(milestone.completed_at)}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No milestones defined for this target</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  // ============================================================================
  // RENDER - CREATE/EDIT FORM
  // ============================================================================

  const renderCreateEditForm = () => {
    const isEditMode = viewMode === 'edit';

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <button
              onClick={handleBackToList}
              className="text-indigo-600 hover:text-indigo-700 flex items-center gap-2 mb-2"
            >
              ← Back to list
            </button>
            <h2 className="text-2xl font-bold text-gray-900">
              {isEditMode ? 'Edit Target' : 'Create New Target'}
            </h2>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          {formErrors.general && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {formErrors.general}
            </div>
          )}

          <div className="space-y-4">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Target Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.title || ''}
                onChange={(e) => handleFormChange('title', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 ${
                  formErrors.title ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="e.g., Memorize Juz Amma"
                maxLength={TARGET_CONSTANTS.MAX_TITLE_LENGTH}
              />
              {formErrors.title && (
                <p className="mt-1 text-sm text-red-600">{formErrors.title}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description || ''}
                onChange={(e) => handleFormChange('description', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="Provide additional details about this target..."
                maxLength={TARGET_CONSTANTS.MAX_DESCRIPTION_LENGTH}
              />
            </div>

            {/* Type and Category Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Target Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.type || 'individual'}
                  onChange={(e) => handleFormChange('type', e.target.value as TargetType)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 ${
                    formErrors.type ? 'border-red-300' : 'border-gray-300'
                  }`}
                  disabled={isEditMode} // Can't change type after creation
                >
                  <option value="individual">👤 Individual</option>
                  <option value="class">👥 Class</option>
                  <option value="school">🏫 School</option>
                </select>
                {formErrors.type && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.type}</p>
                )}
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  value={formData.category || ''}
                  onChange={(e) => handleFormChange('category', e.target.value || undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Select category...</option>
                  {TARGET_CONSTANTS.CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {CATEGORY_CONFIG[cat]?.icon} {CATEGORY_CONFIG[cat]?.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Dynamic dropdowns based on target type */}
            {formData.type === 'individual' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Student <span className="text-red-500">*</span>
                </label>
                {isLoadingClasses ? (
                  <div className="px-3 py-2 border border-gray-300 rounded-lg text-gray-500">
                    Loading students...
                  </div>
                ) : (
                  <>
                    <input
                      type="text"
                      placeholder="Search student by name..."
                      value={studentSearchFilter}
                      onChange={(e) => setStudentSearchFilter(e.target.value)}
                      className="w-full px-3 py-2 mb-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                    <select
                      value={formData.student_id || ''}
                      onChange={(e) => handleFormChange('student_id', e.target.value || undefined)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 ${
                        formErrors.student_id ? 'border-red-300' : 'border-gray-300'
                      }`}
                    >
                      <option value="">Select a student...</option>
                      {teacherStudents
                        .filter((student) =>
                          !studentSearchFilter ||
                          (student.name || '').toLowerCase().includes(studentSearchFilter.toLowerCase())
                        )
                        .map((student) => (
                          <option key={student.id} value={student.id}>
                            {student.name || student.email || 'Unnamed Student'}
                          </option>
                        ))}
                    </select>
                    {formErrors.student_id && (
                      <p className="mt-1 text-sm text-red-600">{formErrors.student_id}</p>
                    )}
                    {teacherStudents.length === 0 && (
                      <p className="mt-1 text-sm text-gray-500">No students found in your classes.</p>
                    )}
                  </>
                )}
              </div>
            )}

            {formData.type === 'class' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Class <span className="text-red-500">*</span>
                </label>
                {isLoadingClasses ? (
                  <div className="px-3 py-2 border border-gray-300 rounded-lg text-gray-500">
                    Loading classes...
                  </div>
                ) : (
                  <>
                    <select
                      value={formData.class_id || ''}
                      onChange={(e) => handleFormChange('class_id', e.target.value || undefined)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 ${
                        formErrors.class_id ? 'border-red-300' : 'border-gray-300'
                      }`}
                    >
                      <option value="">Select a class...</option>
                      {teacherClasses.map((cls) => (
                        <option key={cls.id} value={cls.id}>
                          {cls.name} ({cls.students?.length || 0} students)
                        </option>
                      ))}
                    </select>
                    {formErrors.class_id && (
                      <p className="mt-1 text-sm text-red-600">{formErrors.class_id}</p>
                    )}
                    {teacherClasses.length === 0 && (
                      <p className="mt-1 text-sm text-gray-500">No classes found. Create a class first.</p>
                    )}
                  </>
                )}
              </div>
            )}

            {formData.type === 'school' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  School
                </label>
                <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-700">
                  🏫 {schoolInfo?.name || 'Loading school...'}
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  This target will be visible to all students in your school.
                </p>
              </div>
            )}

            {/* Dates Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Start Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={formData.start_date ? formData.start_date.split('T')[0] : ''}
                  onChange={(e) =>
                    handleFormChange('start_date', e.target.value ? new Date(e.target.value).toISOString() : undefined)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Due Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Due Date
                </label>
                <input
                  type="date"
                  value={formData.due_date ? formData.due_date.split('T')[0] : ''}
                  onChange={(e) =>
                    handleFormChange('due_date', e.target.value ? new Date(e.target.value).toISOString() : undefined)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Milestones Section */}
            <div className="border-t border-gray-200 pt-4 mt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Milestones</h3>
                <button
                  type="button"
                  onClick={handleAddMilestone}
                  className="px-3 py-1 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                  disabled={(formData.milestones?.length || 0) >= TARGET_CONSTANTS.MAX_MILESTONES}
                >
                  + Add Milestone
                </button>
              </div>

              {formData.milestones && formData.milestones.length > 0 ? (
                <div className="space-y-3">
                  {formData.milestones.map((milestone, index) => (
                    <div key={index} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                      <div className="flex items-start justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">
                          Milestone {index + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveMilestone(index)}
                          className="text-red-600 hover:text-red-700 text-sm"
                        >
                          Remove
                        </button>
                      </div>
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={milestone.title || ''}
                          onChange={(e) => handleMilestoneChange(index, 'title', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                          placeholder="Milestone title"
                          maxLength={TARGET_CONSTANTS.MAX_TITLE_LENGTH}
                        />
                        <textarea
                          value={milestone.description || ''}
                          onChange={(e) => handleMilestoneChange(index, 'description', e.target.value)}
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                          placeholder="Description (optional)"
                        />
                        <input
                          type="number"
                          value={milestone.target_value || ''}
                          onChange={(e) =>
                            handleMilestoneChange(index, 'target_value', e.target.value ? parseInt(e.target.value) : undefined)
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                          placeholder="Target value (e.g., 10 pages, 5 surahs)"
                          min="1"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-gray-500 bg-gray-50 rounded-lg">
                  <p className="text-sm">No milestones added yet</p>
                  <p className="text-xs mt-1">Click "Add Milestone" to create measurable steps</p>
                </div>
              )}

              {(formData.milestones?.length || 0) >= TARGET_CONSTANTS.MAX_MILESTONES && (
                <p className="text-xs text-gray-600 mt-2">
                  Maximum of {TARGET_CONSTANTS.MAX_MILESTONES} milestones reached
                </p>
              )}
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={handleBackToList}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleCreateTarget}
              disabled={isLoading}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Saving...' : isEditMode ? 'Save Changes' : 'Create Target'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ============================================================================
  // MAIN RENDER
  // ============================================================================

  return (
    <div className="max-w-7xl mx-auto p-6">
      {viewMode === 'list' && renderListView()}
      {viewMode === 'detail' && renderDetailView()}
      {(viewMode === 'create' || viewMode === 'edit') && renderCreateEditForm()}
    </div>
  );
}
