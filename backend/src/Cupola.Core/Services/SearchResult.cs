using Cupola.Core.Models;

namespace Cupola.Core.Services;

/// <summary>
/// The objects and annotations matching a search query.
/// </summary>
public record SearchResult(
    IReadOnlyList<DomainObject> Objects,
    IReadOnlyList<Annotation> Annotations);
