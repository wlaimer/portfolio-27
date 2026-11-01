'use strict';

(() => {
  const root = document.documentElement;
  const intro = document.getElementById('intro');
  const figs = [...document.querySelectorAll('.fig')];
  const items = [...document.querySelectorAll('#texts .t')];
  const texts = document.getElementById('texts');
  const col = document.getElementById('col');
  const info = document.getElementById('info');
  const modeBtn = document.getElementById('mode');
  const last = figs.length + 1;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const phone = matchMedia('(max-width: 760px)');
  let i = 0, busy = false, wheelAcc = 0, wheelLast = 0, needPause = false;

  const st = (n, k) => (k < n ? 'past' : k === n ? 'now' : 'future');
  const inSequence = () => document.body.dataset.mode === 'sequence';

  function align() {
    if (phone.matches || !figs.length) { col.style.bottom = ''; return; }
    const h = root.clientHeight;
    const ih = figs[0].querySelector('img').offsetHeight;
    col.style.bottom = (h / 2 - ih / 2 - 3) + 'px';
  }

  function shift() {
    const ch = col.clientHeight;
    if (i === 0) return ch + 20;
    if (i > items.length) return -2 * ch;
    let top = 0;
    for (let k = 0; k < i - 1; k++) top += items[k].querySelector('.h').offsetHeight;
    const cur = items[i - 1];
    const block = cur.querySelector('.h').offsetHeight + cur.querySelector('.d').scrollHeight;
    return ch - block - top - 3;
  }

  function paint() {
    align();
    intro.dataset.s = i === 0 ? 'now' : 'past';
    figs.forEach((f, n) => { f.dataset.s = st(i, n + 1); });
    items.forEach((t, n) => { t.dataset.s = st(i, n + 1); });
    info.dataset.s = i === last ? 'now' : 'future';
    root.classList.toggle('at-info', i === last);
    texts.style.transform = 'translateY(' + shift() + 'px)';
  }

  function go(n) {
    n = Math.max(0, Math.min(last, n));
    if (n === i || busy) return;
    i = n; busy = true; paint();
    history.replaceState(null, '', '#' + (i === 0 ? 'p0' : i === last ? 'info' : 'p' + i));
    setTimeout(() => { busy = false; }, reduce ? 0 : 620);
  }

  const infoScrollable = dir => {
    if (i !== last || info.scrollHeight <= info.clientHeight + 1) return false;
    const atTop = info.scrollTop <= 0, atBottom = info.scrollTop + info.clientHeight >= info.scrollHeight - 1;
    return (dir > 0 && !atBottom) || (dir < 0 && !atTop);
  };

  addEventListener('wheel', e => {
    if (!inSequence()) return;
    const dir = Math.sign(e.deltaY || e.deltaX);
    if (!dir || infoScrollable(dir)) return;
    const now = Date.now();
    if (busy) { wheelLast = now; return; }
    if (needPause) { if (now - wheelLast > 90) needPause = false; wheelLast = now; if (needPause) return; }
    if (now - wheelLast > 220) wheelAcc = 0;
    wheelLast = now;
    wheelAcc += e.deltaY || e.deltaX;
    if (Math.abs(wheelAcc) > 35) { go(i + (wheelAcc > 0 ? 1 : -1)); wheelAcc = 0; needPause = true; }
  }, { passive: true });

  addEventListener('keydown', e => {
    if (!inSequence() || (e.target.closest && e.target.closest('summary, input, textarea'))) return;
    const k = e.key;
    if (['ArrowDown', 'PageDown', ' '].includes(k)) { if (!infoScrollable(1)) { e.preventDefault(); go(i + 1); } }
    else if (['ArrowUp', 'PageUp'].includes(k)) { if (!infoScrollable(-1)) { e.preventDefault(); go(i - 1); } }
    else if (k === 'Home') { e.preventDefault(); go(0); }
    else if (k === 'End') { e.preventDefault(); go(last); }
  });

  let sy = 0, tracked = false;
  addEventListener('touchstart', e => { tracked = inSequence() && !e.target.closest('header'); sy = e.touches[0].clientY; }, { passive: true });
  addEventListener('touchend', e => {
    if (!tracked) return;
    const dy = e.changedTouches[0].clientY - sy;
    if (Math.abs(dy) < 50 || infoScrollable(dy < 0 ? 1 : -1)) return;
    go(i + (dy < 0 ? 1 : -1));
  }, { passive: true });

  const target = h => (h === 'p0' ? 0 : h === 'info' ? last : /^p[1-6]$/.test(h) ? +h.slice(1) : -1);

  let px = -1, py = -1, hoverKey = '', since = 0, armed = false;
  document.querySelectorAll('#info .acc details').forEach(d => {
    d.addEventListener('toggle', () => {
      if (d.open) document.querySelectorAll('#info .acc details').forEach(o => { if (o !== d) o.open = false; });
    });
  });
  const under = () => {
    if (px < 0 || !inSequence()) return null;
    const el = document.elementFromPoint(px, py);
    if (!el || !el.closest) return null;
    const a = el.closest('.h a');
    if (a) {
      const n = items.indexOf(a.closest('.t'));
      return n >= 0 && items[n].dataset.s === 'past' ? { key: 'h' + n, run: () => go(n + 1) } : null;
    }
    return null;
  };
  function tick(moved) {
    const h = under();
    if (!h) { hoverKey = ''; armed = false; return; }
    if (h.key !== hoverKey) { hoverKey = h.key; since = Date.now(); armed = false; }
    if (moved && !armed) { armed = true; since = Date.now(); }
    if (armed && !busy && Date.now() - since >= 150) { armed = false; h.run(); }
  }
  addEventListener('mousemove', e => { px = e.clientX; py = e.clientY; tick(true); }, { passive: true });
  document.documentElement.addEventListener('mouseleave', () => { px = -1; py = -1; hoverKey = ''; armed = false; });
  setInterval(() => tick(false), 50);
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const n = target(a.getAttribute('href').slice(1));
    if (n < 0) return;
    e.preventDefault();
    if (!inSequence()) setMode('sequence');
    go(n);
  });

  function setMode(m) {
    document.body.dataset.mode = m;
    modeBtn.innerHTML = m === 'sequence' ? 'Index<span class="mode-ar"> \u2191</span>' : 'Sequence<span class="mode-ar"> \u2193</span>';
  }
  modeBtn.addEventListener('click', () => setMode(inSequence() ? 'index' : 'sequence'));

  const peek = document.getElementById('peek');
  document.querySelectorAll('#index a[data-img]').forEach(a => {
    const show = () => {
      peek.src = 'assets/' + a.dataset.img; peek.hidden = false;
      const yr = a.querySelector('.y');
      if (yr && peek.getBoundingClientRect().left - yr.getBoundingClientRect().right < 90) peek.hidden = true;
    };
    a.addEventListener('mouseenter', show);
    a.addEventListener('focus', show);
  });

  addEventListener('resize', () => { root.classList.remove('ready'); paint(); void root.offsetWidth; root.classList.add('ready'); });

  if (location.hash === '#index') setMode('index');
  const start = target(location.hash.slice(1));
  if (start > 0) i = start;
  paint();
  requestAnimationFrame(() => requestAnimationFrame(() => root.classList.add('ready')));
})();
