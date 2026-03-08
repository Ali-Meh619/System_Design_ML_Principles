# 🔐 Security

> Security is not a bonus section in senior interviews. It is the layer that turns a "working" design into a production-ready design. This category focuses on the security decisions interviewers actually expect you to explain under pressure.

---

## Topics in This Category

| # | Topic | Difficulty | What You'll Learn |
|---|-------|-----------|------------------|
| 1 | [Security & Authentication](security-and-authentication.md) | 🟡 Mid | Sessions vs JWT, OAuth 2.0, API security checklist |
| 2 | [Authorization, SSO & MFA](authorization-sso-mfa.md) | 🟡 Mid | RBAC/ABAC/ReBAC, OIDC vs SAML, step-up auth |
| 3 | [Privacy & Data Compliance](privacy-and-compliance.md) | 🟡 Mid | PII handling, GDPR/CCPA, encryption strategy, residency |
| 4 | [Secrets Management & Threat Modeling](secrets-management-threat-modeling.md) | 🔴 Advanced | Secrets lifecycle, KMS/HSM, API keys, STRIDE |

---

## Why This Category Matters

In many interviews, the first 80% of the design is straightforward. The remaining 20% is where seniority shows:

- How do you authenticate users and services?
- How do you authorize access without leaking cross-tenant data?
- How do you protect secrets, signing keys, and API credentials?
- How do you explain privacy/compliance without hand-waving?
- What attack paths would you prioritize defending first?

If you can answer those clearly, your design sounds production-ready instead of academic.

---

## What To Study First

```text
General backend / product interviews:
  Security & Authentication -> Authorization, SSO & MFA

B2B / enterprise interviews:
  Authorization, SSO & MFA -> Secrets Management & Threat Modeling

Regulated / privacy-heavy systems:
  Privacy & Data Compliance -> Secrets Management & Threat Modeling
```

---

## Security Quick Map

| Interview question | Best doc to start with |
|--------------------|------------------------|
| "Sessions or JWT?" | [Security & Authentication](security-and-authentication.md) |
| "How do enterprise customers log in with Okta?" | [Authorization, SSO & MFA](authorization-sso-mfa.md) |
| "How do you prevent account takeover?" | [Authorization, SSO & MFA](authorization-sso-mfa.md) |
| "Where do API keys and DB passwords live?" | [Secrets Management & Threat Modeling](secrets-management-threat-modeling.md) |
| "What if a user asks for GDPR deletion?" | [Privacy & Data Compliance](privacy-and-compliance.md) |
| "What are the biggest attack paths here?" | [Secrets Management & Threat Modeling](secrets-management-threat-modeling.md) |

---

## Security Defaults Worth Saying Out Loud

- **TLS everywhere**, including service-to-service traffic where feasible
- **Short-lived credentials** over long-lived static secrets
- **Least privilege** for both humans and services
- **Audit logs** for auth, admin actions, and sensitive writes
- **Step-up authentication** for high-risk actions
- **Tenant-bound authorization checks** on every sensitive request

These make your answer sound much stronger even before you dive into details.

---

## Practice Questions

1. Design authentication and authorization for a banking app that supports web and mobile clients with MFA.
2. Design SSO for a B2B SaaS product whose customers use Okta, Azure AD, and Google Workspace.
3. Your platform exposes APIs to third-party developers. Design API key creation, scoping, rotation, and revocation.
4. A user requests deletion under GDPR, but their data exists in PostgreSQL, Kafka, backups, and analytics logs. Walk through the deletion strategy.
