/* VYRO — global site behaviour: sticky header, mobile nav, search popover, scroll reveal, quantity steppers */
(function () {
  'use strict';

  /* Sticky header state */
  var header = document.querySelector('[data-site-header]');
  if (header) {
    var toggleScrolled = function () {
      header.classList.toggle('is-scrolled', window.scrollY > 4);
    };
    toggleScrolled();
    window.addEventListener('scroll', toggleScrolled, { passive: true });
  }

  /* Generic open/close panel controller (mobile nav, search popover) */
  function bindPanel(triggerSelector, panelSelector, closeSelector) {
    var panel = document.querySelector(panelSelector);
    if (!panel) return;
    var triggers = document.querySelectorAll(triggerSelector);
    var closers = panel.querySelectorAll(closeSelector);
    var lastFocused = null;

    function open() {
      lastFocused = document.activeElement;
      panel.classList.add('is-open');
      document.body.style.overflow = 'hidden';
      var focusable = panel.querySelector('input, button, a');
      if (focusable) focusable.focus();
      document.addEventListener('keydown', onKeydown);
    }

    function close() {
      panel.classList.remove('is-open');
      document.body.style.overflow = '';
      document.removeEventListener('keydown', onKeydown);
      if (lastFocused) lastFocused.focus();
    }

    function onKeydown(e) {
      if (e.key === 'Escape') close();
    }

    triggers.forEach(function (btn) {
      btn.addEventListener('click', function () {
        panel.classList.contains('is-open') ? close() : open();
      });
    });

    closers.forEach(function (el) {
      el.addEventListener('click', close);
    });

    panel.addEventListener('click', function (e) {
      if (e.target === panel) close();
    });
  }

  bindPanel('[data-mobile-nav-toggle]', '[data-mobile-nav]', '[data-panel-close], [data-mobile-nav-overlay]');
  bindPanel('[data-search-toggle]', '[data-search-popover]', '[data-panel-close], [data-search-overlay]');

  /* Scroll reveal */
  var animated = document.querySelectorAll('[data-animate]');
  if (animated.length && 'IntersectionObserver' in window) {
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
    );
    animated.forEach(function (el) {
      observer.observe(el);
    });
  } else {
    animated.forEach(function (el) {
      el.classList.add('is-visible');
    });
  }

  /* Quantity steppers — shared by cart drawer, cart page, product form */
  document.addEventListener('click', function (e) {
    var stepper = e.target.closest('[data-quantity-step]');
    if (!stepper) return;
    var wrapper = stepper.closest('.quantity-selector');
    var input = wrapper && wrapper.querySelector('input[type="number"]');
    if (!input) return;
    var step = parseInt(stepper.getAttribute('data-quantity-step'), 10);
    var min = parseInt(input.getAttribute('min') || '1', 10);
    var value = parseInt(input.value, 10) || min;
    var next = Math.max(min, value + step);
    if (input.value !== String(next)) {
      input.value = next;
      input.dispatchEvent(new Event('change', { bubbles: true }));
    }
  });
})();
