// ══════════════════════════════════════════════
// THREE.JS — ambient particles background
// ══════════════════════════════════════════════
(function initAmbientBackground() {
    if (!window.THREE) return;

    const canvas = document.getElementById('canvas');
    if (!canvas) return;

    const renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.z = 30;

    const particleCount = 300;
    const positions = new Float32Array(particleCount * 3);
    const velocities = [];

    for (let i = 0; i < particleCount; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 60;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 60;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 40;
        velocities.push({
            x: (Math.random() - 0.5) * 0.005,
            y: (Math.random() - 0.5) * 0.005 + 0.002,
            z: (Math.random() - 0.5) * 0.003
        });
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
        color: 0xC69653,
        size: 0.12,
        transparent: true,
        opacity: 0.6,
        sizeAttenuation: true
    });

    const particles = new THREE.Points(geometry, material);
    scene.add(particles);

    const lineGeo = new THREE.BufferGeometry();
    const linePositions = [];
    for (let i = 0; i < 20; i++) {
        const y = (Math.random() - 0.5) * 50;
        const z = (Math.random() - 0.5) * 20 - 10;
        linePositions.push(-30, y, z, 30, y, z);
    }
    lineGeo.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));

    const lineMat = new THREE.LineBasicMaterial({
        color: 0xC69653,
        transparent: true,
        opacity: 0.04
    });

    const lines = new THREE.LineSegments(lineGeo, lineMat);
    scene.add(lines);

    let time = 0;

    function animateBackground() {
        requestAnimationFrame(animateBackground);
        time += 0.003;

        const pos = particles.geometry.attributes.position.array;
        for (let i = 0; i < particleCount; i++) {
            pos[i * 3] += velocities[i].x;
            pos[i * 3 + 1] += velocities[i].y;
            pos[i * 3 + 2] += velocities[i].z;

            if (pos[i * 3 + 1] > 30) pos[i * 3 + 1] = -30;
            if (pos[i * 3] > 30) pos[i * 3] = -30;
            if (pos[i * 3] < -30) pos[i * 3] = 30;
        }

        particles.geometry.attributes.position.needsUpdate = true;
        particles.rotation.y = Math.sin(time) * 0.05;
        lines.rotation.z = Math.sin(time * 0.5) * 0.01;

        renderer.render(scene, camera);
    }

    animateBackground();

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
})();

// ══════════════════════════════════════════════
// WORKS DATA RUNTIME
// ══════════════════════════════════════════════
const WORKS_BUILD_ID = '2026-04-13-works-runtime-v1';
const WORKS_JSON_PATH = '09_SOURCE_JSON/shared/works-catalog-1-110.json';
const WORKS_IMAGE_MAP_PATH = '09_SOURCE_JSON/shared/works-image-map.json';

let worksDB = [];
let worksSlugMap = new Map();
let worksReadyPromise = null;

const categoryLabels = {
    north: 'Русский Север',
    city: 'Русский город',
    history: 'Историческая тема',
    interior: 'Камерный мир',
    volga: 'Волга и Юг',
    graphics: 'Графика'
};

const legacyWorkAliases = {
    'severniy-peyzazh': 1,
    'vecherniy-svet-vologda': 61,
    'zimniy-den-v-peterburge': 68,
    'nizhegorodskie-dali': 16,
    'derevyannaya-tserkov': 63,
    'masterskaya-utro': 31,
    'severnaya-derevnya-gravyura': 66,
    'istoricheskiy-motiv': 33,
    'vasilsursk': 16
};

const routeMap = {
    '/': 'page-home',
    '/artist': 'page-artist',
    '/exhibition': 'page-exhibition',
    '/works': 'page-works',
    '/digital': 'page-digital',
    '/digital/workshop': 'page-workshop',
    '/digital/animated': 'page-animated',
    '/visit': 'page-visit',
    '/contacts': 'page-contacts'
};

const pageTitles = {
    '/': 'Пространство памяти — Мемориальная выставка А.Л. Овчинникова',
    '/artist': 'Художник — Пространство памяти',
    '/exhibition': 'Выставка — Пространство памяти',
    '/works': 'Работы — Пространство памяти',
    '/digital': 'Цифровое пространство — Пространство памяти',
    '/digital/workshop': '3D-мастерская — Пространство памяти',
    '/digital/animated': 'Ожившие полотна — Пространство памяти',
    '/visit': 'Посещение — Пространство памяти',
    '/contacts': 'Контакты — Пространство памяти'
};

const contactConfig = {
    email: 'od03@yandex.ru',
    submitUrl: 'https://formsubmit.co/ajax/od03@yandex.ru',
    subjectPrefix: 'Пространство памяти'
};

