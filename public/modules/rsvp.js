'use strict';

import { fetchJSON, storage, formatDate, getDateParts } from './utils.js';
import { initTypeahead } from './typeahead.js';
import { toast } from './toast.js';
import { t, onLanguageChange, getCurrentLang } from './i18n.js';

const CONFIG_URL = 'data/site.config.json';
const QUEUE_KEY = 'rsvp:queue';

let config = {};
let calendlyButton;
let calendlyWrapper;
let countdownInterval;

function getQueue() {
  try {
    return JSON.parse(storage.getItem(QUEUE_KEY) || '[]');
  } catch (error) {
    return [];
  }
}

function saveQueue(queue) {
  storage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

async function flushQueue() {
  const queue = getQueue();
  if (!queue.length) return;
  const remaining = [];
  for (const payload of queue) {
    try {
      await sendRSVP(payload);
    } catch (error) {
      remaining.push(payload);
    }
  }
  saveQueue(remaining);
}

async function sendRSVP(payload) {
  // Import Supabase client dynamically to avoid circular dependencies
  const { insertRSVP } = await import('./supabase.js');
  
  // Transform payload to match Supabase schema
  const supabasePayload = {
    name: payload.name,
    allergies: payload.allergies || null,
    attendance: payload.attendance,
    songs: payload.songs || null,
    submitted_at: payload.submittedAt,
    user_agent: payload.userAgent
  };
  
  return await insertRSVP(supabasePayload);
}

function setError(field, message) {
  const errorEl = document.querySelector(`.field-error[data-error-for="${field}"]`);
  if (!errorEl) return;
  if (!message) {
    errorEl.hidden = true;
    errorEl.textContent = '';
  } else {
    errorEl.hidden = false;
    errorEl.textContent = message;
  }
}

function resetErrors() {
  document.querySelectorAll('.field-error').forEach(el => {
    el.hidden = true;
    el.textContent = '';
  });
}

function updateAllergyCounter(textarea) {
  const counter = document.getElementById('allergies-count');
  if (counter) {
    const count = textarea.value.length;
    counter.dataset.count = String(count);
    counter.textContent = `${count} / ${textarea.maxLength}`;
  }
}

function setupCalendlyButton() {
  if (!calendlyButton || !calendlyWrapper) return;
  calendlyButton.addEventListener('click', () => {
    if (!config.calendlyBaseUrl) return;
    if (!window.Calendly) {
      const script = document.createElement('script');
      script.src = 'https://assets.calendly.com/assets/external/widget.js';
      script.async = true;
      script.onload = () => openPopup();
      document.body.append(script);
    } else {
      openPopup();
    }
  });

  function openPopup() {
    if (!config.calendlyBaseUrl) return;
    window.Calendly?.initPopupWidget({ url: config.calendlyBaseUrl });
  }
}

function toggleCalendly(show) {
  if (!calendlyWrapper) return;
  calendlyWrapper.hidden = !show;
}

export async function initRSVP() {
  const form = document.getElementById('rsvp-form');
  if (!form) return;
  config = await fetchJSON(CONFIG_URL, { cacheKey: 'config' });

  calendlyButton = form.querySelector('[data-calendly-button]');
  calendlyWrapper = form.querySelector('[data-calendly]');
  toggleCalendly(false);
  setupCalendlyButton();

  const typeahead = await initTypeahead(form.querySelector('[data-typeahead]'));
  void typeahead;
  const songsField = initSongsField(form);

  const allergiesField = form.querySelector('#allergies');
  allergiesField?.addEventListener('input', () => updateAllergyCounter(allergiesField));
  updateAllergyCounter(allergiesField);

  // Fix mobile keyboard scroll issue
  // When keyboard closes, prevent unwanted scroll jump
  const formInputs = form.querySelectorAll('input, textarea');
  let scrollPosition = 0;
  
  formInputs.forEach(input => {
    input.addEventListener('focus', () => {
      // Save scroll position when input is focused
      scrollPosition = window.scrollY;
    });
    
    input.addEventListener('blur', () => {
      // Prevent scroll jump after keyboard closes
      setTimeout(() => {
        window.scrollTo(0, scrollPosition);
      }, 50);
    });
  });

  form.addEventListener('submit', async event => {
    event.preventDefault();
    resetErrors();
    const formData = new FormData(form);
    const name = formData.get('name').trim();
    const allergies = formData.get('allergies').trim();
    const attendance = formData.get('attendance');
    const songs = (formData.get('songs') || '').trim();

    let hasError = false;
    if (!name) {
      setError('name', t('errorNameRequired'));
      hasError = true;
    } else if (typeahead && !typeahead.isValid(name)) {
      setError('name', 'Por favor selecciona un nombre válido de la lista.');
      hasError = true;
    }

    if (!attendance) {
      setError('attendance', t('errorAttendanceRequired'));
      hasError = true;
    }

    if (allergies.length > 200) {
      setError('allergies', t('errorAllergiesLength'));
      hasError = true;
    }

    if (hasError) {
      return;
    }

    const payload = {
      name,
      allergies,
      attendance,
      submittedAt: new Date().toISOString(),
      userAgent: navigator.userAgent,
      shouldSendCalendlyEmail: attendance === 'yes' && Boolean(config.sendCalendlyEmail),
      songs
    };

    const submitButton = form.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    submitButton.textContent = t('submittingLabel');

    try {
      await sendRSVP(payload);
      toast(t('toastSuccess'));
      form.reset();
      updateAllergyCounter(allergiesField);
      songsField?.clear();
      toggleCalendly(attendance === 'yes' && Boolean(config.calendlyBaseUrl));
    } catch (error) {
      const queue = getQueue();
      queue.push(payload);
      saveQueue(queue);
      toast(t('toastQueued'), { type: 'warning', duration: 7000 });
      toggleCalendly(attendance === 'yes' && Boolean(config.calendlyBaseUrl));
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = t('submitLabel');
    }
  });

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && navigator.onLine) {
      flushQueue();
    }
  });

  window.addEventListener('online', flushQueue);

  function renderEventDate(lang = getCurrentLang()) {
    if (!config.eventDateIso) return;
    const displayDate = formatDate(config.eventDateIso, lang);
    const dateParts = getDateParts(config.eventDateIso, lang);
    document.querySelectorAll('[data-dynamic="eventDate"]').forEach(el => {
      el.textContent = displayDate;
    });
    const decorativeDate = dateParts.length ? dateParts.join(' · ') : displayDate.replace(/[\s/,-]+/g, ' · ');
    document
      .querySelectorAll('[data-dynamic="eventDateDecorative"]')
      .forEach(el => {
        el.textContent = decorativeDate;
      });
  }

  renderEventDate();
  renderCountdown();
  if (countdownInterval) {
    clearInterval(countdownInterval);
  }
  countdownInterval = window.setInterval(renderCountdown, 1000);

  onLanguageChange(lang => {
    renderEventDate(lang);
    const submitButton = form.querySelector('button[type="submit"]');
    if (submitButton) {
      submitButton.textContent = t('submitLabel');
    }
  });

  flushQueue();
}

