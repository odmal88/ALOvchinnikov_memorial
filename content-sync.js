(function initContentSync() {
  const JSON_PATHS = {
    site: '09_SOURCE_JSON/shared/site.json',
    home: '09_SOURCE_JSON/pages/home.json',
    exhibition: '09_SOURCE_JSON/pages/exhibition.json',
    about: '09_SOURCE_JSON/pages/about.json',
    visit: '09_SOURCE_JSON/pages/visit.json'
  };

  function fetchJson(path) {
    return fetch(path).then((res) => {
      if (!res.ok) throw new Error(`Failed to load JSON: ${path}`);
      return res.json();
    });
  }

  function setText(selector, text) {
    if (text == null) return;
    const el = document.querySelector(selector);
    if (el) el.textContent = String(text);
  }

  function setHTML(selector, html) {
    if (html == null) return;
    const el = document.querySelector(selector);
    if (el) el.innerHTML = String(html);
  }

  function setRoute(selector, route) {
    if (!route) return;
    const el = document.querySelector(selector);
    if (!el) return;
    el.setAttribute('data-route', route);
    el.setAttribute('href', `#${route}`);
  }

  function joinLines(lines) {
    if (!Array.isArray(lines)) return '';
    return lines.join('<br>');
  }

  function splitLinesFromNode(node) {
    if (!node) return [];
    return node.innerHTML
      .split(/<br\s*\/?>/i)
      .map((line) => line.replace(/<[^>]+>/g, '').trim())
      .filter(Boolean);
  }

  function findVisitDetailBlockByTitle(title) {
    const blocks = document.querySelectorAll('#page-visit .visit-details-grid .visit-detail-block');
    return Array.from(blocks).find((block) => {
      const h4 = block.querySelector('h4');
      return h4 && h4.textContent.trim() === title;
    }) || null;
  }

  function setVisitDetailValue(title, value, options = {}) {
    if (!value) return;
    const { preserveExtraLines = false } = options;
    const block = findVisitDetailBlockByTitle(title);
    if (!block) return;

    const valueNode = block.querySelector('p');
    if (!valueNode) return;

    const newLines = String(value).split('\n').map((line) => line.trim()).filter(Boolean);
    if (!preserveExtraLines) {
      valueNode.innerHTML = newLines.join('<br>');
      return;
    }

    const existingLines = splitLinesFromNode(valueNode);
    const mergedLines = existingLines.length > newLines.length
      ? newLines.concat(existingLines.slice(newLines.length))
      : newLines;

    valueNode.innerHTML = mergedLines.join('<br>');
  }

  function syncShared(site) {
    if (!site) return;

    const dates = site?.dates?.display;
    const datesFull = site?.dates?.displayFull;
    const openingShort = site?.opening?.displayShort;
    const openingFull = site?.opening?.display;
    const venueName = site?.venue?.name;
    const city = site?.venue?.city;
    const address = site?.venue?.address;
    const admission = site?.visit?.admission;
    const hours = site?.visit?.hours;
    const closedDay = site?.visit?.closedDay;

    setText('#page-home .hero-meta .hero-meta-item:nth-child(1) .value', dates);
    setText('#page-home .hero-meta .hero-meta-item:nth-child(2) .value', venueName);
    setText('#page-home .hero-meta .hero-meta-item:nth-child(3) .value', city);

    setText('#page-home .home-visit-teaser .visit-info h3', venueName);
    setHTML('#page-home .home-visit-teaser .visit-text', [dates, `Открытие выставки — ${openingShort}`, `${city}, ${address}`, admission].filter(Boolean).join('<br>'));

    setVisitDetailValue('Даты проведения', datesFull || dates);
    setVisitDetailValue('Открытие выставки', openingFull);
    setVisitDetailValue('Место', [venueName, address, city].filter(Boolean).join('\n'), { preserveExtraLines: true });
    setVisitDetailValue('Часы работы', [hours, closedDay].filter(Boolean).join('\n'), { preserveExtraLines: true });
    setVisitDetailValue('Условия посещения', admission, { preserveExtraLines: true });

    setHTML('#siteFooter .footer-brand p', [dates, `${venueName}, ${city}`].filter(Boolean).join('<br>'));
  }

  function syncHome(home) {
    if (!home) return;
    const hero = home.hero || {};

    setText('#page-home .hero-label', hero.label);
    setHTML('#page-home h1', [hero.titleLine1, hero.titleLine2 ? `<em>${hero.titleLine2}</em>` : ''].filter(Boolean).join('<br>'));
    setText('#page-home .hero-subtitle', hero.subtitle);
    setText('#page-home .hero-text', hero.lead);

    if (Array.isArray(hero.metaItems)) {
      hero.metaItems.slice(0, 3).forEach((item, idx) => {
        setText(`#page-home .hero-meta .hero-meta-item:nth-child(${idx + 1}) .label`, item.label);
        setText(`#page-home .hero-meta .hero-meta-item:nth-child(${idx + 1}) .value`, item.value);
      });
    }

    setText('#page-home .hero-buttons .btn.btn-gold', hero?.buttons?.primary?.label);
    setRoute('#page-home .hero-buttons .btn.btn-gold', hero?.buttons?.primary?.route);
    setText('#page-home .hero-buttons .btn.btn-white', hero?.buttons?.secondary?.label);
    setRoute('#page-home .hero-buttons .btn.btn-white', hero?.buttons?.secondary?.route);

    setText('#page-home #home-intro .section-title', home?.intro?.title);
    setText('#page-home #home-intro .section-subtitle', home?.intro?.subtitle);
    setText('#page-home #home-intro .section-lead', home?.intro?.lead);

    setText('#page-home .home-artist-teaser .artist-text h3', home?.artistTeaser?.title);
    setText('#page-home .home-artist-teaser .artist-text p', home?.artistTeaser?.text);
    setText('#page-home .home-artist-teaser .artist-buttons .btn', home?.artistTeaser?.button?.label);
    setRoute('#page-home .home-artist-teaser .artist-buttons .btn', home?.artistTeaser?.button?.route);

    setText('#page-home .home-works-section .section-title', home?.worksTeaser?.title);
    setText('#page-home .home-works-section .section-lead', home?.worksTeaser?.lead);
    setText('#page-home .home-works-section > .container > div[style*="text-align"] .btn', home?.worksTeaser?.button?.label);
    setRoute('#page-home .home-works-section > .container > div[style*="text-align"] .btn', home?.worksTeaser?.button?.route);

    if (Array.isArray(home?.worksTeaser?.items)) {
      document.querySelectorAll('#page-home .home-works-section .works-grid .work-card').forEach((card, idx) => {
        const item = home.worksTeaser.items[idx];
        if (!item) return;
        const title = card.querySelector('h4');
        const meta = card.querySelector('.work-meta');
        if (title) title.textContent = item.title || title.textContent;
        if (meta) meta.textContent = item.meta || meta.textContent;
        if (item.route) {
          card.setAttribute('data-route', item.route);
          card.setAttribute('href', `#${item.route}`);
        }
      });
    }

    setText('#page-home .home-visit-title', home?.visitTeaser?.title);
    setText('#page-home .home-visit-teaser .visit-info h3', home?.visitTeaser?.place);
    setHTML('#page-home .home-visit-teaser .visit-text', joinLines(home?.visitTeaser?.lines));
    setText('#page-home .home-visit-teaser .visit-buttons .btn', home?.visitTeaser?.button?.label);
    setRoute('#page-home .home-visit-teaser .visit-buttons .btn', home?.visitTeaser?.button?.route);

    setText('#page-home .home-digital-hub .section-title', home?.digitalTeaser?.title);
    if (Array.isArray(home?.digitalTeaser?.items)) {
      document.querySelectorAll('#page-home .home-digital-hub .digital-blocks .digital-block').forEach((block, idx) => {
        const item = home.digitalTeaser.items[idx];
        if (!item) return;
        const title = block.querySelector('h4');
        const text = block.querySelector('p');
        const button = block.querySelector('.btn, a.btn, span.btn');
        if (title) title.textContent = item.title || title.textContent;
        if (text) text.textContent = item.text || text.textContent;
        if (button) button.textContent = item?.button?.label || button.textContent;
        if (item?.button?.route) {
          if (block.matches('a')) {
            block.setAttribute('data-route', item.button.route);
            block.setAttribute('href', `#${item.button.route}`);
          }
          if (button.matches('a')) {
            button.setAttribute('data-route', item.button.route);
            button.setAttribute('href', `#${item.button.route}`);
          }
        }
      });
    }

    setText('#page-home .home-memory-quiet .section-title', home?.memoryTeaser?.title);
    setText('#page-home .home-memory-quiet .section-lead', home?.memoryTeaser?.text);
    setText('#page-home .home-memory-link', home?.memoryTeaser?.button?.label);
    setRoute('#page-home .home-memory-link', home?.memoryTeaser?.button?.route);
  }

  function syncExhibition(exhibition) {
    if (!exhibition) return;
    setText('#page-exhibition .page-hero-label', exhibition?.hero?.label);
    setHTML('#page-exhibition .page-hero h1', exhibition?.hero?.title ? `${exhibition.hero.title.replace(/\s+(\S+)$/, ' <em>$1</em>')}` : null);
    setText('#page-exhibition .page-hero-subtitle', exhibition?.hero?.subtitle);

    const sectionMap = {
      concept: exhibition?.concept,
      unity: exhibition?.unity,
      mainLines: exhibition?.mainLines,
      viewerPath: exhibition?.viewerPath,
      titleMeaning: exhibition?.titleMeaning,
      structure: exhibition?.structure,
      continuity: exhibition?.continuity,
      digitalExtension: exhibition?.digitalExtension
    };

    Object.entries(sectionMap).forEach(([key, data]) => {
      const base = `#page-exhibition [data-sync-section="${key}"]`;
      setText(`${base} h2`, data?.title);
      setText(`${base} .subtitle`, data?.subtitle);
    });

    if (Array.isArray(exhibition?.concept?.paragraphs)) {
      const conceptContainer = document.querySelector('#page-exhibition [data-sync-section="concept"] .content-narrow');
      if (conceptContainer) {
        const conceptParagraphs = exhibition.concept.paragraphs
          .map((text) => `<p style="font-family: var(--sans); font-size: 15px; font-weight: 300; color: var(--text-muted); line-height: 1.8;">${text}</p>`)
          .join('');
        conceptContainer.innerHTML = conceptParagraphs;
      }
    }
  }

  function syncAbout(about) {
    if (!about) return;
    setText('#page-artist .page-hero-label', about?.hero?.label);
    setHTML('#page-artist .page-hero h1', about?.hero?.title ? about.hero.title.replace(/\s+(\S+)$/, ' <em>$1</em>') : null);
    setText('#page-artist .page-hero-subtitle', about?.hero?.subtitle);

    setText('#artist-intro .artist-intro-headline', about?.intro?.headline);
    if (Array.isArray(about?.intro?.paragraphs)) {
      document.querySelectorAll('#artist-intro .artist-intro-text p').forEach((p, idx) => {
        if (about.intro.paragraphs[idx]) p.textContent = about.intro.paragraphs[idx];
      });
    }

    setText('#artist-life-geo h2', about?.biography?.title);
    if (Array.isArray(about?.biography?.paragraphs)) {
      const bioTarget = document.querySelector('#artist-life-geo .artist-module:first-child');
      if (bioTarget) {
        const ps = bioTarget.querySelectorAll('p.dark');
        about.biography.paragraphs.slice(0, ps.length).forEach((text, idx) => {
          ps[idx].textContent = text;
        });
      }
    }

    setText('#artist-north h2', about?.geography?.title);
    if (Array.isArray(about?.geography?.paragraphs)) {
      document.querySelectorAll('#artist-north .artist-focus-grid > div p.dark').forEach((p, idx) => {
        if (about.geography.paragraphs[idx]) p.textContent = about.geography.paragraphs[idx];
      });
    }

    setText('#artist-index h2', about?.themes?.title);
    if (Array.isArray(about?.themes?.items)) {
      const chips = document.querySelectorAll('#artist-index .artist-index-list span');
      about.themes.items.slice(0, chips.length).forEach((item, idx) => {
        chips[idx].textContent = item.title;
      });
    }

    setText('#artist-legacy h2', about?.legacy?.title);
    if (Array.isArray(about?.legacy?.paragraphs)) {
      document.querySelectorAll('#artist-legacy .content-narrow p').forEach((p, idx) => {
        if (about.legacy.paragraphs[idx]) p.textContent = about.legacy.paragraphs[idx];
      });
    }
  }

  function syncVisit(visit) {
    if (!visit) return;
    setText('#page-visit .page-hero-label', visit?.hero?.label || 'Посещение');
    setText('#page-visit .page-hero h1', visit?.hero?.title);
    setText('#page-visit .page-hero-subtitle', visit?.hero?.subtitle);

    if (Array.isArray(visit?.details?.items)) {
      visit.details.items.forEach((item) => {
        setVisitDetailValue(item.title, item.value, { preserveExtraLines: true });
      });
    }
  }

  const contentSyncPromise = Promise.all([
    fetchJson(JSON_PATHS.site),
    fetchJson(JSON_PATHS.home),
    fetchJson(JSON_PATHS.exhibition),
    fetchJson(JSON_PATHS.about),
    fetchJson(JSON_PATHS.visit)
  ])
    .then(([site, home, exhibition, about, visit]) => {
      syncShared(site);
      syncHome(home);
      syncExhibition(exhibition);
      syncAbout(about);
      syncVisit(visit);
      window.__contentSyncReady = true;
    })
    .catch((error) => {
      console.error('Content sync error:', error);
      window.__contentSyncReady = false;
      throw error;
    });

  window.__contentSyncPromise = contentSyncPromise;
})();
