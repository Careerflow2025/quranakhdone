'use client';
import { useState, useEffect } from 'react';

interface HeroSectionProps {
  onGetStarted: () => void;
}

export default function HeroSection({ onGetStarted }: HeroSectionProps) {
  const [currentStat, setCurrentStat] = useState(0);
  const stats = [
    { number: '50,000+', label: 'Students Enrolled' },
    { number: '2,500+', label: 'Teachers Active' },
    { number: '500+', label: 'Schools Partnered' },
    { number: '15M+', label: 'Pages Annotated' }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStat((prev) => (prev + 1) % stats.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white via-emerald-50/30 to-white overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-8">
            {/* Badge */}
            <div className="inline-flex items-center space-x-2 bg-emerald-100 text-emerald-800 px-4 py-2 rounded-full">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="font-semibold">Trusted by Leading Islamic Schools Worldwide</span>
            </div>

            {/* Main Heading */}
            <div>
              <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                Transform Quran Education with
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-600"> Digital Excellence</span>
              </h1>
            </div>

            {/* Description */}
            <p className="text-xl text-gray-600 leading-relaxed">
              The world's most comprehensive platform for Quran memorization schools. Empower teachers with professional annotation tools, engage parents with real-time progress tracking, and streamline school operations with intelligent management systems.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={onGetStarted}
                className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-semibold text-lg hover:shadow-xl transform hover:-translate-y-1 transition-all"
              >
                Start Free 30-Day Trial
              </button>
              <button className="px-8 py-4 bg-white border-2 border-gray-200 text-gray-700 rounded-xl font-semibold text-lg hover:border-emerald-500 hover:text-emerald-600 transition-all">
                Watch Demo
              </button>
            </div>

            {/* Trust Indicators */}
            <div className="flex items-center space-x-8 pt-4">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full border-2 border-white flex items-center justify-center">
                    <span className="text-white text-xs font-bold">{i}</span>
                  </div>
                ))}
              </div>
              <div>
                <div className="flex items-center space-x-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <svg key={i} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-sm text-gray-600 mt-1">4.9/5 from 2,500+ reviews</p>
              </div>
            </div>
          </div>

          {/* Right Visual */}
          <div className="relative lg:pl-12">
            {/* Main Dashboard Preview */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-2xl transform rotate-3 opacity-20 blur-xl"></div>
              <div className="relative bg-white rounded-2xl shadow-2xl p-6 border border-gray-100">
                {/* Mock Dashboard Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-emerald-500 rounded-lg"></div>
                    <span className="font-semibold text-gray-900">Teacher Dashboard</span>
                  </div>
                  <div className="flex space-x-2">
                    <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
                    <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
                    <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
                  </div>
                </div>

                {/* Mock Quran Page with Annotations */}
                <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg p-8 mb-4">
                  <div className="space-y-3">
                    <div className="h-3 bg-gray-800 rounded w-full opacity-20"></div>
                    <div className="h-3 bg-gray-800 rounded w-5/6 opacity-20"></div>
                    <div className="relative">
                      <div className="h-3 bg-gray-800 rounded w-full opacity-20"></div>
                      <div className="absolute top-0 left-20 w-20 h-3 bg-green-500 opacity-60 rounded"></div>
                    </div>
                    <div className="relative">
                      <div className="h-3 bg-gray-800 rounded w-4/5 opacity-20"></div>
                      <div className="absolute top-0 left-10 w-16 h-3 bg-red-500 opacity-60 rounded"></div>
                    </div>
                    <div className="relative">
                      <div className="h-3 bg-gray-800 rounded w-full opacity-20"></div>
                      <div className="absolute top-0 left-32 w-24 h-3 bg-yellow-400 opacity-60 rounded"></div>
                    </div>
                  </div>
                </div>

                {/* Mock Annotation Tools */}
                <div className="flex space-x-2">
                  <div className="px-3 py-2 bg-green-100 text-green-700 rounded-lg text-sm font-medium">✓ Correct</div>
                  <div className="px-3 py-2 bg-red-100 text-red-700 rounded-lg text-sm font-medium">✗ Mistake</div>
                  <div className="px-3 py-2 bg-yellow-100 text-yellow-700 rounded-lg text-sm font-medium">⚡ Highlight</div>
                </div>
              </div>
            </div>

            {/* Floating Stats */}
            <div className="absolute -top-8 -right-8 bg-white rounded-xl shadow-xl p-4 animate-bounce">
              <div className="text-2xl font-bold text-emerald-600">{stats[currentStat].number}</div>
              <div className="text-sm text-gray-600">{stats[currentStat].label}</div>
            </div>

            {/* Floating Notification */}
            <div className="absolute -bottom-4 -left-4 bg-white rounded-xl shadow-xl p-4 flex items-center space-x-3">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <span className="text-lg">📚</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">New Progress Update</p>
                <p className="text-xs text-gray-500">Sarah completed Surah Al-Mulk</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}