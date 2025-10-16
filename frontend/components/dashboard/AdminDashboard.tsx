'use client';

import { useState, useEffect } from 'react';
import { 
  Users, 
  School, 
  BookOpen, 
  TrendingUp, 
  Calendar,
  DollarSign,
  Activity,
  Award,
  Bell,
  Settings,
  Download,
  Plus,
  Filter,
  Search,
  MoreVertical,
  ChevronUp,
  ChevronDown,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  BarChart3,
  PieChart,
  FileText,
  Mail,
  UserPlus,
  GraduationCap,
  Target,
  Zap,
  Shield,
  Database,
  Globe,
  Layers
} from 'lucide-react';

export default function AdminDashboard() {
  const [selectedPeriod, setSelectedPeriod] = useState('week');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [showNotifications, setShowNotifications] = useState(false);

  // Mock data - in production, this would come from API
  const stats = {
    totalSchools: 12,
    totalUsers: 1847,
    totalTeachers: 156,
    totalStudents: 1425,
    totalParents: 266,
    activeClasses: 89,
    completionRate: 78.5,
    avgDailyActive: 1234,
    revenue: 45780,
    growth: 12.5
  };

  const recentActivities = [
    { id: 1, type: 'user_joined', user: 'Ahmad Hassan', school: 'Al-Noor Academy', time: '5 min ago', icon: UserPlus, color: 'text-green-600 bg-green-100' },
    { id: 2, type: 'assignment_created', user: 'Teacher Sarah', details: 'Surah Al-Baqarah verses 1-20', time: '15 min ago', icon: FileText, color: 'text-blue-600 bg-blue-100' },
    { id: 3, type: 'milestone', user: 'Student Ali', details: 'Completed Juz 30', time: '1 hour ago', icon: Award, color: 'text-purple-600 bg-purple-100' },
    { id: 4, type: 'school_added', school: 'Dar Al-Hikmah', time: '2 hours ago', icon: School, color: 'text-orange-600 bg-orange-100' },
    { id: 5, type: 'payment', school: 'Al-Furqan Institute', amount: '$1,200', time: '3 hours ago', icon: DollarSign, color: 'text-emerald-600 bg-emerald-100' },
  ];

  const schools = [
    { id: 1, name: 'Al-Noor Academy', location: 'New York, USA', students: 245, teachers: 18, status: 'active', subscription: 'Premium', revenue: 4500 },
    { id: 2, name: 'Dar Al-Hikmah', location: 'London, UK', students: 189, teachers: 14, status: 'active', subscription: 'Standard', revenue: 2800 },
    { id: 3, name: 'Al-Furqan Institute', location: 'Toronto, Canada', students: 312, teachers: 22, status: 'active', subscription: 'Premium', revenue: 5200 },
    { id: 4, name: 'Masjid Al-Rahman', location: 'Chicago, USA', students: 98, teachers: 8, status: 'trial', subscription: 'Trial', revenue: 0 },
    { id: 5, name: 'Islamic Learning Center', location: 'Sydney, Australia', students: 156, teachers: 12, status: 'active', subscription: 'Standard', revenue: 2100 },
  ];

  const topPerformers = [
    { id: 1, name: 'Fatima Al-Zahra', school: 'Al-Noor Academy', progress: 95, memorized: '28 Juz', streak: 45 },
    { id: 2, name: 'Abdullah Khan', school: 'Dar Al-Hikmah', progress: 92, memorized: '25 Juz', streak: 38 },
    { id: 3, name: 'Aisha Ibrahim', school: 'Al-Furqan Institute', progress: 89, memorized: '22 Juz', streak: 52 },
    { id: 4, name: 'Omar Hassan', school: 'Al-Noor Academy', progress: 87, memorized: '20 Juz', streak: 31 },
    { id: 5, name: 'Maryam Ahmed', school: 'Islamic Learning Center', progress: 85, memorized: '18 Juz', streak: 28 },
  ];

  const notifications = [
    { id: 1, type: 'warning', message: '3 schools have pending payments', time: '1 hour ago' },
    { id: 2, type: 'info', message: 'System maintenance scheduled for tonight', time: '2 hours ago' },
    { id: 3, type: 'success', message: '15 new users joined today', time: '3 hours ago' },
    { id: 4, type: 'alert', message: 'Server CPU usage above 80%', time: '4 hours ago' },
  ];

  // Chart data
  const chartData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    values: [1250, 1380, 1290, 1450, 1520, 1680, 1590]
  };

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome back! Here's what's happening with QuranAkh today.</p>
        </div>
        <div className="flex items-center space-x-3">
          {/* Period Selector */}
          <select 
            value={selectedPeriod} 
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="day">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="year">This Year</option>
          </select>

          {/* Notifications */}
          <div className="relative">
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 bg-white rounded-lg border border-gray-300 hover:bg-gray-50 relative"
            >
              <Bell className="w-5 h-5 text-gray-600" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
            </button>
            
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
                <div className="p-4 border-b">
                  <h3 className="font-semibold">Notifications</h3>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notifications.map((notif: any) => (
                    <div key={notif.id} className="p-4 border-b hover:bg-gray-50">
                      <div className="flex items-start space-x-3">
                        <AlertCircle className={`w-5 h-5 mt-0.5 ${
                          notif.type === 'warning' ? 'text-yellow-500' :
                          notif.type === 'alert' ? 'text-red-500' :
                          notif.type === 'success' ? 'text-green-500' :
                          'text-blue-500'
                        }`} />
                        <div className="flex-1">
                          <p className="text-sm text-gray-900">{notif.message}</p>
                          <p className="text-xs text-gray-500 mt-1">{notif.time}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Export Button */}
          <button className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
            <Download className="w-4 h-4" />
            <span className="text-sm">Export</span>
          </button>

          {/* Add New Button */}
          <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Plus className="w-4 h-4" />
            <span className="text-sm">Add School</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {['overview', 'schools', 'users', 'analytics', 'settings'].map((tab: any) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 px-1 border-b-2 font-medium text-sm capitalize ${
                activeTab === tab
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Schools */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Schools</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalSchools}</p>
              <p className="text-sm text-green-600 mt-2 flex items-center">
                <ChevronUp className="w-4 h-4 mr-1" />
                +2 this month
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <School className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Total Users */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Users</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalUsers.toLocaleString()}</p>
              <p className="text-sm text-green-600 mt-2 flex items-center">
                <ChevronUp className="w-4 h-4 mr-1" />
                +{stats.growth}% growth
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        {/* Active Classes */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Classes</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.activeClasses}</p>
              <p className="text-sm text-gray-500 mt-2">
                {stats.totalTeachers} teachers
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        {/* Monthly Revenue */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Monthly Revenue</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">${stats.revenue.toLocaleString()}</p>
              <p className="text-sm text-green-600 mt-2 flex items-center">
                <ChevronUp className="w-4 h-4 mr-1" />
                +18% vs last month
              </p>
            </div>
            <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Second Row Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Completion Rate */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-sm p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100">Average Completion Rate</p>
              <p className="text-4xl font-bold mt-2">{stats.completionRate}%</p>
              <div className="mt-4 bg-blue-400 bg-opacity-30 rounded-full h-2">
                <div className="bg-white rounded-full h-2" style={{ width: `${stats.completionRate}%` }}></div>
              </div>
            </div>
            <Target className="w-8 h-8 text-blue-200" />
          </div>
        </div>

        {/* Daily Active Users */}
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl shadow-sm p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100">Daily Active Users</p>
              <p className="text-4xl font-bold mt-2">{stats.avgDailyActive.toLocaleString()}</p>
              <p className="text-sm text-purple-200 mt-2">Peak: 2:00 PM - 4:00 PM</p>
            </div>
            <Activity className="w-8 h-8 text-purple-200" />
          </div>
        </div>

        {/* System Health */}
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl shadow-sm p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100">System Health</p>
              <p className="text-4xl font-bold mt-2">98.5%</p>
              <p className="text-sm text-green-200 mt-2">All systems operational</p>
            </div>
            <Shield className="w-8 h-8 text-green-200" />
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Schools Table */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Schools Overview</h2>
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search schools..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 pr-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <button className="p-1.5 hover:bg-gray-100 rounded">
                  <Filter className="w-4 h-4 text-gray-600" />
                </button>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">School</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Students</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Teachers</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plan</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {schools.map((school: any) => (
                  <tr key={school.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{school.name}</p>
                        <p className="text-xs text-gray-500">{school.location}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-900">{school.students}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-900">{school.teachers}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        school.subscription === 'Premium' ? 'bg-purple-100 text-purple-700' :
                        school.subscription === 'Standard' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {school.subscription}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-gray-900">${school.revenue.toLocaleString()}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <button className="p-1 hover:bg-gray-100 rounded">
                          <Eye className="w-4 h-4 text-gray-600" />
                        </button>
                        <button className="p-1 hover:bg-gray-100 rounded">
                          <Edit className="w-4 h-4 text-gray-600" />
                        </button>
                        <button className="p-1 hover:bg-gray-100 rounded">
                          <MoreVertical className="w-4 h-4 text-gray-600" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
          </div>
          <div className="p-6 space-y-4 max-h-96 overflow-y-auto">
            {recentActivities.map((activity: any) => (
              <div key={activity.id} className="flex items-start space-x-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${activity.color}`}>
                  <activity.icon className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-900">
                    <span className="font-medium">{activity.user || activity.school}</span>
                    {activity.details && <span className="text-gray-600"> - {activity.details}</span>}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Growth Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">User Growth</h2>
            <BarChart3 className="w-5 h-5 text-gray-400" />
          </div>
          <div className="h-64 flex items-end justify-between space-x-2">
            {chartData.values.map((value: any, index: any) => (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div 
                  className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t hover:from-blue-600 hover:to-blue-500 transition-all cursor-pointer"
                  style={{ height: `${(value / Math.max(...chartData.values)) * 100}%` }}
                ></div>
                <span className="text-xs text-gray-500 mt-2">{chartData.labels[index as number]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Performers */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Top Performers</h2>
              <Award className="w-5 h-5 text-yellow-500" />
            </div>
          </div>
          <div className="p-6 space-y-4">
            {topPerformers.map((student: any, index: any) => (
              <div key={student.id} className="flex items-center space-x-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                  index === 0 ? 'bg-yellow-500' :
                  index === 1 ? 'bg-gray-400' :
                  index === 2 ? 'bg-orange-600' :
                  'bg-gray-300'
                }`}>
                  {index + 1}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{student.name}</p>
                  <p className="text-xs text-gray-500">{student.school} • {student.memorized}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">{student.progress}%</p>
                  <p className="text-xs text-gray-500">{student.streak} day streak</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-sm p-6 text-white">
        <h2 className="text-xl font-semibold mb-6">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button className="bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg p-4 flex flex-col items-center space-y-2 transition-all">
            <UserPlus className="w-6 h-6" />
            <span className="text-sm">Add User</span>
          </button>
          <button className="bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg p-4 flex flex-col items-center space-y-2 transition-all">
            <School className="w-6 h-6" />
            <span className="text-sm">Add School</span>
          </button>
          <button className="bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg p-4 flex flex-col items-center space-y-2 transition-all">
            <FileText className="w-6 h-6" />
            <span className="text-sm">Generate Report</span>
          </button>
          <button className="bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg p-4 flex flex-col items-center space-y-2 transition-all">
            <Mail className="w-6 h-6" />
            <span className="text-sm">Send Announcement</span>
          </button>
        </div>
      </div>

      {/* System Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-4 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Server Status</p>
              <p className="text-sm font-semibold text-green-600 mt-1">Operational</p>
            </div>
            <Zap className="w-5 h-5 text-green-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Database</p>
              <p className="text-sm font-semibold text-gray-900 mt-1">45.2 GB / 100 GB</p>
            </div>
            <Database className="w-5 h-5 text-blue-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">API Calls Today</p>
              <p className="text-sm font-semibold text-gray-900 mt-1">24,567</p>
            </div>
            <Globe className="w-5 h-5 text-purple-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Active Sessions</p>
              <p className="text-sm font-semibold text-gray-900 mt-1">1,234</p>
            </div>
            <Layers className="w-5 h-5 text-orange-500" />
          </div>
        </div>
      </div>
    </div>
  );
}