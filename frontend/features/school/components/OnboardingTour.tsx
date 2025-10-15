'use client';

import { useState, useEffect } from 'react';
import { X, ChevronRight, ChevronLeft, BookOpen, Users, GraduationCap, Shield, Calendar, BarChart3, Settings, CheckCircle } from 'lucide-react';

interface TourStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  target?: string;
  position?: 'center' | 'top-right' | 'bottom-left';
}

const tourSteps: TourStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Quranakh School Dashboard!',
    description: 'Let\'s take a quick tour to help you get started with managing your Quran education institution. This platform helps you organize teachers, students, and classes efficiently.',
    icon: <BookOpen className="w-8 h-8 text-emerald-600" />,
    position: 'center'
  },
  {
    id: 'teachers',
    title: 'Manage Your Teachers',
    description: 'Add and manage teacher accounts. Teachers can track student progress, provide feedback, and communicate with parents about their children\'s Quran learning journey.',
    icon: <Users className="w-8 h-8 text-blue-600" />,
    target: 'teachers-section',
    position: 'top-right'
  },
  {
    id: 'students',
    title: 'Student Management',
    description: 'Register students and track their Quran memorization progress. Each student gets a unique profile where you can monitor their achievements and areas for improvement.',
    icon: <GraduationCap className="w-8 h-8 text-purple-600" />,
    target: 'students-section',
    position: 'top-right'
  },
  {
    id: 'classes',
    title: 'Organize Classes',
    description: 'Create and schedule classes, assign teachers, and group students by level. Manage timetables and ensure smooth coordination of your Quran education programs.',
    icon: <Calendar className="w-8 h-8 text-orange-600" />,
    target: 'classes-section',
    position: 'bottom-left'
  },
  {
    id: 'analytics',
    title: 'Track Performance',
    description: 'View detailed analytics and reports on student progress, attendance, and overall school performance. Make data-driven decisions to improve your institution.',
    icon: <BarChart3 className="w-8 h-8 text-indigo-600" />,
    target: 'analytics-section',
    position: 'bottom-left'
  },
  {
    id: 'security',
    title: 'Security & Access Control',
    description: 'Manage user permissions and access levels. Control who can view and edit different parts of your school\'s data. Keep your institution\'s information secure.',
    icon: <Shield className="w-8 h-8 text-red-600" />,
    target: 'security-section',
    position: 'bottom-left'
  },
  {
    id: 'settings',
    title: 'Customize Your School',
    description: 'Configure school-wide settings, academic terms, grading systems, and notification preferences. Tailor the platform to match your institution\'s needs.',
    icon: <Settings className="w-8 h-8 text-gray-600" />,
    target: 'settings-section',
    position: 'bottom-left'
  },
  {
    id: 'complete',
    title: 'You\'re All Set!',
    description: 'You\'ve completed the tour! Start by adding your first teacher or student. Remember, you can always access help from the menu if you need assistance.',
    icon: <CheckCircle className="w-8 h-8 text-green-600" />,
    position: 'center'
  }
];

export default function OnboardingTour() {
  const [isVisible, setIsVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [hasSeenTour, setHasSeenTour] = useState(false);

  useEffect(() => {
    const tourSeen = localStorage.getItem('quranakh_school_tour_completed');
    if (!tourSeen) {
      setTimeout(() => setIsVisible(true), 1000);
    } else {
      setHasSeenTour(true);
    }
  }, []);

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    localStorage.setItem('quranakh_school_tour_completed', 'true');
    setIsVisible(false);
    setHasSeenTour(true);
  };

  const handleComplete = () => {
    localStorage.setItem('quranakh_school_tour_completed', 'true');
    setIsVisible(false);
    setHasSeenTour(true);
  };

  const handleRestart = () => {
    setCurrentStep(0);
    setIsVisible(true);
  };

  const currentTourStep = tourSteps[currentStep];
  const isLastStep = currentStep === tourSteps.length - 1;
  const isFirstStep = currentStep === 0;

  if (!isVisible && hasSeenTour) {
    return (
      <button
        onClick={handleRestart}
        className="fixed bottom-6 right-6 bg-emerald-600 text-white px-4 py-2 rounded-full shadow-lg hover:bg-emerald-700 transition-colors flex items-center gap-2 z-40"
      >
        <BookOpen className="w-4 h-4" />
        Take Tour
      </button>
    );
  }

  if (!isVisible) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 z-50 transition-opacity" />
      
      {/* Highlight Target Element */}
      {currentTourStep.target && (
        <div 
          className="fixed z-[51] pointer-events-none"
          style={{
            boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.6)',
          }}
          data-highlight={currentTourStep.target}
        />
      )}

      {/* Tour Modal */}
      <div 
        className={`fixed z-[52] transform -translate-x-1/2 -translate-y-1/2 
          ${currentTourStep.position === 'center' ? 'top-1/2 left-1/2' : ''}
          ${currentTourStep.position === 'top-right' ? 'top-1/3 left-2/3' : ''}
          ${currentTourStep.position === 'bottom-left' ? 'top-2/3 left-1/3' : ''}
        `}
      >
        <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-[90vw] animate-in fade-in slide-in-from-bottom-4 duration-300">
          {/* Close button */}
          <button
            onClick={handleSkip}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-gray-50 rounded-full">
              {currentTourStep.icon}
            </div>
          </div>

          {/* Content */}
          <h2 className="text-2xl font-bold text-gray-900 mb-4 text-center">
            {currentTourStep.title}
          </h2>
          <p className="text-gray-600 mb-8 text-center leading-relaxed">
            {currentTourStep.description}
          </p>

          {/* Progress dots */}
          <div className="flex justify-center gap-2 mb-6">
            {tourSteps.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentStep 
                    ? 'bg-emerald-600 w-8' 
                    : index < currentStep 
                    ? 'bg-emerald-400' 
                    : 'bg-gray-300'
                }`}
              />
            ))}
          </div>

          {/* Navigation */}
          <div className="flex justify-between items-center">
            <button
              onClick={handlePrev}
              disabled={isFirstStep}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors
                ${isFirstStep 
                  ? 'text-gray-400 cursor-not-allowed' 
                  : 'text-gray-600 hover:bg-gray-100'
                }`}
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>

            <button
              onClick={handleSkip}
              className="text-gray-500 hover:text-gray-700 transition-colors text-sm"
            >
              Skip tour
            </button>

            {isLastStep ? (
              <button
                onClick={handleComplete}
                className="flex items-center gap-2 px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
              >
                Get Started
                <CheckCircle className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="flex items-center gap-2 px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}