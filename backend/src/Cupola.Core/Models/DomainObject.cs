using System.Text.Json;

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
    /// <summary>Configured query for a database-backed search folder.</summary>
    public string? Query { get; init; }
    public TelemetryMetadata? Telemetry { get; init; }
    public DateTimeOffset Created { get; init; }
    public DateTimeOffset Modified { get; init; }

    /// <summary>
    /// Timestamp of the last successful persistence (OMCT-C02-L2-02.02). Client-stamped and
    /// preserved across save round-trips; never earlier than <see cref="Modified"/>.
    /// </summary>
    public DateTimeOffset? Persisted { get; init; }
    public required string CreatedBy { get; init; }

    /// <summary>
    /// Optimistic-concurrency version (B04). The store bumps it on every
    /// accepted save; a save whose version does not match the stored version
    /// is a conflict.
    /// </summary>
    public int Version { get; init; }

    /// <summary>Save provenance (open contract item #1, resolved for B04).</summary>
    public string? ModifiedBy { get; init; }

    /// <summary>
    /// Type-specific view and behavior configuration persisted with the object
    /// (B01, wave-4 extension). Opaque passthrough: the store never inspects it,
    /// and it round-trips save/retrieve unchanged.
    /// </summary>
    public JsonElement? Configuration { get; init; }
}
