# Security policy

## Reporting a vulnerability

Please do not report security vulnerabilities in public issues.

Use GitHub Security Advisories for this repository to submit a private vulnerability report. Include:

- A clear description of the issue
- Steps to reproduce
- Affected paths, versions, or commits
- Potential impact
- Suggested mitigation (if available)

Maintainers will review and triage reports as quickly as possible and coordinate remediation and disclosure with the reporter when appropriate.

## Supported versions

Security fixes are prioritized for the latest `main` branch state. Historical branches and forks may not receive coordinated patches.

## Security hygiene

- Never commit secrets, credentials, or tokens.
- Use least-privilege credentials and short-lived tokens in development and CI.
- Keep dependencies current and remove unused packages.
