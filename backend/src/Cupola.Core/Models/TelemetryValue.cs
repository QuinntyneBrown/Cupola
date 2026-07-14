namespace Cupola.Core.Models;

/// <summary>
/// A single simulated telemetry sample broadcast over the realtime hub.
/// </summary>
public record TelemetryValue(string KeyString, DateTimeOffset Timestamp, double Value);
