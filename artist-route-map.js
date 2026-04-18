(function initArtistRouteMap() {
  const ROUTE_JSON_PATH = '09_SOURCE_JSON/pages/route.json';
  const LOCAL_FALLBACK_MAP = 'assets/maps/russia_europe_crimea.svg';

  const PERIOD_COLORS = {
    base: '#5D9ECF',
    historical_city: '#4D96C5',
    early_wide: '#C5843F',
    volga: '#C8A029',
    mature_return: '#BB8B2A',
    north: '#3D8DBA',
    south: '#C46A31'
  };

  function setModuleStatus(message) {
    const status = document.querySelector('#page-artist #artist-routes #mstatus');
    if (status) status.textContent = message;
  }

  function waitForMapHost() {
    return new Promise((resolve, reject) => {
      const immediate = document.querySelector('#page-artist #artist-routes .artist-route-map-module');
      if (immediate) {
        resolve(immediate);
        return;
      }

      const timeout = window.setTimeout(() => {
        observer.disconnect();
        reject(new Error('Map host not found in DOM'));
      }, 10000);

      const observer = new MutationObserver(() => {
        const found = document.querySelector('#page-artist #artist-routes .artist-route-map-module');
        if (!found) return;
        window.clearTimeout(timeout);
        observer.disconnect();
        resolve(found);
      });

      observer.observe(document.body, { childList: true, subtree: true });
    });
  }

  function fetchJson(path) {
    return fetch(path, { cache: 'no-store' }).then((res) => {
      if (!res.ok) throw new Error(`Failed to load JSON: ${path}`);
      return res.json();
    });
  }

  function buildLegend(host, route) {
    if (!host) return;
    const labels = route?.map?.periodLabels || {};
    const keys = Object.keys(labels).filter((key) => PERIOD_COLORS[key]);
    host.innerHTML = keys.map((key) => `
      <div class="artist-route-map-legend-item">
        <span class="dot" style="background:${PERIOD_COLORS[key]}"></span>
        <span>${labels[key]}</span>
      </div>
    `).join('');
  }

  function renderFallbackMap(route) {
    const host = document.querySelector('#page-artist #artist-routes .artist-route-map-module');
    if (!host || !route || !Array.isArray(route.points) || route.points.length === 0) return;

    const canvas = host.querySelector('#msvg');
    const tooltip = host.querySelector('#mtip');
    const status = host.querySelector('#mstatus');
    const legend = host.querySelector('#mleg');
    const detailWrap = document.querySelector('#page-artist #artist-routes .artist-route-map-detail');
    const detailTitle = detailWrap?.querySelector('h4');
    const detailText = detailWrap?.querySelector('.artist-route-map-detail-text');
    const detailMeta = detailWrap?.querySelector('.artist-route-map-detail-meta');
    if (!canvas || !tooltip || !status || !legend || !detailTitle || !detailText || !detailMeta) return;

    buildLegend(legend, route);

    canvas.innerHTML = `
      <div class="artist-route-fallback-map-wrap">
        <img src="${LOCAL_FALLBACK_MAP}" alt="Карта европейской части России и Крыма" class="artist-route-fallback-base" />
        <svg class="artist-route-fallback-overlay" viewBox="0 0 1320 720" aria-hidden="true"></svg>
      </div>
    `;

    const overlay = canvas.querySelector('.artist-route-fallback-overlay');
    if (!overlay) return;

    const lonMin = 19;
    const lonMax = 190;
    const latMin = 41;
    const latMax = 82;

    function project(lon, lat) {
      const x = ((lon - lonMin) / (lonMax - lonMin)) * 1320;
      const y = ((latMax - lat) / (latMax - latMin)) * 720;
      return [x, y];
    }

    route.points.forEach((point) => {
      const [x, y] = project(point.lon, point.lat);
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', x.toFixed(1));
      circle.setAttribute('cy', y.toFixed(1));
      circle.setAttribute('r', '5.2');
      circle.setAttribute('fill', PERIOD_COLORS[point.period] || '#B8894D');
      circle.setAttribute('stroke', 'rgba(248,239,223,0.95)');
      circle.setAttribute('stroke-width', '1.6');
      circle.style.cursor = 'pointer';
      circle.addEventListener('mouseenter', (event) => {
        tooltip.hidden = false;
        tooltip.innerHTML = `<strong>${point.title}</strong>`;
        tooltip.style.transform = `translate(${event.offsetX + 12}px, ${event.offsetY + 12}px)`;
      });
      circle.addEventListener('mouseleave', () => {
        tooltip.hidden = true;
      });
      circle.addEventListener('click', () => {
        const periodLabel = route.map?.periodLabels?.[point.period] || point.period || '';
        const categoryLabel = route.map?.categoryLabels?.[point.category] || point.category || '';
        detailTitle.textContent = point.title;
        detailText.textContent = point.text;
        detailMeta.textContent = [periodLabel, categoryLabel].filter(Boolean).join(' · ');
      });
      overlay.appendChild(circle);
    });

    const first = route.points[0];
    detailTitle.textContent = first.title;
    detailText.textContent = first.text;
    detailMeta.textContent = [route.map?.periodLabels?.[first.period], route.map?.categoryLabels?.[first.category]].filter(Boolean).join(' · ');
    status.textContent = 'Локальная карта маршрутов: стабильная версия без внешних CDN.';
  }

  waitForMapHost()
    .then(() => fetchJson(ROUTE_JSON_PATH))
    .then((route) => {
      renderFallbackMap(route);
    })
    .catch((error) => {
      console.error('Artist route map error:', error);
      setModuleStatus('Карта временно недоступна: не удалось загрузить маршрутные данные.');
    });
})();
