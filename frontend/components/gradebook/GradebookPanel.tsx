'use client';

/**
 * GradebookPanel Component - Complete Gradebook UI
 * Created: 2025-10-20
 * Purpose: Reusable gradebook interface for all user roles
 * Pattern: Matches MessagesPanel.tsx - role-based rendering, modals, Tailwind + Lucide
 */

import { useState, useEffect } from 'react';
import { useGradebook } from '@/hooks/useGradebook';
import {
  BookOpen,
  Plus,
  X,
  Save,
  Edit2,
  Trash2,
  Search,
  Download,
  CheckCircle,
  Award,
  TrendingUp,
  Calendar,
  Eye,
  ChevronLeft,
  ChevronRight,
  Loader,
  AlertCircle,
  Star,
  FileText,
  Target,
  ClipboardCheck,
} from 'lucide-react';
import { RubricWithDetails, GradeWithDetails, StudentGradebookEntry } from '@/lib/types/gradebook';
import GradingInterface from './GradingInterface';

interface GradebookPanelProps {
  userRole?: 'owner' | 'admin' | 'teacher' | 'student' | 'parent';
  studentId?: string;
}

export default function GradebookPanel({ userRole = 'teacher', studentId }: GradebookPanelProps) {
  const {
    isLoading,
    error,
    rubrics,
    currentRubric,
    isLoadingRubric,
    grades,
    gradeProgress,
    gradebookEntries,
    gradebookStats,
    currentView,
    currentPage,
    totalPages,
    totalItems,
    isSubmitting,
    fetchRubrics,
    fetchRubric,
    createRubric,
    updateRubric,
    deleteRubric,
    clearCurrentRubric,
    submitGrade,
    fetchAssignmentGrades,
    fetchStudentGrades,
    attachRubric,
    fetchStudentGradebook,
    fetchParentGradebook,
    exportGradebook,
    changeView,
    changePage,
    refreshData,
  } = useGradebook(userRole === 'teacher' ? 'rubrics' : userRole === 'student' ? 'student-view' : 'parent-view');

  // UI State
  const [activeTab, setActiveTab] = useState<'rubrics' | 'grade-students'>('rubrics');
  const [showCreateRubricModal, setShowCreateRubricModal] = useState(false);
  const [showRubricDetailsModal, setShowRubricDetailsModal] = useState(false);
  const [showGradeSubmissionModal, setShowGradeSubmissionModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRubric, setSelectedRubric] = useState<RubricWithDetails | null>(null);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string>('');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');

  // Create rubric form state
  const [rubricForm, setRubricForm] = useState({
    name: '',
    description: '',
    criteria: [
      { name: '', description: '', weight: 0, max_score: 100, order: 1 },
    ],
  });

  // Grade submission form state
  const [gradeForm, setGradeForm] = useState({
    assignment_id: '',
    student_id: '',
    criterion_id: '',
    score: 0,
    max_score: 100,
    comments: '',
  });

  // ============================================================================
  // EFFECTS
  // ============================================================================

  /**
   * Fetch student gradebook when studentId is provided
   */
  useEffect(() => {
    console.log('📊 GradebookPanel useEffect - userRole:', userRole, 'studentId:', studentId);
    if (userRole === 'student' && studentId) {
      console.log('🔄 Fetching student gradebook for:', studentId);
      fetchStudentGradebook(studentId);
    }
  }, [userRole, studentId, fetchStudentGradebook]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  /**
   * Handle create rubric form submission
   */
  const handleCreateRubric = async () => {
    // Validation
    if (!rubricForm.name.trim()) {
      alert('Please enter a rubric name');
      return;
    }

    if (rubricForm.criteria.length === 0) {
      alert('Please add at least one criterion');
      return;
    }

    const totalWeight = rubricForm.criteria.reduce((sum, c) => sum + Number(c.weight), 0);
    if (Math.abs(totalWeight - 100) > 0.01) {
      alert(`Total weight must equal 100% (current: ${totalWeight}%)`);
      return;
    }

    const success = await createRubric(rubricForm);
    if (success) {
      setShowCreateRubricModal(false);
      setRubricForm({
        name: '',
        description: '',
        criteria: [{ name: '', description: '', weight: 0, max_score: 100, order: 1 }],
      });
    }
  };

  /**
   * Handle add criterion to rubric form
   */
  const handleAddCriterion = () => {
    setRubricForm(prev => ({
      ...prev,
      criteria: [
        ...prev.criteria,
        { name: '', description: '', weight: 0, max_score: 100, order: prev.criteria.length + 1 },
      ],
    }));
  };

  /**
   * Handle remove criterion from rubric form
   */
  const handleRemoveCriterion = (index: number) => {
    setRubricForm(prev => ({
      ...prev,
      criteria: prev.criteria.filter((_, i) => i !== index),
    }));
  };

  /**
   * Handle update criterion in rubric form
   */
  const handleUpdateCriterion = (index: number, field: string, value: any) => {
    setRubricForm(prev => ({
      ...prev,
      criteria: prev.criteria.map((c, i) =>
        i === index ? { ...c, [field]: value } : c
      ),
    }));
  };

  /**
   * Handle view rubric details
   */
  const handleViewRubric = async (rubric: RubricWithDetails) => {
    setSelectedRubric(rubric);
    await fetchRubric(rubric.id);
    setShowRubricDetailsModal(true);
  };

  /**
   * Handle delete rubric
   */
  const handleDeleteRubric = async (rubricId: string) => {
    if (!confirm('Are you sure you want to delete this rubric? This action cannot be undone.')) {
      return;
    }

    const success = await deleteRubric(rubricId);
    if (success) {
      setShowRubricDetailsModal(false);
      setSelectedRubric(null);
    }
  };

  /**
   * Handle submit grade
   */
  const handleSubmitGrade = async () => {
    if (!gradeForm.assignment_id || !gradeForm.student_id || !gradeForm.criterion_id) {
      alert('Please fill in all required fields');
      return;
    }

    if (gradeForm.score < 0 || gradeForm.score > gradeForm.max_score) {
      alert(`Score must be between 0 and ${gradeForm.max_score}`);
      return;
    }

    const success = await submitGrade(gradeForm);
    if (success) {
      setShowGradeSubmissionModal(false);
      setGradeForm({
        assignment_id: '',
        student_id: '',
        criterion_id: '',
        score: 0,
        max_score: 100,
        comments: '',
      });
    }
  };

  /**
   * Handle export gradebook
   */
  const handleExportGradebook = async () => {
    await exportGradebook({
      format: 'csv',
      include_comments: true,
    });
  };

  /**
   * Filter rubrics by search query
   */
  const filteredRubrics = rubrics.filter(rubric =>
    rubric.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (rubric.description && rubric.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  /**
   * Calculate total weight for rubric form
   */
  const totalWeight = rubricForm.criteria.reduce((sum, c) => sum + Number(c.weight || 0), 0);

  /**
   * Format date for display
   */
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  /**
   * Get letter grade from percentage
   */
  const getLetterGrade = (percentage: number): string => {
    if (percentage >= 90) return 'A';
    if (percentage >= 80) return 'B';
    if (percentage >= 70) return 'C';
    if (percentage >= 60) return 'D';
    return 'F';
  };

  /**
   * Get grade color
   */
  const getGradeColor = (percentage: number): string => {
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 80) return 'text-blue-600';
    if (percentage >= 70) return 'text-yellow-600';
    if (percentage >= 60) return 'text-orange-600';
    return 'text-red-600';
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="bg-white rounded-lg shadow-sm">
      {/* HEADER */}
      <div className="border-b border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <BookOpen className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Gradebook</h2>
              <p className="text-sm text-gray-500">
                {userRole === 'teacher' && `${totalItems} rubrics`}
                {userRole === 'student' && gradebookStats && `${gradebookStats.graded_assignments} graded assignments`}
                {userRole === 'parent' && gradebookStats && `${gradebookStats.graded_assignments} assignments`}
              </p>
            </div>
          </div>

          {/* Teacher Actions */}
          {userRole === 'teacher' && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleExportGradebook}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                disabled={isLoading}
              >
                <Download className="w-4 h-4" />
                Export
              </button>
              <button
                onClick={() => setShowCreateRubricModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
              >
                <Plus className="w-4 h-4" />
                Create Rubric
              </button>
            </div>
          )}

          {/* Student/Parent Actions */}
          {(userRole === 'student' || userRole === 'parent') && (
            <button
              onClick={handleExportGradebook}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              disabled={isLoading}
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          )}
        </div>
      </div>

      {/* TAB NAVIGATION - TEACHER ONLY */}
      {userRole === 'teacher' && (
        <div className="border-b border-gray-200 px-6">
          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab('rubrics')}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 transition ${
                activeTab === 'rubrics'
                  ? 'border-purple-600 text-purple-600 font-medium'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
              }`}
            >
              <Target className="w-4 h-4" />
              Rubrics
            </button>
            <button
              onClick={() => setActiveTab('grade-students')}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 transition ${
                activeTab === 'grade-students'
                  ? 'border-purple-600 text-purple-600 font-medium'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
              }`}
            >
              <ClipboardCheck className="w-4 h-4" />
              Grade Students
            </button>
          </div>
        </div>
      )}

      {/* ERROR STATE */}
      {error && (
        <div className="m-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* TEACHER VIEW - RUBRICS */}
      {userRole === 'teacher' && activeTab === 'rubrics' && (
        <>
          {/* Search */}
          <div className="p-6 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search rubrics..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          {/* Rubrics List */}
          <div className="divide-y divide-gray-100">
            {isLoading ? (
              <div className="p-12 text-center">
                <Loader className="w-8 h-8 mx-auto text-purple-600 animate-spin" />
                <p className="mt-4 text-gray-500">Loading rubrics...</p>
              </div>
            ) : filteredRubrics.length === 0 ? (
              <div className="p-12 text-center">
                <BookOpen className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500 mb-2">No rubrics found</p>
                <p className="text-sm text-gray-400">
                  {searchQuery ? 'Try a different search term' : 'Create your first rubric to get started'}
                </p>
              </div>
            ) : (
              filteredRubrics.map((rubric) => (
                <div
                  key={rubric.id}
                  onClick={() => handleViewRubric(rubric)}
                  className="p-4 cursor-pointer transition hover:bg-gray-50"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-purple-100 rounded">
                          <Target className="w-4 h-4 text-purple-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 truncate">{rubric.name}</h3>
                          {rubric.description && (
                            <p className="text-sm text-gray-500 truncate">{rubric.description}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <FileText className="w-4 h-4" />
                          {rubric.total_criteria || 0} criteria
                        </div>
                        <div className="flex items-center gap-1">
                          <Award className="w-4 h-4" />
                          {rubric.total_weight || 0}% weight
                        </div>
                        {rubric.assignment_count !== undefined && (
                          <div className="flex items-center gap-1">
                            <CheckCircle className="w-4 h-4" />
                            {rubric.assignment_count} assignments
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className="text-sm text-gray-500">
                        {formatDate(rubric.created_at)}
                      </div>
                      <Eye className="w-4 h-4 text-gray-400" />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="border-t border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  Page {currentPage} of {totalPages} • {totalItems} total
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => changePage(currentPage - 1)}
                    disabled={currentPage === 1 || isLoading}
                    className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => changePage(currentPage + 1)}
                    disabled={currentPage === totalPages || isLoading}
                    className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* TEACHER VIEW - GRADE STUDENTS */}
      {userRole === 'teacher' && activeTab === 'grade-students' && (
        <GradingInterface />
      )}

      {/* STUDENT VIEW - GRADEBOOK */}
      {userRole === 'student' && (
        <>
          {/* Stats Summary */}
          {gradebookStats && (
            <div className="p-6 border-b border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <Award className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="text-sm text-blue-600 font-medium">Average</p>
                      <p className="text-2xl font-bold text-blue-900">
                        {gradebookStats.average_score.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="text-sm text-green-600 font-medium">Highest</p>
                      <p className="text-2xl font-bold text-green-900">
                        {gradebookStats.highest_score.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-purple-600" />
                    <div>
                      <p className="text-sm text-purple-600 font-medium">Graded</p>
                      <p className="text-2xl font-bold text-purple-900">
                        {gradebookStats.graded_assignments}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-orange-50 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-orange-600" />
                    <div>
                      <p className="text-sm text-orange-600 font-medium">Pending</p>
                      <p className="text-2xl font-bold text-orange-900">
                        {gradebookStats.pending_assignments}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Gradebook Entries */}
          <div className="divide-y divide-gray-100">
            {isLoading ? (
              <div className="p-12 text-center">
                <Loader className="w-8 h-8 mx-auto text-purple-600 animate-spin" />
                <p className="mt-4 text-gray-500">Loading gradebook...</p>
              </div>
            ) : gradebookEntries.length === 0 ? (
              <div className="p-12 text-center">
                <BookOpen className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500">No grades available yet</p>
              </div>
            ) : (
              gradebookEntries.map((entry) => (
                <div key={entry.assignment_id} className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 mb-1">
                        {entry.assignment_title}
                      </h3>
                      <p className="text-sm text-gray-500 mb-3">
                        {entry.rubric_name || 'No rubric'}
                      </p>

                      {/* Criteria Grades */}
                      <div className="space-y-2">
                        {entry.grades.map((grade) => (
                          <div key={grade.id} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                            <div className="flex-1">
                              <p className="font-medium text-gray-900 text-sm">
                                {grade.criterion?.name}
                              </p>
                              {grade.comments && (
                                <p className="text-xs text-gray-500 mt-1">{grade.comments}</p>
                              )}
                            </div>
                            <div className="text-right ml-4">
                              <p className={`font-bold ${getGradeColor(grade.percentage || 0)}`}>
                                {grade.score}/{grade.max_score}
                              </p>
                              <p className="text-xs text-gray-500">
                                {grade.percentage?.toFixed(1)}%
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Overall Grade */}
                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      <div className={`text-3xl font-bold ${getGradeColor(entry.overall_percentage)}`}>
                        {getLetterGrade(entry.overall_percentage)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {entry.overall_percentage.toFixed(1)}%
                      </div>
                      {entry.graded_at && (
                        <div className="text-xs text-gray-400">
                          {formatDate(entry.graded_at)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {/* PARENT VIEW - CHILDREN GRADEBOOK */}
      {userRole === 'parent' && (
        <>
          {/* Stats Summary */}
          {gradebookStats && (
            <div className="p-6 border-b border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <Award className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="text-sm text-blue-600 font-medium">Average</p>
                      <p className="text-2xl font-bold text-blue-900">
                        {gradebookStats.average_score.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="text-sm text-green-600 font-medium">Highest</p>
                      <p className="text-2xl font-bold text-green-900">
                        {gradebookStats.highest_score.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-purple-600" />
                    <div>
                      <p className="text-sm text-purple-600 font-medium">Graded</p>
                      <p className="text-2xl font-bold text-purple-900">
                        {gradebookStats.graded_assignments}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-orange-50 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-orange-600" />
                    <div>
                      <p className="text-sm text-orange-600 font-medium">Pending</p>
                      <p className="text-2xl font-bold text-orange-900">
                        {gradebookStats.pending_assignments}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Gradebook Entries */}
          <div className="divide-y divide-gray-100">
            {isLoading ? (
              <div className="p-12 text-center">
                <Loader className="w-8 h-8 mx-auto text-purple-600 animate-spin" />
                <p className="mt-4 text-gray-500">Loading gradebook...</p>
              </div>
            ) : gradebookEntries.length === 0 ? (
              <div className="p-12 text-center">
                <BookOpen className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500">No grades available yet</p>
              </div>
            ) : (
              gradebookEntries.map((entry) => (
                <div key={entry.assignment_id} className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 mb-1">
                        {entry.assignment_title}
                      </h3>
                      <p className="text-sm text-gray-500 mb-3">
                        {entry.rubric_name || 'No rubric'}
                      </p>

                      {/* Criteria Grades */}
                      <div className="space-y-2">
                        {entry.grades.map((grade) => (
                          <div key={grade.id} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                            <div className="flex-1">
                              <p className="font-medium text-gray-900 text-sm">
                                {grade.criterion?.name}
                              </p>
                              {grade.comments && (
                                <p className="text-xs text-gray-500 mt-1">{grade.comments}</p>
                              )}
                            </div>
                            <div className="text-right ml-4">
                              <p className={`font-bold ${getGradeColor(grade.percentage || 0)}`}>
                                {grade.score}/{grade.max_score}
                              </p>
                              <p className="text-xs text-gray-500">
                                {grade.percentage?.toFixed(1)}%
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Overall Grade */}
                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      <div className={`text-3xl font-bold ${getGradeColor(entry.overall_percentage)}`}>
                        {getLetterGrade(entry.overall_percentage)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {entry.overall_percentage.toFixed(1)}%
                      </div>
                      {entry.graded_at && (
                        <div className="text-xs text-gray-400">
                          {formatDate(entry.graded_at)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {/* CREATE RUBRIC MODAL */}
      {showCreateRubricModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">Create Rubric</h3>
              <button
                onClick={() => setShowCreateRubricModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* Rubric Info */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rubric Name *
                  </label>
                  <input
                    type="text"
                    value={rubricForm.name}
                    onChange={(e) => setRubricForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Quran Recitation Assessment"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    maxLength={200}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description (Optional)
                  </label>
                  <textarea
                    value={rubricForm.description}
                    onChange={(e) => setRubricForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe the purpose of this rubric..."
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    maxLength={1000}
                  />
                </div>
              </div>

              {/* Criteria */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-gray-900">Criteria</h4>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm ${Math.abs(totalWeight - 100) < 0.01 ? 'text-green-600' : 'text-orange-600'}`}>
                      Total: {totalWeight.toFixed(1)}% / 100%
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  {rubricForm.criteria.map((criterion, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <input
                          type="text"
                          value={criterion.name}
                          onChange={(e) => handleUpdateCriterion(index, 'name', e.target.value)}
                          placeholder="Criterion name"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                        {rubricForm.criteria.length > 1 && (
                          <button
                            onClick={() => handleRemoveCriterion(index)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Weight (%)</label>
                          <input
                            type="number"
                            value={criterion.weight}
                            onChange={(e) => handleUpdateCriterion(index, 'weight', Number(e.target.value))}
                            min="0"
                            max="100"
                            step="0.1"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Max Score</label>
                          <input
                            type="number"
                            value={criterion.max_score}
                            onChange={(e) => handleUpdateCriterion(index, 'max_score', Number(e.target.value))}
                            min="1"
                            max="1000"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                          />
                        </div>
                      </div>

                      <textarea
                        value={criterion.description}
                        onChange={(e) => handleUpdateCriterion(index, 'description', e.target.value)}
                        placeholder="Description (optional)"
                        rows={2}
                        className="w-full mt-3 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  ))}
                </div>

                <button
                  onClick={handleAddCriterion}
                  className="mt-3 flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  <Plus className="w-4 h-4" />
                  Add Criterion
                </button>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowCreateRubricModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateRubric}
                disabled={isSubmitting || !rubricForm.name.trim() || Math.abs(totalWeight - 100) > 0.01}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {isSubmitting ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Create Rubric
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RUBRIC DETAILS MODAL */}
      {showRubricDetailsModal && currentRubric && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">{currentRubric.name}</h3>
              <button
                onClick={() => {
                  setShowRubricDetailsModal(false);
                  setSelectedRubric(null);
                  clearCurrentRubric();
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              {isLoadingRubric ? (
                <div className="py-12 text-center">
                  <Loader className="w-8 h-8 mx-auto text-purple-600 animate-spin" />
                  <p className="mt-4 text-gray-500">Loading rubric details...</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Description */}
                  {currentRubric.description && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Description</h4>
                      <p className="text-gray-600">{currentRubric.description}</p>
                    </div>
                  )}

                  {/* Criteria */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">
                      Criteria ({currentRubric.criteria?.length || 0})
                    </h4>
                    <div className="space-y-3">
                      {currentRubric.criteria?.map((criterion, index) => (
                        <div key={criterion.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-start justify-between mb-2">
                            <h5 className="font-medium text-gray-900">{criterion.name}</h5>
                            <div className="flex items-center gap-3 text-sm">
                              <span className="text-purple-600 font-medium">{criterion.weight}%</span>
                              <span className="text-gray-500">{criterion.max_score} pts</span>
                            </div>
                          </div>
                          {criterion.description && (
                            <p className="text-sm text-gray-600">{criterion.description}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-purple-50 rounded-lg p-4">
                      <p className="text-sm text-purple-600 mb-1">Total Criteria</p>
                      <p className="text-2xl font-bold text-purple-900">
                        {currentRubric.total_criteria || 0}
                      </p>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-4">
                      <p className="text-sm text-blue-600 mb-1">Total Weight</p>
                      <p className="text-2xl font-bold text-blue-900">
                        {currentRubric.total_weight || 0}%
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            {userRole === 'teacher' && (
              <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-end gap-3">
                <button
                  onClick={() => handleDeleteRubric(currentRubric.id)}
                  className="flex items-center gap-2 px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition"
                  disabled={isSubmitting}
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
