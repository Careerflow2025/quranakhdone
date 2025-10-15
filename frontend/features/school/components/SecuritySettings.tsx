'use client';

import { useState, useEffect } from 'react';
import { 
  Shield,
  Lock,
  Key,
  Users,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle,
  Clock,
  Monitor,
  Smartphone,
  Globe,
  Activity,
  Settings,
  UserCheck,
  UserX,
  Save,
  RefreshCw
} from 'lucide-react';
import { motion } from 'framer-motion';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'teacher' | 'parent' | 'student';
  status: 'active' | 'suspended' | 'locked';
  lastLogin: Date;
  loginAttempts: number;
  twoFactorEnabled: boolean;
  permissions: string[];
}

interface LoginSession {
  id: string;
  userId: string;
  userName: string;
  device: string;
  location: string;
  ipAddress: string;
  timestamp: Date;
  status: 'active' | 'expired';
}

interface SecurityPolicy {
  passwordMinLength: number;
  passwordRequireUppercase: boolean;
  passwordRequireLowercase: boolean;
  passwordRequireNumbers: boolean;
  passwordRequireSpecialChars: boolean;
  passwordExpiryDays: number;
  maxLoginAttempts: number;
  sessionTimeoutMinutes: number;
  requireTwoFactor: boolean;
  allowedIpRanges: string[];
}

