using Microsoft.Extensions.DependencyInjection;

namespace Cupola.Simulators;

/// <summary>
/// Registers opt-in simulation services for development and testing hosts.
/// </summary>
public static class SimulatorServiceCollectionExtensions
{
    public static IServiceCollection AddCupolaTelemetrySimulator(this IServiceCollection services)
    {
        services.AddHostedService<TelemetrySimulator>();

        return services;
    }
}
