import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { DomainObject, sanitizeUrl } from '@cupola/core';

/** Hyperlink configuration persisted at `configuration.hyperlink`. */
export interface HyperlinkConfiguration {
  url?: string;
  displayFormat?: 'link' | 'button';
  target?: 'current' | 'new';
}

/**
 * The hyperlink view (OMCT-C09-L2-04.01, 04.02): renders the object name as a
 * text link or button per its display configuration, navigating in the current
 * tab or an opener-isolated new tab per its saved target behaviour. Every URL
 * passes the B17 sanitizer; rejected URLs render inert.
 */
@Component({
  selector: 'cp-hyperlink-view',
  template: `
    @if (safeUrl(); as url) {
      <a
        data-testid="hyperlink"
        [class.cp-link]="format() === 'link'"
        [class.cp-btn]="format() === 'button'"
        [class.cp-btn--outlined]="format() === 'button' && target() === 'new'"
        [class.cp-btn--tonal]="format() === 'button' && target() === 'current'"
        [attr.data-format]="format()"
        [attr.data-target]="target()"
        [href]="url"
        [attr.target]="target() === 'new' ? '_blank' : null"
        [attr.rel]="target() === 'new' ? 'noopener noreferrer' : null"
      >
        {{ object().name }}
        @if (target() === 'new') {
          <svg class="cp-icon cp-icon--s"><use href="#i-external" /></svg>
        }
      </a>
    } @else {
      <p class="cp-empty" data-testid="hyperlink-blocked">
        {{ object().name }} — the configured URL is not allowed.
      </p>
    }
  `,
  styles: `
    :host {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
      padding: var(--cp-space-4, 16px);
    }
    a {
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HyperlinkViewComponent {
  readonly object = input.required<DomainObject>();

  private readonly config = computed<HyperlinkConfiguration>(
    () => (this.object().configuration?.['hyperlink'] as HyperlinkConfiguration) ?? {},
  );

  protected readonly format = computed(() => this.config().displayFormat ?? 'link');
  protected readonly target = computed(() => this.config().target ?? 'current');
  protected readonly safeUrl = computed(() => {
    const url = this.config().url;
    return url ? sanitizeUrl(url) : null;
  });
}
