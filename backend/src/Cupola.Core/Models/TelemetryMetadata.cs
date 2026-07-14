namespace Cupola.Core.Models;

/// <summary>
/// Telemetry hints and optional engineering unit for a telemetry object.
/// </summary>
public record TelemetryMetadata(IReadOnlyList<string> Hints, string? Unit = null);
