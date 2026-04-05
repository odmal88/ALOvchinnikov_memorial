(function initArtistRouteMap() {
  const ROUTE_JSON_PATH = '09_SOURCE_JSON/pages/route.json';
  const SVG_NS = 'http://www.w3.org/2000/svg';

  // Geographic contour of European Russia and Crimea in real lat/lon space.
  const EUROPE_RUSSIA_OUTLINE = [
    { lon: 28.1, lat: 60.2 },
    { lon: 29.4, lat: 61.1 },
    { lon: 31.3, lat: 62.3 },
    { lon: 33.9, lat: 62.9 },
    { lon: 36.2, lat: 63.0 },
    { lon: 39.4, lat: 62.5 },
    { lon: 41.9, lat: 61.9 },
    { lon: 43.8, lat: 60.8 },
    { lon: 45.5, lat: 59.2 },
    { lon: 46.8, lat: 58.9 },
    { lon: 49.0, lat: 59.1 },
    { lon: 51.4, lat: 58.6 },
    { lon: 53.6, lat: 57.5 },
    { lon: 55.3, lat: 56.2 },
    { lon: 56.8, lat: 54.8 },
    { lon: 57.5, lat: 53.0 },
    { lon: 57.3, lat: 51.4 },
    { lon: 56.2, lat: 49.8 },
    { lon: 54.9, lat: 48.7 },
    { lon: 53.4, lat: 47.9 },
    { lon: 51.8, lat: 47.2 },
    { lon: 50.7, lat: 46.1 },
    { lon: 49.9, lat: 45.1 },
    { lon: 48.8, lat: 44.2 },
    { lon: 47.0, lat: 43.2 },
    { lon: 44.8, lat: 42.6 },
    { lon: 42.8, lat: 42.3 },
    { lon: 41.0, lat: 42.5 },
    { lon: 39.8, lat: 43.0 },
    { lon: 38.6, lat: 44.0 },
    { lon: 37.6, lat: 45.0 },
    { lon: 36.6, lat: 46.2 },
    { lon: 35.3, lat: 47.0 },
    { lon: 33.8, lat: 48.4 },
    { lon: 32.4, lat: 50.0 },
    { lon: 31.0, lat: 51.9 },
    { lon: 29.7, lat: 54.0 },
    { lon: 28.8, lat: 56.0 },
    { lon: 28.2, lat: 58.1 },
    { lon: 28.1, lat: 60.2 }
  ];

  const CRIMEA_OUTLINE = [
    { lon: 34.0, lat: 45.6 },
    { lon: 35.0, lat: 45.2 },
    { lon: 36.4, lat: 45.0 },
    { lon: 37.4, lat: 44.6 },
    { lon: 36.4, lat: 44.0 },
    { lon: 35.0, lat: 44.1 },
    { lon: 33.9, lat: 44.8 },
    { lon: 34.5, lat: 45.3 },
    { lon: 34.0, lat: 45.6 }
  ];

  function fetchJson(path) {
    return fetch(path).then((res) => {
      if (!res.ok) throw new Error(`Failed to load JSON: ${path}`);
      return res.json();
    });
  }

  function projectPoint(lat, lon, bounds, width, height) {
    const x = ((lon - bounds.west) / (bounds.east - bounds.west)) * width;
    const y = ((bounds.north - lat) / (bounds.north - bounds.south)) * height;
    return { x, y };
  }

  function buildPath(coords, bounds, width, height) {
    return coords
      .map((coord, index) => {
        const { x, y } = projectPoint(coord.lat, coord.lon, bounds, width, height);
        return `${index === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  }

  function applyGeographicContours(svg, bounds, width, height) {
    if (!svg) return;
    const outline = svg.querySelector('.artist-route-map-outline');
    const crimea = svg.querySelector('.artist-route-map-crimea');
    if (outline) outline.setAttribute('d', buildPath(EUROPE_RUSSIA_OUTLINE, bounds, width, height));
    if (crimea) crimea.setAttribute('d', buildPath(CRIMEA_OUTLINE, bounds, width, height));
  }

  function syncArtistRouteMap(route) {
    const card = document.querySelector('#artist-routes .artist-route-map-card');
    if (!card || !route) return;

    const svg = card.querySelector('.artist-route-map-svg');
    const markersGroup = svg ? svg.querySelector('.artist-route-map-markers') : null;
    const select = card.querySelector('.artist-route-select');
    const detailTitle = card.querySelector('.artist-route-map-detail h3');
    const detailText = card.querySelector('.artist-route-map-detail p');

    const points = Array.isArray(route.points)
      ? route.points.filter((point) => Number.isFinite(point.lat) && Number.isFinite(point.lon))
      : [];

    if (!svg || !markersGroup || !select || !detailTitle || !detailText || !points.length) return;

    if (route?.map?.viewBox) {
      svg.setAttribute('viewBox', route.map.viewBox);
    }

    const viewBox = (svg.getAttribute('viewBox') || '0 0 1000 860').trim().split(/\s+/).map(Number);
    const width = viewBox[2] || 1000;
    const height = viewBox[3] || 860;
    const bounds = route?.map?.bounds || { west: 26, east: 56, north: 67, south: 43 };

    applyGeographicContours(svg, bounds, width, height);

    select.innerHTML = points
      .map((point) => `<option value="${point.id}">${point.title}</option>`)
      .join('');

    const markerNodes = new Map();
    markersGroup.innerHTML = '';

    function setActive(activeId) {
      const activePoint = points.find((point) => point.id === activeId);
      if (!activePoint) return;

      select.value = activeId;
      detailTitle.textContent = activePoint.title;
      detailText.textContent = activePoint.text;

      markerNodes.forEach((node, id) => {
        const isActive = id === activeId;
        node.classList.toggle('is-active', isActive);
        node.setAttribute('r', isActive ? '12' : '9');
      });
    }

    points.forEach((point) => {
      const { x, y } = projectPoint(point.lat, point.lon, bounds, width, height);
      const circle = document.createElementNS(SVG_NS, 'circle');
      circle.setAttribute('cx', x.toFixed(1));
      circle.setAttribute('cy', y.toFixed(1));
      circle.setAttribute('r', '9');
      circle.setAttribute('tabindex', '0');
      circle.setAttribute('role', 'button');
      circle.setAttribute('aria-label', point.title);
      circle.classList.add('artist-route-map-point');

      const title = document.createElementNS(SVG_NS, 'title');
      title.textContent = point.title;
      circle.appendChild(title);

      circle.addEventListener('click', () => setActive(point.id));
      circle.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          setActive(point.id);
        }
      });

      markersGroup.appendChild(circle);
      markerNodes.set(point.id, circle);
    });

    select.addEventListener('change', () => {
      setActive(select.value);
    });

    const initialId = route?.map?.activePointId && markerNodes.has(route.map.activePointId)
      ? route.map.activePointId
      : points[0].id;

    setActive(initialId);
  }

  fetchJson(ROUTE_JSON_PATH)
    .then(syncArtistRouteMap)
    .catch((error) => {
      console.error('Artist route map error:', error);
    });
})();
