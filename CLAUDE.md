# CLAUDE.md — Master Build Guide
> All branches inherit these rules. Branch-specific briefs go in their own folder.

---

## ROLE

You are a professional full-stack web developer and designer. Before writing any code, invoke the **ui-ux-pro-max** skill to inform all design decisions — color, typography, layout, spacing, accessibility, responsiveness. Never skip this step.

---

## BRANCH WORKFLOW

1. When creating a new branch, rename the project folder (not `asset/`) to match the branch name.
2. Read the branch-specific brief (if one exists) before building.
3. Keep everything local unless told to push.

---

## STANDARD WEBSITE STRUCTURE

Every website you build must include(unless requested otherwise):

### 1. Hero Section
- Full-viewport looping video background using an `.mp4` from the `asset/` folder.
- Translucent overlay — never solid colors. Use `rgba()` + `backdrop-filter: blur()` for all masks.
- Company name, tagline, and CTA layered on top with high-contrast text.
- All text must contrast against the video background — use translucent dark panels or text shadows as needed.

### 2. Scroll-Scrub Animation Section
- Directly below the hero, a long scroll-driven animation plays frames extracted from the same (or a second) `.mp4`.
- Site content (text, images, cards, sections) scrolls on top of the animation — the canvas is a **fixed background**, not a blocking overlay.
- Content sections use translucent backgrounds (`rgba()` + `backdrop-filter`) so the animation bleeds through.
- The animation scrubs forward on scroll down, backward on scroll up — fully bidirectional.

### 3. Remaining Sections
- Built per the branch brief (about, menu, features, contact, etc.).
- All section backgrounds are translucent — never solid. Frosted glass / glassmorphism effect throughout.
- Consistent typography pairing (serif headlines + sans-serif body) loaded from Google Fonts.
- Fully responsive: 375px · 768px · 1200px+.
- `@media (prefers-reduced-motion: reduce)` — static fallback, no animations.

---

## SCROLL-SCRUB ANIMATION WORKFLOW

When an `.mp4` is available in `asset/`, follow this process:

### Step 1: Find the video
Look in `asset/` for `.mp4` files. One file → use it. Multiple → ask the user.

### Step 2: Check FFmpeg
Verify FFmpeg is available. If not:
```bash
apt-get update -qq && apt-get install -y -qq ffmpeg
```
Fallback: `pip install imageio[ffmpeg]` or Python with `opencv-python-headless`.

### Step 3: Analyze the video
```bash
ffprobe -v error -select_streams v:0 -show_entries stream=width,height,duration,r_frame_rate,nb_frames -of csv=p=0 asset/<filename>.mp4
```
Report: duration, native FPS, resolution, estimated frame count at 30fps.

### Step 4: Extract frames
```bash
mkdir -p <project-folder>/frames
ffmpeg -i asset/<filename>.mp4 -vf "fps=30,scale=1920:-2" -q:v 3 <project-folder>/frames/frame-%04d.jpg
```
- Videos > 15s: ask user to confirm or trim.
- Videos > 60s: suggest 24fps.
- Always report total frames and folder size.

### Step 5: Build the scroll-scrub

**Canvas:** Fixed to viewport, `z-index: 0`, behind all content. Full-screen, `cover` scaling (no letterboxing).

**Frame preloading:** Load all frames as `Image()` objects. Show a loading bar with percentage. Fade out loader when complete. Draw frame 1 immediately on load.

**Scroll sync:** Map `scrollY / totalScrollableHeight` to frame index. Update canvas on every scroll event (passive listener). Bidirectional — scroll up plays backward.

**Content layering:** All page content sits above the canvas (`z-index: 1+`) and scrolls naturally. A hero spacer (empty transparent section, ~300vh) gives the video room to play before content appears.

### Step 6: Loading screen
Show brand name + progress bar while frames preload. Fade out on completion.

---

## DESIGN RULES

