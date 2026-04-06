(function initArtistRouteMap() {
  const ROUTE_JSON_PATH = '09_SOURCE_JSON/pages/route.json';
  const MAP_SVG_PATH = 'assets/maps/russia_exhibition_context.svg';

  function fetchJson(path) {
    return fetch(path).then((res) => {
      if (!res.ok) throw new Error(`Failed to load JSON: ${path}`);
      return res.json();
    });
  }

  function fetchText(path) {
    return fetch(path).then((res) => {
      if (!res.ok) throw new Error(`Failed to load asset: ${path}`);
      return res.text();
    });
  }

  function syncArtistRouteMap(route, svgText) {
    const card = document.querySelector('#artist-routes .artist-route-map-card');
    if (!card || !route || !svgText) return;

    const shell = card.querySelector('.artist-route-map-shell');
    const select = card.querySelector('.artist-route-select');
    const detailTitle = card.querySelector('.artist-route-map-detail h3');
    const detailText = card.querySelector('.artist-route-map-detail p');

    if (!shell || !select || !detailTitle || !detailText) return;

    shell.innerHTML = svgText;
    const svg = shell.querySelector('svg');
    if (!svg) return;

    let markersGroup = svg.querySelector('.artist-route-map-markers');
    if (!markersGroup) {
      markersGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      markersGroup.setAttribute('class', 'artist-route-map-markers');
      svg.appendChild(markersGroup);
    }

    const points = Array.isArray(route.points)
      ? route.points.filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y))
      : [];

    if (!points.length) return;

    select.innerHTML = points.map((point) => `<option value="${point.id}">${point.title}</option>`).join('');
    markersGroup.innerHTML = '';

    const markerNodes = new Map();

    function setActive(activeId) {
      const activePoint = points.find((point) => point.id === activeId);
      if (!activePoint) return;

      select.value = activeId;
      detailTitle.textContent = activePoint.title;
      detailText.textContent = activePoint.text;

      markerNodes.forEach((node, id) => {
        const isActive = id === activeId;
        node.classList.toggle('is-active', isActive);
        node.setAttribute('r', isActive ? '7.5' : '6');
      });
    }

    points.forEach((point) => {
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', String(point.x));
      circle.setAttribute('cy', String(point.y));
      circle.setAttribute('r', '6');
      circle.setAttribute('tabindex', '0');
      circle.setAttribute('role', 'button');
      circle.setAttribute('aria-label', point.title);
      circle.setAttribute('fill', '#B8894D');
      circle.setAttribute('stroke', '#FBF8F3');
      circle.setAttribute('stroke-width', '3');
      circle.setAttribute('vector-effect', 'non-scaling-stroke');
      circle.classList.add('artist-route-map-point');

      const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
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

    setActive(route?.map?.activePointId || points[0].id);
  }

  Promise.all([
    fetchJson(ROUTE_JSON_PATH),
    fetchText(MAP_SVG_PATH)
  ])
    .then(([route, svgText]) => syncArtistRouteMap(route, svgText))
    .catch((error) => console.error('Artist route map error:', error));
})();
