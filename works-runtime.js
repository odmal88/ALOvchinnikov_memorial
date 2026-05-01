(function initWorksRuntime() {
    const BUILD_ID = '2026-05-01-shared-works-model-v1';
    const WORKS_JSON_PATH = '09_SOURCE_JSON/shared/works-catalog-1-110.json';
    const WORKS_IMAGE_MAP_PATH = '09_SOURCE_JSON/shared/works-image-map.json';
    const WORKS_RUNTIME_MAP_PATH = '09_SOURCE_JSON/shared/works-runtime-map.json';
    const WORKS_CSS_PATH = 'works-runtime.css';

    const worksModel = window.OvchinnikovWorksModel || {};
    const categoryLabels = worksModel.categoryLabels || {
        north: 'Русский Север',
        city: 'Русский город',
        history: 'Историческая тема',
        interior: 'Камерный мир',
        volga: 'Волга и Юг',
        graphics: 'Графика'
    };

    const state = {
        activeFilter: 'all',
        works: [],
        bySlug: new Map(),
        loadPromise: null
    };

    function withBuildId(path) {
        const separator = path.includes('?') ? '&' : '?';
        return `${path}${separator}build=${encodeURIComponent(BUILD_ID)}`;
    }

    function injectCss() {
        if (document.getElementById('works-runtime-css')) return;
        const link = document.createElement('link');
        link.id = 'works-runtime-css';
        link.rel = 'stylesheet';
        link.href = withBuildId(WORKS_CSS_PATH);
        document.head.appendChild(link);
    }

    function fetchJson(path) {
        return fetch(withBuildId(path), { cache: 'no-store' }).then((response) => {
            if (!response.ok) throw new Error(`Failed to load ${path}: ${response.status}`);
            return response.json();
        });
    }

    function escapeHtml(value) {
        if (typeof worksModel.escapeHtml === 'function') return worksModel.escapeHtml(value);
        return String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function slugifyRu(value) {
        if (typeof worksModel.slugifyRu === 'function') return worksModel.slugifyRu(value);
        return String(value || '').trim().toLowerCase().replace(/[^a-zа-яё0-9]+/gi, '-').replace(/^-+|-+$/g, '');
    }

    function buildHeroMeta(work) {
        const parts = [work.year, work.place !== '—' ? work.place : '', work.technique !== '—' ? work.technique : '']
            .filter(Boolean);
        return parts.join(' · ') || 'Произведение из коллекции';
    }

    function normalizeCatalog(catalog, imageMap, runtimeMap) {
        if (typeof worksModel.normalizeCatalog === 'function') {
            return worksModel.normalizeCatalog(catalog, imageMap, runtimeMap);
        }

        console.warn('OvchinnikovWorksModel is not loaded. Works runtime will use raw catalog records.');
        return Array.isArray(catalog) ? catalog.map((record) => ({
            id: Number(record.id) || 0,
            slug: slugifyRu(record.slug || record.title || `work-${record.id}`),
            aliases: [],
            title: record.title || `Работа ${record.id}`,
            author: record.author || 'Александр Львович Овчинников',
            year: String(record.year || '').trim() || '—',
            place: String(record.place || '').trim() || '—',
            technique: '—',
            size: '—',
            category: 'north',
            collection: record.collection || 'Собрание семьи художника',
            missingImage: Boolean(record.missingImage),
            image: record.image || '',
            thumbnail: record.thumbnail || record.image || '',
            descriptionHtml: record.descriptionPublic ? `<p>${escapeHtml(record.descriptionPublic)}</p>` : '<p>Аннотация к произведению будет добавлена позднее.</p>'
        })) : [];
    }

    function buildSlugMap(works) {
        if (typeof worksModel.buildSlugMap === 'function') return worksModel.buildSlugMap(works);
        const map = new Map();
        works.forEach((work) => {
            map.set(work.slug, work);
            (work.aliases || []).forEach((alias) => {
                if (!map.has(alias)) map.set(alias, work);
            });
        });
        return map;
    }

    function loadWorksRuntime() {
        if (state.loadPromise) return state.loadPromise;

        injectCss();
        state.loadPromise = Promise.all([
            fetchJson(WORKS_JSON_PATH),
            fetchJson(WORKS_IMAGE_MAP_PATH).catch(() => ({})),
            fetchJson(WORKS_RUNTIME_MAP_PATH).catch(() => ({ works: {} }))
        ]).then(([catalog, imageMap, runtimeMap]) => {
            state.works = normalizeCatalog(catalog, imageMap, runtimeMap);
            state.bySlug = buildSlugMap(state.works);
            window.__ovchinnikovWorksRuntime = {
                works: state.works,
                bySlug: state.bySlug,
                categoryLabels
            };
            return state.works;
        }).catch((error) => {
            console.error('Works runtime error:', error);
            state.works = [];
            state.bySlug = new Map();
            return state.works;
        });

        return state.loadPromise;
    }

    function getCurrentPath() {
        const raw = window.location.hash ? window.location.hash.slice(1) : '/';
        if (!raw) return '/';
        return raw.startsWith('/') ? raw : `/${raw}`;
    }

    function getRouteSlug(path) {
        const match = String(path || '').match(/^\/works\/([^/?#]+)/);
        return match ? decodeURIComponent(match[1]) : '';
    }

    function getWorkBySlug(slug) {
        if (!slug) return null;
        const normalized = slugifyRu(slug);
        return state.bySlug.get(slug) || state.bySlug.get(normalized) || null;
    }

    function createCardMarkup(work) {
        const categoryLabel = categoryLabels[work.category] || 'Коллекция';
        const imageMarkup = !work.missingImage && work.thumbnail
            ? `<img src="${escapeHtml(work.thumbnail)}" alt="${escapeHtml(work.title)}" loading="lazy">`
            : `<span class="works-runtime-placeholder">Изображение уточняется</span>`;

        return `
            <article class="catalog-card" data-category="${escapeHtml(work.category)}">
                <a class="catalog-card-link" href="#/works/${encodeURIComponent(work.slug)}" data-route="/works/${work.slug}">
                    <div class="catalog-image${work.missingImage || !work.thumbnail ? ' is-fallback' : ''}">
                        <div class="catalog-image-inner">
                            ${imageMarkup}
                            <span class="artwork-label">${escapeHtml(categoryLabel)}</span>
                        </div>
                    </div>
                    <h4>${escapeHtml(work.title)}</h4>
                    <div class="catalog-cycle">Раздел: ${escapeHtml(categoryLabel)}</div>
                    <span class="catalog-meta" style="color: var(--text-muted);">${escapeHtml(work.year)}</span>
                    <div class="catalog-technique" style="color: var(--text-muted);">${escapeHtml(work.technique)} · ${escapeHtml(work.size)}</div>
                </a>
            </article>
        `;
    }

    function applyFilter(root, filter) {
        state.activeFilter = filter || 'all';
        root.querySelectorAll('.filter-btn').forEach((button) => {
            button.classList.toggle('active', (button.dataset.filter || 'all') === state.activeFilter);
        });
        root.querySelectorAll('.catalog-card').forEach((card) => {
            const category = card.getAttribute('data-category');
            card.style.display = state.activeFilter === 'all' || category === state.activeFilter ? '' : 'none';
        });
    }

    function bindFilters(root) {
        root.querySelectorAll('.filter-btn').forEach((button) => {
            if (button.dataset.worksRuntimeBound === '1') return;
            button.dataset.worksRuntimeBound = '1';
            button.addEventListener('click', () => applyFilter(root, button.dataset.filter || 'all'));
        });
    }

    function renderWorksIndex(root) {
        if (!root) return;
        bindFilters(root);

        const subtitle = root.querySelector('.page-hero-subtitle');
        if (subtitle) subtitle.textContent = `Каталог произведений Александра Львовича Овчинникова · ${state.works.length} работ`;

        const intro = root.querySelector('.works-editorial-intro p');
        if (intro) {
            intro.textContent = `Каталог объединяет ${state.works.length} произведений из разных тематических линий художника: от северного цикла и исторической темы до интерьера, предметного мира, волжских и городских маршрутов.`;
        }

        const grid = root.querySelector('#catalogGrid');
        if (!grid) return;
        if (!state.works.length) {
            grid.innerHTML = '<div class="catalog-empty-state"><p>Каталог пока не удалось загрузить. Попробуйте обновить страницу.</p></div>';
            return;
        }

        grid.innerHTML = state.works.map(createCardMarkup).join('');
        applyFilter(root, state.activeFilter);
    }

    function renderDetailImage(host, work) {
        if (!host) return;
        const categoryLabel = categoryLabels[work.category] || 'Коллекция';

        if (!work.missingImage && work.image) {
            host.classList.add('has-image');
            host.classList.remove('is-fallback');
            host.innerHTML = `
                <div class="work-single-image-inner works-runtime-single-media">
                    <img class="work-single-actual-image" src="${escapeHtml(work.image)}" alt="${escapeHtml(work.title)}" loading="eager">
                </div>
            `;
            return;
        }

        host.classList.remove('has-image');
        host.classList.add('is-fallback');
        host.innerHTML = `
            <div class="work-single-image-inner">
                <i class="fa-solid fa-image" aria-hidden="true"></i>
                <span class="works-runtime-placeholder">Изображение пока недоступно</span>
                <span class="artwork-label">${escapeHtml(categoryLabel)}</span>
            </div>
        `;
    }

    function renderRelatedWorks(root, work) {
        const relatedHost = root.querySelector('#workRelated');
        if (!relatedHost) return;
        let related = state.works.filter((item) => item.category === work.category && item.slug !== work.slug).slice(0, 3);
        if (!related.length) related = state.works.filter((item) => item.slug !== work.slug).slice(0, 3);
        relatedHost.innerHTML = related.map(createCardMarkup).join('');
    }

    function renderPrevNext(root, work) {
        const index = state.works.findIndex((item) => item.slug === work.slug);
        const prev = index > 0 ? state.works[index - 1] : null;
        const next = index >= 0 && index < state.works.length - 1 ? state.works[index + 1] : null;
        const prevLink = root.querySelector('#workPrev');
        const nextLink = root.querySelector('#workNext');

        if (prevLink) {
            if (prev) {
                prevLink.href = `#/works/${encodeURIComponent(prev.slug)}`;
                prevLink.setAttribute('data-route', `/works/${prev.slug}`);
                prevLink.style.visibility = 'visible';
            } else {
                prevLink.removeAttribute('href');
                prevLink.removeAttribute('data-route');
                prevLink.style.visibility = 'hidden';
            }
        }

        if (nextLink) {
            if (next) {
                nextLink.href = `#/works/${encodeURIComponent(next.slug)}`;
                nextLink.setAttribute('data-route', `/works/${next.slug}`);
                nextLink.style.visibility = 'visible';
            } else {
                nextLink.removeAttribute('href');
                nextLink.removeAttribute('data-route');
                nextLink.style.visibility = 'hidden';
            }
        }
    }

    function renderWorkSingle(root, work) {
        if (!root || !work) return;
        const categoryLabel = categoryLabels[work.category] || 'Коллекция';
        const heroCategory = root.querySelector('#workHeroCategory');
        const heroTitle = root.querySelector('#workHeroTitle');
        const heroMeta = root.querySelector('#workHeroMeta');
        const breadcrumbTitle = root.querySelector('#workBreadcrumbTitle');
        const workTitle = root.querySelector('#workTitle');
        const workAuthor = root.querySelector('#workAuthor');
        const details = root.querySelector('.work-details');
        const description = root.querySelector('#workDescription');
        const links = root.querySelector('#workLinks');

        if (heroCategory) heroCategory.textContent = categoryLabel;
        if (heroTitle) heroTitle.textContent = work.title;
        if (heroMeta) heroMeta.textContent = buildHeroMeta(work);
        if (breadcrumbTitle) breadcrumbTitle.textContent = work.title;
        if (workTitle) workTitle.textContent = work.title;
        if (workAuthor) workAuthor.textContent = work.author;
        if (details) {
            details.innerHTML = `
                <dt>Год</dt><dd>${escapeHtml(work.year)}</dd>
                <dt>Техника</dt><dd>${escapeHtml(work.technique)}</dd>
                <dt>Размер</dt><dd>${escapeHtml(work.size)}</dd>
                <dt>Место</dt><dd>${escapeHtml(work.place)}</dd>
                <dt>Раздел</dt><dd>${escapeHtml(categoryLabel)}</dd>
                <dt>Собрание</dt><dd>${escapeHtml(work.collection || 'Собрание семьи художника')}</dd>
            `;
        }
        if (description) description.innerHTML = work.descriptionHtml;
        if (links) links.innerHTML = '';
        renderDetailImage(root.querySelector('.work-single-image'), work);
        renderRelatedWorks(root, work);
        renderPrevNext(root, work);
    }

    function renderMissingWork(root, slug) {
        if (!root) return;
        const safeSlug = escapeHtml(slug || 'unknown-work');
        const set = (selector, text) => {
            const node = root.querySelector(selector);
            if (node) node.textContent = text;
        };
        set('#workHeroCategory', 'Коллекция');
        set('#workHeroTitle', 'Работа не найдена');
        set('#workHeroMeta', 'Маршрут существует, но запись каталога не была найдена.');
        set('#workBreadcrumbTitle', 'Работа не найдена');
        set('#workTitle', 'Работа не найдена');
        const details = root.querySelector('.work-details');
        const description = root.querySelector('#workDescription');
        const related = root.querySelector('#workRelated');
        const prevLink = root.querySelector('#workPrev');
        const nextLink = root.querySelector('#workNext');
        if (details) details.innerHTML = `<dt>Slug</dt><dd>${safeSlug}</dd><dt>Статус</dt><dd>Маршрут требует сверки</dd>`;
        if (description) description.innerHTML = '<p>Для этого маршрута пока не удалось найти карточку в JSON runtime. Проверьте slug или откройте полный каталог работ.</p>';
        renderDetailImage(root.querySelector('.work-single-image'), { missingImage: true, category: 'graphics', title: 'Работа не найдена' });
        if (related) related.innerHTML = '';
        if (prevLink) prevLink.style.visibility = 'hidden';
        if (nextLink) nextLink.style.visibility = 'hidden';
    }

    function syncCurrentRoute(retries) {
        const attemptsLeft = typeof retries === 'number' ? retries : 6;
        const path = getCurrentPath();
        const slug = getRouteSlug(path);
        const isWorksIndex = path === '/works';

        loadWorksRuntime().then(() => {
            if (isWorksIndex) {
                const root = document.getElementById('page-works');
                if (!root && attemptsLeft > 0) return setTimeout(() => syncCurrentRoute(attemptsLeft - 1), 60);
                renderWorksIndex(root);
                return;
            }
            if (slug) {
                const root = document.getElementById('page-work-single');
                if (!root && attemptsLeft > 0) return setTimeout(() => syncCurrentRoute(attemptsLeft - 1), 60);
                const work = getWorkBySlug(slug);
                if (work) renderWorkSingle(root, work);
                else renderMissingWork(root, slug);
            }
        });
    }

    function scheduleSync() {
        setTimeout(() => syncCurrentRoute(6), 0);
    }

    function wrapNavigateTo() {
        if (typeof window.navigateTo !== 'function' || window.navigateTo.__worksRuntimeWrapped) return;
        const originalNavigateTo = window.navigateTo;
        const wrappedNavigateTo = function wrappedNavigateTo() {
            const result = originalNavigateTo.apply(this, arguments);
            scheduleSync();
            return result;
        };
        wrappedNavigateTo.__worksRuntimeWrapped = true;
        wrappedNavigateTo.__original = originalNavigateTo;
        window.navigateTo = wrappedNavigateTo;
    }

    injectCss();
    wrapNavigateTo();
    window.addEventListener('hashchange', scheduleSync);
    window.addEventListener('load', scheduleSync);
    scheduleSync();
})();
