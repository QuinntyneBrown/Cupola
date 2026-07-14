export interface MenuItem {
  name: string;
  glyph?: string;
  description?: string;
  disabled?: boolean;
  onClick(): void;
}
