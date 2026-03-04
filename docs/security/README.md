# 🔐 Security

> Security questions come up in every senior-level interview and most staff-level designs. Authentication architecture, authorization models, encryption strategy, and compliance — these are expected knowledge, not bonus points.

---

## Topics in This Category

| # | Topic | Difficulty | What You'll Learn |
|---|-------|-----------|------------------|
| 1 | [Security & Authentication](security-and-authentication.md) | 🟡 Mid | Sessions vs JWT, OAuth 2.0, API security checklist |
| 2 | [Privacy & Data Compliance](privacy-and-compliance.md) | 🟡 Mid | PII handling, GDPR, encryption strategies |

---

## Authentication vs Authorization

These are often confused. Get them right in interviews:

| Concept | Question it answers | Example |
|---------|-------------------|---------|
| **Authentication (AuthN)** | Who are you? | Login with username + password |
| **Authorization (AuthZ)** | What can you do? | User can read but not delete |

---

## Session vs JWT: Decision Guide

| | Sessions | JWT |
|--|---------|-----|
| **State** | Server-side (stateful) | Client-side (stateless) |
| **Storage** | Redis / DB session store | Client holds the token |
| **Revocation** | Instant (delete from store) | Hard (must blacklist or short TTL) |
| **Scale** | Needs sticky sessions or shared store | Scales easily (no shared state) |
| **Size** | Small session ID | Larger token payload |
| **Best for** | Web apps, admin panels | APIs, microservices |

**JWT security rules:**
1. Short access token TTL (15 minutes)
2. Longer refresh token TTL (7–30 days), stored as HttpOnly cookie
3. Always use HTTPS (tokens in transit must be encrypted)
4. Never store JWTs in `localStorage` (XSS vulnerable) — use `HttpOnly` cookie

---

## OAuth 2.0 Flows

| Flow | Use case | Security level |
|------|---------|---------------|
| **Authorization Code + PKCE** | Web apps, mobile apps | ✅ Highest — recommended |
| **Client Credentials** | Server-to-server (no user) | ✅ High |
| **Device Code** | Smart TV, CLI tools | ✅ Good |
| ~~Implicit~~ | ~~Browser apps~~ | ❌ Deprecated |
| ~~Password~~ | ~~Legacy~~ | ❌ Never use |

**Authorization Code Flow:**
```
User → [Your App] → "Sign in with Google"
→ [Google Auth Server] → User logs in
→ Redirect to your app with auth code
→ [Your backend] exchanges code for tokens (server-side, never exposed)
→ Access token (short-lived) + Refresh token (long-lived)
```

---

## API Security Checklist

Copy this into every design:

- [ ] **TLS everywhere** — HTTPS with TLS 1.2+ minimum, 1.3 preferred
- [ ] **Authentication** — Every endpoint requires auth (except public ones)
- [ ] **Rate limiting** — Per user, per IP, per endpoint
- [ ] **Input validation** — Whitelist, not blacklist; validate at API boundary
- [ ] **RBAC/ABAC** — Principle of least privilege for all service accounts
- [ ] **Secrets management** — Never in code; use AWS Secrets Manager / Vault
- [ ] **Audit logging** — Log all authenticated actions with user_id + timestamp
- [ ] **CORS** — Restrict to known origins
- [ ] **SQL injection prevention** — Parameterized queries only
- [ ] **SSRF protection** — Validate and restrict outbound URLs

---

## Encryption Strategy

| Data State | Encryption Method |
|-----------|------------------|
| **In transit** | TLS 1.2/1.3 (HTTPS, TLS for DB connections) |
| **At rest (disk)** | AES-256 encryption (AWS S3 SSE, EBS encryption) |
| **At rest (field-level)** | Application-level encryption for PII columns |
| **Passwords** | bcrypt / Argon2 (NEVER MD5, SHA1) |
| **PII masking** | Tokenization (replace with reference token) |

---

## GDPR/CCPA Key Requirements

| Requirement | What it means technically |
|-------------|--------------------------|
| **Right to erasure** | Must delete all user data within 30 days of request |
| **Data portability** | Must export all user data in machine-readable format |
| **Consent** | Must record explicit consent with timestamp |
| **Data minimization** | Only collect data you actually need |
| **Breach notification** | Must notify within 72 hours (GDPR) |

**Right to erasure architecture:**
```
user_id: u123 appears in:
  - users table → DELETE row
  - posts table → Anonymize author_id
  - logs/analytics → Remove or anonymize
  - backups → Schedule purge on rotation
  - 3rd-party services → Delete via their APIs
```

---

## Practice Questions

1. Design the authentication system for a banking app. The app needs both mobile (React Native) and web (React) clients. Requirements: MFA, session management, automatic logout after 15 minutes of inactivity.

2. Your API is accessed by 3rd-party developers. Design the API key management system: key creation, rotation, scoping, and revocation.

3. A user requests erasure under GDPR. Their data exists in: PostgreSQL, a Redis cache, Elasticsearch, Kafka event log, and S3 backups. Describe the deletion process for each.

4. What's the difference between symmetric and asymmetric encryption? When would you use each in a distributed system?
