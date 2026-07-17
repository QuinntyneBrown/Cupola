using System.Text.Json.Serialization;

namespace Cupola.Core.Models;

/// <summary>
/// A single telemetry sample broadcast over the realtime hub. Image-hinted sources
/// additionally carry an image URL and orientation (wave-5 B06 extension); the
/// optional fields are suppressed on the wire for plain numeric samples.
/// </summary>
public record TelemetryValue(
    string KeyString,
    DateTimeOffset Timestamp,
    double Value,
    [property: JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)] string? Url = null,
    [property: JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)] double? Heading = null,
    [property: JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)] double? CameraAngle = null);
