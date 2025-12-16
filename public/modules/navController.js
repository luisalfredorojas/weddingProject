'use strict';

import { throttle, prefersReducedMotion, createUnlockScrollToggle } from './utils.js';
import { t, onLanguageChange } from './i18n.js';
export function initNavController(options = {}) {
  const panels = Array.from(document.querySelectorAll('.panel'));
  const statusEl = document.querySelector('[data-progress-status]');
  const dotsContainer = document.querySelector('[data-progress-dots]');
  const btnPrev = document.querySelector('[data-nav-prev]');
  const btnNext = document.querySelector('[data-nav-next]');
  const main = document.querySelector('.main');

  if (!panels.length) return;

  const totalPanels = panels.length;
  const initialIndex = clampIndex(options.initialIndex ?? 0, totalPanels);
  const autoRedirect = options.autoRedirect;
  const isMobileViewport = window.matchMedia('(max-width: 1024px)').matches;

  let currentIndex = initialIndex;
  let isAnimating = false;
  let touchStartY = null;
  let autoRedirectTimer = null;

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
    // DISABLED: Let panels flow naturally instead of forced positioning
    /*
    panels.forEach((panel, index) => {
      const offset = index - currentIndex;
      const translateY = offset * 100;
      panel.style.transform = `translate3d(0, ${translateY}%, 0)`;
      panel.inert = index !== currentIndex;
      panel.classList.toggle('is-active', index === currentIndex);
      if (index === currentIndex) {
        panel.removeAttribute('aria-hidden');
      } else {
        panel.setAttribute('aria-hidden', 'true');
      }
    });
    */
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
    if (autoRedirectTimer) {
      window.clearTimeout(autoRedirectTimer);
      autoRedirectTimer = null;
    }
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
    const target = event.target;
    const isScrollable = target.closest('.panel-inner, .rsvp-card, .typeahead-results, textarea, input, select');
    
    // Don't track touch if on scrollable element
    if (isScrollable) {
      touchStartY = null;
      return;
    }
    
    touchStartY = event.touches[0].clientY;
  }

  function handleTouchMove(event) {
    // Safari iOS requires preventDefault to be called IMMEDIATELY
    // We prevent first, then check if we should cancel the gesture
    if (touchStartY === null) return;
    
    event.preventDefault(); // Must be called unconditionally for Safari
    
    const currentY = event.touches[0].clientY;
    const diff = touchStartY - currentY;
    
    if (Math.abs(diff) < 50) return;
    
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
  
  const nextButtons = document.querySelectorAll('[data-nav-next]');
  nextButtons.forEach(btn => {
    btn.addEventListener('click', () => goTo(currentIndex + 1));
  });

  // DISABLED: Allow free scrolling instead of forced panel navigation
  // main.addEventListener('wheel', throttledWheel, { passive: false });
  // main.addEventListener('touchstart', handleTouchStart, { passive: false });
  // main.addEventListener('touchmove', handleTouchMove, { passive: false });
  // document.addEventListener('keydown', handleKey);
  document.addEventListener('visibilitychange', handleVisibility);
  onLanguageChange(updateStatusText);

  panels.forEach(panel => {
    panel.setAttribute('tabindex', '-1');
  });

  updatePositions();
  panels[currentIndex]?.focus({ preventScroll: true });
  createUnlockScrollToggle(document.body);

  if (
    autoRedirect &&
    typeof autoRedirect.targetIndex === 'number' &&
    autoRedirect.targetIndex !== initialIndex &&
    totalPanels > 1
  ) {
    const delay = Math.max(0, autoRedirect.delay ?? 3000);
    autoRedirectTimer = window.setTimeout(() => {
      autoRedirectTimer = null;
      goTo(clampIndex(autoRedirect.targetIndex, totalPanels));
    }, delay);
  }

  return {
    goTo,
    get index() {
      return currentIndex;
    }
  };
}

function clampIndex(index, total) {
  if (total <= 0) return 0;
  const safeIndex = Number.isFinite(index) ? index : 0;
  return Math.min(Math.max(0, safeIndex), total - 1);
}
