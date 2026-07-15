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
