namespace Cupola.Api.Contracts;

/// <summary>
/// Request body for the batched object retrieval route (B04,
/// OMCT-C04-L2-02.02).
/// </summary>
public record BatchGetRequest(IReadOnlyList<string> KeyStrings);
