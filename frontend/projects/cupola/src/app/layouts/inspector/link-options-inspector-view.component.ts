import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal } from '@angular/core';
import { DomainObject, ObjectUpdatesService, SelectedItem } from '@cupola/core';

import { ViewConfigService } from '../../telemetry-view/view-config.service';
import { HyperlinkConfiguration } from '../hyperlink/hyperlink-view.component';
import { WebPageConfiguration } from '../web-page/web-page-view.component';

/**
 * Link options inspector for hyperlink and web-page objects (OMCT-C09-L2-04.01,
 * 04.02, 04.03): the create flow captures only a name, so the URL, display
 * format, and target behaviour are authored here and persisted through the
 * object configuration bag.
 */
@Component({
  selector: 'cp-link-options-inspector-view',
  template: `
    @if (object(); as target) {
      <div class="link-options">
        <label class="cp-field">
          <span class="cp-field-label">URL</span>
          <input
            class="cp-input cp-input--data"
            data-testid="link-url-input"
            type="text"
            [value]="url()"
            (input)="url.set(inputValue($event))"
          />
        </label>
        @if (isHyperlink()) {
          <label class="cp-field">
            <span class="cp-field-label">Presentation</span>
            <select
              class="cp-input"
              data-testid="link-format-select"
              [value]="format()"
              (change)="format.set(selectValue($event))"
            >
              <option value="link">Text link</option>
              <option value="button">Button</option>
            </select>
          </label>
          <label class="cp-field">
            <span class="cp-field-label">Opens in</span>
            <select
              class="cp-input"
              data-testid="link-target-select"
              [value]="target_()"
              (change)="target_.set(selectValue($event))"
            >
              <option value="current">Current tab</option>
              <option value="new">New tab</option>
            </select>
          </label>
        }
        <button class="cp-btn cp-btn--tonal" data-testid="link-options-save" (click)="save()">
          Save
        </button>
      </div>
    }
  `,
  styles: `
    .link-options {
      display: flex;
      flex-direction: column;
      gap: 10px;
      padding: 8px 0;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LinkOptionsInspectorViewComponent {
  private readonly viewConfig = inject(ViewConfigService);
  private readonly updates = inject(ObjectUpdatesService);

  readonly selection = input.required<SelectedItem[]>();

  protected readonly object = computed<DomainObject | undefined>(
    () => this.selection()[0]?.context.object,
  );
  protected readonly isHyperlink = computed(() => this.object()?.type === 'hyperlink');

  protected readonly url = signal('');
  protected readonly format = signal('link');
  protected readonly target_ = signal('current');

  constructor() {
    effect(() => {
      const object = this.object();
      if (!object) {
        return;
      }
      if (object.type === 'hyperlink') {
        const config = (object.configuration?.['hyperlink'] as HyperlinkConfiguration) ?? {};
        this.url.set(config.url ?? '');
        this.format.set(config.displayFormat ?? 'link');
        this.target_.set(config.target ?? 'current');
      } else {
        const config = (object.configuration?.['webPage'] as WebPageConfiguration) ?? {};
        this.url.set(config.url ?? '');
      }
    });
  }

  protected inputValue(event: Event): string {
    return (event.target as HTMLInputElement).value;
  }

  protected selectValue(event: Event): string {
    return (event.target as HTMLSelectElement).value;
  }

  protected async save(): Promise<void> {
    const object = this.object();
    if (!object) {
      return;
    }
    const saved =
      object.type === 'hyperlink'
        ? await this.viewConfig.write(object, 'hyperlink', {
            url: this.url().trim(),
            displayFormat: this.format() as HyperlinkConfiguration['displayFormat'],
            target: this.target_() as HyperlinkConfiguration['target'],
          })
        : await this.viewConfig.write(object, 'webPage', { url: this.url().trim() });
    this.updates.emitLocal(saved);
  }
}
