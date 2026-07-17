using Cupola.Core.Services;
using Cupola.Core.UnitTests.Testing;

namespace Cupola.Core.UnitTests;

[TestFixture]
public class SeedDataTests
{
    private InMemoryObjectStore _store = null!;

    [SetUp]
    public void SetUp() => _store = new InMemoryObjectStore();

    [Test]
    [Requirement("OMCT-C15-L2-01.04")]
    public void EveryCompositionKeyString_ResolvesToAnObject()
    {
        foreach (var domainObject in SeedData.CreateObjects())
        {
            foreach (var childKey in domainObject.Composition)
            {
                Assert.That(_store.GetByKeyString(childKey), Is.Not.Null,
                    $"'{domainObject.KeyString}' references missing child '{childKey}'");
            }
        }
    }

    [Test]
    [Requirement("OMCT-C15-L2-01.04")]
    public void Root_HasAtLeastOneChild()
    {
        var children = _store.GetComposition(IObjectStore.RootKeyString);

        Assert.That(children, Is.Not.Null);
        Assert.That(children!.Count, Is.GreaterThanOrEqualTo(1));
    }

    [Test]
    [Requirement("OMCT-C15-L2-05.05")]
    public void EveryAnnotationTarget_ResolvesToAnObject()
    {
        foreach (var annotation in SeedData.CreateAnnotations())
        {
            foreach (var target in annotation.Targets)
            {
                Assert.That(_store.GetByKeyString(target), Is.Not.Null,
                    $"annotation '{annotation.KeyString}' targets missing object '{target}'");
            }
        }
    }

    [Test]
    [Requirement("OMCT-C15-L2-01.04")]
    public void MarqueeObjects_AreSeededWithPresentationConfiguration()
    {
        // Curated views whose demo value depends on a persisted configuration payload.
        string[] configured = ["power-dashboard", "eclipse-stack", "bus-monitor", "ops-notebook"];

        Assert.Multiple(() =>
        {
            foreach (var key in configured)
            {
                var seeded = _store.GetByKeyString(key);
                Assert.That(seeded, Is.Not.Null, $"marquee object '{key}' is not seeded");
                Assert.That(seeded!.Configuration, Is.Not.Null,
                    $"marquee object '{key}' is missing its presentation configuration");
            }

            // ops-gantt derives its view purely from the composed plan, so it carries no configuration.
            Assert.That(_store.GetByKeyString("ops-gantt"), Is.Not.Null,
                "marquee object 'ops-gantt' is not seeded");
        });
    }

    [Test]
    [Requirement("OMCT-C11-L2-02.04")]
    public void CupolaCamera_CarriesImageryLayerAndRelatedSourceDeclarations()
    {
        var camera = _store.GetByKeyString("cam.cupola");

        Assert.That(camera?.Telemetry?.Imagery, Is.Not.Null);
        var imagery = camera!.Telemetry!.Imagery!.Value;
        var layers = imagery.GetProperty("layers").EnumerateArray().ToList();
        var related = imagery.GetProperty("relatedTelemetry").EnumerateArray()
            .Select(source => source.GetString())
            .ToList();

        Assert.Multiple(() =>
        {
            Assert.That(layers.Select(l => l.GetProperty("key").GetString()),
                Is.EqualTo(new[] { "reticle", "horizon" }));
            Assert.That(layers.All(l => l.GetProperty("source").GetString()!.StartsWith("/imagery/layers/")),
                Is.True);
            foreach (var source in related)
            {
                Assert.That(_store.GetByKeyString(source!), Is.Not.Null,
                    $"related telemetry '{source}' is not a seeded object");
            }
        });
    }
}
