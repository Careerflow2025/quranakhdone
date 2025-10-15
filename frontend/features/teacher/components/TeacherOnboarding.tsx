'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  ChevronRight, 
  ChevronLeft,
  Users,
  BookOpen,
  Calendar,
  MessageCircle,
  TrendingUp,
  Settings,
  Award,
  FileText,
  Plus,
  Bell
} from 'lucide-react';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  targetElement?: string;
  position?: 'center' | 'top' | 'bottom' | 'left' | 'right';
}

const steps: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Your Teacher Dashboard!',
    description: 'Let\'s take a quick tour to help you get started with managing your classes and tracking student progress.',
    icon: <Award className="w-12 h-12 text-emerald-600" />
  },
  {
    id: 'sidebar',
    title: 'Navigation Sidebar',
    description: 'On the left side, you\'ll find the navigation menu. Access Dashboard, Students, Classes, Assignments, Schedule, Messages, and Settings from there.',
    icon: <BookOpen className="w-8 h-8 text-blue-600" />
  },
  {
    id: 'stats',
    title: 'Your Teaching Statistics',
    description: 'At the top of your dashboard, you can see important statistics: Total Students, Active Classes, Completion Rate, and Today\'s Classes.',
    icon: <TrendingUp className="w-8 h-8 text-purple-600" />
  },
  {
    id: 'classes',
    title: 'Class Management',
    description: 'The main area displays your classes. Each class card shows student count, schedule, and room information. You can create, edit, and manage classes here.',
    icon: <Users className="w-8 h-8 text-green-600" />
  },
  {
    id: 'add-class',
    title: 'Adding New Classes',
    description: 'Use the "Add Class" button at the top to create new Quran classes. Set the schedule, room, level, and capacity for each class.',
    icon: <Plus className="w-8 h-8 text-emerald-600" />
  },
  {
    id: 'students',
    title: 'Student Sidebar',
    description: 'On the right side, you\'ll see the student sidebar where you can view all students, add new ones, and drag them into classes.',
    icon: <Users className="w-8 h-8 text-indigo-600" />
  },
  {
    id: 'view-modes',
    title: 'Different View Modes',
    description: 'Switch between Card, List, and Calendar views using the buttons at the top. Each view presents your classes differently.',
    icon: <Calendar className="w-8 h-8 text-orange-600" />
  },
  {
    id: 'assignments',
    title: 'Create Assignments',
    description: 'Navigate to Assignments from the sidebar to give memorization, recitation, reading, or writing tasks to your students.',
    icon: <FileText className="w-8 h-8 text-orange-600" />
  },
  {
    id: 'schedule',
    title: 'Teaching Schedule',
    description: 'Use the Schedule section in the sidebar to manage your teaching timetable and set recurring classes.',
    icon: <Calendar className="w-8 h-8 text-red-600" />
  },
  {
    id: 'messages',
    title: 'Parent Communication',
    description: 'Access Messages from the sidebar to stay connected with parents and send updates about their child\'s progress.',
    icon: <MessageCircle className="w-8 h-8 text-blue-600" />
  },
  {
    id: 'complete',
    title: 'You\'re All Set!',
    description: 'Start creating classes, adding students, and helping them on their Quran learning journey. May Allah bless your teaching!',
    icon: <Award className="w-12 h-12 text-emerald-600" />
  }
];

export default function TeacherOnboarding() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const hasSeenTour = localStorage.getItem('teacherTourCompleted');
    console.log('Teacher Tour - hasSeenTour:', hasSeenTour);
    if (!hasSeenTour) {
      console.log('Starting teacher tour...');
      setTimeout(() => setIsOpen(true), 500);
    }
  }, []);

  // Removed highlighting functionality - just show the tour steps

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    localStorage.setItem('teacherTourCompleted', 'true');
    setIsOpen(false);
  };

  const handleSkip = () => {
    localStorage.setItem('teacherTourCompleted', 'true');
    setIsOpen(false);
  };


  if (!isOpen) return null;

  const step = steps[currentStep];

  return (
    <>
      {/* Backdrop */}
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 z-[9998]"
          onClick={handleSkip}
        />
      </AnimatePresence>


      {/* Modal - Always centered */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[10000] w-[450px] bg-white rounded-xl shadow-2xl p-6"
      >
        {/* Close button */}
        <button
          onClick={handleSkip}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Content */}
        <div className="flex flex-col items-center text-center">
          <div className="mb-4">
            {step.icon}
          </div>
          
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {step.title}
          </h3>
          
          <p className="text-gray-600 mb-6">
            {step.description}
          </p>

          {/* Progress dots */}
          <div className="flex gap-1 mb-6">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentStep
                    ? 'bg-emerald-600 w-6'
                    : index < currentStep
                    ? 'bg-emerald-300'
                    : 'bg-gray-300'
                }`}
              />
            ))}
          </div>

          {/* Navigation buttons */}
          <div className="flex gap-3 w-full">
            {currentStep > 0 && (
              <button
                onClick={handlePrev}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>
            )}
            
            {currentStep < steps.length - 1 ? (
              <>
                <button
                  onClick={handleSkip}
                  className="flex-1 px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Skip Tour
                </button>
                <button
                  onClick={handleNext}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              </>
            ) : (
              <button
                onClick={handleComplete}
                className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
              >
                Start Teaching!
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </>
  );
}