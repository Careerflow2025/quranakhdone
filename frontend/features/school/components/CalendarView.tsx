'use client';

import { useState } from 'react';
import { 
  Calendar,
  Clock,
  Plus,
  ChevronLeft,
  ChevronRight,
  Users,
  BookOpen,
  AlertCircle,
  Edit,
  Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSchoolStore } from '../state/useSchoolStore';

interface Event {
  id: string;
  title: string;
  date: string;
  time: string;
  type: 'class' | 'meeting' | 'exam' | 'holiday' | 'event';
  description?: string;
  attendees?: string[];
}

export default function CalendarView() {
  const { classes, teachers } = useSchoolStore();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [events, setEvents] = useState<Event[]>([]);
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  
  // Form state
  const [eventForm, setEventForm] = useState({
    title: '',
    date: '',
    time: '',
    type: 'class' as Event['type'],
    description: ''
  });
  
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };
  
  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };
  
  const handlePrevMonth = () => {
    setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1));
  };
  
  const handleNextMonth = () => {
    setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1));
  };
  
  const handleAddEvent = () => {
    if (eventForm.title && eventForm.date && eventForm.time) {
      const newEvent: Event = {
        id: crypto.randomUUID(),
        title: eventForm.title,
        date: eventForm.date,
        time: eventForm.time,
        type: eventForm.type,
        description: eventForm.description
      };
      setEvents([...events, newEvent]);
      setShowAddEvent(false);
      setEventForm({ title: '', date: '', time: '', type: 'class', description: '' });
    }
  };
  
  const handleDeleteEvent = (id: string) => {
    setEvents(events.filter(e => e.id !== id));
  };
  
  const daysInMonth = getDaysInMonth(selectedDate);
  const firstDay = getFirstDayOfMonth(selectedDate);
  const days = [];
  
  // Add empty cells for days before month starts
  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }
  
  // Add days of month
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }
  
  const getEventsForDay = (day: number) => {
    const dateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return events.filter(e => e.date === dateStr);
  };
  
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Calendar</h2>
          <p className="text-sm text-gray-600 mt-1">Manage classes, events, and schedules</p>
        </div>
        <button
          onClick={() => setShowAddEvent(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Event
        </button>
      </div>
      
      {/* Calendar Navigation */}
      <div className="bg-white rounded-xl border p-6">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={handlePrevMonth}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <h3 className="text-xl font-bold">
            {monthNames[selectedDate.getMonth()]} {selectedDate.getFullYear()}
          </h3>
          
          <button
            onClick={handleNextMonth}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
        
        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-px bg-gray-200">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="bg-gray-50 p-3 text-center text-sm font-medium text-gray-700">
              {day}
            </div>
          ))}
          
          {days.map((day, index) => {
            const dayEvents = day ? getEventsForDay(day) : [];
            const isToday = day === new Date().getDate() && 
                           selectedDate.getMonth() === new Date().getMonth() &&
                           selectedDate.getFullYear() === new Date().getFullYear();
            
            return (
              <div
                key={index}
                className={`bg-white p-2 min-h-[100px] ${
                  day ? 'hover:bg-gray-50' : ''
                } ${isToday ? 'bg-blue-50' : ''}`}
              >
                {day && (
                  <>
                    <div className={`text-sm font-medium mb-1 ${
                      isToday ? 'text-blue-600' : 'text-gray-900'
                    }`}>
                      {day}
                    </div>
                    
                    <div className="space-y-1">
                      {dayEvents.slice(0, 2).map(event => (
                        <div
                          key={event.id}
                          onClick={() => setSelectedEvent(event)}
                          className={`text-xs p-1 rounded cursor-pointer ${
                            event.type === 'class' ? 'bg-blue-100 text-blue-700' :
                            event.type === 'meeting' ? 'bg-green-100 text-green-700' :
                            event.type === 'exam' ? 'bg-red-100 text-red-700' :
                            event.type === 'holiday' ? 'bg-purple-100 text-purple-700' :
                            'bg-gray-100 text-gray-700'
                          }`}
                        >
                          <div className="truncate">{event.time} - {event.title}</div>
                        </div>
                      ))}
                      {dayEvents.length > 2 && (
                        <div className="text-xs text-gray-500 text-center">
                          +{dayEvents.length - 2} more
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Upcoming Events */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border p-6">
          <h3 className="text-lg font-semibold mb-4">Upcoming Events</h3>
          
          <div className="space-y-3">
            {events.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No events scheduled</p>
            ) : (
              events.slice(0, 5).map(event => (
                <div key={event.id} className="flex items-start justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-start gap-3">
                    <div className={`w-2 h-2 rounded-full mt-2 ${
                      event.type === 'class' ? 'bg-blue-500' :
                      event.type === 'meeting' ? 'bg-green-500' :
                      event.type === 'exam' ? 'bg-red-500' :
                      event.type === 'holiday' ? 'bg-purple-500' :
                      'bg-gray-500'
                    }`} />
                    <div>
                      <p className="font-medium text-gray-900">{event.title}</p>
                      <p className="text-sm text-gray-600">{event.date} at {event.time}</p>
                      {event.description && (
                        <p className="text-xs text-gray-500 mt-1">{event.description}</p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteEvent(event.id)}
                    className="p-1 hover:bg-red-100 rounded text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
        
        {/* Quick Stats */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border p-6">
            <h3 className="text-lg font-semibold mb-4">This Month</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Total Events</span>
                <span className="font-bold">{events.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Classes</span>
                <span className="font-bold">{events.filter(e => e.type === 'class').length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Meetings</span>
                <span className="font-bold">{events.filter(e => e.type === 'meeting').length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Exams</span>
                <span className="font-bold">{events.filter(e => e.type === 'exam').length}</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl border p-6">
            <h3 className="text-lg font-semibold mb-4">Today's Schedule</h3>
            <div className="space-y-2">
              {classes.filter(c => c.status === 'active').slice(0, 3).map(cls => (
                <div key={cls.id} className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">{cls.schedule}</span>
                  <span className="font-medium text-gray-900">{cls.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* Add Event Modal */}
      <AnimatePresence>
        {showAddEvent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={() => setShowAddEvent(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-xl p-6 w-full max-w-md"
            >
              <h3 className="text-xl font-bold mb-4">Add New Event</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Event Title</label>
                  <input
                    type="text"
                    value={eventForm.title}
                    onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter event title"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                    <input
                      type="date"
                      value={eventForm.date}
                      onChange={(e) => setEventForm({ ...eventForm, date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                    <input
                      type="time"
                      value={eventForm.time}
                      onChange={(e) => setEventForm({ ...eventForm, time: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Event Type</label>
                  <select
                    value={eventForm.type}
                    onChange={(e) => setEventForm({ ...eventForm, type: e.target.value as Event['type'] })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="class">Class</option>
                    <option value="meeting">Meeting</option>
                    <option value="exam">Exam</option>
                    <option value="holiday">Holiday</option>
                    <option value="event">Other Event</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
                  <textarea
                    value={eventForm.description}
                    onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="Add event details..."
                  />
                </div>
              </div>
              
              <div className="flex items-center gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowAddEvent(false);
                    setEventForm({ title: '', date: '', time: '', type: 'class', description: '' });
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddEvent}
                  disabled={!eventForm.title || !eventForm.date || !eventForm.time}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add Event
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}