import { NotebookEntry } from '@cupola/core';

import { reconcileEntries } from './notebook-sync';

function entry(id: string, text: string): NotebookEntry {
  return { id, createdOn: '2026-07-13T00:00:00Z', text, embeds: [], tags: [] };
}

describe('OMCT-C13-L2-03.01 — Remote entry update', () => {
  it('replaces a rendered entry in place when its remote version changed', () => {
    const current = [entry('a', 'original'), entry('b', 'second')];
    const incoming = [entry('a', 'edited'), entry('b', 'second')];
    const result = reconcileEntries(current, incoming);
    expect(result.map((e) => e.id)).toEqual(['a', 'b']);
    expect(result[0].text).toBe('edited');
  });
});

describe('OMCT-C13-L2-03.02 — Remote entry addition', () => {
  it('appends an entry added remotely', () => {
    const current = [entry('a', 'first'), entry('b', 'second')];
    const incoming = [entry('a', 'first'), entry('b', 'second'), entry('c', 'third')];
    const result = reconcileEntries(current, incoming);
    expect(result.map((e) => e.id)).toEqual(['a', 'b', 'c']);
    expect(result[2].text).toBe('third');
  });
});

describe('OMCT-C13-L2-03.03 — Remote entry removal', () => {
  it('drops an entry removed remotely', () => {
    const current = [entry('a', 'first'), entry('b', 'second')];
    const incoming = [entry('a', 'first')];
    const result = reconcileEntries(current, incoming);
    expect(result.map((e) => e.id)).toEqual(['a']);
  });
});
