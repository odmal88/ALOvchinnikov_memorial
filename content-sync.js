(function initContentSync() {
  const JSON_PATHS = {
    site: '09_SOURCE_JSON/shared/site.json',
    home: '09_SOURCE_JSON/pages/home.json',
    exhibition: '09_SOURCE_JSON/pages/exhibition.json',
    about: '09_SOURCE_JSON/pages/about.json',
    visit: '09_SOURCE_JSON/pages/visit.json',
    route: '09_SOURCE_JSON/pages/route.json'
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

    function renderParagraphs(container, paragraphs, className = 'dark') {
      if (!container || !Array.isArray(paragraphs)) return;
      container.innerHTML = paragraphs
        .map((text) => `<p class="${className}">${text}</p>`)
        .join('');
    }

    function renderMainLineItems(container, items) {
      if (!container || !Array.isArray(items)) return;
      container.innerHTML = items.map((item) => `
        <article class="expo-editorial-item">
          <h4>${item.title || ''}</h4>
          <p>${item.text || ''}</p>
        </article>
      `).join('');
    }

    function renderExpoSections(container, items) {
      if (!container || !Array.isArray(items)) return;
      container.innerHTML = items.map((item) => `
        <div class="expo-card">
          <div class="expo-card-num">${item.section || ''}</div>
          <h4>${item.title || ''}</h4>
          <p>${item.text || ''}</p>
        </div>
      `).join('');
    }

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

    renderParagraphs(
      document.querySelector('#page-exhibition [data-sync-section="concept"] .content-narrow'),
      exhibition?.concept?.paragraphs
    );

    renderParagraphs(
      document.querySelector('#page-exhibition [data-sync-section="continuity"] .content-narrow'),
      exhibition?.continuity?.paragraphs
    );

    setText('#page-exhibition [data-sync-section="titleMeaning"] .quote', exhibition?.titleMeaning?.quote);
    const titleMeaningContainer = document.querySelector('#page-exhibition [data-sync-section="titleMeaning"] .content-narrow');
    if (titleMeaningContainer && Array.isArray(exhibition?.titleMeaning?.paragraphs)) {
      const quote = titleMeaningContainer.querySelector('.quote');
      const paragraphsHtml = exhibition.titleMeaning.paragraphs
        .map((text) => `<p class="dark">${text}</p>`)
        .join('');
      titleMeaningContainer.innerHTML = `${quote ? quote.outerHTML : ''}${paragraphsHtml}`;
    }

    const unityTextContainer = document.querySelector('#page-exhibition [data-sync-section="unity"] .content-two-col > div');
    renderParagraphs(unityTextContainer, exhibition?.unity?.paragraphs);
    setText('#page-exhibition [data-sync-section="unity"] .editorial-note-card h4', exhibition?.unity?.note?.title);
    setText('#page-exhibition [data-sync-section="unity"] .editorial-note-card p', exhibition?.unity?.note?.text);

    renderMainLineItems(
      document.querySelector('#page-exhibition [data-sync-section="mainLines"] .expo-editorial-grid'),
      exhibition?.mainLines?.items
    );

    renderExpoSections(
      document.querySelector('#page-exhibition [data-sync-section="structure"] .expo-sections'),
      exhibition?.structure?.items
    );

    const viewerPathNarrow = document.querySelector('#page-exhibition [data-sync-section="viewerPath"] .content-narrow');
    const viewerPathNote = viewerPathNarrow
      ? viewerPathNarrow.querySelector('.editorial-note-card.compact')
      : null;
    const viewerPathNoteHTML = viewerPathNote ? viewerPathNote.outerHTML : '';
    if (viewerPathNarrow && Array.isArray(exhibition?.viewerPath?.paragraphs)) {
      viewerPathNarrow.innerHTML = exhibition.viewerPath.paragraphs
        .map((text) => `<p class="dark">${text}</p>`)
        .join('') + viewerPathNoteHTML;
    }
    setText('#page-exhibition [data-sync-section="viewerPath"] .editorial-note-card.compact h4', exhibition?.viewerPath?.note?.title);
    setText('#page-exhibition [data-sync-section="viewerPath"] .editorial-note-card.compact p', exhibition?.viewerPath?.note?.text);

    const digitalNarrow = document.querySelector('#page-exhibition [data-sync-section="digitalExtension"] .content-narrow');
    const digitalButtonsWrap = digitalNarrow
      ? digitalNarrow.querySelector('div[style*="display: flex"]')
      : null;
    const digitalButtonsHTML = digitalButtonsWrap ? digitalButtonsWrap.outerHTML : '';
    if (digitalNarrow && Array.isArray(exhibition?.digitalExtension?.paragraphs)) {
      digitalNarrow.innerHTML = exhibition.digitalExtension.paragraphs
        .map((text) => `<p class="dark">${text}</p>`)
        .join('') + digitalButtonsHTML;
    }
    const syncedDigitalButtonsWrap = document.querySelector('#page-exhibition [data-sync-section="digitalExtension"] .content-narrow > div[style*="display: flex"]');
    if (syncedDigitalButtonsWrap && Array.isArray(exhibition?.digitalExtension?.buttons)) {
      const buttons = syncedDigitalButtonsWrap.querySelectorAll('a');
      exhibition.digitalExtension.buttons.slice(0, buttons.length).forEach((item, idx) => {
        buttons[idx].textContent = item.label || buttons[idx].textContent;
        if (item.route) {
          buttons[idx].setAttribute('data-route', item.route);
          buttons[idx].setAttribute('href', `#${item.route}`);
        }
      });
    }
  }

  function syncAbout(about) {
    if (!about) return;
    setText('#page-artist .page-hero-label', about?.hero?.label);
    setHTML('#page-artist .page-hero h1', about?.hero?.title ? about.hero.title.replace(/\s+(\S+)$/, ' <em>$1</em>') : null);
    setText('#page-artist .page-hero-subtitle', about?.hero?.subtitle);

    setText('#artist-family .artist-intro-headline', about?.intro?.headline);
    if (Array.isArray(about?.intro?.paragraphs)) {
      document.querySelectorAll('#artist-family .artist-intro-text p').forEach((p, idx) => {
        if (about.intro.paragraphs[idx]) p.textContent = about.intro.paragraphs[idx];
      });
    }

    if (Array.isArray(about?.biography?.paragraphs)) {
      document.querySelectorAll('#artist-family .artist-family-body p.dark').forEach((p, idx) => {
        if (about.biography.paragraphs[idx]) p.textContent = about.biography.paragraphs[idx];
      });
    }

    setText('#artist-school h2', about?.school?.title);
    if (Array.isArray(about?.school?.paragraphs)) {
      document.querySelectorAll('#artist-school .content-narrow p.dark').forEach((p, idx) => {
        if (about.school.paragraphs[idx]) p.textContent = about.school.paragraphs[idx];
      });
    }

    setText('#artist-routes h2', about?.geography?.title);
    if (Array.isArray(about?.geography?.paragraphs)) {
      document.querySelectorAll('#artist-routes .artist-focus-grid > div p.dark').forEach((p, idx) => {
        if (about.geography.paragraphs[idx]) p.textContent = about.geography.paragraphs[idx];
      });
    }

    setText('#artist-index h2', about?.themes?.title);
    if (Array.isArray(about?.themes?.items)) {
      const themeContainer = document.querySelector('#artist-index .artist-theme-grid');
      if (themeContainer) {
        themeContainer.innerHTML = about.themes.items
          .map((item) => `
            <article class="artist-theme-card">
              <h3>${item.title || ''}</h3>
              <p class="dark">${item.text || ''}</p>
            </article>
          `)
          .join('');
      }
    }

    setText('#artist-method h2', about?.language?.title);
    if (Array.isArray(about?.language?.paragraphs)) {
      const languageIntro = document.querySelector('#artist-method .artist-method-intro');
      if (languageIntro) {
        languageIntro.innerHTML = about.language.paragraphs
          .map((text) => `<p class="dark">${text}</p>`)
          .join('');
      }
    }

    setText('#artist-legacy h2', about?.legacy?.title);
    if (Array.isArray(about?.legacy?.paragraphs)) {
      document.querySelectorAll('#artist-legacy .content-narrow p').forEach((p, idx) => {
        if (about.legacy.paragraphs[idx]) p.textContent = about.legacy.paragraphs[idx];
      });
    }

  }

  function syncRouteMap(routeData) {
    const section = document.querySelector('#artist-routes');
    if (!section) return;

    const map = section.querySelector('.artist-route-map');
    const pointsWrap = section.querySelector('.artist-route-map-points');
    const legendWrap = section.querySelector('.artist-route-map-legend');
    const captionTitle = section.querySelector('.artist-route-map-caption h4');
    const captionText = section.querySelector('.artist-route-map-caption p');
    const routeLine = section.querySelector('.artist-route-map-route');

    if (!map || !pointsWrap || !legendWrap || !captionTitle || !captionText || !routeLine) return;

    const GEO_BOUNDS = {
      minLat: 43.5,
      maxLat: 66.5,
      minLon: 26,
      maxLon: 48
    };

    const MAP_FRAME = {
      left: 36,
      top: 26,
      width: 266,
      height: 226
    };

    function projectPoint(lat, lon) {
      const clampedLat = Math.max(GEO_BOUNDS.minLat, Math.min(GEO_BOUNDS.maxLat, Number(lat)));
      const clampedLon = Math.max(GEO_BOUNDS.minLon, Math.min(GEO_BOUNDS.maxLon, Number(lon)));
      const lonRange = GEO_BOUNDS.maxLon - GEO_BOUNDS.minLon;
      const latRange = GEO_BOUNDS.maxLat - GEO_BOUNDS.minLat;
      const x = MAP_FRAME.left + ((clampedLon - GEO_BOUNDS.minLon) / lonRange) * MAP_FRAME.width;
      const y = MAP_FRAME.top + ((GEO_BOUNDS.maxLat - clampedLat) / latRange) * MAP_FRAME.height;
      return { x, y };
    }

    const points = Array.isArray(routeData?.points)
      ? routeData.points
        .filter((point) => Number.isFinite(Number(point?.lat)) && Number.isFinite(Number(point?.lon)))
        .map((point) => {
          const projected = projectPoint(point.lat, point.lon);
          return {
            ...point,
            projectedX: projected.x,
            projectedY: projected.y
          };
        })
      : [];

    if (!points.length) {
      pointsWrap.innerHTML = '';
      legendWrap.innerHTML = '';
      routeLine.setAttribute('points', '');
      captionTitle.textContent = '';
      captionText.textContent = '';
      return;
    }

    routeLine.setAttribute(
      'points',
      points.map((point) => `${point.projectedX.toFixed(1)},${point.projectedY.toFixed(1)}`).join(' ')
    );

    pointsWrap.innerHTML = '';
    legendWrap.innerHTML = '';

    function setActivePoint(pointId) {
      const active = points.find((item) => item.id === pointId) || points[0];
      captionTitle.textContent = active.title || '';
      captionText.textContent = active.text || '';

      section.querySelectorAll('[data-route-point-id]').forEach((el) => {
        const isActive = el.dataset.routePointId === active.id;
        el.classList.toggle('is-active', isActive);
        if (el.matches('button')) el.setAttribute('aria-pressed', isActive ? 'true' : 'false');
      });
    }

    points.forEach((point, index) => {
      const pointId = point.id || `route-point-${index}`;

      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'artist-route-point';
      button.dataset.routePointId = pointId;
      button.style.left = `${(point.projectedX / 360) * 100}%`;
      button.style.top = `${(point.projectedY / 270) * 100}%`;
      button.setAttribute('role', 'listitem');
      button.setAttribute('aria-label', point.title || point.shortLabel || `Точка ${index + 1}`);
      button.setAttribute('aria-pressed', 'false');

      const marker = document.createElement('span');
      marker.className = 'artist-route-point-dot';
      marker.setAttribute('aria-hidden', 'true');

      const label = document.createElement('span');
      label.className = 'artist-route-point-label';
      label.textContent = point.shortLabel || point.title || `Точка ${index + 1}`;

      button.append(marker, label);

      const legendButton = document.createElement('button');
      legendButton.type = 'button';
      legendButton.className = 'artist-route-legend-item';
      legendButton.dataset.routePointId = pointId;
      legendButton.setAttribute('role', 'listitem');
      legendButton.setAttribute('aria-pressed', 'false');
      legendButton.textContent = point.title || point.shortLabel || `Точка ${index + 1}`;

      [button, legendButton].forEach((control) => {
        control.addEventListener('click', () => setActivePoint(pointId));
        control.addEventListener('focus', () => setActivePoint(pointId));
      });
      button.addEventListener('mouseenter', () => setActivePoint(pointId));

      pointsWrap.appendChild(button);
      legendWrap.appendChild(legendButton);
    });

    setActivePoint(points[0].id);
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
    fetchJson(JSON_PATHS.visit),
    fetchJson(JSON_PATHS.route)
  ])
    .then(([site, home, exhibition, about, visit, route]) => {
      syncShared(site);
      syncHome(home);
      syncExhibition(exhibition);
      syncAbout(about);
      syncVisit(visit);
      syncRouteMap(route);
      window.__contentSyncReady = true;
    })
    .catch((error) => {
      console.error('Content sync error:', error);
      window.__contentSyncReady = false;
      throw error;
    });

  window.__contentSyncPromise = contentSyncPromise;
})();
