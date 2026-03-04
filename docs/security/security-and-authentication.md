# Security and Authentication

## Authentication Models

- Session-based auth for server-rendered applications
- JWT for stateless API access
- OAuth 2.0/OIDC for delegated identity

## API Security Controls

- TLS everywhere
- short-lived credentials and rotation
- scoped authorization (RBAC/ABAC)
- rate limiting and abuse detection
- secret management, not hardcoded credentials

## Threat Model Basics

For each critical endpoint, define actor, asset, threat, mitigation, and detection path.

## Interview Upgrade

Explicitly separate authentication, authorization, and auditability.
