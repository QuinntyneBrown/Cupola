import { Observable } from 'rxjs';

import { DomainObject, ObjectSaveResult } from '@cupola/core';

export interface CouchObjectTransport {
  getObject(keyString: string): Observable<unknown>;
  getObjects(keyStrings: string[]): Observable<unknown[]>;
  saveObject(object: DomainObject): Observable<ObjectSaveResult>;
  saveObjects(objects: DomainObject[]): Observable<ObjectSaveResult[]>;
}

interface GetEntry {
  keyString: string;
  next(value: unknown): void;
  error(error: unknown): void;
  closed(): boolean;
}

interface SaveEntry {
  object: DomainObject;
  next(value: ObjectSaveResult): void;
  error(error: unknown): void;
  closed(): boolean;
}

/** Coalesces operations submitted in one event-loop interval. */
export class CouchObjectQueue {
  private gets: GetEntry[] = [];
  private saves: SaveEntry[] = [];
  private getTimer: ReturnType<typeof setTimeout> | undefined;
  private saveTimer: ReturnType<typeof setTimeout> | undefined;

  constructor(private readonly transport: CouchObjectTransport) {}

  get(keyString: string): Observable<unknown> {
    return new Observable((subscriber) => {
      this.gets.push({
        keyString,
        next: (value) => {
          subscriber.next(value);
          subscriber.complete();
        },
        error: (error) => subscriber.error(error),
        closed: () => subscriber.closed,
      });
      this.getTimer ??= setTimeout(() => this.flushGets(), 0);
    });
  }

  save(object: DomainObject): Observable<ObjectSaveResult> {
    return new Observable((subscriber) => {
      this.saves.push({
        object,
        next: (value) => {
          subscriber.next(value);
          subscriber.complete();
        },
        error: (error) => subscriber.error(error),
        closed: () => subscriber.closed,
      });
      this.saveTimer ??= setTimeout(() => this.flushSaves(), 0);
    });
  }

  private flushGets(): void {
    const entries = this.gets.filter((entry) => !entry.closed());
    this.gets = [];
    this.getTimer = undefined;
    if (entries.length === 0) {
      return;
    }

    if (entries.length === 1) {
      const entry = entries[0];
      this.transport.getObject(entry.keyString).subscribe({
        next: (value) => entry.next(value),
        error: (error) => entry.error(error),
      });
      return;
    }

    const keys = Array.from(new Set(entries.map((entry) => entry.keyString)));
    this.transport.getObjects(keys).subscribe({
      next: (objects) => {
        const byKey = new Map(
          objects.flatMap((value) => {
            if (typeof value !== 'object' || value === null || !('keyString' in value)) {
              return [];
            }
            return [[String((value as { keyString: unknown }).keyString), value] as const];
          }),
        );
        entries.forEach((entry) => {
          const object = byKey.get(entry.keyString);
          if (object === undefined) {
            entry.error(new Error(`Object '${entry.keyString}' was not found.`));
          } else {
            entry.next(object);
          }
        });
      },
      error: (error) => entries.forEach((entry) => entry.error(error)),
    });
  }

  private flushSaves(): void {
    const entries = this.saves.filter((entry) => !entry.closed());
    this.saves = [];
    this.saveTimer = undefined;
    if (entries.length === 0) {
      return;
    }

    if (entries.length === 1) {
      const entry = entries[0];
      this.transport.saveObject(entry.object).subscribe({
        next: (result) => entry.next(result),
        error: (error) => entry.error(error),
      });
      return;
    }

    this.transport.saveObjects(entries.map((entry) => entry.object)).subscribe({
      next: (results) =>
        entries.forEach((entry, index) => {
          const result = results[index];
          if (result) {
            entry.next(result);
          } else {
            entry.error(new Error(`Save result missing for '${entry.object.keyString}'.`));
          }
        }),
      error: (error) => entries.forEach((entry) => entry.error(error)),
    });
  }
}
