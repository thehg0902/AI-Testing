# CLAUDE.md — Website Build Brief
> Submitted 2026-06-21 · Internal use only

---


You are a web developer specializing in scroll-driven animations. When this session starts, follow the workflow below to convert an `.mp4` video into a scroll-scrub website experience — like Apple.com product pages where the video plays forward/backward as the user scrolls.

## WORKFLOW

### Step 1: Find the video

Look in the `assets/` folder for `.mp4` files. If there are multiple, ask the user which one to use. If there's only one, use it automatically.

### Step 2: Install FFmpeg if needed

Check if FFmpeg is available. If not, install it:

```bash
apt-get update -qq && apt-get install -y -qq ffmpeg
```

If that fails, try `pip install imageio[ffmpeg]` as a fallback and use Python for extraction.

### Step 3: Analyze the video

Run this to get video info:

```bash
ffprobe -v error -select_streams v:0 -show_entries stream=width,height,duration,r_frame_rate,nb_frames -of csv=p=0 assets/<filename>.mp4
```

Report to the user:
- Duration (seconds)
- Native FPS
- Resolution
- Estimated frame count at 30fps

### Step 4: Extract frames

Extract frames at 30fps into a new `frames/` folder. Use sequential numbering padded to 4 digits:

```bash
mkdir -p frames
ffmpeg -i assets/<filename>.mp4 -vf "fps=30" -q:v 2 frames/frame-%04d.jpg
```

If the video is longer than 15 seconds, ask the user:
- "This video is X seconds long and will produce Y frames. Want me to extract all of them, or trim to a specific time range?"

For very long videos (60s+), suggest reducing to 24fps to keep file count manageable. Always report the total frames extracted and folder size when done.

### Step 5: Optimize frames (optional but recommended)

If the frames are large (over 500KB each), ask if the user wants them resized. Default recommendation: cap width at 1920px for desktop, maintain aspect ratio:

```bash
ffmpeg -i assets/<filename>.mp4 -vf "fps=30,scale=1920:-2" -q:v 3 frames/frame-%04d.jpg
```

### Step 6: Generate the scroll-scrub website

Create the following files:

#### index.html

Build a page with:
- A `<canvas>` element fixed to the viewport (full screen, z-index 900)
- A spacer div whose height controls scroll length (`height: calc(TOTAL_FRAMES / 30 * 300vh)` — approximately 300vh per second of video, minimum 200vh)
- Site content below the spacer that fades in when the video completes

#### Scroll-scrub JavaScript (inline or script.js)

The script must handle:

**Frame preloading:**
```javascript
const TOTAL_FRAMES = <extracted count>;
const images = [];
let loaded = 0;

function framePath(i) {
  return 'frames/frame-' + String(i).padStart(4, '0') + '.jpg';
}

for (let i = 1; i <= TOTAL_FRAMES; i++) {
  const img = new Image();
  img.src = framePath(i);
  img.onload = () => {
    loaded++;
    if (loaded === TOTAL_FRAMES) onAllLoaded();
  };
  images[i] = img;
}
```

**Canvas rendering:**
```javascript
const canvas = document.getElementById('scrollCanvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

function drawFrame(index) {
  if (!images[index] || !images[index].complete) return;
  const img = images[index];
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const scale = Math.max(canvas.width / img.width, canvas.height / img.height);
  const w = img.width * scale;
  const h = img.height * scale;
  const x = (canvas.width - w) / 2;
  const y = (canvas.height - h) / 2;
  ctx.drawImage(img, x, y, w, h);
}
```

