using System.Text.RegularExpressions;
using Cupola.Api.Hubs;
using Cupola.Core.Models;
using Cupola.Core.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddSignalR();
builder.Services.AddHealthChecks();

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

var app = builder.Build();

// wwwroot hosts the marketing site at '/' and the Angular app under '/app/'
// (assembled at CI time; absent in local dev, where these middlewares no-op).
// The SPA uses hash routing, so no server-side fallback route is required.
app.UseDefaultFiles();
app.UseStaticFiles(new StaticFileOptions
{
    OnPrepareResponse = static ctx =>
        ctx.Context.Response.Headers.CacheControl =
            Program.HashedAsset().IsMatch(ctx.File.Name)
                ? "public,max-age=31536000,immutable"
                : "no-cache",
});

app.UseCors("AngularDev");
app.MapControllers();
app.MapHub<RealtimeHub>("/hubs/realtime");
app.MapHealthChecks("/health");

app.Run();

public partial class Program
{
    // Matches Angular's content-hashed output names (e.g. main-AB12CD34.js),
    // which are safe to cache forever; everything else must revalidate.
    [GeneratedRegex(@"-[a-zA-Z0-9]{8}\.")]
    internal static partial Regex HashedAsset();
}
