using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Cupola.Api.IntegrationTests.Testing;

namespace Cupola.Api.IntegrationTests;

[TestFixture]
public class BrandingEndpointTests
{
    private CupolaApiFactory _factory = null!;

    [OneTimeSetUp]
    public void OneTimeSetUp() => _factory = new CupolaApiFactory();

    [OneTimeTearDown]
    public void OneTimeTearDown() => _factory.Dispose();

    [Test]
    [Requirement("OMCT-C15-L2-05.03")]
    public async Task GetBranding_ReturnsConfiguredOptions()
    {
        var client = _factory.CreateClient();

        var response = await client.GetAsync("/api/branding");
        var branding = await response.Content.ReadFromJsonAsync<JsonElement>();

        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));
        Assert.Multiple(() =>
        {
            Assert.That(branding.GetProperty("appTitle").GetString(), Is.EqualTo("Cupola"));
            Assert.That(branding.GetProperty("tagline").GetString(), Is.EqualTo("Mission operations frontend"));
            Assert.That(branding.GetProperty("smallLogoImage").GetString(), Is.EqualTo("assets/cupola-logo.svg"));
            Assert.That(branding.GetProperty("aboutHtml").GetString(), Does.Contain("Open MCT"));
            Assert.That(branding.GetProperty("licenseUrl").GetString(), Is.EqualTo("/licenses"));
        });
    }
}
