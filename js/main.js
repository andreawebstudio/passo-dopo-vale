/* PassoDopoVale — JavaScript essenziale */
(function () {
  'use strict';
  var doc = document.documentElement;
  doc.classList.add('js');
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  document.addEventListener('DOMContentLoaded', function () {
    /* ---------- Header sticky ---------- */
    var header = document.querySelector('.site-header');
    var onScroll = function () { header.classList.toggle('is-scrolled', window.scrollY > 8); };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    /* ---------- Menu mobile ---------- */
    var toggle = document.querySelector('.nav-toggle');
    var nav = document.querySelector('.nav');
    var label = toggle.querySelector('.sr-only');
    var setMenu = function (open) {
      toggle.setAttribute('aria-expanded', String(open));
      nav.classList.toggle('is-open', open);
      label.textContent = open ? 'Chiudi il menu' : 'Apri il menu';
    };
    toggle.addEventListener('click', function () { setMenu(toggle.getAttribute('aria-expanded') !== 'true'); });
    nav.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') { setMenu(false); toggle.focus(); }
    });
    window.matchMedia('(min-width: 1024px)').addEventListener('change', function (m) { if (m.matches) setMenu(false); });

    /* ---------- Link attivo nel menu ---------- */
    var links = Array.prototype.slice.call(document.querySelectorAll('.nav__list a[href^="#"]:not(.btn)'));
    if ('IntersectionObserver' in window) {
      var spy = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          links.forEach(function (a) {
            var active = a.getAttribute('href') === '#' + entry.target.id;
            a.classList.toggle('is-active', active);
            if (active) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
          });
        });
      }, { rootMargin: '-45% 0px -50% 0px' });
      document.querySelectorAll('main section[id]').forEach(function (s) { spy.observe(s); });
    }

    /* ---------- Fade-in leggero ---------- */
    var reveals = document.querySelectorAll('.reveal');
    if (!reduceMotion && 'IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) { entry.target.classList.add('is-visible'); io.unobserve(entry.target); }
        });
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
      reveals.forEach(function (el) { io.observe(el); });
    } else {
      reveals.forEach(function (el) { el.classList.add('is-visible'); });
    }

    /* ---------- FAQ accordion ---------- */
    document.querySelectorAll('.faq__q button').forEach(function (btn) {
      var panel = document.getElementById(btn.getAttribute('aria-controls'));
      btn.addEventListener('click', function () {
        var open = btn.getAttribute('aria-expanded') === 'true';
        btn.setAttribute('aria-expanded', String(!open));
        if (reduceMotion) { panel.hidden = open; return; }
        if (open) {
          panel.style.height = panel.scrollHeight + 'px';
          requestAnimationFrame(function () { panel.style.height = '0px'; });
          panel.addEventListener('transitionend', function done() {
            panel.hidden = true; panel.style.height = ''; panel.removeEventListener('transitionend', done);
          });
        } else {
          panel.hidden = false;
          panel.style.height = '0px';
          requestAnimationFrame(function () { panel.style.height = panel.scrollHeight + 'px'; });
          panel.addEventListener('transitionend', function done() {
            panel.style.height = ''; panel.removeEventListener('transitionend', done);
          });
        }
      });
    });

    /* ---------- Come funziona: percorso che si illumina allo scroll ---------- */
    var path = document.querySelector('[data-path]');
    if (path) {
      var track = path.querySelector('.path__track');
      var steps = Array.prototype.slice.call(path.querySelectorAll('.path__step'));
      var nodes = steps.map(function (s) { return s.querySelector('.path__node'); });
      var stops = [];

      var layout = function () {
        var base = path.getBoundingClientRect();
        var pts = nodes.map(function (n) {
          var r = n.getBoundingClientRect();
          return { x: r.left + r.width / 2 - base.left, y: r.top + r.height / 2 - base.top };
        });
        var first = pts[0], last = pts[pts.length - 1];
        var horizontal = Math.abs(last.y - first.y) < 4;
        path.classList.toggle('path--h', horizontal);
        path.classList.toggle('path--v', !horizontal);
        if (horizontal) {
          track.style.cssText = 'left:' + first.x + 'px;top:' + (first.y - 1) + 'px;width:' + (last.x - first.x) + 'px;height:2px';
          stops = pts.map(function (p) { return (p.x - first.x) / (last.x - first.x); });
        } else {
          track.style.cssText = 'left:' + (first.x - 1) + 'px;top:' + first.y + 'px;height:' + (last.y - first.y) + 'px;width:2px';
          stops = pts.map(function (p) { return (p.y - first.y) / (last.y - first.y); });
        }
        update();
      };

      var update = function () {
        var p;
        if (reduceMotion) {
          p = 1;
        } else {
          var r = path.getBoundingClientRect();
          var vh = window.innerHeight;
          p = (vh * 0.75 - r.top) / (r.height + vh * 0.15);
          p = Math.max(0, Math.min(1, p));
        }
        path.style.setProperty('--progress', p.toFixed(4));
        steps.forEach(function (s, i) { s.classList.toggle('is-active', p >= stops[i] - 0.001); });
      };

      var ticking = false;
      window.addEventListener('scroll', function () {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(function () { update(); ticking = false; });
      }, { passive: true });
      window.addEventListener('resize', layout);
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(layout);
      layout();
    }

    /* ---------- Anno nel footer ---------- */
    var y = document.querySelector('[data-year]');
    if (y) y.textContent = new Date().getFullYear();

    /* ---------- Modulo contatti ---------- */
    var form = document.getElementById('contact-form');
    if (!form) return;
    var status = form.querySelector('.form__status');
    var submitBtn = form.querySelector('button[type="submit"]');

    var messages = {
      nome: 'Inserisci il tuo nome e cognome.',
      email: 'Inserisci un indirizzo email valido.',
      argomento: 'Seleziona l\'argomento della richiesta.',
      messaggio: 'Scrivi un breve messaggio.',
      privacy: 'Per inviare la richiesta è necessario accettare l\'informativa privacy.'
    };

    var setError = function (field, msg) {
      var wrap = field.closest('.field');
      var err = wrap.querySelector('.field__error');
      if (msg) {
        if (!err) {
          err = document.createElement('p');
          err.className = 'field__error';
          err.id = field.id + '-error';
          wrap.appendChild(err);
        }
        err.textContent = msg;
        field.setAttribute('aria-invalid', 'true');
        var describedBy = (field.getAttribute('aria-describedby') || '').split(' ').filter(Boolean);
        if (describedBy.indexOf(err.id) === -1) describedBy.push(err.id);
        field.setAttribute('aria-describedby', describedBy.join(' '));
      } else if (err) {
        err.remove();
        field.removeAttribute('aria-invalid');
        var rest = (field.getAttribute('aria-describedby') || '').split(' ').filter(function (id) { return id && id !== field.id + '-error'; });
        if (rest.length) field.setAttribute('aria-describedby', rest.join(' ')); else field.removeAttribute('aria-describedby');
      }
    };

    var validate = function () {
      var firstInvalid = null;
      form.querySelectorAll('[required]').forEach(function (field) {
        var ok = field.type === 'checkbox' ? field.checked : field.value.trim() !== '' && field.checkValidity();
        setError(field, ok ? '' : messages[field.name]);
        if (!ok && !firstInvalid) firstInvalid = field;
      });
      if (firstInvalid) firstInvalid.focus();
      return !firstInvalid;
    };

    form.querySelectorAll('[required]').forEach(function (field) {
      field.addEventListener(field.type === 'checkbox' || field.tagName === 'SELECT' ? 'change' : 'blur', function () {
        if (field.getAttribute('aria-invalid') === 'true') {
          var ok = field.type === 'checkbox' ? field.checked : field.value.trim() !== '' && field.checkValidity();
          setError(field, ok ? '' : messages[field.name]);
        }
      });
    });

    var showStatus = function (type, html) {
      status.className = 'form__status' + (type ? ' is-' + type : '');
      status.innerHTML = html;
    };

    var buildMailto = function (data) {
      var to = form.getAttribute('data-fallback-email');
      var subject = 'Richiesta dal sito – ' + data.get('argomento');
      var body = [
        'Nome e cognome: ' + data.get('nome'),
        'Email: ' + data.get('email'),
        'Telefono: ' + (data.get('telefono') || '—'),
        'Argomento: ' + data.get('argomento'),
        '',
        data.get('messaggio')
      ].join('\n');
      return 'mailto:' + to + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
    };

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      showStatus('', '');
      if (!validate()) return;

      var data = new FormData(form);
      var endpoint = (form.getAttribute('data-endpoint') || '').trim();

      // Nessun servizio di invio configurato: non si simula l'invio, si propone l'email.
      if (!endpoint) {
        showStatus('',
          '<p>Il modulo online non è ancora attivo. Puoi inviarmi la stessa richiesta via email: il messaggio è già pronto.</p>' +
          '<a class="btn btn--secondary" href="' + buildMailto(data) + '">Invia via email</a>');
        return;
      }

      submitBtn.disabled = true;
      submitBtn.textContent = 'Invio in corso…';
      fetch(endpoint, { method: 'POST', body: data, headers: { Accept: 'application/json' } })
        .then(function (res) {
          if (!res.ok) throw new Error('HTTP ' + res.status);
          form.reset();
          showStatus('success', '<p>Grazie, la tua richiesta è stata inviata. Ti risponderò il prima possibile.</p>');
        })
        .catch(function () {
          showStatus('error',
            '<p>Non è stato possibile inviare la richiesta. Puoi riprovare oppure scrivermi direttamente via email.</p>' +
            '<a class="btn btn--secondary" href="' + buildMailto(data) + '">Invia via email</a>');
        })
        .finally(function () {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Invia la tua richiesta';
        });
    });
  });
})();
