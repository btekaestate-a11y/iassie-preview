/* Ebenezer Ethiopian Restaurant — site.js
   Motion per DECISIONS.md. All non-essential motion is skipped
   under prefers-reduced-motion; content is never hidden without JS. */

(function () {
  'use strict';

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasGSAP = typeof window.gsap !== 'undefined';

  document.querySelectorAll('#year').forEach(el => { el.textContent = new Date().getFullYear(); });

  /* ---------- nav ---------- */
  const nav = document.querySelector('.nav');
  const onScroll = () => nav && nav.classList.toggle('is-scrolled', window.scrollY > 40 || nav.classList.contains('force-scrolled'));
  onScroll();
  addEventListener('scroll', onScroll, { passive: true });

  const burger = document.querySelector('.nav__burger');
  const mobileMenu = document.getElementById('mobileMenu');
  if (burger && mobileMenu) {
    const setOpen = open => {
      burger.setAttribute('aria-expanded', String(open));
      burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      mobileMenu.classList.toggle('is-open', open);
      document.body.style.overflow = open ? 'hidden' : '';
    };
    burger.addEventListener('click', () => setOpen(burger.getAttribute('aria-expanded') !== 'true'));
    mobileMenu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => setOpen(false)));
    addEventListener('keydown', e => { if (e.key === 'Escape') setOpen(false); });
  }

  /* active-section indicator (homepage only) */
  const sectionLinks = [...document.querySelectorAll('.nav__link[href^="#"]')];
  if (sectionLinks.length && 'IntersectionObserver' in window) {
    const map = new Map();
    sectionLinks.forEach(l => {
      const sec = document.querySelector(l.getAttribute('href'));
      if (sec) map.set(sec, l);
    });
    const io = new IntersectionObserver(entries => entries.forEach(e => {
      if (e.isIntersecting) {
        sectionLinks.forEach(l => l.classList.remove('is-active'));
        const link = map.get(e.target);
        if (link) link.classList.add('is-active');
      }
    }), { rootMargin: '-40% 0px -55% 0px' });
    map.forEach((_, sec) => io.observe(sec));
  }

  /* ---------- marquee (CSS-free, rAF, pause on hover handled by CSS class) ---------- */
  const marquee = document.querySelector('[data-marquee]');
  if (marquee) {
    marquee.append(...[...marquee.children].map(n => n.cloneNode(true))); // duplicate for seamless loop
    if (!reducedMotion) {
      let x = 0, paused = false, last = performance.now();
      const half = () => marquee.scrollWidth / 2;
      marquee.addEventListener('mouseenter', () => paused = true);
      marquee.addEventListener('mouseleave', () => paused = false);
      marquee.addEventListener('focusin', () => paused = true);
      marquee.addEventListener('focusout', () => paused = false);
      const tick = now => {
        const dt = now - last; last = now;
        if (!paused) {
          x -= dt * 0.045;
          if (-x >= half()) x += half();
          marquee.style.transform = `translateX(${x}px)`;
        }
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }
  }

  /* ---------- magnetic CTA ---------- */
  if (!reducedMotion && matchMedia('(pointer: fine)').matches) {
    document.querySelectorAll('[data-magnetic]').forEach(btn => {
      const strength = 0.25;
      addEventListener('mousemove', e => {
        const r = btn.getBoundingClientRect();
        const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
        const d = Math.hypot(e.clientX - cx, e.clientY - cy);
        btn.style.transform = d < 130
          ? `translate(${(e.clientX - cx) * strength}px, ${(e.clientY - cy) * strength}px)`
          : '';
      }, { passive: true });
    });
  }

  /* ---------- GSAP choreography ---------- */
  if (hasGSAP && !reducedMotion) {
    gsap.registerPlugin(ScrollTrigger);

    // hero entrance
    gsap.from('.gs-hero', {
      opacity: 0, y: 34, duration: 0.9, ease: 'power3.out',
      stagger: 0.12, delay: 0.15,
    });

    // Ken Burns drift on hero media
    const kb = document.querySelector('[data-kenburns]');
    if (kb) {
      gsap.fromTo(kb, { scale: 1.02 }, { scale: 1.12, xPercent: -1.5, duration: 22, ease: 'none', repeat: -1, yoyo: true });
      // slight parallax on scroll
      gsap.to(kb, { yPercent: 10, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
    }

    // section reveals — grid-aware stagger (design-system preset: back.out(1.4), 300–450ms)
    gsap.set('.gs-reveal', { opacity: 0, y: 34, scale: 0.985 });
    ScrollTrigger.batch('.gs-reveal', {
      start: 'top 86%',
      once: true,
      onEnter: batch => gsap.to(batch, {
        opacity: 1, y: 0, scale: 1, duration: 0.45,
        stagger: { each: 0.07 }, ease: 'back.out(1.4)', overwrite: true,
      }),
    });
    // safety net: anything still hidden (edge cases at page bottom) becomes visible
    setTimeout(() => ScrollTrigger.refresh(), 400);

    // counters
    document.querySelectorAll('[data-count]').forEach(el => {
      const target = parseFloat(el.dataset.count);
      const decimals = parseInt(el.dataset.decimals || '0', 10);
      const obj = { v: 0 };
      gsap.to(obj, {
        v: target, duration: 1.6, ease: 'power2.out',
        scrollTrigger: { trigger: el, start: 'top 88%', once: true },
        onUpdate: () => { el.textContent = obj.v.toFixed(decimals); },
      });
    });

    // gentle parallax on tibeb dividers
    document.querySelectorAll('.tibeb').forEach(t => {
      gsap.fromTo(t, { backgroundPositionX: '0px' }, {
        backgroundPositionX: '112px', ease: 'none',
        scrollTrigger: { trigger: t, start: 'top bottom', end: 'bottom top', scrub: 1.5 },
      });
    });
  } else {
    // no GSAP or reduced motion: ensure everything is visible immediately
    document.querySelectorAll('.gs-reveal, .gs-hero').forEach(el => {
      el.style.opacity = ''; el.style.transform = '';
    });
    document.querySelectorAll('[data-count]').forEach(el => {
      const d = parseInt(el.dataset.decimals || '0', 10);
      el.textContent = parseFloat(el.dataset.count).toFixed(d);
    });
  }
})();
