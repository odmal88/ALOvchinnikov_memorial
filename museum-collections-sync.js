(function initMuseumCollectionsSync() {
  const JSON_PATH = '09_SOURCE_JSON/pages/museum-collections.json';

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function renderMuseumCollections(data) {
    if (!data) return;

    const sectionId = data.sectionId || 'artist-museum-collections';
    const legacySection = document.getElementById('artist-legacy');
    if (!legacySection || document.getElementById(sectionId)) return;

    const toc = document.querySelector('#page-artist .artist-toc');
    if (toc && data.tocLabel) {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = data.tocLabel;
      button.addEventListener('click', () => {
        const target = document.getElementById(sectionId);
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
      const legacyButton = Array.from(toc.querySelectorAll('button')).find((item) => item.textContent.trim() === 'Наследие');
      if (legacyButton) {
        toc.insertBefore(button, legacyButton);
      } else {
        toc.appendChild(button);
      }
    }

    const paragraphs = Array.isArray(data.paragraphs)
      ? data.paragraphs.map((text) => `<p class="dark">${escapeHtml(text)}</p>`).join('')
      : '';

    const note = data.note
      ? `<aside class="editorial-note-card compact artist-museum-note">
          <h4>${escapeHtml(data.note.title || '')}</h4>
          <p>${escapeHtml(data.note.text || '')}</p>
        </aside>`
      : '';

    const link = data.link && data.link.url
      ? `<div style="margin-top: 28px;">
          <a href="${escapeHtml(data.link.url)}" target="_blank" rel="noopener" class="btn btn-light">${escapeHtml(data.link.label || 'Открыть Государственный каталог')}</a>
        </div>`
      : '';

    const section = document.createElement('section');
    section.className = 'content-section bg-cool';
    section.id = sectionId;
    section.innerHTML = `
      <div class="content-block reveal">
        <h2 class="dark">${escapeHtml(data.title || '')}</h2>
        ${data.subtitle ? `<div class="subtitle dark">${escapeHtml(data.subtitle)}</div>` : ''}
        <div class="divider gold"></div>
        <div class="content-narrow" style="margin-top: 32px;">
          ${paragraphs}
          ${note}
          ${link}
        </div>
      </div>
    `;

    legacySection.parentNode.insertBefore(section, legacySection);
  }

  function loadMuseumCollections() {
    fetch(JSON_PATH, { cache: 'no-store' })
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load JSON: ${JSON_PATH}`);
        return res.json();
      })
      .then(renderMuseumCollections)
      .catch((error) => {
        console.error('Museum collections sync error:', error);
      });
  }

  if (window.__contentSyncPromise && typeof window.__contentSyncPromise.then === 'function') {
    window.__contentSyncPromise.then(loadMuseumCollections).catch(loadMuseumCollections);
  } else {
    loadMuseumCollections();
  }
})();
