import { initNavController } from './modules/navController.js';
import { initCarousel } from './modules/carousel.js';
import { createModalManager } from './modules/modal.js';
import { initRSVP } from './modules/rsvp.js';
import { initI18n } from './modules/i18n.js';
import { fetchJSON } from './modules/utils.js';
import { toast } from './modules/toast.js';

async function bootstrap() {
  await initI18n();

  const heroCarousel = document.querySelector('[data-carousel]');
  initCarousel(heroCarousel);

  const nav = initNavController();
  void nav;

  try {
    const content = await fetchJSON('data/content.json', { cacheKey: 'content' });
    setupModals(content);
  } catch (error) {
    toast('No fue posible cargar el contenido', { type: 'warning' });
  }

  initRSVP();
}

function setupModals(content) {
  const manager = createModalManager(content.modals || {});
  const buttons = document.querySelectorAll('[data-modal-trigger]');
  buttons.forEach(button => {
    button.addEventListener('click', () => {
      const id = button.dataset.modalTrigger;
      manager.open(id);
    });
  });
}

document.addEventListener('DOMContentLoaded', bootstrap);
