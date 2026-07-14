export interface CreatableType {
  type: string;
  name: string;
  glyph: string;
  description: string;
}

/** The object types offered by the Create menu. */
export const CREATABLE_TYPES: CreatableType[] = [
  {
    type: 'folder',
    name: 'Folder',
    glyph: 'i-folder',
    description: 'A container for organizing objects into a browsable hierarchy.',
  },
  {
    type: 'overlay-plot',
    name: 'Overlay Plot',
    glyph: 'i-plot',
    description: 'Plots one or more telemetry series together on shared axes.',
  },
  {
    type: 'notebook',
    name: 'Notebook',
    glyph: 'i-notebook',
    description: 'A timestamped log for operator notes and annotations.',
  },
];
