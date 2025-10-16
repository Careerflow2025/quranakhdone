'use client';

import { useState } from 'react';
import {
  Users,
  UserPlus,
  GraduationCap,
  BookOpen,
  Calendar,
  Bell,
  Settings,
  Home,
  Search,
  Filter,
  Download,
  Upload,
  Edit,
  Trash2,
  MoreVertical,
  Check,
  AlertCircle,
  Clock,
  FileText,
  Award,
  TrendingUp,
  Eye,
  Mail,
  Phone,
  MapPin,
  BarChart3,
  ChevronRight,
  Folder,
  FolderOpen,
  LogOut,
  Menu,
  Shield,
  Key,
  CreditCard,
  DollarSign,
  Target,
  Activity,
  Zap,
  Package,
  Grid,
  List,
  ChevronDown,
  School,
  PieChart,
  Move,
  ArrowRight,
  X,
  CheckCircle,
  RefreshCw,
  Send,
  Plus
} from 'lucide-react';

export default function SchoolDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  
  // Mock data
  const schoolInfo = {
    name: 'Al-Noor Academy',
    id: 'SCH-001',
    location: 'New York, USA',
    established: '2015',
    principal: 'Dr. Ahmad Hassan',
    subscription: 'Premium',
    validUntil: '2025-12-31'
  };

  const stats = {
    totalStudents: 245,
    totalTeachers: 18,
    totalParents: 198,
    totalClasses: 12,
    activeAssignments: 156,
    completionRate: 82.5,
    attendanceToday: 94.2,
    upcomingEvents: 8
  };

  const tabs = ['overview', 'students', 'teachers', 'parents', 'classes', 'assignments', 'reports'];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                <School className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{schoolInfo.name}</h1>
                <p className="text-sm text-gray-500">School ID: {schoolInfo.id} • {schoolInfo.location}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button className="p-2 hover:bg-gray-100 rounded-lg">
                <Bell className="w-5 h-5 text-gray-600" />
              </button>
              <button className="p-2 hover:bg-gray-100 rounded-lg">
                <Settings className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b">
        <div className="px-6">
          <nav className="flex space-x-8">
            {tabs.map((tab: any) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-2 border-b-2 font-medium text-sm capitalize ${
                  activeTab === tab
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Total Students</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalStudents}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Total Teachers</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalTeachers}</p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <GraduationCap className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Active Assignments</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.activeAssignments}</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <FileText className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Attendance Today</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.attendanceToday}%</p>
                  </div>
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-orange-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Welcome Message */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-8 text-white">
              <h2 className="text-2xl font-bold mb-2">Welcome to Your School Dashboard</h2>
              <p className="text-blue-100">Manage your school efficiently with our comprehensive tools.</p>
            </div>
          </div>
        )}

        {activeTab === 'students' && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4">Students Management</h2>
            <p className="text-gray-600">Student management features will be displayed here.</p>
          </div>
        )}

        {activeTab === 'teachers' && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4">Teachers Management</h2>
            <p className="text-gray-600">Teacher management features will be displayed here.</p>
          </div>
        )}

        {activeTab === 'parents' && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4">Parents Management</h2>
            <p className="text-gray-600">Parent management features will be displayed here.</p>
          </div>
        )}

        {activeTab === 'classes' && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4">Classes Management</h2>
            <p className="text-gray-600">Class management features will be displayed here.</p>
          </div>
        )}

        {activeTab === 'assignments' && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4">Assignments Overview</h2>
            <p className="text-gray-600">Assignment monitoring features will be displayed here.</p>
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4">Reports & Analytics</h2>
            <p className="text-gray-600">Reports and analytics features will be displayed here.</p>
          </div>
        )}
      </div>
    </div>
  );
}