1. **No solid backgrounds** — every surface uses `rgba()` with `backdrop-filter: blur()`. Translucent mask vibe throughout.
2. **Contrast text** — all text must be readable against its background. White text on dark/video areas, dark text on light translucent areas. Use text-shadow or translucent panels when needed.
3. **CSS custom properties** — all colors, fonts, spacing defined once in `:root`.
4. **Typography** — always pair an elegant serif (Playfair Display, Lora) with a clean sans-serif (Inter, DM Sans).
5. **No Lorem ipsum** — write real copy for every section based on the brand brief.
6. **Semantic HTML** — one `h1` per page, `alt` text on images, keyboard navigable.
7. **Image placeholders** — use gradient `<div>` blocks with `<!-- REPLACE: [description] -->` comments.
8. **Vanilla HTML/CSS/JS** — no frameworks unless the brief specifies one. CDN libraries only if genuinely needed.
9. **GPU-safe animations** — `transform` and `opacity` only. Never animate layout properties.
10. **No console errors, no broken links.**
11. **No boring entrances** — every element must animate into view. Use fade-ins, slide-ups, scale reveals, or staggered entrances depending on the site's vibe. Elegant sites get slow, subtle fades. Energetic sites get snappy slides and bounces. Elements should also fade/transition out when scrolling away if appropriate. Use `IntersectionObserver` for scroll-triggered animations. Stagger child elements (cards, list items) so they cascade in sequence, not all at once.
12. **Micro-interactions** — every interactive element must have hover/focus/active states. Buttons: scale, glow, or color shift on hover. Cards: lift with shadow on hover. Links: underline slide or color transition. Inputs: border glow on focus. Click feedback on CTAs (subtle press/scale). Nothing should feel dead when you interact with it.
13. **Smart loading** — beyond the frame loader, use skeleton screens or shimmer placeholders for content areas that load asynchronously. Images should fade in on load, not pop. Use `loading="lazy"` on below-fold images. Progressive enhancement — the page should feel fast even on slow connections.
14. **Scroll progress indicator** — include a thin progress bar at the top of the viewport or a dot-nav on the side showing current section. Especially important on long scroll-scrub pages. Style it to match the site's palette — translucent, not solid.
15. **Spacing system** — define a consistent spacing scale in `:root` (e.g. `--space-xs: 0.5rem` through `--space-3xl: 8rem`). Use these variables everywhere. Consistent vertical rhythm between sections, consistent gaps between elements. No magic numbers.
16. **Dark mode** — support `prefers-color-scheme: dark` with a second set of CSS custom properties. Optionally include a toggle switch in the nav. Dark mode backgrounds should be rich dark tones (not pure black), with adjusted text opacity and accent colors that pop on dark surfaces.
17. **Custom cursor** — on desktop, replace the default cursor with a custom dot-follower or blend-mode circle that reacts to hoverable elements (grows on buttons, changes blend mode on images). Disable on mobile/touch. Keep it subtle — enhance, don't distract.
18. **Page transitions** — when navigating between pages, use a smooth fade, slide, or wipe transition instead of hard reloads. Intercept link clicks, animate the current page out, load the new page, animate it in. Keep transitions fast (300–500ms). Fall back gracefully if JS fails.
19. **No stray elements** — no element should overlap where it doesn't belong. Check `z-index` stacking, `position: fixed/sticky` elements, and `overflow` behavior. Fixed elements (hero text, nav, scroll hints, custom cursor) must have explicit show/hide logic tied to scroll position — they must disappear when they should, not linger. But sections themselves should flow cohesively into each other — no hard edges, no straight-line dividers, no solid borders between sections. Use gradient fades, soft blurs, overlapping translucent layers, curved SVG dividers, or natural color transitions so the page feels like one continuous experience. Straight angles and solid borders are only used when the client brief specifically asks for them.
20. **Fast-scroll safety** — all scroll-driven logic must handle rapid scrolling and momentum scroll. Use `requestAnimationFrame` for canvas updates, not raw scroll events. Clamp all frame indices and progress values. Fixed/sticky elements (hero text, scroll hints, loaders) must use hard cutoffs, not just opacity transitions — set `visibility: hidden` or `display: none` past their scroll zone so they can't ghost over other content. Test: if you slam the scrollbar from top to bottom instantly, nothing should flash, overlap, or stick around.
21. **Clean sections** — before finishing, audit every section visually. No orphaned elements, no stray borders, no phantom padding, no placeholder text left behind (unless marked with `<!-- REPLACE -->`). Every section should look intentional and complete on its own. If a section looks empty or broken without real images, make the placeholder styling good enough to present.
22. **Mobile-first, always** — 80% of traffic is mobile. Design for 375px FIRST, then scale up to tablet (768px) and desktop (1200px+). Every layout decision starts mobile. Specific requirements:
    - **Touch targets:** all buttons/links minimum 44×44px tap area. No tiny links or cramped nav items.
    - **Scroll-scrub on mobile:** use every 3rd frame to reduce memory usage. If device has <4GB RAM or is iOS Safari, fall back to a static hero image or looping `<video>` instead of canvas frame scrub. Detect with `navigator.deviceMemory` and `navigator.userAgent`.
    - **No hover-dependent UI** — anything revealed on hover must have a tap/click alternative on mobile. Tooltips, dropdown menus, card reveals — all must work without hover.
    - **Typography:** base font size minimum 16px on mobile (prevents iOS zoom on input focus). Line length max ~45 characters on mobile for readability.
    - **Custom cursor:** disabled entirely on touch devices. Detect with `matchMedia('(pointer: coarse)')`.
    - **Navigation:** hamburger menu on mobile/tablet. Full nav only on desktop. Menu must be thumb-reachable — consider bottom-sheet or full-screen overlay, not a tiny dropdown.
    - **Images/placeholders:** stack to single column on mobile. No side-by-side layouts below 768px unless items are very small (icons, badges).
    - **Scroll progress:** use a thin top bar on mobile, not a side dot-nav (too small to tap, wastes horizontal space).
    - **Performance:** lazy load everything below the fold. Minimize JS payload. Test on throttled 3G — the site must still feel usable.
    - **Viewport:** always include `<meta name="viewport" content="width=device-width, initial-scale=1.0">`. Never use `maximum-scale=1` or `user-scalable=no` — accessibility violation.
    - **Test breakpoints:** 375px (iPhone SE), 390px (iPhone 14), 768px (iPad), 1024px (iPad landscape), 1200px+ (desktop). Every section must look intentional at each size.

