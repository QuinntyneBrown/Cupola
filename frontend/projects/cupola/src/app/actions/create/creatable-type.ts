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
    type: 'restricted-notebook',
    name: 'Restricted Notebook',
    glyph: 'i-notebook',
    description: 'A notebook with committed entries and a restricted URL whitelist.',
  },
  {
    type: 'table',
    name: 'Telemetry Table',
    glyph: 'i-table',
    description: 'Presents historical and realtime telemetry in a configurable table.',
  },
  {
    type: 'lad-table',
    name: 'LAD Table',
    glyph: 'i-list',
    description: 'Shows the latest available value for each composed telemetry object.',
  },
  {
    type: 'lad-table-set',
    name: 'LAD Table Set',
    glyph: 'i-list',
    description: 'Stacks several latest-available-data tables as one scrolling set.',
  },
  {
    type: 'gauge',
    name: 'Gauge',
    glyph: 'i-gauge',
    description: 'Displays the latest numeric telemetry value as a dial or meter.',
  },
  {
    type: 'autoflow',
    name: 'Autoflow Tabular',
    glyph: 'i-list',
    description: 'Packs many telemetry points into dense name/value rows that flow into columns.',
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
  {
    type: 'gantt-chart',
    name: 'Gantt Chart',
    glyph: 'i-timeline',
    description: 'Composes plans as grouped activity rows on one shared time axis.',
  },
  {
    type: 'time-strip',
    name: 'Time Strip',
    glyph: 'i-timeline',
    description: 'Stacks compatible time-based views as rows sharing one time axis.',
  },
  {
    type: 'time-list',
    name: 'Time List',
    glyph: 'i-list',
    description: 'Presents a plan’s activities as a sortable, filterable time list.',
  },
];
