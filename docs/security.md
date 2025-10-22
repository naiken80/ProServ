# Security Baseline

This project targets enterprise-grade security from the first sprint. The following controls are required for every deliverable:

## Dependency Hygiene
- All packages managed via pnpm and pinned through lockfiles.
- Weekly `pnpm audit --audit-level=moderate` checks and automated PRs (Renovate/Dependabot) to keep versions current.
- High and critical advisories must be remediated before release.

## Secrets Management
- Local development relies on `.env.local` files never committed to source control.
- Production secrets are stored in a managed vault (AWS KMS or Hashicorp Vault) and injected at runtime.
- CI pipelines use OIDC workload identities; no long-lived static credentials.

## Authentication & Authorization
- OIDC/SAML SSO integration with enforced MFA.
- Role-based access control (RBAC) with field-level filtering for sensitive data.
- Session management via stateless JWT with short TTL and refresh tokens stored in HttpOnly cookies.

## Data Protection
- Tenant data is logically isolated; every request resolves tenancy from auth claims.
- PostgreSQL + Redis protected with TLS in transit, encrypted volumes at rest.
- Object storage (S3/MinIO) uses server-side encryption keys rotated quarterly.
- Audit trail persisted to WORM storage with immutability guarantees.

## Secure Development Lifecycle
- Static analysis (CodeQL/Semgrep) and dependency scanning (Trivy/Grype) included in CI.
- Pull requests require security checklist review and threat model updates for new features.
- Unit, integration, and e2e test suites run on every merge; coverage targets reviewed quarterly.

## Incident Response & Monitoring
- Structured logging with PII redaction and trace correlation IDs.
- Centralized metrics and alerting (OpenTelemetry collectors feeding Grafana/Loki/Tempo stack).
- Runbooks must document escalation paths, containment steps, and communication templates.
