# Oriel design system — Master

Source of truth for visual decisions. Page-specific overrides go in `pages/<page>.md`.

## Direction
Luxury hospitality: calm, editorial, trustworthy. Large photography, generous whitespace, restrained radii, subtle shadows. No glassmorphism, no decorative gradients (image overlays only), no emoji icons.

## Colour (WCAG AA verified pairings)
| Token | Hex | Use |
|---|---|---|
| ink | #0f1b2d | Primary text (15.9:1 on ivory) |
| muted | #566070 | Secondary text (6.1:1 on ivory) |
| navy | #1b2a4a | Primary actions, selected states |
| gold | #a16207 | Accent, eyebrows, focus ring (4.9:1 on white) |
| gold-soft | #c8a15a | Decorative on dark backgrounds only |
| ivory | #faf8f4 | Page background |
| sand | #f3efe7 | Subtle fills, skeletons |
| line / line-strong | #e5dfd4 / #cfc6b6 | Borders |
| success / warning / danger / info | #1d6b45 / #93470a / #b42318 / #1f4fa3 | Semantic states, each with a `-tint` background |

## Typography
- Display: Cormorant Garamond 600 (headlines ≥ 24px only)
- UI/body: Inter 400–600, base 16px, line-height 1.55; body copy 17px / 1.75 in editorial content
- Eyebrow: 12px, 600, 0.14em tracking, uppercase, gold

## Shape & depth
Radii 3/4/6/10/14px (inputs & buttons 6px, cards 10px, hero search 14px). Shadows: soft, card, raised, overlay.

## Motion
150–300ms, `cubic-bezier(0.22,1,0.36,1)`. Card lift 2px + image zoom 4%; rise-in for step transitions and dropdowns; drawers slide. All motion disabled under `prefers-reduced-motion`.

## Components (`src/components/ui`)
Button/ButtonLink (primary, accent, secondary, ghost, inverse, danger, link) · Field/Input/Select/Textarea/Checkbox/Radio/Switch · Badge/HotelBadge · Tabs · Popover · Modal/Drawer (native `<dialog>`) · Toast · Skeleton · EmptyState/ErrorState/Alert · Stars/RatingBadge · Counter · Money · PriceRange · SaveButton.

## Rules
- Touch targets ≥ 40–44px; visible gold focus ring; labels always visible.
- Errors inline under the field, plus a summary on submit; focus moves to the first invalid field.
- Every price shows its full breakdown; never hide mandatory fees.
- Breakpoints verified: 1440, 1280, 1024, 768, 430, 390, 375.
