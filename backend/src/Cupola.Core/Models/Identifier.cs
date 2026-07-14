namespace Cupola.Core.Models;

/// <summary>
/// A namespaced object identifier. Seed data uses empty namespaces, so the
/// key string for a seeded object is simply its key.
/// </summary>
public record Identifier(string Namespace, string Key)
{
    /// <summary>
    /// Parses a key string in the form "namespace:key" or bare "key".
    /// </summary>
    public static Identifier Parse(string value)
    {
        var separator = value.IndexOf(':');
        if (separator < 0)
        {
            return new Identifier(string.Empty, value);
        }

        return new Identifier(value[..separator], value[(separator + 1)..]);
    }

    /// <summary>
    /// Renders the identifier back to a key string, omitting an empty namespace.
    /// </summary>
    public string ToKeyString() =>
        string.IsNullOrEmpty(Namespace) ? Key : $"{Namespace}:{Key}";
}
