'use client';

import { 
  TrendingUp, 
  Users, 
  GraduationCap, 
  BookOpen, 
  DollarSign,
  Activity,
  Calendar,
  Award,
  AlertCircle,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { useSchoolStore } from '../state/useSchoolStore';
import { useEffect } from 'react';
import { motion } from 'framer-motion';
import SchoolOnboarding from '@/components/onboarding/SchoolOnboarding';

export default function SchoolDashboard() {
  const { stats, setStats, teachers, students, classes, activities, initializeSchoolData } = useSchoolStore();
  
  useEffect(() => {
    initializeSchoolData();
  }, []);
  
  useEffect(() => {
    // Calculate real stats from data
    const activeStudents = students.filter(s => s.status === 'active').length;
    const avgProgress = students.length > 0
      ? Math.round(students.reduce((acc, s) => acc + (typeof s.progress === 'number' ? s.progress : 0), 0) / students.length)
      : 0;

    setStats({
      totalTeachers: teachers.length,
      totalStudents: students.length,
      totalClasses: classes.length,
      activeStudents,
      avgProgress
    });
  }, [teachers, students, classes]);
  
  // Show onboarding if no data exists
  if (teachers.length === 0 && classes.length === 0 && students.length === 0) {
    return <SchoolOnboarding />;
  }
  
  const statCards = [
    {
      label: 'Total Students',
      value: stats?.totalStudents || 0,
      change: stats?.totalStudents > 0 ? `+${Math.round((stats.totalStudents / 100) * 12)}` : '0',
      trend: 'up' as const,
      icon: GraduationCap,
      color: 'blue'
    },
    {
      label: 'Active Teachers',
      value: stats?.totalTeachers || 0,
      change: stats?.totalTeachers > 0 ? `+${Math.round((stats.totalTeachers / 20) * 5)}` : '0',
      trend: 'up' as const,
      icon: Users,
      color: 'green'
    },
    {
      label: 'Total Classes',
      value: stats?.totalClasses || 0,
      change: stats?.totalClasses > 0 ? `+${Math.round((stats.totalClasses / 10) * 8)}` : '0',
      trend: 'up' as const,
      icon: BookOpen,
      color: 'purple'
    },
    {
      label: 'Avg Progress',
      value: `${stats?.avgProgress || 0}%`,
      change: stats?.avgProgress > 0 ? `+${Math.round(stats.avgProgress / 20)}%` : '0%',
      trend: 'up' as const,
      icon: TrendingUp,
      color: 'yellow'
    }
  ];
  
  // Use real activities from the store
  const recentActivities = activities || [];
  
  // Real upcoming events - empty when no events scheduled  
  const upcomingEvents: any[] = [];
  
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Dashboard Overview</h2>
        <p className="text-sm text-gray-600 mt-1">Welcome back! Here's what's happening in your school today.</p>
      </div>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          const bgColor = {
            blue: 'bg-blue-100',
            green: 'bg-green-100',
            purple: 'bg-purple-100',
            yellow: 'bg-yellow-100'
          }[stat.color];
          const iconColor = {
            blue: 'text-blue-600',
            green: 'text-green-600',
            purple: 'text-purple-600',
            yellow: 'text-yellow-600'
          }[stat.color];
          
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-xl border p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 ${bgColor} rounded-lg flex items-center justify-center`}>
                  <Icon className={`w-6 h-6 ${iconColor}`} />
                </div>
                <div className={`flex items-center gap-1 text-sm ${
                  stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {stat.trend === 'up' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
                  <span>{stat.change}</span>
                </div>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-sm text-gray-600 mt-1">{stat.label}</p>
              </div>
            </motion.div>
          );
        })}
      </div>
      
      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Performance Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl border p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Performance Overview</h3>
            <select className="text-sm border border-gray-200 rounded-lg px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option>Last 7 days</option>
              <option>Last 30 days</option>
              <option>Last 3 months</option>
            </select>
          </div>
          
          {/* Mock Chart */}
          <div className="space-y-4">
            {[
              { name: 'Student Progress', value: stats?.avgProgress || 0 },
              { name: 'Teacher Activity', value: teachers.filter(t => t.status === 'active').length > 0 ? Math.round((teachers.filter(t => t.status === 'active').length / teachers.length) * 100) : 0 },
              { name: 'Class Completion', value: classes.filter(c => c.status === 'active').length > 0 ? Math.round((classes.filter(c => c.status === 'active').length / classes.length) * 100) : 0 },
              { name: 'Parent Engagement', value: students.filter(s => s.parentEmail).length > 0 ? Math.round((students.filter(s => s.parentEmail).length / students.length) * 100) : 0 }
            ].map((metric, idx) => (
              <div key={idx}>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-gray-600">{metric.name}</span>
                  <span className="font-medium">{metric.value}%</span>
                </div>
                <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${metric.value}%` }}
                    transition={{ duration: 1, delay: idx * 0.1 }}
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-600"
                  />
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-6 pt-6 border-t grid grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats?.activeStudents || 0}</p>
              <p className="text-xs text-gray-500">Active</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats?.avgProgress || 0}%</p>
              <p className="text-xs text-gray-500">Avg Progress</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{teachers.filter(t => t.status === 'active').length}</p>
              <p className="text-xs text-gray-500">Active Teachers</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{classes.filter(c => c.status === 'active').length}</p>
              <p className="text-xs text-gray-500">Active Classes</p>
            </div>
          </div>
        </div>
        
        {/* Upcoming Events */}
        <div className="bg-white rounded-xl border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Upcoming Events</h3>
            <Calendar className="w-5 h-5 text-gray-400" />
          </div>
          
          <div className="space-y-3">
            {upcomingEvents.length === 0 ? (
              <div className="text-center py-6">
                <Calendar className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No upcoming events</p>
                <p className="text-xs text-gray-400 mt-1">Add events in the Calendar section</p>
              </div>
            ) : (
              upcomingEvents.map(event => (
                <div key={event.id} className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{event.title}</p>
                      <p className="text-xs text-gray-500 mt-1">{event.date}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      event.type === 'meeting' ? 'bg-blue-100 text-blue-700' :
                      event.type === 'competition' ? 'bg-green-100 text-green-700' :
                      'bg-purple-100 text-purple-700'
                    }`}>
                      {event.type}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
          
          <button className="w-full mt-4 text-sm text-blue-600 hover:text-blue-700 font-medium">
            View full calendar →
          </button>
        </div>
      </div>
      
      {/* Recent Activity & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-white rounded-xl border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
            <Activity className="w-5 h-5 text-gray-400" />
          </div>
          
          <div className="space-y-3">
            {recentActivities.length === 0 ? (
              <div className="text-center py-8">
                <Activity className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-500">No recent activity</p>
                <p className="text-xs text-gray-400 mt-1">Activities will appear here when you add students, teachers, or classes</p>
              </div>
            ) : (
              recentActivities.map(activity => (
                <div key={activity.id} className="flex items-start gap-3">
                  <div className={`w-2 h-2 rounded-full mt-1.5 ${
                    activity.type === 'student' ? 'bg-blue-500' :
                    activity.type === 'teacher' ? 'bg-green-500' :
                    activity.type === 'event' ? 'bg-purple-500' :
                    activity.type === 'achievement' ? 'bg-yellow-500' :
                    'bg-gray-500'
                  }`} />
                  <div className="flex-1">
                    <p className="text-sm text-gray-800">{activity.text}</p>
                    <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                  </div>
                </div>
              ))
            )}
          </div>
          
          <button className="w-full mt-4 text-sm text-blue-600 hover:text-blue-700 font-medium">
            View all activity →
          </button>
        </div>
        
        {/* Quick Actions */}
        <div className="bg-white rounded-xl border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          
          <div className="grid grid-cols-2 gap-3">
            <button className="p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors text-left">
              <Users className="w-6 h-6 text-blue-600 mb-2" />
              <p className="text-sm font-medium text-gray-900">Add Teacher</p>
              <p className="text-xs text-gray-500">Onboard new staff</p>
            </button>
            
            <button className="p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors text-left">
              <GraduationCap className="w-6 h-6 text-green-600 mb-2" />
              <p className="text-sm font-medium text-gray-900">Enroll Student</p>
              <p className="text-xs text-gray-500">Add new student</p>
            </button>
            
            <button className="p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors text-left">
              <BookOpen className="w-6 h-6 text-purple-600 mb-2" />
              <p className="text-sm font-medium text-gray-900">Create Class</p>
              <p className="text-xs text-gray-500">Setup new class</p>
            </button>
            
            <button className="p-4 bg-yellow-50 hover:bg-yellow-100 rounded-lg transition-colors text-left">
              <Award className="w-6 h-6 text-yellow-600 mb-2" />
              <p className="text-sm font-medium text-gray-900">View Reports</p>
              <p className="text-xs text-gray-500">Analytics & insights</p>
            </button>
          </div>
          
          {/* Alert */}
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-900">Attention Required</p>
                <p className="text-xs text-amber-700 mt-1">3 teachers have pending schedule conflicts</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
    </div>
  );
}