using Cupola.Core.Services;
using Cupola.Core.UnitTests.Testing;

namespace Cupola.Core.UnitTests;

[TestFixture]
public class ObjectStoreCompositionTests
{
    private InMemoryObjectStore _store = null!;

    [SetUp]
    public void SetUp() => _store = new InMemoryObjectStore();

    [Test]
    [Requirement("OMCT-C15-L2-01.04")]
    public void GetComposition_Root_IsNonEmptyAndOrderedWithMineLast()
    {
        var children = _store.GetComposition(IObjectStore.RootKeyString);

        Assert.That(children, Is.Not.Null);
        Assert.That(children!, Is.Not.Empty);
        Assert.That(children.Select(c => c.KeyString), Is.EqualTo(new[] { "station", "operations", "mine" }));
        Assert.That(children[^1].KeyString, Is.EqualTo("mine"));
    }

    [Test]
    [Requirement("OMCT-C15-L2-01.04")]
    public void GetComposition_Leaf_IsEmpty()
    {
        var children = _store.GetComposition("thermal");

        Assert.That(children, Is.Not.Null);
        Assert.That(children!, Is.Empty);
    }

    [Test]
    [Requirement("OMCT-C15-L2-01.04")]
    public void GetComposition_UnknownParent_ReturnsNull()
    {
        var children = _store.GetComposition("does-not-exist");

        Assert.That(children, Is.Null);
    }
}
