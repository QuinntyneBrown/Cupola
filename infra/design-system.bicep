// ---------------------------------------------------------------------------
// Cupola design-system — Azure Static Web App (Free tier)
//
// Provisions an empty "bring-your-own-CI" Static Web App. Content is uploaded
// by the GitHub Actions workflow (.github/workflows/deploy-design-system.yml)
// using the app's deploy token, so no GitHub PAT is wired into the resource.
//
// Deploy:
//   az group create --name cupola-design-system-rg --location eastus2
//   az deployment group create \
//     --resource-group cupola-design-system-rg \
//     --template-file infra/design-system.bicep \
//     --parameters name=cupola-design-system location=eastus2
// ---------------------------------------------------------------------------

@description('Static Web App name (also used to derive the default hostname).')
param name string = 'cupola-design-system'

@description('SWA region. Static Web Apps are only offered in these regions.')
@allowed([
  'westus2'
  'centralus'
  'eastus2'
  'westeurope'
  'eastasia'
])
param location string = 'eastus2'

resource swa 'Microsoft.Web/staticSites@2023-12-01' = {
  name: name
  location: location
  sku: {
    name: 'Free'
    tier: 'Free'
  }
  properties: {
    // Honor the staticwebapp.config.json shipped with the site content.
    allowConfigFileUpdates: true
    stagingEnvironmentPolicy: 'Enabled'
  }
}

output defaultHostname string = swa.properties.defaultHostname
output name string = swa.name
