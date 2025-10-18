// Supabase Client Configuration
// QuranAkh Production - Multi-tenant Quran Education Platform

import { createClient } from '@supabase/supabase-js';
import { Database } from '../database.types';

// Environment variables validation
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Please check your .env.local file.'
  );
}

// Create Supabase client with proper TypeScript typing
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// Helper function to get current user
export const getCurrentUser = async () => {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    console.error('Error fetching user:', error);
    return null;
  }

  return user;
};

// Helper function to get user profile with school and role
export const getUserProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from('user_profiles')
    .select(
      `
      *,
      schools:school_id (
        id,
        name,
        logo_url,
        timezone
      )
    `
    )
    .eq('user_id', userId)
    .single();

  if (error) {
    console.error('Error fetching profile:', error);
    return null;
  }

  return data;
};

// Helper function to sign out
export const signOut = async () => {
  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error('Error signing out:', error);
    throw error;
  }
};

// Real-time subscription helper for highlights
export const subscribeToHighlights = (
  studentId: string,
  callback: (payload: any) => void
) => {
  const channel = supabase
    .channel(`highlights:${studentId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'highlights',
        filter: `student_id=eq.${studentId}`,
      },
      callback
    )
    .subscribe();

  return channel;
};

// Real-time subscription helper for notifications
export const subscribeToNotifications = (
  userId: string,
  callback: (payload: any) => void
) => {
  const channel = supabase
    .channel(`notifications:${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      },
      callback
    )
    .subscribe();

  return channel;
};

// Storage helpers
export const uploadVoiceNote = async (
  file: File,
  path: string
): Promise<string | null> => {
  const { data, error } = await supabase.storage
    .from('voice-notes')
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    console.error('Error uploading voice note:', error);
    return null;
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from('voice-notes').getPublicUrl(data.path);

  return publicUrl;
};

// Upload assignment attachment
export const uploadAttachment = async (
  file: File,
  path: string
): Promise<string | null> => {
  const { data, error } = await supabase.storage
    .from('attachments')
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    console.error('Error uploading attachment:', error);
    return null;
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from('attachments').getPublicUrl(data.path);

  return publicUrl;
};

export default supabase;
