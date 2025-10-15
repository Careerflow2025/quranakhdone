import { io, Socket } from 'socket.io-client';
import { AuthService } from './auth';
import { SocketEvents } from '@/types';

class SocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  connect(): void {
    if (this.socket?.connected) return;

    const token = AuthService.getToken();
    if (!token) return;

    this.socket = io(process.env.NODE_ENV === 'development' ? 'http://localhost:5000' : '', {
      auth: {
        token,
      },
      transports: ['websocket'],
      autoConnect: true,
    });

    this.setupEventListeners();
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  private setupEventListeners(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Socket connected');
      this.reconnectAttempts = 0;
      
      // Join user's school room
      const user = AuthService.getUser();
      if (user?.profile.school_id) {
        this.socket?.emit('join:school', user.profile.school_id);
      }
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++;
        setTimeout(() => {
          this.connect();
        }, 1000 * this.reconnectAttempts);
      }
    });

    // Authentication error
    this.socket.on('auth:error', () => {
      console.error('Socket authentication failed');
      AuthService.logout();
    });
  }

  // Event emission methods
  joinRoom(room: string): void {
    this.socket?.emit('join:room', room);
  }

  leaveRoom(room: string): void {
    this.socket?.emit('leave:room', room);
  }

  // Highlight events
  onHighlightCreated(callback: (highlight: any) => void): void {
    this.socket?.on('highlight:created', callback);
  }

  onHighlightUpdated(callback: (highlight: any) => void): void {
    this.socket?.on('highlight:updated', callback);
  }

  onHighlightDeleted(callback: (highlightId: string) => void): void {
    this.socket?.on('highlight:deleted', callback);
  }

  // Assignment events
  onAssignmentUpdated(callback: (assignment: any) => void): void {
    this.socket?.on('assignment:updated', callback);
  }

  // Note events
  onNoteCreated(callback: (note: any) => void): void {
    this.socket?.on('note:created', callback);
  }

  // Generic event listener
  on<K extends keyof SocketEvents>(event: K, callback: SocketEvents[K]): void {
    this.socket?.on(event, callback);
  }

  off<K extends keyof SocketEvents>(event: K, callback?: SocketEvents[K]): void {
    this.socket?.off(event, callback);
  }

  // Emit events
  emit(event: string, ...args: any[]): void {
    this.socket?.emit(event, ...args);
  }

  // Check connection status
  get connected(): boolean {
    return this.socket?.connected ?? false;
  }
}

// Create a singleton instance
export const socketService = new SocketService();