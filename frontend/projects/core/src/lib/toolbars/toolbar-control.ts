export interface ToolbarControl {
  key: string;
  glyph: string;
  label: string;
  pressed?: boolean;
  onActivate(): void;
}