// ══════════════════════════════════════════════
// DOM REFS
// ══════════════════════════════════════════════
const nav = document.getElementById('mainNav');
const burgerBtn = document.getElementById('burgerBtn');
const mobileMenu = document.getElementById('mobileMenu');
const pageHost = (() => {
    const host = document.createElement('main');
    host.id = 'pageHost';
    const firstPage = document.querySelector('.page');
    if (firstPage && firstPage.parentNode) {
        firstPage.parentNode.insertBefore(host, firstPage);
    }
    return host;
})();
const pageRegistry = new Map();
document.querySelectorAll('.page').forEach((page) => {
    page.classList.remove('active', 'page-enter');
    pageRegistry.set(page.id, page);
    page.remove();
});

let menuOpen = false;
let lastScroll = 0;

// ══════════════════════════════════════════════
// HELPERS
// ══════════════════════════════════════════════
function toHashHref(path) {
    return '#' + path;
}

function getHashPath() {
    const hash = window.location.hash;
    return hash && hash.length > 1 ? hash.slice(1) : '/';
}

function setHashPath(path) {
    const nextHash = '#' + path;
    if (window.location.hash !== nextHash) {
        window.location.hash = nextHash;
    }
}

function isWorkPath(path) {
    return /^\/works\/.+$/.test(path);
}

function isValidPath(path) {
    return !!routeMap[path] || isWorkPath(path);
}

function normalizeRouteLinks() {
    document.querySelectorAll('a[data-route]').forEach((a) => {
        const route = a.getAttribute('data-route');
        if (route) {
            a.setAttribute('href', toHashHref(route));
        }
    });
}

function emphasizeLastWord(text) {
    return String(text).replace(/(\S+)$/, '<em>$1</em>');
}

function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function withBuildId(path) {
    const separator = path.includes('?') ? '&' : '?';
    return `${path}${separator}build=${encodeURIComponent(WORKS_BUILD_ID)}`;
}

function fetchJson(path) {
    return fetch(withBuildId(path), { cache: 'no-store' }).then((res) => {
        if (!res.ok) {
            throw new Error(`Failed to load ${path}: ${res.status}`);
        }
        return res.json();
    });
}

function getWorkBySlug(slug) {
    if (worksSlugMap.has(slug)) {
        return worksSlugMap.get(slug);
    }
    const legacyId = legacyWorkAliases[slug];
    if (legacyId) {
        return worksDB.find((work) => work.id === legacyId) || null;
    }
    return null;
}

function getWorkTitle(slug) {
    const work = getWorkBySlug(slug);
    return work ? `${work.title} — Пространство памяти` : 'Работа — Пространство памяти';
}

function activatePage(pageId) {
    pageRegistry.forEach((page) => {
        page.classList.remove('active', 'page-enter');
    });

    const target = pageRegistry.get(pageId);
    if (!target) return;

    if (pageHost.firstElementChild !== target) {
        pageHost.innerHTML = '';
        pageHost.appendChild(target);
    }
    target.classList.add('active', 'page-enter');
}

function updateNavActive(path) {
    const selectors = '.nav-center a, .mobile-menu a, .nav-btn';
    document.querySelectorAll(selectors).forEach((link) => {
        const route = link.getAttribute('data-route');
        const isActive =
            path === route ||
            (route !== '/' && path.startsWith(route));

        link.classList.toggle('active', !!isActive);
    });
}

function slugifyRu(text) {
    const map = {
        а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z',
        и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r',
        с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'ts', ч: 'ch', ш: 'sh',
        щ: 'sch', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya'
    };

    return String(text || '')
        .toLowerCase()
        .split('')
        .map((char) => map[char] ?? char)
        .join('')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .replace(/-{2,}/g, '-');
}

function parseSizeAndTechnique(rawSize, title, editorialNote) {
    const raw = String(rawSize || '').trim();
    const lower = raw.toLowerCase();
    const combined = `${title || ''} ${editorialNote || ''}`.toLowerCase();

    let technique = '—';
    if (combined.includes('линограв') || combined.includes('гравюр')) {
        technique = 'Линогравюра';
    } else if (lower.includes('х/м')) {
        technique = 'Холст, масло';
    } else if (lower.includes('к/м')) {
        technique = 'Картон, масло';
    } else if (lower.includes('бум')) {
        technique = 'Бумага';
    }

    let size = '—';
    const dimensionMatch = raw.match(/(\d+\s*[xх×]\s*\d+(?:\s*[xх×]\s*\d+)?)/i);
    if (dimensionMatch) {
        size = dimensionMatch[1]
            .replace(/[xх]/gi, ' × ')
            .replace(/\s*×\s*/g, ' × ')
            .replace(/\s+/g, ' ')
            .trim() + ' см';
    }

    if (raw && size === '—' && !/х\/м|к\/м|бум/i.test(raw)) {
        size = raw;
    }

    return { size, technique };
}

