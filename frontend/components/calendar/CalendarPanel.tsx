'use client';

import { useState, useEffect } from 'react';
import { useCalendar, CreateEventData, EventFilters, CalendarView } from '@/hooks/useCalendar';
import {
  Calendar as CalendarIcon,
  Plus,
  X,
  Save,
  ChevronLeft,
  ChevronRight,
  List,
  Grid3x3,
  Columns,
  Square,
  Filter,
  Download,
  Clock,
  MapPin,
  Users,
  Edit2,
  Trash2,
  Loader,
  AlertCircle,
  Eye,
} from 'lucide-react';
import {
  EventWithDetails,
  EventType,
  EVENT_TYPES,
  getEventTypeColor,
  getEventTypeName,
  getEventTypeIcon,
  formatEventDateRange,
  isEventPast,
  isEventNow,
  isEventUpcoming,
} from '@/lib/types/events';

interface CalendarPanelProps {
  userRole?: 'owner' | 'admin' | 'teacher' | 'student' | 'parent';
}

export default function CalendarPanel({ userRole = 'teacher' }: CalendarPanelProps) {
  // Hook integration
  const {
    isLoading,
    error,
    events,
    currentEvent,
    relatedEvents,
    currentView,
    currentDate,
    filters,
    summary,
    isSubmitting,
    currentPage,
    totalPages,
    totalItems,
    fetchEvent,
    createEvent,
    updateEvent,
    deleteEvent,
    clearCurrentEvent,
    exportToICal,
    changeView,
    navigateToDate,
    navigatePrevious,
    navigateNext,
    navigateToToday,
    updateFilters,
    clearFilters,
    refreshData,
    changePage,
  } = useCalendar('month');

  // UI State
  const [showCreateEventModal, setShowCreateEventModal] = useState(false);
  const [showEventDetailModal, setShowEventDetailModal] = useState(false);
  const [showFilterPanel, setShowFilterPanel] = useState(false);

  // Create event form state
  const [eventForm, setEventForm] = useState<CreateEventData>({
    title: '',
    description: '',
    event_type: 'other',
    start_date: '',
    end_date: '',
    all_day: false,
    location: '',
    color: '',
  });

  // Filter state
  const [filterForm, setFilterForm] = useState<EventFilters>({});

  // ============================================================================
  // Handlers
  // ============================================================================

  const handleCreateEvent = async () => {
    // Validation: title and dates required
    if (!eventForm.title.trim()) {
      alert('Please enter an event title');
      return;
    }

    if (!eventForm.start_date) {
      alert('Please select a start date');
      return;
    }

    if (!eventForm.end_date) {
      alert('Please select an end date');
      return;
    }

    // Ensure start is before end
    if (new Date(eventForm.start_date) > new Date(eventForm.end_date)) {
      alert('Start date must be before end date');
      return;
    }

    const success = await createEvent(eventForm);
    if (success) {
      setShowCreateEventModal(false);
      // Reset form
      setEventForm({
        title: '',
        description: '',
        event_type: 'other',
        start_date: '',
        end_date: '',
        all_day: false,
        location: '',
        color: '',
      });
    }
  };

  const handleViewEvent = async (event: EventWithDetails) => {
    await fetchEvent(event.id);
    setShowEventDetailModal(true);
  };

  const handleDeleteEvent = async (eventId: string, isRecurring: boolean) => {
    if (!confirm('Are you sure you want to delete this event?')) {
      return;
    }

    const deleteSeries = isRecurring && confirm('Delete entire series?');
    const success = await deleteEvent(eventId, deleteSeries);
    if (success) {
      setShowEventDetailModal(false);
      clearCurrentEvent();
    }
  };

  const handleApplyFilters = () => {
    updateFilters(filterForm);
    setShowFilterPanel(false);
  };

  const handleClearFilters = () => {
    setFilterForm({});
    clearFilters();
    setShowFilterPanel(false);
  };

  const handleExportCalendar = async () => {
    await exportToICal();
  };

  // ============================================================================
  // View-Specific Rendering
  // ============================================================================

  /**
   * Month View - Calendar grid
   */
  const renderMonthView = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // Get first day of month and number of days
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Build calendar grid
    const weeks: JSX.Element[] = [];
    let days: JSX.Element[] = [];

    // Empty cells before first day
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-24 bg-gray-50"></div>);
    }

    // Days of month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dayEvents = events.filter((event) => {
        const eventStart = new Date(event.start_date);
        return (
          eventStart.getDate() === day &&
          eventStart.getMonth() === month &&
          eventStart.getFullYear() === year
        );
      });

      const isToday =
        date.getDate() === new Date().getDate() &&
        date.getMonth() === new Date().getMonth() &&
        date.getFullYear() === new Date().getFullYear();

      days.push(
        <div
          key={day}
          className={`h-24 border border-gray-200 p-1 overflow-y-auto ${
            isToday ? 'bg-blue-50' : 'bg-white'
          } hover:bg-gray-50 cursor-pointer transition-colors`}
          onClick={() => {
            changeView('day');
            navigateToDate(date);
          }}
        >
          <div className={`text-sm font-medium mb-1 ${isToday ? 'text-blue-600' : 'text-gray-700'}`}>
            {day}
          </div>

          {/* Event dots */}
          <div className="space-y-1">
            {dayEvents.slice(0, 3).map((event) => (
              <div
                key={event.id}
                className="text-xs px-1 py-0.5 rounded truncate cursor-pointer"
                style={{
                  backgroundColor: event.color || getEventTypeColor(event.event_type),
                  color: 'white',
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleViewEvent(event);
                }}
              >
                {event.title}
              </div>
            ))}
            {dayEvents.length > 3 && (
              <div className="text-xs text-gray-500 px-1">+{dayEvents.length - 3} more</div>
            )}
          </div>
        </div>
      );

      // Start new week row
      if (days.length === 7) {
        weeks.push(
          <div key={`week-${weeks.length}`} className="grid grid-cols-7 gap-0">
            {days}
          </div>
        );
        days = [];
      }
    }

    // Add remaining days
    if (days.length > 0) {
      while (days.length < 7) {
        days.push(<div key={`empty-end-${days.length}`} className="h-24 bg-gray-50"></div>);
      }
      weeks.push(
        <div key={`week-${weeks.length}`} className="grid grid-cols-7 gap-0">
          {days}
        </div>
      );
    }

    return (
      <div className="bg-white rounded-lg border border-gray-200">
        {/* Day headers */}
        <div className="grid grid-cols-7 gap-0 border-b border-gray-200">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="p-2 text-center text-sm font-medium text-gray-700 bg-gray-50">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        {weeks}
      </div>
    );
  };

  /**
   * Week View - Weekly schedule
   */
  const renderWeekView = () => {
    const weekStart = new Date(currentDate);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());

    const weekDays = Array.from({ length: 7 }, (_, i) => {
      const day = new Date(weekStart);
      day.setDate(day.getDate() + i);
      return day;
    });

    return (
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="grid grid-cols-7 gap-0 border-b border-gray-200">
          {weekDays.map((day, i) => {
            const dayEvents = events.filter((event) => {
              const eventStart = new Date(event.start_date);
              return eventStart.toDateString() === day.toDateString();
            });

            const isToday = day.toDateString() === new Date().toDateString();

            return (
              <div key={i} className={`p-3 ${isToday ? 'bg-blue-50' : 'bg-white'}`}>
                <div className="text-center mb-2">
                  <div className="text-xs text-gray-500">
                    {day.toLocaleDateString('en-US', { weekday: 'short' })}
                  </div>
                  <div className={`text-lg font-bold ${isToday ? 'text-blue-600' : 'text-gray-900'}`}>
                    {day.getDate()}
                  </div>
                </div>

                <div className="space-y-2 min-h-[400px]">
                  {dayEvents.map((event) => (
                    <div
                      key={event.id}
                      className="text-xs px-2 py-1 rounded cursor-pointer hover:opacity-80 transition-opacity"
                      style={{
                        backgroundColor: event.color || getEventTypeColor(event.event_type),
                        color: 'white',
                      }}
                      onClick={() => handleViewEvent(event)}
                    >
                      <div className="font-medium truncate">{event.title}</div>
                      <div className="text-xs opacity-90">
                        {new Date(event.start_date).toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  /**
   * Day View - Daily schedule
   */
  const renderDayView = () => {
    const dayEvents = events.filter((event) => {
      const eventStart = new Date(event.start_date);
      return eventStart.toDateString() === currentDate.toDateString();
    });

    const hours = Array.from({ length: 24 }, (_, i) => i);

    return (
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            {currentDate.toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </h3>
          <p className="text-sm text-gray-500">{dayEvents.length} events</p>
        </div>

        <div className="p-4 max-h-[600px] overflow-y-auto">
          <div className="space-y-1">
            {hours.map((hour) => {
              const hourEvents = dayEvents.filter((event) => {
                const eventHour = new Date(event.start_date).getHours();
                return eventHour === hour;
              });

              return (
                <div key={hour} className="flex border-b border-gray-100">
                  <div className="w-20 py-2 text-sm text-gray-500">
                    {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
                  </div>

                  <div className="flex-1 py-2 pl-4 space-y-2">
                    {hourEvents.map((event) => (
                      <div
                        key={event.id}
                        className="px-3 py-2 rounded cursor-pointer hover:opacity-80 transition-opacity"
                        style={{
                          backgroundColor: event.color || getEventTypeColor(event.event_type),
                          color: 'white',
                        }}
                        onClick={() => handleViewEvent(event)}
                      >
                        <div className="font-medium">{event.title}</div>
                        <div className="text-sm opacity-90">
                          {formatEventDateRange(event.start_date, event.end_date, event.all_day)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  /**
   * List View - Simple event list with pagination
   */
  const renderListView = () => {
    return (
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="divide-y divide-gray-100">
          {events.length === 0 ? (
            <div className="p-12 text-center">
              <CalendarIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No events found</p>
              <p className="text-sm text-gray-400 mt-1">Create your first event to get started</p>
            </div>
          ) : (
            events.map((event) => (
              <div
                key={event.id}
                className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => handleViewEvent(event)}
              >
                <div className="flex items-start gap-3">
                  {/* Event type indicator */}
                  <div
                    className="w-1 h-16 rounded"
                    style={{ backgroundColor: event.color || getEventTypeColor(event.event_type) }}
                  ></div>

                  {/* Event details */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900">{event.title}</h3>
                        <p className="text-sm text-gray-500 mt-1">
                          {getEventTypeName(event.event_type)}
                        </p>
                      </div>

                      {/* Status badge */}
                      {isEventNow(event.start_date, event.end_date) && (
                        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">
                          Now
                        </span>
                      )}
                      {isEventUpcoming(event.start_date) && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                          Upcoming
                        </span>
                      )}
                      {isEventPast(event.end_date) && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded">
                          Past
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {formatEventDateRange(event.start_date, event.end_date, event.all_day)}
                      </div>

                      {event.location && (
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {event.location}
                        </div>
                      )}

                      {event.participant_count && event.participant_count > 0 && (
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {event.participant_count} participants
                        </div>
                      )}
                    </div>

                    {event.description && (
                      <p className="text-sm text-gray-600 mt-2 line-clamp-2">{event.description}</p>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Showing {((currentPage - 1) * 10) + 1} to {Math.min(currentPage * 10, totalItems)} of {totalItems} events
            </p>

            <div className="flex items-center gap-2">
              <button
                onClick={() => changePage(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </span>

              <button
                onClick={() => changePage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  // ============================================================================
  // Main Render
  // ============================================================================

  return (
    <div className="bg-white rounded-lg shadow-sm">
      {/* HEADER */}
      <div className="border-b border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <CalendarIcon className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Calendar</h2>
              <p className="text-sm text-gray-500">
                {summary ? `${summary.total_events} events` : 'No events'}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCalendar}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export
            </button>

            <button
              onClick={() => setShowFilterPanel(!showFilterPanel)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 ${
                showFilterPanel || Object.keys(filters).length > 0
                  ? 'text-white bg-purple-600'
                  : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
              }`}
            >
              <Filter className="w-4 h-4" />
              Filter
            </button>

            {(userRole === 'teacher' || userRole === 'admin' || userRole === 'owner') && (
              <button
                onClick={() => setShowCreateEventModal(true)}
                className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Create Event
              </button>
            )}
          </div>
        </div>

        {/* Navigation and View Controls */}
        <div className="flex items-center justify-between">
          {/* Date Navigation */}
          <div className="flex items-center gap-3">
            <button
              onClick={navigatePrevious}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <button
              onClick={navigateToToday}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Today
            </button>

            <button
              onClick={navigateNext}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-semibold text-gray-900 ml-2">
              {currentView === 'month' &&
                currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              {currentView === 'week' &&
                `Week of ${currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
              {currentView === 'day' &&
                currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              {currentView === 'list' && 'All Events'}
            </h3>
          </div>

          {/* View Switcher */}
          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => changeView('month')}
              className={`p-2 rounded transition-colors ${
                currentView === 'month' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
              title="Month View"
            >
              <Grid3x3 className="w-4 h-4" />
            </button>

            <button
              onClick={() => changeView('week')}
              className={`p-2 rounded transition-colors ${
                currentView === 'week' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
              title="Week View"
            >
              <Columns className="w-4 h-4" />
            </button>

            <button
              onClick={() => changeView('day')}
              className={`p-2 rounded transition-colors ${
                currentView === 'day' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
              title="Day View"
            >
              <Square className="w-4 h-4" />
            </button>

            <button
              onClick={() => changeView('list')}
              className={`p-2 rounded transition-colors ${
                currentView === 'list' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
              title="List View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* FILTER PANEL */}
      {showFilterPanel && (
        <div className="border-b border-gray-200 p-6 bg-gray-50">
          <div className="grid grid-cols-3 gap-4">
            {/* Event Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Event Type</label>
              <select
                value={filterForm.event_type || ''}
                onChange={(e) => setFilterForm({ ...filterForm, event_type: (e.target.value as EventType) || undefined })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">All Types</option>
                {EVENT_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {getEventTypeName(type)}
                  </option>
                ))}
              </select>
            </div>

            {/* Start Date Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">From Date</label>
              <input
                type="date"
                value={filterForm.start_date || ''}
                onChange={(e) => setFilterForm({ ...filterForm, start_date: e.target.value || undefined })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {/* End Date Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">To Date</label>
              <input
                type="date"
                value={filterForm.end_date || ''}
                onChange={(e) => setFilterForm({ ...filterForm, end_date: e.target.value || undefined })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 mt-4">
            <button
              onClick={handleApplyFilters}
              className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors"
            >
              Apply Filters
            </button>

            <button
              onClick={handleClearFilters}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* LOADING STATE */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader className="w-8 h-8 text-purple-600 animate-spin" />
          <span className="ml-3 text-gray-600">Loading calendar...</span>
        </div>
      )}

      {/* ERROR STATE */}
      {error && (
        <div className="m-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-900">Error loading calendar</p>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* CALENDAR VIEWS */}
      {!isLoading && !error && (
        <div className="p-6">
          {currentView === 'month' && renderMonthView()}
          {currentView === 'week' && renderWeekView()}
          {currentView === 'day' && renderDayView()}
          {currentView === 'list' && renderListView()}
        </div>
      )}

      {/* CREATE EVENT MODAL */}
      {showCreateEventModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">Create Event</h3>
              <button
                onClick={() => setShowCreateEventModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal content */}
            <div className="p-6 space-y-4">
              {/* Event title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Event Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={eventForm.title}
                  onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                  placeholder="Enter event title"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              {/* Event type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Event Type</label>
                <select
                  value={eventForm.event_type}
                  onChange={(e) => setEventForm({ ...eventForm, event_type: e.target.value as EventType })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  {EVENT_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {getEventTypeName(type)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date and time */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date & Time <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={eventForm.start_date}
                    onChange={(e) => setEventForm({ ...eventForm, start_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Date & Time <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={eventForm.end_date}
                    onChange={(e) => setEventForm({ ...eventForm, end_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* All day checkbox */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="all-day"
                  checked={eventForm.all_day}
                  onChange={(e) => setEventForm({ ...eventForm, all_day: e.target.checked })}
                  className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                />
                <label htmlFor="all-day" className="ml-2 text-sm text-gray-700">
                  All day event
                </label>
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                <input
                  type="text"
                  value={eventForm.location || ''}
                  onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })}
                  placeholder="Enter event location"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={eventForm.description || ''}
                  onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                  placeholder="Enter event description"
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              {/* Color */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Color (optional)</label>
                <input
                  type="color"
                  value={eventForm.color || getEventTypeColor(eventForm.event_type)}
                  onChange={(e) => setEventForm({ ...eventForm, color: e.target.value })}
                  className="w-20 h-10 border border-gray-300 rounded-lg"
                />
              </div>
            </div>

            {/* Modal footer */}
            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-6 flex justify-end gap-3">
              <button
                onClick={() => setShowCreateEventModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>

              <button
                onClick={handleCreateEvent}
                disabled={isSubmitting || !eventForm.title || !eventForm.start_date || !eventForm.end_date}
                className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Create Event
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EVENT DETAIL MODAL */}
      {showEventDetailModal && currentEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal header */}
            <div
              className="sticky top-0 p-6 flex items-center justify-between"
              style={{
                backgroundColor: currentEvent.color || getEventTypeColor(currentEvent.event_type),
                color: 'white',
              }}
            >
              <div>
                <h3 className="text-xl font-bold">{currentEvent.title}</h3>
                <p className="text-sm opacity-90">{getEventTypeName(currentEvent.event_type)}</p>
              </div>
              <button
                onClick={() => {
                  setShowEventDetailModal(false);
                  clearCurrentEvent();
                }}
                className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal content */}
            <div className="p-6 space-y-4">
              {/* Date & Time */}
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-700">Date & Time</p>
                  <p className="text-sm text-gray-600">
                    {formatEventDateRange(currentEvent.start_date, currentEvent.end_date, currentEvent.all_day)}
                  </p>
                </div>
              </div>

              {/* Location */}
              {currentEvent.location && (
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">Location</p>
                    <p className="text-sm text-gray-600">{currentEvent.location}</p>
                  </div>
                </div>
              )}

              {/* Description */}
              {currentEvent.description && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Description</p>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">{currentEvent.description}</p>
                </div>
              )}

              {/* Creator */}
              {currentEvent.creator && (
                <div className="flex items-start gap-3">
                  <Users className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">Created by</p>
                    <p className="text-sm text-gray-600">{currentEvent.creator.display_name}</p>
                  </div>
                </div>
              )}

              {/* Recurring info */}
              {currentEvent.is_recurring && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm font-medium text-blue-900">Recurring Event</p>
                  {relatedEvents.length > 0 && (
                    <p className="text-sm text-blue-700 mt-1">{relatedEvents.length + 1} total occurrences</p>
                  )}
                </div>
              )}
            </div>

            {/* Modal footer */}
            {(userRole === 'teacher' || userRole === 'admin' || userRole === 'owner') && (
              <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-6 flex justify-end gap-3">
                <button
                  onClick={() => handleDeleteEvent(currentEvent.id, currentEvent.is_recurring)}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
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
