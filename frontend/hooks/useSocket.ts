import { useEffect, useCallback } from 'react';
import { socketService } from '@/lib/socket';
import { useAuthStore } from '@/store/authStore';

export function useSocket() {
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) {
      socketService.connect();
    } else {
      socketService.disconnect();
    }

    return () => {
      socketService.disconnect();
    };
  }, [isAuthenticated]);

  const joinRoom = useCallback((room: string) => {
    socketService.joinRoom(room);
  }, []);

  const leaveRoom = useCallback((room: string) => {
    socketService.leaveRoom(room);
  }, []);

  const emit = useCallback((event: string, ...args: any[]) => {
    socketService.emit(event, ...args);
  }, []);

  const on = useCallback((event: string, callback: (...args: any[]) => void) => {
    socketService.on(event as any, callback as any);
  }, []);

  const off = useCallback((event: string, callback?: (...args: any[]) => void) => {
    socketService.off(event as any, callback as any);
  }, []);

  return {
    connected: socketService.connected,
    joinRoom,
    leaveRoom,
    emit,
    on,
    off,
  };
}