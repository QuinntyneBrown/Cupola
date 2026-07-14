using Microsoft.AspNetCore.SignalR;

namespace Cupola.Api.Hubs;

/// <summary>
/// Realtime hub for object-update and telemetry subscriptions. Clients join a
/// per-object group to receive updates for that object.
/// </summary>
public class RealtimeHub : Hub
{
    public static string ObjectGroup(string keyString) => $"object:{keyString}";

    public static string TelemetryGroup(string keyString) => $"telemetry:{keyString}";

    public Task SubscribeToObject(string keyString) =>
        Groups.AddToGroupAsync(Context.ConnectionId, ObjectGroup(keyString));

    public Task UnsubscribeFromObject(string keyString) =>
        Groups.RemoveFromGroupAsync(Context.ConnectionId, ObjectGroup(keyString));

    public Task SubscribeToTelemetry(string keyString) =>
        Groups.AddToGroupAsync(Context.ConnectionId, TelemetryGroup(keyString));

    public Task UnsubscribeFromTelemetry(string keyString) =>
        Groups.RemoveFromGroupAsync(Context.ConnectionId, TelemetryGroup(keyString));
}
