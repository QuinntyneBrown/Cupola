using Cupola.Core.Models;
using Microsoft.AspNetCore.Mvc;

namespace Cupola.Api.Controllers;

[ApiController]
[Route("api/branding")]
public class BrandingController : ControllerBase
{
    private readonly BrandingOptions _branding;
    private readonly BuildInfo _buildInfo;

    public BrandingController(BrandingOptions branding, BuildInfo buildInfo)
    {
        _branding = branding;
        _buildInfo = buildInfo;
    }

    [HttpGet]
    public ActionResult<BrandingOptions> GetBranding() => Ok(_branding);

    [HttpGet("build-info")]
    public ActionResult<BuildInfo> GetBuildInfo() => Ok(_buildInfo);
}
