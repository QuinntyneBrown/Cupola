using Cupola.Api.Hubs;
using Cupola.Api.Services;
using Cupola.Core.Models;
using Cupola.Core.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddSignalR();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AngularDev", policy =>
        policy.WithOrigins("http://localhost:4200")
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials());
});

builder.Services.AddSingleton<IObjectStore, InMemoryObjectStore>();
builder.Services.AddSingleton(
    builder.Configuration.GetSection("Branding").Get<BrandingOptions>() ?? new BrandingOptions());
builder.Services.AddSingleton(
    builder.Configuration.GetSection("BuildInfo").Get<BuildInfo>() ?? new BuildInfo());
builder.Services.AddHostedService<TelemetrySimulator>();

var app = builder.Build();

app.UseCors("AngularDev");
app.MapControllers();
app.MapHub<RealtimeHub>("/hubs/realtime");

app.Run();

public partial class Program { }
