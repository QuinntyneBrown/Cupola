using System.Text.RegularExpressions;
using Cupola.Api.Hubs;
using Cupola.Core.Models;
using Cupola.Core.Services;
using Microsoft.AspNetCore.StaticFiles;

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

// .NET 8's default content-type map predates AVIF; unknown extensions 404.
var staticContentTypes = new FileExtensionContentTypeProvider();
staticContentTypes.Mappings[".avif"] = "image/avif";

app.UseStaticFiles(new StaticFileOptions
{
    ContentTypeProvider = staticContentTypes,
    OnPrepareResponse = static ctx =>
        ctx.Context.Response.Headers.CacheControl = Program.CacheControlFor(ctx.File.Name),
});

app.UseCors("AngularDev");
app.MapControllers();
app.MapHub<RealtimeHub>("/hubs/realtime");
app.MapHealthChecks("/health");

app.Run();

public partial class Program
{
    // Content-hashed Angular bundles never change under their name: cache
    // forever. Stable-named imagery (marketing shots, camera frames) changes
    // only when assets are regenerated: a day of staleness is acceptable.
    // Everything else (HTML, CSS incl. runtime themes, JS) must revalidate so
    // deploys apply immediately.
    internal static string CacheControlFor(string fileName) =>
        HashedAsset().IsMatch(fileName) ? "public,max-age=31536000,immutable"
        : ImageAsset().IsMatch(fileName) ? "public,max-age=86400"
        : "no-cache";

    // Angular's esbuild hashes are 8 uppercase alphanumerics (e.g.
    // main-VUJOFXKG.js). Case matters: lowercase words like the "espresso" in
    // theme-espresso.css must not match, that file is mutable.
    [GeneratedRegex(@"-[A-Z0-9]{8}\.")]
    private static partial Regex HashedAsset();

    [GeneratedRegex(@"\.(avif|webp|png|ico|svg)$", RegexOptions.IgnoreCase)]
    private static partial Regex ImageAsset();
}