---

## UI/UX PRO MAX

Always invoke the `ui-ux-pro-max` skill before building any UI. Use it for:
- Color palette selection and validation
- Typography and font pairing
- Layout and spacing decisions
- Accessibility checks
- Responsive design guidance
- Style direction (glassmorphism, minimalism, etc.)

Do not wait to be asked. Use it proactively on every frontend task.

---

## BUILD OUTPUT

Standard file structure per project:
```
<branch-name>/
  index.html
  menu.html (or other pages per brief)
  style.css
  script.js
  frames/        ← extracted video frames
asset/
  *.mp4          ← source videos (shared across branches)
```

---

## COMMIT & PUSH

- Keep everything local by default.
- Only push when explicitly told.
- Warn if `frames/` folder exceeds 50MB — suggest `.gitignore` + external hosting.
- Never force push. Never skip hooks.

---

## CLIENT BRIEF — FILL THIS IN PER BRANCH

# CLAUDE.md — Website Build Brief
> Submitted 2026-06-21 · Internal use only

---

## CLIENT

| | |
|---|---|
| Business name | Brewed & Co. |
| Website type | Menu & product display (café / shop) |
| Client's website vision | Something cozy and inviting, show our drinks and food, maybe a little about our story, and where to find us |
| Biggest advantage | We slow-roast our own beans in-house every morning so every cup is as fresh as it gets |
| Contact phone | 647-555-0192 |
| Contact email | hello@brewedandco.ca |
| Best time to call | Morning (9am–12pm) |

---

## ROLE

You are a professional full-stack web developer and designer. Read every section of this file before writing any code. Build a complete, production-ready website based exactly on this brief. Do not ask any questions — build what is described.

---

## STRUCTURE

Page layout: **Home page + separate menu page**

Client's initial vision for the site:
> "Something cozy and inviting, show our drinks and food, maybe a little about our story, and where to find us"

Client's layout vision in their own words:
> "Big hero photo of our space, then featured drinks, a little about us, then the menu page should just be clean and easy to read — nothing fancy"

Honour both of these as closely as possible — they reflect exactly what the client expects to see.

Section order for `index.html` (home page):
1. Hero — full-width, immersive, big café atmosphere photo placeholder
2. Featured drinks — 3–4 signature items with name, short description, price
3. About — short story section, warm and personal, lean into the in-house roasting angle
4. Hours & location — opening time (7am), address placeholder, simple map embed placeholder
5. Footer — logo, nav links, social placeholders

Section order for `menu.html` (menu page):
1. Minimal header — logo + back to home link
2. Menu — clean, readable categories (Coffee, Cold Drinks, Food / Pastries). No clutter.
3. Footer — same as home

---

## COPY

Write all copy yourself based on:
- Business name: **Brewed & Co.**
- Core message: **We slow-roast our own beans in-house every morning so every cup is as fresh as it gets**
- Tone: warm, approachable, a little poetic — like a neighbourhood café that takes its craft seriously but never feels pretentious