function inferCategory(record) {
    const haystack = [
        record.title,
        record.place,
        record.sectionSite,
        record.editorialNote
    ].filter(Boolean).join(' ').toLowerCase();

    const has = (pattern) => pattern.test(haystack);

    if (has(/пугач|варяг|викинг|монастыр|соловец|истор|эпос|покров|часовн|крест/)) {
        return 'history';
    }

    if (has(/изб|интерьер|утвар|натюрморт|портрет|баня|бане|семья|сирень|хозяйк|реб[её]нк|дом|сени|икон|подсвечник/)) {
        return 'interior';
    }

    if (has(/гравюр|линограв|график/)) {
        return 'graphics';
    }

    if (has(/волг|горьк|нижегор|н[её]мд|васильсур|городец|балахн|сормов|щёлоков|крым|ялт|алупк|симфероп|швейцар/)) {
        return 'volga';
    }

    if (has(/ленинград|петербург|городск|кремл|мост|набереж|сад|улиц|архитектур/)) {
        return 'city';
    }

    if (has(/север|белом|арханг|веркол|мезен|помор|лапланд|тайг|онеж|тундр|олень|каюр/)) {
        return 'north';
    }

    return 'north';
}

function buildDescriptionHtml(record) {
    const parts = [];

    if (record.editorialNote) {
        parts.push(`<p>${escapeHtml(record.editorialNote)}</p>`);
    }

    if (record.place) {
        parts.push(`<p><strong>Место:</strong> ${escapeHtml(record.place)}</p>`);
    }

    if (record.needsVerification || /рабоч/i.test(record.status || '')) {
        parts.push('<p><em>Часть данных по этой работе ещё проходит редакционную сверку.</em></p>');
    }

    if (parts.length === 0) {
        parts.push('<p>Аннотация к произведению будет добавлена после редакционной сверки каталога.</p>');
    }

    return parts.join('');
}

function buildHeroMeta(work) {
    const parts = [];
    if (work.year && work.year !== '—') parts.push(work.year);
    if (work.technique && work.technique !== '—') parts.push(work.technique);
    if (work.place && work.place !== '—') parts.push(work.place);
    return parts.join(' · ') || 'Произведение из коллекции';
}

function normalizeWorkRecord(record, imageMap, usedSlugs) {
    const imageMeta = imageMap[String(record.id)] || {};
    const merged = {
        ...record,
        image: record.image || imageMeta.image || '',
        thumbnail: record.thumbnail || imageMeta.thumbnail || '',
        missingImage: Boolean(record.missingImage || imageMeta.missingImage)
    };

    const parsed = parseSizeAndTechnique(merged.size, merged.title, merged.editorialNote);
    let baseSlug = slugifyRu(merged.title) || `work-${merged.id}`;
    let slug = baseSlug;
    let suffix = 2;
    while (usedSlugs.has(slug)) {
        slug = `${baseSlug}-${suffix}`;
        suffix += 1;
    }
    usedSlugs.add(slug);

    return {
        id: merged.id,
        slug,
        title: merged.title || `Работа ${merged.id}`,
        year: String(merged.year || '').trim() || '—',
        place: String(merged.place || '').trim() || '—',
        technique: parsed.technique,
        size: parsed.size,
        collection: 'Собрание семьи художника',
        category: inferCategory(merged),
        image: merged.image || '',
        thumbnail: merged.thumbnail || merged.image || '',
        missingImage: Boolean(merged.missingImage),
        sectionSite: merged.sectionSite || 'Коллекция',
        status: merged.status || '',
        needsVerification: Boolean(merged.needsVerification),
        descriptionHtml: buildDescriptionHtml(merged)
    };
}

function syncWorksMeta() {
    const subtitle = document.querySelector('#page-works .page-hero-subtitle');
    if (subtitle) {
        subtitle.textContent = `Каталог произведений Александра Львовича Овчинникова · ${worksDB.length} работ`;
    }

    const intro = document.querySelector('#page-works .works-editorial-intro p');
    if (intro) {
        intro.textContent = `Каталог объединяет ${worksDB.length} произведений из разных тематических линий художника: от северного цикла и исторической темы до интерьера, предметного мира, волжских и городских маршрутов.`;
    }
}

function loadWorksDatabase() {
    if (worksReadyPromise) return worksReadyPromise;

    worksReadyPromise = Promise.all([
        fetchJson(WORKS_JSON_PATH),
        fetchJson(WORKS_IMAGE_MAP_PATH).catch(() => ({}))
    ])
        .then(([catalog, imageMap]) => {
            const usedSlugs = new Set();
            worksDB = Array.isArray(catalog)
                ? catalog.map((record) => normalizeWorkRecord(record, imageMap, usedSlugs))
                : [];

            worksSlugMap = new Map(worksDB.map((work) => [work.slug, work]));
            syncWorksMeta();
            renderWorksCatalog();
            return worksDB;
        })
        .catch((error) => {
            console.error('Works runtime error:', error);
            worksDB = [];
            worksSlugMap = new Map();
            renderWorksCatalog();
            return worksDB;
        });

    return worksReadyPromise;
}

