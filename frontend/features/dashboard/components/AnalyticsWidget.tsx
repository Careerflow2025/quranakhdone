'use client';

import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  BarChart3,
  PieChart,
  Users,
  Clock,
  Target,
  Award
} from 'lucide-react';

interface AnalyticsWidgetProps {
  className?: string;
}

export default function AnalyticsWidget({ className = '' }: AnalyticsWidgetProps) {
  const weeklyData = [
    { day: 'Mon', attendance: 85, performance: 78 },
    { day: 'Tue', attendance: 92, performance: 82 },
    { day: 'Wed', attendance: 88, performance: 85 },
    { day: 'Thu', attendance: 95, performance: 88 },
    { day: 'Fri', attendance: 90, performance: 86 },
    { day: 'Sat', attendance: 87, performance: 84 },
    { day: 'Sun', attendance: 0, performance: 0 }
  ];
  
  const getBarHeight = (value: number) => `${(value / 100) * 120}px`;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white rounded-2xl shadow-lg p-6 ${className}`}
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-gray-800">Weekly Analytics</h3>
          <p className="text-sm text-gray-500">Performance Overview</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <BarChart3 className="w-5 h-5 text-gray-600" />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <PieChart className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>
      
      {/* Key Metrics */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="text-center">
          <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mx-auto mb-2">
            <Users className="w-6 h-6 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-gray-800">92%</p>
          <p className="text-xs text-gray-500">Attendance</p>
          <div className="flex items-center justify-center gap-1 mt-1">
            <TrendingUp className="w-3 h-3 text-green-500" />
            <span className="text-xs text-green-500">+5%</span>
          </div>
        </div>
        
        <div className="text-center">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-2">
            <Target className="w-6 h-6 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-gray-800">85%</p>
          <p className="text-xs text-gray-500">Completion</p>
          <div className="flex items-center justify-center gap-1 mt-1">
            <TrendingUp className="w-3 h-3 text-green-500" />
            <span className="text-xs text-green-500">+3%</span>
          </div>
        </div>
        
        <div className="text-center">
          <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-2">
            <Activity className="w-6 h-6 text-purple-600" />
          </div>
          <p className="text-2xl font-bold text-gray-800">78%</p>
          <p className="text-xs text-gray-500">Engagement</p>
          <div className="flex items-center justify-center gap-1 mt-1">
            <TrendingDown className="w-3 h-3 text-red-500" />
            <span className="text-xs text-red-500">-2%</span>
          </div>
        </div>
        
        <div className="text-center">
          <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-2">
            <Award className="w-6 h-6 text-orange-600" />
          </div>
          <p className="text-2xl font-bold text-gray-800">4.8</p>
          <p className="text-xs text-gray-500">Rating</p>
          <div className="flex items-center justify-center gap-1 mt-1">
            <TrendingUp className="w-3 h-3 text-green-500" />
            <span className="text-xs text-green-500">+0.2</span>
          </div>
        </div>
      </div>
      
      {/* Chart */}
      <div className="border-t pt-4">
        <div className="flex items-end justify-between h-32 mb-2">
          {weeklyData.map((data, index) => (
            <div key={index} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full flex gap-1 items-end justify-center">
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: getBarHeight(data.attendance) }}
                  transition={{ delay: index * 0.1 }}
                  className="w-3 bg-emerald-400 rounded-t"
                />
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: getBarHeight(data.performance) }}
                  transition={{ delay: index * 0.1 + 0.05 }}
                  className="w-3 bg-blue-400 rounded-t"
                />
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-between">
          {weeklyData.map((data, index) => (
            <div key={index} className="flex-1 text-center">
              <p className="text-xs text-gray-500">{data.day}</p>
            </div>
          ))}
        </div>
      </div>
      
      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-emerald-400 rounded" />
          <span className="text-xs text-gray-600">Attendance</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-blue-400 rounded" />
          <span className="text-xs text-gray-600">Performance</span>
        </div>
      </div>
    </motion.div>
  );
}