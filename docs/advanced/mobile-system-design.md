# Mobile System Design

> Mobile devices have unique constraints: unreliable networks, limited battery, and limited bandwidth. Your backend must accommodate them.

---

## Offline Support & Sync

Users expect apps to work in airplane mode (read cached data, queue writes). The backend needs a **sync protocol**.

**Delta Sync Pattern:**

1. **Local Database:** App stores data in SQLite/Realm locally.
2. **Write Queue:** Offline actions (like/post) are stored in a local "pending actions" queue.
3. **Sync Down:** Client sends `last_sync_timestamp` to server. Server returns only records modified *after* that timestamp (deltas).
4. **Sync Up:** On reconnect, client uploads the "pending actions" queue. Server processes them idempotently.
5. **Conflict Resolution:** Last-write-wins (server timestamp) is simplest. For collaborative apps, use CRDTs or operational transformation.

---

## Push Notifications

Don't poll. Use platform-native push services (APNs for iOS, FCM for Android). Your backend doesn't push to the phone directly; it pushes to Apple/Google servers.

```
Backend Flow:
1. User logs in. App sends device_token to backend. Backend stores `user_id` → `[device_token_1, device_token_2]`.
2. Event happens (new message).
3. Backend looks up device tokens for user.
4. Backend calls FCM/APNs API with payload.
5. FCM/APNs delivers message to device (efficiently waking radio).
```

---

## Battery Optimization

Radio usage drains battery. Constant small requests keep the radio in "high power" state. **Batching** is key: queue analytics events and non-urgent logs locally, then upload them all in one large batch every 10 minutes or when the user performs an active action.

---

## Mobile-Specific API Design

Mobile clients have constraints that desktop/server clients don't:

**Network efficiency:**

| Practice | Why |
|----------|-----|
| **Pagination with small pages** | Low memory, slow connections. Load 20 items, not 1000. |
| **Compressed responses** (gzip/Brotli) | Reduces data transfer 60–80%. Critical on cellular. |
| **Sparse fieldsets** | Only request fields you display. Don't over-fetch. |
| **Conditional requests** (`ETag`, `If-None-Match`) | If content unchanged, server returns 304 Not Modified — zero bytes transferred. |
| **HTTP/2 multiplexing** | Multiple requests in parallel over one connection. No connection overhead. |
| **Request coalescing** | Debounce API calls. Don't call API on every keystroke — wait 300ms after user stops typing. |

**Connection handling:**

| Issue | Solution |
|-------|---------|
| **Network switch** (WiFi → 4G) | HTTP/3 (QUIC) maintains connection during network switch. TCP would disconnect. |
| **Intermittent connectivity** | Retry with exponential backoff. Queue requests locally when offline. |
| **Metered connection** | Detect `isActiveNetworkMetered()` — reduce image quality, defer non-critical sync. |
| **Slow connection** | Adaptive bitrate for media. Show low-res thumbnail while loading full image. |

---

## Image Loading Strategy

```
Image loading pipeline:
1. Show placeholder / skeleton screen immediately
2. Check local disk cache (LRU cache, e.g., 100MB limit)
   → Hit: display immediately (no network)
3. Check memory cache (last ~20 viewed images)
   → Hit: display with animation
4. Fetch from CDN:
   a. Request compressed WebP format (50% smaller than JPEG)
   b. Progressive loading: show blurred low-res first, then full-res
   c. Store in disk cache for future use

Image sizing:
→ Request exact size needed (thumbnail vs full image)
→ CDN transforms on-the-fly: ?w=300&h=300&format=webp
→ Don't download 4K image to display as 60×60 avatar!
```

---

## Mobile Backend Architecture Patterns

**API Design for Mobile:**

```
GraphQL benefits for mobile:
  - Client specifies exactly what fields it wants
  - No over-fetching (important on slow cellular)
  - Batched queries: get user + recent posts + notifications in one request
  
REST with BFF (Backend for Frontend):
  - Dedicated mobile API that aggregates multiple microservices
  - Returns exactly what the mobile screen needs
  - Reduces number of network calls
  - Can be versioned independently (mobile app v2 uses /api/v2/)
```

**Authentication on mobile:**

| Token | Lifetime | Storage | Use |
|-------|----------|---------|-----|
| **Access token (JWT)** | 15 minutes | Secure Keychain/Keystore (encrypted) | API calls |
| **Refresh token** | 7–30 days | Secure Keychain/Keystore | Get new access token |
| **Biometric lock** | N/A | Biometric hardware | Protect refresh token |

Never store tokens in SharedPreferences (Android) or UserDefaults (iOS) — these are not encrypted.

---

## Deep Linking

Deep links route external URLs directly into specific app screens:

```
Universal Link: https://app.example.com/products/123
  → If app installed: Opens Products screen with product 123
  → If not installed: Opens in browser (seamless experience)

Schema-based: myapp://products/123
  → Only works if app installed
  → Must register scheme in iOS Info.plist / Android Manifest
```

Deep links require server-side file at `/.well-known/apple-app-site-association` (iOS) and `/.well-known/assetlinks.json` (Android) to associate your domain with your app.

---

## App Store Distribution & Deployment

| Platform | Deployment | Review time |
|---------|-----------|------------|
| **iOS App Store** | Submit IPA binary → Apple review | 1–3 days |
| **Android Google Play** | Submit AAB → Google review | Few hours |
| **Over-the-Air updates** | Expo OTA, CodePush (React Native only) | Instant |
| **Feature flags** | Control features remotely without update | Instant |

**Feature flags for mobile (Firebase Remote Config):**
```
Server-side: 
  new_checkout_ui = false  (default: off for all users)
  new_checkout_ui_test_group = true  (on for 10% of users)

Mobile app:
  if remoteConfig["new_checkout_ui"] {
    showNewCheckoutUI()
  } else {
    showOldCheckoutUI()
  }
```

This allows instant feature rollout, rollback, and A/B testing without requiring users to update the app.

---

## Interview Talking Points

- "For offline support: SQLite locally, pending action queue for offline writes. On reconnect: delta sync (send `last_sync_timestamp`, receive only changed records). Server processes writes idempotently."
- "Push notifications via FCM/APNs — our backend never connects directly to devices. Store device_token → user_id mapping. On event, call FCM API."
- "Battery: batch all analytics events, send in one request every 10 minutes. No polling — use push notifications for real-time events."
- "API for mobile uses GraphQL: client requests exactly the fields displayed on each screen. Critical for users on 3G — avoid over-fetching."
