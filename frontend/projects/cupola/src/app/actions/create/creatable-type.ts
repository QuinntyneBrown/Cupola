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
    type: 'stacked-plot',
    name: 'Stacked Plot',
    glyph: 'i-plot',
    description: 'Stacks each composed telemetry series in its own row on a shared time axis.',
  },
  {
    type: 'bar-graph',
    name: 'Bar Graph',
    glyph: 'i-plot',
    description: 'Renders the latest value of each composed telemetry series as a bar.',
  },
  {
    type: 'scatter-plot',
    name: 'Scatter Plot',
    glyph: 'i-plot',
    description: 'Plots one telemetry range against another as a scatter of points.',
  },
  {
    type: 'notebook',
    name: 'Notebook',
    glyph: 'i-notebook',
    description: 'A timestamped log for operator notes and annotations.',
  },
  {
    type: 'condition-set',
    name: 'Condition Set',
    glyph: 'i-alert-circle',
    description: 'Evaluates ordered conditions over composed telemetry and publishes the selected output.',
  },
  {
    type: 'condition-widget',
    name: 'Condition Widget',
    glyph: 'i-alert-circle',
    description: 'Displays the active output of a condition set with its label, link, and styling.',
  },
  {
    type: 'summary-widget',
    name: 'Summary Widget',
    glyph: 'i-alert-triangle',
    description: 'Selects a visual rule from telemetry conditions over composed objects.',
  },
  {
    type: 'derived-telemetry',
    name: 'Derived Telemetry',
    glyph: 'i-plot',
    description: 'Calculates a new telemetry stream from source-combination operations.',
  },
];
