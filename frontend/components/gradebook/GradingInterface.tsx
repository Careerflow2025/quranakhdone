'use client';

/**
 * GradingInterface Component - Teacher Grading UI
 * Created: 2025-10-28
 * Purpose: Interface for teachers to grade students on assignments with rubrics
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {
  GraduationCap,
  BookOpen,
  Save,
  Loader,
  AlertCircle,
  CheckCircle,
  FileText,
  User,
  Award,
  MessageSquare,
  ArrowLeft,
  TrendingUp,
  Search,
  X,
  Link,
} from 'lucide-react';

interface Assignment {
  id: string;
  title: string;
  student_id: string;
  student_name: string;
  rubric_id: string | null;
  rubric_name: string | null;
  has_rubric: boolean;
  criteria: Array<{
    id: string;
    name: string;
    description: string;
    weight: number;
    max_score: number;
  }>;
  existing_grades?: Array<{
    criterion_id: string;
    score: number;
    comments: string;
  }>;
}

interface Rubric {
  id: string;
  name: string;
  description: string;
  total_criteria: number;
}

export default function GradingInterface() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Rubric attachment modal state
  const [showRubricModal, setShowRubricModal] = useState(false);
  const [assignmentToAttach, setAssignmentToAttach] = useState<Assignment | null>(null);
  const [availableRubrics, setAvailableRubrics] = useState<Rubric[]>([]);
  const [isAttaching, setIsAttaching] = useState(false);

  // Scores state: { criterion_id: { score: number, comments: string } }
  const [scores, setScores] = useState<Record<string, { score: number; comments: string }>>({});

  // Fetch assignments with rubrics on mount
  useEffect(() => {
    fetchAssignmentsWithRubrics();
  }, []);

  /**
   * Fetch all assignments that have rubrics attached
   */
  const fetchAssignmentsWithRubrics = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Get current session from Supabase
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !session) {
        throw new Error('Not authenticated. Please log in.');
      }

      const response = await fetch('/api/grades/assignments-with-rubrics', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch assignments');
      }

      const data = await response.json();
      setAssignments(data.assignments || []);
    } catch (err: any) {
      console.error('Error fetching assignments:', err);
      setError(err.message || 'Failed to load assignments');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Load existing grades for selected assignment
   */
  const loadExistingGrades = (assignment: Assignment) => {
    const initialScores: Record<string, { score: number; comments: string }> = {};

    assignment.criteria.forEach((criterion) => {
      const existingGrade = assignment.existing_grades?.find(
        (g) => g.criterion_id === criterion.id
      );

      initialScores[criterion.id] = {
        score: existingGrade?.score || 0,
        comments: existingGrade?.comments || '',
      };
    });

    setScores(initialScores);
  };

  /**
   * Handle assignment selection
   */
  const handleSelectAssignment = (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    loadExistingGrades(assignment);
    setSuccessMessage(null);
    setError(null);
  };

  /**
   * Update score for a criterion
   */
  const updateScore = (criterionId: string, score: number) => {
    setScores((prev) => ({
      ...prev,
      [criterionId]: {
        ...prev[criterionId],
        score: Math.max(0, Math.min(score, getMaxScore(criterionId))),
      },
    }));
  };

  /**
   * Update comments for a criterion
   */
  const updateComments = (criterionId: string, comments: string) => {
    setScores((prev) => ({
      ...prev,
      [criterionId]: {
        ...prev[criterionId],
        comments,
      },
    }));
  };

  /**
   * Get max score for a criterion
   */
  const getMaxScore = (criterionId: string): number => {
    const criterion = selectedAssignment?.criteria.find((c) => c.id === criterionId);
    return criterion?.max_score || 100;
  };

  /**
   * Calculate total weighted score
   */
  const calculateTotalScore = (): { total: number; percentage: number } => {
    if (!selectedAssignment) return { total: 0, percentage: 0 };

    let totalWeighted = 0;

    selectedAssignment.criteria.forEach((criterion) => {
      const score = scores[criterion.id]?.score || 0;
      const percentage = (score / criterion.max_score) * 100;
      const weighted = (percentage * criterion.weight) / 100;
      totalWeighted += weighted;
    });

    return {
      total: totalWeighted,
      percentage: totalWeighted,
    };
  };

  /**
   * Save grades to database
   */
  const handleSaveGrades = async () => {
    if (!selectedAssignment) return;

    setIsSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      // Get current session from Supabase
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !session) {
        throw new Error('Not authenticated. Please log in.');
      }

      // Save each criterion grade individually
      const savePromises = selectedAssignment.criteria.map(async (criterion) => {
        const response = await fetch('/api/grades', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            assignment_id: selectedAssignment.id,
            student_id: selectedAssignment.student_id,
            criterion_id: criterion.id,
            score: scores[criterion.id]?.score || 0,
            max_score: criterion.max_score,
            comments: scores[criterion.id]?.comments || '',
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `Failed to save grade for ${criterion.name}`);
        }

        return response.json();
      });

      // Wait for all grades to be saved
      await Promise.all(savePromises);

      setSuccessMessage('Grades saved successfully!');

      // Refresh assignments to get updated existing grades
      await fetchAssignmentsWithRubrics();

      // Go back to assignment list
      setTimeout(() => {
        setSelectedAssignment(null);
        setSuccessMessage(null);
      }, 2000);
    } catch (err: any) {
      console.error('Error saving grades:', err);
      setError(err.message || 'Failed to save grades');
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Fetch available rubrics for attaching
   */
  const fetchAvailableRubrics = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch('/api/rubrics', {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setAvailableRubrics(data.rubrics || []);
      }
    } catch (err) {
      console.error('Error fetching rubrics:', err);
    }
  };

  /**
   * Open rubric attachment modal
   */
  const handleOpenRubricModal = (assignment: Assignment) => {
    setAssignmentToAttach(assignment);
    setShowRubricModal(true);
    fetchAvailableRubrics();
  };

  /**
   * Attach rubric to assignment
   */
  const handleAttachRubric = async (rubricId: string) => {
    if (!assignmentToAttach) return;

    setIsAttaching(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch(`/api/assignments/${assignmentToAttach.id}/rubric`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ rubric_id: rubricId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to attach rubric');
      }

      setSuccessMessage('Rubric attached successfully!');
      setShowRubricModal(false);
      setAssignmentToAttach(null);

      // Refresh assignments list
      await fetchAssignmentsWithRubrics();

      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to attach rubric');
    } finally {
      setIsAttaching(false);
    }
  };

  /**
   * Get letter grade
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
    if (percentage >= 90) return 'text-green-600 bg-green-50';
    if (percentage >= 80) return 'text-blue-600 bg-blue-50';
    if (percentage >= 70) return 'text-yellow-600 bg-yellow-50';
    if (percentage >= 60) return 'text-orange-600 bg-orange-50';
    return 'text-red-600 bg-red-50';
  };

  const { total: totalScore, percentage: totalPercentage } = calculateTotalScore();

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="bg-white rounded-lg shadow-sm">
      {/* HEADER */}
      <div className="border-b border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <GraduationCap className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Grade Students</h2>
              <p className="text-sm text-gray-500">
                {selectedAssignment
                  ? `Grading: ${selectedAssignment.title}`
                  : `${assignments.length} assignment${assignments.length !== 1 ? 's' : ''} • ${assignments.filter(a => a.has_rubric).length} ready to grade`}
              </p>
            </div>
          </div>

          {selectedAssignment && (
            <button
              onClick={() => {
                setSelectedAssignment(null);
                setScores({});
                setError(null);
                setSuccessMessage(null);
              }}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to List
            </button>
          )}
        </div>
      </div>

      {/* ERROR/SUCCESS MESSAGES */}
      {error && (
        <div className="m-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {successMessage && (
        <div className="m-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
          <p className="text-green-700">{successMessage}</p>
        </div>
      )}

      {/* LOADING STATE */}
      {isLoading && (
        <div className="p-12 text-center">
          <Loader className="w-8 h-8 mx-auto text-emerald-600 animate-spin" />
          <p className="mt-4 text-gray-500">Loading assignments...</p>
        </div>
      )}

      {/* ASSIGNMENT LIST VIEW */}
      {!isLoading && !selectedAssignment && (
        <>
          {/* Search Bar */}
          {assignments.length > 0 && (
            <div className="p-6 border-b border-gray-200">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by student name or assignment title..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          )}

          <div className="divide-y divide-gray-100">
            {assignments.length === 0 ? (
              <div className="p-12 text-center">
                <BookOpen className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500 mb-2">No assignments found</p>
                <p className="text-sm text-gray-400">
                  No assignments available for your students yet
                </p>
              </div>
            ) : (() => {
              // Filter assignments based on search query
              const filteredAssignments = assignments.filter((assignment) => {
                if (!searchQuery.trim()) return true;
                const query = searchQuery.toLowerCase();
                return (
                  assignment.student_name.toLowerCase().includes(query) ||
                  assignment.title.toLowerCase().includes(query) ||
                  (assignment.rubric_name && assignment.rubric_name.toLowerCase().includes(query))
                );
              });

              // Show "no matches" message if filter removed everything
              if (filteredAssignments.length === 0 && searchQuery.trim()) {
                return (
                  <div className="p-12 text-center">
                    <Search className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-500 mb-2">No matching assignments found</p>
                    <p className="text-sm text-gray-400">
                      Try searching by student name, assignment title, or rubric name
                    </p>
                  </div>
                );
              }

              // Render filtered assignments
              return filteredAssignments.map((assignment) => (
                <div
                  key={assignment.id}
                  onClick={() => {
                    if (assignment.has_rubric) {
                      handleSelectAssignment(assignment);
                    } else {
                      handleOpenRubricModal(assignment);
                    }
                  }}
                  className="p-4 cursor-pointer transition hover:bg-gray-50"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`p-2 rounded ${
                          assignment.has_rubric ? 'bg-emerald-100' : 'bg-gray-200'
                        }`}>
                          <FileText className={`w-4 h-4 ${
                            assignment.has_rubric ? 'text-emerald-600' : 'text-gray-500'
                          }`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-gray-900">{assignment.title}</h3>
                            {!assignment.has_rubric && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                                Needs Rubric
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500">
                            <span className="inline-flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {assignment.student_name}
                            </span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        {assignment.has_rubric ? (
                          <>
                            <div className="flex items-center gap-1">
                              <Award className="w-4 h-4" />
                              {assignment.rubric_name}
                            </div>
                            <div className="flex items-center gap-1">
                              <FileText className="w-4 h-4" />
                              {assignment.criteria.length} criteria
                            </div>
                            {assignment.existing_grades && assignment.existing_grades.length > 0 && (
                              <div className="flex items-center gap-1 text-emerald-600">
                                <CheckCircle className="w-4 h-4" />
                                Graded
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="flex items-center gap-1 text-amber-600">
                            <AlertCircle className="w-4 h-4" />
                            Attach a rubric to this assignment before grading
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ));
            })()}
          </div>
        </>
      )}

      {/* GRADING VIEW */}
      {!isLoading && selectedAssignment && (
        <div className="p-6">
          {/* Student & Assignment Info */}
          <div className="bg-gradient-to-r from-emerald-50 to-blue-50 rounded-lg p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-gray-600 mb-1">Student</p>
                <p className="font-semibold text-gray-900 text-lg">
                  {selectedAssignment.student_name}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Rubric</p>
                <p className="font-semibold text-gray-900 text-lg">
                  {selectedAssignment.rubric_name}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Score</p>
                <div className="flex items-baseline gap-3">
                  <span className={`text-3xl font-bold ${getGradeColor(totalPercentage).split(' ')[0]}`}>
                    {getLetterGrade(totalPercentage)}
                  </span>
                  <span className="text-xl font-semibold text-gray-700">
                    {totalPercentage.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Criteria Grading */}
          <div className="space-y-4 mb-6">
            {selectedAssignment.criteria.map((criterion, index) => {
              const criterionScore = scores[criterion.id] || { score: 0, comments: '' };
              const percentage = (criterionScore.score / criterion.max_score) * 100;

              return (
                <div
                  key={criterion.id}
                  className="border border-gray-200 rounded-lg p-5 hover:border-emerald-300 transition"
                >
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="flex items-center justify-center w-8 h-8 bg-emerald-100 text-emerald-700 font-bold rounded-full text-sm">
                          {index + 1}
                        </span>
                        <h4 className="font-semibold text-gray-900 text-lg">{criterion.name}</h4>
                      </div>
                      {criterion.description && (
                        <p className="text-sm text-gray-600 ml-11">{criterion.description}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500 mb-1">Weight</p>
                      <p className="text-lg font-semibold text-emerald-600">{criterion.weight}%</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-11">
                    {/* Score Input */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Score *
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          max={criterion.max_score}
                          value={criterionScore.score}
                          onChange={(e) =>
                            updateScore(criterion.id, parseFloat(e.target.value) || 0)
                          }
                          className="w-full px-4 py-3 pr-24 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-lg font-semibold"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                          / {criterion.max_score}
                        </span>
                      </div>
                      <p className={`mt-2 text-sm font-medium ${getGradeColor(percentage)}`}>
                        {percentage.toFixed(1)}% • {getLetterGrade(percentage)} Grade
                      </p>
                    </div>

                    {/* Comments Input */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <MessageSquare className="w-4 h-4 inline mr-1" />
                        Comments (Optional)
                      </label>
                      <textarea
                        value={criterionScore.comments}
                        onChange={(e) => updateComments(criterion.id, e.target.value)}
                        placeholder="Add feedback for the student..."
                        rows={3}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                        maxLength={500}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Save Button */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200">
            <button
              onClick={() => {
                setSelectedAssignment(null);
                setScores({});
                setError(null);
                setSuccessMessage(null);
              }}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              onClick={handleSaveGrades}
              disabled={isSaving}
              className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium"
            >
              {isSaving ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Save Grades
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* RUBRIC ATTACHMENT MODAL */}
      {showRubricModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="border-b border-gray-200 p-6 flex items-center justify-between sticky top-0 bg-white">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Attach Rubric</h3>
                <p className="text-sm text-gray-500 mt-1">
                  {assignmentToAttach?.title} • {assignmentToAttach?.student_name}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowRubricModal(false);
                  setAssignmentToAttach(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              {availableRubrics.length === 0 ? (
                <div className="text-center py-8">
                  <Award className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500 mb-2">No rubrics available</p>
                  <p className="text-sm text-gray-400">
                    Create a rubric first from the Rubrics tab
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {availableRubrics.map((rubric) => (
                    <div
                      key={rubric.id}
                      onClick={() => !isAttaching && handleAttachRubric(rubric.id)}
                      className="border border-gray-200 rounded-lg p-4 cursor-pointer hover:border-emerald-500 hover:bg-emerald-50 transition"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">{rubric.name}</h4>
                          {rubric.description && (
                            <p className="text-sm text-gray-600 mt-1">{rubric.description}</p>
                          )}
                          <p className="text-sm text-gray-500 mt-2">
                            {rubric.total_criteria} criteria
                          </p>
                        </div>
                        <Link className="w-5 h-5 text-emerald-600" />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {isAttaching && (
                <div className="mt-4 p-4 bg-emerald-50 rounded-lg flex items-center gap-3">
                  <Loader className="w-5 h-5 text-emerald-600 animate-spin" />
                  <p className="text-emerald-700">Attaching rubric...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
