using Cupola.Core.Models;
using Cupola.Core.Services;
using Cupola.Core.UnitTests.Testing;

namespace Cupola.Core.UnitTests;

/// <summary>
/// C04 acceptance tests for the persistence surface of the object store:
/// create/update saves, batched retrieval, batched saves with independent
/// per-object results, and optimistic-concurrency conflicts.
/// </summary>
[TestFixture]
public class ObjectStorePersistenceTests
{
    private InMemoryObjectStore _store = null!;

    [SetUp]
    public void SetUp() => _store = new InMemoryObjectStore();

    private static DomainObject NewObject(string key, string name, int version = 0)
    {
        var identifier = Identifier.Parse(key);
        return new DomainObject
        {
            Identifier = identifier,
            KeyString = identifier.ToKeyString(),
            Name = name,
            Type = "folder",
            Location = "mine",
            CreatedBy = "test.operator",
            Version = version,
        };
    }

    [Test]
    [Requirement("OMCT-C04-L2-02.01")]
    public void Save_UnknownKey_CreatesObjectAtVersionOne()
    {
        var incoming = NewObject("new-folder", "New folder");

        var result = _store.Save(incoming);

        Assert.Multiple(() =>
        {
            Assert.That(result.Outcome, Is.EqualTo(ObjectSaveOutcome.Created));
            Assert.That(result.Object!.Version, Is.EqualTo(1));
            Assert.That(_store.GetByKeyString("new-folder")!.Name, Is.EqualTo("New folder"));
        });
    }

    [Test]
    [Requirement("OMCT-C04-L2-02.01")]
    public void Save_KnownKeyWithMatchingVersion_UpdatesAndBumpsVersion()
    {
        var existing = _store.GetByKeyString("ops-notebook")!;

        var result = _store.Save(existing with { Name = "Ops notebook (rev)" });

        Assert.Multiple(() =>
        {
            Assert.That(result.Outcome, Is.EqualTo(ObjectSaveOutcome.Updated));
            Assert.That(result.Object!.Version, Is.EqualTo(existing.Version + 1));
            Assert.That(_store.GetByKeyString("ops-notebook")!.Name, Is.EqualTo("Ops notebook (rev)"));
        });
    }

    [Test]
    [Requirement("OMCT-C04-L2-02.07")]
    public void Save_KnownKeyWithStaleVersion_ReportsConflictAndLeavesStoreUnchanged()
    {
        var existing = _store.GetByKeyString("ops-notebook")!;
        var stale = existing with { Name = "Stale edit", Version = existing.Version - 1 };

        var result = _store.Save(stale);

        Assert.Multiple(() =>
        {
            Assert.That(result.Outcome, Is.EqualTo(ObjectSaveOutcome.Conflict));
            Assert.That(result.Object, Is.EqualTo(existing), "conflict carries the current stored state");
            Assert.That(_store.GetByKeyString("ops-notebook"), Is.EqualTo(existing));
        });
    }

    [Test]
    [Requirement("OMCT-C04-L2-02.02")]
    public void GetMany_ReturnsKnownObjectsInRequestOrderOmittingUnknown()
    {
        var results = _store.GetMany(["pwr.bus_v", "does-not-exist", "ops-notebook"]);

        Assert.That(
            results.Select(o => o.KeyString),
            Is.EqualTo(new[] { "pwr.bus_v", "ops-notebook" }));
    }

    [Test]
    [Requirement("OMCT-C04-L2-02.03")]
    public void SaveMany_MixedBatch_ReportsEachObjectResultIndependently()
    {
        var current = _store.GetByKeyString("ops-notebook")!;
        var batch = new[]
        {
            NewObject("batch-created", "Created in batch"),
            current with { Name = "Updated in batch" },
            NewObject("power-dashboard", "Stale in batch", version: 99),
        };

        var results = _store.SaveMany(batch);

        Assert.Multiple(() =>
        {
            Assert.That(results, Has.Count.EqualTo(3));
            Assert.That(results[0].Outcome, Is.EqualTo(ObjectSaveOutcome.Created));
            Assert.That(results[1].Outcome, Is.EqualTo(ObjectSaveOutcome.Updated));
            Assert.That(results[2].Outcome, Is.EqualTo(ObjectSaveOutcome.Conflict));
            Assert.That(_store.GetByKeyString("ops-notebook")!.Name, Is.EqualTo("Updated in batch"));
            Assert.That(_store.GetByKeyString("power-dashboard")!.Name, Is.EqualTo("Power dashboard"));
        });
    }

    [Test]
    [Requirement("OMCT-C04-L2-02.07")]
    public void SeededObjects_CarryVersionOne_SoConflictDetectionApplies()
    {
        Assert.That(_store.GetByKeyString("ops-notebook")!.Version, Is.EqualTo(1));
    }

    [Test]
    [Requirement("OMCT-C04-L2-02.07")]
    public void UpdateName_BumpsVersion_SoStaleSavesConflict()
    {
        var before = _store.GetByKeyString("ops-notebook")!;

        var renamed = _store.UpdateName("ops-notebook", "Renamed notebook")!;

        Assert.That(renamed.Version, Is.EqualTo(before.Version + 1));
    }
}
