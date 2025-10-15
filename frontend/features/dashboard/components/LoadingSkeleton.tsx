'use client';

import { motion } from 'framer-motion';

export default function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header Skeleton */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-30">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-64 bg-gray-200 rounded mt-2 animate-pulse" />
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-200 rounded-lg animate-pulse" />
              <div className="w-10 h-10 bg-gray-200 rounded-lg animate-pulse" />
              <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse" />
            </div>
          </div>
        </div>
      </div>
      
      {/* Stats Bar Skeleton */}
      <div className="bg-white border-b px-6 py-4">
        <div className="grid grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gray-200 rounded-lg animate-pulse" />
              <div>
                <div className="h-6 w-16 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 w-24 bg-gray-200 rounded mt-1 animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Action Bar Skeleton */}
      <div className="bg-white border-b px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-32 bg-gray-200 rounded-lg animate-pulse" />
            <div className="h-10 w-36 bg-gray-200 rounded-lg animate-pulse" />
            <div className="h-10 w-28 bg-gray-200 rounded-lg animate-pulse" />
          </div>
          <div className="flex items-center gap-3">
            <div className="h-10 w-64 bg-gray-200 rounded-lg animate-pulse" />
            <div className="h-10 w-24 bg-gray-200 rounded-lg animate-pulse" />
          </div>
        </div>
      </div>
      
      {/* Class Cards Skeleton */}
      <main className="p-6">
        <div className="grid grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="h-64 bg-white rounded-2xl shadow-lg p-6"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 bg-gray-200 rounded-xl animate-pulse" />
                <div className="w-8 h-8 bg-gray-200 rounded animate-pulse" />
              </div>
              <div className="h-6 w-3/4 bg-gray-200 rounded mb-2 animate-pulse" />
              <div className="h-4 w-1/2 bg-gray-200 rounded mb-4 animate-pulse" />
              <div className="space-y-2 mt-auto">
                <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
                <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 w-1/2 bg-gray-200 rounded animate-pulse" />
              </div>
            </motion.div>
          ))}
        </div>
      </main>
    </div>
  );
}