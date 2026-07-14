namespace Cupola.Api.Contracts;

/// <summary>
/// Request body for renaming a domain object.
/// </summary>
public record UpdateObjectRequest(string? Name);
