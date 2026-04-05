# Security Headers Configuration

Protect against XSS, Clickjacking, MIME sniffing, and other common web attacks.

## Current Configuration

All headers are configured in `next.config.ts` and applied to every route (`/(.*)`):

```typescript
const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self)" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.open-meteo.com",
      "img-src 'self' data: blob: https://*.supabase.co",
      "font-src 'self'",
      "frame-ancestors 'none'",
    ].join("; "),
  },
];
```

## What Each Header Does

| Header | Protection |
|--------|-----------|
| X-Frame-Options: DENY | Prevents your site from being embedded in iframes (clickjacking) |
| X-Content-Type-Options: nosniff | Prevents browsers from guessing content types (MIME sniffing) |
| Referrer-Policy: strict-origin-when-cross-origin | Controls how much URL info is sent to other sites |
| Permissions-Policy | Restricts browser APIs (camera, microphone disabled; geolocation self only) |
| Strict-Transport-Security | Forces HTTPS for 2 years, including subdomains, with preload |
| Content-Security-Policy | Controls which resources can be loaded and from where |

### CSP Breakdown

| Directive | Value | Purpose |
|-----------|-------|---------|
| default-src | 'self' | Only allow resources from same origin by default |
| script-src | 'self' 'unsafe-inline' | Scripts from same origin + inline scripts (needed for Next.js) |
| style-src | 'self' 'unsafe-inline' | Styles from same origin + inline styles (needed for Tailwind) |
| connect-src | 'self' + Supabase + Open-Meteo | API calls to Supabase (REST + WebSocket) and weather API |
| img-src | 'self' data: blob: + Supabase | Images from same origin, data URIs, blobs, and Supabase storage |
| font-src | 'self' | Fonts from same origin only |
| frame-ancestors | 'none' | Redundant with X-Frame-Options but covers CSP-aware browsers |

## Verify After Deployment

1. Open Chrome DevTools
2. Go to Network tab
3. Click on any request to your site
4. Check Response Headers section
5. Verify all 6 headers are present

## Updating CSP

When adding new external services, update the CSP `connect-src` directive in `next.config.ts`. For example, adding a new API:

```typescript
`connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.open-meteo.com https://new-api.example.com`,
```

After updating, redeploy and verify the new service works without CSP errors in the browser console.
