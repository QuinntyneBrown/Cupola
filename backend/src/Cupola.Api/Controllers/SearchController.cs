using Cupola.Api.Contracts;
using Cupola.Core.Services;
using Microsoft.AspNetCore.Mvc;

namespace Cupola.Api.Controllers;

[ApiController]
[Route("api/search")]
public class SearchController : ControllerBase
{
    private readonly IObjectStore _store;

    public SearchController(IObjectStore store) => _store = store;

    [HttpGet]
    public ActionResult<SearchResponse> Search([FromQuery] string? q)
    {
        var result = _store.Search(q);
        return Ok(new SearchResponse(result.Objects, result.Annotations));
    }
}
