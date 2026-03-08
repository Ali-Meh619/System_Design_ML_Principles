# Privacy & Data Compliance

> GDPR, CCPA, PII handling, and "Right to be Forgotten". Designing systems that respect user privacy is no longer optional — it's a hard requirement.

---

## PII (Personally Identifiable Information) Handling

Never store raw PII (email, phone, SSN) scattered across logs, analytics, or multiple databases. If you do, deleting it upon user request becomes impossible.

**The Tokenization Pattern:**

1. **PII Vault:** A dedicated, highly secured service/database that stores the mapping: `user_id` ↔ `PII` (email, phone).
2. **Tokenization:** All other services only store `user_id` (opaque UUID). They never see or store the raw email.
3. **De-tokenization:** When a service needs to send an email, it calls the PII Vault with `user_id` to get the email address just-in-time.
4. **Deletion:** When a user requests deletion (GDPR "Right to be Forgotten"), you only delete the row in the PII Vault. The `user_id` remains in logs/analytics but is now effectively anonymous because the mapping to the person is destroyed (**crypto-shredding**).

---

## Encryption Strategies

**Encryption Layers**

| Layer | Protection | Implementation |
|-------|-----------|----------------|
| **Encryption in Transit** | Protects data traveling over the network (Wi-Fi, internet). | TLS 1.3 (HTTPS) everywhere. mTLS for service-to-service. |
| **Encryption at Rest** | Protects data if physical disks are stolen. | AWS KMS / database-level encryption (TDE). Keys managed by cloud provider. |
| **Application-Level Encryption** | Protects data even if the database is compromised or admin credentials leaked. | Service encrypts sensitive fields (credit card numbers) *before* writing to DB. Only the service has the key. |

---

## GDPR Key Requirements

The General Data Protection Regulation (EU) applies to any system processing EU residents' data:

| Right | What it means | Technical implementation |
|-------|-------------|--------------------------|
| **Right of Access** | User can request all data you have about them | Data export API that queries all systems for user_id |
| **Right to Erasure** ("Right to be Forgotten") | User can request deletion of their data | Crypto-shredding via PII Vault deletion |
| **Data Portability** | User can download their data in machine-readable format | JSON/CSV export of user's data |
| **Consent** | Must have explicit consent before collecting personal data | Consent tracking database (what consented to, when) |
| **Data Minimization** | Only collect data you actually need | Don't store IP addresses if you don't need them |
| **Breach Notification** | Must notify authorities within 72 hours of a breach | Incident response plan + DPA contact list |

---

## Crypto-Shredding — The Deletion Solution

The challenge: data is everywhere — databases, backups, logs, analytics. You can't delete it all when a user requests erasure.

The solution:

```
Traditional approach (impossible to fully delete):
User data stored in:
  - PostgreSQL (user table)
  - Elasticsearch (search index)
  - S3 data lake (analytics)
  - Kafka logs (events)
  - Backup tapes (6 months retention)
→ Can't delete from all of these reliably

Crypto-shredding approach:
1. Each user's PII is encrypted with a user-specific key stored in PII Vault
2. User data stored everywhere is encrypted (unreadable without key)
3. On deletion request: DELETE FROM pii_vault WHERE user_id = 123
4. The key is gone → all encrypted data is now meaningless garbage
5. No need to find and delete every copy of data
```

---

## Data Residency & Sovereignty

Some regulations require data to stay within specific geographic boundaries:

| Regulation | Requirement | Implementation |
|-----------|------------|----------------|
| **GDPR** | EU data can be transferred to countries with "adequate protection" | Only send EU data to AWS eu-west-1, eu-central-1, etc. |
| **China PIPL** | Chinese user data must stay in China | Separate China region with separate DB |
| **HIPAA (US health)** | Healthcare data requires Business Associate Agreements | Only use HIPAA-eligible AWS services |
| **PCI DSS (payments)** | Card data handling requirements | Tokenize cards via Stripe — never touch card numbers yourself |

---

## Privacy by Design Principles

1. **Proactive, not reactive** — build privacy in from the start, don't bolt it on
2. **Privacy as default** — the default setting should be the most private option
3. **Privacy embedded into design** — not an add-on feature
4. **Full functionality** — privacy doesn't mean sacrificing features
5. **End-to-end security** — protect data at every point in the lifecycle
6. **Visibility and transparency** — users know what data you collect and why
7. **Respect for user privacy** — user-centric design

---

## Data Classification

Classify all data to apply appropriate controls:

| Classification | Examples | Controls |
|---------------|---------|---------|
| **Public** | Company blog posts, product catalog | No special controls |
| **Internal** | Employee handbook, internal metrics | Authentication required |
| **Confidential** | Customer data, business contracts | Encryption + access logging |
| **Restricted (PII/PHI)** | SSN, credit cards, health records | Encryption + strict access + audit trail |
| **Top Secret** | Encryption keys, auth credentials | Hardware security module (HSM) + multi-party access |

---

## Recommended Default

For most interview answers, a solid privacy default is:

1. Store raw PII only in a dedicated, tightly controlled service
2. Use opaque internal IDs everywhere else
3. Encrypt in transit and at rest, then add application-level encryption for the most sensitive fields
4. Design deletion and export flows from day one
5. Keep data residency explicit by region, not as an afterthought

This gives you a practical story for GDPR/CCPA without overengineering.

---

## Failure Modes

| Failure mode | What breaks | Mitigation |
|--------------|------------|-----------|
| PII duplicated across services | Deletion becomes impossible | Central PII vault + tokenization |
| Logs contain raw user data | Silent privacy leak | Logging redaction and allowlists |
| Backups ignored in deletion flow | "Deleted" data still recoverable | Crypto-shredding or backup purge policy |
| Global replication violates residency | Regulatory exposure | Region pinning + residency-aware routing |
| Consent not versioned | Cannot prove lawful basis | Consent ledger with timestamp and policy version |

---

## Metrics

- Percentage of services storing raw PII
- GDPR deletion request completion time
- Data export request completion time
- Number of log redaction violations
- Cross-region data transfer violations
- Encryption coverage by storage system

---

## Interview Answer Sketch

I would isolate raw PII in a dedicated vault service and let the rest of the platform operate on opaque user IDs. Data is encrypted in transit and at rest, with application-level encryption for the most sensitive fields. For GDPR deletion, I prefer tokenization and crypto-shredding so deleting the key or mapping makes residual copies unusable. For residency, I would pin regulated user data to approved regions and prevent accidental cross-region replication. The key failure modes are duplicated PII, unredacted logs, and incomplete deletion workflows, so I would measure deletion latency, redaction violations, and encryption coverage continuously.

---

## Interview Talking Points

- "PII is stored only in a dedicated PII Vault service. All other services only see the user_id. On GDPR deletion request, we delete from the vault — crypto-shredding makes all other copies meaningless."
- "All data is encrypted in transit (TLS 1.3) and at rest (AES-256 via AWS KMS). Application-level encryption for credit card fields — even a DB admin can't see card numbers."
- "EU user data stays in eu-west-1. We never replicate it to us-east-1. GeoDNS routes EU users to the EU region. This is required for GDPR compliance."
- "We never handle raw card numbers — Stripe tokenizes them. We store the Stripe token, not the card. This removes us from PCI DSS scope."
