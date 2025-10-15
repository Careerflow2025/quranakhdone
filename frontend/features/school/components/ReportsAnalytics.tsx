'use client';

import { useState } from 'react';
import { 
  TrendingUp,
  Download,
  Filter,
  Calendar,
  Users,
  BookOpen,
  Award,
  AlertCircle,
  FileText,
  BarChart3,
  PieChart
} from 'lucide-react';
import { useSchoolStore } from '../state/useSchoolStore';
import { motion } from 'framer-motion';

export default function ReportsAnalytics() {
  const { students, teachers, classes } = useSchoolStore();
  const [selectedReport, setSelectedReport] = useState<'overview' | 'students' | 'teachers' | 'classes'>('overview');
  const [dateRange, setDateRange] = useState('month');
  
  // Calculate real statistics
  const totalStudents = students.length;
  const activeStudents = students.filter(s => s.status === 'active').length;
  const avgProgress = students.length > 0
    ? Math.round(students.reduce((acc, s) => acc + (typeof s.progress === 'number' ? s.progress : 0), 0) / students.length)
    : 0;
  const avgAccuracy = students.length > 0
    ? Math.round(students.reduce((acc, s) => acc + (typeof s.progress === 'number' ? s.progress : 0), 0) / students.length)
    : 0;
  
  const totalTeachers = teachers.length;
  const activeTeachers = teachers.filter(t => t.status === 'active').length;
  const totalClasses = classes.length;
  const activeClasses = classes.filter(c => c.status === 'active').length;
  
  // Top performing students
  const topStudents = [...students]
    .sort((a, b) => (typeof b.progress === 'number' ? b.progress : 0) - (typeof a.progress === 'number' ? a.progress : 0))
    .slice(0, 5);
  
  // Classes with most students
  const classesWithCounts = classes.map(cls => ({
    ...cls,
    studentCount: students.filter(s => s.classId === cls.id).length
  })).sort((a, b) => b.studentCount - a.studentCount);
  
  const exportReport = () => {
    const reportData = {
      generatedAt: new Date().toISOString(),
      summary: {
        totalStudents,
        activeStudents,
        avgProgress,
        avgAccuracy,
        totalTeachers,
        activeTeachers,
        totalClasses,
        activeClasses
      },
      students: students.map(s => ({
        name: s.name,
        status: s.status,
        progress: `${typeof s.progress === 'number' ? Math.round(s.progress) : 0}%`,
        accuracy: `${typeof s.progress === 'number' ? Math.round(s.progress) : 0}%`,
        classes: classes.find(c => c.id === s.classId)?.name || ''
      })),
      teachers: teachers.map(t => ({
        name: t.name,
        status: t.status,
        classes: classes.filter(c => c.teacherId === t.id).length,
        students: students.filter(s => classes.some(c => c.id === s.classId && c.teacherId === t.id)).length
      })),
      classes: classesWithCounts.map(c => ({
        name: c.name,
        teacher: c.teacherName,
        students: c.studentCount,
        schedule: c.schedule
      }))
    };
    
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `school-report-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };
  
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Reports & Analytics</h2>
          <p className="text-sm text-gray-600 mt-1">Comprehensive insights into school performance</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="week">Last Week</option>
            <option value="month">Last Month</option>
            <option value="quarter">Last Quarter</option>
            <option value="year">Last Year</option>
          </select>
          <button
            onClick={exportReport}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export Report
          </button>
        </div>
      </div>
      
      {/* Report Tabs */}
      <div className="bg-white rounded-xl border">
        <div className="flex border-b">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'students', label: 'Students', icon: Users },
            { id: 'teachers', label: 'Teachers', icon: Award },
            { id: 'classes', label: 'Classes', icon: BookOpen }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setSelectedReport(tab.id as any)}
                className={`flex-1 px-4 py-3 flex items-center justify-center gap-2 transition-colors ${
                  selectedReport === tab.id
                    ? 'border-b-2 border-blue-500 text-blue-600 bg-blue-50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{tab.label}</span>
              </button>
            );
          })}
        </div>
        
        <div className="p-6">
          {selectedReport === 'overview' && (
            <div className="space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Users className="w-8 h-8 text-blue-600" />
                    <span className="text-2xl font-bold text-blue-900">{totalStudents}</span>
                  </div>
                  <p className="text-sm text-blue-700">Total Students</p>
                  <p className="text-xs text-blue-600 mt-1">{activeStudents} active</p>
                </div>
                
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <TrendingUp className="w-8 h-8 text-green-600" />
                    <span className="text-2xl font-bold text-green-900">{avgProgress}%</span>
                  </div>
                  <p className="text-sm text-green-700">Avg Progress</p>
                  <p className="text-xs text-green-600 mt-1">Across all students</p>
                </div>
                
                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Award className="w-8 h-8 text-purple-600" />
                    <span className="text-2xl font-bold text-purple-900">{avgAccuracy}%</span>
                  </div>
                  <p className="text-sm text-purple-700">Avg Accuracy</p>
                  <p className="text-xs text-purple-600 mt-1">Overall performance</p>
                </div>
                
                <div className="bg-yellow-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <BookOpen className="w-8 h-8 text-yellow-600" />
                    <span className="text-2xl font-bold text-yellow-900">{totalClasses}</span>
                  </div>
                  <p className="text-sm text-yellow-700">Total Classes</p>
                  <p className="text-xs text-yellow-600 mt-1">{activeClasses} active</p>
                </div>
              </div>
              
              {/* Progress Distribution */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Student Progress Distribution</h3>
                <div className="space-y-3">
                  {[
                    { range: '0-25%', count: students.filter(s => (typeof s.progress === 'number' ? s.progress : 0) <= 25).length },
                    { range: '26-50%', count: students.filter(s => {
                      const prog = typeof s.progress === 'number' ? s.progress : 0;
                      return prog > 25 && prog <= 50;
                    }).length },
                    { range: '51-75%', count: students.filter(s => {
                      const prog = typeof s.progress === 'number' ? s.progress : 0;
                      return prog > 50 && prog <= 75;
                    }).length },
                    { range: '76-100%', count: students.filter(s => (typeof s.progress === 'number' ? s.progress : 0) > 75).length }
                  ].map((item, idx) => (
                    <div key={idx}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-gray-600">{item.range}</span>
                        <span className="font-medium">{item.count} students</span>
                      </div>
                      <div className="h-8 bg-gray-200 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${(item.count / totalStudents) * 100}%` }}
                          transition={{ duration: 0.5, delay: idx * 0.1 }}
                          className="h-full bg-gradient-to-r from-blue-500 to-purple-600"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          
          {selectedReport === 'students' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Top Performing Students</h3>
              <div className="space-y-3">
                {topStudents.map((student, idx) => (
                  <div key={student.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                        {idx + 1}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{student.name}</p>
                        <p className="text-xs text-gray-500">
                          {classes.find(c => c.id === student.classId)?.name || ''}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">
                        {typeof student.progress === 'number' ? Math.round(student.progress) : 0}%
                      </p>
                      <p className="text-xs text-gray-500">Progress</p>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-yellow-900">Performance Alert</p>
                    <p className="text-sm text-yellow-700 mt-1">
                      {students.filter(s => (typeof s.progress === 'number' ? s.progress : 0) < 25).length} students
                      are below 25% progress and may need additional support.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {selectedReport === 'teachers' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Teacher Performance</h3>
              <div className="grid grid-cols-2 gap-4">
                {teachers.map(teacher => {
                  const teacherStudents = students.filter(s => classes.some(c => c.id === s.classId && c.teacherId === teacher.id));
                  const avgTeacherProgress = teacherStudents.length > 0
                    ? Math.round(teacherStudents.reduce((acc, s) => acc + (typeof s.progress === 'number' ? s.progress : 0), 0) / teacherStudents.length)
                    : 0;
                  
                  return (
                    <div key={teacher.id} className="bg-white border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-semibold text-gray-900">{teacher.name}</p>
                          <p className="text-sm text-gray-500">{teacher.email}</p>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          teacher.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                        }`}>
                          {teacher.status}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 text-center">
                        <div>
                          <p className="text-2xl font-bold text-gray-900">{classes.filter(c => c.teacherId === teacher.id).length}</p>
                          <p className="text-xs text-gray-500">Classes</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-gray-900">{teacherStudents.length}</p>
                          <p className="text-xs text-gray-500">Students</p>
                        </div>
                      </div>
                      
                      <div className="mt-3 pt-3 border-t">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Avg Student Progress</span>
                          <span className="font-medium">{avgTeacherProgress}%</span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden mt-1">
                          <div
                            className="h-full bg-gradient-to-r from-green-400 to-green-600"
                            style={{ width: `${avgTeacherProgress}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          
          {selectedReport === 'classes' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Class Analytics</h3>
              <div className="space-y-3">
                {classesWithCounts.map(cls => {
                  const classStudents = students.filter(s => s.classId === cls.id);
                  const avgClassProgress = classStudents.length > 0
                    ? Math.round(classStudents.reduce((acc, s) => acc + (typeof s.progress === 'number' ? s.progress : 0), 0) / classStudents.length)
                    : 0;
                  
                  return (
                    <div key={cls.id} className="bg-white border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="font-semibold text-gray-900">{cls.name}</p>
                          <p className="text-sm text-gray-500">{cls.teacherName} • {cls.schedule}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-gray-900">{cls.studentCount}</p>
                          <p className="text-xs text-gray-500">Students</p>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Class Progress</span>
                          <span className="font-medium">{avgClassProgress}%</span>
                        </div>
                        <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-blue-500 to-purple-600"
                            style={{ width: `${avgClassProgress}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}