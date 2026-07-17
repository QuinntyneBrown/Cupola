export interface TelemetryValue {
  keyString: string;
  timestamp: string;
  value: number;
  /** Image datum fields (wave-5 B06 extension; present when metadata carries an image hint). */
  url?: string;
  /** Platform heading, degrees [0, 360). */
  heading?: number;
  /** Camera pointing relative to heading, degrees. */
  cameraAngle?: number;
}
