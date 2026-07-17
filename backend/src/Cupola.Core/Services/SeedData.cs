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
        Folder("mine", "My Items", "folder", "ROOT",
            "station-displays", "ops-notebook", "plots-lab", "tables-lab", "conditions-lab", "layouts-lab"),
        Folder("station-displays", "Station displays", "folder", "mine", "power-dashboard", "solar-array-output"),
        Obj("power-dashboard", "Power dashboard", "layout", "station-displays",
            ["array-gauge", "solar-array-output", "power-lad", "cam.cupola"],
            configuration: new
            {
                layout = new
                {
                    items = new object[]
                    {
                        new { id = "it-title", kind = "text", text = "Station power overview", x = 2, y = 2, w = 76, h = 4, rotation = 0, z = 0, styles = new { color = "rgb(240, 200, 90)" } },
                        new { id = "it-plot", kind = "subobject", keyString = "solar-array-output", x = 2, y = 8, w = 46, h = 42, rotation = 0, z = 1 },
                        new { id = "it-lad", kind = "subobject", keyString = "power-lad", x = 2, y = 52, w = 46, h = 16, rotation = 0, z = 2 },
                        new { id = "it-gauge", kind = "subobject", keyString = "array-gauge", x = 50, y = 8, w = 28, h = 18, rotation = 0, z = 3 },
                        new { id = "it-cam", kind = "subobject", keyString = "cam.cupola", x = 50, y = 28, w = 28, h = 40, rotation = 0, z = 4 },
                    },
                },
            }),
        Folder("solar-array-output", "Solar array output", "overlay-plot", "station-displays", "pwr.array_out", "pwr.bus_v"),
        Obj("ops-notebook", "Ops notebook", "notebook", "mine", [],
            configuration: new
            {
                sections = new object[]
                {
                    new { id = "sec-eva", name = "EVA operations", pages = new object[] { new { id = "pg-eva71", name = "EVA 71" } } },
                },
                entries = new Dictionary<string, object>
                {
                    ["sec-eva"] = new Dictionary<string, object>
                    {
                        ["pg-eva71"] = new object[]
                        {
                            new
                            {
                                id = "ent-1",
                                createdOn = "2026-07-13T14:52:07Z",
                                createdBy = "j.reyes",
                                text = "Torqued battery 2B bolts; drive readings nominal",
                                embeds = new object[]
                                {
                                    new { objectKeyString = "pwr.bus_v", objectName = "Bus voltage", viewKey = "plot-view", capturedAt = "2026-07-13T14:51:40Z" },
                                },
                                tags = new[] { "power" },
                            },
                            new
                            {
                                id = "ent-2",
                                createdOn = "2026-07-13T13:38:19Z",
                                createdBy = "j.reyes",
                                text = "Scrubber swap complete before egress",
                                embeds = Array.Empty<object>(),
                                tags = Array.Empty<string>(),
                            },
                        },
                    },
                },
            }),
        Folder("operations", "Operations", "folder", "ROOT", "iss-plan", "log.activity", "planning-lab"),
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

        // Plots lab
        Folder("plots-lab", "Plots lab", "folder", "mine",
            "eclipse-stack", "pdu-loads", "pwr-iv", "iv-scatter"),
        Obj("eclipse-stack", "Power thermal stack", "stacked-plot", "plots-lab",
            ["solar-array-output", "pwr.array_out"],
            configuration: new { plot = new { grid = true, legend = "collapsed", yAxisMode = "single" } }),
        Obj("pdu-loads", "PDU outlet loads", "bar-graph", "plots-lab",
            ["pwr.array_out", "pwr.bus_v"],
            configuration: new { plot = new { grid = true } }),
        Obj("pwr-iv", "Bus current-voltage", "telemetry", "plots-lab", [],
            configuration: new { ranges = new[] { "current", "voltage" } },
            telemetry: new TelemetryMetadata(["range"], "A")),
        Obj("iv-scatter", "Bus IV scatter", "scatter-plot", "plots-lab",
            ["pwr-iv"],
            configuration: new { scatter = new { xKey = "current", yKey = "voltage" } }),

        // Tables lab
        Folder("tables-lab", "Tables lab", "folder", "mine",
            "bus-v-table", "power-lad", "array-gauge", "power-autoflow"),
        Obj("bus-v-table", "Bus voltage table", "table", "tables-lab",
            ["pwr.bus_v", "pwr.array_out"],
            configuration: new { table = new { columns = Array.Empty<object>(), updateKey = "timestamp" } }),
        Obj("power-lad", "Power LAD", "lad-table", "tables-lab",
            ["pwr.bus_v", "pwr.array_out"]),
        Obj("array-gauge", "Array output gauge", "gauge", "tables-lab",
            ["pwr.array_out"],
            configuration: new { gauge = new { form = "horizontal-meter", boundsMode = "limits", min = 0, max = 100 } }),
        Obj("power-autoflow", "Power autoflow", "autoflow", "tables-lab",
            ["pwr.bus_v", "pwr.array_out"]),

        // Conditions lab
        Folder("conditions-lab", "Conditions lab", "folder", "mine",
            "pwr.mode", "bus-monitor", "bus-status", "power-summary", "derived-power"),
        Obj("pwr.mode", "Bus mode", "telemetry", "conditions-lab", [],
            telemetry: new TelemetryMetadata(
                ["range"],
                "",
                Filters: JsonSerializer.SerializeToElement(new object[]
                {
                    new
                    {
                        key = "mode",
                        name = "Mode",
                        comparator = "equals",
                        singleSelection = true,
                        possibleValues = new object[]
                        {
                            new { label = "Safe", value = "SAFE" },
                            new { label = "Nominal", value = "NOMINAL" },
                        },
                    },
                    new
                    {
                        key = "quality",
                        name = "Quality",
                        comparator = "equals",
                        possibleValues = new object[]
                        {
                            new { label = "Good", value = "GOOD" },
                            new { label = "Suspect", value = "SUSPECT" },
                        },
                    },
                    new { key = "label", name = "Label", comparator = "contains" },
                }))),
        Obj("bus-monitor", "Bus monitor", "condition-set", "conditions-lab",
            ["pwr.bus_v", "pwr.mode"],
            configuration: new
            {
                conditions = new object[]
                {
                    new
                    {
                        id = "stale",
                        name = "No data",
                        trigger = "all",
                        output = "NO DATA",
                        criteria = new object[]
                        {
                            new { id = "s1", telemetryKeyString = "pwr.bus_v", metadataKey = "value", operation = "isOlderThan", input = new[] { 1000 } },
                        },
                    },
                    new
                    {
                        id = "undervolt",
                        name = "Undervoltage",
                        trigger = "all",
                        output = "UNDERVOLTAGE",
                        criteria = new object[]
                        {
                            new { id = "u1", telemetryKeyString = "pwr.bus_v", metadataKey = "value", operation = "lessThan", input = new[] { 28 } },
                        },
                    },
                    new
                    {
                        id = "nominal",
                        name = "Nominal",
                        trigger = "all",
                        output = "NOMINAL",
                        criteria = new object[]
                        {
                            new { id = "n1", telemetryKeyString = "pwr.bus_v", metadataKey = "value", operation = "greaterThanOrEqualTo", input = new[] { 28 } },
                        },
                    },
                    new { id = "default", name = "Default", trigger = "all", output = "DEFAULT", criteria = Array.Empty<object>(), isDefault = true },
                },
            }),
        Obj("bus-status", "Bus status widget", "condition-widget", "conditions-lab", [],
            configuration: new
            {
                conditionWidget = new
                {
                    conditionSetKeyString = "bus-monitor",
                    outputs = new object[]
                    {
                        new { conditionId = "stale", severity = "caution", label = "NO DATA" },
                        new { conditionId = "undervolt", severity = "critical", label = "UNDERVOLTAGE", url = "https://status.example.com/bus" },
                        new { conditionId = "nominal", severity = "ok", label = "NOMINAL" },
                    },
                },
            }),
        Obj("power-summary", "Power margin summary", "summary-widget", "conditions-lab",
            ["pwr.bus_v", "pwr.array_out"],
            configuration: new
            {
                summaryWidget = new
                {
                    rules = new object[]
                    {
                        new { id = "critical", name = "Power critical", scope = "any", metadataKey = "value", operation = "greaterThan", input = new[] { 90 }, label = "CRITICAL", color = "var(--cp-color-critical)", icon = "i-alert-circle" },
                        new { id = "default", name = "Nominal", scope = "any", metadataKey = "value", operation = "equalTo", input = new[] { 0 }, isDefault = true, label = "NOMINAL", color = "var(--cp-color-ok)" },
                    },
                },
            }),
        Obj("derived-power", "Derived bus power", "derived-telemetry", "conditions-lab", [],
            configuration: new
            {
                derived = new
                {
                    kind = "expression",
                    expression = "a * b",
                    sampleSize = 2,
                    parameters = new object[]
                    {
                        new { name = "a", keyString = "pwr.array_out" },
                        new { name = "b", keyString = "pwr.bus_v" },
                    },
                },
            }),

        // Layouts lab
        Folder("layouts-lab", "Layouts lab", "folder", "mine", "dl.station", "fl.station"),
        Obj("dl.station", "Station layout", "layout", "layouts-lab",
            ["pwr.bus_v", "cam.cupola"],
            configuration: new
            {
                layout = new
                {
                    items = new object[]
                    {
                        new { id = "it-busv", kind = "subobject", keyString = "pwr.bus_v", viewKey = "table", x = 2, y = 2, w = 30, h = 18, rotation = 0, z = 0 },
                        new { id = "it-cam", kind = "subobject", keyString = "cam.cupola", x = 34, y = 2, w = 22, h = 18, rotation = 0, z = 1 },
                        new { id = "it-title", kind = "text", text = "Station overview", x = 2, y = 22, w = 16, h = 3, rotation = 0, z = 2, styles = new { color = "rgb(240, 200, 90)" } },
                        new { id = "it-box", kind = "box", x = 20, y = 22, w = 10, h = 6, rotation = 0, z = 3, styles = new { backgroundColor = "rgb(20, 40, 60)" } },
                    },
                },
            }),
        Obj("fl.station", "Station flexible layout", "flexible-layout", "layouts-lab",
            ["pwr.bus_v", "pwr.array_out", "cam.cupola"],
            configuration: new
            {
                flexible = new
                {
                    rowsLayout = true,
                    containers = new object[]
                    {
                        new
                        {
                            id = "fc-top",
                            size = 60,
                            frames = new object[]
                            {
                                new { id = "ff-busv", keyString = "pwr.bus_v", size = 55 },
                                new { id = "ff-array", keyString = "pwr.array_out", size = 45, styles = new { backgroundColor = "rgb(20, 40, 60)" } },
                            },
                        },
                        new
                        {
                            id = "fc-bottom",
                            size = 40,
                            frames = new object[]
                            {
                                new { id = "ff-cam", keyString = "cam.cupola", size = 100 },
                            },
                        },
                    },
                },
            }),

        // Planning lab
        Folder("planning-lab", "Planning lab", "folder", "operations",
            "ops-strip", "ops-timelist", "ops-gantt"),
        // Unlike the e2e fixture, no telemetry row here: six hours of the
        // ~63s demo sine renders as a solid fill at strip resolution.
        Obj("ops-strip", "Ops time strip", "time-strip", "planning-lab",
            ["iss-plan", "log.activity"],
            configuration: new
            {
                independentTime = new
                {
                    enabled = true,
                    mode = "fixed",
                    bounds = new { start = 1783927800000, end = 1783949400000 },
                },
            }),
        Obj("ops-timelist", "Ops time list", "time-list", "planning-lab", ["iss-plan"]),
        Obj("ops-gantt", "Ops gantt", "gantt-chart", "planning-lab", ["iss-plan"]),
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
        string key, string name, string type, string? location, params string[] composition) =>
        Obj(key, name, type, location, composition);

    private static DomainObject Plan(string key, string name, string location)
    {
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

        return Obj(key, name, "plan", location, Array.Empty<string>(),
            configuration: new Dictionary<string, object> { ["planData"] = planData });
    }

    private static DomainObject Telemetry(
        string key, string name, string location, TelemetryMetadata telemetry) =>
        Obj(key, name, "telemetry", location, Array.Empty<string>(), telemetry: telemetry);

    /// <summary>
    /// General builder for a seeded object with an optional passthrough
    /// <paramref name="configuration"/> (serialized verbatim) and optional
    /// <paramref name="telemetry"/> metadata.
    /// </summary>
    private static DomainObject Obj(
        string key, string name, string type, string? location, string[] composition,
        object? configuration = null, TelemetryMetadata? telemetry = null)
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
            Telemetry = telemetry,
            Created = Created,
            Modified = Modified,
            CreatedBy = CreatedBy,
            Version = 1,
            Configuration = configuration is null
                ? null
                : JsonSerializer.SerializeToElement(configuration),
        };
    }
}
