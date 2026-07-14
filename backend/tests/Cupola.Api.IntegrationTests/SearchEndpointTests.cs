using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Cupola.Api.IntegrationTests.Testing;

namespace Cupola.Api.IntegrationTests;

[TestFixture]
public class SearchEndpointTests
{
    private CupolaApiFactory _factory = null!;

    [OneTimeSetUp]
    public void OneTimeSetUp() => _factory = new CupolaApiFactory();

    [OneTimeTearDown]
    public void OneTimeTearDown() => _factory.Dispose();

    [Test]
    [Requirement("OMCT-C15-L2-05.05")]
    public async Task Search_Solar_ReturnsTwoObjectsAndOneAnnotation()
    {
        var client = _factory.CreateClient();

        var response = await client.GetAsync("/api/search?q=solar");
        var result = await response.Content.ReadFromJsonAsync<JsonElement>();

        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));
        Assert.Multiple(() =>
        {
            Assert.That(result.GetProperty("objects").GetArrayLength(), Is.EqualTo(2));
            Assert.That(result.GetProperty("annotations").GetArrayLength(), Is.EqualTo(1));
        });
    }

    [Test]
    [Requirement("OMCT-C15-L2-05.05")]
    public async Task Search_NoMatch_ReturnsEmptyArrays()
    {
        var client = _factory.CreateClient();

        var response = await client.GetAsync("/api/search?q=zzz");
        var result = await response.Content.ReadFromJsonAsync<JsonElement>();

        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));
        Assert.Multiple(() =>
        {
            Assert.That(result.GetProperty("objects").GetArrayLength(), Is.EqualTo(0));
            Assert.That(result.GetProperty("annotations").GetArrayLength(), Is.EqualTo(0));
        });
    }

    [Test]
    [Requirement("OMCT-C15-L2-05.05")]
    public async Task Search_MissingQuery_ReturnsEmptyArrays()
    {
        var client = _factory.CreateClient();

        var response = await client.GetAsync("/api/search");
        var result = await response.Content.ReadFromJsonAsync<JsonElement>();

        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));
        Assert.Multiple(() =>
        {
            Assert.That(result.GetProperty("objects").GetArrayLength(), Is.EqualTo(0));
            Assert.That(result.GetProperty("annotations").GetArrayLength(), Is.EqualTo(0));
        });
    }
}
