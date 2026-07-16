using System.Text.Json;

namespace Cupola.Core.Models;

/// <summary>
/// Telemetry hints, optional engineering unit, and optional filter definitions
/// (B08; opaque passthrough) for a telemetry object.
/// </summary>
public record TelemetryMetadata(
    IReadOnlyList<string> Hints,
    string? Unit = null,
    JsonElement? Filters = null);
