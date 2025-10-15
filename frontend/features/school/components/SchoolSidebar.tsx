'use client';

import { 
  LayoutDashboard, 
  Users, 
  GraduationCap, 
  BookOpen, 
  FileText, 
  Settings,
  TrendingUp,
  Calendar,
  DollarSign,
  MessageSquare,
  Shield,
  Database
} from 'lucide-react';
import { useSchoolStore } from '../state/useSchoolStore';
import { motion } from 'framer-motion';

export default function SchoolSidebar() {
  const { activeView, setActiveView } = useSchoolStore();
  
  const { teachers, students, classes } = useSchoolStore();
  
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, badge: null },
    { id: 'teachers', label: 'Teachers', icon: Users, badge: teachers.length > 0 ? teachers.length.toString() : null },
    { id: 'students', label: 'Students', icon: GraduationCap, badge: students.length > 0 ? students.length.toString() : null },
    { id: 'classes', label: 'Classes', icon: BookOpen, badge: classes.length > 0 ? classes.length.toString() : null },
    { id: 'reports', label: 'Reports & Analytics', icon: TrendingUp, badge: null },
    { id: 'calendar', label: 'Calendar', icon: Calendar, badge: null },
    { id: 'messages', label: 'Messages', icon: MessageSquare, badge: null },
    { id: 'security', label: 'Security', icon: Shield, badge: null },
    { id: 'settings', label: 'Settings', icon: Settings, badge: null }
  ];
  
  return (
    <aside className="w-64 bg-white border-r border-gray-200 h-[calc(100vh-73px)]">
      <nav className="p-4 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id as any)}
              className={`
                w-full flex items-center justify-between px-3 py-2.5 rounded-lg
                transition-all duration-200 group relative
                ${
                  isActive
                    ? 'bg-blue-50 text-blue-600'
                    : 'hover:bg-gray-50 text-gray-700 hover:text-gray-900'
                }
              `}
            >
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-blue-50 rounded-lg"
                  initial={false}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
              
              <div className="flex items-center gap-3 relative z-10">
                <Icon className={`w-5 h-5 ${isActive ? 'text-blue-600' : 'text-gray-500'}`} />
                <span className="text-sm font-medium">{item.label}</span>
              </div>
              
              {item.badge && (
                <span className={`
                  relative z-10 text-xs px-2 py-0.5 rounded-full
                  ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600'
                  }
                `}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>
      
    </aside>
  );
}