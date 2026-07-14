import { OverlayConfig } from './overlay-config';

/** Handle for an active overlay. */
export class Overlay {
  constructor(
    readonly config: OverlayConfig,
    readonly element: HTMLElement,
    private readonly teardown: () => void,
  ) {}

  get dismissible(): boolean {
    return this.config.dismissible !== false;
  }

  get autoHide(): boolean {
    return this.config.autoHide === true;
  }

  hide(): void {
    this.element.style.display = 'none';
  }

  restore(): void {
    this.element.style.display = '';
  }

  dismiss(): void {
    this.teardown();
  }
}
