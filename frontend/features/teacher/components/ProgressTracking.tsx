'use client';

import { TrendingUp, BarChart3, Target, Award, Calendar, Users } from 'lucide-react';

export default function ProgressTracking() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <TrendingUp className="h-8 w-8 text-emerald-600" />
          <h1 className="text-2xl font-bold text-gray-900">Progress Tracking</h1>
        </div>
        <div className="flex items-center gap-2">
          <select className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500">
            <option>All Students</option>
            <option>Class 1</option>
            <option>Class 2</option>
          </select>
          <select className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500">
            <option>This Month</option>
            <option>Last Month</option>
            <option>This Year</option>
          </select>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <div className="flex items-center gap-3">
            <Users className="h-8 w-8 text-blue-600" />
            <div>
              <p className="text-sm font-medium text-gray-600">Active Students</p>
              <p className="text-2xl font-bold text-gray-900">0</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <div className="flex items-center gap-3">
            <Target className="h-8 w-8 text-green-600" />
            <div>
              <p className="text-sm font-medium text-gray-600">Goals Achieved</p>
              <p className="text-2xl font-bold text-gray-900">0</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <div className="flex items-center gap-3">
            <Award className="h-8 w-8 text-yellow-600" />
            <div>
              <p className="text-sm font-medium text-gray-600">Completions</p>
              <p className="text-2xl font-bold text-gray-900">0</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <div className="flex items-center gap-3">
            <Calendar className="h-8 w-8 text-purple-600" />
            <div>
              <p className="text-sm font-medium text-gray-600">Study Hours</p>
              <p className="text-2xl font-bold text-gray-900">0</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Progress Overview</h3>
          <div className="flex items-center justify-center h-48 text-gray-400">
            <BarChart3 className="h-16 w-16" />
          </div>
          <p className="text-center text-sm text-gray-500 mt-4">
            Charts will appear here when students have progress data
          </p>
        </div>
        
        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Achievements</h3>
          <div className="flex items-center justify-center h-48 text-gray-400">
            <Award className="h-16 w-16" />
          </div>
          <p className="text-center text-sm text-gray-500 mt-4">
            Student achievements will be displayed here
          </p>
        </div>
      </div>

      {/* Empty State */}
      <div className="bg-white rounded-lg border shadow-sm p-12 text-center">
        <TrendingUp className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No progress data available</h3>
        <p className="text-gray-500 mb-6">
          Start tracking your students' progress by creating assignments and recording their achievements.
        </p>
      </div>
    </div>
  );
}