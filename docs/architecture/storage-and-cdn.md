# Storage & CDN

> Object storage for files and media, block storage for databases, CDNs for global delivery. Every large-scale system uses all three.

---

## The Three Storage Types

**Storage Type Comparison**

| Type | What it is | Access pattern | Examples | Use case |
|------|-----------|----------------|---------|---------|
| **Object Storage** | Files stored with flat namespace + metadata. Accessed via HTTP API. | GET/PUT per file. Not for random byte reads. | AWS S3, GCS, Azure Blob | Images, videos, backups, static website assets, ML training data |
| **Block Storage** | Raw disk blocks attached to a server. OS treats it like a local hard drive. | Random byte-level read/write. Low latency. | AWS EBS, Azure Disk | Database storage (PostgreSQL, MySQL). Anything needing random write access. |
| **File Storage (NFS)** | Shared file system mounted by multiple servers simultaneously. | Standard file operations. Multiple readers/writers. | AWS EFS, Azure Files | Shared config files, ML model weights shared across training nodes |

> 💡 **Interview rule: Store media in S3, never in your database.** User-uploaded photos, videos, and files should always go to object storage (S3), not your SQL database. SQL databases are for structured relational data. Storing BLOBs in them makes the database slow and expensive. Store the S3 URL in your database instead.

---

## CDN (Content Delivery Network)

A **CDN** is a global network of edge servers placed in cities around the world. When a user in Tokyo requests a video that lives on your servers in Virginia, without a CDN the request travels 11,000 km causing ~150ms latency. With a CDN, the first request fetches the video from Virginia to a Tokyo edge server; all subsequent requests from Tokyo users are served from the Tokyo edge at ~5ms. CDNs are the reason YouTube, Netflix, and Facebook feel fast globally.

**CDN: Push vs Pull**

| Mode | How it works | When to use |
|------|-------------|------------|
| **Pull CDN** | CDN fetches content from your origin server on first request, then caches it at the edge for the TTL duration. Subsequent requests come from edge cache. | Default for most web content. No upfront work — CDN fills itself as users request things. |
| **Push CDN** | You proactively push content to all CDN nodes before any user requests it. Content is always pre-warm. | Static assets that you know will be accessed globally (software downloads, video game updates). Ensures zero latency on first request. |

CDN providers:
- **Cloudflare** — largest network, excellent security features (DDoS protection, WAF)
- **AWS CloudFront** — deep AWS integration, S3 origins
- **Fastly** — programmable CDN, instant cache purge (critical for news sites)
- **Akamai** — enterprise, largest historical network, telco-grade

---

## Object Storage Deep Dive (S3)

AWS S3 is the gold standard for object storage. Key design points:

**Pre-signed URLs (Critical for file upload architecture):**
```
1. Client requests upload URL: POST /api/upload-url
2. Server generates pre-signed S3 URL (valid for 5 minutes)
   → URL contains: bucket, key, expiry, signature
3. Client uploads file directly to S3 using that URL
4. S3 stores the file
5. Client notifies server: "upload complete, file at s3://bucket/key/video.mp4"
6. Server saves the S3 URL in the database

Key benefit: Your servers NEVER handle the actual file bytes.
Large files don't consume your server's bandwidth or memory.
```

**S3 consistency model (as of Dec 2020):** Strong read-after-write consistency. You can immediately read back a file you just PUT. No eventual consistency delay.

**S3 multipart upload:**
- Files > 100MB should use multipart upload
- Split into 5MB–5GB parts, upload in parallel
- On failure, only re-upload failed parts (not the whole file)
- AWS assembles parts server-side

---

## CDN Cache Control

Controlling what CDN caches and for how long:

| Content type | Recommended TTL | Cache-Control header |
|-------------|----------------|---------------------|
| Immutable assets (JS/CSS with hash in filename) | 1 year | `Cache-Control: max-age=31536000, immutable` |
| Profile images, product photos | 24 hours | `Cache-Control: max-age=86400` |
| HTML pages | 5 minutes | `Cache-Control: max-age=300` |
| API responses | 0–60 seconds | `Cache-Control: max-age=60` or `no-cache` |
| User-specific data | Never | `Cache-Control: private, no-store` |

**Cache invalidation at CDN edge:**
- Most CDNs allow manual cache purge by URL or tag
- Fastly supports instant purge (< 150ms globally) — used by news sites to update breaking stories
- For immutable assets: change the filename (hash-based names) instead of purging

---

## Video Streaming Architecture

Video serving requires more than just CDN:

1. **Storage:** Raw video uploaded to S3.
2. **Transcoding:** Async job converts to multiple formats + resolutions (1080p, 720p, 480p, 360p, 144p). Tools: FFmpeg, AWS MediaConvert, Google Transcoder API.
3. **Segmentation:** Video split into 2-10 second segments (HLS: `.m3u8` manifest + `.ts` segments / DASH: `.mpd` manifest).
4. **CDN distribution:** Segments distributed to edge servers near users.
5. **Adaptive bitrate streaming (ABR):** Client player monitors network speed and switches between quality levels dynamically. If bandwidth drops, player requests 480p segments instead of 1080p — no buffering.

```
Architecture:
User uploads → S3 (raw) → Transcoding Job (SQS) → 
Multiple quality outputs → S3 (processed) → CDN (cached) → Users globally
```

---

## File Sync Architecture (Dropbox/Google Drive)

**Chunked sync with deduplication:**

1. **Client chunking:** File split into fixed-size blocks (4MB each).
2. **Content-addressing:** Each chunk hashed (SHA-256). The hash IS the chunk ID.
3. **Delta sync:** On file change, only send chunks whose hash changed.
4. **Deduplication:** Server checks "do you have chunk with hash X?" before uploading. If yes, skip — server-side copy instead of re-upload. Dropbox reported 30%+ storage savings.
5. **Versioning:** File = ordered list of chunk IDs at each version. Restore = reassemble the right chunks.

---

## Interview Talking Points

- "User uploads go directly from the browser to S3 using a pre-signed URL. My API server only generates the signed URL — it never touches the file bytes. This eliminates server-side bottleneck for uploads."
- "Static assets (JS, CSS, images) are served from CloudFront with 1-year TTL. File names include a content hash, so we never need to purge — new deployments get new file names."
- "For video: S3 for storage, async transcoding into 5 quality levels, HLS segments distributed via CDN. The player does adaptive bitrate streaming — users on slow connections get 360p, fast connections get 1080p."
- "Block storage (EBS) for the PostgreSQL database — needs random byte-level access. Object storage (S3) for all user-uploaded files. These are never mixed."
