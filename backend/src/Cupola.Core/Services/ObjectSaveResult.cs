using Cupola.Core.Models;

namespace Cupola.Core.Services;

/// <summary>
/// Per-object outcome vocabulary for <see cref="ObjectSaveResult"/> (B04).
/// Serialized as lower-case strings so the shared frontend type matches.
/// </summary>
public static class ObjectSaveOutcome
{
    public const string Created = "created";
    public const string Updated = "updated";
    public const string Conflict = "conflict";
}

/// <summary>
/// The outcome of persisting one domain object (OMCT-C04-L2-02.03,
/// OMCT-C04-L2-02.07). On success <see cref="Object"/> carries the saved
/// state; on conflict it carries the current stored state.
/// </summary>
public record ObjectSaveResult(string KeyString, string Outcome, DomainObject? Object);
