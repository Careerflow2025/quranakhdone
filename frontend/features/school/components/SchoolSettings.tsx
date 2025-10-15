'use client';

import { useState, useEffect } from 'react';
import {
  Settings,
  School,
  Bell,
  Globe,
  Palette,
  Calendar,
  Clock,
  Mail,
  Database,
  Shield,
  Save,
  ChevronRight,
  Moon,
  Sun
} from 'lucide-react';

interface SchoolProfile {
  name: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  principalName: string;
  establishedYear: string;
  studentCapacity: number;
  timezone: string;
  language: string;
}

interface AcademicSettings {
  academicYear: string;
  termDates: {
    term1Start: string;
    term1End: string;
    term2Start: string;
    term2End: string;
  };
  gradingScale: string;
  attendanceThreshold: number;
  classSize: {
    min: number;
    max: number;
  };
}

interface NotificationSettings {
  emailNotifications: boolean;
  smsNotifications: boolean;
  parentNotifications: boolean;
  teacherNotifications: boolean;
  dailyReports: boolean;
  weeklyReports: boolean;
  newStudentAlert: boolean;
  attendanceAlert: boolean;
  performanceAlert: boolean;
}

interface AppearanceSettings {
  theme: 'light' | 'dark' | 'system';
  primaryColor: string;
  logoUrl: string;
  fontSize: 'small' | 'medium' | 'large';
  compactMode: boolean;
}

