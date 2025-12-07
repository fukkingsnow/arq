import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from 'eventemitter2';

type EventListener = (...args: any[]) => void | Promise<void>;

interface EventMetadata {
  name: string;
  listeners: number;
  maxListeners: number;
}

@Injectable()
export class EventEmitterService {
  private emitter: EventEmitter2;

  constructor() {
    this.emitter = new EventEmitter2({
      wildcard: true,
      delimiter: '.',
      newListener: true,
      removeListener: true,
      maxListeners: 10
    });
  }

  /**
   * Emit an event
   */
  emit(eventName: string, ...args: any[]): boolean {
    return this.emitter.emit(eventName, ...args);
  }

  /**
   * Emit event asynchronously
   */
  async emitAsync(eventName: string, ...args: any[]): Promise<any[]> {
    return this.emitter.emitAsync(eventName, ...args);
  }

  /**
   * Subscribe to an event
   */
  on(eventName: string, listener: EventListener): this {
    this.emitter.on(eventName, listener);
    return this;
  }

  /**
   * Subscribe to an event once
   */
  once(eventName: string, listener: EventListener): this {
    this.emitter.once(eventName, listener);
    return this;
  }

  /**
   * Add listener at the beginning
   */
  prependListener(eventName: string, listener: EventListener): this {
    this.emitter.prependListener(eventName, listener);
    return this;
  }

  /**
   * Remove specific listener
   */
  off(eventName: string, listener: EventListener): this {
    this.emitter.off(eventName, listener);
    return this;
  }

  /**
   * Remove all listeners for an event
   */
  removeAllListeners(eventName?: string): this {
    this.emitter.removeAllListeners(eventName);
    return this;
  }

  /**
   * Get listener count for an event
   */
  listenerCount(eventName: string): number {
    return this.emitter.listenerCount(eventName);
  }

  /**
   * Get all listeners for an event
   */
  listeners(eventName: string): EventListener[] {
    return this.emitter.listeners(eventName);
  }

  /**
   * Get all event names
   */
  eventNames(): (string | symbol)[] {
    return this.emitter.eventNames() as (string | symbol)[];
  }

  /**
   * Get event metadata
   */
  getEventMetadata(eventName: string): EventMetadata {
    return {
      name: eventName,
      listeners: this.emitter.listenerCount(eventName),
      maxListeners: this.emitter.getMaxListeners()
    };
  }

  /**
   * Set max listeners
   */
  setMaxListeners(n: number): this {
    this.emitter.setMaxListeners(n);
    return this;
  }

  /**
   * Get max listeners
   */
  getMaxListeners(): number {
    return this.emitter.getMaxListeners();
  }

  /**
   * Check if event has listeners
   */
  hasListeners(eventName: string): boolean {
    return this.emitter.hasListeners(eventName) as boolean;
  }

  /**
   * Wait for event to be emitted
   */
  waitFor(eventName: string, timeout?: number): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const handler = (...args: any[]) => resolve(args);
      const timer = timeout ? setTimeout(() => {
        this.off(eventName, handler);
        reject(new Error(`Event '${eventName}' timeout`));
      }, timeout) : null;

      this.once(eventName, (...args: any[]) => {
        if (timer) clearTimeout(timer);
        resolve(args);
      });
    });
  }

  /**
   * Get all events statistics
   */
  getStatistics(): { event: string; listeners: number }[] {
    return (this.emitter.eventNames() as string[])
      .map(eventName => ({
        event: eventName,
        listeners: this.emitter.listenerCount(eventName)
      }));
  }
}

