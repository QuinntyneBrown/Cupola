using Cupola.Core.Models;

namespace Cupola.Core.Services;

/// <summary>
/// Deterministic synthetic image telemetry: a pure function of time on a fixed
/// epoch-aligned capture grid, so historical backfill, realtime emission, and the
/// e2e fake backend trace identical frames (B06 wave-5 extension, OMCT-C11-L2-01.02).
/// The 30-second cadence is mirrored formula-for-formula by
/// <c>frontend/e2e/support/fake-backend.ts</c>; changing it invalidates e2e fixtures.
/// </summary>
public static class ImageTelemetry
{
    /// <summary>Capture cadence; frames sit on unix-epoch multiples of this value.</summary>
    public const long CadenceMs = 30_000;

    private const int FrameCount = 4;

    /// <summary>Samples the image frame captured at the grid instant at or before <paramref name="time"/>.</summary>
    public static TelemetryValue Sample(string keyString, DateTimeOffset time)
    {
        var gridMs = time.ToUnixTimeMilliseconds() / CadenceMs * CadenceMs;
        return AtGridInstant(keyString, gridMs);
    }

    /// <summary>
    /// Samples every grid instant within the inclusive [startMs, endMs] window,
    /// capped at <paramref name="maxPoints"/> samples.
    /// </summary>
    public static IReadOnlyList<TelemetryValue> Range(
        string keyString, long startMs, long endMs, int maxPoints = 3600)
    {
        var samples = new List<TelemetryValue>();
        if (endMs < startMs)
        {
            return samples;
        }

        var firstGridMs = (startMs + CadenceMs - 1) / CadenceMs * CadenceMs;
        for (var t = firstGridMs; t <= endMs && samples.Count < maxPoints; t += CadenceMs)
        {
            samples.Add(AtGridInstant(keyString, t));
        }

        return samples;
    }

    private static TelemetryValue AtGridInstant(string keyString, long gridMs)
    {
        var frameIndex = gridMs / CadenceMs % FrameCount;
        return new TelemetryValue(
            keyString,
            DateTimeOffset.FromUnixTimeMilliseconds(gridMs),
            frameIndex,
            Url: $"/imagery/frame-{frameIndex}.svg",
            Heading: gridMs / 1000.0 * 0.75 % 360,
            CameraAngle: 20 * Math.Sin(gridMs / 60_000.0));
    }
}
