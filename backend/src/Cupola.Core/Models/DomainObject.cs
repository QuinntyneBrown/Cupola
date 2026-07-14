namespace Cupola.Core.Models;

/// <summary>
/// A domain object in the object tree. Immutable; renames produce a new
/// instance via <c>with</c>.
/// </summary>
public record DomainObject
{
    public required Identifier Identifier { get; init; }
    public required string KeyString { get; init; }
    public required string Name { get; init; }
    public required string Type { get; init; }
    public string? Location { get; init; }
    public IReadOnlyList<string> Composition { get; init; } = Array.Empty<string>();
    public TelemetryMetadata? Telemetry { get; init; }
    public DateTimeOffset Created { get; init; }
    public DateTimeOffset Modified { get; init; }
    public required string CreatedBy { get; init; }
}
