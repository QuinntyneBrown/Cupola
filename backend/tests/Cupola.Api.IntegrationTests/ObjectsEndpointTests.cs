using System.Net;
using Cupola.Api.IntegrationTests.Testing;

namespace Cupola.Api.IntegrationTests;

[TestFixture]
public class ObjectsEndpointTests
{
    private CupolaApiFactory _factory = null!;

    [OneTimeSetUp]
    public void OneTimeSetUp() => _factory = new CupolaApiFactory();

    [OneTimeTearDown]
    public void OneTimeTearDown() => _factory.Dispose();

    [Test]
    [Requirement("OMCT-C15-L2-01.03")]
    public async Task GetObject_Known_ReturnsCamelCaseJson()
    {
        var client = _factory.CreateClient();

        var response = await client.GetAsync("/api/objects/mine");
        var json = await response.Content.ReadAsStringAsync();

        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));
        Assert.Multiple(() =>
        {
            Assert.That(json, Does.Contain("\"keyString\""));
            Assert.That(json, Does.Contain("\"name\""));
            Assert.That(json, Does.Contain("\"composition\""));
        });
    }

    [Test]
    [Requirement("OMCT-C15-L2-01.03")]
    public async Task GetObject_Unknown_Returns404()
    {
        var client = _factory.CreateClient();

        var response = await client.GetAsync("/api/objects/does-not-exist");

        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.NotFound));
    }
}