Do not use Lorem ipsum. Write real copy for every section. Headlines, body text, drink descriptions, about paragraph — all of it.

Example voice direction:
- Hero headline: something that leads with freshness and warmth, not a generic tagline
- About section: 2–3 sentences, first-person feel, mention the morning roast ritual
- Menu items: short, appetising descriptions — no marketing fluff

---

## DESIGN

| | |
|---|---|
| Color direction | Warm & vibrant |
| Client color notes | Earthy tones — cream and brown palette |
| Reference site | None provided |
| Vibe | Warm, Minimal, Elegant |
| Typography | Pair an elegant serif for headlines (Playfair Display or Lora) with a clean sans-serif body (Inter or DM Sans) |

### Color palette to build from
- Background: `#faf6f1` (warm cream)
- Surface / cards: `#f2ebe0`
- Primary text: `#2c1f14` (dark espresso brown)
- Secondary text: `#7a5c44` (medium roast brown)
- Accent: `#c47c3e` (golden amber — like a perfectly pulled shot)
- Border / divider: `#e0d5c5`
- White: `#ffffff`

All colors as CSS custom properties so the client can retheme easily.

---

## ASSETS

No files provided — use CSS gradient placeholders and placeholder `<div>` blocks styled to look like image containers. Add a comment `<!-- REPLACE: [description of image] -->` above every placeholder so I know exactly what photo goes there.

Suggested placeholder images to call out:
- Hero: wide interior café shot, warm lighting, people in background
- Featured drinks: individual product-style shots (overhead or 45°)
- About section: barista or roasting process photo

---

## ADDITIONAL NOTES FROM CLIENT

Earthy tones, cream and brown. Opens at 7am.

---

## HERO ANIMATION

Build a CSS + JS animated hero:
- On page load: headline fades and slides up, sub-headline follows 150ms later, CTA button follows 300ms after that
- Hero content parallaxes at 0.4× scroll speed as user scrolls down
- Background: large image placeholder with a warm cream-to-transparent gradient overlay so text is always readable
- "Scroll to explore" chevron hint at the bottom — fades out after first scroll
- GPU-safe: transform + opacity only — never animate layout properties
- `@media (prefers-reduced-motion)`: static, no animation

---

## BUILD RULES

1. Files: `index.html` `menu.html` `style.css` `script.js`
2. CSS custom properties for all colors, fonts, spacing — defined once in `:root`
3. Fully responsive: 375px · 768px · 1200px+
4. Vanilla HTML/CSS/JS — CDN libraries only if genuinely needed
5. Real copy only — no Lorem ipsum anywhere
6. Semantic HTML, one `h1` per page, `alt` text on all images, keyboard navigable
7. No broken links, no console errors
8. Navigation: fixed top bar — logo left, links right (`Home`, `Menu`, `Find Us`)
9. Smooth scroll between sections on home page
10. Menu page: clean typographic layout, no cards needed — just well-spaced category headers and item rows

---

## DONE WHEN

- [ ] `index.html` complete with all 5 sections in order
- [ ] `menu.html` complete — clean, readable, mobile-friendly
- [ ] Hero animation works (scroll-triggered, reduced-motion respected)
- [ ] Warm cream/brown palette applied throughout via CSS vars
- [ ] Serif headlines + sans body type pairing applied
- [ ] Fully responsive on mobile, tablet, desktop
- [ ] No console errors
- [ ] All copy is real and on-brand — not Lorem ipsum
- [ ] Every image placeholder has a `<!-- REPLACE -->` comment
- [ ] `style.css` uses CSS custom properties for the full color system
- [ ] Navigation links between home and menu work correctly

---


Read every field before building. If a field is blank, use sensible defaults based on the business type and style. If critical info is missing (business name, website type), ask the user before proceeding.

---

## SEO & OPEN GRAPH

Every page must include in `<head>`:

### Meta Tags
- `<meta name="description" content="...">` — unique per page, 150–160 chars, includes primary keyword and value prop.
- `<meta name="keywords" content="...">` — 5–8 relevant keywords based on business type and location.
- `<link rel="canonical" href="...">` — self-referencing canonical URL on every page.

### Open Graph (Social Sharing)
```html
<meta property="og:title" content="Page Title — Business Name">
<meta property="og:description" content="Same as meta description or slightly more conversational">
<meta property="og:image" content="asset/og-image.jpg">
<meta property="og:url" content="https://example.com/page">
<meta property="og:type" content="website">
<meta property="og:locale" content="en_US">
```

