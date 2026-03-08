# Secrets Management & Threat Modeling

> Most real-world breaches are not caused by exotic cryptography failures. They come from leaked credentials, weak key handling, overly broad permissions, and unmodeled attack paths.

---

## Why This Topic Matters

Interviewers increasingly ask:

- Where do API keys and DB passwords live?
- How do you rotate credentials without downtime?
- How do you protect signing keys?
- What are the top attack paths in this design?

This is where "secure by design" becomes concrete.

---

## What Counts as a Secret

| Secret type | Example | Why sensitive |
|-------------|---------|---------------|
| **Service credentials** | DB passwords, Redis auth, SaaS tokens | Direct access to infrastructure |
| **Signing keys** | JWT signing key, webhook HMAC secret | Lets attacker impersonate your system |
| **API keys** | Partner keys, internal service keys | Can be abused for quota theft or data access |
| **Encryption keys** | KMS data keys, field-level encryption keys | Protect data at rest and in transit |
| **Human break-glass creds** | Emergency admin credentials | Bypass normal controls |

Rule: if compromise changes trust boundaries, treat it like a top-tier secret.

---

## Recommended Secret Storage Pattern

Never keep secrets in source code or long-lived plaintext config files.

```text
Developer / CI
  -> inject secret reference only

App starts
  -> authenticate with workload identity / IAM role
  -> fetch secret from Vault / AWS Secrets Manager / GCP Secret Manager
  -> cache in memory for short TTL
  -> rotate transparently when refreshed
```

### Good defaults

- Cloud-native stack: **AWS Secrets Manager + IAM roles + KMS**
- Hybrid / self-hosted: **HashiCorp Vault**
- Signing keys with strict control: **KMS / HSM-backed key operations**

---

## Envelope Encryption

This is the standard pattern for protecting sensitive data at scale:

```text
plaintext
  -> encrypt with data encryption key (DEK)
  -> DEK encrypted with key encryption key (KEK) in KMS
  -> store ciphertext + encrypted DEK
```

### Why it matters

- Fast encryption on app side
- Centralized control of master keys in KMS
- Easy key rotation and auditability

Use this for highly sensitive fields such as SSNs, bank account numbers, and private API credentials.

---

## API Key Architecture

If your system exposes APIs to partners or internal teams, design keys like a product:

| Concern | Good design |
|---------|-------------|
| **Generation** | Create high-entropy random keys; show full value once |
| **Storage** | Store only hashed key prefix + metadata; never plaintext after creation |
| **Scoping** | Attach org, environment, permissions, and rate limit tier |
| **Rotation** | Allow overlapping old/new keys during migration window |
| **Revocation** | Instant disable via metadata store / cache |
| **Observability** | Track request volume, errors, abuse, and last-used timestamp |

### Key format

- Public identifier / prefix for observability
- Secret value for authentication
- Optional environment marker such as `prod_` or `test_`

This is better than one opaque string with no metadata.

---

## Threat Modeling: Start With Assets and Attack Paths

A simple interview-ready approach is:

1. **List assets**: user data, money movement, admin controls, secrets, models, internal tools
2. **List entry points**: public APIs, admin panel, webhooks, file upload, third-party integrations
3. **List trust boundaries**: internet -> edge, edge -> app, app -> DB, app -> external providers
4. **Enumerate threats** using STRIDE:

| STRIDE | Example question |
|--------|------------------|
| **Spoofing** | Can attacker pretend to be another user/service? |
| **Tampering** | Can requests or events be modified? |
| **Repudiation** | Can attacker deny having performed an action? |
| **Information Disclosure** | Can private data leak across tenants? |
| **Denial of Service** | Can attacker exhaust CPU, memory, queue capacity, or quota? |
| **Elevation of Privilege** | Can a viewer become admin? |

---

## Recommended Default Security Posture

For most interview systems:

1. **Secrets** in Vault / Secrets Manager, fetched via workload identity
2. **Signing keys** in KMS/HSM-backed services, not raw env vars
3. **API keys** hashed at rest, scoped, rate-limited, and instantly revocable
4. **Threat modeling** focused on the most valuable assets first:
   - auth flows
   - money movement
   - cross-tenant data access
   - admin operations
   - external callback ingestion (webhooks)

This is realistic, interview-ready, and defensible.

---

## Failure Modes

| Failure mode | Impact | Mitigation |
|--------------|--------|-----------|
| Secret leaked in logs | Full compromise of downstream system | Redaction, secret scanners, structured logging rules |
| Shared static credential across services | Blast radius too large | Per-service identity, least privilege, rotation |
| No key rotation plan | Long-lived compromise | Dual-key rotation windows, automation, expiry alerts |
| Plaintext API keys stored in DB | Insider or DB leak exposes all clients | Hash keys at rest, show once at creation |
| Unmodeled webhook abuse | Attacker triggers internal actions | Signed payloads, timestamp checks, replay protection |
| Missing audit trail | Incident investigation impossible | Immutable audit logs for key creation, rotation, revocation |

---

## Metrics

- Secret rotation success rate
- Time since last rotation by secret class
- Percentage of workloads using workload identity instead of static creds
- Number of plaintext secret exposures caught by CI scanners
- API key revocation latency
- Unauthorized request rate
- Security incident mean time to detect

---

## Interview Answer Sketch

I would store all service credentials in Secrets Manager or Vault and let workloads fetch them using IAM-based identity rather than baking secrets into config. Sensitive signing and encryption keys should stay in KMS or HSM-backed services so applications do not handle raw key material more than necessary. For partner APIs, I would issue scoped API keys, store only hashed keys at rest, support zero-downtime rotation, and make revocation immediate. For threat modeling, I would start with the highest-value assets such as user data, admin actions, and payment flows, then walk the major entry points and trust boundaries using STRIDE to identify spoofing, data leakage, denial-of-service, and privilege-escalation risks.

---

## Practice Questions

1. Design API key creation, rotation, and revocation for a developer platform.
2. How would you protect JWT signing keys used by dozens of services?
3. What are the top threats for a webhook ingestion system?
4. How would you rotate database credentials without taking the service down?
