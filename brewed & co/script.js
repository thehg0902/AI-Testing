(() => {
  const TOTAL_FRAMES = 240;
  const images = [];
  let loaded = 0;

  const canvas = document.getElementById('scrollCanvas');
  const ctx = canvas ? canvas.getContext('2d') : null;
  const scrollHint = document.getElementById('scrollHint');
  const nav = document.getElementById('nav');
  const hamburger = document.getElementById('hamburger');
  const navLinks = document.getElementById('navLinks');

  // Mobile menu
  if (hamburger) {
    hamburger.addEventListener('click', () => {
      hamburger.classList.toggle('active');
      navLinks.classList.toggle('open');
    });
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        hamburger.classList.remove('active');
        navLinks.classList.remove('open');
      });
    });
  }

  // Menu page — no canvas, just nav
  if (!canvas) {
    if (nav) nav.classList.add('scrolled');
    return;
  }

  function framePath(i) {
    return 'frames/frame-' + String(i).padStart(4, '0') + '.jpg';
  }

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

  let currentFrame = 1;
  let scrollHintHidden = false;

  function onScroll() {
    const scrollY = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = Math.max(0, Math.min(1, scrollY / docHeight));
    const frameIndex = Math.max(1, Math.min(TOTAL_FRAMES, Math.round(progress * (TOTAL_FRAMES - 1)) + 1));

    if (frameIndex !== currentFrame) {
      currentFrame = frameIndex;
      drawFrame(frameIndex);
    }

    // Nav style
    if (scrollY > 50) {
      nav.classList.add('scrolled');
    } else {
      nav.classList.remove('scrolled');
    }

    // Hide scroll hint
    if (!scrollHintHidden && scrollY > 30) {
      scrollHint.classList.add('hidden');
      scrollHintHidden = true;
    }
  }

  function onAllLoaded() {
    document.getElementById('loader').classList.add('done');
    setTimeout(() => { document.getElementById('loader').style.display = 'none'; }, 600);
    scrollHint.style.display = '';
    resizeCanvas();
    drawFrame(1);
  }

  // Preload frames
  for (let i = 1; i <= TOTAL_FRAMES; i++) {
    const img = new Image();
    img.src = framePath(i);
    img.onload = () => {
      loaded++;
      const pct = Math.round((loaded / TOTAL_FRAMES) * 100);
      document.getElementById('loaderFill').style.width = pct + '%';
      document.getElementById('loaderPercent').textContent = pct + '%';
      if (loaded === TOTAL_FRAMES) onAllLoaded();
    };
    img.onerror = () => {
      loaded++;
      if (loaded === TOTAL_FRAMES) onAllLoaded();
    };
    images[i] = img;
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', () => { resizeCanvas(); drawFrame(currentFrame); });
  resizeCanvas();
})();
