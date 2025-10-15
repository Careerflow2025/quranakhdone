'use client';

import { Calendar, Clock, Plus, ChevronLeft, ChevronRight } from 'lucide-react';

export default function TeacherSchedule() {
  const currentDate = new Date();
  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Calendar className="h-8 w-8 text-emerald-600" />
          <h1 className="text-2xl font-bold text-gray-900">Teaching Schedule</h1>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors">
          <Plus className="h-4 w-4" />
          Add Session
        </button>
      </div>

      {/* Schedule Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <div className="flex items-center gap-3">
            <Calendar className="h-8 w-8 text-blue-600" />
            <div>
              <p className="text-sm font-medium text-gray-600">This Week</p>
              <p className="text-2xl font-bold text-gray-900">0</p>
              <p className="text-xs text-gray-500">sessions</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <div className="flex items-center gap-3">
            <Clock className="h-8 w-8 text-green-600" />
            <div>
              <p className="text-sm font-medium text-gray-600">Hours This Week</p>
              <p className="text-2xl font-bold text-gray-900">0</p>
              <p className="text-xs text-gray-500">hours</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <div className="flex items-center gap-3">
            <Calendar className="h-8 w-8 text-orange-600" />
            <div>
              <p className="text-sm font-medium text-gray-600">Upcoming</p>
              <p className="text-2xl font-bold text-gray-900">0</p>
              <p className="text-xs text-gray-500">sessions</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <div className="flex items-center gap-3">
            <Clock className="h-8 w-8 text-purple-600" />
            <div>
              <p className="text-sm font-medium text-gray-600">Total This Month</p>
              <p className="text-2xl font-bold text-gray-900">0</p>
              <p className="text-xs text-gray-500">hours</p>
            </div>
          </div>
        </div>
      </div>

      {/* Calendar Header */}
      <div className="bg-white rounded-lg border shadow-sm">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-medium text-gray-900">{monthName}</h3>
          <div className="flex items-center gap-2">
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button className="px-3 py-1 text-sm bg-emerald-100 text-emerald-700 rounded-lg">
              Today
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="p-4">
          <div className="grid grid-cols-7 gap-1 mb-4">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
                {day}
              </div>
            ))}
          </div>
          
          {/* Calendar Days Placeholder */}
          <div className="grid grid-cols-7 gap-1 h-64">
            {Array.from({ length: 35 }, (_, i) => (
              <div
                key={i}
                className="border border-gray-100 rounded p-2 min-h-16 hover:bg-gray-50 transition-colors"
              >
                <span className="text-sm text-gray-400">{i + 1}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Empty State for Sessions */}
      <div className="bg-white rounded-lg border shadow-sm p-12 text-center">
        <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No sessions scheduled</h3>
        <p className="text-gray-500 mb-6">
          Schedule your first teaching session to start organizing your time and classes.
        </p>
        <button className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors mx-auto">
          <Plus className="h-4 w-4" />
          Schedule Your First Session
        </button>
      </div>
    </div>
  );
}