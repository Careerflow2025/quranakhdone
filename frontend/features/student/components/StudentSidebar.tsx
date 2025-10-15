'use client';

import { 
  LayoutDashboard, BookOpen, TrendingUp, ClipboardList, 
  Calendar, Award, FolderOpen, Settings, Target, MessageSquare
} from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useStudentStore } from '../state/useStudentStore';

export default function StudentSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { assignments, notes, progress } = useStudentStore();
  
  const pendingAssignments = assignments.filter(a => a.status === 'pending' || a.status === 'in_progress').length;
  const unreadNotes = notes.filter(n => !n.isRead).length;
  
  const menuItems = [
    { 
      id: 'dashboard', 
      label: 'Dashboard', 
      icon: LayoutDashboard, 
      path: '/student/dashboard',
      badge: null 
    },
    { 
      id: 'quran', 
      label: 'Read Quran', 
      icon: BookOpen, 
      path: '/student/quran',
      badge: null 
    },
    { 
      id: 'progress', 
      label: 'My Progress', 
      icon: TrendingUp, 
      path: '/student/progress',
      badge: `${Math.round((progress.pagesCompleted / progress.totalPages) * 100)}%`
    },
    { 
      id: 'assignments', 
      label: 'Assignments', 
      icon: ClipboardList, 
      path: '/student/assignments',
      badge: pendingAssignments > 0 ? pendingAssignments.toString() : null
    },
    { 
      id: 'achievements', 
      label: 'Achievements', 
      icon: Award, 
      path: '/student/achievements',
      badge: null 
    },
    { 
      id: 'schedule', 
      label: 'My Schedule', 
      icon: Calendar, 
      path: '/student/schedule',
      badge: null 
    },
    { 
      id: 'notes', 
      label: 'Teacher Notes', 
      icon: MessageSquare, 
      path: '/student/notes',
      badge: unreadNotes > 0 ? unreadNotes.toString() : null
    },
    { 
      id: 'resources', 
      label: 'Resources', 
      icon: FolderOpen, 
      path: '/student/resources',
      badge: null 
    },
    { 
      id: 'goals', 
      label: 'My Goals', 
      icon: Target, 
      path: '/student/goals',
      badge: null 
    },
    { 
      id: 'settings', 
      label: 'Settings', 
      icon: Settings, 
      path: '/student/settings',
      badge: null 
    }
  ];
  
  const isActive = (path: string) => pathname === path;
  
  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-screen">
      <div className="p-4">
        <div className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            
            return (
              <button
                key={item.id}
                onClick={() => router.push(item.path)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
                  active 
                    ? 'bg-purple-50 text-purple-700 font-medium' 
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-5 h-5 ${active ? 'text-purple-600' : 'text-gray-500'}`} />
                  <span className="text-sm">{item.label}</span>
                </div>
                {item.badge && (
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    active 
                      ? 'bg-purple-200 text-purple-800' 
                      : item.id === 'assignments' || item.id === 'notes'
                        ? 'bg-red-100 text-red-600'
                        : 'bg-gray-200 text-gray-600'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        
        {/* Daily Progress */}
        <div className="mt-8 p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg">
          <h4 className="text-sm font-semibold text-gray-800 mb-3">Today's Progress</h4>
          <div className="space-y-2">
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span>Daily Goal</span>
                <span>{progress.pagesCompleted % progress.dailyGoal}/{progress.dailyGoal} pages</span>
              </div>
              <div className="h-2 bg-white rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-purple-400 to-pink-400"
                  style={{ width: `${Math.min(100, (progress.pagesCompleted % progress.dailyGoal / progress.dailyGoal) * 100)}%` }}
                />
              </div>
            </div>
            
            <div className="text-center mt-3">
              <p className="text-2xl font-bold text-purple-600">{progress.streakDays}</p>
              <p className="text-xs text-gray-600">Day Streak 🔥</p>
            </div>
          </div>
        </div>
        
        {/* Quick Stats */}
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Reading Time</span>
              <span className="font-medium">{Math.floor(progress.readingTime / 60)}h {progress.readingTime % 60}m</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Accuracy</span>
              <span className="font-medium">{progress.accuracy}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Teacher</span>
              <span className="font-medium">{useStudentStore.getState().profile.teacherName}</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}