using System.Net.Http.Json;
using System.Text.Json;
using Cupola.Api.IntegrationTests.Testing;
using Microsoft.AspNetCore.SignalR.Client;

namespace Cupola.Api.IntegrationTests;

[TestFixture]
public class ObjectUpdateHubTests
{
    private CupolaApiFactory _factory = null!;

    [OneTimeSetUp]
    public void OneTimeSetUp() => _factory = new CupolaApiFactory();

    [OneTimeTearDown]
    public void OneTimeTearDown() => _factory.Dispose();

    [Test]
    [Requirement("OMCT-C15-L2-01.03")]
    public async Task Rename_BroadcastsObjectUpdated_ToSubscribedClient()
    {
        await using var connection = BuildConnection();
        await connection.StartAsync();

        var received = new TaskCompletionSource<string>(TaskCreationOptions.RunContinuationsAsynchronously);
        connection.On<JsonElement>("ObjectUpdated", payload =>
            received.TrySetResult(ReadString(payload, "name") ?? string.Empty));

        await connection.InvokeAsync("SubscribeToObject", "pwr.bus_v");

        var client = _factory.CreateClient();
        var put = await client.PutAsJsonAsync("/api/objects/pwr.bus_v", new { name = "Primary bus voltage" });
        put.EnsureSuccessStatusCode();

        var winner = await Task.WhenAny(received.Task, Task.Delay(TimeSpan.FromSeconds(5)));

        Assert.That(winner, Is.SameAs(received.Task), "ObjectUpdated was not received within 5s");
        Assert.That(await received.Task, Is.EqualTo("Primary bus voltage"));
    }

    [Test]
    [Requirement("OMCT-C15-L2-01.03")]
    public async Task Rename_DoesNotNotify_ClientSubscribedToDifferentObject()
    {
        await using var connection = BuildConnection();
        await connection.StartAsync();

        var received = new TaskCompletionSource<string>(TaskCreationOptions.RunContinuationsAsynchronously);
        connection.On<JsonElement>("ObjectUpdated", payload =>
            received.TrySetResult(ReadString(payload, "name") ?? string.Empty));

        await connection.InvokeAsync("SubscribeToObject", "pwr.array_out");

        var client = _factory.CreateClient();
        var put = await client.PutAsJsonAsync("/api/objects/pwr.bus_v", new { name = "Should not arrive" });
        put.EnsureSuccessStatusCode();

        var winner = await Task.WhenAny(received.Task, Task.Delay(TimeSpan.FromSeconds(1)));

        Assert.That(winner, Is.Not.SameAs(received.Task),
            "ObjectUpdated should not reach a client subscribed to another object");
    }

    private HubConnection BuildConnection() =>
        new HubConnectionBuilder()
            .WithUrl(new Uri(_factory.Server.BaseAddress, "hubs/realtime"), options =>
            {
                options.HttpMessageHandlerFactory = _ => _factory.Server.CreateHandler();
            })
            .Build();

    private static string? ReadString(JsonElement element, string propertyName)
    {
        foreach (var property in element.EnumerateObject())
        {
            if (string.Equals(property.Name, propertyName, StringComparison.OrdinalIgnoreCase))
            {
                return property.Value.GetString();
            }
        }

        return null;
    }
}
