(function initArtistRouteMap() {
  const ROUTE_JSON_PATH = '09_SOURCE_JSON/pages/route.json';
  const D3_URL = 'https://cdn.jsdelivr.net/npm/d3@7/dist/d3.min.js';
  const TOPOJSON_URL = 'https://cdn.jsdelivr.net/npm/topojson-client@3/dist/topojson-client.min.js';
  const WORLD_ATLAS_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';
  const LAKES_URL = 'https://cdn.jsdelivr.net/gh/nvkelso/natural-earth-vector@master/geojson/ne_110m_lakes.geojson';
  const RIVERS_URL = 'https://cdn.jsdelivr.net/gh/nvkelso/natural-earth-vector@master/geojson/ne_110m_rivers_lake_centerlines.geojson';

  const PERIOD_COLORS = {
    base: '#8C6239',
    historical_city: '#A27449',
    early_wide: '#BE8A55',
    volga: '#C69764',
    mature_return: '#AD7C4B',
    north: '#5E7D90',
    south: '#8F5B62'
  };

  function loadScript(src) {
    if (document.querySelector(`script[src="${src}"]`)) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.async = true;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  function fetchJson(path) {
    return fetch(path, { cache: 'no-store' }).then((res) => {
      if (!res.ok) throw new Error(`Failed to load JSON: ${path}`);
      return res.json();
    });
  }

  function asFeatureCollection(json) {
    if (!json) return null;
    if (json.type === 'FeatureCollection') return json;
    if (Array.isArray(json.features)) return { type: 'FeatureCollection', features: json.features };
    return null;
  }

  function renderMap(route, worldAtlas, lakesJson, riversJson) {
    const host = document.querySelector('#artist-routes .artist-route-map-card');
    if (!host || !route || !Array.isArray(route.points)) return;

    const mapShell = host.querySelector('.artist-route-map-shell');
    const canvas = host.querySelector('.artist-route-map-canvas');
    const tooltip = host.querySelector('.artist-route-map-tooltip');
    const chips = host.querySelector('.artist-route-map-chips');
    const detailTitle = host.querySelector('.artist-route-map-detail h4');
    const detailText = host.querySelector('.artist-route-map-detail-text');
    const detailMeta = host.querySelector('.artist-route-map-detail-meta');

    if (!mapShell || !canvas || !tooltip || !chips || !detailTitle || !detailText || !detailMeta) return;

    const d3 = window.d3;
    const topojson = window.topojson;

    canvas.innerHTML = '';

    const width = 960;
    const height = 650;

    const projectionConfig = route.map || {};
    const projection = d3.geoConicEquidistant()
      .center(projectionConfig.center || [76, 60])
      .rotate(projectionConfig.rotate || [-40, 0])
      .parallels(projectionConfig.parallels || [55, 68])
      .scale(projectionConfig.scale || 560)
      .translate(projectionConfig.translate || [470, 315]);

    const path = d3.geoPath(projection);
    const graticule = d3.geoGraticule().step([10, 10]);

    const land = topojson.feature(worldAtlas, worldAtlas.objects.land);
    const countryBorders = topojson.mesh(worldAtlas, worldAtlas.objects.countries, (a, b) => a !== b);
    const lakes = asFeatureCollection(lakesJson);
    const rivers = asFeatureCollection(riversJson);

    const svg = d3.select(canvas)
      .append('svg')
      .attr('class', 'artist-route-map-svg')
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('aria-hidden', 'true');

    const mapLayer = svg.append('g').attr('class', 'artist-route-map-layer');

    mapLayer.append('path')
      .datum({ type: 'Sphere' })
      .attr('class', 'artist-route-water')
      .attr('d', path);

    mapLayer.append('path')
      .datum(graticule())
      .attr('class', 'artist-route-graticule')
      .attr('d', path);

    if (rivers) {
      mapLayer.append('g')
        .attr('class', 'artist-route-rivers')
        .selectAll('path')
        .data(rivers.features)
        .join('path')
        .attr('d', path);
    }

    if (lakes) {
      mapLayer.append('g')
        .attr('class', 'artist-route-lakes')
        .selectAll('path')
        .data(lakes.features)
        .join('path')
        .attr('d', path);
    }

    mapLayer.append('path')
      .datum(land)
      .attr('class', 'artist-route-land')
      .attr('d', path);

    mapLayer.append('path')
      .datum(countryBorders)
      .attr('class', 'artist-route-borders')
      .attr('d', path);

    const routeLine = {
      type: 'LineString',
      coordinates: route.points.map((point) => [point.lon, point.lat])
    };

    mapLayer.append('path')
      .datum(routeLine)
      .attr('class', 'artist-route-line')
      .attr('d', path);

    const pointsLayer = mapLayer.append('g').attr('class', 'artist-route-points');

    const pointNodes = pointsLayer
      .selectAll('circle')
      .data(route.points)
      .join('circle')
      .attr('class', (d) => `artist-route-point period-${d.period || 'base'}`)
      .attr('r', 5.5)
      .attr('fill', (d) => PERIOD_COLORS[d.period] || '#B8894D')
      .attr('transform', (d) => {
        const projected = projection([d.lon, d.lat]);
        return projected ? `translate(${projected[0]},${projected[1]})` : 'translate(-999,-999)';
      })
      .attr('tabindex', 0)
      .attr('role', 'button')
      .attr('aria-label', (d) => d.title);

    let activeId = route.map?.activePointId || route.points[0]?.id;

    function updateDetail(point) {
      detailTitle.textContent = point.title;
      detailText.textContent = point.text;
      const periodLabel = route.map?.periodLabels?.[point.period] || point.period || '';
      const categoryLabel = route.map?.categoryLabels?.[point.category] || point.category || '';
      detailMeta.textContent = [periodLabel, categoryLabel].filter(Boolean).join(' · ');
    }

    function setActive(id) {
      const point = route.points.find((entry) => entry.id === id);
      if (!point) return;
      activeId = point.id;
      pointNodes
        .classed('is-active', (d) => d.id === activeId)
        .attr('r', (d) => (d.id === activeId ? 8 : 5.5));
      chips.querySelectorAll('.artist-route-map-chip').forEach((node) => {
        node.classList.toggle('is-active', node.getAttribute('data-point-id') === activeId);
      });
      updateDetail(point);
    }

    function showTooltip(event, point) {
      const periodLabel = route.map?.periodLabels?.[point.period] || point.period;
      tooltip.hidden = false;
      tooltip.innerHTML = `<strong>${point.title}</strong><span>${periodLabel || ''}</span>`;
      const shellRect = mapShell.getBoundingClientRect();
      const x = event.clientX - shellRect.left + 12;
      const y = event.clientY - shellRect.top + 12;
      tooltip.style.transform = `translate(${x}px, ${y}px)`;
    }

    function hideTooltip() {
      tooltip.hidden = true;
    }

    pointNodes
      .on('click', (_, d) => setActive(d.id))
      .on('mouseenter', function (event, d) {
        showTooltip(event, d);
        d3.select(this).classed('is-hover', true);
      })
      .on('mousemove', (event, d) => showTooltip(event, d))
      .on('mouseleave', function () {
        hideTooltip();
        d3.select(this).classed('is-hover', false);
      })
      .on('focus', (event, d) => showTooltip(event, d))
      .on('blur', hideTooltip)
      .on('keydown', (event, d) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          setActive(d.id);
        }
      });

    chips.innerHTML = route.points.map((point) => `
      <button type="button" class="artist-route-map-chip" data-point-id="${point.id}" role="listitem">
        <span class="dot" style="background:${PERIOD_COLORS[point.period] || '#B8894D'}"></span>
        <span>${point.shortLabel || point.title}</span>
      </button>
    `).join('');

    chips.querySelectorAll('.artist-route-map-chip').forEach((chip) => {
      chip.addEventListener('click', () => {
        setActive(chip.getAttribute('data-point-id'));
      });
    });

    const zoomCfg = route.map?.zoom || {};
    const zoomBehavior = d3.zoom()
      .scaleExtent([zoomCfg.min || 1, zoomCfg.max || 7])
      .on('zoom', (event) => {
        mapLayer.attr('transform', event.transform);
      });

    svg.call(zoomBehavior);

    host.querySelector('[data-zoom="in"]')?.addEventListener('click', () => {
      svg.transition().duration(220).call(zoomBehavior.scaleBy, zoomCfg.step || 1.35);
    });

    host.querySelector('[data-zoom="out"]')?.addEventListener('click', () => {
      svg.transition().duration(220).call(zoomBehavior.scaleBy, 1 / (zoomCfg.step || 1.35));
    });

    host.querySelector('.artist-route-map-reset')?.addEventListener('click', () => {
      svg.transition().duration(260).call(zoomBehavior.transform, d3.zoomIdentity);
    });

    setActive(activeId);
  }

  Promise.all([
    loadScript(D3_URL),
    loadScript(TOPOJSON_URL)
  ])
    .then(() => Promise.all([
      fetchJson(ROUTE_JSON_PATH),
      fetchJson(WORLD_ATLAS_URL),
      fetchJson(LAKES_URL),
      fetchJson(RIVERS_URL)
    ]))
    .then(([route, worldAtlas, lakes, rivers]) => {
      renderMap(route, worldAtlas, lakes, rivers);
    })
    .catch((error) => {
      console.error('Artist route map error:', error);
    });
})();
