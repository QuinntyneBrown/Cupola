using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Cupola.Api.IntegrationTests.Testing;

namespace Cupola.Api.IntegrationTests;

/// <summary>
/// C04 acceptance tests for the persistence routes: create/update saves,
/// batched retrieval, batched saves with per-object results, and conflict
/// reporting.
/// </summary>
[TestFixture]
public class PersistenceEndpointTests
{
    private static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web);

    private CupolaApiFactory _factory = null!;

    [OneTimeSetUp]
    public void OneTimeSetUp() => _factory = new CupolaApiFactory();

    [OneTimeTearDown]
    public void OneTimeTearDown() => _factory.Dispose();

    private static object NewObject(string key, string name, int version = 0) => new
    {
        identifier = new { @namespace = string.Empty, key },
        keyString = key,
        name,
        type = "folder",
        location = "mine",
        composition = Array.Empty<string>(),
        createdBy = "test.operator",
        version,
    };

    private static async Task<JsonElement> ReadJson(HttpResponseMessage response) =>
        JsonSerializer.Deserialize<JsonElement>(await response.Content.ReadAsStringAsync(), Json);

    [Test]
    [Requirement("OMCT-C04-L2-02.01")]
    public async Task PostObject_Unknown_CreatesAndReportsCreatedOutcome()
    {
        var client = _factory.CreateClient();

        var response = await client.PostAsJsonAsync("/api/objects", NewObject("c04-created", "Created via POST"));
        var body = await ReadJson(response);

        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));
        Assert.Multiple(() =>
        {
            Assert.That(body.GetProperty("outcome").GetString(), Is.EqualTo("created"));
            Assert.That(body.GetProperty("object").GetProperty("version").GetInt32(), Is.EqualTo(1));
        });

        var fetched = await client.GetAsync("/api/objects/c04-created");
        Assert.That(fetched.StatusCode, Is.EqualTo(HttpStatusCode.OK));
    }

    [Test]
    [Requirement("OMCT-C04-L2-02.01")]
    public async Task PostObject_KnownWithMatchingVersion_UpdatesAndReportsUpdatedOutcome()
    {
        var client = _factory.CreateClient();
        await client.PostAsJsonAsync("/api/objects", NewObject("c04-updated", "Original"));

        var response = await client.PostAsJsonAsync(
            "/api/objects", NewObject("c04-updated", "Revised", version: 1));
        var body = await ReadJson(response);

        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));
        Assert.Multiple(() =>
        {
            Assert.That(body.GetProperty("outcome").GetString(), Is.EqualTo("updated"));
            Assert.That(body.GetProperty("object").GetProperty("name").GetString(), Is.EqualTo("Revised"));
            Assert.That(body.GetProperty("object").GetProperty("version").GetInt32(), Is.EqualTo(2));
        });
    }

    [Test]
    [Requirement("OMCT-C04-L2-02.07")]
    public async Task PostObject_StaleVersion_Returns409WithConflictOutcomeAndCurrentState()
    {
        var client = _factory.CreateClient();
        await client.PostAsJsonAsync("/api/objects", NewObject("c04-conflicted", "Original"));

        var response = await client.PostAsJsonAsync(
            "/api/objects", NewObject("c04-conflicted", "Stale edit", version: 99));
        var body = await ReadJson(response);

        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Conflict));
        Assert.Multiple(() =>
        {
            Assert.That(body.GetProperty("outcome").GetString(), Is.EqualTo("conflict"));
            Assert.That(body.GetProperty("object").GetProperty("name").GetString(), Is.EqualTo("Original"));
        });
    }

    [Test]
    [Requirement("OMCT-C04-L2-02.02")]
    public async Task BatchGet_ReturnsKnownObjectsOmittingUnknown()
    {
        var client = _factory.CreateClient();

        var response = await client.PostAsJsonAsync(
            "/api/objects/batch-get", new { keyStrings = new[] { "pwr.bus_v", "no-such-key", "mine" } });
        var body = await ReadJson(response);

        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));
        var keys = body.EnumerateArray().Select(e => e.GetProperty("keyString").GetString()).ToArray();
        Assert.That(keys, Is.EqualTo(new[] { "pwr.bus_v", "mine" }));
    }

    [Test]
    [Requirement("OMCT-C04-L2-02.03")]
    public async Task BatchSave_ReportsIndependentPerObjectResults()
    {
        var client = _factory.CreateClient();
        await client.PostAsJsonAsync("/api/objects", NewObject("c04-batch-existing", "Existing"));

        var response = await client.PostAsJsonAsync("/api/objects/batch", new[]
        {
            NewObject("c04-batch-new", "New in batch"),
            NewObject("c04-batch-existing", "Stale in batch", version: 99),
        });
        var body = await ReadJson(response);

        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));
        var outcomes = body.EnumerateArray().Select(e => e.GetProperty("outcome").GetString()).ToArray();
        Assert.That(outcomes, Is.EqualTo(new[] { "created", "conflict" }));
    }
}
