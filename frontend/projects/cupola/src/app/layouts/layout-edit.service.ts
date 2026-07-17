import { Injectable, Signal, signal } from '@angular/core';

import { AlignEdge, DistributeAxis, StackDirection } from './display-layout/layout-geometry';

/**
 * The editing operations a layout view exposes to its toolbar while an edit
 * session is open. Implemented by the display-layout and flexible-layout views.
 */
export interface LayoutEditSession {
  readonly selectedItemIds: Signal<string[]>;
  align?(edge: AlignEdge): void;
  distribute?(axis: DistributeAxis): void;
  reorderStack?(direction: StackDirection): void;
  copy?(): void;
  paste?(): void;
  /** Flexible-layout pane controls (OMCT-C09-L2-02.02). */
  addContainer?(): void;
  removeContainer?(): void;
  removeFrame?(): void;
  toggleOrientation?(): void;
  save(): Promise<void>;
  cancel(): void;
}

/**
 * Per-layout edit state (C09's edit mode — the shell has no global one): at
 * most one layout edits at a time; the editing view registers a session the
 * layout toolbars drive. Requirements: OMCT-C09-L2-01.03, 02.02.
 */
@Injectable({ providedIn: 'root' })
export class LayoutEditService {
  private readonly editingKeyState = signal<string | null>(null);
  private readonly sessions = new Map<string, LayoutEditSession>();

  /** The keyString of the layout currently being edited, or null. */
  readonly editingKey = this.editingKeyState.asReadonly();

  isEditing(keyString: string): boolean {
    return this.editingKey() === keyString;
  }

  /** Registers the view's session; the view owns registration lifecycle. */
  register(keyString: string, session: LayoutEditSession): void {
    this.sessions.set(keyString, session);
  }

  unregister(keyString: string): void {
    this.sessions.delete(keyString);
    if (this.editingKeyState() === keyString) {
      // Persisting mid-edit refreshes the browse path, which recreates the
      // layout view (destroy + immediate re-register). Only a real departure —
      // no session re-registered by the next macrotask — ends the edit.
      setTimeout(() => {
        if (!this.sessions.has(keyString) && this.editingKeyState() === keyString) {
          this.editingKeyState.set(null);
        }
      }, 0);
    }
  }

  session(keyString: string): LayoutEditSession | undefined {
    return this.sessions.get(keyString);
  }

  beginEdit(keyString: string): void {
    this.editingKeyState.set(keyString);
  }

  endEdit(keyString: string): void {
    if (this.editingKeyState() === keyString) {
      this.editingKeyState.set(null);
    }
  }
}
