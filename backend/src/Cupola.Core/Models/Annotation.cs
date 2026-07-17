using System.Text.Json;
using System.Text.Json.Serialization;

namespace Cupola.Core.Models;

/// <summary>
/// A user annotation targeting one or more domain objects. Typed annotations
/// (B10 wave-5 extension) additionally carry their type discriminator and
/// per-target details — e.g. C11 pixel-spatial image coordinates.
/// </summary>
public record Annotation(
    string KeyString,
    string Text,
    IReadOnlyList<string> Targets,
    IReadOnlyList<string> Tags,
    DateTimeOffset Modified,
    [property: JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)] string? AnnotationType = null,
    [property: JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)] JsonElement? TargetDetails = null);