// ══════════════════════════════════════════════
// SCROLL REVEAL
// ══════════════════════════════════════════════
const revealObserver = ('IntersectionObserver' in window)
    ? new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -40px 0px'
    })
    : null;

if (revealObserver) {
    document.documentElement.classList.add('enhanced-reveal');
    document.querySelectorAll('.reveal').forEach((el) => revealObserver.observe(el));
}

function reinitReveals() {
    const activePage = document.querySelector('.page.active');
    if (!activePage || !revealObserver) return;

    activePage.querySelectorAll('.reveal').forEach((el) => {
        el.classList.remove('visible');
        revealObserver.observe(el);
    });
}

// ══════════════════════════════════════════════
// MOBILE MENU
// ══════════════════════════════════════════════
function closeMobile() {
    menuOpen = false;
    if (mobileMenu) mobileMenu.classList.remove('open');
    if (burgerBtn) burgerBtn.innerHTML = '<i class="fa-solid fa-bars" style="color: var(--text-on-dark);"></i>';
}

if (burgerBtn) {
    burgerBtn.addEventListener('click', () => {
        menuOpen = !menuOpen;
        if (mobileMenu) mobileMenu.classList.toggle('open', menuOpen);
        burgerBtn.innerHTML = menuOpen
            ? '<i class="fa-solid fa-xmark" style="color: var(--text-on-dark);"></i>'
            : '<i class="fa-solid fa-bars" style="color: var(--text-on-dark);"></i>';
    });
}

// ══════════════════════════════════════════════
// NAV HIDE ON SCROLL
// ══════════════════════════════════════════════
window.addEventListener('scroll', () => {
    const current = window.scrollY;
    if (current > lastScroll && current > 200) {
        nav?.classList.add('hidden');
    } else {
        nav?.classList.remove('hidden');
    }
    lastScroll = current;
});

// ══════════════════════════════════════════════
// WORK PAGE HELPERS
// ══════════════════════════════════════════════
function createImageBlock(work, options) {
    const {
        containerClass,
        innerClass,
        label,
        imagePath,
        alt,
        fit,
        imageClass
    } = options;

    if (!work.missingImage && imagePath) {
        return `
            <div class="${containerClass} has-image" data-category="${escapeHtml(work.category)}">
                <div class="${innerClass}">
                    <img class="${imageClass}" src="${escapeHtml(imagePath)}" alt="${escapeHtml(alt)}" loading="lazy" decoding="async" style="object-fit: ${fit};">
                    <span class="artwork-label">${escapeHtml(label)}</span>
                </div>
            </div>
        `;
    }

    return `
        <div class="${containerClass}" data-category="${escapeHtml(work.category)}">
            <div class="${innerClass}">
                <span class="artwork-label">${escapeHtml(label)}</span>
            </div>
        </div>
    `;
}

function createCatalogCard(work) {
    const card = document.createElement('a');
    card.className = 'catalog-card';
    card.href = '#/works/' + work.slug;
    card.setAttribute('data-route', '/works/' + work.slug);
    card.dataset.category = work.category;
    card.dataset.slug = work.slug;

    const label = categoryLabels[work.category] || 'Коллекция';
    const meta = [work.year !== '—' ? work.year : null].filter(Boolean).join(' · ');
    const techLine = [work.technique !== '—' ? work.technique : null, work.size !== '—' ? work.size : null]
        .filter(Boolean)
        .join(' · ');

    card.innerHTML = `
        ${createImageBlock(work, {
            containerClass: 'catalog-image',
            innerClass: 'catalog-image-inner',
            label,
            imagePath: work.thumbnail || work.image,
            alt: work.title,
            fit: 'cover',
            imageClass: 'catalog-thumb'
        })}
        <h4>${escapeHtml(work.title)}</h4>
        <div class="catalog-cycle">Раздел: ${escapeHtml(label)}</div>
        <span class="catalog-meta" style="color: var(--text-muted);">${escapeHtml(meta || 'Без даты')}</span>
        <div class="catalog-technique" style="color: var(--text-muted);">${escapeHtml(techLine || 'Данные уточняются')}</div>
    `;

    return card;
}

function applyWorksFilter(filter) {
    document.querySelectorAll('#page-works .catalog-card').forEach((card) => {
        const category = card.getAttribute('data-category');
        card.style.display = (filter === 'all' || category === filter) ? '' : 'none';
    });
}

