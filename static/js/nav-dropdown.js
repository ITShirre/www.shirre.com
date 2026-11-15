/* Homepage nav dropdowns: hover (with a close delay) on desktop, caret on mobile. */
(function () {
  var OPEN_MS = 80;
  var CLOSE_MS = 240;
  var MQ = '(min-width: 768px)';
  var openTimer = null;
  var closeTimer = null;

  function isDesktop() {
    return window.matchMedia(MQ).matches;
  }
  function items() {
    return [].slice.call(document.querySelectorAll('.nav-has-sub'));
  }
  function caretOf(li) {
    return li.querySelector('.nav-caret');
  }
  var ES_ALIAS = {
    'fixture-benefits': 'esp-panel-fixtures',
    'standard-setup': 'esp-panel-setup',
    'rf-single-ended': 'esp-panel-se',
    'differential-pairs': 'esp-panel-diff',
    'esp-panel-fixtures': 'fixture-benefits',
    'esp-panel-setup': 'standard-setup',
    'esp-panel-se': 'rf-single-ended',
    'esp-panel-diff': 'differential-pairs'
  };

  function chipIsCurrent(a) {
    var href = (a.getAttribute('href') || '').replace(/^#/, '');
    if (!href) return false;
    var hash = (location.hash || '').replace(/^#/, '');
    if (hash && (hash === href || ES_ALIAS[hash] === href || ES_ALIAS[href] === hash)) return true;
    var selected = document.querySelector('.esp-tab[aria-selected="true"], .an-tab[aria-selected="true"]');
    if (selected) {
      var ctl = selected.getAttribute('aria-controls') || '';
      if (ctl === href || ES_ALIAS[href] === ctl) return true;
      if (selected.id === href + '-tab') return true;
    }
    var prod = document.querySelector('.nav-tabs li.active a, .nav-tabs a[aria-expanded="true"]');
    if (prod) {
      var ph = (prod.getAttribute('href') || '').replace(/^#/, '');
      if (ph === href) return true;
    }
    return false;
  }

  function markCurrent(li) {
    if (!li) return;
    [].slice.call(li.querySelectorAll('.nav-sub a')).forEach(function (a) {
      var on = chipIsCurrent(a);
      a.classList.toggle('is-current', on);
      if (on) a.setAttribute('aria-current', 'true');
      else a.removeAttribute('aria-current');
    });
  }

  function setOpen(li, open) {
    if (!li) return;
    li.classList.toggle('is-open', open);
    var c = caretOf(li);
    if (c) c.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (open) markCurrent(li);
  }
  function closeAll(except) {
    items().forEach(function (li) {
      if (li !== except) setOpen(li, false);
    });
  }
  function cancelTimers() {
    if (openTimer) { clearTimeout(openTimer); openTimer = null; }
    if (closeTimer) { clearTimeout(closeTimer); closeTimer = null; }
  }
  function scheduleOpen(li) {
    cancelTimers();
    openTimer = setTimeout(function () {
      closeAll(li);
      setOpen(li, true);
    }, OPEN_MS);
  }
  function scheduleClose(li) {
    cancelTimers();
    closeTimer = setTimeout(function () { setOpen(li, false); }, CLOSE_MS);
  }
  function navOffset() {
    var n = document.querySelector('.navbar-fixed-top, .navbar');
    return n ? n.offsetHeight : 50;
  }
  function scrollToId(id) {
    var el = document.getElementById(id);
    if (!el) return;
    window.scrollTo(0, el.getBoundingClientRect().top + window.pageYOffset - navOffset());
  }
  var PRODUCT_TABS = { pherotetra: 1, 'pt-fccl-m9': 1, 'pt-fccl-m8': 1, 'pt-fccl-m7': 1 };

  function activateProduct(hash) {
    var id = (hash || '').replace(/^#/, '');
    if (!PRODUCT_TABS[id]) return false;
    var a = document.querySelector('.nav-tabs a[href="#' + id + '"]');
    if (a) {
      if (window.jQuery) window.jQuery(a).tab('show');
      else a.click();
    }
    if (history.replaceState) history.replaceState(null, '', '#' + id);
    scrollToId('products');
    return true;
  }

  function goHash(hash) {
    var h = (hash || '').replace(/^#/, '');
    if (!h) return;
    closeAll();
    var collapse = document.querySelector('.navbar-collapse.in, .navbar-collapse.show');
    if (collapse && window.jQuery) window.jQuery(collapse).collapse('hide');
    if (activateProduct('#' + h)) return;
    if ('#' + h === location.hash) {
      try { window.dispatchEvent(new HashChangeEvent('hashchange')); }
      catch (err) { var e = document.createEvent('HashChangeEvent'); e.initEvent('hashchange', true, true); window.dispatchEvent(e); }
    } else {
      location.hash = h;
    }
  }

  function onReady() {
    items().forEach(function (li) {
      li.addEventListener('mouseenter', function () {
        if (isDesktop()) scheduleOpen(li);
      });
      li.addEventListener('mouseleave', function () {
        if (isDesktop()) scheduleClose(li);
      });
      li.addEventListener('focusin', function () {
        cancelTimers();
        if (isDesktop()) { closeAll(li); setOpen(li, true); }
      });
      li.addEventListener('focusout', function () {
        if (!isDesktop()) return;
        closeTimer = setTimeout(function () {
          if (!li.contains(document.activeElement)) setOpen(li, false);
        }, CLOSE_MS);
      });
      var caret = caretOf(li);
      if (caret) {
        caret.addEventListener('click', function (e) {
          e.preventDefault();
          e.stopPropagation();
          if (isDesktop()) return;
          var open = !li.classList.contains('is-open');
          closeAll(open ? li : null);
          setOpen(li, open);
        });
      }
      [].slice.call(li.querySelectorAll('.nav-sub a')).forEach(function (a) {
        a.addEventListener('click', function (e) {
          var href = a.getAttribute('href') || '';
          if (href.charAt(0) !== '#') return;
          e.preventDefault();
          goHash(href);
        });
      });
    });

    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') return;
      var open = document.querySelector('.nav-has-sub.is-open');
      if (!open) return;
      setOpen(open, false);
      var top = open.querySelector(':scope > a');
      if (top) top.focus();
    });

    window.addEventListener('resize', function () {
      if (isDesktop()) closeAll();
    });

    // Product-tab deep links on first load (Application Note and Engineering Support handle their own hashes).
    if (PRODUCT_TABS[(location.hash || '').replace(/^#/, '')]) {
      activateProduct(location.hash);
    }

    // If a lightbox opens, drop any open menu so the two don't fight.
    document.addEventListener('click', function (e) {
      if (e.target.closest && e.target.closest('.fancybox-container')) closeAll();
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', onReady);
  else onReady();
})();
