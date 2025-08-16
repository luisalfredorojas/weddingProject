/* Configuration --------------------------------------------------------- */
const SITE_CONFIG = {
  coupleNames: 'Alex & Sam',
  weddingDate: new Date('2026-06-14T16:30:00'), // local time
  venue: {
    name: 'The Grand Gardens',
    address: '123 Blossom Lane',
    map: 'https://maps.google.com'
  }
};
// Replace with your deployed Apps Script URL
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/____/exec';
/* ---------------------------------------------------------------------- */

(function () {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Smooth navigation for header links and section buttons
  document.querySelectorAll('a[href^="#"], .section-nav, .btn.primary').forEach(el => {
    el.addEventListener('click', evt => {
      const targetSel = el.dataset.target || el.getAttribute('href');
      const target = document.querySelector(targetSel);
      if (target) {
        evt.preventDefault();
        target.scrollIntoView({ behavior: prefersReduced ? 'auto' : 'smooth' });
      }
    });
  });

  // Keyboard navigation between sections
  const sections = Array.from(document.querySelectorAll('main > section'));
  function scrollToIndex(idx) {
    const clamped = Math.max(0, Math.min(idx, sections.length - 1));
    sections[clamped].scrollIntoView({ behavior: prefersReduced ? 'auto' : 'smooth' });
  }
  document.addEventListener('keydown', e => {
    const current = sections.findIndex(sec => sec.getBoundingClientRect().top >= -1 && sec.getBoundingClientRect().top < window.innerHeight/2);
    switch (e.key) {
      case 'ArrowDown':
      case 'PageDown':
        scrollToIndex(current + 1); break;
      case 'ArrowUp':
      case 'PageUp':
        scrollToIndex(current - 1); break;
      case 'Home':
        scrollToIndex(0); break;
      case 'End':
        scrollToIndex(sections.length - 1); break;
    }
  });

  // Debounced scroll-spy
  const navLinks = document.querySelectorAll('.nav-list a');
  let spyTimeout;
  window.addEventListener('scroll', () => {
    clearTimeout(spyTimeout);
    spyTimeout = setTimeout(() => {
      const offset = window.innerHeight * 0.5;
      let activeId = sections[0].id;
      sections.forEach(sec => {
        const rect = sec.getBoundingClientRect();
        if (rect.top <= offset && rect.bottom >= offset) {
          activeId = sec.id;
        }
      });
      navLinks.forEach(link => {
        const current = link.getAttribute('href').slice(1);
        if (current === activeId) link.setAttribute('aria-current', 'page');
        else link.removeAttribute('aria-current');
      });
    }, 100);
  });

  // prefers-reduced-motion: pause video
  if (prefersReduced) {
    const video = document.querySelector('.hero-video');
    if (video) {
      video.removeAttribute('autoplay');
      video.pause();
    }
  }

  // Timeline animation using IntersectionObserver
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) entry.target.classList.add('in-view');
    });
  }, { threshold: 0.3 });
  document.querySelectorAll('.timeline-item').forEach(item => observer.observe(item));

  // RSVP form handling ---------------------------------------------------
  const form = document.getElementById('rsvpForm');
  const toast = document.getElementById('toast');
  function showToast(msg, isError=false) {
    toast.textContent = msg;
    toast.style.background = isError ? '#b00020' : 'var(--surface)';
    toast.style.color = isError ? '#fff' : 'var(--fg)';
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 4000);
  }
  function sanitize(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.textContent;
  }
  function validate() {
    let valid = true;
    form.querySelectorAll('[required]').forEach(input => {
      const errorEl = document.getElementById('error-' + input.id);
      if (!input.value.trim()) {
        errorEl.textContent = 'Required';
        valid = false;
      } else {
        errorEl.textContent = '';
      }
    });
    return valid;
  }
  if (form) {
    form.addEventListener('submit', e => {
      e.preventDefault();
      if (form.sweet.value) return; // honeypot
      if (!validate()) return;
      const submitBtn = form.querySelector('.submit');
      submitBtn.disabled = true;
      const data = {
        fullName: sanitize(form.fullName.value),
        email: sanitize(form.email.value),
        attendance: sanitize(form.attendance.value),
        guestsCount: Number(form.guestsCount.value || 0),
        mealPreference: sanitize(form.mealPreference.value),
        songRequest: sanitize(form.songRequest.value).slice(0,100),
        message: sanitize(form.message.value).slice(0,500)
      };

      function onSuccess() {
        showToast('Thank you! Your RSVP has been sent.');
        form.reset();
        submitBtn.disabled = false;
      }
      function onError() {
        showToast('There was an error. Please try again later.', true);
        submitBtn.disabled = false;
      }

      const payload = JSON.stringify(data);
      if (window.fetch && window.Promise) {
        fetch(APPS_SCRIPT_URL, {
          method: 'POST',
          mode: 'cors',
          headers: { 'Content-Type': 'application/json' },
          body: payload
        }).then(res => {
          if (res.ok || res.type === 'opaque') onSuccess();
          else onError();
        }).catch(onError);
      } else {
        // XHR fallback
        try {
          const xhr = new XMLHttpRequest();
          xhr.open('POST', APPS_SCRIPT_URL);
          xhr.setRequestHeader('Content-Type', 'application/json');
          xhr.onreadystatechange = function () {
            if (xhr.readyState === 4) {
              if (xhr.status >= 200 && xhr.status < 300) onSuccess();
              else onError();
            }
          };
          xhr.send(payload);
        } catch (err) {
          onError();
        }
      }
    });
  }

  // .ics generator -------------------------------------------------------
  const addCalBtn = document.getElementById('addCalendar');
  if (addCalBtn) {
    addCalBtn.addEventListener('click', () => {
      const start = SITE_CONFIG.weddingDate;
      const end = new Date(start.getTime() + 4 * 60 * 60 * 1000); // default 4h
      const pad = n => String(n).padStart(2, '0');
      const format = d => `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00Z`;
      const ics = `BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Wedding//EN\nBEGIN:VEVENT\nUID:${Date.now()}@wedding\nDTSTAMP:${format(new Date())}\nDTSTART:${format(start)}\nDTEND:${format(end)}\nSUMMARY:${SITE_CONFIG.coupleNames} Wedding\nLOCATION:${SITE_CONFIG.venue.name} ${SITE_CONFIG.venue.address}\nEND:VEVENT\nEND:VCALENDAR`;
      const blob = new Blob([ics], { type: 'text/calendar' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'wedding.ics';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
  }
})();
