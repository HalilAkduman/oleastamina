/* liquid.js — liquid cursor, floating oil drops, gooey blob spawner */
(function () {
  'use strict';

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isCoarse = window.matchMedia('(pointer: coarse)').matches;
  if (prefersReduced) return;

  /* ---------------- Liquid cursor follower ---------------- */
  if (!isCoarse) {
    const cursor = document.createElement('div');
    cursor.className = 'liquid-cursor';
    document.body.appendChild(cursor);

    let tx = 0, ty = 0, cx = 0, cy = 0;

    window.addEventListener('mousemove', (e) => {
      tx = e.clientX;
      ty = e.clientY;
      cursor.classList.add('is-visible');
    }, { passive: true });

    window.addEventListener('mouseleave', () => cursor.classList.remove('is-visible'));

    const loop = () => {
      cx += (tx - cx) * 0.18;
      cy += (ty - cy) * 0.18;
      cursor.style.transform = `translate(${cx}px, ${cy}px) translate(-50%, -50%)`;
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);

    // Grow cursor on hoverables
    const hoverables = 'a, button, .btn, .card, .product-visual, .gallery > *';
    document.addEventListener('mouseover', (e) => {
      if (e.target.closest(hoverables)) cursor.classList.add('is-hover');
    });
    document.addEventListener('mouseout', (e) => {
      if (e.target.closest(hoverables)) cursor.classList.remove('is-hover');
    });
  }

  /* ---------------- Spawn floating oil drops ---------------- */
  const dropHosts = document.querySelectorAll('.oil-drops');
  dropHosts.forEach((host) => {
    const count = parseInt(host.dataset.count || '14', 10);
    for (let i = 0; i < count; i++) {
      const d = document.createElement('span');
      d.className = 'oil-drop';
      const size = 8 + Math.random() * 16;
      d.style.width  = size + 'px';
      d.style.height = size * 1.35 + 'px';
      d.style.left = Math.random() * 100 + '%';
      d.style.animationDuration = 6 + Math.random() * 10 + 's';
      d.style.animationDelay = -Math.random() * 12 + 's';
      d.style.opacity = 0.45 + Math.random() * 0.4;
      host.appendChild(d);
    }
  });

  /* ---------------- Magnetic effect on buttons ---------------- */
  document.querySelectorAll('[data-magnet]').forEach((el) => {
    el.addEventListener('mousemove', (e) => {
      const r = el.getBoundingClientRect();
      const x = e.clientX - r.left - r.width / 2;
      const y = e.clientY - r.top - r.height / 2;
      el.style.transform = `translate(${x * 0.15}px, ${y * 0.2}px)`;
    });
    el.addEventListener('mouseleave', () => { el.style.transform = ''; });
  });

  /* ---------------- Subtle background mouse-parallax (hero blobs) ---- */
  const blobs = document.querySelectorAll('[data-blob-track]');
  if (blobs.length) {
    let mx = 0, my = 0;
    window.addEventListener('mousemove', (e) => {
      mx = (e.clientX / window.innerWidth - 0.5) * 30;
      my = (e.clientY / window.innerHeight - 0.5) * 30;
    }, { passive: true });
    const tick = () => {
      blobs.forEach((b, i) => {
        const factor = (i + 1) * 0.4;
        b.style.translate = `${mx * factor}px ${my * factor}px`;
      });
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  /* ---------------- Mouse-following gradient orb (full page) -------- */
  if (!isCoarse) {
    const orb = document.querySelector('.mouse-orb');
    if (orb) {
      let ox = window.innerWidth / 2, oy = window.innerHeight / 2;
      let tx = ox, ty = oy;
      window.addEventListener('mousemove', (e) => { tx = e.clientX; ty = e.clientY; }, { passive: true });
      const tick = () => {
        ox += (tx - ox) * 0.06;
        oy += (ty - oy) * 0.06;
        orb.style.transform = `translate(${ox}px, ${oy}px) translate(-50%, -50%)`;
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }
  }

  /* ---------------- Cursor trail oil drops --------------------------- */
  if (!isCoarse) {
    let lastSpawn = 0;
    document.addEventListener('mousemove', (e) => {
      const now = performance.now();
      if (now - lastSpawn < 80) return;
      lastSpawn = now;
      const d = document.createElement('span');
      d.className = 'cursor-trail-drop';
      d.style.left = e.clientX + 'px';
      d.style.top = e.clientY + 'px';
      const s = 0.4 + Math.random() * 0.8;
      d.style.transform = `translate(-50%, -50%) scale(${s})`;
      document.body.appendChild(d);
      setTimeout(() => d.remove(), 1500);
    }, { passive: true });
  }

  /* ---------------- Sparkles in [data-sparkles] containers --------- */
  document.querySelectorAll('[data-sparkles]').forEach((host) => {
    const count = parseInt(host.dataset.sparkles || '8', 10);
    for (let i = 0; i < count; i++) {
      const s = document.createElement('span');
      s.className = 'sparkle';
      s.style.left = Math.random() * 100 + '%';
      s.style.top = Math.random() * 100 + '%';
      s.style.animationDelay = (-Math.random() * 3) + 's';
      s.style.animationDuration = (2 + Math.random() * 3) + 's';
      host.appendChild(s);
    }
  });

  /* ---------------- Bubbles ----------------------------------------- */
  document.querySelectorAll('[data-bubbles]').forEach((host) => {
    const count = parseInt(host.dataset.bubbles || '12', 10);
    for (let i = 0; i < count; i++) {
      const b = document.createElement('span');
      b.className = 'bubble';
      const size = 8 + Math.random() * 30;
      b.style.width = size + 'px';
      b.style.height = size + 'px';
      b.style.left = Math.random() * 100 + '%';
      b.style.bottom = -20 + 'px';
      b.style.animationDelay = (-Math.random() * 11) + 's';
      b.style.animationDuration = (7 + Math.random() * 9) + 's';
      host.appendChild(b);
    }
  });

  /* ---------------- Falling olive leaves (SVG, with wind sway) ---------- */
  // Each leaf is an SVG with a leaf body + center vein + a subtle backside tint
  // so when it rotates around X axis (via scaleX inversion) it reads as a real leaf.
  const leafSVG = `
    <svg viewBox="0 0 100 40" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
      <defs>
        <linearGradient id="leafGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"  stop-color="#7e9a3a"/>
          <stop offset="55%" stop-color="#5a7029"/>
          <stop offset="100%" stop-color="#3d4f2b"/>
        </linearGradient>
      </defs>
      <!-- Asymmetric olive leaf shape (pointed tip both ends, slim) -->
      <path d="M 2 20
               C 18 4, 60 0, 96 18
               C 88 22, 62 26, 30 24
               C 14 23, 6 22, 2 20 Z"
            fill="url(#leafGrad)"/>
      <!-- Center vein -->
      <path d="M 4 20 C 30 18, 60 18, 95 19" stroke="rgba(45,58,33,0.55)" stroke-width="0.7" fill="none"/>
      <!-- Tiny side veins -->
      <path d="M 22 21 q 2 -4 6 -6 M 40 22 q 2 -5 7 -7 M 58 22 q 2 -5 7 -7 M 72 21 q 2 -4 6 -5"
            stroke="rgba(45,58,33,0.25)" stroke-width="0.4" fill="none"/>
      <!-- Highlight (silvery underside hint near base) -->
      <path d="M 6 20 C 22 24, 50 25, 86 22" stroke="rgba(255,255,255,0.18)" stroke-width="0.6" fill="none"/>
    </svg>
  `;

  document.querySelectorAll('[data-leaves]').forEach((host) => {
    const count = parseInt(host.dataset.leaves || '6', 10);
    for (let i = 0; i < count; i++) {
      const l = document.createElement('div');
      l.className = 'leaf-fall';
      l.innerHTML = leafSVG;
      const w = 22 + Math.random() * 22;          // 22-44px wide
      l.style.width  = w + 'px';
      l.style.height = (w * 0.42) + 'px';          // keep leaf proportions
      l.style.left = Math.random() * 100 + '%';
      // Vary outer fall duration and inner sway/spin so each leaf moves differently
      l.style.animationDelay = (-Math.random() * 16) + 's';
      l.style.animationDuration = (12 + Math.random() * 10) + 's';
      const svg = l.querySelector('svg');
      if (svg) {
        svg.style.animationDelay = (-Math.random() * 5) + 's, ' + (-Math.random() * 6) + 's';
        svg.style.animationDuration = (3 + Math.random() * 3) + 's, ' + (4 + Math.random() * 4) + 's';
      }
      host.appendChild(l);
    }
  });

  /* ---------------- Side-rail falling drops -------------------------- */
  document.querySelectorAll('.side-rail').forEach((host) => {
    for (let i = 0; i < 7; i++) {
      const d = document.createElement('span');
      d.className = 'oil-drop oil-drop--fall';
      d.style.left = (10 + Math.random() * 40) + 'px';
      d.style.animationDelay = (-Math.random() * 12) + 's';
      d.style.animationDuration = (10 + Math.random() * 8) + 's';
      const sz = 8 + Math.random() * 14;
      d.style.width = sz + 'px';
      d.style.height = (sz * 1.4) + 'px';
      host.appendChild(d);
    }
  });
})();
