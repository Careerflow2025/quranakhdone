'use client';

import { motion } from 'framer-motion';
import { 
  Users, 
  GraduationCap, 
  BookOpen, 
  Calendar,
  MessageSquare,
  Clipboard,
  ArrowRight,
  Sparkles,
  Award,
  ChevronRight,
  BarChart3,
  Clock
} from 'lucide-react';
import { useTeacherStore } from '@/features/teacher/state/useTeacherStore';

export default function TeacherOnboarding() {
  const { setActiveView } = useTeacherStore();

  const features = [
    {
      icon: Users,
      title: 'View Your Students',
      description: 'Access your assigned students and track their individual Quran memorization progress',
      action: 'View Students',
      view: 'students',
      color: 'blue'
    },
    {
      icon: BookOpen,
      title: 'Manage Classes',
      description: 'Organize your teaching schedule and manage different class levels effectively',
      action: 'View Classes',
      view: 'classes',
      color: 'purple'
    },
    {
      icon: Clipboard,
      title: 'Create Assignments',
      description: 'Assign memorization tasks and track homework completion for each student',
      action: 'Create Assignment',
      view: 'assignments',
      color: 'orange'
    },
    {
      icon: BarChart3,
      title: 'Track Progress',
      description: 'Monitor detailed progress reports and identify areas where students need support',
      action: 'View Progress',
      view: 'progress',
      color: 'indigo'
    },
    {
      icon: MessageSquare,
      title: 'Parent Communication',
      description: 'Send updates to parents about their children\'s progress and achievements',
      action: 'Messages',
      view: 'messages',
      color: 'green'
    },
    {
      icon: Calendar,
      title: 'Your Schedule',
      description: 'Manage your teaching calendar and schedule one-on-one recitation sessions',
      action: 'View Schedule',
      view: 'schedule',
      color: 'red'
    }
  ];

  const handleFeatureClick = (view: string) => {
    setActiveView(view as any);
  };

  return (
    <div className="min-h-[calc(100vh-200px)] flex flex-col items-center justify-center p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-6xl w-full"
      >
        {/* Welcome Header */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
            className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full mb-6"
          >
            <Award className="w-10 h-10 text-blue-600" />
          </motion.div>
          
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome to Your Teacher Dashboard
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Everything you need to guide your students on their Quran memorization journey. 
            Let\'s get started by exploring your teaching tools.
          </p>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            const bgColor = {
              blue: 'from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200',
              green: 'from-green-50 to-green-100 hover:from-green-100 hover:to-green-200',
              purple: 'from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200',
              orange: 'from-orange-50 to-orange-100 hover:from-orange-100 hover:to-orange-200',
              red: 'from-red-50 to-red-100 hover:from-red-100 hover:to-red-200',
              indigo: 'from-indigo-50 to-indigo-100 hover:from-indigo-100 hover:to-indigo-200'
            }[feature.color];
            
            const iconColor = {
              blue: 'text-blue-600',
              green: 'text-green-600',
              purple: 'text-purple-600',
              orange: 'text-orange-600',
              red: 'text-red-600',
              indigo: 'text-indigo-600'
            }[feature.color];

            const buttonColor = {
              blue: 'bg-blue-600 hover:bg-blue-700',
              green: 'bg-green-600 hover:bg-green-700',
              purple: 'bg-purple-600 hover:bg-purple-700',
              orange: 'bg-orange-600 hover:bg-orange-700',
              red: 'bg-red-600 hover:bg-red-700',
              indigo: 'bg-indigo-600 hover:bg-indigo-700'
            }[feature.color];

            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`bg-gradient-to-br ${bgColor} rounded-xl p-6 border border-white/50 hover:shadow-lg transition-all duration-300 cursor-pointer group`}
                onClick={() => handleFeatureClick(feature.view)}
              >
                <div className="flex flex-col h-full">
                  <div className={`w-12 h-12 rounded-lg bg-white/80 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <Icon className={`w-6 h-6 ${iconColor}`} />
                  </div>
                  
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {feature.title}
                  </h3>
                  
                  <p className="text-sm text-gray-600 mb-4 flex-grow">
                    {feature.description}
                  </p>
                  
                  <button className={`w-full ${buttonColor} text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2`}>
                    {feature.action}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Teaching Tips */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-12 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200"
        >
          <div className="flex items-start gap-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Sparkles className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900 mb-3">Teaching Best Practices</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="flex items-start gap-2">
                  <ChevronRight className="w-4 h-4 text-blue-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Daily Progress Checks</p>
                    <p className="text-xs text-gray-600">Review each student\'s memorization daily</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <ChevronRight className="w-4 h-4 text-blue-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Parent Updates</p>
                    <p className="text-xs text-gray-600">Send weekly progress reports to parents</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <ChevronRight className="w-4 h-4 text-blue-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Personalized Feedback</p>
                    <p className="text-xs text-gray-600">Provide individual guidance for each student</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <ChevronRight className="w-4 h-4 text-blue-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Celebrate Achievements</p>
                    <p className="text-xs text-gray-600">Recognize milestones and progress</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Quick Stats */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4"
        >
          <div className="bg-white rounded-lg border p-4 text-center">
            <Clock className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">0</p>
            <p className="text-xs text-gray-500">Students Assigned</p>
          </div>
          <div className="bg-white rounded-lg border p-4 text-center">
            <BookOpen className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">0</p>
            <p className="text-xs text-gray-500">Active Classes</p>
          </div>
          <div className="bg-white rounded-lg border p-4 text-center">
            <Clipboard className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">0</p>
            <p className="text-xs text-gray-500">Assignments</p>
          </div>
          <div className="bg-white rounded-lg border p-4 text-center">
            <MessageSquare className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">0</p>
            <p className="text-xs text-gray-500">Messages</p>
          </div>
        </motion.div>

        {/* Tour Button */}
        <div className="text-center mt-8">
          <button 
            onClick={() => {
              localStorage.removeItem('quranakh_teacher_tour_completed');
              window.location.reload();
            }}
            className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center gap-2 mx-auto"
          >
            <BookOpen className="w-4 h-4" />
            Take the interactive tour
          </button>
        </div>
      </motion.div>
    </div>
  );
}