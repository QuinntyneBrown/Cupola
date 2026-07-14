/** Reports the device characteristics used to classify the shell. */
export interface DeviceAgent {
  isMobile(): boolean;
  isPhone(): boolean;
  isTablet(): boolean;
  isDesktop(): boolean;
  isPortrait(): boolean;
  isLandscape(): boolean;
  isTouch(): boolean;
}
