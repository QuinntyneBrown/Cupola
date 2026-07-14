import { highlightSegments } from './highlight';

describe('OMCT-C15-L2-05.05 highlightSegments', () => {
  it('marks the matched substring case-insensitively', () => {
    expect(highlightSegments('Solar array output', 'solar')).toEqual([
      { text: 'Solar', mark: true },
      { text: ' array output', mark: false },
    ]);
  });

  it('marks a substring in the middle', () => {
    expect(highlightSegments('Bus voltage sag', 'voltage')).toEqual([
      { text: 'Bus ', mark: false },
      { text: 'voltage', mark: true },
      { text: ' sag', mark: false },
    ]);
  });

  it('returns a single unmarked segment when there is no match', () => {
    expect(highlightSegments('Power', 'xyz')).toEqual([{ text: 'Power', mark: false }]);
  });
});
