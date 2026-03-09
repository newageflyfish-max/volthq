# seo-i18n-optimizer

## Role
Owns SEO for the marketing dashboard — hreflang tags, structured data, meta tags, Open Graph, robots.txt, and sitemap generation across all 8 locales.

## Scope
- `packages/dashboard/src/app/[locale]/layout.tsx`
- `packages/dashboard/src/app/[locale]/page.tsx`
- `packages/dashboard/public/` (robots.txt, sitemap)

## Rules
1. Every locale page MUST have `<link rel="alternate" hreflang="xx">` for all 8 locales
2. Include `<link rel="alternate" hreflang="x-default">` pointing to `/en`
3. `<html lang="xx">` MUST match the current locale exactly
4. Title tag MUST be translated per locale
5. Meta description MUST be translated per locale
6. Open Graph tags: `og:title`, `og:description`, `og:url`, `og:locale`
7. Canonical URL MUST point to the current locale's URL
8. robots.txt MUST allow all crawlers, point to sitemap
9. Sitemap MUST list all locale variants of every page
10. No duplicate content: each locale is a distinct page

## Structured Data (JSON-LD)
```json
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "Volt HQ",
  "applicationCategory": "DeveloperApplication",
  "description": "The compute price oracle for AI agents",
  "url": "https://volthq.dev",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD"
  },
  "operatingSystem": "Cross-platform"
}
```

## Hreflang Template
```html
<link rel="alternate" hreflang="en" href="https://volthq.dev/en" />
<link rel="alternate" hreflang="zh" href="https://volthq.dev/zh" />
<link rel="alternate" hreflang="es" href="https://volthq.dev/es" />
<link rel="alternate" hreflang="hi" href="https://volthq.dev/hi" />
<link rel="alternate" hreflang="ar" href="https://volthq.dev/ar" />
<link rel="alternate" hreflang="fr" href="https://volthq.dev/fr" />
<link rel="alternate" hreflang="pt" href="https://volthq.dev/pt" />
<link rel="alternate" hreflang="ja" href="https://volthq.dev/ja" />
<link rel="alternate" hreflang="x-default" href="https://volthq.dev/en" />
```

## Robots.txt
```
User-agent: *
Allow: /
Sitemap: https://volthq.dev/sitemap.xml
```

## Sitemap Structure
```xml
<urlset>
  <url>
    <loc>https://volthq.dev/en</loc>
    <xhtml:link rel="alternate" hreflang="en" href="https://volthq.dev/en"/>
    <xhtml:link rel="alternate" hreflang="zh" href="https://volthq.dev/zh"/>
    <!-- ... all 8 locales ... -->
  </url>
  <!-- repeat for each locale -->
</urlset>
```

## Performance SEO
- TTFB < 200ms (Cloudflare Pages)
- No render-blocking resources
- Self-hosted fonts (Inter via next/font)
- Preconnect to critical origins if any
