'use strict';

(() => {
  if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const SWEEP = '.top nav a, #mode, .next a, .acc summary, .rows a, .go, .cue, .contact a, .acc dd a, .facts dd a, .case-foot a';

  const css = document.createElement('style');
  css.textContent =
    'html.has-dot, html.has-dot * { cursor: none !important; }' +
    '.dot { position: fixed; left: 0; top: 0; width: 9px; height: 9px; margin: -4.5px 0 0 -4.5px; border-radius: 50%; background: #fff; mix-blend-mode: difference; pointer-events: none; z-index: 2147483647; will-change: transform; visibility: hidden; }';
  document.head.appendChild(css);

  const dot = document.createElement('div');
  dot.className = 'dot';
  dot.setAttribute('aria-hidden', 'true');
  document.body.appendChild(dot);

  function onText(x, y) {
    let node = null;
    if (document.caretPositionFromPoint) {
      const p = document.caretPositionFromPoint(x, y);
      node = p && p.offsetNode;
    } else if (document.caretRangeFromPoint) {
      const r = document.caretRangeFromPoint(x, y);
      node = r && r.startContainer;
    }
    if (!node || node.nodeType !== 3 || !node.nodeValue.trim()) return false;
    const range = document.createRange();
    range.selectNodeContents(node);
    for (const b of range.getClientRects()) {
      if (x >= b.left - 4 && x <= b.right + 4 && y >= b.top - 3 && y <= b.bottom + 3) return true;
    }
    return false;
  }

  function boxElement(el) {
    if (el.matches('.rows a')) return el.querySelector('.ti') || el;
    if (el.matches('.acc summary')) return el.querySelector('span') || el;
    return el;
  }

  function inBox(x, y, target) {
    const el = target && target.closest ? target.closest(SWEEP) : null;
    if (!el) return false;
    for (const r of boxElement(el).getClientRects()) {
      if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) return true;
    }
    return false;
  }

  let shown = false, px = 0, py = 0, target = null, queued = false;

  function update() {
    queued = false;
    const inside = inBox(px, py, target);
    dot.style.visibility = inside ? 'hidden' : 'visible';
  }

  addEventListener('mousemove', e => {
    px = e.clientX; py = e.clientY; target = e.target;
    if (!shown) { shown = true; document.documentElement.classList.add('has-dot'); }
    dot.style.transform = 'translate(' + px + 'px,' + py + 'px)';
    if (!queued) { queued = true; requestAnimationFrame(update); }
  }, { passive: true });
  document.documentElement.addEventListener('mouseleave', () => { dot.style.visibility = 'hidden'; });
})();