export default function SchoolSettings() {
  const [activeTab, setActiveTab] = useState<'profile' | 'academic' | 'notifications' | 'appearance' | 'data'>('profile');
  const [hasChanges, setHasChanges] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  
  const [schoolProfile, setSchoolProfile] = useState<SchoolProfile>({
    name: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    principalName: '',
    establishedYear: '',
    studentCapacity: 100,
    timezone: 'UTC',
    language: 'en'
  });
  
  const [academicSettings, setAcademicSettings] = useState<AcademicSettings>({
    academicYear: '2024-2025',
    termDates: {
      term1Start: '',
      term1End: '',
      term2Start: '',
      term2End: ''
    },
    gradingScale: 'percentage',
    attendanceThreshold: 75,
    classSize: {
      min: 5,
      max: 30
    }
  });
  
  const [notifications, setNotifications] = useState<NotificationSettings>({
    emailNotifications: true,
    smsNotifications: false,
    parentNotifications: true,
    teacherNotifications: true,
    dailyReports: false,
    weeklyReports: true,
    newStudentAlert: true,
    attendanceAlert: true,
    performanceAlert: true
  });
  
  const [appearance, setAppearance] = useState<AppearanceSettings>({
    theme: 'light',
    primaryColor: '#3B82F6',
    logoUrl: '',
    fontSize: 'medium',
    compactMode: false
  });
  
  // Load settings from localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem('schoolSettings');
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      if (settings.schoolProfile) setSchoolProfile(settings.schoolProfile);
      if (settings.academicSettings) setAcademicSettings(settings.academicSettings);
      if (settings.notifications) setNotifications(settings.notifications);
      if (settings.appearance) setAppearance(settings.appearance);
    }
  }, []);
  
  // Save settings to localStorage
  const saveSettings = () => {
    setSaveStatus('saving');
    const settings = {
      schoolProfile,
      academicSettings,
      notifications,
      appearance,
      savedAt: new Date().toISOString()
    };
    localStorage.setItem('schoolSettings', JSON.stringify(settings));
    
    setTimeout(() => {
      setSaveStatus('saved');
      setHasChanges(false);
      setTimeout(() => setSaveStatus('idle'), 2000);
    }, 500);
  };
  
  const handleProfileChange = (field: keyof SchoolProfile, value: any) => {
    setSchoolProfile(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };
  
  const handleAcademicChange = (field: string, value: any) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setAcademicSettings(prev => ({
        ...prev,
        [parent]: { ...(prev[parent as keyof AcademicSettings] as any), [child]: value }
      }));
    } else {
      setAcademicSettings(prev => ({ ...prev, [field]: value }));
    }
    setHasChanges(true);
  };
  
  const handleNotificationToggle = (field: keyof NotificationSettings) => {
    setNotifications(prev => ({ ...prev, [field]: !prev[field] }));
    setHasChanges(true);
  };
  
  const handleAppearanceChange = (field: keyof AppearanceSettings, value: any) => {
    setAppearance(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
    
    // Apply theme immediately
    if (field === 'theme') {
      document.documentElement.classList.toggle('dark', value === 'dark');
    }
  };
  
  const exportData = () => {
    const allData = {
      settings: { schoolProfile, academicSettings, notifications, appearance },
      messages: JSON.parse(localStorage.getItem('schoolMessages') || '[]'),
      security: JSON.parse(localStorage.getItem('schoolSecurity') || '{}'),
      exportedAt: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(allData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `school-data-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };
  
  const importData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.settings) {
          if (data.settings.schoolProfile) setSchoolProfile(data.settings.schoolProfile);
          if (data.settings.academicSettings) setAcademicSettings(data.settings.academicSettings);
          if (data.settings.notifications) setNotifications(data.settings.notifications);
          if (data.settings.appearance) setAppearance(data.settings.appearance);
        }
        if (data.messages) localStorage.setItem('schoolMessages', JSON.stringify(data.messages));
        if (data.security) localStorage.setItem('schoolSecurity', JSON.stringify(data.security));
        
        setHasChanges(true);
        alert('Data imported successfully!');
      } catch (err) {
        alert('Failed to import data. Please check the file format.');
      }
    };
    reader.readAsText(file);
  };
  
  const clearAllData = () => {
    if (confirm('Are you sure you want to clear ALL data? This cannot be undone.')) {
      localStorage.clear();
      window.location.reload();
    }
  };
  
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
        <p className="text-sm text-gray-600 mt-1">Configure your school management system</p>
      </div>
      
      <div className="flex gap-6">
        {/* Sidebar */}
        <div className="w-64 space-y-1">
          <button
            onClick={() => setActiveTab('profile')}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors ${
              activeTab === 'profile' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center gap-3">
              <School className="w-5 h-5" />
              <span>School Profile</span>
            </div>
            <ChevronRight className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => setActiveTab('academic')}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors ${
              activeTab === 'academic' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5" />
              <span>Academic</span>
            </div>
            <ChevronRight className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => setActiveTab('notifications')}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors ${
              activeTab === 'notifications' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5" />
              <span>Notifications</span>
            </div>
            <ChevronRight className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => setActiveTab('appearance')}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors ${
              activeTab === 'appearance' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center gap-3">
              <Palette className="w-5 h-5" />
              <span>Appearance</span>
            </div>
            <ChevronRight className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => setActiveTab('data')}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors ${
              activeTab === 'data' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center gap-3">
              <Database className="w-5 h-5" />
              <span>Data Management</span>
            </div>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        
        {/* Content */}
        <div className="flex-1 bg-white rounded-xl border p-6">
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold mb-4">School Profile</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">School Name</label>
                  <input
                    type="text"
                    value={schoolProfile.name}
                    onChange={(e) => handleProfileChange('name', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter school name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={schoolProfile.email}
                    onChange={(e) => handleProfileChange('email', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="school@example.com"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={schoolProfile.phone}
                    onChange={(e) => handleProfileChange('phone', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="+1 234 567 8900"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                  <input
                    type="url"
                    value={schoolProfile.website}
                    onChange={(e) => handleProfileChange('website', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="https://school.com"
                  />
                </div>
                
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <textarea
                    value={schoolProfile.address}
                    onChange={(e) => handleProfileChange('address', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    rows={2}
                    placeholder="Enter school address"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Principal Name</label>
                  <input
                    type="text"
                    value={schoolProfile.principalName}
                    onChange={(e) => handleProfileChange('principalName', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter principal name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Established Year</label>
                  <input
                    type="text"
                    value={schoolProfile.establishedYear}
                    onChange={(e) => handleProfileChange('establishedYear', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="2020"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Student Capacity</label>
                  <input
                    type="number"
                    value={schoolProfile.studentCapacity}
                    onChange={(e) => handleProfileChange('studentCapacity', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
                  <select
                    value={schoolProfile.timezone}
                    onChange={(e) => handleProfileChange('timezone', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="UTC">UTC</option>
                    <option value="EST">EST</option>
                    <option value="PST">PST</option>
                    <option value="GMT">GMT</option>
                  </select>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'academic' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold mb-4">Academic Settings</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Academic Year</label>
                  <input
                    type="text"
                    value={academicSettings.academicYear}
                    onChange={(e) => handleAcademicChange('academicYear', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="2024-2025"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Term Dates</label>
                  <div className="grid grid-cols-2 gap-4 pl-4">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Term 1 Start</label>
                      <input
                        type="date"
                        value={academicSettings.termDates.term1Start}
                        onChange={(e) => handleAcademicChange('termDates.term1Start', e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Term 1 End</label>
                      <input
                        type="date"
                        value={academicSettings.termDates.term1End}
                        onChange={(e) => handleAcademicChange('termDates.term1End', e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Term 2 Start</label>
                      <input
                        type="date"
                        value={academicSettings.termDates.term2Start}
                        onChange={(e) => handleAcademicChange('termDates.term2Start', e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Term 2 End</label>
                      <input
                        type="date"
                        value={academicSettings.termDates.term2End}
                        onChange={(e) => handleAcademicChange('termDates.term2End', e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Grading Scale</label>
                  <select
                    value={academicSettings.gradingScale}
                    onChange={(e) => handleAcademicChange('gradingScale', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="percentage">Percentage (0-100%)</option>
                    <option value="letter">Letter Grade (A-F)</option>
                    <option value="points">Points (0-4.0)</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Attendance Threshold ({academicSettings.attendanceThreshold}%)
                  </label>
                  <input
                    type="range"
                    min="50"
                    max="100"
                    value={academicSettings.attendanceThreshold}
                    onChange={(e) => handleAcademicChange('attendanceThreshold', parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Class Size Limits</label>
                  <div className="grid grid-cols-2 gap-4 pl-4">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Minimum Students</label>
                      <input
                        type="number"
                        value={academicSettings.classSize.min}
                        onChange={(e) => handleAcademicChange('classSize.min', parseInt(e.target.value))}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Maximum Students</label>
                      <input
                        type="number"
                        value={academicSettings.classSize.max}
                        onChange={(e) => handleAcademicChange('classSize.max', parseInt(e.target.value))}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold mb-4">Notification Preferences</h3>
              
              <div className="space-y-4">
                <div className="border-b pb-4">
                  <h4 className="font-medium mb-3">Communication Channels</h4>
                  <div className="space-y-3">
                    <label className="flex items-center justify-between">
                      <span className="text-sm">Email Notifications</span>
                      <button
                        onClick={() => handleNotificationToggle('emailNotifications')}
                        className={`w-12 h-6 rounded-full transition-colors ${
                          notifications.emailNotifications ? 'bg-blue-500' : 'bg-gray-300'
                        }`}
                      >
                        <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                          notifications.emailNotifications ? 'translate-x-6' : 'translate-x-0.5'
                        }`} />
                      </button>
                    </label>
                    
                    <label className="flex items-center justify-between">
                      <span className="text-sm">SMS Notifications</span>
                      <button
                        onClick={() => handleNotificationToggle('smsNotifications')}
                        className={`w-12 h-6 rounded-full transition-colors ${
                          notifications.smsNotifications ? 'bg-blue-500' : 'bg-gray-300'
                        }`}
                      >
                        <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                          notifications.smsNotifications ? 'translate-x-6' : 'translate-x-0.5'
                        }`} />
                      </button>
                    </label>
                  </div>
                </div>
                
                <div className="border-b pb-4">
                  <h4 className="font-medium mb-3">Recipients</h4>
                  <div className="space-y-3">
                    <label className="flex items-center justify-between">
                      <span className="text-sm">Parent Notifications</span>
                      <button
                        onClick={() => handleNotificationToggle('parentNotifications')}
                        className={`w-12 h-6 rounded-full transition-colors ${
                          notifications.parentNotifications ? 'bg-blue-500' : 'bg-gray-300'
                        }`}
                      >
                        <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                          notifications.parentNotifications ? 'translate-x-6' : 'translate-x-0.5'
                        }`} />
                      </button>
                    </label>
                    
                    <label className="flex items-center justify-between">
                      <span className="text-sm">Teacher Notifications</span>
                      <button
                        onClick={() => handleNotificationToggle('teacherNotifications')}
                        className={`w-12 h-6 rounded-full transition-colors ${
                          notifications.teacherNotifications ? 'bg-blue-500' : 'bg-gray-300'
                        }`}
                      >
                        <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                          notifications.teacherNotifications ? 'translate-x-6' : 'translate-x-0.5'
                        }`} />
                      </button>
                    </label>
                  </div>
                </div>
                
                <div className="border-b pb-4">
                  <h4 className="font-medium mb-3">Reports</h4>
                  <div className="space-y-3">
                    <label className="flex items-center justify-between">
                      <span className="text-sm">Daily Reports</span>
                      <button
                        onClick={() => handleNotificationToggle('dailyReports')}
                        className={`w-12 h-6 rounded-full transition-colors ${
                          notifications.dailyReports ? 'bg-blue-500' : 'bg-gray-300'
                        }`}
                      >
                        <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                          notifications.dailyReports ? 'translate-x-6' : 'translate-x-0.5'
                        }`} />
                      </button>
                    </label>
                    
                    <label className="flex items-center justify-between">
                      <span className="text-sm">Weekly Reports</span>
                      <button
                        onClick={() => handleNotificationToggle('weeklyReports')}
                        className={`w-12 h-6 rounded-full transition-colors ${
                          notifications.weeklyReports ? 'bg-blue-500' : 'bg-gray-300'
                        }`}
                      >
                        <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                          notifications.weeklyReports ? 'translate-x-6' : 'translate-x-0.5'
                        }`} />
                      </button>
                    </label>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-3">Alerts</h4>
                  <div className="space-y-3">
                    <label className="flex items-center justify-between">
                      <span className="text-sm">New Student Enrollment</span>
                      <button
                        onClick={() => handleNotificationToggle('newStudentAlert')}
                        className={`w-12 h-6 rounded-full transition-colors ${
                          notifications.newStudentAlert ? 'bg-blue-500' : 'bg-gray-300'
                        }`}
                      >
                        <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                          notifications.newStudentAlert ? 'translate-x-6' : 'translate-x-0.5'
                        }`} />
                      </button>
                    </label>
                    
                    <label className="flex items-center justify-between">
                      <span className="text-sm">Attendance Issues</span>
                      <button
                        onClick={() => handleNotificationToggle('attendanceAlert')}
                        className={`w-12 h-6 rounded-full transition-colors ${
                          notifications.attendanceAlert ? 'bg-blue-500' : 'bg-gray-300'
                        }`}
                      >
                        <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                          notifications.attendanceAlert ? 'translate-x-6' : 'translate-x-0.5'
                        }`} />
                      </button>
                    </label>
                    
                    <label className="flex items-center justify-between">
                      <span className="text-sm">Performance Alerts</span>
                      <button
                        onClick={() => handleNotificationToggle('performanceAlert')}
                        className={`w-12 h-6 rounded-full transition-colors ${
                          notifications.performanceAlert ? 'bg-blue-500' : 'bg-gray-300'
                        }`}
                      >
                        <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                          notifications.performanceAlert ? 'translate-x-6' : 'translate-x-0.5'
                        }`} />
                      </button>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'appearance' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold mb-4">Appearance Settings</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Theme</label>
                  <div className="flex gap-4">
                    <button
                      onClick={() => handleAppearanceChange('theme', 'light')}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-colors ${
                        appearance.theme === 'light' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                      }`}
                    >
                      <Sun className="w-5 h-5" />
                      <span>Light</span>
                    </button>
                    
                    <button
                      onClick={() => handleAppearanceChange('theme', 'dark')}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-colors ${
                        appearance.theme === 'dark' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                      }`}
                    >
                      <Moon className="w-5 h-5" />
                      <span>Dark</span>
                    </button>
                    
                    <button
                      onClick={() => handleAppearanceChange('theme', 'system')}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-colors ${
                        appearance.theme === 'system' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                      }`}
                    >
                      <Settings className="w-5 h-5" />
                      <span>System</span>
                    </button>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Primary Color</label>
                  <div className="flex items-center gap-4">
                    <input
                      type="color"
                      value={appearance.primaryColor}
                      onChange={(e) => handleAppearanceChange('primaryColor', e.target.value)}
                      className="w-20 h-10 border rounded cursor-pointer"
                    />
                    <span className="text-sm text-gray-600">{appearance.primaryColor}</span>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Logo URL</label>
                  <input
                    type="url"
                    value={appearance.logoUrl}
                    onChange={(e) => handleAppearanceChange('logoUrl', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="https://example.com/logo.png"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Font Size</label>
                  <div className="flex gap-4">
                    <button
                      onClick={() => handleAppearanceChange('fontSize', 'small')}
                      className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                        appearance.fontSize === 'small' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                      }`}
                    >
                      Small
                    </button>
                    
                    <button
                      onClick={() => handleAppearanceChange('fontSize', 'medium')}
                      className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                        appearance.fontSize === 'medium' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                      }`}
                    >
                      Medium
                    </button>
                    
                    <button
                      onClick={() => handleAppearanceChange('fontSize', 'large')}
                      className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                        appearance.fontSize === 'large' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                      }`}
                    >
                      Large
                    </button>
                  </div>
                </div>
                
                <div>
                  <label className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Compact Mode</span>
                    <button
                      onClick={() => handleAppearanceChange('compactMode', !appearance.compactMode)}
                      className={`w-12 h-6 rounded-full transition-colors ${
                        appearance.compactMode ? 'bg-blue-500' : 'bg-gray-300'
                      }`}
                    >
                      <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                        appearance.compactMode ? 'translate-x-6' : 'translate-x-0.5'
                      }`} />
                    </button>
                  </label>
                  <p className="text-xs text-gray-500 mt-1">Reduce spacing and padding for more content density</p>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'data' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold mb-4">Data Management</h3>
              
              <div className="space-y-6">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-blue-900">Data Privacy</h4>
                      <p className="text-sm text-blue-700 mt-1">
                        All data is stored locally in your browser. No information is sent to external servers.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-3">Export Data</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    Download all your data including settings, messages, and security configurations.
                  </p>
                  <button
                    onClick={exportData}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Export All Data
                  </button>
                </div>
                
                <div>
                  <h4 className="font-medium mb-3">Import Data</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    Restore data from a previously exported file.
                  </p>
                  <input
                    type="file"
                    accept=".json"
                    onChange={importData}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                </div>
                
                <div className="pt-6 border-t">
                  <h4 className="font-medium mb-3 text-red-600">Danger Zone</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    Clear all data from your browser. This action cannot be undone.
                  </p>
                  <button
                    onClick={clearAllData}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Clear All Data
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Save Button */}
      {hasChanges && (
        <div className="fixed bottom-6 right-6 flex items-center gap-3">
          {saveStatus === 'saved' && (
            <span className="text-green-600 text-sm">Settings saved!</span>
          )}
          <button
            onClick={saveSettings}
            disabled={saveStatus === 'saving'}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2 shadow-lg"
          >
            <Save className="w-5 h-5" />
            {saveStatus === 'saving' ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      )}
    </div>
  );
}