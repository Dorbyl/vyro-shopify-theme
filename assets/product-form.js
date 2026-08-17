/* VYRO — product page: variant selection, price/media sync, add to cart */
(function () {
  'use strict';

  function formatMoney(cents) {
    if (typeof window.Shopify !== 'undefined' && window.Shopify.formatMoney && window.moneyFormat) {
      return window.Shopify.formatMoney(cents, window.moneyFormat);
    }
    return (cents / 100).toFixed(2);
  }

  function resizeImage(src, width) {
    try {
      var url = new URL(src);
      url.searchParams.set('width', width);
      return url.toString();
    } catch (e) {
      return src;
    }
  }

  function initProductForm(root) {
    var dataEl = root.querySelector('[data-product-json]');
    if (!dataEl) return;
    var product = JSON.parse(dataEl.textContent);
    var form = root.querySelector('form[data-product-form]');
    var idInput = form.querySelector('input[name="id"]');
    var submitBtn = form.querySelector('[data-add-to-cart-submit]');
    var priceWrap = root.querySelector('[data-price-wrap]');
    var optionInputs = form.querySelectorAll('[data-option-position]');
    var mainImage = root.querySelector('[data-gallery-main-image]');
    var thumbs = root.querySelectorAll('[data-gallery-thumb]');
    var cartType = document.body.getAttribute('data-cart-type') || 'drawer';

    function getSelectedOptions() {
      var selected = [];
      optionInputs.forEach(function (group) {
        var checked = group.querySelector('input:checked, select');
        if (checked) selected[parseInt(group.getAttribute('data-option-position'), 10)] = checked.value;
      });
      return selected;
    }

    function findVariant(options) {
      return product.variants.find(function (variant) {
        return variant.options.every(function (val, i) {
          return val === options[i];
        });
      });
    }

    function setThumbActive(mediaId) {
      thumbs.forEach(function (thumb) {
        thumb.classList.toggle('is-active', thumb.getAttribute('data-gallery-thumb-id') === String(mediaId));
      });
    }

    function updateForVariant(variant) {
      if (!variant) {
        submitBtn.disabled = true;
        submitBtn.textContent = submitBtn.getAttribute('data-unavailable-label');
        return;
      }

      idInput.value = variant.id;

      if (priceWrap) {
        var regular = priceWrap.querySelector('[data-price-regular]');
        var compare = priceWrap.querySelector('[data-price-compare]');
        var onSale = variant.compare_at_price && variant.compare_at_price > variant.price;
        priceWrap.classList.toggle('price--on-sale', !!onSale);
        if (regular) regular.textContent = formatMoney(variant.price);
        if (compare) {
          if (onSale) {
            compare.textContent = formatMoney(variant.compare_at_price);
            compare.hidden = false;
          } else {
            compare.hidden = true;
          }
        }
      }

      if (variant.featured_image && mainImage) {
        mainImage.src = resizeImage(variant.featured_image.src, 1200);
        mainImage.alt = variant.featured_image.alt || product.title;
        setThumbActive(variant.featured_image.id);
      }

      if (variant.available) {
        submitBtn.disabled = false;
        submitBtn.textContent = submitBtn.getAttribute('data-add-label');
      } else {
        submitBtn.disabled = true;
        submitBtn.textContent = submitBtn.getAttribute('data-soldout-label');
      }

      if (history.replaceState) {
        var url = new URL(window.location.href);
        url.searchParams.set('variant', variant.id);
        history.replaceState({}, '', url);
      }
    }

    optionInputs.forEach(function (group) {
      group.addEventListener('change', function () {
        updateForVariant(findVariant(getSelectedOptions()));
      });
    });

    thumbs.forEach(function (thumb) {
      thumb.addEventListener('click', function () {
        if (!mainImage) return;
        mainImage.src = thumb.getAttribute('data-gallery-thumb-full') || thumb.getAttribute('data-gallery-thumb');
        mainImage.alt = thumb.getAttribute('data-gallery-thumb-alt') || product.title;
        setThumbActive(thumb.getAttribute('data-gallery-thumb-id'));
      });
    });

    form.addEventListener('submit', function (e) {
      if (cartType !== 'drawer') return; // native submit + return_to handles the page cart flow
      e.preventDefault();
      var qtyInput = form.querySelector('input[name="quantity"]');
      var quantity = qtyInput ? parseInt(qtyInput.value, 10) || 1 : 1;
      if (window.VyroCart) {
        window.VyroCart.addToCart(idInput.value, quantity, submitBtn);
      }
    });
  }

  document.querySelectorAll('[data-product-root]').forEach(initProductForm);
})();
