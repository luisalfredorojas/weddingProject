'use strict';

import { fetchJSON, storage } from './utils.js';

const STRINGS_URL = 'data/strings.json';

let strings = {};
let currentLang = document.documentElement.dataset.currentLang || 'es';
const listeners = new Set();

export async function initI18n() {
  strings = await fetchJSON(STRINGS_URL, { cacheKey: 'strings' });
  const savedLang = storage.getItem('site:lang');
  if (savedLang && strings[savedLang]) {
    currentLang = savedLang;
  }
  applyLanguage(currentLang);

  const toggle = document.querySelector('.lang-toggle');
  if (toggle) {
    toggle.addEventListener('click', () => {
      const next = currentLang === 'es' ? 'en' : 'es';
      applyLanguage(next);
    });
  }
}

export function onLanguageChange(fn) {
  listeners.add(fn);
}

export function t(key) {
  const value = strings?.[currentLang]?.[key];
  if (!value) return key;
  return value;
}

export function applyLanguage(lang) {
  if (!strings[lang]) return;
  currentLang = lang;
  storage.setItem('site:lang', lang);
  document.documentElement.lang = lang;
  document.documentElement.dataset.currentLang = lang;

  const elements = document.querySelectorAll('[data-i18n]');
  elements.forEach(el => {
    const key = el.dataset.i18n;
    const translation = strings[lang][key];
    if (typeof translation === 'string') {
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
        el.setAttribute('placeholder', translation);
      } else {
        el.textContent = translation;
      }
    }
  });

  listeners.forEach(fn => fn(lang));
}

export function getCurrentLang() {
  return currentLang;
}
