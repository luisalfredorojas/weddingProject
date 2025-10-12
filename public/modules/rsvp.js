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
  if (!queue.length || !config.appsScriptEndpoint) return;
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
  if (!config.appsScriptEndpoint) {
    throw new Error('Apps Script endpoint missing');
  }
  const response = await fetch(config.appsScriptEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    mode: 'cors',
    body: JSON.stringify(payload)
  });
  if (!response.ok) {
    throw new Error('Network response not ok');
  }
  const data = await response.json();
  if (!data.ok) {
    throw new Error('Apps Script returned error');
  }
  return data;
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

  const allergiesField = form.querySelector('#allergies');
  allergiesField?.addEventListener('input', () => updateAllergyCounter(allergiesField));
  updateAllergyCounter(allergiesField);

  form.addEventListener('submit', async event => {
    event.preventDefault();
    resetErrors();
    const formData = new FormData(form);
    const name = formData.get('name').trim();
    const allergies = formData.get('allergies').trim();
    const attendance = formData.get('attendance');

    let hasError = false;
    if (!name) {
      setError('name', t('errorNameRequired'));
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
      shouldSendCalendlyEmail: attendance === 'yes' && Boolean(config.sendCalendlyEmail)
    };

    const submitButton = form.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    submitButton.textContent = t('submittingLabel');

    try {
      await sendRSVP(payload);
      toast(t('toastSuccess'));
      form.reset();
      updateAllergyCounter(allergiesField);
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

  onLanguageChange(lang => {
    renderEventDate(lang);
    const submitButton = form.querySelector('button[type="submit"]');
    if (submitButton) {
      submitButton.textContent = t('submitLabel');
    }
  });

  flushQueue();
}
