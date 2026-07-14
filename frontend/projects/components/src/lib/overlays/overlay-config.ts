import { CupolaView } from '@cupola/core';

export type OverlaySize = 'small' | 'large' | 'fit';

export interface OverlayConfig {
  /** The content mounted inside the overlay container. */
  view: CupolaView;
  size?: OverlaySize;
  /** Dismissible overlays close on Escape and backdrop interaction. */
  dismissible?: boolean;
  /**
   * Auto-hide overlays are hidden (not destroyed) while a newer overlay is
   * shown above them and restored when it is destroyed.
   */
  autoHide?: boolean;
  onDestroy?: () => void;
}
