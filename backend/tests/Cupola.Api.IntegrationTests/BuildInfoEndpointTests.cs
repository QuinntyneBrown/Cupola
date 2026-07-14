using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Cupola.Api.IntegrationTests.Testing;

namespace Cupola.Api.IntegrationTests;

[TestFixture]
public class BuildInfoEndpointTests
{
    private CupolaApiFactory _factory = null!;

    [OneTimeSetUp]
    public void OneTimeSetUp() => _factory = new CupolaApiFactory();

    [OneTimeTearDown]
    public void OneTimeTearDown() => _factory.Dispose();

    [Test]
    [Requirement("OMCT-C15-L2-05.04")]
    public async Task GetBuildInfo_ReturnsConfiguredBuildInfo()
    {
        var client = _factory.CreateClient();

        var response = await client.GetAsync("/api/branding/build-info");
        var buildInfo = await response.Content.ReadFromJsonAsync<JsonElement>();

        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));
        Assert.Multiple(() =>
        {
            Assert.That(buildInfo.GetProperty("version").GetString(), Is.EqualTo("0.1.0"));
            Assert.That(buildInfo.GetProperty("buildDate").GetString(), Is.EqualTo("2026-07-13T00:00:00Z"));
            Assert.That(buildInfo.GetProperty("revision").GetString(), Is.EqualTo("a3f9c21"));
            Assert.That(buildInfo.GetProperty("branch").GetString(), Is.EqualTo("main"));
        });
    }
}
