using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Cupola.Api.IntegrationTests.Testing;

namespace Cupola.Api.IntegrationTests;

[TestFixture]
public class CompositionEndpointTests
{
    private CupolaApiFactory _factory = null!;

    [OneTimeSetUp]
    public void OneTimeSetUp() => _factory = new CupolaApiFactory();

    [OneTimeTearDown]
    public void OneTimeTearDown() => _factory.Dispose();

    [Test]
    [Requirement("OMCT-C15-L2-01.04")]
    public async Task GetComposition_Root_ReturnsChildrenWithMineLast()
    {
        var client = _factory.CreateClient();

        var response = await client.GetAsync("/api/objects/ROOT/composition");
        var children = await response.Content.ReadFromJsonAsync<JsonElement>();

        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));
        var keyStrings = children.EnumerateArray()
            .Select(c => c.GetProperty("keyString").GetString())
            .ToList();

        Assert.That(keyStrings, Is.Not.Empty);
        Assert.That(keyStrings[^1], Is.EqualTo("mine"));
    }

    [Test]
    [Requirement("OMCT-C15-L2-01.04")]
    public async Task GetComposition_Station_ReturnsChildrenInOrder()
    {
        var client = _factory.CreateClient();

        var response = await client.GetAsync("/api/objects/station/composition");
        var children = await response.Content.ReadFromJsonAsync<JsonElement>();

        var keyStrings = children.EnumerateArray()
            .Select(c => c.GetProperty("keyString").GetString())
            .ToList();

        Assert.That(keyStrings, Is.EqualTo(new[] { "power", "thermal", "comms" }));
    }
}