function initSongsField(form) {
  const wrapper = form.querySelector('[data-song-field]');
  if (!wrapper) return null;
  const chipsWrapper = wrapper.querySelector('[data-song-chips]');
  const entry = wrapper.querySelector('[data-song-entry]');
  const hiddenInput = wrapper.querySelector('[data-song-hidden]');
  if (!chipsWrapper || !entry || !hiddenInput) return null;

  let songs = [];

  function updateHiddenInput() {
    hiddenInput.value = songs.join(', ');
  }

  function renderChips() {
    chipsWrapper.innerHTML = '';
    songs.forEach((song, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'tag-chip';
      const labelSpan = document.createElement('span');
      labelSpan.textContent = song;
      const iconSpan = document.createElement('span');
      iconSpan.setAttribute('aria-hidden', 'true');
      iconSpan.textContent = '×';
      button.append(labelSpan, iconSpan);
      button.setAttribute('aria-label', `${song} — ${t('songRemoveLabel')}`);
      button.addEventListener('click', () => removeSong(index));
      chipsWrapper.append(button);
    });
    updateHiddenInput();
  }

  function removeSong(index) {
    songs.splice(index, 1);
    renderChips();
  }

  function addSongsFromValue(value) {
    const candidates = value
      .split(',')
      .map(item => item.trim())
      .filter(Boolean);
    if (!candidates.length) return;
    songs = [...songs, ...candidates];
    renderChips();
  }

  entry.addEventListener('keydown', event => {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      addSongsFromValue(entry.value);
      entry.value = '';
    } else if (event.key === 'Backspace' && !entry.value && songs.length) {
      songs.pop();
      renderChips();
    }
  });

  entry.addEventListener('blur', () => {
    addSongsFromValue(entry.value);
    entry.value = '';
  });

  renderChips();
  onLanguageChange(() => renderChips());

  return {
    clear() {
      songs = [];
      renderChips();
      entry.value = '';
    }
  };
}

function renderCountdown() {
  if (!config.eventDateIso) return;
  const daysEl = document.querySelector('[data-countdown-days]');
  const hoursEl = document.querySelector('[data-countdown-hours]');
  const minutesEl = document.querySelector('[data-countdown-minutes]');
  const secondsEl = document.querySelector('[data-countdown-seconds]');
  if (!daysEl || !hoursEl || !minutesEl || !secondsEl) return;
  const eventDate = new Date(config.eventDateIso);
  const now = new Date();
  const diffMs = Math.max(0, eventDate.getTime() - now.getTime());
  const dayMs = 1000 * 60 * 60 * 24;
  const hourMs = 1000 * 60 * 60;
  const minuteMs = 1000 * 60;
  const days = Math.floor(diffMs / dayMs);
  const hours = Math.floor((diffMs % dayMs) / hourMs);
  const minutes = Math.floor((diffMs % hourMs) / minuteMs);
  const seconds = Math.floor((diffMs % minuteMs) / 1000);
  daysEl.textContent = String(days).padStart(2, '0');
  hoursEl.textContent = String(hours).padStart(2, '0');
  minutesEl.textContent = String(minutes).padStart(2, '0');
  secondsEl.textContent = String(seconds).padStart(2, '0');
}
