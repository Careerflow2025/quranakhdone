'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface ResponsiveLayoutProps {
  children: ReactNode;
  sidebarOpen: boolean;
  sidebarWidth?: number;
}

export default function ResponsiveLayout({ 
  children, 
  sidebarOpen, 
  sidebarWidth = 320 
}: ResponsiveLayoutProps) {
  return (
    <motion.div
      className="flex min-h-screen bg-gradient-to-br from-gray-50 to-gray-100"
      initial={false}
    >
      {/* Main Content */}
      <motion.div
        className="flex-1"
        animate={{
          marginRight: sidebarOpen ? sidebarWidth : 0,
        }}
        transition={{
          type: 'spring',
          damping: 25,
          stiffness: 300,
        }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}