function renderWorksCatalog() {
    const grid = document.getElementById('catalogGrid');
    if (!grid) return;

    if (!worksDB.length) {
        grid.innerHTML = `
            <div class="catalog-empty-state">
                <p>Каталог пока не удалось загрузить. Попробуйте обновить страницу.</p>
            </div>
        `;
        return;
    }

    grid.innerHTML = '';
    worksDB.forEach((work) => {
        grid.appendChild(createCatalogCard(work));
    });

    const activeFilter = document.querySelector('.filter-btn.active')?.getAttribute('data-filter') || 'all';
    applyWorksFilter(activeFilter);
}

function createRelatedCard(work) {
    const card = document.createElement('a');
    card.className = 'work-card';
    card.href = '#/works/' + work.slug;
    card.setAttribute('data-route', '/works/' + work.slug);
    card.style.textDecoration = 'none';
    card.dataset.category = work.category;

    card.innerHTML = `
        ${createImageBlock(work, {
            containerClass: 'work-image',
            innerClass: 'work-image-inner',
            label: categoryLabels[work.category] || 'Коллекция',
            imagePath: work.thumbnail || work.image,
            alt: work.title,
            fit: 'cover',
            imageClass: 'work-thumb'
        })}
        <h4 style="color: var(--deep-blue);">${escapeHtml(work.title)}</h4>
        <span class="work-meta" style="color: var(--text-muted);">${escapeHtml(
            [work.year !== '—' ? work.year : null, work.size !== '—' ? work.size : null].filter(Boolean).join(' · ') || 'Данные уточняются'
        )}</span>
    `;
    return card;
}

function renderWorkSingleImage(host, work) {
    if (!host) return;

    if (!work.missingImage && work.image) {
        host.classList.add('has-image');
        host.innerHTML = `
            <div class="work-single-image-inner">
                <img class="work-single-media" src="${escapeHtml(work.image)}" alt="${escapeHtml(work.title)}" decoding="async">
                <div class="work-single-image-caption">${escapeHtml(categoryLabels[work.category] || 'Коллекция')}</div>
            </div>
        `;
        return;
    }

    host.classList.remove('has-image');
    host.innerHTML = `
        <div class="work-single-image-inner">
            <i class="fa-solid fa-image" style="font-size: 4rem; color: rgba(196,150,83,0.35);"></i>
            <span>Изображение будет добавлено после оцифровки</span>
        </div>
    `;
}

function showWorkPage(slug) {
    const work = getWorkBySlug(slug);

    if (!work) {
        navigateTo('/works', true);
        return false;
    }

    const idx = worksDB.findIndex((item) => item.slug === work.slug);
    const prev = idx > 0 ? worksDB[idx - 1] : null;
    const next = idx < worksDB.length - 1 ? worksDB[idx + 1] : null;
    const sectionLabel = categoryLabels[work.category] || 'Коллекция';

    const workHeroCategory = document.getElementById('workHeroCategory');
    const workHeroTitle = document.getElementById('workHeroTitle');
    const workHeroMeta = document.getElementById('workHeroMeta');
    const workBreadcrumbTitle = document.getElementById('workBreadcrumbTitle');
    const workTitle = document.getElementById('workTitle');
    const workAuthor = document.getElementById('workAuthor');
    const workYear = document.getElementById('workYear');
    const workTechnique = document.getElementById('workTechnique');
    const workSize = document.getElementById('workSize');
    const workSection = document.getElementById('workSection');
    const workCollection = document.getElementById('workCollection');
    const workDescription = document.getElementById('workDescription');

    if (workHeroCategory) workHeroCategory.textContent = sectionLabel;
    if (workHeroTitle) workHeroTitle.innerHTML = emphasizeLastWord(work.title);
    if (workHeroMeta) workHeroMeta.textContent = buildHeroMeta(work);

    if (workBreadcrumbTitle) workBreadcrumbTitle.textContent = work.title;
    if (workTitle) workTitle.textContent = work.title;
    if (workAuthor) workAuthor.textContent = 'Александр Львович Овчинников';
    if (workYear) workYear.textContent = work.year;
    if (workTechnique) workTechnique.textContent = work.technique;
    if (workSize) workSize.textContent = work.size;
    if (workSection) workSection.textContent = sectionLabel;
    if (workCollection) workCollection.textContent = work.collection;
    if (workDescription) workDescription.innerHTML = work.descriptionHtml;

    renderWorkSingleImage(document.querySelector('.work-single-image'), work);

    const linksEl = document.getElementById('workLinks');
    if (linksEl) {
        linksEl.innerHTML = '';

        const allWorksLink = document.createElement('a');
        allWorksLink.href = '#/works';
        allWorksLink.className = 'btn btn-light';
        allWorksLink.innerHTML = '<i class="fa-solid fa-grid-2" style="color: inherit;"></i> Вся коллекция';
        allWorksLink.addEventListener('click', (e) => {
            e.preventDefault();
            navigateTo('/works');
        });
        linksEl.appendChild(allWorksLink);
    }

    const prevEl = document.getElementById('workPrev');
    const nextEl = document.getElementById('workNext');

    if (prevEl) {
        if (prev) {
            prevEl.style.visibility = 'visible';
            prevEl.href = '#/works/' + prev.slug;
            prevEl.onclick = (e) => {
                e.preventDefault();
                navigateTo('/works/' + prev.slug);
            };
            prevEl.innerHTML = `<i class="fa-solid fa-arrow-left" style="color: inherit;"></i> ${escapeHtml(prev.title)}`;
        } else {
            prevEl.style.visibility = 'hidden';
            prevEl.removeAttribute('href');
            prevEl.onclick = null;
        }
    }

    if (nextEl) {
        if (next) {
            nextEl.style.visibility = 'visible';
            nextEl.href = '#/works/' + next.slug;
            nextEl.onclick = (e) => {
                e.preventDefault();
                navigateTo('/works/' + next.slug);
            };
            nextEl.innerHTML = `${escapeHtml(next.title)} <i class="fa-solid fa-arrow-right" style="color: inherit;"></i>`;
        } else {
            nextEl.style.visibility = 'hidden';
            nextEl.removeAttribute('href');
            nextEl.onclick = null;
        }
    }

    const relatedContainer = document.getElementById('workRelated');
    if (relatedContainer) {
        relatedContainer.innerHTML = '';
        let related = worksDB.filter((item) => item.category === work.category && item.slug !== work.slug).slice(0, 3);
        if (related.length === 0) {
            related = worksDB.filter((item) => item.slug !== work.slug).slice(0, 3);
        }
        related.forEach((item) => {
            relatedContainer.appendChild(createRelatedCard(item));
        });
    }

    activatePage('page-work-single');
    return true;
}

