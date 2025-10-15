'use client';

import { Users, UserPlus, Search, Filter } from 'lucide-react';

export default function StudentManagement() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="h-8 w-8 text-emerald-600" />
          <h1 className="text-2xl font-bold text-gray-900">Student Management</h1>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors">
          <UserPlus className="h-4 w-4" />
          Add Student
        </button>
      </div>

      {/* Search and Filter Bar */}
      <div className="flex items-center gap-4 p-4 bg-white rounded-lg border shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search students..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
          <Filter className="h-4 w-4" />
          Filter
        </button>
      </div>

      {/* Empty State */}
      <div className="bg-white rounded-lg border shadow-sm p-12 text-center">
        <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No students yet</h3>
        <p className="text-gray-500 mb-6">
          Start by adding students to your classes to manage their progress and assignments.
        </p>
        <button className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors mx-auto">
          <UserPlus className="h-4 w-4" />
          Add Your First Student
        </button>
      </div>
    </div>
  );
}