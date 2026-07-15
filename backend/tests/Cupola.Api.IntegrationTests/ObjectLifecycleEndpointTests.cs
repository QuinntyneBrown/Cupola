using System.Net.Http.Json;
using System.Text.Json;
using Cupola.Api.IntegrationTests.Testing;

namespace Cupola.Api.IntegrationTests;

/// <summary>
/// C02 acceptance tests for object-lifecycle behaviours observable at the API
/// boundary: the persisted timestamp round-trips through save (OMCT-C02-L2-02.02),
/// and model-backed composition mutation persists through the save route
/// (OMCT-C02-L2-03.02).
/// </summary>
[TestFixture]
public class ObjectLifecycleEndpointTests
{
    private static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web);

    private CupolaApiFactory _factory = null!;

    [OneTimeSetUp]
    public void OneTimeSetUp() => _factory = new CupolaApiFactory();

    [OneTimeTearDown]
    public void OneTimeTearDown() => _factory.Dispose();

    private static object NewObject(
        string key,
        string name,
        string[]? composition = null,
        DateTimeOffset? persisted = null,
        int version = 0) => new
    {
        identifier = new { @namespace = string.Empty, key },
        keyString = key,
        name,
        type = "folder",
        location = "mine",
        composition = composition ?? Array.Empty<string>(),
        persisted,
        createdBy = "test.operator",
        version,
    };

    private static async Task<JsonElement> ReadJson(HttpResponseMessage response) =>
        JsonSerializer.Deserialize<JsonElement>(await response.Content.ReadAsStringAsync(), Json);

    private static string?[] CompositionKeys(JsonElement composition) =>
        composition.EnumerateArray().Select(child => child.GetProperty("keyString").GetString()).ToArray();

    [Test]
    [Requirement("OMCT-C02-L2-02.02")]
    public async Task PostObject_WithPersistedTimestamp_RoundTripsThroughSave()
    {
        var client = _factory.CreateClient();
        var persisted = DateTimeOffset.Parse("2026-07-15T10:00:00Z");

        await client.PostAsJsonAsync(
            "/api/objects", NewObject("c02-persisted", "Persisted", persisted: persisted));
        var fetched = await ReadJson(await client.GetAsync("/api/objects/c02-persisted"));

        Assert.That(fetched.GetProperty("persisted").GetDateTimeOffset(), Is.EqualTo(persisted));
    }

    [Test]
    [Requirement("OMCT-C02-L2-03.02")]
    public async Task PostParent_WithMutatedComposition_PersistsThroughSaveRoute()
    {
        var client = _factory.CreateClient();
        await client.PostAsJsonAsync("/api/objects", NewObject("c02-child-a", "Child A"));
        await client.PostAsJsonAsync("/api/objects", NewObject("c02-child-b", "Child B"));

        await client.PostAsJsonAsync(
            "/api/objects", NewObject("c02-parent", "Parent", composition: new[] { "c02-child-a" }));
        var afterAdd = await ReadJson(await client.GetAsync("/api/objects/c02-parent/composition"));
        Assert.That(CompositionKeys(afterAdd), Is.EqualTo(new[] { "c02-child-a" }));

        await client.PostAsJsonAsync(
            "/api/objects",
            NewObject("c02-parent", "Parent", composition: new[] { "c02-child-a", "c02-child-b" }, version: 1));
        var afterMutation = await ReadJson(await client.GetAsync("/api/objects/c02-parent/composition"));

        Assert.That(CompositionKeys(afterMutation), Is.EqualTo(new[] { "c02-child-a", "c02-child-b" }));
    }
}
