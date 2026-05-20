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

      // If endpoint is provided, send real request (e.g. Formspree / Web3Forms)
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
          showSuccess();
        });
      } else {
        // Original site behavior: Redirect to mailto link
        const mailtoUrl = `mailto:info@oleastamina.com?subject=${encodeURIComponent("İletişim Formu: " + data.name)}&body=${encodeURIComponent("Ad Soyad: " + data.name + "\nE-posta: " + data.email + "\n\nMesaj:\n" + data.message)}`;
        
        // Open the user's local email client
        window.location.href = mailtoUrl;
        
        // Premium transition success modal delay
        setTimeout(() => {
          showSuccess();
        }, 800);
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

  /* ---------------- Growing Olive Tree Scroll Animation ---------------- */
  const initTreeScrollAnimation = () => {
    const treeSection = $('.growing-tree-section');
    if (!treeSection) return;

    const trunk = treeSection.querySelector('.trunk');
    const branchL1 = treeSection.querySelector('.branch-l1');
    const branchR1 = treeSection.querySelector('.branch-r1');
    const branchC = treeSection.querySelector('.branch-c');
    const branchL2 = treeSection.querySelector('.branch-l2');
    const branchR2 = treeSection.querySelector('.branch-r2');
    
    const blooms = treeSection.querySelectorAll('.tree-bloom');
    const progressBar = treeSection.querySelector('.tree-progress-bar');
    const milestones = treeSection.querySelectorAll('.tree-milestone');

    if (!trunk || !branchL1 || !branchR1 || !branchC || !branchL2 || !branchR2) return;

    let trunkLen = 180, branchL1Len = 160, branchR1Len = 160, branchCLen = 100, branchL2Len = 80, branchR2Len = 80;

    // Fetch exact SVG path lengths dynamically
    try {
      trunkLen = trunk.getTotalLength();
      branchL1Len = branchL1.getTotalLength();
      branchR1Len = branchR1.getTotalLength();
      branchCLen = branchC.getTotalLength();
      branchL2Len = branchL2.getTotalLength();
      branchR2Len = branchR2.getTotalLength();
    } catch (e) {
      console.warn("SVG getTotalLength not supported or failed:", e);
    }

    // Set initial dasharray & dashoffset for the SVG paths
    const setPathLengths = () => {
      trunk.style.strokeDasharray = trunkLen;
      trunk.style.strokeDashoffset = trunkLen;
      
      branchL1.style.strokeDasharray = branchL1Len;
      branchL1.style.strokeDashoffset = branchL1Len;
      
      branchR1.style.strokeDasharray = branchR1Len;
      branchR1.style.strokeDashoffset = branchR1Len;
      
      branchC.style.strokeDasharray = branchCLen;
      branchC.style.strokeDashoffset = branchCLen;
      
      branchL2.style.strokeDasharray = branchL2Len;
      branchL2.style.strokeDashoffset = branchL2Len;
      
      branchR2.style.strokeDasharray = branchR2Len;
      branchR2.style.strokeDashoffset = branchR2Len;
    };
    setPathLengths();

    const handleScroll = () => {
      const rect = treeSection.getBoundingClientRect();
      const windowHeight = window.innerHeight;

      // Animation starts when section top is 85% down the viewport,
      // and completes when section bottom is 15% up the viewport
      const startPoint = windowHeight * 0.85;
      const endPoint = windowHeight * 0.15;
      
      const totalScrollableHeight = rect.height + (startPoint - endPoint);
      const scrolled = startPoint - rect.top;
      
      let progress = scrolled / totalScrollableHeight;
      progress = Math.max(0, Math.min(1, progress));

      // 1. Update progress bar width
      if (progressBar) progressBar.style.width = `${progress * 100}%`;

      // 2. Trunk growth (Progress: 0.0 to 0.25)
      const trunkProgress = Math.max(0, Math.min(1, progress / 0.25));
      trunk.style.strokeDashoffset = trunkLen - (trunkLen * trunkProgress);

      // 3. Main branches growth (Progress: 0.20 to 0.55)
      const branchProgress = Math.max(0, Math.min(1, (progress - 0.20) / 0.35));
      branchL1.style.strokeDashoffset = branchL1Len - (branchL1Len * branchProgress);
      branchR1.style.strokeDashoffset = branchR1Len - (branchR1Len * branchProgress);
      branchC.style.strokeDashoffset = branchCLen - (branchCLen * branchProgress);

      // 4. Sub branches growth (Progress: 0.45 to 0.75)
      const subBranchProgress = Math.max(0, Math.min(1, (progress - 0.45) / 0.30));
      branchL2.style.strokeDashoffset = branchL2Len - (branchL2Len * subBranchProgress);
      branchR2.style.strokeDashoffset = branchR2Len - (branchR2Len * subBranchProgress);

      // 5. Staggered leaf and fruit bloom (Progress: 0.60 to 0.95)
      blooms.forEach((bloom, index) => {
        const staggerDelay = index * 0.03;
        const bloomProgress = Math.max(0, Math.min(1, (progress - 0.55 - staggerDelay) / 0.25));
        
        // Apply spring transform animation scale
        bloom.style.transform = `scale(${bloomProgress})`;
        bloom.style.opacity = bloomProgress;
      });

      // 6. Milestone text highlight state based on scroll thresholds
      milestones.forEach((milestone, index) => {
        const milestoneRangeStart = index * 0.25;
        const milestoneRangeEnd = (index + 1) * 0.25;
        
        if (progress >= milestoneRangeStart - 0.08 && progress <= milestoneRangeEnd + 0.08) {
          milestone.classList.add('is-active');
        } else {
          milestone.classList.remove('is-active');
        }
      });
    };

    window.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', () => {
      // Re-read lengths on resize if needed
      try {
        trunkLen = trunk.getTotalLength();
        branchL1Len = branchL1.getTotalLength();
        branchR1Len = branchR1.getTotalLength();
        branchCLen = branchC.getTotalLength();
        branchL2Len = branchL2.getTotalLength();
        branchR2Len = branchR2.getTotalLength();
        setPathLengths();
      } catch (e) {}
      handleScroll();
    });
    handleScroll();
  };
  initTreeScrollAnimation();

  /* ---------------- Year in footer ---------------- */
  const yr = $('#year');
  if (yr) yr.textContent = new Date().getFullYear();
})();
