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
}
