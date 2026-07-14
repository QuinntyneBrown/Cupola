namespace Cupola.Core.Models;

/// <summary>
/// A user annotation targeting one or more domain objects.
/// </summary>
public record Annotation(
    string KeyString,
    string Text,
    IReadOnlyList<string> Targets,
    IReadOnlyList<string> Tags,
    DateTimeOffset Modified);
