using Cupola.Simulators;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.DependencyInjection;

namespace Cupola.Api.IntegrationTests;

/// <summary>
/// Boots an API test host with the non-production telemetry simulator enabled.
/// </summary>
public sealed class TelemetryCupolaApiFactory : CupolaApiFactory
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        base.ConfigureWebHost(builder);
        builder.ConfigureServices(services => services.AddCupolaTelemetrySimulator());
    }
}
