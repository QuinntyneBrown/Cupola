using Cupola.Core.Models;

namespace Cupola.Api.Contracts;

/// <summary>
/// Response body for a shell search: matching objects and annotations.
/// </summary>
public record SearchResponse(
    IReadOnlyList<DomainObject> Objects,
    IReadOnlyList<Annotation> Annotations);
