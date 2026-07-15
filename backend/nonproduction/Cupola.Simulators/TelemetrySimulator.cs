using Cupola.Api.Hubs;
using Cupola.Core.Models;
using Cupola.Core.Services;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Hosting;

namespace Cupola.Simulators;

/// <summary>
/// Emits approximately one sine-wave telemetry sample per second for each seeded
/// telemetry object. Production hosts do not register this service.
/// </summary>
internal sealed class TelemetrySimulator : BackgroundService
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

        try
        {
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
                await Task.Delay(TimeSpan.FromSeconds(1), stoppingToken);
            }
        }
        catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
        {
            // Normal hosted-service shutdown.
        }
    }
}
