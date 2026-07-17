import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { CompassOrientation } from './compass-orientation';

/**
 * Compass rose and heads-up display for the focused image's orientation
 * (OMCT-C11-L2-02.05). Rendered only when orientation metadata is available.
 */
@Component({
  selector: 'cp-imagery-compass',
  template: `
    <div class="im-compass" data-testid="imagery-compass">
      <svg width="44" height="44" viewBox="0 0 44 44" aria-hidden="true">
        <circle cx="22" cy="22" r="20" fill="rgba(7, 10, 16, 0.78)" stroke="var(--cp-color-hairline)" />
        <text x="22" y="9" text-anchor="middle" font-size="7" fill="var(--cp-color-ink-3)">N</text>
        <g data-testid="compass-rose" [attr.transform]="wedgeTransform()">
          <path d="M22 8 L26 24 L22 21 L18 24 Z" fill="var(--cp-color-primary)" />
        </g>
        <circle cx="22" cy="22" r="2" fill="var(--cp-color-ink-2)" />
      </svg>
      <span class="hdg" data-testid="compass-hud">{{ orientation().headingLabel }}</span>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CompassComponent {
  readonly orientation = input.required<CompassOrientation>();

  protected readonly wedgeTransform = computed(
    () => `rotate(${this.orientation().rotation} 22 22)`,
  );
}
