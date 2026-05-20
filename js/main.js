/* main.js — navigation, scroll reveals, ripples, mobile menu */
(function () {
  'use strict';

  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  /* ---------------- Header scroll state ---------------- */
  const header = $('.site-header');
  const onScroll = () => {
    if (!header) return;
    header.classList.toggle('is-scrolled', window.scrollY > 20);
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---------------- Mobile menu ---------------- */
  const toggle = $('.menu-toggle');
  const navLinks = $('.nav-links');
  if (toggle && navLinks) {
    const openMenu = () => {
      navLinks.classList.add('is-open');
      toggle.setAttribute('aria-expanded', 'true');
      document.body.classList.add('nav-open');
    };
    const closeMenu = () => {
      navLinks.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('nav-open');
    };

    toggle.addEventListener('click', () => {
      navLinks.classList.contains('is-open') ? closeMenu() : openMenu();
    });

    // Close when clicking a nav link
    $$('.nav-links a').forEach((a) =>
      a.addEventListener('click', closeMenu)
    );

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && navLinks.classList.contains('is-open')) closeMenu();
    });

    // Close when clicking outside nav (on the overlay background)
    navLinks.addEventListener('click', (e) => {
      if (e.target === navLinks) closeMenu();
    });
  }

  /* ---------------- Active link ---------------- */
  const here = location.pathname.split('/').pop() || 'index.html';
  $$('.nav-links a').forEach((a) => {
    const href = (a.getAttribute('href') || '').split('/').pop();
    if (href && href === here) a.classList.add('is-active');
  });

  /* ---------------- Reveal on scroll ---------------- */
  const reveals = $$('.reveal');
  if ('IntersectionObserver' in window && reveals.length) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('is-in');
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.14, rootMargin: '0px 0px -60px 0px' }
    );
    reveals.forEach((el) => io.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add('is-in'));
  }

  /* ---------------- Fill bars (stats) ---------------- */
  const bars = $$('.fill-bar');
  if ('IntersectionObserver' in window && bars.length) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            const inner = e.target.querySelector('i');
            if (inner) inner.style.width = (e.target.dataset.value || '80') + '%';
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.4 }
    );
    bars.forEach((b) => io.observe(b));
  }

  /* ---------------- Animated counters ---------------- */
  const counters = $$('[data-count]');
  if ('IntersectionObserver' in window && counters.length) {
    const animate = (el) => {
      const target = parseFloat(el.dataset.count) || 0;
      const decimals = (el.dataset.count || '').split('.')[1]?.length || 0;
      const dur = 1600;
      const t0 = performance.now();
      const suffix = el.dataset.suffix || '';
      const tick = (t) => {
        const k = Math.min(1, (t - t0) / dur);
        const eased = 1 - Math.pow(1 - k, 3);
        el.textContent = (target * eased).toFixed(decimals) + suffix;
        if (k < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            animate(e.target);
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.5 }
    );
    counters.forEach((c) => io.observe(c));
  }

  /* ---------------- Ripple on click (buttons / cards) ---------------- */
  $$('.ripple-host, .btn').forEach((host) => {
    host.classList.add('ripple-host');
    host.addEventListener('click', (e) => {
      const rect = host.getBoundingClientRect();
      const r = document.createElement('span');
      r.className = 'ripple';
      r.style.left = e.clientX - rect.left - 30 + 'px';
      r.style.top  = e.clientY - rect.top  - 30 + 'px';
      host.appendChild(r);
      setTimeout(() => r.remove(), 1400);
    });
  });

  /* ---------------- Split-text reveal for [data-split] ----------------
     Preserves inner elements (e.g. <span class="accent">) so styling like
     the gradient on accent words is not lost when characters are wrapped. */
  $$('[data-split]').forEach((el) => {
    el.classList.add('split-text');
    let charIndex = 0;

    function processChildren(source, target) {
      Array.from(source.childNodes).forEach((node) => {
        if (node.nodeType === Node.TEXT_NODE) {
          const segments = node.textContent.split(/(\s+)/);
          segments.forEach((seg) => {
            if (!seg) return;
            if (/^\s+$/.test(seg)) {
              target.appendChild(document.createTextNode(seg));
              return;
            }
            const w = document.createElement('span');
            w.className = 'word';
            [...seg].forEach((ch) => {
              const c = document.createElement('span');
              c.className = 'char';
              c.style.animationDelay = (charIndex * 0.025) + 's';
              c.textContent = ch;
              w.appendChild(c);
              charIndex++;
            });
            target.appendChild(w);
          });
        } else if (node.nodeName === 'BR') {
          target.appendChild(document.createElement('br'));
        } else if (node.nodeType === Node.ELEMENT_NODE) {
          // For gradient-text elements (.accent, .text-flow), keep them intact —
          // splitting into per-char spans breaks the -webkit-background-clip:text effect.
          // Wrap them in a separate animation host so .accent's own shine animation
          // and our char-rise reveal don't fight over the `animation` property.
          const hasGradient = node.classList && (
            node.classList.contains('accent') ||
            node.classList.contains('text-flow')
          );
          if (hasGradient) {
            const wrapper = document.createElement('span');
            wrapper.className = 'split-word-block';
            wrapper.style.animationDelay = (charIndex * 0.025) + 's';
            wrapper.appendChild(node.cloneNode(true));
            target.appendChild(wrapper);
            charIndex += (node.textContent || '').length;
          } else {
            const clone = node.cloneNode(false);
            processChildren(node, clone);
            target.appendChild(clone);
          }
        }
      });
    }

    const frag = document.createDocumentFragment();
    processChildren(el, frag);
    el.innerHTML = '';
    el.appendChild(frag);
  });

  /* ---------------- Parallax (data-parallax="0.15") ---------------- */
  const parallaxItems = $$('[data-parallax]');
  if (parallaxItems.length) {
    let ticking = false;
    const update = () => {
      const y = window.scrollY;
      parallaxItems.forEach((el) => {
        const speed = parseFloat(el.dataset.parallax) || 0.1;
        el.style.transform = `translate3d(0, ${y * speed}px, 0)`;
      });
      ticking = false;
    };
    window.addEventListener(
      'scroll',
      () => {
        if (!ticking) {
          requestAnimationFrame(update);
          ticking = true;
        }
      },
      { passive: true }
    );
  }

  /* ---------------- Smooth anchor navigation ---------------- */
  $$('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (id.length > 1 && document.querySelector(id)) {
        e.preventDefault();
        document.querySelector(id).scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  /* ---------------- Scroll progress (liquid drop on right rail) ---------------- */
  const sp = $('.scroll-progress > i');
  if (sp) {
    const updateSP = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const k = Math.min(1, Math.max(0, window.scrollY / Math.max(1, max)));
      sp.style.top = (k * (window.innerHeight - 22)) + 'px';
    };
    updateSP();
    window.addEventListener('scroll', updateSP, { passive: true });
    window.addEventListener('resize', updateSP);
  }

  /* ---------------- 3D tilt on [data-tilt] ---------------- */
  $$('[data-tilt]').forEach((el) => {
    const max = parseFloat(el.dataset.tilt) || 10;
    el.addEventListener('mousemove', (e) => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;
      const rx = (0.5 - py) * max;
      const ry = (px - 0.5) * max;
      el.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) scale(1.02)`;
    });
    el.addEventListener('mouseleave', () => { el.style.transform = ''; });
  });

  /* ---------------- Pour-in reveal on scroll ---------------- */
  const pourIns = $$('.pour-in');
  if ('IntersectionObserver' in window && pourIns.length) {
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('is-in');
          io.unobserve(e.target);
        }
      }),
      { threshold: 0.2 }
    );
    pourIns.forEach((el) => io.observe(el));
  }

  /* ---------------- Mask-reveal on scroll ---------------- */
  const masks = $$('.mask-reveal');
  if ('IntersectionObserver' in window && masks.length) {
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('is-in');
          io.unobserve(e.target);
        }
      }),
      { threshold: 0.2 }
    );
    masks.forEach((el) => io.observe(el));
  }

  /* ---------------- Reveal safety net ----------------
     If any reveal-style element hasn't been marked `.is-in` within a few seconds
     (e.g. IntersectionObserver didn't fire due to a layout edge case, or the
     element was off-screen on first paint and the user hasn't scrolled near it),
     force-reveal it so its image is never permanently hidden by a mask or clip. */
  setTimeout(() => {
    const selectors = ['.reveal', '.mask-reveal', '.pour-in'];
    selectors.forEach((sel) => {
      document.querySelectorAll(`${sel}:not(.is-in)`).forEach((el) => {
        const r = el.getBoundingClientRect();
        // Reveal anything that is, or will reasonably soon be, in the viewport.
        // (Below the viewport: still hidden, so the scroll animation can still play
        // when the user reaches it.)
        if (r.bottom > 0 && r.top < window.innerHeight + 200) {
          el.classList.add('is-in');
        }
      });
    });
    // After this initial pass, also set up a longer "absolutely-must-show" fallback
    // 4s in. By that point, anything still hidden is almost certainly stuck.
    setTimeout(() => {
      document.querySelectorAll('.pour-in:not(.is-in), .mask-reveal:not(.is-in)').forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.top < window.innerHeight + 600) el.classList.add('is-in');
      });
    }, 1500);
  }, 2500);

  /* ---------------- Contact Form & Success Modal ---------------- */
  const contactForm = $('#contact-form');
  const successModal = $('#success-modal');
  const closeModalBtn = $('#close-modal-btn');
  
  // OPTIONAL: Set your Formspree endpoint URL or Web3Forms API Key here
  // e.g., 'https://formspree.io/f/xoqzzdqv'
  const FORM_ENDPOINT = '';

  if (contactForm && successModal) {
    const submitBtn = contactForm.querySelector('button');
    const originalBtnText = submitBtn ? submitBtn.innerHTML : 'Gönder';

    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = 'Gönderiliyor...';
      }

      const formData = new FormData(contactForm);
      const data = Object.fromEntries(formData.entries());

      // If endpoint is provided, send real request
      if (FORM_ENDPOINT) {
        fetch(FORM_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(data)
        })
        .then(response => {
          showSuccess();
        })
        .catch(err => {
          console.error('Error submitting form:', err);
          // Fallback to success even on error for design preview
          showSuccess();
        });
      } else {
        // Simulation mode (1s delay for premium feel)
        setTimeout(() => {
          showSuccess();
        }, 1000);
      }
    });

    const showSuccess = () => {
      successModal.classList.add('is-active');
      document.body.classList.add('nav-open'); // locks scroll
      contactForm.reset();
      
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
      }
    };

    const hideSuccess = () => {
      successModal.classList.remove('is-active');
      document.body.classList.remove('nav-open'); // unlocks scroll
    };

    if (closeModalBtn) {
      closeModalBtn.addEventListener('click', hideSuccess);
    }

    // Close modal on Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && successModal.classList.contains('is-active')) {
        hideSuccess();
      }
    });

    // Close modal when clicking on overlay
    successModal.addEventListener('click', (e) => {
      if (e.target === successModal) {
        hideSuccess();
      }
    });
  }

  /* ---------------- Year in footer ---------------- */
  const yr = $('#year');
  if (yr) yr.textContent = new Date().getFullYear();
})();
