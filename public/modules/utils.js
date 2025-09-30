'use strict';

const cacheStore = new Map();

export const prefersReducedMotion = (() => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
})();

export async function fetchJSON(url, { cacheKey = url } = {}) {
  if (cacheStore.has(cacheKey)) {
    return cacheStore.get(cacheKey);
  }

  const stored = sessionStorage.getItem(cacheKey);
  const storedEtag = sessionStorage.getItem(`${cacheKey}:etag`);
  const headers = storedEtag ? { 'If-None-Match': storedEtag } : {};

  const response = await fetch(url, { headers });
  if (response.status === 304 && stored) {
    const parsed = JSON.parse(stored);
    cacheStore.set(cacheKey, parsed);
    return parsed;
  }

  if (!response.ok) {
    throw new Error(`Unable to load ${url}: ${response.status}`);
  }

  const etag = response.headers.get('ETag');
  const data = await response.json();
  if (etag) {
    sessionStorage.setItem(`${cacheKey}:etag`, etag);
  }
  sessionStorage.setItem(cacheKey, JSON.stringify(data));
  cacheStore.set(cacheKey, data);
  return data;
}

export function debounce(fn, delay = 200) {
  let timer;
  return (...args) => {
    window.clearTimeout(timer);
    timer = window.setTimeout(() => fn(...args), delay);
  };
}

export function throttle(fn, wait = 200) {
  let lastTime = 0;
  return (...args) => {
    const now = Date.now();
    if (now - lastTime >= wait) {
      lastTime = now;
      fn(...args);
    }
  };
}

export function trapFocus(container) {
  const focusableSelectors = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'textarea:not([disabled])',
    'select:not([disabled])',
    '[tabindex]:not([tabindex="-1"])'
  ];

  const focusable = Array.from(
    container.querySelectorAll(focusableSelectors.join(','))
  ).filter(el => !el.hasAttribute('inert'));

  if (focusable.length === 0) return () => {};

  const [first, last] = [focusable[0], focusable[focusable.length - 1]];

  function handleKey(event) {
    if (event.key !== 'Tab') return;
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  container.addEventListener('keydown', handleKey);
  return () => container.removeEventListener('keydown', handleKey);
}

export function focusGuard(element) {
  const previouslyFocused = document.activeElement;
  if (element) {
    element.focus({ preventScroll: true });
  }
  return () => {
    if (previouslyFocused && typeof previouslyFocused.focus === 'function') {
      previouslyFocused.focus({ preventScroll: true });
    }
  };
}

export function announce(el, message) {
  if (!el) return;
  el.textContent = '';
  window.requestAnimationFrame(() => {
    el.textContent = message;
  });
}

export function createUnlockScrollToggle(target = document.body) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'unlock-scroll-toggle';
  button.textContent = 'Dev · Permitir scroll';
  button.hidden = true;
  button.addEventListener('click', () => {
    target.classList.toggle('allow-scroll');
  });
  if (location.hostname === 'localhost') {
    button.hidden = false;
    document.body.append(button);
  }
}

export function safeLocalStorage() {
  try {
    const testKey = '__storage_test__';
    window.localStorage.setItem(testKey, testKey);
    window.localStorage.removeItem(testKey);
    return window.localStorage;
  } catch (error) {
    return {
      getItem() { return null; },
      setItem() {},
      removeItem() {},
      clear() {}
    };
  }
}

export const storage = safeLocalStorage();

export function formatDate(date) {
  try {
    return new Intl.DateTimeFormat(document.documentElement.lang, {
      dateStyle: 'long'
    }).format(new Date(date));
  } catch (error) {
    return date;
  }
}
