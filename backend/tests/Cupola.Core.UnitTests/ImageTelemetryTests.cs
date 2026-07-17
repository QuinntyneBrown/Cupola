using System.Text.Json;
using Cupola.Core.Models;
using Cupola.Core.Services;
using Cupola.Core.UnitTests.Testing;

namespace Cupola.Core.UnitTests;

/// <summary>
/// Deterministic image telemetry generation (wave-5 B06 extension). The capture
/// grid backs the e2e fake backend formula-for-formula, so these tests pin it.
/// </summary>
[TestFixture]
public class ImageTelemetryTests
{
    [Test]
    [Requirement("OMCT-C11-L2-01.02")]
    public void Range_ReturnsOnlyEpochAlignedGridInstantsWithinBounds()
    {
        const long start = 95_000;
        const long end = 250_000;

        var samples = ImageTelemetry.Range("cam.cupola", start, end);

        Assert.That(samples.Select(s => s.Timestamp.ToUnixTimeMilliseconds()),
            Is.EqualTo(new[] { 120_000L, 150_000L, 180_000L, 210_000L, 240_000L }));
    }

    [Test]
    [Requirement("OMCT-C11-L2-01.02")]
    public void Range_IsInclusiveOfGridAlignedBounds()
    {
        var samples = ImageTelemetry.Range("cam.cupola", 60_000, 120_000);

        Assert.That(samples.Select(s => s.Timestamp.ToUnixTimeMilliseconds()),
            Is.EqualTo(new[] { 60_000L, 90_000L, 120_000L }));
    }

    [Test]
    [Requirement("OMCT-C11-L2-01.02")]
    public void Range_IsEmptyWhenEndPrecedesStart()
    {
        Assert.That(ImageTelemetry.Range("cam.cupola", 120_000, 60_000), Is.Empty);
    }

    [Test]
    [Requirement("OMCT-C11-L2-01.02")]
    public void Sample_IsAPureFunctionOfTimeCyclingFourFrames()
    {
        var t0 = DateTimeOffset.FromUnixTimeMilliseconds(0);
        var t1 = DateTimeOffset.FromUnixTimeMilliseconds(30_000);
        var t4 = DateTimeOffset.FromUnixTimeMilliseconds(120_000);
        var midGrid = DateTimeOffset.FromUnixTimeMilliseconds(44_500);

        Assert.That(ImageTelemetry.Sample("k", t0).Url, Is.EqualTo("/imagery/frame-0.svg"));
        Assert.That(ImageTelemetry.Sample("k", t1).Url, Is.EqualTo("/imagery/frame-1.svg"));
        Assert.That(ImageTelemetry.Sample("k", t4).Url, Is.EqualTo("/imagery/frame-0.svg"));
        // A mid-grid instant resolves to the frame captured at or before it.
        Assert.That(ImageTelemetry.Sample("k", midGrid).Timestamp.ToUnixTimeMilliseconds(),
            Is.EqualTo(30_000));
    }

    [Test]
    [Requirement("OMCT-C11-L2-02.05")]
    public void Sample_CarriesDeterministicOrientation()
    {
        var frame = ImageTelemetry.Sample("k", DateTimeOffset.FromUnixTimeMilliseconds(60_000));

        Assert.That(frame.Heading, Is.EqualTo(45.0).Within(1e-9)); // 60 s * 0.75 °/s
        Assert.That(frame.CameraAngle, Is.EqualTo(20 * Math.Sin(1.0)).Within(1e-9));
        Assert.That(frame.Heading, Is.GreaterThanOrEqualTo(0).And.LessThan(360));
    }

    [Test]
    [Requirement("OMCT-C11-L2-01.02")]
    public void TelemetryValue_ImageFields_RoundTripAndAreSuppressedWhenNull()
    {
        var json = new JsonSerializerOptions(JsonSerializerDefaults.Web);
        var image = ImageTelemetry.Sample("k", DateTimeOffset.FromUnixTimeMilliseconds(30_000));
        var plain = new TelemetryValue("k", DateTimeOffset.FromUnixTimeMilliseconds(0), 1.5);

        var imageWire = JsonSerializer.SerializeToElement(image, json);
        var plainWire = JsonSerializer.SerializeToElement(plain, json);
        var back = JsonSerializer.Deserialize<TelemetryValue>(imageWire.GetRawText(), json);

        Assert.That(imageWire.GetProperty("url").GetString(), Is.EqualTo("/imagery/frame-1.svg"));
        Assert.That(plainWire.TryGetProperty("url", out _), Is.False);
        Assert.That(plainWire.TryGetProperty("heading", out _), Is.False);
        Assert.That(back, Is.EqualTo(image));
    }
}
