import { TagRegistry } from './tag-registry';

describe('OMCT-C13-L2-04.04 — Tag lifecycle', () => {
  it('adds, deletes, clears, and lists available tags, returning the updated set', () => {
    const registry = new TagRegistry();
    expect(registry.addTag('EVA')).toEqual(['EVA']);
    expect(registry.addTag('Power')).toEqual(['EVA', 'Power']);
    expect(registry.listTags()).toEqual(['EVA', 'Power']);
    expect(registry.deleteTag('EVA')).toEqual(['Power']);
    expect(registry.clearTags()).toEqual([]);
    expect(registry.listTags()).toEqual([]);
  });

  it('does not duplicate an already-registered tag', () => {
    const registry = new TagRegistry();
    registry.addTag('Science');
    expect(registry.addTag('Science')).toEqual(['Science']);
  });
});

describe('OMCT-C13-L2-04.05 — Tag search', () => {
  it('returns matching tags for a nonempty term and none for an empty term', () => {
    const registry = new TagRegistry();
    registry.addTag('Science');
    registry.addTag('Scrubber swap');
    registry.addTag('Power');

    expect(registry.searchByTag('sc')).toEqual(['Science', 'Scrubber swap']);
    expect(registry.searchByTag('')).toEqual([]);
    expect(registry.searchByTag('   ')).toEqual([]);
    expect(registry.searchByTag('nothing')).toEqual([]);
  });
});