export default function SecuritySettings() {
  const [activeTab, setActiveTab] = useState<'users' | 'sessions' | 'policies' | 'audit'>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [sessions, setSessions] = useState<LoginSession[]>([]);
  const [showEditUser, setShowEditUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [securityPolicy, setSecurityPolicy] = useState<SecurityPolicy>({
    passwordMinLength: 8,
    passwordRequireUppercase: true,
    passwordRequireLowercase: true,
    passwordRequireNumbers: true,
    passwordRequireSpecialChars: false,
    passwordExpiryDays: 90,
    maxLoginAttempts: 5,
    sessionTimeoutMinutes: 30,
    requireTwoFactor: false,
    allowedIpRanges: []
  });
  
  // Load saved data
  useEffect(() => {
    const savedUsers = localStorage.getItem('securityUsers');
    if (savedUsers) {
      setUsers(JSON.parse(savedUsers).map((u: any) => ({ 
        ...u, 
        lastLogin: new Date(u.lastLogin) 
      })));
    } else {
      // Initialize with default users
      const defaultUsers: User[] = [
        {
          id: '1',
          name: 'Admin User',
          email: 'admin@school.com',
          role: 'admin',
          status: 'active',
          lastLogin: new Date(),
          loginAttempts: 0,
          twoFactorEnabled: true,
          permissions: ['all']
        }
      ];
      setUsers(defaultUsers);
    }
    
    const savedSessions = localStorage.getItem('loginSessions');
    if (savedSessions) {
      setSessions(JSON.parse(savedSessions).map((s: any) => ({ 
        ...s, 
        timestamp: new Date(s.timestamp) 
      })));
    }
    
    const savedPolicy = localStorage.getItem('securityPolicy');
    if (savedPolicy) {
      setSecurityPolicy(JSON.parse(savedPolicy));
    }
  }, []);
  
  // Save data
  useEffect(() => {
    if (users.length > 0) {
      localStorage.setItem('securityUsers', JSON.stringify(users));
    }
  }, [users]);
  
  useEffect(() => {
    if (sessions.length > 0) {
      localStorage.setItem('loginSessions', JSON.stringify(sessions));
    }
  }, [sessions]);
  
  useEffect(() => {
    localStorage.setItem('securityPolicy', JSON.stringify(securityPolicy));
  }, [securityPolicy]);
  
  const addUser = (userData: Partial<User>) => {
    const newUser: User = {
      id: crypto.randomUUID(),
      name: userData.name || '',
      email: userData.email || '',
      role: userData.role || 'teacher',
      status: 'active',
      lastLogin: new Date(),
      loginAttempts: 0,
      twoFactorEnabled: false,
      permissions: getDefaultPermissions(userData.role || 'teacher')
    };
    setUsers([...users, newUser]);
  };
  
  const getDefaultPermissions = (role: string): string[] => {
    switch (role) {
      case 'admin': return ['all'];
      case 'teacher': return ['view_students', 'edit_students', 'view_classes', 'edit_classes'];
      case 'parent': return ['view_own_children', 'view_progress', 'send_messages'];
      case 'student': return ['view_own_progress', 'view_assignments'];
      default: return [];
    }
  };
  
  const toggleUserStatus = (userId: string) => {
    setUsers(users.map(u => {
      if (u.id === userId) {
        return {
          ...u,
          status: u.status === 'active' ? 'suspended' : 'active'
        };
      }
      return u;
    }));
  };
  
  const resetPassword = (userId: string) => {
    alert('Password reset link sent to user\'s email');
    // Log the action
    const session: LoginSession = {
      id: crypto.randomUUID(),
      userId,
      userName: users.find(u => u.id === userId)?.name || 'Unknown',
      device: 'System',
      location: 'Admin Action',
      ipAddress: '127.0.0.1',
      timestamp: new Date(),
      status: 'active'
    };
    setSessions([...sessions, session]);
  };
  
  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const auditLogs = sessions.slice(-20).reverse(); // Last 20 activities
  
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Security Settings</h2>
          <p className="text-sm text-gray-600 mt-1">Manage user access and security policies</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            Sync
          </button>
          <button 
            onClick={() => {
              alert('Security settings saved successfully');
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Save Changes
          </button>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="bg-white rounded-lg border">
        <div className="flex border-b">
          {[
            { id: 'users', label: 'User Management', icon: Users },
            { id: 'sessions', label: 'Active Sessions', icon: Monitor },
            { id: 'policies', label: 'Security Policies', icon: Shield },
            { id: 'audit', label: 'Audit Logs', icon: Activity }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 px-4 py-3 flex items-center justify-center gap-2 transition-colors ${
                  activeTab === tab.id
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
          {/* User Management Tab */}
          {activeTab === 'users' && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search users..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>
                <button
                  onClick={() => {
                    const name = prompt('Enter user name:');
                    const email = prompt('Enter user email:');
                    const role = prompt('Enter role (admin/teacher/parent/student):') as any;
                    if (name && email && role) {
                      addUser({ name, email, role });
                    }
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Add User
                </button>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">2FA</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Login</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredUsers.map(user => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{user.name}</p>
                            <p className="text-xs text-gray-500">{user.email}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            user.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                            user.role === 'teacher' ? 'bg-blue-100 text-blue-700' :
                            user.role === 'parent' ? 'bg-green-100 text-green-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            user.status === 'active' ? 'bg-green-100 text-green-700' :
                            user.status === 'suspended' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {user.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {user.twoFactorEnabled ? (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          ) : (
                            <AlertTriangle className="w-4 h-4 text-yellow-500" />
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {user.lastLogin.toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => toggleUserStatus(user.id)}
                              className="text-sm text-blue-600 hover:text-blue-700"
                            >
                              {user.status === 'active' ? 'Suspend' : 'Activate'}
                            </button>
                            <button
                              onClick={() => resetPassword(user.id)}
                              className="text-sm text-gray-600 hover:text-gray-700"
                            >
                              Reset Password
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          
          {/* Active Sessions Tab */}
          {activeTab === 'sessions' && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-green-700">Active Sessions</p>
                      <p className="text-2xl font-bold text-green-900">
                        {sessions.filter(s => s.status === 'active').length}
                      </p>
                    </div>
                    <Monitor className="w-8 h-8 text-green-600" />
                  </div>
                </div>
                
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-blue-700">Total Logins Today</p>
                      <p className="text-2xl font-bold text-blue-900">
                        {sessions.filter(s => 
                          s.timestamp.toDateString() === new Date().toDateString()
                        ).length}
                      </p>
                    </div>
                    <Clock className="w-8 h-8 text-blue-600" />
                  </div>
                </div>
                
                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-purple-700">Unique Devices</p>
                      <p className="text-2xl font-bold text-purple-900">
                        {new Set(sessions.map(s => s.device)).size}
                      </p>
                    </div>
                    <Smartphone className="w-8 h-8 text-purple-600" />
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                {sessions.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No active sessions</p>
                ) : (
                  sessions.slice(-10).reverse().map(session => (
                    <div key={session.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${
                          session.status === 'active' ? 'bg-green-500' : 'bg-gray-400'
                        }`} />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{session.userName}</p>
                          <p className="text-xs text-gray-500">
                            {session.device} • {session.location} • {session.ipAddress}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-600">
                          {session.timestamp.toLocaleString()}
                        </p>
                        {session.status === 'active' && (
                          <button className="text-xs text-red-600 hover:text-red-700 mt-1">
                            Terminate
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
          
          {/* Security Policies Tab */}
          {activeTab === 'policies' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Password Policy</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-sm text-gray-700">Minimum Password Length</label>
                    <input
                      type="number"
                      value={securityPolicy.passwordMinLength}
                      onChange={(e) => setSecurityPolicy({ 
                        ...securityPolicy, 
                        passwordMinLength: parseInt(e.target.value) 
                      })}
                      className="w-20 px-3 py-1 border border-gray-300 rounded-lg"
                    />
                  </div>
                  
                  {[
                    { key: 'passwordRequireUppercase', label: 'Require Uppercase Letters' },
                    { key: 'passwordRequireLowercase', label: 'Require Lowercase Letters' },
                    { key: 'passwordRequireNumbers', label: 'Require Numbers' },
                    { key: 'passwordRequireSpecialChars', label: 'Require Special Characters' }
                  ].map(item => (
                    <div key={item.key} className="flex items-center justify-between">
                      <label className="text-sm text-gray-700">{item.label}</label>
                      <button
                        onClick={() => setSecurityPolicy({ 
                          ...securityPolicy, 
                          [item.key]: !securityPolicy[item.key as keyof SecurityPolicy] 
                        })}
                        className={`w-12 h-6 rounded-full transition-colors ${
                          securityPolicy[item.key as keyof SecurityPolicy] 
                            ? 'bg-blue-600' 
                            : 'bg-gray-300'
                        }`}
                      >
                        <motion.div
                          className="w-5 h-5 bg-white rounded-full shadow"
                          animate={{ 
                            x: securityPolicy[item.key as keyof SecurityPolicy] ? 26 : 2 
                          }}
                        />
                      </button>
                    </div>
                  ))}
                  
                  <div className="flex items-center justify-between">
                    <label className="text-sm text-gray-700">Password Expiry (days)</label>
                    <input
                      type="number"
                      value={securityPolicy.passwordExpiryDays}
                      onChange={(e) => setSecurityPolicy({ 
                        ...securityPolicy, 
                        passwordExpiryDays: parseInt(e.target.value) 
                      })}
                      className="w-20 px-3 py-1 border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-4">Login Security</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-sm text-gray-700">Max Login Attempts</label>
                    <input
                      type="number"
                      value={securityPolicy.maxLoginAttempts}
                      onChange={(e) => setSecurityPolicy({ 
                        ...securityPolicy, 
                        maxLoginAttempts: parseInt(e.target.value) 
                      })}
                      className="w-20 px-3 py-1 border border-gray-300 rounded-lg"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <label className="text-sm text-gray-700">Session Timeout (minutes)</label>
                    <input
                      type="number"
                      value={securityPolicy.sessionTimeoutMinutes}
                      onChange={(e) => setSecurityPolicy({ 
                        ...securityPolicy, 
                        sessionTimeoutMinutes: parseInt(e.target.value) 
                      })}
                      className="w-20 px-3 py-1 border border-gray-300 rounded-lg"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <label className="text-sm text-gray-700">Require Two-Factor Authentication</label>
                    <button
                      onClick={() => setSecurityPolicy({ 
                        ...securityPolicy, 
                        requireTwoFactor: !securityPolicy.requireTwoFactor 
                      })}
                      className={`w-12 h-6 rounded-full transition-colors ${
                        securityPolicy.requireTwoFactor ? 'bg-blue-600' : 'bg-gray-300'
                      }`}
                    >
                      <motion.div
                        className="w-5 h-5 bg-white rounded-full shadow"
                        animate={{ x: securityPolicy.requireTwoFactor ? 26 : 2 }}
                      />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Audit Logs Tab */}
          {activeTab === 'audit' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Recent Activity Logs</h3>
                <button className="text-sm text-blue-600 hover:text-blue-700">
                  Export Logs
                </button>
              </div>
              
              <div className="space-y-2">
                {auditLogs.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No audit logs available</p>
                ) : (
                  auditLogs.map(log => (
                    <div key={log.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100">
                      <div className="flex items-center gap-3">
                        <Activity className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-900">
                            <span className="font-medium">{log.userName}</span> logged in from {log.location}
                          </p>
                          <p className="text-xs text-gray-500">
                            Device: {log.device} • IP: {log.ipAddress}
                          </p>
                        </div>
                      </div>
                      <p className="text-xs text-gray-600">
                        {log.timestamp.toLocaleString()}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}