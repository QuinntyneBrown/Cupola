using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Cupola.Api.IntegrationTests.Testing;

namespace Cupola.Api.IntegrationTests;

/// <summary>
/// Wave-4 B01 acceptance tests: the object `configuration` bag is an opaque
/// passthrough that survives save/retrieve round-trips unchanged.
/// </summary>
[TestFixture]
public class ObjectConfigurationEndpointTests
{
    private static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web);

    private CupolaApiFactory _factory = null!;

    [OneTimeSetUp]
    public void OneTimeSetUp() => _factory = new CupolaApiFactory();

    [OneTimeTearDown]
    public void OneTimeTearDown() => _factory.Dispose();

    private static object NewObject(string key, object configuration, int version = 0) => new
    {
        identifier = new { @namespace = string.Empty, key },
        keyString = key,
        name = "Configured object",
        type = "condition-set",
        location = "mine",
        composition = Array.Empty<string>(),
        createdBy = "test.operator",
        version,
        configuration,
    };

    private static async Task<JsonElement> ReadJson(HttpResponseMessage response) =>
        JsonSerializer.Deserialize<JsonElement>(await response.Content.ReadAsStringAsync(), Json);

    [Test]
    [Requirement("OMCT-C10-L2-01.06")]
    public async Task PostObject_WithConfiguration_RoundTripsConfigurationUnchanged()
    {
        var client = _factory.CreateClient();
        var configuration = new
        {
            conditions = new object[]
            {
                new { id = "cond-1", name = "High voltage", trigger = "all", output = "ALARM" },
                new { id = "default", name = "Default", trigger = "all", output = "OK", isDefault = true },
            },
            objectStyles = new { conditionSetKeyString = "cs-1", enabled = true },
        };

        var saved = await client.PostAsJsonAsync(
            "/api/objects", NewObject("wave4-configured", configuration));
        Assert.That(saved.StatusCode, Is.EqualTo(HttpStatusCode.OK));

        var fetched = await client.GetAsync("/api/objects/wave4-configured");
        var body = await ReadJson(fetched);
        var roundTripped = body.GetProperty("configuration");

        Assert.Multiple(() =>
        {
            Assert.That(fetched.StatusCode, Is.EqualTo(HttpStatusCode.OK));
            Assert.That(
                roundTripped.GetProperty("conditions")[0].GetProperty("output").GetString(),
                Is.EqualTo("ALARM"));
            Assert.That(
                roundTripped.GetProperty("conditions")[1].GetProperty("isDefault").GetBoolean(),
                Is.True);
            Assert.That(
                roundTripped.GetProperty("objectStyles").GetProperty("enabled").GetBoolean(),
                Is.True);
        });
    }

    [Test]
    [Requirement("OMCT-C10-L2-01.06")]
    public async Task PostObject_UpdateWithNewConfiguration_ReplacesConfiguration()
    {
        var client = _factory.CreateClient();
        await client.PostAsJsonAsync(
            "/api/objects", NewObject("wave4-reconfigured", new { generation = 1 }));

        var updated = await client.PostAsJsonAsync(
            "/api/objects", NewObject("wave4-reconfigured", new { generation = 2 }, version: 1));
        Assert.That(updated.StatusCode, Is.EqualTo(HttpStatusCode.OK));

        var fetched = await client.GetAsync("/api/objects/wave4-reconfigured");
        var body = await ReadJson(fetched);

        Assert.That(
            body.GetProperty("configuration").GetProperty("generation").GetInt32(),
            Is.EqualTo(2));
    }
}
