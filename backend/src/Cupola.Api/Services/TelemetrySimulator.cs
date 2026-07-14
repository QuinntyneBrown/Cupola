using Cupola.Api.Hubs;
using Cupola.Core.Models;
using Cupola.Core.Services;
using Microsoft.AspNetCore.SignalR;

namespace Cupola.Api.Services;

/// <summary>
/// Emits ~1 Hz sine-wave telemetry samples for every seed object of type
/// "telemetry", broadcasting each to its telemetry group.
/// </summary>
public class TelemetrySimulator : BackgroundService
{
    private readonly IHubContext<RealtimeHub> _hub;
    private readonly IReadOnlyList<string> _telemetryKeys;

    public TelemetrySimulator(IHubContext<RealtimeHub> hub)
    {
        _hub = hub;
        _telemetryKeys = SeedData.CreateObjects()
            .Where(o => o.Type == "telemetry")
            .Select(o => o.KeyString)
            .ToList();
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        var phase = 0.0;
        while (!stoppingToken.IsCancellationRequested)
        {
            var timestamp = DateTimeOffset.UtcNow;
            for (var i = 0; i < _telemetryKeys.Count; i++)
            {
                var value = Math.Sin(phase + i);
                await _hub.Clients.Group(RealtimeHub.TelemetryGroup(_telemetryKeys[i]))
                    .SendAsync(
                        "TelemetryReceived",
                        new TelemetryValue(_telemetryKeys[i], timestamp, value),
                        stoppingToken);
            }

            phase += 0.1;

            try
            {
                await Task.Delay(TimeSpan.FromSeconds(1), stoppingToken);
            }
            catch (OperationCanceledException)
            {
                break;
            }
        }
    }
}
