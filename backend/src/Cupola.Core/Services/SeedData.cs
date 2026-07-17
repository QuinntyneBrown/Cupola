using System.Text.Json;
using Cupola.Core.Models;

namespace Cupola.Core.Services;

/// <summary>
/// The canonical seed object tree and annotations.
/// </summary>
public static class SeedData
{
    public static readonly DateTimeOffset Created = new(2026, 7, 2, 14, 51, 8, TimeSpan.Zero);
    public static readonly DateTimeOffset Modified = new(2026, 7, 13, 9, 12, 44, TimeSpan.Zero);

    private const string CreatedBy = "j.reyes";

    public static IReadOnlyList<DomainObject> CreateObjects() =>
    [
        Folder("ROOT", "Root", "root", location: null, "station", "operations", "mine"),
        Folder("station", "Station", "folder", "ROOT", "power", "thermal", "comms"),
        Folder("power", "Power", "folder", "station", "pwr.array_out", "pwr.bus_v"),
        Folder("thermal", "Thermal", "folder", "station"),
        Folder("comms", "Comms", "folder", "station", "cam.cupola"),
        Folder("mine", "My Items", "folder", "ROOT", "station-displays", "ops-notebook"),
        Folder("station-displays", "Station displays", "folder", "mine", "power-dashboard", "solar-array-output"),
        Folder("power-dashboard", "Power dashboard", "layout", "station-displays"),
        Folder("solar-array-output", "Solar array output", "overlay-plot", "station-displays", "pwr.array_out", "pwr.bus_v"),
        Folder("ops-notebook", "Ops notebook", "notebook", "mine"),
        Folder("operations", "Operations", "folder", "ROOT", "iss-plan", "log.activity"),
        Plan("iss-plan", "ISS daily plan", "operations"),
        Telemetry("pwr.array_out", "Solar array power", "power", new TelemetryMetadata(["range"], "kW")),
        Telemetry("pwr.bus_v", "Bus voltage", "power", new TelemetryMetadata(["range"], "V")),
        Telemetry("cam.cupola", "Cupola camera", "comms", new TelemetryMetadata(
            ["image"],
            Imagery: JsonSerializer.SerializeToElement(new
            {
                layers = new object[]
                {
                    new { key = "reticle", name = "Reticle grid", source = "/imagery/layers/reticle.svg", visible = true },
                    new { key = "horizon", name = "Horizon limb", source = "/imagery/layers/horizon.svg", visible = false },
                },
                relatedTelemetry = new[] { "pwr.bus_v", "pwr.array_out" },
            }))),
        Telemetry("log.activity", "Activity log", "operations", new TelemetryMetadata(["domain"])),
    ];

    public static IReadOnlyList<Annotation> CreateAnnotations() =>
    [
        new Annotation(
            "ann-1",
            "Observed solar pointing offset during eclipse exit",
            ["ops-notebook"],
            ["power"],
            Modified),
        new Annotation(
            "ann-2",
            "Bus voltage sag during pass 12",
            ["solar-array-output"],
            ["power"],
            Modified),
    ];

    private static DomainObject Folder(
        string key, string name, string type, string? location, params string[] composition)
    {
        var identifier = Identifier.Parse(key);
        return new DomainObject
        {
            Identifier = identifier,
            KeyString = identifier.ToKeyString(),
            Name = name,
            Type = type,
            Location = location,
            Composition = composition,
            Telemetry = null,
            Created = Created,
            Modified = Modified,
            CreatedBy = CreatedBy,
            Version = 1,
        };
    }

    private static DomainObject Plan(string key, string name, string location)
    {
        var identifier = Identifier.Parse(key);
        static long At(int hour, int minute) =>
            new DateTimeOffset(2026, 7, 13, hour, minute, 0, TimeSpan.Zero).ToUnixTimeMilliseconds();

        var planData = new Dictionary<string, object[]>
        {
            ["Station ops"] =
            [
                new { name = "Eclipse preparation", start = At(8, 0), end = At(9, 30), type = "Station ops" },
                new { name = "Array repointing", start = At(9, 0), end = At(11, 0), type = "Station ops" },
                new { name = "Battery reconditioning", start = At(12, 0), end = At(13, 0), type = "Station ops" },
            ],
            ["Crew"] =
            [
                new { name = "Cupola photo survey", start = At(10, 0), end = At(10, 45), type = "Crew" },
            ],
        };

        return new DomainObject
        {
            Identifier = identifier,
            KeyString = identifier.ToKeyString(),
            Name = name,
            Type = "plan",
            Location = location,
            Composition = Array.Empty<string>(),
            Telemetry = null,
            Created = Created,
            Modified = Modified,
            CreatedBy = CreatedBy,
            Version = 1,
            Configuration = JsonSerializer.SerializeToElement(
                new Dictionary<string, object> { ["planData"] = planData }),
        };
    }

    private static DomainObject Telemetry(
        string key, string name, string location, TelemetryMetadata telemetry)
    {
        var identifier = Identifier.Parse(key);
        return new DomainObject
        {
            Identifier = identifier,
            KeyString = identifier.ToKeyString(),
            Name = name,
            Type = "telemetry",
            Location = location,
            Composition = Array.Empty<string>(),
            Telemetry = telemetry,
            Created = Created,
            Modified = Modified,
            CreatedBy = CreatedBy,
            Version = 1,
        };
    }
}
