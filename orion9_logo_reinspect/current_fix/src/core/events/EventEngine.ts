import { Event } from '../types';

export class EventEngine {
  private static instance: EventEngine;
  private events: Event[] = [];
  private listeners: Map<string, Array<(event: Event) => void>> = new Map();

  private constructor() {}

  public static getInstance(): EventEngine {
    if (!EventEngine.instance) {
      EventEngine.instance = new EventEngine();
    }
    return EventEngine.instance;
  }

  public publish(event: Event) {
    this.events.push(event);
    
    // Notify general listeners
    const generalListeners = this.listeners.get('*') || [];
    generalListeners.forEach(listener => listener(event));
    
    // Notify specific type listeners
    if (event.type) {
      const specificListeners = this.listeners.get(event.type) || [];
      specificListeners.forEach(listener => listener(event));
    }
  }

  public subscribe(eventType: string, callback: (event: Event) => void) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }
    this.listeners.get(eventType)!.push(callback);
  }

  public getEvents(): Event[] {
    return this.events;
  }
}

export const eventEngine = EventEngine.getInstance();
