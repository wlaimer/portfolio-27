'use strict';

(() => {
  let box = null;

  function close() {
    if (!box) return;
    box.remove(); box = null;
    document.documentElement.style.overflow = '';
  }

  function open(img) {
    close();
    box = document.createElement('div');
    box.className = 'lb';
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-modal', 'true');
    box.setAttribute('aria-label', img.alt || 'Image');
    const big = document.createElement('img');
    big.src = img.currentSrc || img.src;
    big.alt = img.alt || '';
    box.appendChild(big);
    document.body.appendChild(box);
    document.documentElement.style.overflow = 'hidden';
  }

  document.addEventListener('click', e => {
    if (box) { if (e.target === box) close(); return; }
    if (!matchMedia('(min-width: 769px)').matches) return;
    const t = e.target;
    const still = t.closest && t.closest('.still');
    const img = still ? still.querySelector('img') : (t.tagName === 'IMG' && t.closest('main.case') ? t : null);
    if (img) open(img);
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') close();
  });
})();