# Authorization, SSO & MFA

> Authentication proves identity. Authorization decides what that identity can do. SSO and MFA are the control layers that make enterprise and high-risk systems secure in practice.

---

## Why This Topic Matters

Many interview answers stop at "use JWT" or "put auth at the gateway." That is incomplete. Senior-level interviews often probe:

- How permissions are modeled
- How enterprise login works across multiple products
- How you reduce account takeover risk
- How you revoke access safely without breaking users

This doc covers the operational design choices behind those answers.

---

## Authorization Models

| Model | How it works | Best for | Weakness |
|-------|--------------|----------|----------|
| **RBAC** | Users get roles; roles map to permissions | Admin panels, B2B SaaS, internal tools | Becomes messy with many exceptions |
| **ABAC** | Policies evaluate user, resource, and environment attributes | Enterprises, compliance-heavy systems | Harder to debug and explain |
| **ReBAC** | Access depends on graph relationships | Google Docs, GitHub repos, social products | Requires relationship graph lookups |

### Rule of thumb

- Start with **RBAC** for coarse product permissions
- Add **resource ownership checks** for "can edit your own object"
- Use **ABAC/ReBAC** only where the product actually needs them

---

## SSO Architecture: OIDC vs SAML

Single Sign-On means one identity provider (IdP) authenticates the user and many applications trust that identity.

| Protocol | Common use case | Strength |
|----------|-----------------|----------|
| **OIDC / OAuth 2.0** | Modern web/mobile apps, APIs | Simpler developer experience, JSON/REST friendly |
| **SAML 2.0** | Enterprise SaaS, legacy corporate IdPs | Deep enterprise adoption, mature federation |

### OIDC login flow

```text
User -> App -> Identity Provider
                -> login + MFA
                -> authorization code
App backend -> exchange code for tokens
            -> create app session / validate ID token
```

### Recommended default

- **OIDC Authorization Code + PKCE** for modern apps
- **SAML** only when enterprise customers require it
- Keep **your own app session** even when using SSO; do not make every request depend on the IdP

---

## MFA: How to Add a Second Factor

| Method | Security | UX | Notes |
|--------|----------|----|------|
| **SMS OTP** | Weakest | Easy | Vulnerable to SIM swap; use as fallback only |
| **TOTP app** | Good | Good | Authenticator apps; standard default |
| **Push approval** | Good | Very good | Great UX, but watch for push fatigue |
| **WebAuthn / Passkeys** | Best | Excellent | Phishing-resistant; ideal long-term default |

### Recommended default

- Consumer product: password/passkey + optional TOTP or passkey
- Enterprise admin surfaces: require MFA, prefer passkeys or TOTP
- High-risk actions: step-up auth for password reset, payout changes, deleting data, changing MFA settings

---

## Permission Enforcement Pattern

Do not trust only the UI to hide buttons. Enforce authorization on the server:

```text
Request arrives
  -> authenticate principal
  -> load resource metadata
  -> evaluate policy:
       role check
       ownership / tenant check
       optional environment checks
  -> allow or deny
  -> audit log decision
```

### Good policy design

- Keep coarse permissions in tokens or sessions
- Fetch fine-grained permissions from policy service or DB
- Make policies explicit and testable
- Always include tenant/org boundaries in multi-tenant systems

---

## Recommended Default Architecture

For most SaaS / platform interviews:

1. **AuthN**: OIDC Authorization Code + PKCE
2. **Session model**: short-lived access token or server session, longer refresh token
3. **AuthZ model**: RBAC + ownership checks; add ReBAC only if sharing/collaboration is core
4. **MFA**: required for admins and step-up for sensitive actions
5. **Audit**: every login, role change, org membership change, and denial logged immutably

This is a strong, interview-safe default because it is secure without being unnecessarily complex.

---

## Failure Modes

| Failure mode | What breaks | Mitigation |
|--------------|------------|-----------|
| Over-privileged roles | Users can do too much | Least privilege, permission reviews, explicit scopes |
| Missing tenant checks | Cross-tenant data leak | Always check `tenant_id` in policy evaluation |
| Token contains stale roles | User keeps access after removal | Short TTL + token refresh + server-side revocation for critical roles |
| MFA reset abuse | Attacker bypasses second factor | Strong recovery workflow, cooldowns, manual review for high-risk cases |
| SSO outage blocks login | Users cannot access app | Session grace periods, break-glass admin path, IdP failover planning |

---

## Metrics

Track security and UX together:

- Login success rate
- MFA challenge success rate
- MFA enrollment rate
- Permission-denied rate by endpoint
- Role/permission change audit volume
- Account takeover incidents
- Mean time to revoke access after role removal

---

## Interview Answer Sketch

For enterprise SaaS, I would use OIDC Authorization Code + PKCE with the customer's IdP, keep my own short-lived app session, and enforce authorization server-side using RBAC plus tenant and ownership checks. MFA is required for admins and for high-risk actions. I would log all logins, role changes, and permission denials to an immutable audit trail. The main failure modes are stale permissions, cross-tenant leaks, and weak account recovery, so I would keep tokens short-lived, validate tenant boundaries on every sensitive request, and make MFA reset flows much stricter than normal login.

---

## Practice Questions

1. Design authorization for a B2B SaaS product with org admins, managers, and viewers.
2. Design SSO for enterprise customers who want "Log in with Okta."
3. How would you add MFA to a banking app without making every action painful?
4. In a collaborative docs product, when do you need ReBAC instead of RBAC?