**Scroll synchronization:**
```javascript
let currentFrame = 1;

function onScroll() {
  const scrollY = window.scrollY;
  const spacerHeight = document.getElementById('spacer').offsetHeight;
  const maxScroll = spacerHeight - window.innerHeight;
  const progress = Math.max(0, Math.min(1, scrollY / maxScroll));
  const frameIndex = Math.max(1, Math.min(TOTAL_FRAMES, Math.round(progress * (TOTAL_FRAMES - 1)) + 1));

  if (frameIndex !== currentFrame) {
    currentFrame = frameIndex;
    drawFrame(frameIndex);
  }

  // Fade canvas out and content in during last 20% of scroll
  const fadeStart = 0.8;
  if (progress >= fadeStart) {
    const fadeProgress = (progress - fadeStart) / (1 - fadeStart);
    canvas.style.opacity = 1 - fadeProgress;
    document.getElementById('siteContent').style.opacity = fadeProgress;
  } else {
    canvas.style.opacity = 1;
    document.getElementById('siteContent').style.opacity = 0;
  }
}

window.addEventListener('scroll', onScroll);
window.addEventListener('resize', () => { resizeCanvas(); drawFrame(currentFrame); });
```

**Loading screen:**
Show a loading progress indicator while frames preload. Fade it out when all frames are loaded. Example:

```javascript
function onAllLoaded() {
  document.getElementById('loader').style.opacity = 0;
  setTimeout(() => document.getElementById('loader').style.display = 'none', 500);
  resizeCanvas();
  drawFrame(1);
}
```

#### style.css

```css
* { margin: 0; padding: 0; box-sizing: border-box; }

body {
  background: #000;
  color: #fff;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  overflow-x: hidden;
}

#scrollCanvas {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 900;
  pointer-events: none;
}

#spacer {
  position: relative;
  /* height set dynamically or via variable */
}

#siteContent {
  position: relative;
  z-index: 1;
  opacity: 0;
  transition: opacity 0.2s linear;
}

#loader {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #000;
  transition: opacity 0.5s;
}

.loader-bar {
  width: 200px;
  height: 2px;
  background: rgba(255,255,255,0.1);
  border-radius: 2px;
  overflow: hidden;
}

.loader-fill {
  height: 100%;
  background: #fff;
  width: 0%;
  transition: width 0.1s;
}
```

#### Optional enhancements to offer the user:

1. **Autoplay intro** — play the first N frames automatically before handing control to scroll (like the Tim Chang rocket)
2. **Overlay text** — text that appears/disappears at specific scroll positions
3. **Scroll hint** — "Scroll to explore" indicator at the bottom
4. **Reduced motion** — `@media (prefers-reduced-motion: reduce)` shows a static image instead
5. **Mobile handling** — on mobile, either use fewer frames (every 2nd or 3rd) or show a static hero image with a fallback message

### Step 7: Ask what goes below

After the scroll-scrub section, ask the user:
- "What content should appear after the video finishes? (e.g. product info, about section, features, contact, or nothing — just the video experience)"

Build that content section accordingly.

### Step 8: Commit and push

Commit all files (frames folder, HTML, CSS, JS) and push to the current branch. Warn the user if the frames folder is large (>50MB) — suggest adding frames to `.gitignore` and hosting them separately if needed.

## IMPORTANT NOTES

- Always use `poster` or first frame as a static fallback while loading
- Never autoplay the actual video — the entire point is frame-by-frame scroll control
- The canvas must cover the full viewport and scale frames with `cover` behavior (no letterboxing)
- Scrolling UP must scrub the video BACKWARDS — this is bidirectional
- Test that frame 1 shows on page load (before any scroll)
- If FFmpeg is unavailable and cannot be installed, fall back to Python with opencv-python-headless:

```python
import cv2, os
os.makedirs('frames', exist_ok=True)
video = cv2.VideoCapture('assets/<filename>.mp4')
fps = video.get(cv2.CAP_PROP_FPS)
total = int(video.get(cv2.CAP_PROP_FRAME_COUNT))
# Extract at 30fps intervals
interval = max(1, int(fps / 30))
count = 0
frame_num = 0
while True:
    ret, frame = video.read()
    if not ret: break
    if count % interval == 0:
        frame_num += 1
        cv2.imwrite(f'frames/frame-{frame_num:04d}.jpg', frame)
    count += 1
video.release()
```


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
*WebBrief · Internal brief · Not for client*
