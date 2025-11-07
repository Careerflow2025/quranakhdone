'use client';

import { Bell, Search, Settings, User, LogOut, BookOpen, Award, Flame } from 'lucide-react';
import { useState } from 'react';
import { signOut } from '@/lib/auth-client';
import { useRouter } from 'next/navigation';
import { useStudentStore } from '../state/useStudentStore';
import Image from 'next/image';

export default function StudentHeader() {
  const [showProfile, setShowProfile] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const router = useRouter();
  const { profile, progress, notes } = useStudentStore();
  
  const unreadNotes = notes.filter(n => !n.isRead).length;
  
  const handleSignOut = async () => {
    await signOut();
    router.push('/auth/login');
  };

  const notifications = [
    { id: 1, text: 'New assignment from your teacher', time: '2 hours ago', unread: true },
    { id: 2, text: 'You earned a new achievement!', time: '1 day ago', unread: true },
    { id: 3, text: 'Class tomorrow at 4:00 PM', time: '2 days ago', unread: false }
  ];
  
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between relative">
          {/* Left side */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div>
                <h1 className="text-xl font-bold text-gray-900">Student Dashboard</h1>
                <p className="text-xs text-gray-500">{profile.schoolName}</p>
              </div>
            </div>
          </div>

          {/* Center - Logo */}
          <div className="flex items-center justify-center absolute left-1/2 transform -translate-x-1/2 z-10">
            <Image
              src="/quranakh-logo.png"
              alt="QuranAkh Logo"
              width={48}
              height={48}
              priority
              className="w-12 h-12"
            />
          </div>

          {/* Right - Stats & Actions */}
          <div className="hidden md:flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-orange-500" />
              <div>
                <p className="text-sm font-bold text-gray-900">{progress.streakDays}</p>
                <p className="text-xs text-gray-500">Day Streak</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-yellow-500" />
              <div>
                <p className="text-sm font-bold text-gray-900">
                  {Math.round((progress.pagesCompleted / progress.totalPages) * 100)}%
                </p>
                <p className="text-xs text-gray-500">Progress</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-sm font-bold text-gray-900">{progress.pagesCompleted}</p>
                <p className="text-xs text-gray-500">Pages Read</p>
              </div>
            </div>
          </div>
          
          {/* Right side */}
          <div className="flex items-center gap-3">
            {/* Search */}
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors md:hidden">
              <Search className="w-5 h-5 text-gray-600" />
            </button>
            
            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Bell className="w-5 h-5 text-gray-600" />
                {(notifications.filter(n => n.unread).length + unreadNotes) > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                )}
              </button>
              
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200">
                  <div className="p-3 bg-gray-50 border-b">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-sm">Notifications</h3>
                      {(notifications.filter(n => n.unread).length + unreadNotes) > 0 && (
                        <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full">
                          {notifications.filter(n => n.unread).length + unreadNotes} new
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {unreadNotes > 0 && (
                      <div className="p-3 bg-blue-50 border-b">
                        <p className="text-sm font-medium text-blue-900">
                          {unreadNotes} new notes from your teacher
                        </p>
                      </div>
                    )}
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
                  <div className="p-3 bg-gray-50 border-t">
                    <button className="text-xs text-blue-600 hover:text-blue-700 font-medium">
                      View all notifications
                    </button>
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
                <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                  {profile.name.charAt(0).toUpperCase()}
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium text-gray-900">{profile.name}</p>
                  <p className="text-xs text-gray-500">{profile.className}</p>
                </div>
              </button>
              
              {showProfile && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200">
                  <div className="p-3 bg-gray-50 border-b">
                    <p className="text-sm font-medium text-gray-900">{profile.name}</p>
                    <p className="text-xs text-gray-500">{profile.email}</p>
                    <p className="text-xs text-gray-500 mt-1">Grade {profile.grade}</p>
                  </div>
                  <div className="p-2">
                    <button 
                      onClick={() => router.push('/student/profile')}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded flex items-center gap-2"
                    >
                      <User className="w-4 h-4" />
                      My Profile
                    </button>
                    <button 
                      onClick={() => router.push('/student/settings')}
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