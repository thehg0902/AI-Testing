/* ===== Brewed & Co. — Main Script ===== */
(function () {
  'use strict';

  /* ----- Scroll-Scrub Canvas ----- */
  const canvas = document.getElementById('scroll-canvas');
  const ctx = canvas ? canvas.getContext('2d') : null;
  const TOTAL_FRAMES = 240;
  const frames = [];
  let loadedCount = 0;
  let currentFrame = 0;

  function resizeCanvas() {
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    drawFrame(currentFrame);
  }

  function drawFrame(index) {
    if (!ctx || !frames[index]) return;
    const img = frames[index];
    const cw = canvas.width;
    const ch = canvas.height;
    const iw = img.naturalWidth || img.width;
    const ih = img.naturalHeight || img.height;
    const scale = Math.max(cw / iw, ch / ih);
    const w = iw * scale;
    const h = ih * scale;
    ctx.clearRect(0, 0, cw, ch);
    ctx.drawImage(img, (cw - w) / 2, (ch - h) / 2, w, h);
  }

  function preloadFrames() {
    const loader = document.getElementById('loader');
    const barFill = document.getElementById('loader-bar-fill');
    const percent = document.getElementById('loader-percent');

    for (let i = 1; i <= TOTAL_FRAMES; i++) {
      const img = new Image();
      img.src = `frames/frame-${String(i).padStart(4, '0')}.jpg`;
      img.onload = function () {
        loadedCount++;
        const pct = Math.round((loadedCount / TOTAL_FRAMES) * 100);
        if (barFill) barFill.style.width = pct + '%';
        if (percent) percent.textContent = pct + '%';
        if (loadedCount === 1) {
          resizeCanvas();
          drawFrame(0);
        }
        if (loadedCount === TOTAL_FRAMES) {
          setTimeout(function () {
            if (loader) loader.classList.add('hidden');
            document.body.classList.add('loaded');
            animateHero();
          }, 400);
        }
      };
      img.onerror = img.onload;
      frames[i - 1] = img;
    }
  }

  /* ----- Scroll Sync ----- */
  let ticking = false;

  function onScroll() {
    if (!ticking) {
      requestAnimationFrame(updateCanvas);
      ticking = true;
    }
  }

  function updateCanvas() {
    ticking = false;
    if (!canvas) return;

    const scrollTop = window.scrollY;
    const heroSpacer = document.querySelector('.hero-spacer');
    if (!heroSpacer) return;

    const spacerTop = heroSpacer.offsetTop;
    const spacerHeight = heroSpacer.offsetHeight;
    const progress = Math.max(0, Math.min(1, (scrollTop - spacerTop + window.innerHeight) / spacerHeight));
    const frameIndex = Math.min(TOTAL_FRAMES - 1, Math.max(0, Math.floor(progress * (TOTAL_FRAMES - 1))));

    if (frameIndex !== currentFrame) {
      currentFrame = frameIndex;
      drawFrame(currentFrame);
    }

    updateScrollProgress();
    updateParallax(scrollTop);
    updateScrollHint(scrollTop);
    updateNav(scrollTop);
    updateScrubText(scrollTop);
  }

  /* ----- Scroll Progress Bar ----- */
  function updateScrollProgress() {
    const bar = document.querySelector('.scroll-progress');
    if (!bar) return;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const pct = docHeight > 0 ? (window.scrollY / docHeight) * 100 : 0;
    bar.style.width = pct + '%';
  }

  /* ----- Hero Parallax ----- */
  function updateParallax(scrollTop) {
    const heroContent = document.querySelector('.hero-content');
    if (!heroContent) return;
    if (scrollTop > window.innerHeight) return;
    heroContent.style.transform = `translateY(${scrollTop * 0.4}px)`;
    heroContent.style.opacity = Math.max(0, 1 - scrollTop / (window.innerHeight * 0.6));
  }

  /* ----- Scroll Hint ----- */
  let hintHidden = false;
  function updateScrollHint(scrollTop) {
    if (hintHidden) return;
    const hint = document.querySelector('.scroll-hint');
    if (!hint) return;
    if (scrollTop > 80) {
      hint.classList.add('hidden');
      hintHidden = true;
    }
  }

  /* ----- Scrub Text ----- */
  function updateScrubText(scrollTop) {
    var track = document.querySelector('.scrub-text-track');
    if (!track) return;

    var heroSpacer = document.querySelector('.hero-spacer');
    if (!heroSpacer) return;

    var spacerTop = heroSpacer.offsetTop;
    var spacerHeight = heroSpacer.offsetHeight;
    var enterStart = spacerTop;
    var exitEnd = spacerTop + spacerHeight;
    var progress = (scrollTop - enterStart) / (exitEnd - enterStart);

    if (progress < 0.05 || progress > 0.95) {
      track.classList.remove('active');
      track.querySelectorAll('.scrub-text-word').forEach(function (w) {
        w.classList.remove('visible');
        w.classList.remove('fade-out');
      });
      return;
    }

    track.classList.add('active');

    var words = track.querySelectorAll('.scrub-text-word');
    var wordCount = words.length;

    words.forEach(function (word, i) {
      var wordStart = 0.08 + (i * 0.18);
      var wordPeak = wordStart + 0.12;
      var fadeStart = 0.72;

      if (progress >= fadeStart) {
        word.classList.remove('visible');
        word.classList.add('fade-out');
      } else if (progress >= wordPeak) {
        word.classList.add('visible');
        word.classList.remove('fade-out');
      } else if (progress >= wordStart) {
        word.classList.add('visible');
        word.classList.remove('fade-out');
      } else {
        word.classList.remove('visible');
        word.classList.remove('fade-out');
      }
    });
  }

  /* ----- Nav State ----- */
  function updateNav(scrollTop) {
    const nav = document.querySelector('.nav');
    if (!nav) return;
    nav.classList.toggle('scrolled', scrollTop > 50);
  }

  /* ----- Hero Entrance Animation ----- */
  function animateHero() {
    const h1 = document.querySelector('.hero-content h1');
    const p = document.querySelector('.hero-content > p');
    const cta = document.querySelector('.hero-cta');

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      [h1, p, cta].forEach(function (el) {
        if (el) { el.style.opacity = '1'; el.style.transform = 'none'; }
      });
      return;
    }

    function reveal(el, delay) {
      if (!el) return;
      setTimeout(function () {
        el.style.transition = 'opacity 0.8s cubic-bezier(0.0,0,0.2,1), transform 0.8s cubic-bezier(0.0,0,0.2,1)';
        el.style.opacity = '1';
        el.style.transform = 'translateY(0)';
      }, delay);
    }

    reveal(h1, 100);
    reveal(p, 250);
    reveal(cta, 550);
  }

  /* ----- Intersection Observer — Reveal ----- */
  function setupRevealObserver() {
    if (!('IntersectionObserver' in window)) {
      document.querySelectorAll('.reveal').forEach(function (el) {
        el.classList.add('visible');
      });
      return;
    }

    const observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    document.querySelectorAll('.reveal').forEach(function (el) {
      observer.observe(el);
    });
  }

  /* ----- Mobile Menu ----- */
  function setupMobileMenu() {
    const btn = document.querySelector('.nav-hamburger');
    const menu = document.querySelector('.mobile-menu');
    if (!btn || !menu) return;

    btn.addEventListener('click', function () {
      btn.classList.toggle('open');
      menu.classList.toggle('open');
      document.body.style.overflow = menu.classList.contains('open') ? 'hidden' : '';
    });

    menu.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        btn.classList.remove('open');
        menu.classList.remove('open');
        document.body.style.overflow = '';
      });
    });
  }

  /* ----- Custom Cursor ----- */
  function setupCursor() {
    if (window.matchMedia('(pointer: coarse)').matches) return;

    const dot = document.createElement('div');
    dot.className = 'cursor-dot';
    const ring = document.createElement('div');
    ring.className = 'cursor-ring';
    document.body.appendChild(dot);
    document.body.appendChild(ring);

    let mx = -100, my = -100;
    let rx = -100, ry = -100;

    document.addEventListener('mousemove', function (e) {
      mx = e.clientX;
      my = e.clientY;
      dot.style.left = mx + 'px';
      dot.style.top = my + 'px';
    });

    function animateRing() {
      rx += (mx - rx) * 0.15;
      ry += (my - ry) * 0.15;
      ring.style.left = rx + 'px';
      ring.style.top = ry + 'px';
      requestAnimationFrame(animateRing);
    }
    animateRing();

    document.querySelectorAll('a, button, .drink-card, .testimonial-card, .menu-item').forEach(function (el) {
      el.addEventListener('mouseenter', function () { ring.classList.add('hover'); });
      el.addEventListener('mouseleave', function () { ring.classList.remove('hover'); });
    });
  }

  /* ----- Page Transitions ----- */
  function setupPageTransitions() {
    const transition = document.querySelector('.page-transition');
    if (!transition) return;

    document.querySelectorAll('a[href]').forEach(function (link) {
      const href = link.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('http') || href.startsWith('mailto') || href.startsWith('tel')) return;

      link.addEventListener('click', function (e) {
        e.preventDefault();
        transition.classList.add('active');
        setTimeout(function () {
          window.location.href = href;
        }, 350);
      });
    });
  }

  /* ----- Smooth scroll for anchor links ----- */
  function setupSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(function (link) {
      link.addEventListener('click', function (e) {
        const target = document.querySelector(link.getAttribute('href'));
        if (!target) return;
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
  }

  /* ----- Init ----- */
  function init() {
    if (canvas) {
      preloadFrames();
      window.addEventListener('resize', resizeCanvas);
    } else {
      document.body.classList.add('loaded');
      const loader = document.getElementById('loader');
      if (loader) loader.classList.add('hidden');
      animateHero();
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    setupRevealObserver();
    setupMobileMenu();
    setupCursor();
    setupPageTransitions();
    setupSmoothScroll();

    updateNav(window.scrollY);
    updateScrollProgress();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
