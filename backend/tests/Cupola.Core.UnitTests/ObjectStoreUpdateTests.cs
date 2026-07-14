using Cupola.Core.Services;
using Cupola.Core.UnitTests.Testing;

namespace Cupola.Core.UnitTests;

[TestFixture]
public class ObjectStoreUpdateTests
{
    private InMemoryObjectStore _store = null!;

    [SetUp]
    public void SetUp() => _store = new InMemoryObjectStore();

    [Test]
    [Requirement("OMCT-C15-L2-01.03")]
    public void UpdateName_KnownKey_ChangesNameAndBumpsModified()
    {
        var original = _store.GetByKeyString("pwr.bus_v")!;
        var before = DateTimeOffset.UtcNow;

        var updated = _store.UpdateName("pwr.bus_v", "Main bus voltage");

        Assert.That(updated, Is.Not.Null);
        Assert.Multiple(() =>
        {
            Assert.That(updated!.Name, Is.EqualTo("Main bus voltage"));
            Assert.That(updated.Modified, Is.GreaterThanOrEqualTo(before));
            Assert.That(updated.Modified, Is.Not.EqualTo(original.Modified));
        });
    }

    [Test]
    [Requirement("OMCT-C15-L2-01.03")]
    public void UpdateName_UnknownKey_ReturnsNull()
    {
        var updated = _store.UpdateName("does-not-exist", "Whatever");

        Assert.That(updated, Is.Null);
    }
}
