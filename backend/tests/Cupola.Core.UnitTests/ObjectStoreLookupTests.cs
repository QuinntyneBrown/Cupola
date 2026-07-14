using Cupola.Core.Services;
using Cupola.Core.UnitTests.Testing;

namespace Cupola.Core.UnitTests;

[TestFixture]
public class ObjectStoreLookupTests
{
    private InMemoryObjectStore _store = null!;

    [SetUp]
    public void SetUp() => _store = new InMemoryObjectStore();

    [Test]
    [Requirement("OMCT-C15-L2-01.03")]
    public void GetByKeyString_KnownKey_ReturnsObject()
    {
        var domainObject = _store.GetByKeyString("mine");

        Assert.That(domainObject, Is.Not.Null);
        Assert.That(domainObject!.Name, Is.EqualTo("My Items"));
    }

    [Test]
    [Requirement("OMCT-C15-L2-01.03")]
    public void GetByKeyString_UnknownKey_ReturnsNull()
    {
        var domainObject = _store.GetByKeyString("does-not-exist");

        Assert.That(domainObject, Is.Null);
    }
}
