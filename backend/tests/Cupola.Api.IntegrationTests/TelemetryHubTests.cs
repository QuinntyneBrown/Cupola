using System.Text.Json;
using Cupola.Api.IntegrationTests.Testing;
using Microsoft.AspNetCore.SignalR.Client;

namespace Cupola.Api.IntegrationTests;

[TestFixture]
public class TelemetryHubTests
{
    private TelemetryCupolaApiFactory _factory = null!;

    [OneTimeSetUp]
    public void OneTimeSetUp() => _factory = new TelemetryCupolaApiFactory();

    [OneTimeTearDown]
    public void OneTimeTearDown() => _factory.Dispose();

    [Test]
    [Requirement("OMCT-C15-L2-02.05")]
    public async Task OptInSimulator_PublishesTelemetryForSubscribedObject()
    {
        await using var connection = new HubConnectionBuilder()
            .WithUrl(new Uri(_factory.Server.BaseAddress, "hubs/realtime"), options =>
            {
                options.HttpMessageHandlerFactory = _ => _factory.Server.CreateHandler();
            })
            .Build();
        await connection.StartAsync();

        var received = new TaskCompletionSource<string>(TaskCreationOptions.RunContinuationsAsynchronously);
        connection.On<JsonElement>("TelemetryReceived", payload =>
        {
            var keyString = ReadString(payload, "keyString");
            if (keyString == "pwr.bus_v")
            {
                received.TrySetResult(keyString);
            }
        });

        await connection.InvokeAsync("SubscribeToTelemetry", "pwr.bus_v");

        var winner = await Task.WhenAny(received.Task, Task.Delay(TimeSpan.FromSeconds(6)));

        Assert.That(winner, Is.SameAs(received.Task), "No TelemetryReceived arrived within 6s");
        Assert.That(await received.Task, Is.EqualTo("pwr.bus_v"));
    }

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
