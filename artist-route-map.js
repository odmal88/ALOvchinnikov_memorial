(function initArtistRouteMap() {
  const ROUTE_JSON_PATH = '09_SOURCE_JSON/pages/route.json';
  const LOCAL_FALLBACK_MAP = 'assets/maps/russia_europe_crimea.svg';

  const D3_URLS = [
    'https://cdn.jsdelivr.net/npm/d3@7/dist/d3.min.js',
    'https://unpkg.com/d3@7/dist/d3.min.js'
  ];

  const TOPOJSON_URLS = [
    'https://cdn.jsdelivr.net/npm/topojson-client@3/dist/topojson-client.min.js',
    'https://unpkg.com/topojson-client@3/dist/topojson-client.min.js'
  ];

  const WORLD_ATLAS_URLS = [
    'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json',
    'https://unpkg.com/world-atlas@2/countries-110m.json'
  ];

  const LAKES_URLS = [
    'https://cdn.jsdelivr.net/gh/nvkelso/natural-earth-vector@master/geojson/ne_110m_lakes.geojson'
  ];

  const RIVERS_URLS = [
    'https://cdn.jsdelivr.net/gh/nvkelso/natural-earth-vector@master/geojson/ne_110m_rivers_lake_centerlines.geojson'
  ];

  const PERIOD_COLORS = {
    base: '#5D9ECF',
    historical_city: '#4D96C5',
    early_wide: '#C5843F',
    volga: '#C8A029',
    mature_return: '#BB8B2A',
    north: '#3D8DBA',
    south: '#C46A31'
  };

  const PROJECTION_FACTORIES = {
    conicEquidistant: () => window.d3.geoConicEquidistant(),
    mercator: () => window.d3.geoMercator(),
    naturalEarth1: () => window.d3.geoNaturalEarth1(),
    equalEarth: () => window.d3.geoEqualEarth()
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

  function loadScriptFromUrls(urls) {
    let index = 0;

    function tryNext() {
      if (index >= urls.length) {
        return Promise.reject(new Error(`Failed to load script from URLs: ${urls.join(', ')}`));
      }

      const src = urls[index++];
      if (document.querySelector(`script[src="${src}"]`)) return Promise.resolve();

      return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.async = true;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      }).catch(tryNext);
    }

    return tryNext();
  }

  function fetchJson(path) {
    return fetch(path, { cache: 'no-store' }).then((res) => {
      if (!res.ok) throw new Error(`Failed to load JSON: ${path}`);
      return res.json();
    });
  }

  function fetchJsonFromUrls(urls, { optional = false } = {}) {
    const tryUrl = (i) => {
      if (i >= urls.length) {
        if (optional) return Promise.resolve(null);
        return Promise.reject(new Error(`Failed to fetch from URLs: ${urls.join(', ')}`));
      }
      return fetchJson(urls[i]).catch(() => tryUrl(i + 1));
    };
    return tryUrl(0);
  }

  function asFeatureCollection(json) {
    if (!json) return null;
    if (json.type === 'FeatureCollection') return json;
    if (Array.isArray(json.features)) return { type: 'FeatureCollection', features: json.features };
    return null;
  }

  function getRussiaFeature(countriesFeatureCollection) {
    return countriesFeatureCollection?.features?.find((feature) => Number(feature?.id) === 643) || null;
  }

  function toFiniteNumber(value) {
    const number = Number(value);
    return Number.isFinite(number) ? number : null;
  }

  function toPair(values) {
    if (!Array.isArray(values) || values.length < 2) return null;
    const first = toFiniteNumber(values[0]);
    const second = toFiniteNumber(values[1]);
    if (first == null || second == null) return null;
    return [first, second];
  }

  function toLngLatBounds(points) {
    if (!Array.isArray(points) || points.length === 0) return null;
    let minLon = Infinity;
    let maxLon = -Infinity;
    let minLat = Infinity;
    let maxLat = -Infinity;

    points.forEach((point) => {
      const lon = toFiniteNumber(point?.lon);
      const lat = toFiniteNumber(point?.lat);
      if (lon == null || lat == null) return;
      minLon = Math.min(minLon, lon);
      maxLon = Math.max(maxLon, lon);
      minLat = Math.min(minLat, lat);
      maxLat = Math.max(maxLat, lat);
    });

    if (!Number.isFinite(minLon) || !Number.isFinite(maxLon) || !Number.isFinite(minLat) || !Number.isFinite(maxLat)) {
      return null;
    }

    return { minLon, maxLon, minLat, maxLat };
  }

  function buildViewportFeature(route) {
    const viewport = route?.map?.viewport;
    if (viewport?.focus !== 'points') return null;

    const sourceBounds = toLngLatBounds(route?.points);
    if (!sourceBounds) return null;

    const minLon = viewport?.minLon != null ? toFiniteNumber(viewport.minLon) : sourceBounds.minLon;
    const maxLon = viewport?.maxLon != null ? toFiniteNumber(viewport.maxLon) : sourceBounds.maxLon;
    const minLat = viewport?.minLat != null ? toFiniteNumber(viewport.minLat) : sourceBounds.minLat;
    const maxLat = viewport?.maxLat != null ? toFiniteNumber(viewport.maxLat) : sourceBounds.maxLat;

    const expandNorth = toFiniteNumber(viewport?.expandNorth) || 0;
    const expandSouth = toFiniteNumber(viewport?.expandSouth) || 0;
    const expandWest = toFiniteNumber(viewport?.expandWest) || 0;
    const expandEast = toFiniteNumber(viewport?.expandEast) || 0;

    const clampedMinLon = Math.max(-180, minLon - expandWest);
    const clampedMaxLon = Math.min(180, maxLon + expandEast);
    const clampedMinLat = Math.max(-89.5, minLat - expandSouth);
    const clampedMaxLat = Math.min(89.5, maxLat + expandNorth);

    if (clampedMinLon >= clampedMaxLon || clampedMinLat >= clampedMaxLat) return null;

    return {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [clampedMinLon, clampedMinLat],
          [clampedMaxLon, clampedMinLat],
          [clampedMaxLon, clampedMaxLat],
          [clampedMinLon, clampedMaxLat],
          [clampedMinLon, clampedMinLat]
        ]]
      }
    };
  }

  function resolveFitExtent(width, height, route) {
    const viewport = route?.map?.viewport || {};
    const paddingCfg = viewport?.padding;
    const defaultPadding = { top: 14, right: 20, bottom: 24, left: 20 };
    const uniform = toFiniteNumber(paddingCfg);
    const padding = uniform != null
      ? { top: uniform, right: uniform, bottom: uniform, left: uniform }
      : {
        top: toFiniteNumber(paddingCfg?.top) ?? defaultPadding.top,
        right: toFiniteNumber(paddingCfg?.right) ?? defaultPadding.right,
        bottom: toFiniteNumber(paddingCfg?.bottom) ?? defaultPadding.bottom,
        left: toFiniteNumber(paddingCfg?.left) ?? defaultPadding.left
      };

    return [
      [padding.left, padding.top],
      [Math.max(padding.left + 1, width - padding.right), Math.max(padding.top + 1, height - padding.bottom)]
    ];
  }

  function createProjection(route, russiaFeature, width, height) {
    const d3 = window.d3;
    const projectionName = route?.map?.projection;
    const projectionFactory = PROJECTION_FACTORIES[projectionName] || PROJECTION_FACTORIES.conicEquidistant;
    const projection = projectionFactory();

    const rotate = toPair(route?.map?.rotate);
    const parallels = toPair(route?.map?.parallels);
    const center = toPair(route?.map?.center);
    const scale = toFiniteNumber(route?.map?.scale);
    const translate = toPair(route?.map?.translate);

    if (typeof projection.rotate === 'function' && rotate) projection.rotate(rotate);
    if (typeof projection.parallels === 'function' && parallels) projection.parallels(parallels);
    if (typeof projection.center === 'function' && center) projection.center(center);
    if (typeof projection.scale === 'function' && scale) projection.scale(scale);
    if (typeof projection.translate === 'function' && translate) projection.translate(translate);

    const hasManualScale = scale != null;
    const hasManualTranslate = translate != null;
    const viewportFeature = buildViewportFeature(route);
    const fitFeature = viewportFeature || russiaFeature;
    const fitExtent = resolveFitExtent(width, height, route);

    if (!hasManualScale && !hasManualTranslate && fitFeature) {
      projection.fitExtent(fitExtent, fitFeature);
    } else if (!hasManualTranslate && typeof projection.translate === 'function') {
      projection.translate([width / 2, height / 2]);
    }

    if (!hasManualScale && typeof projection.scale === 'function') {
      const currentScale = toFiniteNumber(projection.scale());
      if (currentScale == null) projection.scale(530);
    }

    return projection;
  }

  function describeProjection(route) {
    const projectionName = route?.map?.projection || 'conicEquidistant';
    const rotate = toPair(route?.map?.rotate);
    const parallels = toPair(route?.map?.parallels);

    const titleMap = {
      conicEquidistant: 'Равноотстоящий конус',
      mercator: 'Меркатор',
      naturalEarth1: 'Natural Earth',
      equalEarth: 'Equal Earth'
    };

    const parts = [titleMap[projectionName] || projectionName];
    if (parallels) {
      parts.push(`параллели ${parallels[0]}° и ${parallels[1]}°`);
    }
    if (rotate) {
      parts.push(`меридиан ${Math.abs(rotate[0])}°${rotate[0] < 0 ? 'E' : 'W'}`);
    }
    return parts.join(' · ');
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
        <img src="${LOCAL_FALLBACK_MAP}" alt="Карта России" class="artist-route-fallback-base" />
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
    status.textContent = 'Fallback-режим: базовая карта + точки маршрута (без D3/TopoJSON).';
  }

  function renderMap(route, worldAtlas, lakesJson, riversJson) {
    const host = document.querySelector('#page-artist #artist-routes .artist-route-map-module');
    if (!host || !route || !Array.isArray(route.points) || route.points.length === 0) return;

    const mapShell = host.querySelector('#map-container');
    const canvas = host.querySelector('#msvg');
    const tooltip = host.querySelector('#mtip');
    const status = host.querySelector('#mstatus');
    const legend = host.querySelector('#mleg');
    const detailWrap = document.querySelector('#page-artist #artist-routes .artist-route-map-detail');
    const detailTitle = detailWrap?.querySelector('h4');
    const detailText = detailWrap?.querySelector('.artist-route-map-detail-text');
    const detailMeta = detailWrap?.querySelector('.artist-route-map-detail-meta');

    if (!mapShell || !canvas || !tooltip || !status || !legend || !detailTitle || !detailText || !detailMeta) return;

    const d3 = window.d3;
    const topojson = window.topojson;
    const width = 1320;
    const height = 720;

    canvas.innerHTML = '';
    buildLegend(legend, route);

    const countries = topojson.feature(worldAtlas, worldAtlas.objects.countries);
    const countryBorders = topojson.mesh(worldAtlas, worldAtlas.objects.countries, (a, b) => a !== b);
    const russiaFeature = getRussiaFeature(countries);

    const projection = createProjection(route, russiaFeature, width, height);

    const path = d3.geoPath(projection);
    const graticule = d3.geoGraticule().step([10, 10]);
    const lakes = asFeatureCollection(lakesJson);
    const rivers = asFeatureCollection(riversJson);

    const svg = d3.select(canvas)
      .append('svg')
      .attr('class', 'artist-route-map-svg')
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('aria-hidden', 'true');

    const mapLayer = svg.append('g').attr('class', 'artist-route-map-layer');

    mapLayer.append('path').datum({ type: 'Sphere' }).attr('class', 'artist-route-water').attr('d', path);
    mapLayer.append('path').datum(graticule()).attr('class', 'artist-route-graticule').attr('d', path);

    if (lakes) {
      mapLayer.append('g').attr('class', 'artist-route-lakes').selectAll('path').data(lakes.features).join('path').attr('d', path);
    }
    if (rivers) {
      mapLayer.append('g').attr('class', 'artist-route-rivers').selectAll('path').data(rivers.features).join('path').attr('d', path);
    }

    mapLayer.append('g')
      .attr('class', 'artist-route-land-all')
      .selectAll('path')
      .data(countries.features)
      .join('path')
      .attr('class', (d) => Number(d.id) === 643 ? 'artist-route-land is-russia' : 'artist-route-land is-other')
      .attr('d', path);

    mapLayer.append('path').datum(countryBorders).attr('class', 'artist-route-borders').attr('d', path);

    const routeLine = {
      type: 'LineString',
      coordinates: route.points.map((point) => [point.lon, point.lat])
    };

    mapLayer.append('path').datum(routeLine).attr('class', 'artist-route-line').attr('d', path);

    const pointNodes = mapLayer.append('g')
      .attr('class', 'artist-route-points')
      .selectAll('circle')
      .data(route.points)
      .join('circle')
      .attr('class', (d) => `artist-route-point period-${d.period || 'base'}`)
      .attr('r', 5.4)
      .attr('fill', (d) => PERIOD_COLORS[d.period] || '#B8894D')
      .attr('transform', (d) => {
        const projected = projection([d.lon, d.lat]);
        return projected ? `translate(${projected[0]},${projected[1]})` : 'translate(-999,-999)';
      })
      .attr('tabindex', 0)
      .attr('role', 'button')
      .attr('aria-label', (d) => d.title);

    let activeId = route.map?.activePointId || route.points[0].id;

    function updateDetail(point) {
      const periodLabel = route.map?.periodLabels?.[point.period] || point.period || '';
      const categoryLabel = route.map?.categoryLabels?.[point.category] || point.category || '';

      detailTitle.textContent = point.title;
      detailText.textContent = point.text;
      detailMeta.textContent = [periodLabel, categoryLabel].filter(Boolean).join(' · ');
      status.textContent = describeProjection(route);
    }

    function setActive(id) {
      const point = route.points.find((entry) => entry.id === id);
      if (!point) return;
      activeId = point.id;
      pointNodes
        .classed('is-active', (d) => d.id === activeId)
        .attr('r', (d) => (d.id === activeId ? 8.2 : 5.4));
      updateDetail(point);
    }

    function showTooltip(event, point) {
      const periodLabel = route.map?.periodLabels?.[point.period] || point.period || '';
      tooltip.hidden = false;
      tooltip.innerHTML = `<strong>${point.title}</strong><span>${periodLabel}</span>`;
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

  waitForMapHost()
    .then(() => fetchJson(ROUTE_JSON_PATH))
    .then((route) => Promise.all([
      Promise.resolve(route),
      window.d3 ? Promise.resolve() : loadScriptFromUrls(D3_URLS),
      window.topojson ? Promise.resolve() : loadScriptFromUrls(TOPOJSON_URLS)
    ]))
    .then(([route]) => Promise.all([
      Promise.resolve(route),
      fetchJsonFromUrls(WORLD_ATLAS_URLS),
      fetchJsonFromUrls(LAKES_URLS, { optional: true }),
      fetchJsonFromUrls(RIVERS_URLS, { optional: true })
    ]))
    .then(([route, worldAtlas, lakes, rivers]) => {
      renderMap(route, worldAtlas, lakes, rivers);
    })
    .catch((error) => {
      console.error('Artist route map error:', error);
      setModuleStatus('Сеть ограничена: показываем базовую карту с точками маршрута.');
      fetchJson(ROUTE_JSON_PATH).then((route) => renderFallbackMap(route)).catch(() => {
        setModuleStatus('Карта временно недоступна: не удалось загрузить маршрутные данные.');
      });
    });
})();
