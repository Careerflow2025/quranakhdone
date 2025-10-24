'use client';

import { useState } from 'react';
import { useCalendar } from '@/hooks/useCalendar';
import { Calendar, ChevronLeft, ChevronRight, Plus, Clock, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function CalendarSection() {
  const {
    events,
    isLoading,
    currentDate,
    navigateToDate,
    navigateMonth,
    refreshEvents,
  } = useCalendar('month');

  const [showAddEvent, setShowAddEvent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    event_type: 'class_session',
    date: '',
    start_time: '',
    end_time: '',
    all_day: false,
    description: '',
  });

  // Get calendar month data
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  // Get first day of month and days in month
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Get events for specific day
  const getEventsForDay = (day: number) => {
    if (!events) return [];

    return events.filter(event => {
      const eventDate = new Date(event.start_date);
      return (
        eventDate.getDate() === day &&
        eventDate.getMonth() === month &&
        eventDate.getFullYear() === year
      );
    });
  };

  // Get upcoming events (next 7 days from today)
  const upcomingEvents = events ? events.filter(event => {
    const eventDate = new Date(event.start_date);
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);
    return eventDate >= today && eventDate <= nextWeek;
  }).slice(0, 5) : [];

  // Check if day is today
  const isToday = (day: number) => {
    const today = new Date();
    return (
      day === today.getDate() &&
      month === today.getMonth() &&
      year === today.getFullYear()
    );
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Combine date and time (SAME date for both start and end)
      const startDateTime = formData.all_day
        ? `${formData.date}T00:00:00`
        : `${formData.date}T${formData.start_time}:00`;

      const endDateTime = formData.all_day
        ? `${formData.date}T23:59:59`
        : `${formData.date}T${formData.end_time || formData.start_time}:00`;

      // Create event via API (auth handled by server-side cookies)
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: formData.title,
          event_type: formData.event_type,
          start_date: startDateTime,
          end_date: endDateTime,
          all_day: formData.all_day,
          description: formData.description,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create event');
      }

      // Success! Reset form and close modal
      setFormData({
        title: '',
        event_type: 'class_session',
        date: '',
        start_time: '',
        end_time: '',
        all_day: false,
        description: '',
      });
      setShowAddEvent(false);

      // Refresh calendar to show new event
      if (refreshEvents) {
        refreshEvents();
      }

      alert('Event created successfully!');
    } catch (error: any) {
      console.error('Error creating event:', error);
      alert('Failed to create event: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Calendar Header */}
      <div className="bg-white rounded-xl border p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">School Calendar</h2>
          <button
            onClick={() => setShowAddEvent(true)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
          >
            <Plus className="w-4 h-4" />
            Add Event
          </button>
        </div>

        {/* Month Navigation */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigateMonth('prev')}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h3 className="text-lg font-semibold">{monthName}</h3>
          <button
            onClick={() => navigateMonth('next')}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {/* Day headers */}
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
              {day}
            </div>
          ))}

          {/* Empty cells for days before month starts */}
          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`empty-${i}`} className="h-24 bg-gray-50 rounded-lg" />
          ))}

          {/* Days of month */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dayEvents = getEventsForDay(day);
            const today = isToday(day);

            return (
              <div
                key={day}
                className={`h-24 border rounded-lg p-2 overflow-y-auto ${
                  today ? 'bg-blue-50 border-blue-300' : 'bg-white hover:bg-gray-50'
                } cursor-pointer transition-colors`}
                onClick={() => navigateToDate(new Date(year, month, day))}
              >
                <div className={`text-sm font-medium mb-1 ${today ? 'text-blue-600' : 'text-gray-900'}`}>
                  {day}
                </div>
                <div className="space-y-1">
                  {dayEvents.map(event => (
                    <div
                      key={event.id}
                      className="text-xs px-1 py-0.5 rounded truncate"
                      style={{
                        backgroundColor: event.color || '#3B82F6',
                        color: 'white'
                      }}
                      title={event.title}
                    >
                      {event.title}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <div className="text-gray-500">Loading events...</div>
          </div>
        )}
      </div>

      {/* Upcoming Events List */}
      <div className="bg-white rounded-xl border p-6">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-5 h-5 text-emerald-600" />
          <h3 className="text-lg font-semibold text-gray-900">Upcoming Events</h3>
        </div>

        <div className="space-y-3">
          {upcomingEvents.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No upcoming events</p>
          ) : (
            upcomingEvents.map(event => (
              <div
                key={event.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: event.color || '#3B82F6' }}
                  />
                  <div>
                    <p className="font-medium text-gray-900">{event.title}</p>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Clock className="w-4 h-4" />
                      <span>
                        {new Date(event.start_date).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                        {!event.all_day && ` at ${new Date(event.start_date).toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit'
                        })}`}
                      </span>
                    </div>
                  </div>
                </div>
                <span
                  className={`px-3 py-1 text-xs font-medium rounded-full ${
                    event.event_type === 'exam' ? 'bg-red-100 text-red-700' :
                    event.event_type === 'meeting' ? 'bg-purple-100 text-purple-700' :
                    event.event_type === 'holiday' ? 'bg-green-100 text-green-700' :
                    event.event_type === 'class_session' ? 'bg-blue-100 text-blue-700' :
                    'bg-gray-100 text-gray-700'
                  }`}
                >
                  {event.event_type.replace('_', ' ')}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Add Event Modal */}
      {showAddEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">Add New Event</h3>
              <button
                onClick={() => setShowAddEvent(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Event Title *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="Enter event title"
                />
              </div>

              {/* Event Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Event Type *
                </label>
                <select
                  required
                  value={formData.event_type}
                  onChange={(e) => setFormData({ ...formData, event_type: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="class_session">Class Session</option>
                  <option value="exam">Exam</option>
                  <option value="meeting">Meeting</option>
                  <option value="holiday">Holiday</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* All Day Toggle */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="all-day"
                  checked={formData.all_day}
                  onChange={(e) => setFormData({ ...formData, all_day: e.target.checked })}
                  className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                />
                <label htmlFor="all-day" className="text-sm font-medium text-gray-700">
                  All Day Event
                </label>
              </div>

              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date *
                </label>
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              {/* Time Range (only if not all-day) */}
              {!formData.all_day && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Start Time *
                    </label>
                    <input
                      type="time"
                      required={!formData.all_day}
                      value={formData.start_time}
                      onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      End Time
                    </label>
                    <input
                      type="time"
                      value={formData.end_time}
                      onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                </div>
              )}

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="Optional event description"
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Creating...' : 'Create Event'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddEvent(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
