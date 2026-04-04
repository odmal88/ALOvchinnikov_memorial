(function initArtistRouteMap() {
  const ROUTE_JSON_PATH = '09_SOURCE_JSON/pages/route.json';
  const SVG_NS = 'http://www.w3.org/2000/svg';

  function fetchJson(path) {
    return fetch(path).then((res) => {
      if (!res.ok) throw new Error(`Failed to load JSON: ${path}`);
      return res.json();
    });
  }

  function projectPoint(lat, lon, bounds, width, height, dx = 0, dy = 0) {
    const x = ((lon - bounds.west) / (bounds.east - bounds.west)) * width + dx;
    const y = ((bounds.north - lat) / (bounds.north - bounds.south)) * height + dy;
    return { x, y };
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
        node.setAttribute('r', isActive ? '13' : '10');
      });
    }

    points.forEach((point) => {
      const { x, y } = projectPoint(point.lat, point.lon, bounds, width, height, point.dx || 0, point.dy || 0);
      const circle = document.createElementNS(SVG_NS, 'circle');
      circle.setAttribute('cx', x.toFixed(1));
      circle.setAttribute('cy', y.toFixed(1));
      circle.setAttribute('r', '10');
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
