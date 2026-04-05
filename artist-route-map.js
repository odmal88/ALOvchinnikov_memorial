(function initArtistRouteMap() {
  const ROUTE_JSON_PATH = '09_SOURCE_JSON/pages/route.json';
  const SVG_NS = 'http://www.w3.org/2000/svg';
  const REAL_RUSSIA_EUROPE_OUTLINE_D = 'M960.0,538.8 L847.4,508.6 L799.5,509.4 L736.2,542.8 L732.4,565.2 L700.9,547.4 L667.6,610.6 L693.7,631.4 L716.4,630.5 L736.0,651.0 L732.9,666.8 L748.4,671.8 L734.5,689.9 L704.7,695.0 L674.2,726.7 L702.1,755.8 L699.2,776.0 L561.9,776.0 L468.0,762.7 L393.9,725.2 L367.4,707.2 L389.7,702.3 L415.1,676.6 L398.0,664.5 L443.2,652.0 L442.4,645.3 L414.9,650.2 L415.8,636.6 L461.3,625.8 L459.4,598.6 L471.5,573.6 L408.3,563.9 L389.4,549.6 L365.9,554.4 L326.9,543.6 L316.7,524.3 L292.2,522.8 L297.3,507.1 L277.7,489.7 L217.4,496.9 L202.7,467.1 L245.3,458.6 L215.8,445.0 L185.9,413.8 L189.5,391.1 L143.4,387.5 L106.8,372.1 L94.3,339.2 L79.5,332.1 L92.6,322.4 L83.6,293.8 L105.4,276.1 L100.8,270.8 L135.6,253.8 L103.5,239.2 L197.6,182.4 L209.2,166.7 L163.8,145.7 L176.3,125.7 L148.7,102.9 L169.3,76.6 L133.7,41.7 L503.2,40.0 L469.8,62.5 L419.7,70.7 L282.8,47.4 L260.3,51.3 L310.3,73.7 L314.3,119.3 L377.7,136.6 L381.7,121.7 L363.2,108.6 L382.7,96.9 L456.9,116.0 L482.7,108.6 L462.1,86.1 L533.5,56.1 L590.5,68.5 L608.3,47.5 L597.9,40.0 L640.6,40.0 L664.0,50.2 L712.8,40.0 L960.0,40.0 L960.0,538.8 Z';
  const CRIMEA_D = 'M250.0,734.0 L298.0,726.0 L354.0,756.0 L326.0,787.0 L274.0,784.0 L240.0,761.0 Z';

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

  function applyRealContour(svg) {
    if (!svg) return;
    const outline = svg.querySelector('.artist-route-map-outline');
    const crimea = svg.querySelector('.artist-route-map-crimea');
    if (outline) outline.setAttribute('d', REAL_RUSSIA_EUROPE_OUTLINE_D);
    if (crimea) crimea.setAttribute('d', CRIMEA_D);
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

    applyRealContour(svg);

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
      const { x, y } = projectPoint(point.lat, point.lon, bounds, width, height);
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
