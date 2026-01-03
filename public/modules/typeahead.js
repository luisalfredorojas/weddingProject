'use strict';

import { fetchJSON, announce } from './utils.js';
import { getConfirmedNames } from './supabase.js';

const INVITEES_URL = 'data/invitees.json';

export async function initTypeahead(root) {
  if (!root) return;
  const input = root.querySelector('input');
  const list = root.querySelector('.typeahead-results');
  const status = root.querySelector('.sr-status');
  if (!input || !list) return;

  // Load all invitees from JSON
  const { invitees = [] } = await fetchJSON(INVITEES_URL, { cacheKey: 'invitees' });
  
  // Fetch confirmed names from Supabase to filter them out
  let confirmedNames = [];
  try {
    confirmedNames = await getConfirmedNames();
    console.log('Invitados confirmados:', confirmedNames.length);
  } catch (error) {
    console.warn('No se pudieron cargar invitados confirmados:', error);
    // Continue without filtering if fetch fails
  }
  
  // Filter out invitees who have already confirmed
  const availableInvitees = invitees.filter(inv => !confirmedNames.includes(inv.name));
  console.log('Invitados disponibles para confirmar:', availableInvitees.length, '/', invitees.length);
  
  let filtered = availableInvitees;
  let activeIndex = -1;

  function render() {
    list.innerHTML = '';
    if (!filtered.length) {
      list.hidden = true;
      input.setAttribute('aria-expanded', 'false');
      announce(status, input.value.trim().length ? '0 resultados' : '');
      return;
    }
    filtered.forEach((item, index) => {
      const li = document.createElement('li');
      li.textContent = item.name;
      li.id = `invitee-${index}`;
      li.role = 'option';
      li.tabIndex = -1;
      li.className = 'typeahead-item';
      li.setAttribute('aria-selected', index === activeIndex);
      li.addEventListener('mousedown', event => {
        event.preventDefault();
        select(index);
      });
      list.append(li);
    });
    list.hidden = false;
    input.setAttribute('aria-expanded', 'true');
    announce(status, `${filtered.length} resultados`);
  }

  function select(index) {
    const item = filtered[index];
    if (!item) return;
    input.value = item.name;
    activeIndex = index;
    close();
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }

  function close() {
    list.hidden = true;
    input.setAttribute('aria-expanded', 'false');
    activeIndex = -1;
  }

  function filter(value) {
    const term = value.trim().toLowerCase();
    if (!term) {
      filtered = availableInvitees.slice(0, 8);
      close();
      announce(status, '');
      return;
    }
    filtered = availableInvitees.filter(item => item.name.toLowerCase().includes(term)).slice(0, 8);
    activeIndex = -1;
    render();
  }

  input.setAttribute('role', 'combobox');
  input.setAttribute('aria-autocomplete', 'list');
  input.setAttribute('aria-expanded', 'false');
  input.setAttribute('aria-controls', list.id || 'typeahead-list');
  if (!list.id) list.id = 'typeahead-list';

  input.addEventListener('input', () => {
    filter(input.value);
  });

  input.addEventListener('focus', () => {
    if (input.value.trim()) {
      filter(input.value);
    }
  });

  input.addEventListener('keydown', event => {
    if (list.hidden && ['ArrowDown', 'ArrowUp'].includes(event.key)) {
      filter(input.value);
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      activeIndex = Math.min(activeIndex + 1, filtered.length - 1);
      updateActive();
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      activeIndex = Math.max(activeIndex - 1, 0);
      updateActive();
    } else if (event.key === 'Enter') {
      if (!list.hidden && activeIndex >= 0) {
        event.preventDefault();
        select(activeIndex);
      }
    } else if (event.key === 'Escape') {
      close();
    }
  });

  function updateActive() {
    const items = list.querySelectorAll('.typeahead-item');
    items.forEach((item, index) => {
      const isActive = index === activeIndex;
      item.setAttribute('aria-selected', String(isActive));
      if (isActive) {
        item.scrollIntoView({ block: 'nearest' });
      }
    });
  }

  document.addEventListener('click', event => {
    if (!root.contains(event.target)) {
      close();
    }
  });

  filter('');

  return {
    refresh() {
      filter(input.value);
    }
  };
}
