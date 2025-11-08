'use client';

import {
  Target, Award, Clock, TrendingUp, Calendar,
  CheckCircle, FileText, BookOpen, BarChart, BookMarked
} from 'lucide-react';

interface ProgressSectionProps {
  progressData: any;
  isLoading: boolean;
  assignments: any[];
  homeworkData: any[];
  studentId: string;
}

export default function ProgressSection({
  progressData,
  isLoading,
  assignments,
  homeworkData,
  studentId
}: ProgressSectionProps) {

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading your progress...</p>
        </div>
      </div>
    );
  }

  // DEBUG: Enhanced logging to see actual data
  console.log('📋 ASSIGNMENTS DEBUG - DETAILED:', {
    total: assignments?.length || 0,
    statuses: assignments?.map((a: any) => ({
      title: a.title,
      status: a.status,
      isCompleted: a.status === 'completed' || a.status === 'reviewed'
    })),
    byStatus: {
      completed: assignments?.filter((a: any) => a.status === 'completed').length || 0,
      reviewed: assignments?.filter((a: any) => a.status === 'reviewed').length || 0,
      submitted: assignments?.filter((a: any) => a.status === 'submitted').length || 0,
      assigned: assignments?.filter((a: any) => a.status === 'assigned').length || 0,
      viewed: assignments?.filter((a: any) => a.status === 'viewed').length || 0,
    }
  });

  // Calculate assignments/homework stats - CHECK FOR 'reviewed' STATUS TOO
  const totalAssignments = assignments?.length || 0;
  const completedAssignments = assignments?.filter((a: any) =>
    a.status === 'completed' || a.status === 'reviewed'
  ).length || 0;
  const pendingAssignments = totalAssignments - completedAssignments;

  console.log('📊 ASSIGNMENTS CALCULATION:', {
    total: totalAssignments,
    completed: completedAssignments,
    pending: pendingAssignments,
    completionRate: totalAssignments > 0 ? Math.round((completedAssignments / totalAssignments) * 100) + '%' : '0%'
  });

  const totalHomework = homeworkData?.length || 0;
  const completedHomework = homeworkData?.filter((h: any) => h.status === 'completed').length || 0;
  const pendingHomework = totalHomework - completedHomework;

  // Calculate overall progress percentage from REAL target progress values
  const overallProgress = progressData?.targets && progressData.targets.length > 0
    ? Math.round(progressData.targets.reduce((acc: number, t: any) => acc + (t.progress || 0), 0) / progressData.targets.length)
    : 0;

  // DEBUG: Enhanced progress logging
  console.log('📈 TARGET PROGRESS - DETAILED:', {
    hasTargets: !!progressData?.targets,
    targetCount: progressData?.targets?.length || 0,
    targets: progressData?.targets?.map((t: any) => ({
      title: t.title,
      progress: t.progress,
      status: t.status
    })),
    totalProgress: progressData?.targets?.reduce((acc: number, t: any) => acc + (t.progress || 0), 0),
    averageProgress: overallProgress + '%'
  });

  return (
    <div className="space-y-6">
      {/* Progress Overview Header */}
      <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-2xl p-8 text-white shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-3xl font-bold mb-2">My Learning Progress</h2>
            <p className="text-indigo-100">Track your Quran learning journey and achievements</p>
          </div>
          <div className="text-right">
            <div className="text-4xl font-bold">{overallProgress}%</div>
            <p className="text-indigo-100 text-sm">Overall Progress</p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white bg-opacity-20 backdrop-blur rounded-xl p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Target className="w-5 h-5" />
              <span className="text-sm">Active Targets</span>
            </div>
            <p className="text-2xl font-bold">{progressData?.stats?.active_targets || 0}</p>
          </div>
          <div className="bg-white bg-opacity-20 backdrop-blur rounded-xl p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Award className="w-5 h-5" />
              <span className="text-sm">Milestones</span>
            </div>
            <p className="text-2xl font-bold">
              {progressData?.stats?.completed_milestones || 0} / {progressData?.stats?.total_milestones || 0}
            </p>
          </div>
          <div className="bg-white bg-opacity-20 backdrop-blur rounded-xl p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Clock className="w-5 h-5" />
              <span className="text-sm">Total Study</span>
            </div>
            <p className="text-2xl font-bold">{progressData?.stats?.total_study_hours || 0}h</p>
          </div>
          <div className="bg-white bg-opacity-20 backdrop-blur rounded-xl p-4">
            <div className="flex items-center space-x-2 mb-2">
              <TrendingUp className="w-5 h-5" />
              <span className="text-sm">Streak</span>
            </div>
            <p className="text-2xl font-bold">{progressData?.stats?.current_streak || 0} days</p>
          </div>
        </div>
      </div>

      {/* Assignments & Homework Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Assignments */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold mb-4 flex items-center">
            <FileText className="w-6 h-6 mr-2 text-purple-600" />
            Assignments
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
                  {totalAssignments}
                </div>
                <div>
                  <p className="font-semibold text-gray-700">Total Assignments</p>
                  <p className="text-sm text-gray-500">All time</p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-green-50 rounded-lg">
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-green-600">{completedAssignments}</p>
              </div>
              <div className="p-3 bg-orange-50 rounded-lg">
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-orange-600">{pendingAssignments}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Homework */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold mb-4 flex items-center">
            <BookOpen className="w-6 h-6 mr-2 text-blue-600" />
            Homework
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
                  {totalHomework}
                </div>
                <div>
                  <p className="font-semibold text-gray-700">Total Homework</p>
                  <p className="text-sm text-gray-500">All time</p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-green-50 rounded-lg">
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-green-600">{completedHomework}</p>
              </div>
              <div className="p-3 bg-orange-50 rounded-lg">
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-orange-600">{pendingHomework}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Attendance Statistics */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-bold mb-6 flex items-center">
          <Calendar className="w-6 h-6 mr-2 text-blue-600" />
          Attendance Overview
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Overall Attendance */}
          <div className="text-center">
            <div className="relative w-28 h-28 mx-auto">
              <svg width="112" height="112" className="transform -rotate-90">
                <circle cx="56" cy="56" r="48" stroke="#e5e7eb" strokeWidth="10" fill="none" />
                <circle
                  cx="56" cy="56" r="48"
                  stroke="#10b981"
                  strokeWidth="10"
                  fill="none"
                  strokeDasharray={`${(progressData?.attendance?.attendance_percentage || 0) * 3.01} 301`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div>
                  <span className="text-2xl font-bold">{progressData?.attendance?.attendance_percentage || 0}%</span>
                  <p className="text-xs text-gray-600">Overall</p>
                </div>
              </div>
            </div>
            <p className="mt-3 text-sm text-gray-600 font-medium">Attendance Rate</p>
            <p className="text-xs text-gray-500 mt-1">({progressData?.attendance?.total_sessions || 0} sessions)</p>
          </div>

          {/* Breakdown */}
          <div className="col-span-3 space-y-3">
            <h4 className="font-semibold text-gray-700">Breakdown</h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <span className="text-sm text-gray-600">Present</span>
                <span className="font-semibold text-green-600">{progressData?.attendance?.present || 0} days</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                <span className="text-sm text-gray-600">Late</span>
                <span className="font-semibold text-yellow-600">{progressData?.attendance?.late || 0} days</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <span className="text-sm text-gray-600">Absent</span>
                <span className="font-semibold text-red-600">{progressData?.attendance?.absent || 0} days</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <span className="text-sm text-gray-600">Excused</span>
                <span className="font-semibold text-blue-600">{progressData?.attendance?.excused || 0} days</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Study Time */}
      {progressData?.study_time?.weekly && progressData.study_time.weekly.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <BarChart className="w-5 h-5 mr-2 text-indigo-600" />
            Weekly Study Time
          </h3>
          <div className="space-y-3">
            {progressData.study_time.weekly.map((week: any) => (
              <div key={week.week_start} className="p-4 bg-indigo-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm text-gray-700">Week of {new Date(week.week_start).toLocaleDateString()}</span>
                  <span className="text-sm text-indigo-600 font-semibold">{week.total_minutes} minutes</span>
                </div>
                <div className="bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-indigo-500 h-2 rounded-full transition-all"
                    style={{ width: `${Math.min((week.total_minutes / 300) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">This Month Total:</span>
              <span className="font-semibold">{progressData.study_time.total_minutes_this_month} minutes ({Math.round(progressData.study_time.total_minutes_this_month / 60)} hours)</span>
            </div>
            <div className="flex justify-between text-sm mt-2">
              <span className="text-gray-600">Daily Average:</span>
              <span className="font-semibold">{progressData.study_time.average_daily_minutes} minutes/day</span>
            </div>
          </div>
        </div>
      )}

      {/* Learning Targets */}
      <div>
        <h3 className="text-xl font-bold mb-4 flex items-center">
          <Target className="w-6 h-6 mr-2 text-indigo-600" />
          My Learning Targets
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {progressData?.targets && progressData.targets.length > 0 ? (
            progressData.targets.map((target: any) => (
              <div key={target.id} className="bg-white rounded-xl shadow-lg overflow-hidden">
                {/* Target Header */}
                <div className="p-6 bg-gradient-to-r from-indigo-500 to-purple-500 text-white">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="text-xl font-bold mb-2">{target.title}</h4>
                      <p className="text-white text-opacity-90 text-sm">{target.description}</p>
                    </div>
                    <div className="text-right ml-4">
                      <div className="text-3xl font-bold">{target.progress || 0}%</div>
                      <p className="text-xs text-white text-opacity-80">Complete</p>
                    </div>
                  </div>
                  {/* Progress Bar */}
                  <div className="mt-4">
                    <div className="w-full bg-white bg-opacity-30 rounded-full h-3">
                      <div
                        className="bg-white h-3 rounded-full transition-all duration-500"
                        style={{ width: `${target.progress || 0}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Milestones */}
                <div className="p-6">
                  {target.milestones && target.milestones.length > 0 && (
                    <div>
                      <h5 className="font-semibold text-sm mb-3 flex items-center">
                        <Award className="w-4 h-4 mr-2 text-indigo-600" />
                        Milestones ({target.milestones.filter((m: any) => m.completed).length}/{target.milestones.length})
                      </h5>
                      <div className="space-y-2">
                        {target.milestones.map((milestone: any) => (
                          <div
                            key={milestone.id}
                            className={`flex items-center space-x-3 p-3 rounded-lg border ${
                              milestone.completed
                                ? 'bg-green-50 border-green-200'
                                : 'bg-gray-50 border-gray-200'
                            }`}
                          >
                            {milestone.completed ? (
                              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                            ) : (
                              <div className="w-5 h-5 border-2 border-gray-400 rounded-full flex-shrink-0" />
                            )}
                            <span className={`text-sm flex-1 ${
                              milestone.completed ? 'text-green-700 font-medium' : 'text-gray-600'
                            }`}>
                              {milestone.title}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Target Dates */}
                  {(target.start_date || target.due_date) && (
                    <div className="mt-4 pt-4 border-t">
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        {target.start_date && <span>Started: {new Date(target.start_date).toLocaleDateString()}</span>}
                        {target.due_date && <span className="font-medium">Due: {new Date(target.due_date).toLocaleDateString()}</span>}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-2 text-center py-12 bg-white rounded-xl shadow-lg">
              <Target className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h4 className="text-lg font-semibold text-gray-700 mb-2">No Active Targets</h4>
              <p className="text-gray-500">Your teacher hasn't assigned any learning targets yet.</p>
            </div>
          )}
        </div>
      </div>

      {/* Mastery Overview - NEW SECTION */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-bold mb-6 flex items-center">
          <BookMarked className="w-6 h-6 mr-2 text-emerald-600" />
          Qur'an Mastery Progress
        </h3>

        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-lg p-6 border border-emerald-200">
          <p className="text-gray-700 mb-4">
            Track your mastery progress for each ayah across different surahs. The Mastery tab provides a detailed view of your memorization and recitation skills.
          </p>
          <a
            href="#mastery"
            onClick={(e) => {
              e.preventDefault();
              // This will be handled by the parent component to switch tabs
              const masteryTab = document.querySelector('[data-tab="mastery"]') as HTMLElement;
              if (masteryTab) masteryTab.click();
            }}
            className="inline-flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            <BookMarked className="w-4 h-4 mr-2" />
            View Detailed Mastery Progress
          </a>
        </div>
      </div>
    </div>
  );
}
