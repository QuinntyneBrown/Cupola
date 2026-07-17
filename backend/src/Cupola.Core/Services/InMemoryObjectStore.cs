using System.Collections.Concurrent;
using System.Text.Json;
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

        return AllAnnotations().Where(a => a.Targets.Contains(keyString)).ToList();
    }

    public DomainObject? UpdateName(string keyString, string name)
    {
        if (!_objects.TryGetValue(keyString, out var existing))
        {
            return null;
        }

        var updated = existing with
        {
            Name = name,
            Modified = DateTimeOffset.UtcNow,
            Version = existing.Version + 1,
        };
        _objects[keyString] = updated;
        return updated;
    }

    public IReadOnlyList<DomainObject> GetMany(IReadOnlyList<string> keyStrings)
    {
        var found = new List<DomainObject>();
        foreach (var keyString in keyStrings)
        {
            if (_objects.TryGetValue(keyString, out var domainObject))
            {
                found.Add(domainObject);
            }
        }

        return found;
    }

    public ObjectSaveResult Save(DomainObject domainObject)
    {
        while (true)
        {
            if (!_objects.TryGetValue(domainObject.KeyString, out var existing))
            {
                var now = DateTimeOffset.UtcNow;
                var created = domainObject with
                {
                    Created = domainObject.Created == default ? now : domainObject.Created,
                    Modified = now,
                    Version = 1,
                };
                if (_objects.TryAdd(domainObject.KeyString, created))
                {
                    return new ObjectSaveResult(domainObject.KeyString, ObjectSaveOutcome.Created, created);
                }

                continue;
            }

            if (domainObject.Version != existing.Version)
            {
                return new ObjectSaveResult(domainObject.KeyString, ObjectSaveOutcome.Conflict, existing);
            }

            var updated = domainObject with
            {
                Created = existing.Created,
                CreatedBy = existing.CreatedBy,
                Version = existing.Version + 1,
                Modified = DateTimeOffset.UtcNow,
            };
            if (_objects.TryUpdate(domainObject.KeyString, updated, existing))
            {
                return new ObjectSaveResult(domainObject.KeyString, ObjectSaveOutcome.Updated, updated);
            }
        }
    }

    public IReadOnlyList<ObjectSaveResult> SaveMany(IReadOnlyList<DomainObject> domainObjects) =>
        domainObjects.Select(Save).ToList();

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

        var annotations = AllAnnotations()
            .Where(a => a.Text.Contains(term, StringComparison.OrdinalIgnoreCase)
                        || a.Tags.Any(tag => tag.Contains(term, StringComparison.OrdinalIgnoreCase)))
            .ToList();

        return new SearchResult(objects, annotations);
    }

    /// <summary>
    /// Seeded annotations plus annotation-typed domain objects saved through the
    /// generic persistence routes, projected onto the B10 annotation shape
    /// (wave-4 C13 enabler).
    /// </summary>
    private IEnumerable<Annotation> AllAnnotations()
    {
        foreach (var annotation in _annotations)
        {
            yield return annotation;
        }

        foreach (var domainObject in _objects.Values)
        {
            if (TryMapAnnotation(domainObject) is { } mapped)
            {
                yield return mapped;
            }
        }
    }

    private static Annotation? TryMapAnnotation(DomainObject domainObject)
    {
        if (domainObject.Type != "annotation" ||
            domainObject.Configuration is not { ValueKind: JsonValueKind.Object } configuration ||
            !configuration.TryGetProperty("annotation", out var payload) ||
            payload.ValueKind != JsonValueKind.Object)
        {
            return null;
        }

        var text = payload.TryGetProperty("text", out var textElement)
                   && textElement.ValueKind == JsonValueKind.String
            ? textElement.GetString()!
            : string.Empty;

        // Typed-annotation extras live beside the payload (B10 wave-5 extension);
        // AnnotationService writes them at configuration.annotationType/targetDetails.
        var annotationType = configuration.TryGetProperty("annotationType", out var typeElement)
                             && typeElement.ValueKind == JsonValueKind.String
            ? typeElement.GetString()
            : null;
        JsonElement? targetDetails = configuration.TryGetProperty("targetDetails", out var detailsElement)
                                     && detailsElement.ValueKind == JsonValueKind.Array
            ? detailsElement.Clone()
            : null;

        return new Annotation(
            domainObject.KeyString,
            text,
            ReadStrings(payload, "targets"),
            ReadStrings(payload, "tags"),
            domainObject.Modified,
            annotationType,
            targetDetails);
    }

    private static IReadOnlyList<string> ReadStrings(JsonElement element, string property)
    {
        if (!element.TryGetProperty(property, out var array) || array.ValueKind != JsonValueKind.Array)
        {
            return Array.Empty<string>();
        }

        return array.EnumerateArray()
            .Where(item => item.ValueKind == JsonValueKind.String)
            .Select(item => item.GetString()!)
            .ToList();
    }
}