// ══════════════════════════════════════════════
// 3D WORKSHOP
// ══════════════════════════════════════════════
let workshopInitialized = false;
let workshopLoading = false;
let workshopScene = null;
let workshopCamera = null;
let workshopRenderer = null;
let workshopControls = null;
let workshopAnimId = null;
let workshopResizeHandler = null;

function stopWorkshopLoop() {
    if (workshopAnimId) {
        cancelAnimationFrame(workshopAnimId);
        workshopAnimId = null;
    }
}

function startWorkshopLoop() {
    if (!workshopRenderer || !workshopScene || !workshopCamera || workshopAnimId) return;

    function animateWorkshop() {
        workshopAnimId = requestAnimationFrame(animateWorkshop);
        if (workshopControls) workshopControls.update();
        workshopRenderer.render(workshopScene, workshopCamera);
    }

    animateWorkshop();
}

function destroyWorkshopRuntime() {
    stopWorkshopLoop();

    if (workshopControls) {
        workshopControls.dispose();
        workshopControls = null;
    }

    if (workshopRenderer) {
        if (workshopRenderer.domElement && workshopRenderer.domElement.parentNode) {
            workshopRenderer.domElement.parentNode.removeChild(workshopRenderer.domElement);
        }
        workshopRenderer.dispose();
        workshopRenderer = null;
    }

    workshopScene = null;
    workshopCamera = null;

    if (workshopResizeHandler) {
        window.removeEventListener('resize', workshopResizeHandler);
        workshopResizeHandler = null;
    }
}

