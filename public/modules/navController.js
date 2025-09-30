'use strict';

import { throttle, prefersReducedMotion, createUnlockScrollToggle } from './utils.js';
import { t, onLanguageChange } from './i18n.js';
export function initNavController() {
  const panels = Array.from(document.querySelectorAll('.panel'));
  const statusEl = document.querySelector('[data-progress-status]');
  const dotsContainer = document.querySelector('[data-progress-dots]');
  const btnPrev = document.querySelector('[data-nav-prev]');
  const btnNext = document.querySelector('[data-nav-next]');
  const main = document.querySelector('.main');

  if (!panels.length) return;

  let currentIndex = 0;
  let isAnimating = false;
  let touchStartY = null;

  function updateStatusText() {
    if (!statusEl) return;
    const template = t('progressStatus') || 'Sección {current} de {total}';
    const label = template
      .replace('{current}', `${currentIndex + 1}`)
      .replace('{total}', `${panels.length}`);
    statusEl.textContent = label;
  }

  const dots = [];
  if (dotsContainer) {
    dotsContainer.innerHTML = '';
    panels.forEach((_, index) => {
      const dot = document.createElement('span');
      dot.className = 'progress-dot';
      dot.setAttribute('aria-hidden', 'true');
      dot.dataset.index = index;
      dotsContainer.append(dot);
      dots.push(dot);
    });
  }
  function updatePositions() {
    panels.forEach((panel, index) => {
      const offset = index - currentIndex;
      const translateY = offset * 100;
      panel.style.transform = `translate3d(0, ${translateY}%, 0)`;
      panel.inert = index !== currentIndex;
      if (index === currentIndex) {
        panel.removeAttribute('aria-hidden');
      } else {
        panel.setAttribute('aria-hidden', 'true');
      }
    });
    dots.forEach((dot, index) => {
      dot.classList.toggle('is-active', index === currentIndex);
    });
    updateStatusText();
    btnPrev?.toggleAttribute('disabled', currentIndex === 0);
    btnNext?.toggleAttribute('disabled', currentIndex === panels.length - 1);
  }

  function goTo(index) {
    if (index < 0 || index >= panels.length) return;
    if (index === currentIndex) return;
    if (isAnimating) return;
    isAnimating = true;
    currentIndex = index;
    updatePositions();
    const duration = prefersReducedMotion ? 0 : 450;
    window.setTimeout(() => {
      isAnimating = false;
      panels[currentIndex]?.focus({ preventScroll: true });
    }, duration);
  }

  function handleWheel(event) {
    event.preventDefault();
    if (Math.abs(event.deltaY) < 10) return;
    if (event.deltaY > 0) {
      goTo(currentIndex + 1);
    } else {
      goTo(currentIndex - 1);
    }
  }

  function handleKey(event) {
    if (event.target.closest('input, textarea, select, [contenteditable="true"]')) return;
    if (event.key === 'ArrowDown' || event.key === 'PageDown') {
      event.preventDefault();
      goTo(currentIndex + 1);
    }
    if (event.key === 'ArrowUp' || event.key === 'PageUp') {
      event.preventDefault();
      goTo(currentIndex - 1);
    }
    if (event.key === 'Home') {
      goTo(0);
    }
    if (event.key === 'End') {
      goTo(panels.length - 1);
    }
  }

  const throttledWheel = throttle(handleWheel, 400);

  function handleTouchStart(event) {
    if (event.touches.length !== 1) return;
    touchStartY = event.touches[0].clientY;
  }

  function handleTouchMove(event) {
    if (touchStartY === null) return;
    const currentY = event.touches[0].clientY;
    const diff = touchStartY - currentY;
    if (Math.abs(diff) < 50) return;
    event.preventDefault();
    if (diff > 0) {
      goTo(currentIndex + 1);
    } else {
      goTo(currentIndex - 1);
    }
    touchStartY = null;
  }

  function handleVisibility() {
    if (document.visibilityState === 'visible') {
      panels[currentIndex]?.focus({ preventScroll: true });
    }
  }

  btnPrev?.addEventListener('click', () => goTo(currentIndex - 1));
  btnNext?.addEventListener('click', () => goTo(currentIndex + 1));

  main.addEventListener('wheel', throttledWheel, { passive: false });
  main.addEventListener('touchstart', handleTouchStart, { passive: false });
  main.addEventListener('touchmove', handleTouchMove, { passive: false });
  document.addEventListener('keydown', handleKey);
  document.addEventListener('visibilitychange', handleVisibility);
  onLanguageChange(updateStatusText);


  panels.forEach(panel => {
    panel.setAttribute('tabindex', '-1');
  });

  updatePositions();
  panels[0]?.focus({ preventScroll: true });
  createUnlockScrollToggle(document.body);

  return {
    goTo,
    get index() {
      return currentIndex;
    }
  };
}
