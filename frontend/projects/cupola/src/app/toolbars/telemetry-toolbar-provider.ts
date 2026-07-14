import { SelectedItem, ToolbarControl, ToolbarProvider } from '@cupola/core';

import { PlaybackService } from './playback.service';

/**
 * Provides a pause/resume toggle when the selection is live telemetry or an
 * overlay plot. Requirement: OMCT-C15-L2-03.05.
 */
export class TelemetryToolbarProvider implements ToolbarProvider {
  readonly key = 'telemetry';

  constructor(private readonly playback: PlaybackService) {}

  forSelection(selection: SelectedItem[]): boolean {
    const type = selection[0]?.context.object?.type;
    return type === 'telemetry' || type === 'overlay-plot';
  }

  toolbar(): ToolbarControl[] {
    const paused = this.playback.paused();
    return [
      {
        key: 'playback',
        glyph: paused ? 'i-play' : 'i-pause',
        label: paused ? 'Resume' : 'Pause',
        pressed: paused,
        onActivate: () => this.playback.toggle(),
      },
    ];
  }
}
