using Cupola.Core.Models;
using Cupola.Core.UnitTests.Testing;

namespace Cupola.Core.UnitTests;

[TestFixture]
public class IdentifierTests
{
    [Test]
    [Requirement("OMCT-C15-L2-01.03")]
    public void Parse_NamespacedKeyString_RoundTrips()
    {
        var identifier = Identifier.Parse("space:widget");

        Assert.Multiple(() =>
        {
            Assert.That(identifier.Namespace, Is.EqualTo("space"));
            Assert.That(identifier.Key, Is.EqualTo("widget"));
            Assert.That(identifier.ToKeyString(), Is.EqualTo("space:widget"));
        });
    }

    [Test]
    [Requirement("OMCT-C15-L2-01.03")]
    public void Parse_BareKey_HasEmptyNamespace()
    {
        var identifier = Identifier.Parse("pwr.bus_v");

        Assert.Multiple(() =>
        {
            Assert.That(identifier.Namespace, Is.Empty);
            Assert.That(identifier.Key, Is.EqualTo("pwr.bus_v"));
        });
    }

    [Test]
    [Requirement("OMCT-C15-L2-01.03")]
    public void ToKeyString_OmitsEmptyNamespace()
    {
        var identifier = new Identifier(string.Empty, "mine");

        Assert.That(identifier.ToKeyString(), Is.EqualTo("mine"));
    }
}
