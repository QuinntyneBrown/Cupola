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
        Folder("ROOT", "Root", "root", location: null, "station", "mine"),
        Folder("station", "Station", "folder", "ROOT", "power", "thermal", "comms"),
        Folder("power", "Power", "folder", "station", "pwr.array_out", "pwr.bus_v"),
        Folder("thermal", "Thermal", "folder", "station"),
        Folder("comms", "Comms", "folder", "station", "cam.cupola"),
        Folder("mine", "My Items", "folder", "ROOT", "station-displays", "ops-notebook"),
        Folder("station-displays", "Station displays", "folder", "mine", "power-dashboard", "solar-array-output"),
        Folder("power-dashboard", "Power dashboard", "layout", "station-displays"),
        Folder("solar-array-output", "Solar array output", "overlay-plot", "station-displays", "pwr.array_out", "pwr.bus_v"),
        Folder("ops-notebook", "Ops notebook", "notebook", "mine"),
        Telemetry("pwr.array_out", "Solar array power", "power", new TelemetryMetadata(["range"], "kW")),
        Telemetry("pwr.bus_v", "Bus voltage", "power", new TelemetryMetadata(["range"], "V")),
        Telemetry("cam.cupola", "Cupola camera", "comms", new TelemetryMetadata(["image"])),
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
        };
    }
}
