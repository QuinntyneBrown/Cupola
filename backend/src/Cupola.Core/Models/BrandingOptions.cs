namespace Cupola.Core.Models;

/// <summary>
/// Branding settings bound from the "Branding" configuration section.
/// </summary>
public class BrandingOptions
{
    public string AppTitle { get; set; } = string.Empty;
    public string Tagline { get; set; } = string.Empty;
    public string SmallLogoImage { get; set; } = string.Empty;
    public string AboutHtml { get; set; } = string.Empty;
    public string LicenseUrl { get; set; } = string.Empty;
}
