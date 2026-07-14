using NUnit.Framework;
using NUnit.Framework.Interfaces;
using NUnit.Framework.Internal;

namespace Cupola.Core.UnitTests.Testing;

/// <summary>
/// Traces a test to a requirement ID, recording it as both an NUnit category
/// (so <c>--filter "TestCategory=..."</c> selects it) and a "Requirement"
/// property.
/// </summary>
[AttributeUsage(AttributeTargets.Method | AttributeTargets.Class, AllowMultiple = true)]
public sealed class RequirementAttribute : NUnitAttribute, IApplyToTest
{
    private readonly string _id;

    public RequirementAttribute(string id) => _id = id;

    public void ApplyToTest(Test test)
    {
        test.Properties.Add(PropertyNames.Category, _id);
        test.Properties.Set("Requirement", _id);
    }
}
