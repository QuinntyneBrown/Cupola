using Cupola.Core.Models;

namespace Cupola.Core.Services;

/// <summary>
/// Deterministic synthetic telemetry: a pure function of key and time, so historical
/// backfill and realtime emission trace the same sine curve (B06, OMCT-C06-L2-04.01).
/// </summary>
public static class SineTelemetry
{
    /// <summary>Samples the sine value for a key at an instant.</summary>
    public static double Sample(string keyString, DateTimeOffset time)
    {
        var seconds = time.ToUnixTimeMilliseconds() / 1000.0;
        return Math.Sin(seconds * 0.1 + KeyPhase(keyString));
    }

    /// <summary>
    /// Samples across the inclusive [startMs, endMs] window at roughly one-second
    /// cadence, capped at <paramref name="maxPoints"/> samples.
    /// </summary>
    public static IReadOnlyList<TelemetryValue> Range(
        string keyString, long startMs, long endMs, int maxPoints = 3600)
    {
        var samples = new List<TelemetryValue>();
        if (endMs < startMs)
        {
            return samples;
        }

        var stepMs = Math.Max(1000L, (endMs - startMs) / maxPoints);
        for (var t = startMs; t <= endMs && samples.Count < maxPoints; t += stepMs)
        {
            var time = DateTimeOffset.FromUnixTimeMilliseconds(t);
            samples.Add(new TelemetryValue(keyString, time, Sample(keyString, time)));
        }

        return samples;
    }

    private static double KeyPhase(string keyString)
    {
        var hash = 0;
        foreach (var character in keyString)
        {
            hash = unchecked((hash * 31) + character);
        }
        return Math.Abs(hash % 628) / 100.0;
    }
}
