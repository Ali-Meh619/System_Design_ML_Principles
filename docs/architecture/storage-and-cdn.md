# Storage & CDN

Object storage for files and media, block storage for databases, CDNs for global delivery. Every large-scale system uses all three.

---

## The Three Storage Types

| Type | What it is | Access pattern | Examples | Use case |
|------|-----------|----------------|----------|----------|
| **Object Storage** | Files stored with flat namespace + metadata. Accessed via HTTP API. | GET/PUT per file. Not for random byte reads. | AWS S3, GCS, Azure Blob | Images, videos, backups, static website assets, ML training data |
| **Block Storage** | Raw disk blocks attached to a server. OS treats it like a local hard drive. | Random byte-level read/write. Low latency. | AWS EBS, Azure Disk | Database storage (PostgreSQL, MySQL). Anything needing random write access. |
| **File Storage (NFS)** | Shared file system mounted by multiple servers simultaneously. | Standard file operations. Multiple readers/writers. | AWS EFS, Azure Files, GCP Filestore | Shared config files, ML model weights shared across training nodes |

> **Interview rule:** Store user-uploaded photos, videos, and files in object storage (S3), never in your database. Store the S3 URL in the database. SQL databases are for structured relational data — storing BLOBs makes them slow and expensive.

---

## Object Storage Deep Dive (S3)

S3 is effectively infinite, globally durable, and provides 99.999999999% (11 nines) durability by replicating objects across multiple Availability Zones.

**Key concepts:**
- **Bucket:** Top-level namespace (like a folder). Region-scoped.
- **Key:** The full path to an object (e.g., `uploads/2024/jan/photo.jpg`).
- **Multipart Upload:** For large files (> 100MB), split into parts and upload in parallel. Allows resumable uploads.
- **Presigned URLs:** Temporary URLs generated server-side that grant read/write access to a specific object without exposing credentials. Client uploads directly to S3 — your server never handles the file bytes.
- **Lifecycle policies:** Automatically move objects to cheaper storage tiers after N days (S3 Infrequent Access, Glacier) or delete them.
- **Versioning:** Keep all versions of an object. Accidental deletes can be recovered.
- **Event notifications:** S3 can trigger Lambda, SQS, or SNS on object creation/deletion (e.g., run image processing on upload).

**Upload flow (best practice):**
```
1. Client → Your server: "I want to upload a photo"
2. Server → S3: Generate presigned URL for PUT (expires in 15 minutes)
3. Server → Client: Return presigned URL
4. Client → S3: PUT file bytes directly (skips your server)
5. S3 → SQS: "New object created" event
6. Your worker: Process image (resize, extract metadata)
```

---

## CDN (Content Delivery Network)

A CDN is a global network of edge servers placed in hundreds of cities. When a user in Tokyo requests a video on your Virginia origin server, without a CDN the request travels 11,000 km (~150ms). With a CDN, after the first user the video is cached at the Tokyo edge server and served at ~5ms.

**CDN providers:** Cloudflare (largest network, best security), AWS CloudFront (deep AWS integration), Fastly (instant cache purge, programmable), Akamai (enterprise, historical leader).

### Pull CDN (Default)
CDN fetches content from your origin on the first request, caches it at the edge for the configured TTL, serves all subsequent requests from cache.

```
Request 1:  Client → CDN Edge (miss) → Origin → CDN Edge → Client  [slow]
Request 2:  Client → CDN Edge (hit)  → Client                      [fast]
```

- **Pros:** Zero upfront configuration. Cache fills automatically as users request content.
- **Cons:** First user to request a file gets origin latency. Cache invalidation requires TTL expiry or explicit purge.
- **Best for:** Most web assets, API responses that can tolerate eventual consistency.

### Push CDN
You proactively push content to all CDN nodes before any user requests it.

- **Pros:** Zero latency on first request. Guaranteed freshness.
- **Cons:** Must manage content lifecycle yourself. Overkill for content not everyone needs.
- **Best for:** Software downloads, game patches, content you know will be globally requested simultaneously.

### Cache Invalidation
- **TTL:** Set `Cache-Control: max-age=31536000` for immutable assets (append content hash to filename: `app.abc123.js`). Use short TTLs for mutable content.
- **Explicit purge:** CDN APIs allow purging by URL or tag. Fastly can purge globally in ~150ms. CloudFront purge takes ~15 minutes.
- **Versioned URLs:** The safest approach — when content changes, the URL changes. Cache entries naturally expire; old entries are never invalidated.

### What to Put Behind a CDN
| Content | CDN? | TTL |
|---------|------|-----|
| Static assets (JS, CSS, images) | ✅ Yes | 1 year (versioned filenames) |
| User-uploaded media (photos, videos) | ✅ Yes | Long (immutable content) |
| HTML pages (with personalization) | ⚠️ With care | Short or no-cache |
| API responses | ⚠️ Read-only GET endpoints | Short (seconds–minutes) |
| Authenticated content | ❌ No | Never cache private data at edge |

---

## Interview Answer Sketch

> "User-uploaded content (photos, videos) goes directly from the client to S3 via presigned URLs — our API servers never touch the bytes. S3 triggers a processing job for video transcoding. All media is served through CloudFront CDN with a 1-year Cache-Control header since S3 URLs are immutable. API servers use EBS volumes for the database's block storage. Static frontend assets are deployed to S3 and served via CloudFront."