function initWorkshop3D() {
    if (workshopInitialized || workshopLoading) {
        if (workshopInitialized && getHashPath() === '/digital/workshop') {
            startWorkshopLoop();
        }
        return;
    }

    const container = document.getElementById('workshopViewer');
    const loaderEl = document.getElementById('workshopLoader');
    const errorEl = document.getElementById('workshopError');
    const progressBar = document.getElementById('workshopProgressBar');
    const hintEl = document.getElementById('workshopHint');

    if (!container || !window.THREE || !THREE.GLTFLoader || !THREE.OrbitControls) {
        if (loaderEl) loaderEl.classList.add('hidden');
        if (errorEl) errorEl.classList.add('visible');
        return;
    }

    workshopLoading = true;
    workshopInitialized = false;

    destroyWorkshopRuntime();

    if (loaderEl) loaderEl.classList.remove('hidden');
    if (errorEl) errorEl.classList.remove('visible');
    if (hintEl) hintEl.style.opacity = '1';
    if (progressBar) progressBar.style.width = '0%';

    workshopScene = new THREE.Scene();
    workshopScene.background = new THREE.Color(0x080E1A);
    workshopScene.fog = new THREE.FogExp2(0x080E1A, 0.015);

    const rect = container.getBoundingClientRect();
    workshopCamera = new THREE.PerspectiveCamera(50, rect.width / rect.height, 0.1, 500);
    workshopCamera.position.set(5, 3, 8);

    workshopRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    workshopRenderer.setSize(rect.width, rect.height);
    workshopRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    workshopRenderer.outputEncoding = THREE.sRGBEncoding;
    workshopRenderer.toneMapping = THREE.ACESFilmicToneMapping;
    workshopRenderer.toneMappingExposure = 1.2;
    workshopRenderer.shadowMap.enabled = true;
    workshopRenderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(workshopRenderer.domElement);

    workshopControls = new THREE.OrbitControls(workshopCamera, workshopRenderer.domElement);
    workshopControls.enableDamping = true;
    workshopControls.dampingFactor = 0.08;
    workshopControls.minDistance = 1;
    workshopControls.maxDistance = 50;
    workshopControls.maxPolarAngle = Math.PI * 0.85;
    workshopControls.target.set(0, 1.5, 0);
    workshopControls.update();

    const ambientLight = new THREE.AmbientLight(0xF2EDE8, 0.4);
    workshopScene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight(0xF2EDE8, 0x1A2744, 0.5);
    workshopScene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xFFF5E0, 1.0);
    dirLight.position.set(5, 8, 4);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 30;
    dirLight.shadow.camera.left = -10;
    dirLight.shadow.camera.right = 10;
    dirLight.shadow.camera.top = 10;
    dirLight.shadow.camera.bottom = -10;
    workshopScene.add(dirLight);

    const warmLight = new THREE.PointLight(0xC69653, 0.6, 15);
    warmLight.position.set(-2, 3, 1);
    workshopScene.add(warmLight);

    const fillLight = new THREE.PointLight(0x8899BB, 0.3, 20);
    fillLight.position.set(3, 2, -3);
    workshopScene.add(fillLight);

    workshopResizeHandler = () => {
        const r = container.getBoundingClientRect();
        if (!workshopCamera || !workshopRenderer || r.width === 0 || r.height === 0) return;
        workshopCamera.aspect = r.width / r.height;
        workshopCamera.updateProjectionMatrix();
        workshopRenderer.setSize(r.width, r.height);
    };
    window.addEventListener('resize', workshopResizeHandler);

    const glbURL = 'assets/models/ovchinnikov_workshop_balanced.glb';
    const loader = new THREE.GLTFLoader();
    loader.setCrossOrigin('anonymous');

    loader.load(
        glbURL,
        (gltf) => {
            const model = gltf.scene;

            const box = new THREE.Box3().setFromObject(model);
            const center = box.getCenter(new THREE.Vector3());
            const size = box.getSize(new THREE.Vector3());
            const maxDim = Math.max(size.x, size.y, size.z) || 1;
            const scale = 8 / maxDim;

            model.scale.setScalar(scale);

            const scaledBox = new THREE.Box3().setFromObject(model);
            const scaledCenter = scaledBox.getCenter(new THREE.Vector3());
            model.position.sub(scaledCenter);
            model.position.y -= scaledBox.min.y;

            model.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });

            workshopScene.add(model);

            const finalBox = new THREE.Box3().setFromObject(model);
            const finalCenter = finalBox.getCenter(new THREE.Vector3());
            workshopControls.target.copy(finalCenter);
            workshopCamera.position.set(
                finalCenter.x + maxDim * scale * 0.8,
                finalCenter.y + maxDim * scale * 0.5,
                finalCenter.z + maxDim * scale * 0.8
            );
            workshopControls.update();

            if (loaderEl) loaderEl.classList.add('hidden');
            workshopLoading = false;
            workshopInitialized = true;

            const hideHintOnce = () => {
                setTimeout(() => {
                    if (hintEl) hintEl.style.opacity = '0';
                }, 3000);
                workshopControls.removeEventListener('start', hideHintOnce);
            };
            workshopControls.addEventListener('start', hideHintOnce);

            if (getHashPath() === '/digital/workshop') {
                startWorkshopLoop();
            }
        },
        (xhr) => {
            if (xhr.total > 0 && progressBar) {
                const percent = Math.round((xhr.loaded / xhr.total) * 100);
                progressBar.style.width = percent + '%';
            }
        },
        (error) => {
            console.error('GLB load error:', error);
            workshopLoading = false;
            workshopInitialized = false;
            if (loaderEl) loaderEl.classList.add('hidden');
            if (errorEl) errorEl.classList.add('visible');
            stopWorkshopLoop();
            destroyWorkshopRuntime();
        }
    );
}

// ══════════════════════════════════════════════
// ROUTER
// ══════════════════════════════════════════════
function renderPath(path) {
    const safePath = isValidPath(path) ? path : '/';

    if (isWorkPath(safePath)) {
        activatePage('page-work-single');
        const slug = safePath.replace('/works/', '');
        const ok = showWorkPage(slug);
        if (!ok) return;

        updateNavActive(safePath);
        document.title = getWorkTitle(slug);
        reinitReveals();
        stopWorkshopLoop();
        return;
    }

    const pageId = routeMap[safePath];
    activatePage(pageId);
    updateNavActive(safePath);
    document.title = pageTitles[safePath] || pageTitles['/'];
    reinitReveals();

    if (safePath === '/digital/workshop') {
        if (workshopInitialized) {
            startWorkshopLoop();
        } else {
            setTimeout(initWorkshop3D, 120);
        }
    } else {
        stopWorkshopLoop();
    }
}

