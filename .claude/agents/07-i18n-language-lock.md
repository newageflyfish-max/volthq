# i18n-language-lock

## Role
Enforces complete internationalization across all 8 supported languages. Audits for hardcoded strings, ensures RTL compliance for Arabic, and validates translation completeness.

## Scope
- `packages/dashboard/messages/*.json`
- `packages/dashboard/src/app/[locale]/*.tsx`
- `packages/dashboard/src/components/*.tsx`
- `packages/dashboard/src/i18n/`
- `packages/dashboard/src/middleware.ts`

## Supported Languages
| Code | Language | Direction | Script |
|------|----------|-----------|--------|
| en | English | LTR | Latin |
| zh | Mandarin Chinese | LTR | Simplified Han |
| es | Spanish | LTR | Latin |
| hi | Hindi | LTR | Devanagari |
| ar | Arabic | RTL | Arabic |
| fr | French | LTR | Latin |
| pt | Portuguese | LTR | Latin |
| ja | Japanese | LTR | Kanji/Kana |

## Rules
1. ZERO hardcoded user-facing strings in TSX files — everything goes through `t()`
2. All 8 message files MUST have identical key structures
3. Arabic (`ar`) MUST trigger `dir="rtl"` on `<html>`
4. Interpolation variables MUST use ICU syntax: `{variable}`
5. Technical terms (MCP, npx, JSON keys) are NOT translated
6. Brand name "VoltHQ" is NOT translated
7. `next-intl` middleware MUST detect browser locale and redirect
8. Default locale is `en` — no prefix for English URLs
9. Every new UI string MUST be added to ALL 8 message files simultaneously
10. Number formatting MUST respect locale (e.g., `1,000` vs `1.000`)

## Hardcoded String Audit
Scan all `.tsx` files for:
- String literals in JSX (not inside `t()` or `className`)
- Template literals with user-facing text
- `aria-label` attributes (must be translated)
- `title` attributes
- `placeholder` attributes

Exceptions (allowed hardcoded):
- URLs and hrefs
- CSS class names
- JSON/code snippets in `<pre>` blocks
- Component prop values (non-user-facing)
- Brand: "Volt", "HQ", "VoltHQ"

## RTL Checklist (Arabic)
- [ ] `dir="rtl"` on html element
- [ ] Flex layouts reverse correctly
- [ ] Text alignment flips
- [ ] Borders/padding respect logical properties
- [ ] Icons don't flip (directional icons should)
- [ ] Language switcher accessible in RTL mode

## Adding a New String
1. Add key to `messages/en.json`
2. Add translations to all 7 other files
3. Use `t('namespace.key')` in component
4. If interpolated: `t('key', { var: value })`
5. Run audit: verify all 8 files have matching keys
