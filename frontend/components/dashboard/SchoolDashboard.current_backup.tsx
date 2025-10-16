'use client';

import { useState, useEffect } from 'react';
import { getMySchool, getSchoolStats, createSchoolUser, getSchoolUsers } from '@/lib/api';
import { School, Users, GraduationCap, BookOpen, Calendar, Home, BarChart3, MessageSquare, Shield, Bell, LogOut, User, ClipboardList, FileText, UserCheck, Plus, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import ClassBuilder from './ClassBuilder';
import { useAuthStore } from '@/store/authStore';

export default function SchoolDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [schoolInfo, setSchoolInfo] = useState<any>(null);
  const { user, logout } = useAuthStore();
  const [notifications, setNotifications] = useState([]);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [stats, setStats] = useState({
    total_students: 0,
    total_teachers: 0,
    total_parents: 0,
    total_classes: 0,
    total_assignments: 0,
    pending_homework: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [studentForm, setStudentForm] = useState({
    email: '',
    displayName: '',
    password: '',
    dob: '',
    gender: ''
  });
  const [studentsList, setStudentsList] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [creatingStudent, setCreatingStudent] = useState(false);

  // Teachers state
  const [showAddTeacherModal, setShowAddTeacherModal] = useState(false);
  const [teacherForm, setTeacherForm] = useState({
    email: '',
    displayName: '',
    password: '',
    bio: ''
  });
  const [teachersList, setTeachersList] = useState([]);
  const [loadingTeachers, setLoadingTeachers] = useState(false);
  const [creatingTeacher, setCreatingTeacher] = useState(false);

  // Parents state
  const [showAddParentModal, setShowAddParentModal] = useState(false);
  const [parentForm, setParentForm] = useState({
    email: '',
    displayName: '',
    password: ''
  });
  const [parentsList, setParentsList] = useState([]);
  const [loadingParents, setLoadingParents] = useState(false);
  const [creatingParent, setCreatingParent] = useState(false);

  const router = useRouter();

  useEffect(() => {
    if(user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsData, schoolData] = await Promise.all([
        getSchoolStats(),
        getMySchool(),
      ]);

      if (statsData) {
        setStats(statsData.stats || statsData);
        setRecentActivity(statsData.recent_activity || []);
      }

      if (schoolData) {
        setSchoolInfo(schoolData);
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      setLoadingStudents(true);
      const data = await getSchoolUsers({ role: 'student' });
      setStudentsList(data.users || []);
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setLoadingStudents(false);
    }
  };

  const handleCreateStudent = async () => {
    try {
      setCreatingStudent(true);
      const userData = {
        ...studentForm,
        role: 'student'
      };

      await createSchoolUser(userData);

      // Reset form
      setStudentForm({
        email: '',
        displayName: '',
        password: '',
        dob: '',
        gender: ''
      });

      setShowAddStudentModal(false);

      // Refresh data
      await Promise.all([
        fetchDashboardData(),
        fetchStudents()
      ]);

      alert('Student created successfully!');
    } catch (error) {
      alert(error.message || 'Failed to create student');
    } finally {
      setCreatingStudent(false);
    }
  };

  const fetchTeachers = async () => {
    try {
      setLoadingTeachers(true);
      const data = await getSchoolUsers({ role: 'teacher' });
      setTeachersList(data.users || []);
    } catch (error) {
      console.error('Error fetching teachers:', error);
    } finally {
      setLoadingTeachers(false);
    }
  };

  const handleCreateTeacher = async () => {
    try {
      setCreatingTeacher(true);
      const userData = {
        ...teacherForm,
        role: 'teacher'
      };

      await createSchoolUser(userData);

      // Reset form
      setTeacherForm({
        email: '',
        displayName: '',
        password: '',
        bio: ''
      });

      setShowAddTeacherModal(false);

      // Refresh data
      await Promise.all([
        fetchDashboardData(),
        fetchTeachers()
      ]);

      alert('Teacher created successfully!');
    } catch (error) {
      alert(error.message || 'Failed to create teacher');
    } finally {
      setCreatingTeacher(false);
    }
  };

  const fetchParents = async () => {
    try {
      setLoadingParents(true);
      const data = await getSchoolUsers({ role: 'parent' });
      setParentsList(data.users || []);
    } catch (error) {
      console.error('Error fetching parents:', error);
    } finally {
      setLoadingParents(false);
    }
  };

  const handleCreateParent = async () => {
    try {
      setCreatingParent(true);
      const userData = {
        ...parentForm,
        role: 'parent'
      };

      await createSchoolUser(userData);

      // Reset form
      setParentForm({
        email: '',
        displayName: '',
        password: ''
      });

      setShowAddParentModal(false);

      // Refresh data
      await Promise.all([
        fetchDashboardData(),
        fetchParents()
      ]);

      alert('Parent created successfully!');
    } catch (error) {
      alert(error.message || 'Failed to create parent');
    } finally {
      setCreatingParent(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'students' && studentsList.length === 0) {
      fetchStudents();
    } else if (activeTab === 'teachers' && teachersList.length === 0) {
      fetchTeachers();
    } else if (activeTab === 'parents' && parentsList.length === 0) {
      fetchParents();
    }
  }, [activeTab]);

  const handleLogout = async () => {
    logout();
    router.push('/login');
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Home },
    { id: 'students', label: 'Students', icon: Users },
    { id: 'teachers', label: 'Teachers', icon: GraduationCap },
    { id: 'parents', label: 'Parents', icon: UserCheck },
    { id: 'classes', label: 'Classes', icon: BookOpen },
    { id: 'class-builder', label: 'Class Builder', icon: School },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'messages', label: 'Messages', icon: MessageSquare },
    { id: 'credentials', label: 'Credentials', icon: Shield },
    { id: 'reports', label: 'Reports', icon: BarChart3 }
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <School className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {schoolInfo?.name || 'School Dashboard'}
                </h1>
                <p className="text-sm text-gray-500">School Management System</p>
              </div>
            </div>

            {/* Header Right Side - Profile, Notifications, Logout */}
            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <button className="relative p-2 text-gray-600 hover:text-gray-900 transition">
                <Bell className="w-6 h-6" />
                {notifications.length > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                )}
              </button>

              {/* Profile Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center space-x-2 p-2 text-gray-600 hover:text-gray-900 transition"
                >
                  <User className="w-6 h-6" />
                  <span className="text-sm font-medium">{user?.email || 'User'}</span>
                </button>

                {showProfileMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white border rounded-lg shadow-lg z-50">
                    <button className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100 flex items-center space-x-2">
                      <User className="w-4 h-4" />
                      <span>Profile Settings</span>
                    </button>
                    <hr className="my-1" />
                    <button
                      onClick={handleLogout}
                      className="w-full px-4 py-2 text-left text-red-600 hover:bg-gray-100 flex items-center space-x-2"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Logout</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b px-6">
        <div className="flex space-x-8 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;

            // All tabs stay within this dashboard
            const getTabRoute = (tabId: string) => {
              // No external navigation - all sections are in this dashboard
              return null;
            };

            const route = getTabRoute(tab.id);

            return (
              <button
                key={tab.id}
                onClick={() => {
                  if (route) {
                    router.push(route);
                  } else {
                    setActiveTab(tab.id);
                  }
                }}
                className={`flex items-center space-x-2 py-4 border-b-2 transition ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">Dashboard Overview</h2>

            {/* Stats Grid - Clickable Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div
                onClick={() => setActiveTab('students')}
                className="bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-lg transition"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Students</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.total_students}</p>
                    <p className="text-xs text-blue-600 mt-2">Click to manage →</p>
                  </div>
                  <Users className="w-8 h-8 text-blue-500" />
                </div>
              </div>

              <div
                onClick={() => setActiveTab('teachers')}
                className="bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-lg transition"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Teachers</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.total_teachers}</p>
                    <p className="text-xs text-green-600 mt-2">Click to manage →</p>
                  </div>
                  <GraduationCap className="w-8 h-8 text-green-500" />
                </div>
              </div>

              <div
                onClick={() => setActiveTab('parents')}
                className="bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-lg transition"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Parents</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.total_parents}</p>
                    <p className="text-xs text-purple-600 mt-2">Click to manage →</p>
                  </div>
                  <Users className="w-8 h-8 text-purple-500" />
                </div>
              </div>

              <div
                onClick={() => setActiveTab('classes')}
                className="bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-lg transition"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Classes</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.total_classes}</p>
                    <p className="text-xs text-orange-600 mt-2">Click to manage →</p>
                  </div>
                  <BookOpen className="w-8 h-8 text-orange-500" />
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <button
                  onClick={() => router.push('/student-management')}
                  className="p-4 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition flex flex-col items-center"
                >
                  <Users className="w-6 h-6 mb-2" />
                  <span className="text-sm">Add Student</span>
                </button>
                <button
                  onClick={() => router.push('/teacher-dashboard')}
                  className="p-4 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition flex flex-col items-center"
                >
                  <GraduationCap className="w-6 h-6 mb-2" />
                  <span className="text-sm">Add Teacher</span>
                </button>
                <button
                  onClick={() => router.push('/school/classes')}
                  className="p-4 bg-orange-50 text-orange-700 rounded-lg hover:bg-orange-100 transition flex flex-col items-center"
                >
                  <BookOpen className="w-6 h-6 mb-2" />
                  <span className="text-sm">Create Class</span>
                </button>
                <button
                  onClick={() => router.push('/teacher-dashboard?tab=assignments')}
                  className="p-4 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition flex flex-col items-center"
                >
                  <ClipboardList className="w-6 h-6 mb-2" />
                  <span className="text-sm">New Assignment</span>
                </button>
              </div>
            </div>

            {/* Empty State Message */}
            {stats.students === 0 && stats.teachers === 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
                <p className="text-blue-900 font-medium">Welcome to your new dashboard!</p>
                <p className="text-blue-700 mt-2">
                  Start by adding students, teachers, and classes to your school.
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'students' && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Students Management</h2>
              <button
                onClick={() => setShowAddStudentModal(true)}
                className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
              >
                <Plus className="w-5 h-5" />
                <span>Add Student</span>
              </button>
            </div>

            {loadingStudents ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : studentsList.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No students registered yet</p>
                <button
                  onClick={() => setShowAddStudentModal(true)}
                  className="mt-4 text-blue-600 hover:underline"
                >
                  Add your first student →
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {studentsList.map((student: any) => (
                    <div key={student.user_id} className="border rounded-lg p-4 hover:shadow-md transition">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-gray-900">{student.display_name}</h3>
                          <p className="text-sm text-gray-600">{student.email}</p>
                          {student.dob && (
                            <p className="text-xs text-gray-500 mt-1">
                              DOB: {new Date(student.dob).toLocaleDateString()}
                            </p>
                          )}
                          {student.gender && (
                            <span className="inline-block mt-2 px-2 py-1 text-xs rounded-full bg-gray-100">
                              {student.gender}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500">
                          {student.active ? (
                            <span className="text-green-600">Active</span>
                          ) : (
                            <span className="text-red-600">Inactive</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'teachers' && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Teachers Management</h2>
              <button
                onClick={() => setShowAddTeacherModal(true)}
                className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
              >
                <Plus className="w-5 h-5" />
                <span>Add Teacher</span>
              </button>
            </div>

            {loadingTeachers ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : teachersList.length === 0 ? (
              <div className="text-center py-8">
                <GraduationCap className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No teachers registered yet</p>
                <button
                  onClick={() => setShowAddTeacherModal(true)}
                  className="mt-4 text-blue-600 hover:underline"
                >
                  Add your first teacher →
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {teachersList.map((teacher: any) => (
                  <div key={teacher.user_id} className="border rounded-lg p-4 hover:shadow-md transition">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900">{teacher.display_name}</h3>
                        <p className="text-sm text-gray-600">{teacher.email}</p>
                        {teacher.bio && (
                          <p className="text-xs text-gray-500 mt-2">{teacher.bio}</p>
                        )}
                      </div>
                      <div className="text-xs text-gray-500">
                        {teacher.active !== false ? (
                          <span className="text-green-600">Active</span>
                        ) : (
                          <span className="text-red-600">Inactive</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'parents' && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Parents Management</h2>
              <button
                onClick={() => setShowAddParentModal(true)}
                className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
              >
                <Plus className="w-5 h-5" />
                <span>Add Parent</span>
              </button>
            </div>

            {loadingParents ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : parentsList.length === 0 ? (
              <div className="text-center py-8">
                <UserCheck className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No parents registered yet</p>
                <button
                  onClick={() => setShowAddParentModal(true)}
                  className="mt-4 text-blue-600 hover:underline"
                >
                  Add your first parent →
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {parentsList.map((parent: any) => (
                  <div key={parent.user_id} className="border rounded-lg p-4 hover:shadow-md transition">
                    <div>
                      <h3 className="font-semibold text-gray-900">{parent.display_name}</h3>
                      <p className="text-sm text-gray-600">{parent.email}</p>
                      <p className="text-xs text-gray-500 mt-2">Parent Account</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'classes' && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Classes Management</h2>
              <button
                onClick={() => setActiveTab('class-builder')}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
              >
                Go to Class Builder
              </button>
            </div>
            {stats.classes === 0 ? (
              <div className="text-center py-8">
                <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">No classes created yet</p>
                <p className="text-gray-400 text-sm mt-1">Use Class Builder to create and organize classes</p>
              </div>
            ) : (
              <p className="text-gray-600">Class list will appear here</p>
            )}
          </div>
        )}


        {activeTab === 'calendar' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">School Calendar</h2>
            <p className="text-gray-500 text-center py-8">No events scheduled</p>
          </div>
        )}

        {activeTab === 'messages' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">School Messages</h2>
            <p className="text-gray-500 text-center py-8">No messages</p>
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Reports</h2>
            <p className="text-gray-500 text-center py-8">No data available for reports</p>
          </div>
        )}

        {activeTab === 'class-builder' && (
          <div>
            <ClassBuilder />
          </div>
        )}

        {activeTab === 'credentials' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-semibold">User Credentials Management</h2>
                  <p className="text-gray-600 mt-1">Generate and manage login credentials for all users</p>
                </div>
                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center space-x-2">
                  <Shield className="w-4 h-4" />
                  <span>Generate Bulk Credentials</span>
                </button>
              </div>

              {/* Credential Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Students without credentials</p>
                  <p className="text-2xl font-bold text-red-600">{stats.students}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Teachers without credentials</p>
                  <p className="text-2xl font-bold text-orange-600">{stats.teachers}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Parents without credentials</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.parents}</p>
                </div>
              </div>

              {(stats.students === 0 && stats.teachers === 0 && stats.parents === 0) ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <Shield className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">No users available</p>
                  <p className="text-gray-400 text-sm mt-1">Add students, teachers, or parents first to generate their credentials</p>
                </div>
              ) : (
                <div className="border-t pt-4">
                  <p className="text-gray-600">Select users to generate credentials for them</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Add Student Modal */}
      {showAddStudentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 m-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Add New Student</h3>
              <button
                onClick={() => setShowAddStudentModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              handleCreateStudent();
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={studentForm.displayName}
                    onChange={(e) => setStudentForm({ ...studentForm, displayName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ahmed Hassan"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={studentForm.email}
                    onChange={(e) => setStudentForm({ ...studentForm, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="student@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password *
                  </label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={studentForm.password}
                    onChange={(e) => setStudentForm({ ...studentForm, password: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Minimum 8 characters"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    value={studentForm.dob}
                    onChange={(e) => setStudentForm({ ...studentForm, dob: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Gender
                  </label>
                  <select
                    value={studentForm.gender}
                    onChange={(e) => setStudentForm({ ...studentForm, gender: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddStudentModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingStudent}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creatingStudent ? 'Creating...' : 'Create Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Teacher Modal */}
      {showAddTeacherModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 m-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Add New Teacher</h3>
              <button
                onClick={() => setShowAddTeacherModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              handleCreateTeacher();
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={teacherForm.displayName}
                    onChange={(e) => setTeacherForm({ ...teacherForm, displayName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Dr. Ahmed Hassan"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={teacherForm.email}
                    onChange={(e) => setTeacherForm({ ...teacherForm, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="teacher@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password *
                  </label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={teacherForm.password}
                    onChange={(e) => setTeacherForm({ ...teacherForm, password: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Minimum 8 characters"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bio
                  </label>
                  <textarea
                    value={teacherForm.bio}
                    onChange={(e) => setTeacherForm({ ...teacherForm, bio: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Brief description about the teacher..."
                    rows={3}
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddTeacherModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingTeacher}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creatingTeacher ? 'Creating...' : 'Create Teacher'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Parent Modal */}
      {showAddParentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 m-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Add New Parent</h3>
              <button
                onClick={() => setShowAddParentModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              handleCreateParent();
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={parentForm.displayName}
                    onChange={(e) => setParentForm({ ...parentForm, displayName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Mohamed Ali"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={parentForm.email}
                    onChange={(e) => setParentForm({ ...parentForm, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="parent@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password *
                  </label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={parentForm.password}
                    onChange={(e) => setParentForm({ ...parentForm, password: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Minimum 8 characters"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddParentModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingParent}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creatingParent ? 'Creating...' : 'Create Parent'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}