using System.Text.Json;
using Cupola.Core.Models;
using Cupola.Core.Services;
using Cupola.Core.UnitTests.Testing;

namespace Cupola.Core.UnitTests;

/// <summary>
/// Wave-4 C13 enabler tests: annotation-typed domain objects saved through the
/// generic persistence routes project onto the B10 annotation shape for the
/// per-object annotations route and search.
/// </summary>
[TestFixture]
public class ObjectStoreAnnotationProjectionTests
{
    private InMemoryObjectStore _store = null!;

    [SetUp]
    public void SetUp() => _store = new InMemoryObjectStore();

    private static DomainObject AnnotationObject(string key, string text, string[] targets, string[] tags)
    {
        var identifier = Identifier.Parse(key);
        return new DomainObject
        {
            Identifier = identifier,
            KeyString = identifier.ToKeyString(),
            Name = text,
            Type = "annotation",
            Location = null,
            Composition = Array.Empty<string>(),
            CreatedBy = "test.operator",
            Configuration = JsonSerializer.SerializeToElement(
                new { annotation = new { text, targets, tags } }),
        };
    }

    [Test]
    [Requirement("OMCT-C13-L2-04.01")]
    public void GetAnnotationsFor_IncludesSavedAnnotationObjectsTargetingTheKey()
    {
        _store.Save(AnnotationObject(
            "ann.created-1", "Panel discoloration noted", ["solar-array-output"], ["inspection"]));

        var annotations = _store.GetAnnotationsFor("solar-array-output");

        Assert.That(annotations, Is.Not.Null);
        var projected = annotations!.SingleOrDefault(a => a.KeyString == "ann.created-1");
        Assert.Multiple(() =>
        {
            Assert.That(projected, Is.Not.Null);
            Assert.That(projected!.Text, Is.EqualTo("Panel discoloration noted"));
            Assert.That(projected.Tags, Is.EqualTo(new[] { "inspection" }));
        });
    }

    [Test]
    [Requirement("OMCT-C13-L2-04.05")]
    public void Search_MatchesSavedAnnotationObjectsByTextAndTag()
    {
        _store.Save(AnnotationObject(
            "ann.created-2", "Coolant loop pressure spike", ["ops-notebook"], ["thermal-watch"]));

        var byText = _store.Search("pressure spike");
        var byTag = _store.Search("thermal-watch");

        Assert.Multiple(() =>
        {
            Assert.That(byText.Annotations.Select(a => a.KeyString), Does.Contain("ann.created-2"));
            Assert.That(byTag.Annotations.Select(a => a.KeyString), Does.Contain("ann.created-2"));
        });
    }

    [Test]
    [Requirement("OMCT-C13-L2-04.01")]
    public void GetAnnotationsFor_IgnoresAnnotationObjectsWithoutAPayload()
    {
        var identifier = Identifier.Parse("ann.malformed");
        _store.Save(new DomainObject
        {
            Identifier = identifier,
            KeyString = identifier.ToKeyString(),
            Name = "Malformed",
            Type = "annotation",
            Location = null,
            Composition = Array.Empty<string>(),
            CreatedBy = "test.operator",
        });

        var annotations = _store.GetAnnotationsFor("solar-array-output");

        Assert.That(annotations!.Select(a => a.KeyString), Does.Not.Contain("ann.malformed"));
    }
}
