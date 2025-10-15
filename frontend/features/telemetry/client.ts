// Client-side telemetry utility
// In a real implementation, this would send events to your analytics service

interface TelemetryEvent {
  event: string;
  properties?: Record<string, any>;
  timestamp?: string;
}

class TelemetryClient {
  private events: TelemetryEvent[] = [];
  private isEnabled: boolean = true;

  constructor() {
    // In development, you might want to disable telemetry
    this.isEnabled = process.env.NODE_ENV === 'production';
  }

  logEvent(event: string, properties?: Record<string, any>) {
    if (!this.isEnabled) {
      console.log(`[Telemetry] ${event}`, properties);
      return;
    }

    const telemetryEvent: TelemetryEvent = {
      event,
      properties,
      timestamp: new Date().toISOString()
    };

    this.events.push(telemetryEvent);
    
    // In a real implementation, you would send this to your analytics service
    // For now, we'll just log it to the console
    console.log('[Telemetry]', telemetryEvent);
    
    // Optional: Send to server or analytics service
    this.sendToServer(telemetryEvent);
  }

  private async sendToServer(event: TelemetryEvent) {
    try {
      // In a real implementation, you would POST to your telemetry endpoint
      // await fetch('/api/telemetry', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(event)
      // });
    } catch (error) {
      console.warn('Failed to send telemetry event:', error);
    }
  }

  getEvents(): TelemetryEvent[] {
    return [...this.events];
  }

  clearEvents() {
    this.events = [];
  }

  setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
  }
}

// Export singleton instance
export const telemetry = new TelemetryClient();

// Helper function for quick event logging
export function logEvent(event: string, properties?: Record<string, any>) {
  telemetry.logEvent(event, properties);
}