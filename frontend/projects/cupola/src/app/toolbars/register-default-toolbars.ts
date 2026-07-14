import { inject } from '@angular/core';
import { ToolbarRegistry } from '@cupola/core';

import { PlaybackService } from './playback.service';
import { TelemetryToolbarProvider } from './telemetry-toolbar-provider';

/** Registers the built-in toolbar providers. Called from an app initializer. */
export function registerDefaultToolbars(): void {
  const registry = inject(ToolbarRegistry);
  const playback = inject(PlaybackService);

  registry.register(new TelemetryToolbarProvider(playback));
}
