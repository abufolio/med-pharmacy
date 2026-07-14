import { Injectable, Logger } from '@nestjs/common';
import { Subject, Observable, filter, map } from 'rxjs';

// ──────────────────────────────────────────────
// Event Types
// ──────────────────────────────────────────────
export interface AppEvent<T = unknown> {
  readonly type: string;
  readonly payload: T;
  readonly metadata: {
    readonly timestamp: Date;
    readonly correlationId?: string;
    readonly actorType?: string;
    readonly actorId?: string;
  };
}

// ──────────────────────────────────────────────
// Event Bus — Lightweight In-Process Event System
// ──────────────────────────────────────────────
@Injectable()
export class EventBus {
  private readonly logger = new Logger(EventBus.name);
  private readonly subject = new Subject<AppEvent>();

  /**
   * Publish an event to all subscribers.
   */
  emit<T>(type: string, payload: T, metadata?: Partial<AppEvent['metadata']>): void {
    const event: AppEvent<T> = {
      type,
      payload,
      metadata: {
        timestamp: new Date(),
        ...metadata,
      },
    };

    this.logger.debug(`📢 Event: ${type}`);
    this.subject.next(event as AppEvent);
  }

  /**
   * Subscribe to all events (filter by type in handler).
   */
  on$(): Observable<AppEvent>;

  /**
   * Subscribe to a specific event type.
   */
  on$<T>(type: string): Observable<AppEvent<T>>;

  on$<T>(type?: string): Observable<AppEvent<T>> {
    let observable = this.subject.asObservable() as Observable<AppEvent<T>>;

    if (type) {
      observable = this.subject.pipe(
        filter((event) => event.type === type),
      ) as Observable<AppEvent<T>>;
    }

    return observable;
  }

  /**
   * Listen for one event and complete.
   */
  once<T = unknown>(type: string): Promise<AppEvent<T>> {
    return new Promise<AppEvent<T>>((resolve) => {
      const sub = this.subject
        .pipe(filter((event) => event.type === type))
        .subscribe((event) => {
          sub.unsubscribe();
          resolve(event as AppEvent<T>);
        });
    });
  }
}
