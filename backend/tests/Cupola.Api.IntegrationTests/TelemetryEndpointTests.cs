using System.Linq;
using System.Net;
using System.Text.Json;
using Cupola.Api.IntegrationTests.Testing;

namespace Cupola.Api.IntegrationTests;

/// <summary>
/// C06 acceptance tests for the historical telemetry route
/// GET /api/telemetry/{keyString}?start=&amp;end= (OMCT-C06-L2-04.01).
/// </summary>
[TestFixture]
public class TelemetryEndpointTests
{
    private static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web);

    private CupolaApiFactory _factory = null!;

    [OneTimeSetUp]
    public void OneTimeSetUp() => _factory = new CupolaApiFactory();

    [OneTimeTearDown]
    public void OneTimeTearDown() => _factory.Dispose();

    [Test]
    [Requirement("OMCT-C06-L2-04.01")]
    public async Task GetHistory_TelemetryKey_ReturnsBoundedOrderedSamples()
    {
        var client = _factory.CreateClient();
        const long start = 1_000;
        const long end = 6_000;

        var response = await client.GetAsync($"/api/telemetry/pwr.bus_v?start={start}&end={end}");
        var body = JsonSerializer.Deserialize<JsonElement>(
            await response.Content.ReadAsStringAsync(), Json);

        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));
        var timestamps = body.EnumerateArray()
            .Select(sample => DateTimeOffset.Parse(sample.GetProperty("timestamp").GetString()!).ToUnixTimeMilliseconds())
            .ToList();

        Assert.That(timestamps, Is.Not.Empty);
        Assert.That(timestamps, Is.Ordered);
        Assert.That(timestamps.First(), Is.GreaterThanOrEqualTo(start));
        Assert.That(timestamps.Last(), Is.LessThanOrEqualTo(end));
    }

    [Test]
    [Requirement("OMCT-C06-L2-04.01")]
    public async Task GetHistory_UnknownKey_Returns404()
    {
        var client = _factory.CreateClient();

        var response = await client.GetAsync("/api/telemetry/no-such-key?start=0&end=1000");

        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.NotFound));
    }

    [Test]
    [Requirement("OMCT-C06-L2-04.01")]
    public async Task GetHistory_NonTelemetryObject_Returns404()
    {
        var client = _factory.CreateClient();

        var response = await client.GetAsync("/api/telemetry/mine?start=0&end=1000");

        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.NotFound));
    }
}
