using Cupola.Api.Hubs;
using Cupola.Core.Models;
using Cupola.Core.Services;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Hosting;

namespace Cupola.Simulators;

/// <summary>
/// Emits approximately one sine-wave telemetry sample per second for each seeded
/// telemetry object, and one image frame per capture-grid instant for image-hinted
/// sources (wave-5 B06 extension). Production hosts do not register this service.
/// </summary>
internal sealed class TelemetrySimulator : BackgroundService
{
    private readonly IHubContext<RealtimeHub> _hub;
    private readonly IReadOnlyList<string> _sineKeys;
    private readonly IReadOnlyList<string> _imageKeys;
    private readonly Dictionary<string, long> _lastImageGridMs = new();

    public TelemetrySimulator(IHubContext<RealtimeHub> hub)
    {
        _hub = hub;
        var telemetryObjects = SeedData.CreateObjects()
            .Where(o => o.Type == "telemetry")
            .ToList();
        _imageKeys = telemetryObjects
            .Where(o => o.Telemetry?.Hints.Contains("image") == true)
            .Select(o => o.KeyString)
            .ToList();
        _sineKeys = telemetryObjects
            .Select(o => o.KeyString)
            .Except(_imageKeys)
            .ToList();
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        try
        {
            while (!stoppingToken.IsCancellationRequested)
            {
                var timestamp = DateTimeOffset.UtcNow;
                foreach (var key in _sineKeys)
                {
                    // Same pure source as the historical route, so realtime continues the
                    // curve GET /api/telemetry returns (B06).
                    var value = SineTelemetry.Sample(key, timestamp);
                    await _hub.Clients.Group(RealtimeHub.TelemetryGroup(key))
                        .SendAsync(
                            "TelemetryReceived",
                            new TelemetryValue(key, timestamp, value),
                            stoppingToken);
                }

                foreach (var key in _imageKeys)
                {
                    // Same pure source as the historical route; one emission per
                    // capture-grid instant rather than per tick.
                    var frame = ImageTelemetry.Sample(key, timestamp);
                    var gridMs = frame.Timestamp.ToUnixTimeMilliseconds();
                    if (_lastImageGridMs.TryGetValue(key, out var last) && last == gridMs)
                    {
                        continue;
                    }

                    _lastImageGridMs[key] = gridMs;
                    await _hub.Clients.Group(RealtimeHub.TelemetryGroup(key))
                        .SendAsync("TelemetryReceived", frame, stoppingToken);
                }

                await Task.Delay(TimeSpan.FromSeconds(1), stoppingToken);
            }
        }
        catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
        {
            // Normal hosted-service shutdown.
        }
    }
}
