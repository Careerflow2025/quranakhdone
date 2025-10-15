'use client';

import { 
  LayoutDashboard, Users, BookOpen, ClipboardList, 
  Calendar, FileText, MessageSquare, Settings, 
  GraduationCap, BarChart3, FolderOpen
} from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';

export default function TeacherSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  
  const menuItems = [
    { 
      id: 'dashboard', 
      label: 'Dashboard', 
      icon: LayoutDashboard, 
      path: '/teacher/dashboard',
      badge: null 
    },
    { 
      id: 'classes', 
      label: 'My Classes', 
      icon: GraduationCap, 
      path: '/teacher/classes',
      badge: '5' 
    },
    { 
      id: 'students', 
      label: 'Students', 
      icon: Users, 
      path: '/teacher/students',
      badge: '32' 
    },
    { 
      id: 'annotations', 
      label: 'Quran Annotations', 
      icon: BookOpen, 
      path: '/teacher/annotations',
      badge: null 
    },
    { 
      id: 'assignments', 
      label: 'Assignments', 
      icon: ClipboardList, 
      path: '/teacher/assignments',
      badge: '3' 
    },
    { 
      id: 'schedule', 
      label: 'Schedule', 
      icon: Calendar, 
      path: '/teacher/schedule',
      badge: null 
    },
    { 
      id: 'reports', 
      label: 'Reports', 
      icon: BarChart3, 
      path: '/teacher/reports',
      badge: null 
    },
    { 
      id: 'resources', 
      label: 'Resources', 
      icon: FolderOpen, 
      path: '/teacher/resources',
      badge: null 
    },
    { 
      id: 'messages', 
      label: 'Messages', 
      icon: MessageSquare, 
      path: '/teacher/messages',
      badge: '3' 
    },
    { 
      id: 'settings', 
      label: 'Settings', 
      icon: Settings, 
      path: '/teacher/settings',
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
                    ? 'bg-green-50 text-green-700 font-medium' 
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-5 h-5 ${active ? 'text-green-600' : 'text-gray-500'}`} />
                  <span className="text-sm">{item.label}</span>
                </div>
                {item.badge && (
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    active 
                      ? 'bg-green-200 text-green-800' 
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        
        {/* Quick Actions */}
        <div className="mt-8 p-4 bg-gradient-to-br from-green-50 to-teal-50 rounded-lg">
          <h4 className="text-sm font-semibold text-gray-800 mb-3">Quick Actions</h4>
          <div className="space-y-2">
            <button 
              onClick={() => router.push('/teacher/students/add')}
              className="w-full text-left text-xs px-3 py-2 bg-white rounded hover:bg-gray-50"
            >
              + Add Student
            </button>
            <button 
              onClick={() => router.push('/teacher/assignments/create')}
              className="w-full text-left text-xs px-3 py-2 bg-white rounded hover:bg-gray-50"
            >
              + Create Assignment
            </button>
            <button 
              onClick={() => router.push('/teacher/reports/generate')}
              className="w-full text-left text-xs px-3 py-2 bg-white rounded hover:bg-gray-50"
            >
              + Generate Report
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}