using Cupola.Core.Models;

namespace Cupola.Core.Services;

/// <summary>
/// The in-memory object tree, annotations, and search over both.
/// </summary>
public interface IObjectStore
{
    /// <summary>Key string of the root object.</summary>
    const string RootKeyString = "ROOT";

    /// <summary>Returns the object for a key string, or null if unknown.</summary>
    DomainObject? GetByKeyString(string keyString);

    /// <summary>
    /// Returns the composition children of an object in composition order
    /// (empty for a leaf), or null if the parent is unknown.
    /// </summary>
    IReadOnlyList<DomainObject>? GetComposition(string keyString);

    /// <summary>
    /// Returns the annotations targeting an object (empty if none), or null if
    /// the object is unknown.
    /// </summary>
    IReadOnlyList<Annotation>? GetAnnotationsFor(string keyString);

    /// <summary>
    /// Renames an object and bumps its modified timestamp, returning the updated
    /// instance, or null if unknown.
    /// </summary>
    DomainObject? UpdateName(string keyString, string name);

    /// <summary>
    /// Returns the objects for the known key strings, in request order,
    /// omitting unknown key strings (B04 batched retrieval).
    /// </summary>
    IReadOnlyList<DomainObject> GetMany(IReadOnlyList<string> keyStrings);

    /// <summary>
    /// Creates or updates an object. An unknown key string creates the object
    /// at version 1; a known key string updates it when the submitted version
    /// matches the stored version, and reports a conflict otherwise.
    /// </summary>
    ObjectSaveResult Save(DomainObject domainObject);

    /// <summary>
    /// Saves a batch of objects, returning one independent result per
    /// submitted object, in submission order (B04 batched save).
    /// </summary>
    IReadOnlyList<ObjectSaveResult> SaveMany(IReadOnlyList<DomainObject> domainObjects);

    /// <summary>
    /// Case-insensitive search of object names and annotation text/tags. A blank
    /// query returns empty results.
    /// </summary>
    SearchResult Search(string? query);
}
