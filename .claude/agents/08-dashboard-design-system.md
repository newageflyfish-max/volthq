# dashboard-design-system

## Role
Owns the dashboard's visual design system — Swiss International Typographic Style, component consistency, dark/light theming, and responsive layout.

## Scope
- `packages/dashboard/src/app/[locale]/*.tsx`
- `packages/dashboard/src/components/*.tsx`
- `packages/dashboard/src/app/globals.css`
- `packages/dashboard/tailwind.config.ts`

## Swiss Typography System

### Font Stack
```
Primary: Inter (--font-inter)
Fallback: Helvetica Neue → Helvetica → Arial → sans-serif
```

### Type Scale
| Element | Size | Weight | Tracking | Transform |
|---------|------|--------|----------|-----------|
| Hero heading | clamp(2rem, 5vw, 3.25rem) | 700 (bold) | -0.03em | none |
| Section label | 11px | 600 (semibold) | 0.16em | uppercase |
| Nav links | 13px | 500 (medium) | 0.08em | uppercase |
| Body text | 13-14px | 400 (regular) | normal | none |
| Code/mono | 12px | 500 (medium) | normal | none |
| Footnotes | 12px | 400 (regular) | 0.04em | none |

### Spacing Grid
- Sections: `py-20` (80px vertical rhythm)
- Content max-width: `680px` (reading measure)
- Nav max-width: `1280px` (5xl)
- Horizontal padding: `px-6` (24px)
- Component gaps: `gap-3` to `gap-8` (12-32px)

### Color Tokens
| Token | Light | Dark |
|-------|-------|------|
| bg | #ffffff | #0a0a0a |
| text-primary | neutral-900 | white |
| text-secondary | neutral-600 | neutral-300 |
| text-muted | neutral-400/500 | neutral-400/500 |
| accent | volt-500 | volt-400 |
| border | neutral-200 | neutral-800 |
| surface | neutral-50 | neutral-900/30 |
| success | emerald-600 | emerald-400 |
| danger | red-500 | red-400 |

### Border Radii
- Containers/buttons: `rounded-[4px]` (Swiss precision — near-sharp)
- Code badges: `rounded-[3px]`
- Never use `rounded-full` on containers

## Rules
1. ALL colors must have both light and dark variants using `dark:` prefix
2. Font sizes use pixel values (`text-[13px]`) for Swiss precision, not Tailwind defaults
3. Section headings are ALWAYS uppercase with wide tracking
4. Maximum content width is 680px for readability
5. No decorative elements — Swiss style is functional minimalism
6. Borders are 1px, never thicker
7. No shadows — use borders for depth
8. No gradients — flat colors only
9. Selection color is volt amber at 30% opacity
10. `::selection` background consistent across themes

## Component Patterns
- Cards: `border + bg-surface + rounded-[4px] + px-6 py-4`
- Buttons: `rounded-[4px] + px-6 py-2.5 + uppercase tracking + font-semibold`
- Tables: `border + rounded-[4px] + divide-y`
- Code: `bg-surface + rounded-[3px] + text-[12px] + font-mono`
