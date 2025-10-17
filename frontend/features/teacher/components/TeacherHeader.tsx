'use client';

import { Bell, Search, Settings, User, LogOut, BookOpen, MessageSquare } from 'lucide-react';
import { useState } from 'react';
import { signOut } from '@/lib/auth-client';
import { useRouter } from 'next/navigation';

interface Props {
  teacherName: string;
  schoolName: string;
}

export default function TeacherHeader({ teacherName, schoolName }: Props) {
  const [showProfile, setShowProfile] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(3);
  const router = useRouter();
  
  const handleSignOut = async () => {
    await signOut();
    router.push('/auth/login');
  };

  const notifications = [
    { id: 1, text: 'New student added to your class', time: '10 min ago', unread: true },
    { id: 2, text: 'Parent message from Mrs. Ahmed', time: '1 hour ago', unread: true },
    { id: 3, text: 'Assignment deadline reminder', time: '2 hours ago', unread: false }
  ];
  
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Left side */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-teal-600 rounded-lg flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Teacher Dashboard</h1>
                <p className="text-xs text-gray-500">{schoolName}</p>
              </div>
            </div>
          </div>
          
          {/* Center - Search */}
          <div className="hidden md:block flex-1 max-w-xl mx-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search students, classes, assignments..."
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:bg-white"
              />
            </div>
          </div>
          
          {/* Right side */}
          <div className="flex items-center gap-3">
            {/* Messages */}
            <button 
              onClick={() => router.push('/teacher/messages')}
              className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <MessageSquare className="w-5 h-5 text-gray-600" />
              {unreadMessages > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
              )}
            </button>
            
            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Bell className="w-5 h-5 text-gray-600" />
                {notifications.filter(n => n.unread).length > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                )}
              </button>
              
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200">
                  <div className="p-3 bg-gray-50 border-b">
                    <h3 className="font-semibold text-sm">Notifications</h3>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.map(notif => (
                      <div
                        key={notif.id}
                        className={`p-3 border-b hover:bg-gray-50 ${notif.unread ? 'bg-blue-50' : ''}`}
                      >
                        <p className="text-sm text-gray-800">{notif.text}</p>
                        <p className="text-xs text-gray-500 mt-1">{notif.time}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {/* Profile */}
            <div className="relative">
              <button
                onClick={() => setShowProfile(!showProfile)}
                className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-teal-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                  {teacherName.charAt(0).toUpperCase()}
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium text-gray-900">{teacherName}</p>
                  <p className="text-xs text-gray-500">Teacher</p>
                </div>
              </button>
              
              {showProfile && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200">
                  <div className="p-3 bg-gray-50 border-b">
                    <p className="text-sm font-medium text-gray-900">{teacherName}</p>
                    <p className="text-xs text-gray-500">Teacher at {schoolName}</p>
                  </div>
                  <div className="p-2">
                    <button 
                      onClick={() => router.push('/teacher/profile')}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded flex items-center gap-2"
                    >
                      <User className="w-4 h-4" />
                      My Profile
                    </button>
                    <button 
                      onClick={() => router.push('/teacher/settings')}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded flex items-center gap-2"
                    >
                      <Settings className="w-4 h-4" />
                      Settings
                    </button>
                    <hr className="my-2" />
                    <button 
                      onClick={handleSignOut}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded flex items-center gap-2 text-red-600"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}