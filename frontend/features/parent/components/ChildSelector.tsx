'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, ChevronDown, User, BookOpen, TrendingUp, AlertCircle } from 'lucide-react';
import { useParentStore, Child } from '../state/useParentStore';

export default function ChildSelector() {
  const [isOpen, setIsOpen] = useState(false);
  const { children, currentChild, setCurrentChild } = useParentStore();

  const handleSelectChild = (child: Child) => {
    setCurrentChild(child);
    setIsOpen(false);
  };

  const getProgressColor = (progress?: number) => {
    if (!progress) return 'bg-gray-200';
    if (progress >= 80) return 'bg-green-500';
    if (progress >= 60) return 'bg-yellow-500';
    if (progress >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getProgressPercentage = (child: Child) => {
    if (!child.progress) return 0;
    return Math.round((child.progress.pagesMemorized / child.progress.totalPages) * 100);
  };
  
  return (
    <div className="relative">
      {/* Selector Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-4 py-2 bg-white rounded-lg shadow-sm hover:shadow-md transition-all border border-gray-200"
      >
        <div className="flex items-center gap-3">
          {currentChild ? (
            <>
              <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                {currentChild.name.charAt(0).toUpperCase()}
              </div>
              <div className="text-left">
                <p className="font-semibold text-gray-800">{currentChild.name}</p>
                <p className="text-xs text-gray-500">{currentChild.class}</p>
              </div>
            </>
          ) : (
            <>
              <Users className="w-5 h-5 text-gray-600" />
              <span className="text-gray-600">Select a child</span>
            </>
          )}
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full right-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden z-50 min-w-[320px]"
          >
            <div className="p-3 bg-gray-50 border-b">
              <p className="text-sm font-medium text-gray-700">Select Child to View</p>
              <p className="text-xs text-gray-500 mt-1">
                {children.length} {children.length === 1 ? 'child' : 'children'} enrolled
              </p>
            </div>
            
            <div className="max-h-96 overflow-y-auto">
              {children.length === 0 ? (
                <div className="p-8 text-center text-gray-400">
                  <User className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No children found</p>
                </div>
              ) : (
                children.map((child) => (
                  <button
                    key={child.id}
                    onClick={() => handleSelectChild(child)}
                    className={`w-full p-4 hover:bg-gray-50 transition-colors text-left border-b last:border-b-0 ${
                      currentChild?.id === child.id ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Avatar */}
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                        {child.name.charAt(0).toUpperCase()}
                      </div>

                      {/* Info */}
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-semibold text-gray-800">{child.name}</h3>
                          {currentChild?.id === child.id && (
                            <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full">
                              Current
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 text-xs text-gray-500 mb-2">
                          <span className="flex items-center gap-1">
                            <BookOpen className="w-3 h-3" />
                            {child.class}
                          </span>
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {child.teacher}
                          </span>
                        </div>
                        
                        {/* Progress */}
                        {child.progress && (
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-gray-600">Progress</span>
                              <span className="font-medium">{getProgressPercentage(child)}%</span>
                            </div>
                            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className={`h-full transition-all duration-300 ${getProgressColor(getProgressPercentage(child))}`}
                                style={{ width: `${getProgressPercentage(child)}%` }}
                              />
                            </div>

                            {/* Stats */}
                            <div className="flex items-center justify-between mt-2 text-xs">
                              <span className="text-gray-600">
                                {child.progress.pagesMemorized} / {child.progress.totalPages} pages
                              </span>
                              <span className="text-gray-600">
                                Current: {child.progress.currentSurah}
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Last Activity */}
                        {child.progress?.lastReviewDate && (
                          <p className="text-xs text-gray-400 mt-2">
                            Last review: {new Date(child.progress.lastReviewDate).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
            
            {/* Footer */}
            {children.length > 1 && (
              <div className="p-3 bg-gray-50 border-t">
                <p className="text-xs text-gray-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Switch between children to view their individual progress
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}