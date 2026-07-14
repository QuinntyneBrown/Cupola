using System.Collections.Concurrent;
using Cupola.Core.Models;

namespace Cupola.Core.Services;

/// <summary>
/// Thread-safe in-memory implementation of <see cref="IObjectStore"/> seeded
/// from <see cref="SeedData"/>.
/// </summary>
public class InMemoryObjectStore : IObjectStore
{
    private readonly ConcurrentDictionary<string, DomainObject> _objects;
    private readonly IReadOnlyList<Annotation> _annotations;

    public InMemoryObjectStore()
    {
        _objects = new ConcurrentDictionary<string, DomainObject>(
            SeedData.CreateObjects().ToDictionary(o => o.KeyString));
        _annotations = SeedData.CreateAnnotations();
    }

    public DomainObject? GetByKeyString(string keyString) =>
        _objects.TryGetValue(keyString, out var domainObject) ? domainObject : null;

    public IReadOnlyList<DomainObject>? GetComposition(string keyString)
    {
        if (!_objects.TryGetValue(keyString, out var parent))
        {
            return null;
        }

        var children = new List<DomainObject>();
        foreach (var childKey in parent.Composition)
        {
            if (_objects.TryGetValue(childKey, out var child))
            {
                children.Add(child);
            }
        }

        return children;
    }

    public IReadOnlyList<Annotation>? GetAnnotationsFor(string keyString)
    {
        if (!_objects.ContainsKey(keyString))
        {
            return null;
        }

        return _annotations.Where(a => a.Targets.Contains(keyString)).ToList();
    }

    public DomainObject? UpdateName(string keyString, string name)
    {
        if (!_objects.TryGetValue(keyString, out var existing))
        {
            return null;
        }

        var updated = existing with { Name = name, Modified = DateTimeOffset.UtcNow };
        _objects[keyString] = updated;
        return updated;
    }

    public SearchResult Search(string? query)
    {
        if (string.IsNullOrWhiteSpace(query))
        {
            return new SearchResult(Array.Empty<DomainObject>(), Array.Empty<Annotation>());
        }

        var term = query.Trim();

        var objects = _objects.Values
            .Where(o => o.Name.Contains(term, StringComparison.OrdinalIgnoreCase))
            .ToList();

        var annotations = _annotations
            .Where(a => a.Text.Contains(term, StringComparison.OrdinalIgnoreCase)
                        || a.Tags.Any(tag => tag.Contains(term, StringComparison.OrdinalIgnoreCase)))
            .ToList();

        return new SearchResult(objects, annotations);
    }
}
