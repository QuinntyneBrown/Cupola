import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { DomainObject, openExternal, sanitizeUrl } from '@cupola/core';

/** Web-page configuration persisted at `configuration.webPage`. */
export interface WebPageConfiguration {
  url?: string;
}

/**
 * The web-page view (OMCT-C09-L2-04.03): embeds the configured page in a
 * sandboxed frame. The URL passes the B17 sanitizer before the frame is
 * created; a rejected or empty URL renders the failure state instead.
 */
@Component({
  selector: 'cp-web-page-view',
  template: `
    <div class="cp-pane web-pane">
      <div class="cp-pane-head web-head">
        <input
          class="cp-input cp-input--data web-url"
          data-testid="web-url"
          type="text"
          readonly
          [value]="configuredUrl()"
          aria-label="Embedded page URL"
        />
        @if (safeUrl()) {
          <button
            class="cp-icon-btn"
            type="button"
            data-testid="web-open-external"
            aria-label="Open in browser tab"
            (click)="openExternally()"
          >
            <svg class="cp-icon cp-icon--s"><use href="#i-external" /></svg>
          </button>
        }
      </div>
      @if (frameUrl(); as url) {
        <iframe
          class="web-embed-frame"
          data-testid="web-embed"
          sandbox="allow-scripts"
          referrerpolicy="no-referrer"
          [src]="url"
          title="Embedded web page"
        ></iframe>
      } @else {
        <div class="cp-empty" data-testid="web-embed-error">Page could not be loaded.</div>
      }
    </div>
  `,
  styles: `
    :host {
      display: block;
      height: 100%;
      min-height: 0;
    }
    .web-pane {
      display: flex;
      flex-direction: column;
      height: 100%;
      min-height: 0;
    }
    .web-head {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .web-url {
      flex: 1;
      min-width: 0;
    }
    .web-embed-frame {
      flex: 1;
      min-height: 0;
      width: 100%;
      border: none;
      background: var(--cp-color-void);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WebPageViewComponent {
  private readonly domSanitizer = inject(DomSanitizer);

  readonly object = input.required<DomainObject>();

  protected readonly configuredUrl = computed(
    () => ((this.object().configuration?.['webPage'] as WebPageConfiguration) ?? {}).url ?? '',
  );

  protected readonly safeUrl = computed(() => {
    const url = this.configuredUrl();
    return url ? sanitizeUrl(url) : null;
  });

  protected readonly frameUrl = computed<SafeResourceUrl | null>(() => {
    const url = this.safeUrl();
    return url ? this.domSanitizer.bypassSecurityTrustResourceUrl(url) : null;
  });

  protected openExternally(): void {
    const url = this.safeUrl();
    if (url) {
      openExternal(url);
    }
  }
}
