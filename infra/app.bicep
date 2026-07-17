// ---------------------------------------------------------------------------
// Cupola app — Azure App Service (Linux, Free F1 tier)
//
// Provisions a single Linux App Service that serves the whole product from one
// origin: the marketing site at `/`, the Angular console at `/app/`, and the
// .NET 8 API + SignalR hub at `/api` and `/hubs/realtime`. The published
// artifact (API host + assembled wwwroot) is uploaded by the GitHub Actions
// workflow (.github/workflows/deploy-app.yml); no build runs on the server
// (SCM_DO_BUILD_DURING_DEPLOYMENT is off).
//
// Deploy:
//   az group create --name cupola-rg --location eastus2
//   az deployment group create \
//     --resource-group cupola-rg \
//     --template-file infra/app.bicep \
//     --parameters name=cupola-app location=eastus2
// ---------------------------------------------------------------------------

@description('App Service name (also used to derive the default hostname and the plan name). Must be globally unique; use a suffixed fallback such as cupola-app-<suffix> if cupola-app is taken.')
param name string = 'cupola-app'

@description('Azure region for the plan and site.')
param location string = 'eastus2'

resource plan 'Microsoft.Web/serverfarms@2023-12-01' = {
  name: '${name}-plan'
  location: location
  kind: 'linux'
  sku: {
    name: 'F1'
    tier: 'Free'
  }
  properties: {
    // Linux plans must be marked reserved.
    reserved: true
  }
}

resource site 'Microsoft.Web/sites@2023-12-01' = {
  name: name
  location: location
  properties: {
    serverFarmId: plan.id
    httpsOnly: true
    siteConfig: {
      linuxFxVersion: 'DOTNETCORE|8.0'
      // SignalR uses WebSockets when available (F1 caps concurrent sockets;
      // the client falls back to SSE/long-polling past that).
      webSocketsEnabled: true
      http20Enabled: true
      // alwaysOn is unavailable on F1; the app cold-starts after idle.
      alwaysOn: false
      ftpsState: 'Disabled'
      minTlsVersion: '1.2'
      healthCheckPath: '/health'
      appSettings: [
        {
          // Artifact is pre-built by CI; do not run Oryx build on deploy.
          name: 'SCM_DO_BUILD_DURING_DEPLOYMENT'
          value: 'false'
        }
      ]
    }
  }
}

output defaultHostname string = site.properties.defaultHostName
output name string = site.name
