'use client';

import { 
  TrendingUp, 
  Users, 
  GraduationCap, 
  BookOpen, 
  Calendar,
  Activity,
  MessageSquare,
  Award,
  AlertCircle,
  ArrowUp,
  ArrowDown,
  Clock,
  CheckCircle,
  Clipboard
} from 'lucide-react';
import { useTeacherStore } from '../state/useTeacherStore';
import { useEffect } from 'react';
import { motion } from 'framer-motion';
import TeacherOnboarding from '@/components/onboarding/TeacherOnboarding';

export default function TeacherDashboard() {
  const { students, classes, assignments, messages, setActiveView } = useTeacherStore();

  // Show onboarding if no data exists
  if (students.length === 0 && classes.length === 0 && assignments.length === 0) {
    return <TeacherOnboarding />;
  }
  
  const stats = {
    totalStudents: students.length,
    activeClasses: classes.length,
    pendingAssignments: assignments.filter(a => a.status === 'active').length,
    unreadMessages: messages.filter(m => !m.read).length
  };
  
  const statCards = [
    {
      label: 'My Students',
      value: stats.totalStudents,
      change: stats.totalStudents > 0 ? `+${Math.round(stats.totalStudents * 0.1)}` : '0',
      trend: 'up' as const,
      icon: GraduationCap,
      color: 'blue'
    },
    {
      label: 'Active Classes',
      value: stats.activeClasses,
      change: '0',
      trend: 'up' as const,
      icon: BookOpen,
      color: 'purple'
    },
    {
      label: 'Pending Assignments',
      value: stats.pendingAssignments,
      change: '0',
      trend: 'down' as const,
      icon: Clipboard,
      color: 'orange'
    },
    {
      label: 'Parent Messages',
      value: stats.unreadMessages,
      change: '0',
      trend: 'up' as const,
      icon: MessageSquare,
      color: 'green'
    }
  ];
  
  const recentActivities = assignments.slice(0, 5).map(a => ({
    id: a.id,
    type: 'assignment',
    text: `New assignment: ${a.title}`,
    time: 'Just now'
  }));
  
  const todaysSchedule = classes.slice(0, 3).map(c => ({
    id: c.id,
    title: c.name,
    time: c.schedule || '9:00 AM',
    type: 'class'
  }));
  
  return (
    <div className="p-6 space-y-6" data-tour-target="dashboard-section">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Teacher Dashboard</h2>
        <p className="text-sm text-gray-600 mt-1">Welcome back! Here\'s your teaching overview for today.</p>
      </div>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          const bgColor = {
            blue: 'bg-blue-100',
            green: 'bg-green-100',
            purple: 'bg-purple-100',
            orange: 'bg-orange-100'
          }[stat.color];
          const iconColor = {
            blue: 'text-blue-600',
            green: 'text-green-600',
            purple: 'text-purple-600',
            orange: 'text-orange-600'
          }[stat.color];
          
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-xl border p-6 hover:shadow-lg transition-shadow"
              data-tour-target={index === 0 ? 'students-section' : index === 1 ? 'classes-section' : index === 2 ? 'assignments-section' : 'messages-section'}
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
        {/* Progress Overview */}
        <div className="lg:col-span-2 bg-white rounded-xl border p-6" data-tour-target="progress-section">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Student Progress Overview</h3>
            <select className="text-sm border border-gray-200 rounded-lg px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option>This Week</option>
              <option>This Month</option>
              <option>This Term</option>
            </select>
          </div>
          
          {students.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No students assigned yet</p>
              <p className="text-sm text-gray-400 mt-1">Students will appear here once assigned by your school</p>
            </div>
          ) : (
            <div className="space-y-4">
              {[
                { name: 'Quran Memorization', value: 65 },
                { name: 'Tajweed Practice', value: 78 },
                { name: 'Recitation Quality', value: 82 },
                { name: 'Homework Completion', value: 90 }
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
                      className="h-full bg-gradient-to-r from-blue-500 to-indigo-600"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Today\'s Schedule */}
        <div className="bg-white rounded-xl border p-6" data-tour-target="schedule-section">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Today\'s Schedule</h3>
            <Calendar className="w-5 h-5 text-gray-400" />
          </div>
          
          <div className="space-y-3">
            {todaysSchedule.length === 0 ? (
              <div className="text-center py-6">
                <Clock className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No classes scheduled</p>
                <p className="text-xs text-gray-400 mt-1">Your schedule will appear here</p>
              </div>
            ) : (
              todaysSchedule.map(item => (
                <div key={item.id} className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{item.title}</p>
                      <p className="text-xs text-gray-500 mt-1">{item.time}</p>
                    </div>
                    <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700">
                      {item.type}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
          
          <button 
            onClick={() => setActiveView('schedule')}
            className="w-full mt-4 text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            View full schedule →
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
                <p className="text-xs text-gray-400 mt-1">Your teaching activities will appear here</p>
              </div>
            ) : (
              recentActivities.map(activity => (
                <div key={activity.id} className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full mt-1.5 bg-blue-500" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-800">{activity.text}</p>
                    <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        
        {/* Quick Actions */}
        <div className="bg-white rounded-xl border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          
          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={() => setActiveView('students')}
              className="p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors text-left"
            >
              <Users className="w-6 h-6 text-blue-600 mb-2" />
              <p className="text-sm font-medium text-gray-900">View Students</p>
              <p className="text-xs text-gray-500">Check progress</p>
            </button>
            
            <button 
              onClick={() => setActiveView('assignments')}
              className="p-4 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors text-left"
            >
              <Clipboard className="w-6 h-6 text-orange-600 mb-2" />
              <p className="text-sm font-medium text-gray-900">Assignments</p>
              <p className="text-xs text-gray-500">Create new task</p>
            </button>
            
            <button 
              onClick={() => setActiveView('messages')}
              className="p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors text-left"
            >
              <MessageSquare className="w-6 h-6 text-green-600 mb-2" />
              <p className="text-sm font-medium text-gray-900">Messages</p>
              <p className="text-xs text-gray-500">Contact parents</p>
            </button>
            
            <button 
              onClick={() => setActiveView('progress')}
              className="p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors text-left"
            >
              <Award className="w-6 h-6 text-purple-600 mb-2" />
              <p className="text-sm font-medium text-gray-900">Progress</p>
              <p className="text-xs text-gray-500">View reports</p>
            </button>
          </div>
        </div>
      </div>
      
    </div>
  );
}