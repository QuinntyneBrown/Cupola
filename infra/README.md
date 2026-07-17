# Infrastructure

Infrastructure-as-code for hosting Cupola artifacts on Azure.

## `design-system.bicep` — design-system docs site

Publishes the static design-system mocks (`docs/mocks/design-system/`) to an
**Azure Static Web App** (Free tier: HTTPS + global CDN, no cost).

- **Provisioning** is this Bicep template — it creates an empty
  "bring-your-own-CI" Static Web App.
- **Deployment** is the GitHub Actions workflow
  [`.github/workflows/deploy-design-system.yml`](../.github/workflows/deploy-design-system.yml),
  which uploads the folder as-is on every push to `main` that touches
  `docs/mocks/design-system/**`. No build step runs (the site is plain
  HTML/CSS/JS).
- **Runtime config** for the site lives beside the content at
  `docs/mocks/design-system/staticwebapp.config.json` (disables SPA fallback so
  the multi-page site returns real 404s).

### One-time setup

Requires the [Azure CLI](https://learn.microsoft.com/cli/azure/) and the
[GitHub CLI](https://cli.github.com/), both authenticated. Run from the repo
root. PowerShell:

```powershell
az login
$rg  = 'cupola-design-system-rg'
$loc = 'eastus2'

# 1. Resource group
az group create --name $rg --location $loc

# 2. Create the Static Web App
az deployment group create `
  --resource-group $rg `
  --template-file infra/design-system.bicep `
  --parameters name=cupola-design-system location=$loc

# 3. Copy the deploy token into the GitHub secret the workflow reads
$token = az staticwebapp secrets list --name cupola-design-system `
  --query "properties.apiKey" -o tsv
gh secret set AZURE_STATIC_WEB_APPS_API_TOKEN --body $token --repo QuinntyneBrown/Cupola
```

Bash equivalent:

```bash
az login
rg=cupola-design-system-rg
loc=eastus2

az group create --name "$rg" --location "$loc"

az deployment group create \
  --resource-group "$rg" \
  --template-file infra/design-system.bicep \
  --parameters name=cupola-design-system location="$loc"

token=$(az staticwebapp secrets list --name cupola-design-system \
  --query "properties.apiKey" -o tsv)
gh secret set AZURE_STATIC_WEB_APPS_API_TOKEN --body "$token" --repo QuinntyneBrown/Cupola
```

### First deploy

Once the `AZURE_STATIC_WEB_APPS_API_TOKEN` secret exists, trigger the workflow:

- push any change under `docs/mocks/design-system/` to `main`, **or**
- run it manually: GitHub → **Actions → Deploy design-system to Azure Static
  Web Apps → Run workflow**.

Subsequent changes to the folder redeploy automatically.

### Find the live URL

```powershell
az staticwebapp show --name cupola-design-system `
  --query defaultHostname -o tsv
```

The site is served at `https://<defaultHostname>/`.

### Verify

```bash
curl -I https://<host>/                          # 200, content-type: text/html
curl -I https://<host>/foundations/color.html    # 200 (subpages + relative links)
curl -I https://<host>/does-not-exist            # 404 (no SPA fallback)
```

### Local preview (optional)

```bash
npx @azure/static-web-apps-cli start docs/mocks/design-system
# browse http://localhost:4280
```

### Teardown

```powershell
az group delete --name cupola-design-system-rg --yes --no-wait
```

## `app.bicep` — Cupola application

Publishes the whole product — the marketing site at `/`, the Angular console at
`/app/`, and the .NET 8 API + SignalR hub at `/api` and `/hubs/realtime` — to a
single **Azure App Service** (Linux, Free F1 tier). See
[ADR 0005](../docs/adr/0005-single-app-service-deployment.md) for the single-origin
rationale.

- **Provisioning** is this Bicep template — it creates the App Service plan and
  the site (`healthCheckPath` `/health`, WebSockets on for SignalR).
- **Deployment** is the GitHub Actions workflow
  [`.github/workflows/deploy-app.yml`](../.github/workflows/deploy-app.yml),
  which tests the backend and frontend, builds the console with
  `--base-href /app/`, assembles the marketing folder and the Angular build into
  the API's `wwwroot`, and pushes the publish folder over OIDC. The workflow is
  gated on the repository variable `AZURE_WEBAPP_NAME`: until it is set, the
  workflow is a no-op.

### One-time setup

Requires the [Azure CLI](https://learn.microsoft.com/cli/azure/) and the
[GitHub CLI](https://cli.github.com/), both authenticated. Run from the repo
root. PowerShell:

```powershell
az login
$rg   = 'cupola-rg'
$loc  = 'canadacentral'  # Linux Free quota is regional; eastus2 has none on this subscription
$app  = 'cupola-app'   # globally unique; if taken, use cupola-app-<suffix>
$repo = 'QuinntyneBrown/Cupola'

# 1. Resource group
az group create --name $rg --location $loc

# 2. Create the App Service (plan + site)
az deployment group create `
  --resource-group $rg `
  --template-file infra/app.bicep `
  --parameters name=$app location=$loc

# 3. Register an app for GitHub OIDC deploys and give it a service principal
$appId = az ad app create --display-name cupola-github-deploy --query appId -o tsv
az ad sp create --id $appId

# 4. Trust GitHub Actions on main (federated credential — no client secret)
@"
{
  "name": "cupola-main",
  "issuer": "https://token.actions.githubusercontent.com",
  "subject": "repo:$repo:ref:refs/heads/main",
  "audiences": ["api://AzureADTokenExchange"]
}
"@ | Out-File -Encoding utf8 federated-credential.json
az ad app federated-credential create --id $appId --parameters federated-credential.json
Remove-Item federated-credential.json

# 5. Let the identity deploy into (only) this resource group
$sub   = az account show --query id -o tsv
$scope = "/subscriptions/$sub/resourceGroups/$rg"
az role assignment create --assignee $appId --role "Website Contributor" --scope $scope

# 6. Wire the workflow: three OIDC secrets + the gating variables
$tenant = az account show --query tenantId -o tsv
gh secret   set AZURE_CLIENT_ID       --body $appId  --repo $repo
gh secret   set AZURE_TENANT_ID       --body $tenant --repo $repo
gh secret   set AZURE_SUBSCRIPTION_ID --body $sub    --repo $repo
gh variable set AZURE_WEBAPP_NAME     --body $app    --repo $repo
```

Bash equivalent:

```bash
az login
rg=cupola-rg
loc=canadacentral    # Linux Free quota is regional; eastus2 has none on this subscription
app=cupola-app       # globally unique; if taken, use cupola-app-<suffix>
repo=QuinntyneBrown/Cupola

az group create --name "$rg" --location "$loc"

az deployment group create \
  --resource-group "$rg" \
  --template-file infra/app.bicep \
  --parameters name="$app" location="$loc"

appId=$(az ad app create --display-name cupola-github-deploy --query appId -o tsv)
az ad sp create --id "$appId"

cat > federated-credential.json <<EOF
{
  "name": "cupola-main",
  "issuer": "https://token.actions.githubusercontent.com",
  "subject": "repo:$repo:ref:refs/heads/main",
  "audiences": ["api://AzureADTokenExchange"]
}
EOF
az ad app federated-credential create --id "$appId" --parameters federated-credential.json
rm federated-credential.json

sub=$(az account show --query id -o tsv)
scope="/subscriptions/$sub/resourceGroups/$rg"
az role assignment create --assignee "$appId" --role "Website Contributor" --scope "$scope"

tenant=$(az account show --query tenantId -o tsv)
gh secret   set AZURE_CLIENT_ID       --body "$appId"  --repo "$repo"
gh secret   set AZURE_TENANT_ID       --body "$tenant" --repo "$repo"
gh secret   set AZURE_SUBSCRIPTION_ID --body "$sub"    --repo "$repo"
gh variable set AZURE_WEBAPP_NAME     --body "$app"    --repo "$repo"
```

> The site name only lives in the `AZURE_WEBAPP_NAME` variable — nothing
> downstream hardcodes it. If `cupola-app` is globally taken, deploy with a
> suffixed `name` (e.g. `cupola-app-7f3a`) and set the variable to match; the
> workflow reads it and the deploy action reports the live URL. Update the
> hardcoded canonical/OG URLs in `marketing/index.html` to the same host.

> Older Azure CLI builds lack `az ad app federated-credential`. Equivalent
> fallback (same JSON body; `$objId` is the application **object** id from
> `az ad app show --id $appId --query id -o tsv`):
>
> ```powershell
> az rest --method POST `
>   --uri "https://graph.microsoft.com/v1.0/applications/$objId/federatedIdentityCredentials" `
>   --headers "Content-Type=application/json" --body '@federated-credential.json'
> ```

### First deploy

Once `AZURE_WEBAPP_NAME` is set, trigger the workflow:

- push any change under `backend/`, `frontend/`, `marketing/`, or `infra/app.bicep`
  to `main`, **or**
- run it manually: GitHub → **Actions → Deploy app to Azure App Service → Run
  workflow**.

The `deploy` job resolves the site's hostname and the `smoke` job asserts each
surface answers before the run is considered green.

### Find the live URL

```powershell
az webapp show --resource-group cupola-rg --name cupola-app `
  --query defaultHostName -o tsv
```

The product is served at `https://<defaultHostName>/`.

### Verify

The Free F1 tier cold-starts after idle, so the first request can take ~10–30s;
retry once if it stalls.

```bash
curl -I https://<host>/health          # 200 once warm
curl -s  https://<host>/               # marketing site (contains cupola-marketing)
curl -sI https://<host>/app/           # 200, the Angular console shell
curl -s  https://<host>/api/branding   # JSON branding payload
```

### Teardown

```powershell
az group delete --name cupola-rg --yes --no-wait
```
