export interface HighlightSegment {
  text: string;
  mark: boolean;
}

/** Splits `text` into segments, marking the first case-insensitive match of `term`. */
export function highlightSegments(text: string, term: string): HighlightSegment[] {
  const query = term.trim();
  if (!query) {
    return [{ text, mark: false }];
  }
  const index = text.toLowerCase().indexOf(query.toLowerCase());
  if (index === -1) {
    return [{ text, mark: false }];
  }
  const segments: HighlightSegment[] = [];
  if (index > 0) {
    segments.push({ text: text.slice(0, index), mark: false });
  }
  segments.push({ text: text.slice(index, index + query.length), mark: true });
  if (index + query.length < text.length) {
    segments.push({ text: text.slice(index + query.length), mark: false });
  }
  return segments;
}