### Twitter Card
```html
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="Page Title — Business Name">
<meta name="twitter:description" content="Short description">
<meta name="twitter:image" content="asset/og-image.jpg">
```

### Rules
- Write unique title tags per page: `Page Name — Business Name` (under 60 chars).
- OG image should be 1200×630px. Use a placeholder with `<!-- REPLACE: OG share image -->` if no real image exists.
- If a Google Business URL is provided, include LocalBusiness JSON-LD structured data:
```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": "Business Name",
  "address": { ... },
  "telephone": "...",
  "openingHours": "...",
  "image": "...",
  "url": "..."
}
</script>
```
- For restaurants/cafés, use `"@type": "Restaurant"` or `"CafeOrCoffeeShop"` instead.
- Structured data fields should match the client brief and Google Business data if available.

---

## LEGAL FOOTER

Every website must include a footer with:
- © [year] [business name]. All rights reserved.
- Privacy Policy link (placeholder `#privacy` unless a real URL is provided).
- Terms of Service link (placeholder `#terms` unless a real URL is provided).
- If the site collects any data (contact form, newsletter signup, booking), add a brief one-liner: "We respect your privacy. Your information is never shared."
- Cookie consent is NOT required unless the brief specifies analytics/tracking.

---

## TRUST & SOCIAL PROOF

When the business type benefits from social proof (cafés, restaurants, e-commerce, SaaS, agencies, services, local businesses), include a testimonials or reviews section:
- 3–5 short customer quotes with name and context (e.g. "— Sarah, regular since 2022").
- Star ratings if applicable.
- "As seen in" or partner logos if the brief mentions press/partnerships.
- Google review rating badge if a Google Business URL is provided.
- Write realistic placeholder testimonials based on the brand voice — mark them with `<!-- REPLACE: real customer review -->` so the client knows to swap them.
- Skip this section only for portfolios, personal sites, or when the brief explicitly says no social proof.

---

## GOOGLE BUSINESS INTEGRATION

If a Google Business URL or Place ID is provided in the client brief:

### Business Info Extraction
- Use `WebFetch` to pull the Google Business page.
- Extract: business name, address, phone, hours, rating, review count, categories, photos URL.
- Use this data to auto-populate the website — contact section, hours, footer, map location.
- If extracted data conflicts with the client brief, the brief wins.

### Google Maps Embed
- When the business has a physical location, embed a Google Map in the location/contact section.
- Use the Google Maps Embed API: `https://www.google.com/maps/embed/v1/place?key=API_KEY&q=PLACE_NAME_OR_ADDRESS`
- If no API key is available, use a static map placeholder with a "Get Directions" link to `https://www.google.com/maps/search/?api=1&query=ADDRESS`.
- Style the map container to match the site — rounded corners, translucent border, no hard edges.
- On mobile, make the map full-width with a minimum height of 250px.
- Skip the map for online-only businesses (SaaS, digital products, portfolios) unless the brief requests it.

### Client Brief Field
Add these to the client brief template:
```
GOOGLE BUSINESS URL:  ___ (paste full Google Maps/Business link, or "none")
GOOGLE MAPS API KEY:  ___ (if available, or "none" for static fallback)
```

---

## HIGGSFIELD (OPTIONAL)

When requested to use Higgsfield for asset generation:
- Generate images or videos using the Higgsfield MCP tools (`generate_image`, `generate_video`, `generate_audio`).
- Save all generated assets to the `asset/` folder.
- Name each file descriptively based on what it depicts — e.g. `hero-cafe-interior.mp4`, `latte-art-overhead.jpg`, `barista-roasting.jpg`. No generic names like `image1.jpg` or `output.mp4`.
- The filename should be self-explanatory so it's easy to reference in HTML/CSS without guessing what it contains.
- After generating, update the corresponding `<!-- REPLACE: [description] -->` placeholders in the code with the actual asset paths.
- For web media URLs provided by the user, use `media_import_url` first, then pass the returned `media_id` to generation — never pass raw URLs.
- For local uploads from the user, use `media_upload_widget`.

---

## IMPORTANT NOTES

- Never autoplay the video as a `<video>` element for the scroll section — the entire point is frame-by-frame scroll control.
- The hero section CAN use a looping `<video>` with `autoplay muted loop playsinline`.
- Scrolling UP must scrub the video BACKWARDS.
- Frame 1 must show on page load before any scroll.
- Use `poster` or first frame as static fallback while loading.
- On mobile: consider using fewer frames (every 2nd or 3rd) or a static hero fallback.
