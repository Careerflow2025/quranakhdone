/**
 * useAttendance Hook - Attendance Data Fetching and Management
 * Created: 2025-10-22
 * Purpose: Custom hook for Attendance system following established patterns
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/store/authStore';
import { supabase } from '@/lib/supabase';

// Types matching our Attendance API
export interface AttendanceRecord {
  id: string;
  class_id: string;
  session_date: string; // YYYY-MM-DD
  student_id: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  notes: string | null;
  created_at: string;
}

export interface AttendanceWithDetails extends AttendanceRecord {
  class_name: string;
  student_name: string;
  student_email: string;
}

export interface AttendanceStats {
  total_records: number;
  total_sessions: number;
  present_count: number;
  absent_count: number;
  late_count: number;
  excused_count: number;
}

export interface StudentAttendanceSummary {
  student_id: string;
  student_name: string;
  student_email: string;
  present: number;
  absent: number;
  late: number;
  excused: number;
  total_sessions: number;
  attendance_rate: number; // percentage (0-100)
  trend: 'improving' | 'declining' | 'stable';
}

export interface AttendanceSummary {
  class_id: string;
  class_name: string;
  period: string;
  start_date: string;
  end_date: string;
  total_sessions: number;
  total_students: number;
  students: StudentAttendanceSummary[];
  overall_stats: {
    total_records: number;
    present_count: number;
    absent_count: number;
    late_count: number;
    excused_count: number;
    average_attendance_rate: number;
  };
}

export interface MarkAttendanceData {
  class_id: string;
  session_date: string; // YYYY-MM-DD
  records: Array<{
    student_id: string;
    status: 'present' | 'absent' | 'late' | 'excused';
    notes?: string;
  }>;
}

export interface UpdateAttendanceData {
  status?: 'present' | 'absent' | 'late' | 'excused';
  notes?: string;
}

export interface AttendanceFilters {
  class_id?: string;
  student_id?: string;
  start_date?: string;
  end_date?: string;
  status?: 'present' | 'absent' | 'late' | 'excused';
}

export function useAttendance() {
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Attendance records state
  const [records, setRecords] = useState<AttendanceWithDetails[]>([]);
  const [stats, setStats] = useState<AttendanceStats | null>(null);

  // Summary state
  const [summary, setSummary] = useState<AttendanceSummary | null>(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // Filters state
  const [filters, setFilters] = useState<AttendanceFilters>({});

  // Fetch attendance records with filters
  const fetchAttendance = useCallback(async (customFilters?: AttendanceFilters, page: number = 1) => {
    if (!user) {
      setError('User not authenticated');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Get current session for authorization
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('Please login to access attendance');
        setIsLoading(false);
        return;
      }

      const filtersToUse = customFilters || filters;

      // Build query string
      const params = new URLSearchParams();
      if (filtersToUse.class_id) params.append('class_id', filtersToUse.class_id);
      if (filtersToUse.student_id) params.append('student_id', filtersToUse.student_id);
      if (filtersToUse.start_date) params.append('start_date', filtersToUse.start_date);
      if (filtersToUse.end_date) params.append('end_date', filtersToUse.end_date);
      if (filtersToUse.status) params.append('status', filtersToUse.status);
      params.append('page', page.toString());
      params.append('limit', '20');

      const url = `/api/attendance?${params.toString()}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch attendance records');
      }

      const data = await response.json();

      if (data.success) {
        setRecords(data.data.records || []);
        setStats(data.data.stats || null);
        setCurrentPage(data.data.pagination?.page || 1);
        setTotalPages(data.data.pagination?.total_pages || 1);
        setTotalRecords(data.data.pagination?.total || 0);
      } else {
        throw new Error(data.error || 'Failed to fetch attendance records');
      }
    } catch (err: any) {
      console.error('Error fetching attendance records:', err);
      setError(err.message || 'Failed to load attendance records');
      setRecords([]);
      setStats(null);
    } finally {
      setIsLoading(false);
    }
  }, [user, filters]);

  // Mark attendance (bulk)
  const markAttendance = useCallback(async (data: MarkAttendanceData): Promise<boolean> => {
    if (!user) {
      setError('User not authenticated');
      return false;
    }

    try {
      setError(null);

      // Get current session for authorization
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('Please login to mark attendance');
        return false;
      }

      const response = await fetch('/api/attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to mark attendance');
      }

      const result = await response.json();

      if (result.success) {
        // Refresh attendance data after marking
        await fetchAttendance(filters, currentPage);
        return true;
      } else {
        throw new Error(result.error || 'Failed to mark attendance');
      }
    } catch (err: any) {
      console.error('Error marking attendance:', err);
      setError(err.message || 'Failed to mark attendance');
      return false;
    }
  }, [user, filters, currentPage, fetchAttendance]);

  // Update individual attendance record
  const updateAttendance = useCallback(async (recordId: string, data: UpdateAttendanceData): Promise<boolean> => {
    if (!user) {
      setError('User not authenticated');
      return false;
    }

    try {
      setError(null);

      // Get current session for authorization
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('Please login to update attendance');
        return false;
      }

      const response = await fetch(`/api/attendance/${recordId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update attendance');
      }

      const result = await response.json();

      if (result.success) {
        // Refresh attendance data after update
        await fetchAttendance(filters, currentPage);
        return true;
      } else {
        throw new Error(result.error || 'Failed to update attendance');
      }
    } catch (err: any) {
      console.error('Error updating attendance:', err);
      setError(err.message || 'Failed to update attendance');
      return false;
    }
  }, [user, filters, currentPage, fetchAttendance]);

  // Fetch attendance summary
  const fetchSummary = useCallback(async (
    class_id: string,
    options?: {
      student_id?: string;
      start_date?: string;
      end_date?: string;
      month?: string;
    }
  ) => {
    if (!user) {
      setError('User not authenticated');
      return;
    }

    try {
      setIsLoadingSummary(true);
      setError(null);

      // Get current session for authorization
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('Please login to access attendance summary');
        setIsLoadingSummary(false);
        return;
      }

      // Build query string
      const params = new URLSearchParams();
      params.append('class_id', class_id);
      if (options?.student_id) params.append('student_id', options.student_id);
      if (options?.start_date) params.append('start_date', options.start_date);
      if (options?.end_date) params.append('end_date', options.end_date);
      if (options?.month) params.append('month', options.month);

      const url = `/api/attendance/summary?${params.toString()}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch attendance summary');
      }

      const data = await response.json();

      if (data.success) {
        setSummary(data.data.summary || null);
      } else {
        throw new Error(data.error || 'Failed to fetch attendance summary');
      }
    } catch (err: any) {
      console.error('Error fetching attendance summary:', err);
      setError(err.message || 'Failed to load attendance summary');
      setSummary(null);
    } finally {
      setIsLoadingSummary(false);
    }
  }, [user]);

  // Update filters
  const updateFilters = useCallback((newFilters: Partial<AttendanceFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
    setCurrentPage(1); // Reset to first page when filters change
  }, []);

  // Clear filters
  const clearFilters = useCallback(() => {
    setFilters({});
    setCurrentPage(1);
  }, []);

  // Change page
  const changePage = useCallback((page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      fetchAttendance(filters, page);
    }
  }, [totalPages, filters, fetchAttendance]);

  // Refresh data (reload current page with current filters)
  const refreshData = useCallback(() => {
    fetchAttendance(filters, currentPage);
  }, [filters, currentPage, fetchAttendance]);

  // Export to CSV (client-side)
  const exportToCSV = useCallback(async (
    class_id: string,
    options?: {
      start_date?: string;
      end_date?: string;
      student_id?: string;
    }
  ) => {
    try {
      // Get session for authorization
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Please login to export attendance data');
      }

      // Fetch all records for export (no pagination)
      const params = new URLSearchParams();
      params.append('class_id', class_id);
      if (options?.student_id) params.append('student_id', options.student_id);
      if (options?.start_date) params.append('start_date', options.start_date);
      if (options?.end_date) params.append('end_date', options.end_date);
      params.append('limit', '1000'); // Large limit for export

      const response = await fetch(`/api/attendance?${params.toString()}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
      });
      const data = await response.json();

      if (data.success && data.data.records.length > 0) {
        const csvRows = [];
        
        // Header row
        csvRows.push('Date,Student Name,Student Email,Class,Status,Notes');

        // Data rows
        data.data.records.forEach((record: AttendanceWithDetails) => {
          const row = [
            record.session_date,
            `"${record.student_name}"`,
            record.student_email,
            `"${record.class_name}"`,
            record.status,
            record.notes ? `"${record.notes.replace(/"/g, '""')}"` : '',
          ];
          csvRows.push(row.join(','));
        });

        // Create blob and download
        const csvContent = csvRows.join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `attendance-export-${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        return true;
      } else {
        throw new Error('No records to export');
      }
    } catch (err: any) {
      console.error('Error exporting to CSV:', err);
      setError(err.message || 'Failed to export attendance data');
      return false;
    }
  }, []);

  // Auto-fetch on mount and filter changes
  useEffect(() => {
    if (user && (filters.class_id || filters.student_id)) {
      fetchAttendance(filters, currentPage);
    }
  }, [user, filters, currentPage]);

  return {
    // State
    isLoading,
    error,
    records,
    stats,
    summary,
    isLoadingSummary,
    currentPage,
    totalPages,
    totalRecords,
    filters,

    // Operations
    fetchAttendance,
    markAttendance,
    updateAttendance,
    fetchSummary,
    exportToCSV,

    // Filter management
    updateFilters,
    clearFilters,

    // Pagination
    changePage,

    // Utility
    refreshData,
  };
}
