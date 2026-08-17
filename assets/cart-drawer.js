/* VYRO — cart drawer: AJAX add/change/remove using Shopify Cart API + section rendering */
(function () {
  'use strict';

  var routes = window.routes || {};
  var drawer = document.querySelector('[data-cart-drawer]');
  var cartPage = document.querySelector('[data-cart-page]');
  var bubble = document.querySelector('[data-cart-count]');
  var cartType = document.body.getAttribute('data-cart-type') || 'drawer';

  function setLoading(el, isLoading) {
    if (!el) return;
    el.classList.toggle('visually-loading', isLoading);
    if (isLoading) {
      el.setAttribute('aria-busy', 'true');
    } else {
      el.removeAttribute('aria-busy');
    }
  }

  function openDrawer() {
    if (!drawer) return;
    drawer.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    var closeBtn = drawer.querySelector('[data-panel-close]');
    if (closeBtn) closeBtn.focus();
  }

  function closeDrawer() {
    if (!drawer) return;
    drawer.classList.remove('is-open');
    document.body.style.overflow = '';
  }

  function updateBubble(count) {
    if (!bubble) return;
    bubble.textContent = count;
    bubble.hidden = count === 0;
  }

  function parseSectionHtml(html, selector) {
    var doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.querySelector(selector);
  }

  function renderSection(url, selector, target) {
    if (!target) return Promise.resolve();
    return fetch(url)
      .then(function (res) {
        return res.text();
      })
      .then(function (html) {
        var fresh = parseSectionHtml(html, selector);
        if (fresh) target.innerHTML = fresh.innerHTML;
      });
  }

  function refreshCart(openAfter) {
    var tasks = [renderSection(routes.cartUrl + '?section_id=cart-drawer', '[data-cart-drawer]', drawer)];
    if (cartPage) {
      tasks.push(renderSection(routes.cartUrl + '?section_id=main-cart', '[data-cart-page]', cartPage));
    }

    Promise.all(tasks)
      .then(function () {
        return fetch(routes.cartUrl + '.js');
      })
      .then(function (res) {
        return res.json();
      })
      .then(function (cart) {
        updateBubble(cart.item_count);
        if (openAfter && cartType === 'drawer') openDrawer();
        if (openAfter && cartType === 'page') window.location.href = routes.cartUrl;
      })
      .catch(function () {
        /* silent fail; native cart page remains the fallback */
      });
  }

  function addToCart(id, quantity, sourceEl) {
    setLoading(sourceEl, true);
    fetch(routes.cartAddUrl + '.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ items: [{ id: id, quantity: quantity || 1 }] })
    })
      .then(function (res) {
        return res.json().then(function (data) {
          return { ok: res.ok, data: data };
        });
      })
      .then(function (result) {
        setLoading(sourceEl, false);
        if (!result.ok) {
          var message = (result.data && result.data.description) || window.cartStrings.error;
          window.dispatchEvent(new CustomEvent('cart:error', { detail: message }));
          return;
        }
        refreshCart(true);
      })
      .catch(function () {
        setLoading(sourceEl, false);
        window.dispatchEvent(new CustomEvent('cart:error', { detail: window.cartStrings.error }));
      });
  }

  function changeLine(line, quantity, sourceEl) {
    setLoading(sourceEl, true);
    fetch(routes.cartChangeUrl + '.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ line: line, quantity: quantity })
    })
      .then(function () {
        refreshCart(false);
      })
      .catch(function () {
        setLoading(sourceEl, false);
      });
  }

  /* Event delegation: quick add buttons anywhere on the page */
  document.addEventListener('click', function (e) {
    var addBtn = e.target.closest('[data-add-to-cart]');
    if (addBtn) {
      e.preventDefault();
      var variantId = addBtn.getAttribute('data-variant-id');
      if (variantId) addToCart(variantId, 1, addBtn);
      return;
    }

    var openBtn = e.target.closest('[data-cart-drawer-open]');
    if (openBtn) {
      e.preventDefault();
      openDrawer();
      return;
    }

    if (drawer && drawer.contains(e.target)) {
      var closeBtn = e.target.closest('[data-panel-close]');
      if (closeBtn || e.target.matches('[data-cart-drawer-overlay]')) {
        closeDrawer();
        return;
      }
    }

    /* Quantity/remove controls work inside the drawer AND the standalone cart page */
    var removeBtn = e.target.closest('[data-cart-remove]');
    if (removeBtn) {
      e.preventDefault();
      changeLine(parseInt(removeBtn.getAttribute('data-cart-remove'), 10), 0, removeBtn);
      return;
    }

    var step = e.target.closest('[data-quantity-step]');
    if (step) {
      var wrapper = step.closest('[data-cart-line]');
      if (wrapper) {
        var input = wrapper.querySelector('input[type="number"]');
        var next = Math.max(0, (parseInt(input.value, 10) || 1) + parseInt(step.getAttribute('data-quantity-step'), 10));
        changeLine(parseInt(wrapper.getAttribute('data-cart-line'), 10), next, step);
      }
    }
  });

  document.addEventListener('change', function (e) {
    var wrapper = e.target.closest('[data-cart-line]');
    if (wrapper && e.target.matches('input[type="number"]')) {
      var qty = Math.max(0, parseInt(e.target.value, 10) || 0);
      changeLine(parseInt(wrapper.getAttribute('data-cart-line'), 10), qty, e.target);
    }
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && drawer && drawer.classList.contains('is-open')) closeDrawer();
  });

  window.addEventListener('cart:refresh', function () {
    refreshCart(false);
  });

  window.VyroCart = { addToCart: addToCart, openDrawer: openDrawer, closeDrawer: closeDrawer };
})();
