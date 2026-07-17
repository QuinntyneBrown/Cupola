using System.Text.Json;

namespace Cupola.Core.Models;

/// <summary>
/// Telemetry hints, optional engineering unit, optional filter definitions
/// (B08; opaque passthrough), and optional imagery declarations (wave-5 B06
/// extension; opaque passthrough) for a telemetry object.
/// </summary>
public record TelemetryMetadata(
    IReadOnlyList<string> Hints,
    string? Unit = null,
    JsonElement? Filters = null,
    JsonElement? Imagery = null);
