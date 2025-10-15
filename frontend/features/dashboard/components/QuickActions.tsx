'use client';

import { motion } from 'framer-motion';
import {
  Plus,
  FileSpreadsheet,
  Calendar,
  Bell,
  BarChart3,
  Settings,
  Download,
  Upload,
  UserPlus,
  BookOpen,
  Video,
  MessageSquare
} from 'lucide-react';

interface QuickActionsProps {
  onAddClass: () => void;
  onImportStudents: () => void;
}

export default function QuickActions({ onAddClass, onImportStudents }: QuickActionsProps) {
  const actions = [
    {
      icon: Plus,
      label: 'Add Class',
      color: 'emerald',
      onClick: onAddClass
    },
    {
      icon: UserPlus,
      label: 'Add Student',
      color: 'blue',
      onClick: onImportStudents
    },
    {
      icon: Calendar,
      label: 'Schedule',
      color: 'purple',
      onClick: () => console.log('Schedule')
    },
    {
      icon: Video,
      label: 'Start Session',
      color: 'red',
      onClick: () => console.log('Start session')
    },
    {
      icon: BarChart3,
      label: 'Reports',
      color: 'orange',
      onClick: () => console.log('Reports')
    },
    {
      icon: MessageSquare,
      label: 'Messages',
      color: 'indigo',
      onClick: () => console.log('Messages')
    }
  ];
  
  const getColorClasses = (color: string) => {
    const colors: Record<string, string> = {
      emerald: 'bg-emerald-100 hover:bg-emerald-200 text-emerald-600',
      blue: 'bg-blue-100 hover:bg-blue-200 text-blue-600',
      purple: 'bg-purple-100 hover:bg-purple-200 text-purple-600',
      red: 'bg-red-100 hover:bg-red-200 text-red-600',
      orange: 'bg-orange-100 hover:bg-orange-200 text-orange-600',
      indigo: 'bg-indigo-100 hover:bg-indigo-200 text-indigo-600'
    };
    return colors[color] || colors.emerald;
  };
  
  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <h3 className="text-lg font-bold text-gray-800 mb-4">Quick Actions</h3>
      <div className="grid grid-cols-3 gap-3">
        {actions.map((action, index) => (
          <motion.button
            key={index}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={action.onClick}
            className={`p-4 rounded-xl transition-colors ${getColorClasses(action.color)}`}
          >
            <action.icon className="w-6 h-6 mx-auto mb-2" />
            <p className="text-xs font-medium">{action.label}</p>
          </motion.button>
        ))}
      </div>
    </div>
  );
}