(function initHomeSelectedWorksSync() {
  const HOME_JSON_PATH = '09_SOURCE_JSON/pages/home.json';
  const CARD_SELECTOR = '#page-home .home-works-section .works-grid .work-card';

  const categoryLabels = {
    north: 'Русский Север',
    city: 'Русский город',
    history: 'Историческая тема',
    interior: 'Камерный мир',
    volga: 'Волга и Юг',
    graphics: 'Графика'
  };

  function applyItem(card, item) {
    if (!card || !item) return;

    const title = card.querySelector('h4');
    const meta = card.querySelector('.work-meta');
    const label = card.querySelector('.artwork-label');
    const imageWrap = card.querySelector('.work-image');
    const imageInner = card.querySelector('.work-image-inner');

    if (title && item.title) title.textContent = item.title;
    if (meta && item.meta) meta.textContent = item.meta;

    const route = item.route || card.getAttribute('data-route') || '';
    if (route) {
      card.setAttribute('data-route', route);
      card.setAttribute('href', `#${route}`);
    }

    const category = item.category || card.getAttribute('data-category') || '';
    if (category) {
      card.setAttribute('data-category', category);
    }

    const labelText = item.label || categoryLabels[category] || '';
    if (label && labelText) {
      label.textContent = labelText;
    }

    if (!imageInner) return;

    let image = imageInner.querySelector('img.home-selected-work-image');

    if (item.image) {
      if (!image) {
        image = document.createElement('img');
        image.className = 'home-selected-work-image';
        image.loading = 'lazy';
        image.decoding = 'async';
        image.style.display = 'block';
        image.style.width = '100%';
        image.style.height = '100%';
        image.style.objectFit = 'cover';
        image.style.borderRadius = 'inherit';
        imageInner.insertBefore(image, imageInner.firstChild);
      }

      image.src = item.image;
      image.alt = item.title || '';

      if (imageWrap) {
        imageWrap.classList.add('has-image');
      }
    } else if (image) {
      image.remove();

      if (imageWrap) {
        imageWrap.classList.remove('has-image');
      }
    }
  }

  function syncHomeSelectedWorks(retries = 10) {
    const cards = document.querySelectorAll(CARD_SELECTOR);

    if (!cards.length) {
      if (retries > 0) {
        setTimeout(() => syncHomeSelectedWorks(retries - 1), 60);
      }
      return;
    }

    fetch(HOME_JSON_PATH, { cache: 'no-store' })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Failed to load ${HOME_JSON_PATH}: ${response.status}`);
        }
        return response.json();
      })
      .then((home) => {
        const items = Array.isArray(home?.worksTeaser?.items) ? home.worksTeaser.items : [];
        cards.forEach((card, index) => applyItem(card, items[index]));
      })
      .catch((error) => {
        console.error('Home selected works sync error:', error);
      });
  }

  if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', () => syncHomeSelectedWorks(), { once: true });
  } else {
    syncHomeSelectedWorks();
  }
})();
