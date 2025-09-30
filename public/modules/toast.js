'use strict';

const region = document.querySelector('.toast-region');

export function toast(message, { type = 'info', duration = 5000 } = {}) {
  if (!region) return;
  const item = document.createElement('div');
  item.className = `toast toast--${type}`;
  item.role = 'alert';
  item.innerHTML = `<span>${message}</span>`;
  const dismiss = document.createElement('button');
  dismiss.type = 'button';
  dismiss.setAttribute('aria-label', 'Cerrar notificación');
  dismiss.textContent = '×';
  dismiss.addEventListener('click', () => remove());
  item.append(dismiss);
  region.append(item);

  const timer = window.setTimeout(() => remove(), duration);

  function remove() {
    window.clearTimeout(timer);
    item.remove();
  }

  return remove;
}
