using Microsoft.AspNetCore.Mvc.Testing;

namespace Cupola.Api.IntegrationTests;

/// <summary>
/// Boots the API in-memory for integration and SignalR tests.
/// </summary>
public class CupolaApiFactory : WebApplicationFactory<Program>
{
}
