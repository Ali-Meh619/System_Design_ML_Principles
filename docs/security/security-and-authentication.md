# Security & Authentication

> Authentication (who are you?), authorization (what can you do?), and API security. These come up in virtually every system design discussion.

---

## Authentication: Sessions vs JWT

**Session-based vs JWT-based Auth**

| Aspect | Session-based | JWT (Stateless) |
|--------|-------------|----------------|
| How it works | Server stores session in Redis. Client sends session_id cookie. Server validates by looking up Redis. | Server signs a token containing user claims. Client sends token in header. Server validates signature (no DB lookup needed). |
| Scalability | Requires shared session store (Redis) accessible by all servers. | Stateless — any server can validate any token. No shared store needed. |
| Revocation | Easy — delete session from Redis immediately. | Hard — tokens are valid until expiry. Must maintain a token blocklist (defeats stateless benefit) or use short expiry (5–15 min) + refresh tokens. |
| Use when | Traditional web apps. Need immediate revocation (banking, security-sensitive). | Microservices. Mobile APIs. When statelessness is a priority. |

---

## JWT Deep Dive

A JSON Web Token has three parts separated by dots:

```
Header.Payload.Signature

Header (base64):
{
  "alg": "HS256",    // signing algorithm
  "typ": "JWT"
}

Payload (base64 — NOT encrypted, just encoded):
{
  "sub": "user_123",           // subject (user ID)
  "email": "alice@example.com",
  "roles": ["admin"],
  "iat": 1704067200,           // issued at (unix timestamp)
  "exp": 1704070800            // expires at (1 hour later)
}

Signature:
HMACSHA256(base64(header) + "." + base64(payload), secret_key)
```

**JWT security rules:**
- Never store sensitive data in the payload — it's base64-encoded, not encrypted, and can be decoded by anyone
- Use short expiry (5–15 minutes) + refresh tokens (7 days)
- Rotate signing keys periodically
- Always verify the signature AND expiry before trusting claims

---

## OAuth 2.0 — Authorization Framework

**OAuth 2.0** is the standard protocol for "log in with Google/Facebook." It allows a third-party application to access your data on a service (e.g., your Google calendar) without ever seeing your password. The key concept: instead of sharing credentials, the service issues a limited-scope **access token** to the third-party app. The app uses this token to call APIs on your behalf — but only for the specific permissions you granted.

```
OAuth 2.0 Authorization Code Flow:
1. User clicks "Login with Google" on your app
2. Your app redirects to Google's auth server with:
   client_id, redirect_uri, scope (e.g., "read:email"), state (CSRF token)
3. User authenticates with Google and grants permission
4. Google redirects back to your app with: authorization_code
5. Your server exchanges authorization_code + client_secret for:
   access_token (short-lived, e.g., 1 hour) + refresh_token (long-lived)
6. Your app uses access_token to call Google APIs on user's behalf
7. When access_token expires, use refresh_token to get a new one without re-login
```

---

## API Security Checklist

**Security Concerns for Every System Design:**

1. **HTTPS everywhere:** All traffic encrypted in transit using TLS. API Gateway handles SSL termination.
2. **Input validation:** Validate and sanitize all user inputs at API boundary. Prevents SQL injection, XSS, command injection.
3. **Authentication on every endpoint:** API Gateway validates tokens before routing to any service.
4. **Authorization (RBAC):** After authentication, check if this user's role can perform this action on this resource.
5. **Rate limiting:** Per-user and per-IP limits. Prevents brute-force attacks and API abuse.
6. **Encryption at rest:** Database encryption, S3 server-side encryption for stored files.
7. **Secrets management:** Credentials stored in a vault (AWS Secrets Manager, HashiCorp Vault), never in code or environment variables.
8. **Audit logging:** Log all authentication events, permission-sensitive operations. Immutable, tamper-evident.

---

## Authorization: RBAC vs ABAC

| Model | How it works | Best for | Example |
|-------|-------------|---------|---------|
| **RBAC (Role-Based Access Control)** | Users are assigned roles. Roles have permissions. "Admin can delete. User can only read." | Most applications — simple and understandable | GitHub: Owner, Maintainer, Contributor, Reader roles |
| **ABAC (Attribute-Based Access Control)** | Policies based on attributes of user, resource, and environment. "Allow if user.dept == resource.dept AND time is business hours" | Complex enterprises with fine-grained access rules | Healthcare: "Only treating physicians can access patient records" |
| **ReBAC (Relationship-Based AC)** | Access determined by relationship graph. "You can see a document if you're in the group that owns it." | Google Docs-style sharing, social networks | "Alice can edit because she's a member of Team Engineering" |

---

## Common Security Vulnerabilities

| Vulnerability | How it works | Prevention |
|--------------|-------------|-----------|
| **SQL Injection** | Attacker puts SQL code in a form field: `'; DROP TABLE users;--` | Parameterized queries / prepared statements. Never concatenate user input into SQL. |
| **XSS (Cross-Site Scripting)** | Attacker injects JavaScript into page content, executes in other users' browsers | Escape HTML output. Content Security Policy (CSP) header. |
| **CSRF (Cross-Site Request Forgery)** | Malicious site tricks your browser into sending authenticated requests to your bank | CSRF tokens. SameSite=Strict cookies. Check Origin/Referer headers. |
| **Path Traversal** | `GET /files/../../../etc/passwd` | Validate and sanitize file paths. Never use user input directly in file operations. |
| **SSRF (Server-Side Request Forgery)** | Attacker makes server fetch internal resources: `url=http://169.254.169.254/metadata` | Validate URLs against allowlist. Block internal IP ranges. |
| **Broken Authentication** | Weak passwords, no rate limiting on login, exposed session tokens in URLs | Rate limit login attempts. Strong password requirements. HTTPS-only cookies. |

---

## Password Hashing

Never store plaintext passwords. Never store them with reversible encryption. Always hash with a slow, salted algorithm:

| Algorithm | Status | Work Factor | Recommendation |
|-----------|--------|------------|----------------|
| MD5 / SHA1 | Broken | Fast (attacker can try billions/sec) | **Never use** |
| bcrypt | Good | Configurable (cost factor) | Use cost 12+ |
| Argon2 | Best (OWASP recommended) | Memory + time hard | Use if available |
| scrypt | Good | Memory hard | Good alternative |

```python
# Python example with bcrypt
import bcrypt

# Hash password at registration
password = "user_password".encode('utf-8')
salt = bcrypt.gensalt(rounds=12)
hashed = bcrypt.hashpw(password, salt)

# Verify at login
bcrypt.checkpw(password, hashed)  # Returns True/False
# bcrypt.checkpw is timing-safe — prevents timing attacks
```

---

## Interview Talking Points

- "Authentication: JWT tokens with 15-minute expiry + 7-day refresh tokens. The API Gateway validates the token signature — no database lookup on every request."
- "Authorization: RBAC. Admin role can CRUD everything. Regular users can only read/update their own resources. The `user_id` in the JWT is checked against the resource's `owner_id`."
- "Secrets in AWS Secrets Manager — never in environment variables or code. Services fetch secrets at startup and cache them. Automatic rotation enabled."
- "For the payment API: every endpoint requires authentication. Rate limited to 10 payment attempts per user per hour. All requests logged to an immutable audit trail in S3."
