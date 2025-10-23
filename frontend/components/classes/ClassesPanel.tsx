/**
 * ClassesPanel Component - Complete Class Management System
 * Created: 2025-10-22
 * Purpose: Class creation, editing, listing, and management interface
 */

'use client';

import { useState, useEffect } from 'react';
import {
  BookOpen, Plus, Edit2, Trash2, Search, Filter, X, Save,
  Calendar, Clock, Users, MapPin, RefreshCw, ChevronRight,
  AlertCircle, CheckCircle2, Book, GraduationCap, Grid
} from 'lucide-react';
import { useClasses, ClassData, CreateClassData, UpdateClassData, ScheduleData } from '@/hooks/useClasses';
import { useSchoolStore } from '@/store/schoolStore';
import { useAuthStore } from '@/store/authStore';

interface ClassesPanelProps {
  userRole?: 'owner' | 'admin' | 'teacher' | 'student' | 'parent';
}

export default function ClassesPanel({ userRole = 'teacher' }: ClassesPanelProps) {
  const {
    classes,
    isLoading,
    error,
    createClass,
    updateClass,
    deleteClass,
    searchClasses,
    getClassesByLevel,
    refreshClasses,
    clearError,
  } = useClasses();

  const { user } = useAuthStore();
  const schoolId = user?.schoolId || '';

  // View state
  const [activeView, setActiveView] = useState<'list' | 'create' | 'edit'>('list');

  // List view state
  const [searchQuery, setSearchQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState('');
  const [filteredClasses, setFilteredClasses] = useState<ClassData[]>([]);

  // Create/Edit form state
  const [formData, setFormData] = useState<CreateClassData>({
    school_id: schoolId,
    name: '',
    code: '',
    level: '',
    schedule: {
      days: [],
      time: '',
      duration: 60,
      room: '',
    },
  });

  // Edit mode state
  const [editingClassId, setEditingClassId] = useState<string | null>(null);

  // UI state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Available days of the week
  const DAYS_OF_WEEK = [
    'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
  ];

  // Available levels (customize based on your school structure)
  const LEVELS = [
    'Beginner',
    'Intermediate',
    'Advanced',
    'Level 1',
    'Level 2',
    'Level 3',
    'Level 4',
    'Level 5',
  ];

  // Update filtered classes when search/filter changes
  useEffect(() => {
    let result = classes;

    // Apply search
    if (searchQuery) {
      result = searchClasses(searchQuery);
    }

    // Apply level filter
    if (levelFilter) {
      result = result.filter(cls => cls.level === levelFilter);
    }

    setFilteredClasses(result);
  }, [classes, searchQuery, levelFilter, searchClasses]);

  // Reset form when switching views
  useEffect(() => {
    if (activeView === 'create') {
      setFormData({
        school_id: schoolId,
        name: '',
        code: '',
        level: '',
        schedule: {
          days: [],
          time: '',
          duration: 60,
          room: '',
        },
      });
      setEditingClassId(null);
    }
  }, [activeView, schoolId]);

  // Handle day toggle in schedule
  const toggleDay = (day: string) => {
    const currentDays = formData.schedule?.days || [];
    const newDays = currentDays.includes(day)
      ? currentDays.filter(d => d !== day)
      : [...currentDays, day];

    setFormData({
      ...formData,
      schedule: {
        ...formData.schedule,
        days: newDays,
      },
    });
  };

  // Handle form input changes
  const handleInputChange = (field: keyof CreateClassData, value: any) => {
    setFormData({
      ...formData,
      [field]: value,
    });
  };

  // Handle schedule field changes
  const handleScheduleChange = (field: keyof ScheduleData, value: any) => {
    setFormData({
      ...formData,
      schedule: {
        ...formData.schedule,
        [field]: value,
      },
    });
  };

  // Validate form
  const validateForm = (): string | null => {
    if (!formData.name.trim()) {
      return 'Class name is required';
    }
    if (!formData.code.trim()) {
      return 'Class code is required';
    }
    if (!formData.level) {
      return 'Level is required';
    }
    return null;
  };

  // Handle create class
  const handleCreateClass = async () => {
    const validationError = validateForm();
    if (validationError) {
      alert(validationError);
      return;
    }

    setIsSubmitting(true);
    const result = await createClass(formData);
    setIsSubmitting(false);

    if (result.success) {
      setSuccessMessage('Class created successfully!');
      setTimeout(() => {
        setSuccessMessage('');
        setActiveView('list');
      }, 2000);
    } else {
      alert(`Failed to create class: ${result.error}`);
    }
  };

  // Handle edit class
  const handleEditClick = (classData: ClassData) => {
    setEditingClassId(classData.id);
    setFormData({
      school_id: classData.school_id,
      name: classData.name,
      code: classData.code,
      level: classData.level,
      schedule: classData.schedule || {
        days: [],
        time: '',
        duration: 60,
        room: '',
      },
    });
    setActiveView('edit');
  };

  // Handle update class
  const handleUpdateClass = async () => {
    if (!editingClassId) return;

    const validationError = validateForm();
    if (validationError) {
      alert(validationError);
      return;
    }

    setIsSubmitting(true);
    const updateData: UpdateClassData = {
      name: formData.name,
      code: formData.code,
      level: formData.level,
      schedule: formData.schedule,
    };

    const result = await updateClass(editingClassId, updateData);
    setIsSubmitting(false);

    if (result.success) {
      setSuccessMessage('Class updated successfully!');
      setTimeout(() => {
        setSuccessMessage('');
        setActiveView('list');
        setEditingClassId(null);
      }, 2000);
    } else {
      alert(`Failed to update class: ${result.error}`);
    }
  };

  // Handle delete class
  const handleDeleteClass = async (classId: string) => {
    const result = await deleteClass(classId);

    if (result.success) {
      setShowDeleteConfirm(null);
      setSuccessMessage('Class deleted successfully!');
      setTimeout(() => setSuccessMessage(''), 2000);
    } else {
      alert(`Failed to delete class: ${result.error}`);
    }
  };

  // Clear all filters
  const clearAllFilters = () => {
    setSearchQuery('');
    setLevelFilter('');
  };

  // Render loading state
  if (isLoading && classes.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
          <p className="text-gray-600">Loading classes...</p>
        </div>
      </div>
    );
  }

  // ============================================
  // RENDER: LIST VIEW
  // ============================================
  if (activeView === 'list') {
    return (
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <BookOpen className="w-6 h-6 text-blue-600" />
            <h2 className="text-2xl font-semibold text-gray-800">Class Management</h2>
          </div>

          {(userRole === 'owner' || userRole === 'admin' || userRole === 'teacher') && (
            <button
              onClick={() => setActiveView('create')}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span>Create Class</span>
            </button>
          )}
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center space-x-3">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            <span className="text-green-800">{successMessage}</span>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <span className="text-red-800">{error}</span>
            </div>
            <button onClick={clearError} className="text-red-600 hover:text-red-800">
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name or code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Level Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={levelFilter}
                onChange={(e) => setLevelFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
              >
                <option value="">All Levels</option>
                {LEVELS.map((level) => (
                  <option key={level} value={level}>{level}</option>
                ))}
              </select>
            </div>

            {/* Clear Filters */}
            <div className="flex items-center space-x-2">
              <button
                onClick={clearAllFilters}
                className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <X className="w-4 h-4" />
                <span>Clear Filters</span>
              </button>
              <button
                onClick={() => refreshClasses()}
                className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Classes Grid */}
        {filteredClasses.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <Grid className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-700 mb-2">No classes found</h3>
            <p className="text-gray-500">
              {searchQuery || levelFilter
                ? 'Try adjusting your filters'
                : 'Create your first class to get started'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredClasses.map((classData) => (
              <div
                key={classData.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow"
              >
                {/* Class Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-800 mb-1">
                      {classData.name}
                    </h3>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Book className="w-4 h-4" />
                      <span>{classData.code}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    {(userRole === 'owner' || userRole === 'admin' || userRole === 'teacher') && (
                      <>
                        <button
                          onClick={() => handleEditClick(classData)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit class"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setShowDeleteConfirm(classData.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete class"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Class Details */}
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <GraduationCap className="w-4 h-4" />
                    <span>{classData.level}</span>
                  </div>

                  {classData.schedule?.days && classData.schedule.days.length > 0 && (
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span>{classData.schedule.days.join(', ')}</span>
                    </div>
                  )}

                  {classData.schedule?.time && (
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Clock className="w-4 h-4" />
                      <span>{classData.schedule.time} ({classData.schedule.duration || 60} min)</span>
                    </div>
                  )}

                  {classData.schedule?.room && (
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <MapPin className="w-4 h-4" />
                      <span>Room {classData.schedule.room}</span>
                    </div>
                  )}
                </div>

                {/* Delete Confirmation */}
                {showDeleteConfirm === classData.id && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-800 mb-3">
                      Are you sure you want to delete this class? This action cannot be undone.
                    </p>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleDeleteClass(classData.id)}
                        className="flex-1 px-3 py-1.5 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
                      >
                        Delete
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(null)}
                        className="flex-1 px-3 py-1.5 bg-white text-gray-700 text-sm rounded border border-gray-300 hover:bg-gray-50 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Stats Summary */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>Total Classes: <strong className="text-gray-800">{classes.length}</strong></span>
            <span>Showing: <strong className="text-gray-800">{filteredClasses.length}</strong></span>
          </div>
        </div>
      </div>
    );
  }

  // ============================================
  // RENDER: CREATE/EDIT VIEW
  // ============================================
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setActiveView('list')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-gray-600 transform rotate-180" />
          </button>
          <BookOpen className="w-6 h-6 text-blue-600" />
          <h2 className="text-2xl font-semibold text-gray-800">
            {activeView === 'create' ? 'Create New Class' : 'Edit Class'}
          </h2>
        </div>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center space-x-3">
          <CheckCircle2 className="w-5 h-5 text-green-600" />
          <span className="text-green-800">{successMessage}</span>
        </div>
      )}

      {/* Form */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="space-y-6">
          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-medium text-gray-800 mb-4">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Class Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Class Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="e.g., Beginner Quran Reading"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Class Code */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Class Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => handleInputChange('code', e.target.value)}
                  placeholder="e.g., QR-101"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Level */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Level <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.level}
                  onChange={(e) => handleInputChange('level', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select a level</option>
                  {LEVELS.map((level) => (
                    <option key={level} value={level}>{level}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Schedule Information */}
          <div>
            <h3 className="text-lg font-medium text-gray-800 mb-4">Schedule</h3>

            {/* Days of Week */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Days of Week
              </label>
              <div className="flex flex-wrap gap-2">
                {DAYS_OF_WEEK.map((day) => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay(day)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      formData.schedule?.days?.includes(day)
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {day.slice(0, 3)}
                  </button>
                ))}
              </div>
            </div>

            {/* Time and Duration */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Time
                </label>
                <input
                  type="time"
                  value={formData.schedule?.time || ''}
                  onChange={(e) => handleScheduleChange('time', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Duration (minutes)
                </label>
                <input
                  type="number"
                  value={formData.schedule?.duration || 60}
                  onChange={(e) => handleScheduleChange('duration', parseInt(e.target.value))}
                  min="15"
                  max="240"
                  step="15"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Room */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Room
              </label>
              <input
                type="text"
                value={formData.schedule?.room || ''}
                onChange={(e) => handleScheduleChange('room', e.target.value)}
                placeholder="e.g., Room 101 or Online"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t">
            <button
              onClick={() => setActiveView('list')}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              onClick={activeView === 'create' ? handleCreateClass : handleUpdateClass}
              disabled={isSubmitting}
              className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>{activeView === 'create' ? 'Creating...' : 'Updating...'}</span>
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  <span>{activeView === 'create' ? 'Create Class' : 'Update Class'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
