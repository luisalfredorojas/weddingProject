'use strict';

import { trapFocus, focusGuard } from './utils.js';

export function createModalManager(contentMap = {}) {
  const template = document.getElementById('modal-template');
  if (!template) throw new Error('Modal template missing');
  let currentModal = null;
  let releaseFocus = () => {};
  let restoreFocus = () => {};

  function openModal(id) {
    const modalContent = contentMap[id];
    if (!modalContent) return;

    closeModal();

    currentModal = template.content.firstElementChild.cloneNode(true);
    const dialog = currentModal.querySelector('.modal-content');
    const title = currentModal.querySelector('#modal-title');
    const body = currentModal.querySelector('.modal-body');

    if (modalContent.title) title.textContent = modalContent.title;
    if (modalContent.body) {
      body.innerHTML = modalContent.body;
    }

    currentModal.querySelectorAll('[data-modal-close]').forEach(btn => {
      btn.addEventListener('click', closeModal);
    });

    currentModal.addEventListener('click', event => {
      if (event.target.matches('.modal-backdrop')) {
        closeModal();
      }
    });

    document.body.append(currentModal);
    document.body.style.overflow = 'hidden';
    dialog.setAttribute('tabindex', '-1');
    releaseFocus = trapFocus(dialog);
    restoreFocus = focusGuard();
    dialog.focus({ preventScroll: true });
    window.addEventListener('keydown', handleKeydown);
  }

  function handleKeydown(event) {
    if (event.key === 'Escape') {
      event.preventDefault();
      closeModal();
    }
  }

  function closeModal() {
    if (!currentModal) return;
    releaseFocus();
    window.removeEventListener('keydown', handleKeydown);
    currentModal.remove();
    document.body.style.overflow = '';
    restoreFocus();
    currentModal = null;
  }

  return {
    open: openModal,
    close: closeModal
  };
}
