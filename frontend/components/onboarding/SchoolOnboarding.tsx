'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SchoolOnboarding() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  
  const steps = [
    {
      title: 'Welcome to Quran Mate',
      description: 'Let\'s get your school set up in just a few minutes',
      icon: '🎉',
      action: 'Get Started'
    },
    {
      title: 'Add Your First Teacher',
      description: 'Teachers can manage classes and track student progress',
      icon: '👨‍🏫',
      action: 'Add Teacher',
      route: '/school/teachers'
    },
    {
      title: 'Create Your First Class',
      description: 'Organize students into classes for better management',
      icon: '📚',
      action: 'Create Class',
      route: '/school/classes'
    },
    {
      title: 'Enroll Students',
      description: 'Add students individually or import them in bulk',
      icon: '👥',
      action: 'Add Students',
      route: '/school/students'
    }
  ];

  const handleAction = (route?: string) => {
    if (route) {
      router.push(route);
    } else if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-6">
      <div className="max-w-2xl w-full">
        {/* Progress Indicator */}
        <div className="flex justify-center mb-8">
          {steps.map((_, index) => (
            <div
              key={index}
              className={`h-2 w-16 mx-1 rounded-full transition-colors ${
                index <= currentStep ? 'bg-emerald-500' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>

        {/* Current Step */}
        <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
          <div className="text-6xl mb-6">{steps[currentStep].icon}</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            {steps[currentStep].title}
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            {steps[currentStep].description}
          </p>
          
          <button
            onClick={() => handleAction(steps[currentStep].route)}
            className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg font-semibold hover:shadow-lg transform hover:-translate-y-0.5 transition-all"
          >
            {steps[currentStep].action}
          </button>

          {currentStep > 0 && (
            <button
              onClick={() => setCurrentStep(currentStep - 1)}
              className="ml-4 px-8 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
            >
              Back
            </button>
          )}

          {currentStep === steps.length - 1 && (
            <div className="mt-8">
              <button
                onClick={() => router.push('/school/dashboard')}
                className="text-gray-600 hover:text-gray-900 underline"
              >
                Skip setup for now
              </button>
            </div>
          )}
        </div>

        {/* Quick Tips */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl">📊</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">Track Progress</h3>
            <p className="text-sm text-gray-600">
              Monitor student performance with detailed analytics
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl">🔔</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">Stay Connected</h3>
            <p className="text-sm text-gray-600">
              Communicate with teachers and parents easily
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl">☁️</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">Cloud Backup</h3>
            <p className="text-sm text-gray-600">
              All your data is securely stored and backed up
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}