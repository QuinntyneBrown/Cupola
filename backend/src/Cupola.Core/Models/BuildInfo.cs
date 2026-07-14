namespace Cupola.Core.Models;

/// <summary>
/// Build metadata bound from the "BuildInfo" configuration section.
/// </summary>
public class BuildInfo
{
    public string Version { get; set; } = string.Empty;
    public string BuildDate { get; set; } = string.Empty;
    public string Revision { get; set; } = string.Empty;
    public string Branch { get; set; } = string.Empty;
}