function navigateTo(path, updateHash) {
    if (updateHash === undefined) updateHash = true;
    closeMobile();
    window.scrollTo(0, 0);
    nav?.classList.remove('hidden');
    lastScroll = 0;

    const safePath = isValidPath(path) ? path : '/';

    if (updateHash) {
        if (getHashPath() !== safePath) {
            setHashPath(safePath);
            return;
        }
    }

    if (safePath === '/works' || isWorkPath(safePath)) {
        loadWorksDatabase().finally(() => renderPath(safePath));
        return;
    }

    renderPath(safePath);
}

// ══════════════════════════════════════════════
// LINK INTERCEPTION
// ══════════════════════════════════════════════
document.addEventListener('click', (e) => {
    const link = e.target.closest('a[data-route]');
    if (!link) return;

    if (
        e.metaKey ||
        e.ctrlKey ||
        e.shiftKey ||
        e.altKey ||
        e.button !== 0 ||
        link.target === '_blank'
    ) {
        return;
    }

    e.preventDefault();
    const route = link.getAttribute('data-route');
    navigateTo(route);
});

window.addEventListener('hashchange', () => {
    const nextPath = getHashPath();
    if (nextPath === '/works' || isWorkPath(nextPath)) {
        loadWorksDatabase().finally(() => navigateTo(nextPath, false));
        return;
    }
    navigateTo(nextPath, false);
});

// ══════════════════════════════════════════════
// WORKS FILTERS
// ══════════════════════════════════════════════
document.addEventListener('click', (e) => {
    const btn = e.target.closest('.filter-btn');
    if (!btn) return;

    const filter = btn.getAttribute('data-filter');
    document.querySelectorAll('.filter-btn').forEach((item) => item.classList.remove('active'));
    btn.classList.add('active');
    applyWorksFilter(filter);
});

// ══════════════════════════════════════════════
// CONTACTS FORM
// ══════════════════════════════════════════════
document.addEventListener('click', (e) => {
    const btn = e.target.closest('.contact-prefill-btn');
    if (!btn) return;
    const topic = btn.getAttribute('data-topic');
    const select = document.getElementById('field-topic');
    const form = document.getElementById('contactForm');
    if (select) select.value = topic;
    if (form) form.scrollIntoView({ behavior: 'smooth', block: 'start' });
});

document.addEventListener('submit', async (e) => {
    const form = e.target.closest('#contactForm');
    if (!form) return;
    e.preventDefault();

    const success = document.getElementById('contactSuccess');
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn ? submitBtn.textContent : '';

    const data = new FormData(form);
    const topic = data.get('topic') || 'Обращение через сайт';
    data.append('_subject', `[${contactConfig.subjectPrefix}] ${topic}`);
    data.append('_template', 'table');
    data.append('_honey', '');

    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Отправка...';
    }

    try {
        const response = await fetch(contactConfig.submitUrl, {
            method: 'POST',
            body: data,
            headers: {
                Accept: 'application/json'
            }
        });

        const result = await response.json().catch(() => ({}));

        if (!response.ok || result.success === false) {
            throw new Error(result.message || 'Не удалось отправить сообщение.');
        }

        if (success) {
            success.innerHTML = '<p>Спасибо. Сообщение отправлено.</p><p style="color: var(--text-muted);">Если это первое письмо с этой формы, подтвердите приём формы в письме от FormSubmit на адресе od03@yandex.ru. После подтверждения все следующие сообщения будут приходить автоматически.</p>';
            success.style.display = 'block';
        }

        form.reset();
        form.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (error) {
        console.error('Contact form submit error:', error);
        if (success) {
            success.innerHTML = `<p>Сообщение пока не отправлено.</p><p style="color: var(--text-muted);">${escapeHtml(error.message || 'Попробуйте ещё раз чуть позже.')}</p>`;
            success.style.display = 'block';
        }
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = originalBtnText || 'Отправить сообщение';
        }
    }
});

// ══════════════════════════════════════════════
// INIT
// ══════════════════════════════════════════════
(function initApp() {
    normalizeRouteLinks();

    const initialPath = getHashPath();
    if (initialPath === '/works' || isWorkPath(initialPath)) {
        loadWorksDatabase().finally(() => navigateTo(initialPath, false));
        return;
    }

    navigateTo(initialPath, false);
    loadWorksDatabase().catch((error) => {
        console.error('Works preload error:', error);
    });
})();

window.navigateTo = navigateTo;
