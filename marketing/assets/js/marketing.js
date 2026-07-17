// Cupola marketing page — progressive enhancement only.
// Without this file the page renders complete and static: every motion rule
// in marketing.css is gated on the `js` class set on <html> below.
(function () {
  'use strict';

  document.documentElement.classList.add('js');

  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  // Nav backdrop: a zero-height sentinel at the top of the page tells us
  // whether the viewport has scrolled without a scroll listener.
  var nav = document.getElementById('nav');
  if (nav && 'IntersectionObserver' in window) {
    var sentinel = document.createElement('div');
    sentinel.setAttribute('aria-hidden', 'true');
    sentinel.style.cssText = 'position:absolute;top:0;height:1px;width:1px;';
    document.body.prepend(sentinel);
    new IntersectionObserver(function (entries) {
      nav.classList.toggle('is-scrolled', !entries[0].isIntersecting);
    }).observe(sentinel);
  }

  // Scroll reveals. Children of [data-stagger] get an incremental delay.
  var revealables = document.querySelectorAll('.mk-reveal');
  if ('IntersectionObserver' in window) {
    var revealObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-in');
          revealObserver.unobserve(entry.target);
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -10% 0px' }
    );
    revealables.forEach(function (el) {
      revealObserver.observe(el);
    });
  } else {
    revealables.forEach(function (el) {
      el.classList.add('is-in');
    });
  }

  document.querySelectorAll('[data-stagger]').forEach(function (parent) {
    Array.prototype.forEach.call(parent.children, function (child, i) {
      child.style.setProperty('--stagger-delay', Math.min(i * 70, 350) + 'ms');
    });
  });

  // Hero entrance is pure CSS; just release the will-change hint after it.
  document
    .querySelectorAll('.mk-hero-shot, .mk-hero-card')
    .forEach(function (el) {
      el.addEventListener(
        'animationend',
        function () {
          el.style.willChange = 'auto';
        },
        { once: true }
      );
    });

  // Gentle parallax on the hero offset cards. Skipped for reduced motion
  // and coarse pointers; transform stays composited (custom property only).
  var cards = document.querySelectorAll('.mk-hero-card');
  var stage = document.querySelector('.mk-hero-stage');
  var coarse = window.matchMedia('(pointer: coarse)');
  if (stage && cards.length && !reducedMotion.matches && !coarse.matches) {
    var ticking = false;
    var applyParallax = function () {
      ticking = false;
      var rect = stage.getBoundingClientRect();
      // -1 (stage below viewport) .. 1 (stage above viewport)
      var progress = 1 - (2 * (rect.top + rect.height / 2)) / Math.max(window.innerHeight, 1);
      var clamped = Math.max(-1, Math.min(1, progress));
      cards.forEach(function (card, i) {
        var direction = i === 0 ? 1 : -1;
        card.style.setProperty('--parallax-y', (clamped * 12 * direction).toFixed(1) + 'px');
      });
    };
    window.addEventListener(
      'scroll',
      function () {
        if (!ticking) {
          ticking = true;
          requestAnimationFrame(applyParallax);
        }
      },
      { passive: true }
    );
    applyParallax();
  }
})();
