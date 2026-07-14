using Cupola.Api.Contracts;
using Cupola.Api.Hubs;
using Cupola.Core.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;

namespace Cupola.Api.Controllers;

[ApiController]
[Route("api/objects")]
public class ObjectsController : ControllerBase
{
    private readonly IObjectStore _store;
    private readonly IHubContext<RealtimeHub> _hub;

    public ObjectsController(IObjectStore store, IHubContext<RealtimeHub> hub)
    {
        _store = store;
        _hub = hub;
    }

    [HttpGet("{keyString}")]
    public IActionResult GetByKeyString(string keyString)
    {
        var domainObject = _store.GetByKeyString(keyString);
        return domainObject is null ? NotFound() : Ok(domainObject);
    }

    [HttpGet("{keyString}/composition")]
    public IActionResult GetComposition(string keyString)
    {
        var children = _store.GetComposition(keyString);
        return children is null ? NotFound() : Ok(children);
    }

    [HttpGet("{keyString}/annotations")]
    public IActionResult GetAnnotations(string keyString)
    {
        var annotations = _store.GetAnnotationsFor(keyString);
        return annotations is null ? NotFound() : Ok(annotations);
    }

    [HttpPut("{keyString}")]
    public async Task<IActionResult> UpdateName(string keyString, [FromBody] UpdateObjectRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
        {
            return BadRequest();
        }

        var updated = _store.UpdateName(keyString, request.Name.Trim());
        if (updated is null)
        {
            return NotFound();
        }

        await _hub.Clients.Group(RealtimeHub.ObjectGroup(keyString))
            .SendAsync("ObjectUpdated", updated);

        return Ok(updated);
    }
}
