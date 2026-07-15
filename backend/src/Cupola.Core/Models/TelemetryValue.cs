namespace Cupola.Core.Models;

/// <summary>
/// A single telemetry sample broadcast over the realtime hub.
/// </summary>
public record TelemetryValue(string KeyString, DateTimeOffset Timestamp, double Value);
