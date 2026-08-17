# VYRO — Shopify Online Store 2.0 Theme

Premium, mobile-first Shopify theme for **VYRO** — smart tech and desk essentials
for students and creators, targeting the South African market (ZAR).

Tagline: **UPGRADE YOUR SETUP.**

This file orients any future work (human or Claude) on this repository.

## Tech & architecture

- Pure Shopify Online Store 2.0: Liquid, JSON templates, sections, snippets, schema settings.
- No frameworks, no build step, no bundler. Vanilla CSS (custom properties) + vanilla JS.
- No hard-coded products, prices, inventory or checkout URLs — everything renders from
  Shopify's product/collection/cart/customer objects.
- No fake reviews, fake urgency, fake stock counters, or unsupported shipping promises.
- Cart uses Shopify's real Cart AJAX API (`/cart/add.js`, `/cart/change.js`) plus the
  Section Rendering API (`?section_id=`) to refresh the drawer/cart page without a full
  reload. Checkout goes to Shopify's real `/cart/checkout`.

## Directory structure

```
assets/       CSS + JS (no images — all imagery comes from merchant uploads via schema)
config/       settings_schema.json (theme editor settings) + settings_data.json (defaults)
layout/       theme.liquid — the single layout wrapper (head, header, footer, cart drawer)
locales/      en.default.json — all user-facing strings
sections/     one file per section, each with its own {% schema %}
snippets/     reusable partials (product-card, price, icons, cart-item, etc.)
templates/    JSON templates wiring sections together per route
```

### Key files

- `layout/theme.liquid` — outputs SEO meta tags, JSON-LD, CSS variables from theme
  settings, then renders `announcement-bar`, `header`, `{{ content_for_layout }}`,
  `footer`, and the global `cart-drawer` section.
- `snippets/css-variables.liquid` — maps `settings.*` (colors, fonts, spacing, radius)
  to CSS custom properties consumed by `assets/base.css` and friends.
- `sections/cart-drawer.liquid` — rendered once, globally, on every page so the
  Section Rendering API can refresh it after any cart mutation.
- `assets/cart-drawer.js` — all add/change/remove-from-cart logic + drawer open/close.
- `assets/product-form.js` — PDP variant switching, price/image/URL sync, add to cart.
- `assets/global.js` — sticky header, mobile nav, search popover, scroll reveal, qty steppers.

## Design system

CSS custom properties (`assets/base.css`, overridden per-shop by
`snippets/css-variables.liquid`):

| Token | Default |
|---|---|
| `--color-background` | `#080A0D` |
| `--color-surface` | `#11151A` |
| `--color-text-primary` | `#F5F7FA` |
| `--color-text-secondary` | `#A7AFB8` |
| `--color-accent` | `#2563FF` |
| `--color-border` | `rgba(255,255,255,0.10)` |
| `--font-heading` | Space Grotesk (bold) |
| `--font-body` | Inter |

All of the above (except border, which is a fixed design-system token) are editable
from **Theme Editor → Theme settings → Colors / Typography**.

## What merchants can customize (Theme Editor)

- Announcement bar text/link/enable toggle
- Logo, favicon, logo width
- Brand colors, heading/body fonts, page width, section spacing, corner radius
- Cart behavior (drawer vs. page), order note toggle
- Contact email, WhatsApp number, social links
- Hero heading/subheading/image/both CTAs
- Featured collection (picker) + heading/copy
- Featured product spotlight (product picker, benefit blocks, image position)
- Why VYRO feature cards (repeatable blocks)
- Setup showcase image/copy/CTA
- Testimonials — shows brand message "YOUR SETUP STARTS HERE." until real
  testimonial blocks are added by the merchant
- Newsletter heading/copy (submits to Shopify's native customer/newsletter form)
- Footer tagline + repeatable link-list columns (legal links pull automatically
  from `shop.policies`)
- FAQ questions (repeatable blocks, native `<details>` accordion, no JS required)
- About page heading/body/image
- Contact page heading/copy/response-time message

## Known setup steps for a merchant (not theme bugs)

- Upload a logo, hero image, setup-section image, and pick a featured collection/product —
  the theme renders clean placeholders until these are set.
- Create navigation menus named `main-menu` and `footer` in Shopify Admin → Navigation
  (these are Shopify's standard default handles; the header/footer sections reference
  them by default and can be repointed to any menu in the Theme Editor).
- Add real testimonials as blocks once available; do not fabricate them.
- Shipping/Returns, Privacy Policy and Terms of Service links pull from
  **Settings → Policies** in Shopify Admin (`shop.policies`) — fill those in there.

## Preview & deploy (Shopify CLI)

Install the CLI if needed: `npm install -g @shopify/cli @shopify/theme`

```bash
# Authenticate + link to your store (run once)
shopify theme dev --store your-store.myshopify.com

# Local live preview with hot reload
shopify theme dev

# Push as a new, UNPUBLISHED development theme (safe — does not go live)
shopify theme push --unpublished --theme "VYRO (dev)"

# Pull an existing theme down to work on locally
shopify theme pull --theme <theme-id>

# Run theme check (linting) before pushing
shopify theme check
```

**Do not run `shopify theme push --live`** or publish from the Shopify Admin until the
theme has been reviewed on a development/unpublished theme.

### If you upload via a ZIP file instead of the CLI

Shopify Admin → Online Store → Themes → **Add theme → Upload zip file** requires
`assets/`, `config/`, `layout/`, `locales/`, `sections/`, `snippets/`, `templates/` to sit
at the **root of the ZIP archive** — not nested inside a wrapper folder.

This bites people most often via GitHub's **Download ZIP** button, which wraps the whole
repo in a folder like `vyro-shopify-theme-<branch>/`. Uploading that zip as-is can appear
to "succeed" in the Admin, while template routing silently breaks — the most common visible
symptom is the **homepage (`/`) rendering the theme's own 404 page**, even though every
template and section file is valid. If that happens, it's a packaging issue, not a theme bug.

Use the included script to build a correctly-rooted zip instead:

```bash
./package-theme.sh            # writes vyro-theme.zip with folders at the archive root
./package-theme.sh my-name.zip
```

Then verify with `unzip -l vyro-theme.zip | head` that the first entries are `assets/`,
`config/`, etc. — not a wrapper folder — before uploading. When in doubt, prefer
`shopify theme push --unpublished` (above), which never has this failure mode.

## QA already performed on this build

- Every `{% schema %}` block validated as parseable JSON.
- Every `templates/*.json` section `type` resolves to a real file in `sections/`.
- Every `{% render 'x' %}` resolves to a real file in `snippets/`.
- Every `asset_url` reference resolves to a real file in `assets/`.
- Liquid tag pairs (`if/endif`, `for/endfor`, `form/endform`, `paginate/endpaginate`,
  etc.) and HTML tag balance checked across all `.liquid` files.
- All JS passes `node --check`.
- Every `| t` translation key used in Liquid exists in `locales/en.default.json`.
- Alt text present on all `<img>` tags; all form inputs are labelled.

## Intentional simplifications (given scope)

- Quick-add (the `+` button on product cards) adds the default/first variant directly;
  products with multiple variants route to the PDP for full variant selection instead of
  a quick-add popup.
- Collection filtering/sorting is native Shopify Storefront filtering rendered
  server-side (checkbox/price-range inputs that auto-submit); no client-side facet JS.
- Related products pull from the product's first collection (excluding itself) rather
  than Shopify's ML-based recommendation endpoint, keeping everything server-rendered
  Liquid with zero extra network requests.
