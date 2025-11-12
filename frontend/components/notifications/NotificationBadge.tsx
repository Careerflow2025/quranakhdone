/**
 * NotificationBadge Component
 *
 * Purpose: Display notification count badge on section icons
 * Features:
 * - Shows count at top-right of icon
 * - Disappears when count is 0
 * - Auto-updates with real-time changes
 */

import React from 'react';
import { NotificationSection } from '@/lib/types/notifications';
import { useSectionNotifications } from '@/hooks/useSectionNotifications';

interface NotificationBadgeProps {
  section: NotificationSection;
  className?: string;
}

export function NotificationBadge({ section, className = '' }: NotificationBadgeProps) {
  const { getSectionCount } = useSectionNotifications();
  const count = getSectionCount(section);

  // Don't render if no notifications
  if (count === 0) {
    return null;
  }

  return (
    <span
      className={`absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-red-500 rounded-full ${className}`}
    >
      {count > 99 ? '99+' : count}
    </span>
  );
}
