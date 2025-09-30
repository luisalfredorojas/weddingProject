'use strict';

import { prefersReducedMotion, throttle } from './utils.js';

const AUTO_INTERVAL = 5000;

export function initCarousel(root) {
  if (!root) return;
  const track = root.querySelector('[data-carousel-track]');
  const slides = Array.from(root.querySelectorAll('.carousel-slide'));
  const btnPrev = root.querySelector('[data-carousel-prev]');
  const btnNext = root.querySelector('[data-carousel-next]');
  const dotsContainer = root.querySelector('[data-carousel-dots]');

  if (!slides.length) return;

  let index = 0;
  let autoTimer = null;
  let isHovered = false;
  let touchStartX = null;

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        loadSlide(index);
      }
    });
  }, { threshold: 0.6 });

  observer.observe(root);

  slides.forEach((slide, slideIndex) => {
    slide.setAttribute('role', 'group');
    slide.setAttribute('aria-roledescription', 'slide');
    slide.setAttribute('aria-label', `${slideIndex + 1} / ${slides.length}`);
  });

  if (dotsContainer) {
    slides.forEach((_, slideIndex) => {
      const dot = document.createElement('button');
      dot.className = 'carousel-dot';
      dot.type = 'button';
      dot.setAttribute('aria-label', `Ir a la diapositiva ${slideIndex + 1}`);
      dot.addEventListener('click', () => goTo(slideIndex));
      dotsContainer.append(dot);
    });
  }

  function update() {
    track.style.transform = `translateX(-${index * 100}%)`;
    slides.forEach((slide, slideIndex) => {
      slide.inert = slideIndex !== index;
    });
    const dots = dotsContainer?.querySelectorAll('.carousel-dot') ?? [];
    dots.forEach((dot, dotIndex) => {
      dot.setAttribute('aria-current', dotIndex === index ? 'true' : 'false');
    });
    loadSlide(index);
    preloadNeighbors();
  }

  function loadSlide(targetIndex) {
    const slide = slides[targetIndex];
    if (!slide) return;
    if (slide.dataset.loaded) return;
    const type = slide.dataset.type;
    const src = slide.dataset.src;
    if (!src) return;
    if (type === 'image') {
      const img = slide.querySelector('img');
      if (img) {
        img.src = src;
        img.alt = slide.querySelector('p')?.textContent ?? '';
      }
    } else if (type === 'video') {
      const source = slide.querySelector('source');
      if (source) {
        source.src = src;
        const video = slide.querySelector('video');
        if (video) {
          video.load();
        }
      }
    } else if (type === 'youtube') {
      const iframe = slide.querySelector('iframe');
      if (iframe) {
        iframe.src = src;
      }
    }
    slide.dataset.loaded = 'true';
  }

  function preloadNeighbors() {
    loadSlide((index + 1) % slides.length);
    loadSlide((index - 1 + slides.length) % slides.length);
  }

  function goTo(targetIndex) {
    index = (targetIndex + slides.length) % slides.length;
    update();
  }

  function next() {
    goTo(index + 1);
  }

  function prev() {
    goTo(index - 1);
  }

  btnPrev?.addEventListener('click', prev);
  btnNext?.addEventListener('click', next);

  const throttledKey = throttle(event => {
    if (event.key === 'ArrowLeft') {
      prev();
    }
    if (event.key === 'ArrowRight') {
      next();
    }
  }, 250);

  root.addEventListener('keydown', throttledKey);

  function startAuto() {
    if (prefersReducedMotion) return;
    if (autoTimer) window.clearInterval(autoTimer);
    autoTimer = window.setInterval(() => {
      if (!isHovered && document.visibilityState === 'visible') {
        next();
      }
    }, AUTO_INTERVAL);
  }

  function stopAuto() {
    if (autoTimer) {
      window.clearInterval(autoTimer);
      autoTimer = null;
    }
  }

  root.addEventListener('mouseenter', () => {
    isHovered = true;
    stopAuto();
  });

  root.addEventListener('mouseleave', () => {
    isHovered = false;
    startAuto();
  });

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      stopAuto();
    } else if (!isHovered) {
      startAuto();
    }
  });

  root.addEventListener('touchstart', event => {
    if (event.touches.length !== 1) return;
    touchStartX = event.touches[0].clientX;
  }, { passive: true });

  root.addEventListener('touchend', event => {
    if (touchStartX === null) return;
    const diff = touchStartX - event.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) {
      if (diff > 0) next();
      else prev();
    }
    touchStartX = null;
  });

  update();
  startAuto();

  return {
    next,
    prev,
    goTo
  };
}
