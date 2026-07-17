import { Action, ActionContext, NotebookService, sanitizeFilename } from '@cupola/core';

/**
 * Exports a notebook's sections, pages, and entries as a downloaded text file,
 * named from the sanitized notebook name (OMCT-C13-L2-02.05, B17).
 */
export class ExportNotebookAsTextAction implements Action {
  readonly key = 'notebook.export.text';
  readonly name = 'Export as text';
  readonly description = 'Download this notebook as plain text.';
  readonly glyph = 'i-download';
  readonly priority = 30;

  constructor(
    private readonly notebooks: NotebookService,
    private readonly document: Document,
  ) {}

  appliesTo(context: ActionContext): boolean {
    const object = context.objectPath.at(-1);
    return !!object && (object.type === 'notebook' || object.type === 'restricted-notebook');
  }

  invoke(context: ActionContext): void {
    const object = context.objectPath.at(-1);
    if (!object) {
      return;
    }
    const text = this.notebooks.formatText(object);
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const anchor = this.document.createElement('a');
    anchor.href = url;
    anchor.download = `${sanitizeFilename(object.name) || 'notebook'}.txt`;
    anchor.setAttribute('data-testid', 'notebook-text-download');
    this.document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }
}
