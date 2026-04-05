(function initArtistRouteMap() {
  const ROUTE_JSON_PATH = '09_SOURCE_JSON/pages/route.json';
  const D3_URL = 'https://cdn.jsdelivr.net/npm/d3@7/dist/d3.min.js';
  const TOPOJSON_URL = 'https://cdn.jsdelivr.net/npm/topojson-client@3/dist/topojson-client.min.js';
  const WORLD_ATLAS_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json';
  const SVG_NS = 'http://www.w3.org/2000/svg';
  const VIEWBOX = '0 0 1000 620';
  const MAP_BOUNDS = { west: 4, east: 72, north: 73, south: 40 };
  const COUNTRY_IDS = new Set([643, 246, 752, 578, 233, 428, 440, 112, 804, 616, 276, 250, 528, 56, 756, 380]);

  function loadScript(url, globalName) {
    if (window[globalName]) return Promise.resolve(window[globalName]);
    return new Promise((resolve, reject) => {
      const existing = Array.from(document.scripts).find((script) => script.src === url);
      if (existing) {
        existing.addEventListener('load', () => resolve(window[globalName]));
        existing.addEventListener('error', reject);
        return;
      }
      const script = document.createElement('script');
      script.src = url;
      script.async = true;
      script.onload = () => resolve(window[globalName]);
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  function ensureMapLibraries() {
    return loadScript(D3_URL, 'd3')
      .then(() => loadScript(TOPOJSON_URL, 'topojson'));
  }

  function fetchJson(path) {
    return fetch(path).then((res) => {
      if (!res.ok) throw new Error(`Failed to load JSON: ${path}`);
      return res.json();
    });
  }

  function getViewBoxSize(svg) {
    const [ , , width, height ] = (svg.getAttribute('viewBox') || VIEWBOX).trim().split(/\s+/).map(Number);
    return { width: width || 1000, height: height || 620 };
  }

  function projectPoint(lat, lon, projection) {
    const projected = projection([lon, lat]);
    return projected ? { x: projected[0], y: projected[1] } : null;
  }

  function buildBboxFeature(bounds) {
    return {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [bounds.west, bounds.south],
          [bounds.east, bounds.south],
          [bounds.east, bounds.north],
          [bounds.west, bounds.north],
          [bounds.west, bounds.south]
        ]]
      }
    };
  }

  function renderStaticMap(svg, route, atlas) {
    const d3 = window.d3;
    const topojson = window.topojson;
    if (!d3 || !topojson) return null;

    svg.innerHTML = '';
    svg.setAttribute('viewBox', VIEWBOX);

    const { width, height } = getViewBoxSize(svg);
    const bounds = route?.map?.bounds || MAP_BOUNDS;
    const projection = d3.geoConicEquidistant()
      .parallels([47, 62])
      .rotate([-40, 0])
      .fitExtent([[22, 20], [width - 22, height - 20]], buildBboxFeature(bounds));
    const path = d3.geoPath(projection);

    const countries = topojson.feature(atlas, atlas.objects.countries).features
      .filter((feature) => COUNTRY_IDS.has(Number(feature.id)));
    const russia = countries.find((feature) => Number(feature.id) === 643);

    const svgSel = d3.select(svg);
    svgSel.append('rect')
      .attr('width', width)
      .attr('height', height)
      .attr('fill', '#CFE0EA');

    svgSel.append('path')
      .datum(d3.geoGraticule().extent([[bounds.west, bounds.south], [bounds.east, bounds.north]]).step([10, 10])())
      .attr('fill', 'none')
      .attr('stroke', 'rgba(88, 102, 118, 0.18)')
      .attr('stroke-width', 0.8)
      .attr('d', path);

    svgSel.append('g')
      .selectAll('path')
      .data(countries)
      .join('path')
      .attr('d', path)
      .attr('fill', (feature) => Number(feature.id) === 643 ? '#E7E1D8' : '#F2EEE6')
      .attr('stroke', '#A6AFB7')
      .attr('stroke-width', (feature) => Number(feature.id) === 643 ? 1.4 : 0.8)
      .attr('vector-effect', 'non-scaling-stroke');

    if (russia) {
      svgSel.append('path')
        .datum(russia)
        .attr('d', path)
        .attr('fill', 'none')
        .attr('stroke', '#5B697C')
        .attr('stroke-width', 2.1)
        .attr('vector-effect', 'non-scaling-stroke');
    }

    const markersGroup = svgSel.append('g').attr('class', 'artist-route-map-markers');
    return { projection, markersGroup };
  }

  function syncArtistRouteMap(route, atlas) {
    const card = document.querySelector('#artist-routes .artist-route-map-card');
    if (!card || !route || !atlas) return;

    const svg = card.querySelector('.artist-route-map-svg');
    const select = card.querySelector('.artist-route-select');
    const detailTitle = card.querySelector('.artist-route-map-detail h3');
    const detailText = card.querySelector('.artist-route-map-detail p');
    if (!svg || !select || !detailTitle || !detailText) return;

    const points = Array.isArray(route.points)
      ? route.points.filter((point) => Number.isFinite(point.lat) && Number.isFinite(point.lon))
      : [];
    if (!points.length) return;

    const rendered = renderStaticMap(svg, route, atlas);
    if (!rendered) return;

    const { projection, markersGroup } = rendered;
    const markerNodes = new Map();

    select.innerHTML = points
      .map((point) => `<option value="${point.id}">${point.title}</option>`)
      .join('');

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
      const projected = projectPoint(point.lat, point.lon, projection);
      if (!projected) return;
      const x = projected.x + (point.dx || 0);
      const y = projected.y + (point.dy || 0);
      const circle = document.createElementNS(SVG_NS, 'circle');
      circle.setAttribute('cx', x.toFixed(1));
      circle.setAttribute('cy', y.toFixed(1));
      circle.setAttribute('r', '6');
      circle.setAttribute('tabindex', '0');
      circle.setAttribute('role', 'button');
      circle.setAttribute('aria-label', point.title);
      circle.classList.add('artist-route-map-point');
      circle.setAttribute('fill', '#B8894D');
      circle.setAttribute('stroke', '#FBF8F3');
      circle.setAttribute('stroke-width', '3');
      circle.setAttribute('vector-effect', 'non-scaling-stroke');

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

      markersGroup.node().appendChild(circle);
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

  ensureMapLibraries()
    .then(() => Promise.all([
      fetchJson(ROUTE_JSON_PATH),
      window.d3.json(WORLD_ATLAS_URL)
    ]))
    .then(([route, atlas]) => {
      syncArtistRouteMap(route, atlas);
    })
    .catch((error) => {
      console.error('Artist route map error:', error);
    });
})();
