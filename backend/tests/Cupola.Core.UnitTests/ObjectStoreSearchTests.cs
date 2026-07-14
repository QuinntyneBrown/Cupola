using Cupola.Core.Services;
using Cupola.Core.UnitTests.Testing;

namespace Cupola.Core.UnitTests;

[TestFixture]
public class ObjectStoreSearchTests
{
    private InMemoryObjectStore _store = null!;

    [SetUp]
    public void SetUp() => _store = new InMemoryObjectStore();

    [Test]
    [Requirement("OMCT-C15-L2-05.05")]
    public void Search_ObjectName_IsCaseInsensitiveSubstring()
    {
        var lower = _store.Search("solar");
        var upper = _store.Search("SOLAR");

        Assert.Multiple(() =>
        {
            Assert.That(lower.Objects.Select(o => o.KeyString),
                Is.EquivalentTo(new[] { "solar-array-output", "pwr.array_out" }));
            Assert.That(upper.Objects.Select(o => o.KeyString),
                Is.EquivalentTo(new[] { "solar-array-output", "pwr.array_out" }));
        });
    }

    [Test]
    [Requirement("OMCT-C15-L2-05.05")]
    public void Search_AnnotationText_Matches()
    {
        var result = _store.Search("eclipse");

        Assert.That(result.Annotations.Select(a => a.KeyString), Is.EquivalentTo(new[] { "ann-1" }));
    }

    [Test]
    [Requirement("OMCT-C15-L2-05.05")]
    public void Search_AnnotationTag_Matches()
    {
        var result = _store.Search("power");

        Assert.That(result.Annotations.Select(a => a.KeyString),
            Is.EquivalentTo(new[] { "ann-1", "ann-2" }));
    }

    [Test]
    [Requirement("OMCT-C15-L2-05.05")]
    public void Search_BlankQuery_ReturnsEmpty()
    {
        var result = _store.Search("   ");

        Assert.Multiple(() =>
        {
            Assert.That(result.Objects, Is.Empty);
            Assert.That(result.Annotations, Is.Empty);
        });
    }
}
