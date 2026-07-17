import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

/** A published extended-line position coordinated across time-strip rows. */
export interface ExtendedLine {
  /** Key string of the row that published the line. */
  sourceKey: string;
  /** The instant, in epoch milliseconds, to draw across every row. */
  timestamp: number;
}

/**
 * Coordinates the selected event marker across time-strip rows
 * (OMCT-C12-L2-02.05). An event row publishes a position; the strip overlay
 * draws the aligned marker across all rows. `null` clears the line.
 */
@Injectable({ providedIn: 'root' })
export class ExtendedLinesBus {
  private readonly subject = new Subject<ExtendedLine | null>();

  /** Emits each published extended line (or `null` to clear). */
  readonly changes: Observable<ExtendedLine | null> = this.subject.asObservable();

  /** Publishes an extended-line position, or `null` to clear. */
  publish(line: ExtendedLine | null): void {
    this.subject.next(line);
  }
}
