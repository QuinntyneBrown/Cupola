using Cupola.Core.Services;
using Microsoft.AspNetCore.Mvc;

namespace Cupola.Api.Controllers;

/// <summary>
/// Historical telemetry (B06, resolves open contract #6):
/// GET /api/telemetry/{keyString}?start=&amp;end= returns bounded sine samples.
/// </summary>
[ApiController]
[Route("api/telemetry")]
public class TelemetryController : ControllerBase
{
    private readonly IObjectStore _store;

    public TelemetryController(IObjectStore store)
    {
        _store = store;
    }

    /// <summary>
    /// Bounded historical samples for a telemetry object (OMCT-C06-L2-04.01);
    /// image-hinted sources return image frames (wave-5 B06 extension, OMCT-C11-L2-01.02).
    /// </summary>
    [HttpGet("{keyString}")]
    public IActionResult GetHistory(string keyString, [FromQuery] long start, [FromQuery] long end)
    {
        var domainObject = _store.GetByKeyString(keyString);
        if (domainObject is null || domainObject.Type != "telemetry")
        {
            return NotFound();
        }

        var isImage = domainObject.Telemetry?.Hints.Contains("image") == true;
        return Ok(isImage
            ? ImageTelemetry.Range(keyString, start, end)
            : SineTelemetry.Range(keyString, start, end));
    }
}
