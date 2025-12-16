/**
 * Scroll-based animations using Intersection Observer
 * Applies 'is-visible' class when panels scroll into view
 * Removes class when panels scroll out to allow re-triggering
 */

export function initScrollAnimations() {
  const panels = document.querySelectorAll('.panel');
  
  if (!panels.length) return;

  // Options for the intersection observer
  const observerOptions = {
    root: null, // viewport
    rootMargin: '-15% 0px -15% 0px', // Trigger when 15% into viewport
    threshold: 0.2 // Trigger when 20% of element is visible
  };

  // Callback when elements intersect
  const observerCallback = (entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        // Add is-visible class when panel enters viewport
        entry.target.classList.add('is-visible');
      } else {
        // Remove class when panel exits viewport to re-trigger animations
        // Small delay to ensure smooth exit
        setTimeout(() => {
          entry.target.classList.remove('is-visible');
        }, 100);
      }
    });
  };

  // Create the observer
  const observer = new IntersectionObserver(observerCallback, observerOptions);

  // Observe all panels
  panels.forEach(panel => {
    observer.observe(panel);
  });

  // Make first panel visible immediately on page load
  if (panels[0]) {
    panels[0].classList.add('is-visible');
  }

  return observer;
}
