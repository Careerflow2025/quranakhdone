'use client';

import { useState, useEffect } from 'react';
import { useMastery, UpdateMasteryData } from '@/hooks/useMastery';
import {
  BookOpen, ChevronLeft, ChevronRight, TrendingUp, Target,
  Award, Loader, AlertCircle, X, Check, RefreshCw,
} from 'lucide-react';
import {
  MasteryLevel,
  getMasteryLevelColor,
  getMasteryLevelLabel,
  SURAH_INFO,
  getSurahName,
  getAyahCount,
} from '@/lib/types/mastery';

interface MasteryPanelProps {
  userRole?: 'owner' | 'admin' | 'teacher' | 'student' | 'parent';
  studentId?: string; // Required for student/parent dashboards, optional for teachers
}

export default function MasteryPanel({ userRole = 'teacher', studentId }: MasteryPanelProps) {
  // Hook integration
  const {
    isLoading,
    error,
    studentOverview,
    currentSurahHeatmap,
    selectedSurah,
    selectedStudent,
    isSubmitting,
    fetchStudentMastery,
    fetchSurahHeatmap,
    updateAyahMastery,
    changeSurah,
    navigatePreviousSurah,
    navigateNextSurah,
    changeStudent,
    refreshData,
  } = useMastery(studentId);

  // UI State
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [selectedAyahForUpdate, setSelectedAyahForUpdate] = useState<{
    ayah_id: string;
    ayah_number: number;
    current_level: MasteryLevel;
    ayah_text?: string;
  } | null>(null);
  const [newMasteryLevel, setNewMasteryLevel] = useState<MasteryLevel>('unknown');

  // Initialize student if provided
  useEffect(() => {
    if (studentId && studentId !== selectedStudent) {
      changeStudent(studentId);
    }
  }, [studentId, selectedStudent, changeStudent]);

  // Handle ayah click - teachers can update, students/parents view-only
  const handleAyahClick = (
    ayah_id: string,
    ayah_number: number,
    current_level: MasteryLevel,
    ayah_text?: string
  ) => {
    if (userRole === 'teacher' || userRole === 'admin' || userRole === 'owner') {
      setSelectedAyahForUpdate({ ayah_id, ayah_number, current_level, ayah_text });
      setNewMasteryLevel(current_level);
      setShowUpdateModal(true);
    }
  };

  // Handle mastery level update
  const handleUpdateMastery = async () => {
    if (!selectedAyahForUpdate || !studentOverview) return;

    const success = await updateAyahMastery({
      student_id: studentOverview.student_id,
      script_id: studentOverview.script_id,
      ayah_id: selectedAyahForUpdate.ayah_id,
      level: newMasteryLevel,
    });

    if (success) {
      setShowUpdateModal(false);
      setSelectedAyahForUpdate(null);
    }
  };

  // Get mastery level badge style
  const getMasteryBadgeStyle = (level: MasteryLevel) => {
    const baseStyle = 'px-3 py-1 rounded-full text-xs font-medium';
    const colorMap: Record<MasteryLevel, string> = {
      unknown: 'bg-gray-200 text-gray-700',
      learning: 'bg-yellow-200 text-yellow-800',
      proficient: 'bg-orange-200 text-orange-800',
      mastered: 'bg-green-200 text-green-800',
    };
    return `${baseStyle} ${colorMap[level]}`;
  };

  // Get progress bar color
  const getProgressBarColor = (percentage: number) => {
    if (percentage >= 75) return 'bg-green-500';
    if (percentage >= 50) return 'bg-orange-500';
    if (percentage >= 25) return 'bg-yellow-500';
    return 'bg-gray-400';
  };

  // Loading state
  if (isLoading && !studentOverview) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-3" />
          <p className="text-gray-600">Loading mastery data...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <p className="text-red-600 font-medium mb-2">Error loading mastery data</p>
          <p className="text-gray-600 text-sm mb-4">{error}</p>
          <button
            onClick={refreshData}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors inline-flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  // No student selected state
  if (!studentOverview) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No student selected</p>
        </div>
      </div>
    );
  }

  const summary = studentOverview.mastery_summary;
  const surahName = getSurahName(selectedSurah);
  const totalAyahsInSurah = getAyahCount(selectedSurah);

  return (
    <div className="bg-white rounded-lg shadow-sm">
      {/* HEADER */}
      <div className="border-b border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <BookOpen className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Mastery Tracking</h2>
              <p className="text-sm text-gray-500">{studentOverview.student_name}</p>
            </div>
          </div>

          <button
            onClick={refreshData}
            disabled={isLoading}
            className="p-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* PROGRESS OVERVIEW */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          {/* Mastered */}
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Award className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium text-green-900">Mastered</span>
            </div>
            <div className="text-2xl font-bold text-green-700">
              {summary.mastered_count}
            </div>
            <div className="text-xs text-green-600">
              {summary.mastered_percentage.toFixed(1)}%
            </div>
          </div>

          {/* Proficient */}
          <div className="bg-orange-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-orange-600" />
              <span className="text-sm font-medium text-orange-900">Proficient</span>
            </div>
            <div className="text-2xl font-bold text-orange-700">
              {summary.proficient_count}
            </div>
            <div className="text-xs text-orange-600">
              {summary.proficient_percentage.toFixed(1)}%
            </div>
          </div>

          {/* Learning */}
          <div className="bg-yellow-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-5 h-5 text-yellow-600" />
              <span className="text-sm font-medium text-yellow-900">Learning</span>
            </div>
            <div className="text-2xl font-bold text-yellow-700">
              {summary.learning_count}
            </div>
            <div className="text-xs text-yellow-600">
              {summary.learning_percentage.toFixed(1)}%
            </div>
          </div>

          {/* Overall Progress */}
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Award className="w-5 h-5 text-purple-600" />
              <span className="text-sm font-medium text-purple-900">Overall Progress</span>
            </div>
            <div className="text-2xl font-bold text-purple-700">
              {summary.overall_progress_percentage.toFixed(1)}%
            </div>
            <div className="text-xs text-purple-600">
              {summary.proficient_count + summary.mastered_count} of {summary.total_count} ayahs
            </div>
          </div>
        </div>

        {/* PROGRESS BAR */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Total Progress</span>
            <span className="text-sm text-gray-600">
              {summary.proficient_count + summary.mastered_count} / {summary.total_count} ayahs
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all duration-300 ${getProgressBarColor(
                summary.overall_progress_percentage
              )}`}
              style={{ width: `${summary.overall_progress_percentage}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* SURAH NAVIGATION */}
      <div className="border-b border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={navigatePreviousSurah}
              className="p-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
              title="Previous Surah"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <select
              value={selectedSurah}
              onChange={(e) => changeSurah(parseInt(e.target.value))}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              {Array.from({ length: 114 }, (_, i) => i + 1).map((surahNum) => {
                const info = SURAH_INFO[surahNum];
                return (
                  <option key={surahNum} value={surahNum}>
                    {surahNum}. {info?.name_arabic || `Surah ${surahNum}`} ({info?.ayah_count || 0} ayahs)
                  </option>
                );
              })}
            </select>

            <button
              onClick={navigateNextSurah}
              className="p-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
              title="Next Surah"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <div className="text-sm text-gray-600">
            {currentSurahHeatmap ? (
              <>
                {currentSurahHeatmap.summary.mastered_count +
                  currentSurahHeatmap.summary.proficient_count}{' '}
                / {currentSurahHeatmap.total_ayahs} ayahs completed
              </>
            ) : (
              'Loading surah data...'
            )}
          </div>
        </div>
      </div>

      {/* SURAH HEATMAP */}
      <div className="p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            {surahName}
          </h3>
          <p className="text-sm text-gray-500">
            {totalAyahsInSurah} ayahs •{' '}
            {userRole === 'teacher' || userRole === 'admin' || userRole === 'owner'
              ? 'Click an ayah to update mastery level'
              : 'View mastery levels'}
          </p>
        </div>

        {/* Mastery Level Legend */}
        <div className="flex items-center gap-4 mb-4 pb-4 border-b border-gray-200">
          <span className="text-sm font-medium text-gray-700">Legend:</span>
          {(['unknown', 'learning', 'proficient', 'mastered'] as MasteryLevel[]).map((level) => (
            <div key={level} className="flex items-center gap-2">
              <div
                className="w-6 h-6 rounded-md border border-gray-300"
                style={{ backgroundColor: getMasteryLevelColor(level) }}
              ></div>
              <span className="text-sm text-gray-600 capitalize">
                {getMasteryLevelLabel(level)}
              </span>
            </div>
          ))}
        </div>

        {/* Heatmap Grid */}
        {currentSurahHeatmap ? (
          <div className="grid grid-cols-5 sm:grid-cols-10 md:grid-cols-15 lg:grid-cols-20 gap-1">
            {currentSurahHeatmap.mastery_by_ayah.map((ayahEntry) => (
              <div
                key={ayahEntry.ayah_id}
                onClick={() =>
                  handleAyahClick(
                    ayahEntry.ayah_id,
                    ayahEntry.ayah_number,
                    ayahEntry.level,
                    ayahEntry.ayah_text
                  )
                }
                className={`relative group ${
                  userRole === 'teacher' || userRole === 'admin' || userRole === 'owner'
                    ? 'cursor-pointer hover:scale-110 hover:z-10 transition-transform'
                    : 'cursor-default'
                }`}
                title={`Ayah ${ayahEntry.ayah_number}: ${getMasteryLevelLabel(ayahEntry.level)}`}
              >
                <div
                  className="w-8 h-8 sm:w-10 sm:h-10 rounded-md border-2 border-gray-300 flex items-center justify-center text-xs font-medium transition-all"
                  style={{
                    backgroundColor: getMasteryLevelColor(ayahEntry.level),
                    color: ayahEntry.level === 'unknown' ? '#374151' : '#FFFFFF',
                  }}
                >
                  {ayahEntry.ayah_number}
                </div>

                {/* Tooltip on hover */}
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-20">
                  Ayah {ayahEntry.ayah_number}: {getMasteryLevelLabel(ayahEntry.level)}
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Loader className="w-8 h-8 text-purple-600 animate-spin mx-auto mb-3" />
            <p className="text-gray-600">Loading surah heatmap...</p>
          </div>
        )}
      </div>

      {/* SURAH PROGRESS BY LEVEL */}
      {currentSurahHeatmap && (
        <div className="border-t border-gray-200 p-6">
          <h4 className="text-sm font-semibold text-gray-900 mb-3">
            Surah {selectedSurah} Progress Breakdown
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-700">
                {currentSurahHeatmap.summary.mastered_count}
              </div>
              <div className="text-xs text-gray-600">Mastered</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-700">
                {currentSurahHeatmap.summary.proficient_count}
              </div>
              <div className="text-xs text-gray-600">Proficient</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-700">
                {currentSurahHeatmap.summary.learning_count}
              </div>
              <div className="text-xs text-gray-600">Learning</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-700">
                {currentSurahHeatmap.summary.unknown_count}
              </div>
              <div className="text-xs text-gray-600">Unknown</div>
            </div>
          </div>
        </div>
      )}

      {/* UPDATE MASTERY MODAL */}
      {showUpdateModal && selectedAyahForUpdate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">
                Update Mastery Level
              </h3>
              <button
                onClick={() => setShowUpdateModal(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-1">
                  Surah {selectedSurah}, Ayah {selectedAyahForUpdate.ayah_number}
                </p>
                <p className="text-sm font-medium text-gray-900">
                  Current Level:{' '}
                  <span className={getMasteryBadgeStyle(selectedAyahForUpdate.current_level)}>
                    {getMasteryLevelLabel(selectedAyahForUpdate.current_level)}
                  </span>
                </p>
              </div>

              {/* Mastery Level Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Select New Mastery Level
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {(['unknown', 'learning', 'proficient', 'mastered'] as MasteryLevel[]).map(
                    (level) => (
                      <button
                        key={level}
                        onClick={() => setNewMasteryLevel(level)}
                        className={`relative p-4 rounded-lg border-2 transition-all ${
                          newMasteryLevel === level
                            ? 'border-purple-600 bg-purple-50'
                            : 'border-gray-300 hover:border-purple-300'
                        }`}
                      >
                        {newMasteryLevel === level && (
                          <div className="absolute top-2 right-2">
                            <Check className="w-5 h-5 text-purple-600" />
                          </div>
                        )}
                        <div
                          className="w-full h-8 rounded-md mb-2"
                          style={{ backgroundColor: getMasteryLevelColor(level) }}
                        ></div>
                        <div className="text-sm font-medium text-gray-900 capitalize">
                          {getMasteryLevelLabel(level)}
                        </div>
                      </button>
                    )
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
              <button
                onClick={() => setShowUpdateModal(false)}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateMastery}
                disabled={isSubmitting || newMasteryLevel === selectedAyahForUpdate.current_level}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Update Level
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
