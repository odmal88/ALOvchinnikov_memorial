(function initWorksRuntime() {
    const BUILD_ID = '2026-04-20-public-descriptions-v1';
    const WORKS_JSON_PATH = '09_SOURCE_JSON/shared/works-catalog-1-110.json';
    const WORKS_IMAGE_MAP_PATH = '09_SOURCE_JSON/shared/works-image-map.json';
    const WORKS_RUNTIME_MAP_PATH = '09_SOURCE_JSON/shared/works-runtime-map.json';
    const WORKS_CSS_PATH = 'works-runtime.css';

    const categoryLabels = {
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
            if (!response.ok) {
                throw new Error(`Failed to load ${path}: ${response.status}`);
            }
            return response.json();
        });
    }

    function escapeHtml(value) {
        return String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function slugifyRu(text) {
        const map = {
            а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z', и: 'i', й: 'y',
            к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f',
            х: 'h', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sch', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya'
        };
        return String(text || '')
            .trim()
            .toLowerCase()
            .split('')
            .map((char) => map[char] ?? char)
            .join('')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '')
            .replace(/-{2,}/g, '-');
    }

    function makeUniqueSlug(rawSlug, title, id, usedSlugs) {
        const base = slugifyRu(rawSlug || title) || `work-${id}`;
        let slug = base;
        let suffix = 2;

        while (usedSlugs.has(slug)) {
            slug = `${base}-${suffix}`;
            suffix += 1;
        }

        usedSlugs.add(slug);
        return slug;
    }

    function parseSizeAndTechnique(rawSize, title, editorialNote) {
        const raw = String(rawSize || '').trim();
        const lower = raw.toLowerCase();
        const combined = `${title || ''} ${editorialNote || ''}`.toLowerCase();

        let technique = '—';
        if (combined.includes('линограв') || combined.includes('гравюр') || combined.includes('линорит')) {
            technique = 'Линогравюра';
        } else if (lower.includes('х/м')) {
            technique = 'Холст, масло';
        } else if (lower.includes('к/м')) {
            technique = 'Картон, масло';
        } else if (lower.includes('б/см') || lower.includes('б., см.т.') || lower.includes('смеш')) {
            technique = 'Бумага, смешанная техника';
        }

        const sizeMatch = raw.match(/(\d+\s*[xх]\s*\d+(?:\s*[xх]\s*\d+)?)/i);
        const size = sizeMatch ? sizeMatch[1].replace(/х/gi, '×').replace(/\s+/g, ' ').trim() + ' см' : '—';

        return { technique, size };
    }

    function inferCategory(record) {
        const haystack = [record.title, record.place, record.sectionSite]
            .filter(Boolean)
            .join(' ')
            .toLowerCase();

        const has = (pattern) => pattern.test(haystack);

        if (has(/пугач|варяг|викинг|монастыр|истор|эпос|покров|часовн|крест|церк/)) return 'history';
        if (has(/интерьер|изб|дом|сени|баня|натюрморт|портрет|утвар|мастерск|семь|хозяй|купан/)) return 'interior';
        if (has(/гравюр|линограв|график|линорит/)) return 'graphics';
        if (has(/волг|горьк|нижегор|немд|васильсур|городец|балахн|сормов|щёлоков|ялт|алупк|симфероп|крым|швейцар/)) return 'volga';
        if (has(/ленинград|петербург|хельсинк|стокгольм|городск|кремл|мост|набереж|сад|улиц|архитектур/)) return 'city';
        if (has(/север|белом|арханг|веркол|мезен|помор|лапланд|тайг|онеж|тундр|олень|каюр|финлянд/)) return 'north';

        return 'north';
    }

    function buildDescriptionHtml(record) {
        const descriptionPublic = String(record.descriptionPublic || '').trim();
        if (descriptionPublic && descriptionPublic !== '—') {
            return `<p>${escapeHtml(descriptionPublic)}</p>`;
        }

        const parts = [];
        const editorialNote = String(record.editorialNote || '').trim();
        if (editorialNote && editorialNote !== '—') {
            parts.push(`<p>${escapeHtml(editorialNote)}</p>`);
        }

        if (!parts.length) {
            parts.push('<p>Аннотация к произведению будет добавлена позднее.</p>');
        }

        return parts.join('');
    }

    function buildHeroMeta(work) {
        const parts = [work.year, work.place !== '—' ? work.place : '', work.technique !== '—' ? work.technique : '']
            .filter(Boolean);
        return parts.join(' · ') || 'Произведение из коллекции';
    }

    function normalizeWork(record, imageMap, runtimeMap, usedSlugs) {
        const imageMeta = imageMap[String(record.id)] || {};
        const runtimeEntry = runtimeMap && runtimeMap.works ? runtimeMap.works[String(record.id)] || {} : {};
        const parsed = parseSizeAndTechnique(record.size, record.title, record.editorialNote);
        const slug = makeUniqueSlug(runtimeEntry.slug, record.title, record.id, usedSlugs);
        const category = categoryLabels[runtimeEntry.category] ? runtimeEntry.category : inferCategory(record);
        const aliases = Array.isArray(runtimeEntry.aliases)
            ? Array.from(new Set(runtimeEntry.aliases.map((alias) => slugifyRu(alias)).filter(Boolean).filter((alias) => alias !== slug)))
            : [];

        return {
            id: Number(record.id) || 0,
            slug,
            aliases,
            title: record.title || `Работа ${record.id}`,
            year: String(record.year || '').trim() || '—',
            place: String(record.place || '').trim() || '—',
            technique: parsed.technique,
            size: parsed.size,
            category,
            sectionSite: String(record.sectionSite || '').trim() || 'Коллекция',
            collection: String(record.collection || '').trim() || 'Собрание семьи художника',
            status: String(record.status || '').trim() || '—',
            textType: String(record.textType || '').trim() || '',
            verificationNote: String(record.verificationNote || '').trim() || '',
            editorialNote: String(record.editorialNote || '').trim() || '',
            missingImage: Boolean(record.missingImage),
            image: record.image || imageMeta.image || '',
            thumbnail: record.thumbnail || imageMeta.thumbnail || record.image || imageMeta.image || '',
            needsVerification: Boolean(record.needsVerification),
            descriptionHtml: buildDescriptionHtml(record)
        };
    }

    function loadWorksRuntime() {
        if (state.loadPromise) return state.loadPromise;

        injectCss();
        state.loadPromise = Promise.all([
            fetchJson(WORKS_JSON_PATH),
            fetchJson(WORKS_IMAGE_MAP_PATH).catch(() => ({})),
            fetchJson(WORKS_RUNTIME_MAP_PATH).catch(() => ({ works: {} }))
        ]).then(([catalog, imageMap, runtimeMap]) => {
            const usedSlugs = new Set();
            state.works = Array.isArray(catalog)
                ? catalog.map((record) => normalizeWork(record, imageMap, runtimeMap, usedSlugs))
                : [];
            state.bySlug = new Map();
            state.works.forEach((work) => {
                state.bySlug.set(work.slug, work);
                work.aliases.forEach((alias) => {
                    if (!state.bySlug.has(alias)) state.bySlug.set(alias, work);
                });
            });
            return state.works;
        }).catch((error) => {
            console.error('Works runtime v2 error:', error);
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
            button.addEventListener('click', () => {
                applyFilter(root, button.dataset.filter || 'all');
            });
        });
    }

    function renderWorksIndex(root) {
        if (!root) return;

        bindFilters(root);

        const subtitle = root.querySelector('.page-hero-subtitle');
        if (subtitle) {
            subtitle.textContent = `Каталог произведений Александра Львовича Овчинникова · ${state.works.length} работ`;
        }

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
        if (!related.length) {
            related = state.works.filter((item) => item.slug !== work.slug).slice(0, 3);
        }

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
        if (workAuthor) workAuthor.textContent = 'Александр Львович Овчинников';

        if (details) {
            details.innerHTML = `
                <dt>Год</dt>
                <dd>${escapeHtml(work.year)}</dd>
                <dt>Техника</dt>
                <dd>${escapeHtml(work.technique)}</dd>
                <dt>Размер</dt>
                <dd>${escapeHtml(work.size)}</dd>
                <dt>Место</dt>
                <dd>${escapeHtml(work.place)}</dd>
                <dt>Раздел</dt>
                <dd>${escapeHtml(categoryLabel)}</dd>
                <dt>Собрание</dt>
                <dd>${escapeHtml(work.collection || 'Собрание семьи художника')}</dd>
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
        const heroCategory = root.querySelector('#workHeroCategory');
        const heroTitle = root.querySelector('#workHeroTitle');
        const heroMeta = root.querySelector('#workHeroMeta');
        const breadcrumbTitle = root.querySelector('#workBreadcrumbTitle');
        const workTitle = root.querySelector('#workTitle');
        const details = root.querySelector('.work-details');
        const description = root.querySelector('#workDescription');
        const related = root.querySelector('#workRelated');
        const prevLink = root.querySelector('#workPrev');
        const nextLink = root.querySelector('#workNext');

        if (heroCategory) heroCategory.textContent = 'Коллекция';
        if (heroTitle) heroTitle.textContent = 'Работа не найдена';
        if (heroMeta) heroMeta.textContent = 'Маршрут существует, но запись каталога не была найдена.';
        if (breadcrumbTitle) breadcrumbTitle.textContent = 'Работа не найдена';
        if (workTitle) workTitle.textContent = 'Работа не найдена';
        if (details) {
            details.innerHTML = `
                <dt>Slug</dt>
                <dd>${safeSlug}</dd>
                <dt>Статус</dt>
                <dd>Маршрут требует сверки</dd>
            `;
        }
        if (description) {
            description.innerHTML = '<p>Для этого маршрута пока не удалось найти карточку в JSON runtime. Проверьте slug или откройте полный каталог работ.</p>';
        }
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
                if (!root && attemptsLeft > 0) {
                    setTimeout(() => syncCurrentRoute(attemptsLeft - 1), 60);
                    return;
                }
                renderWorksIndex(root);
                return;
            }

            if (slug) {
                const root = document.getElementById('page-work-single');
                if (!root && attemptsLeft > 0) {
                    setTimeout(() => syncCurrentRoute(attemptsLeft - 1), 60);
                    return;
                }
                const work = getWorkBySlug(slug);
                if (work) {
                    renderWorkSingle(root, work);
                } else {
                    renderMissingWork(root, slug);
                }
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
