(function initWorksAnimatedRuntime() {
    const BUILD_ID = '2026-04-19-animated-work-070-v1';
    const TARGET_SLUG = 'lodka-u-kirpichnoy-naberezhnoy';
    const REPO = 'odmal88/ALOvchinnikov_memorial';
    const SECTION_ID = 'workAnimatedBlock070';
    const ISSUE_IDS = [78, 79];

    let mediaPromise = null;
    let mediaUrl = null;

    function getCurrentPath() {
        const raw = window.location.hash ? window.location.hash.slice(1) : '/';
        return raw.startsWith('/') ? raw : `/${raw}`;
    }

    function getRouteSlug(path) {
        const match = String(path || '').match(/^\/works\/([^/?#]+)/);
        return match ? decodeURIComponent(match[1]).toLowerCase() : '';
    }

    function isTargetRoute(path) {
        return getRouteSlug(path) === TARGET_SLUG;
    }

    function injectStyle() {
        if (document.getElementById('works-animated-runtime-style')) return;
        const style = document.createElement('style');
        style.id = 'works-animated-runtime-style';
        style.textContent = `
            .work-animated-runtime {
                margin-top: 32px;
                padding-top: 32px;
                border-top: 1px solid var(--border-light);
            }
            .work-animated-runtime-title {
                margin: 0 0 16px;
                font-family: var(--serif);
                font-size: clamp(22px, 3vw, 28px);
                font-weight: 400;
                color: var(--deep-blue);
                line-height: 1.2;
            }
            .work-animated-runtime-body {
                max-width: 720px;
            }
            .work-animated-runtime-video {
                display: block;
                width: 100%;
                height: auto;
                border-radius: 12px;
                background: #101723;
                box-shadow: 0 14px 32px rgba(0,0,0,0.12);
            }
            .work-animated-runtime-note {
                margin: 12px 0 0;
                font-family: var(--sans);
                font-size: 14px;
                line-height: 1.65;
                color: var(--text-muted);
            }
            .work-animated-runtime-status {
                padding: 18px 20px;
                border: 1px solid var(--border-light);
                background: rgba(18,28,57,0.04);
                border-radius: 8px;
                font-family: var(--sans);
                font-size: 14px;
                line-height: 1.6;
                color: var(--text-muted);
            }
            .work-animated-runtime-status.is-error {
                background: rgba(109,41,58,0.06);
            }
        `;
        document.head.appendChild(style);
    }

    async function fetchIssueBody(issueNumber) {
        const response = await fetch(`https://api.github.com/repos/${REPO}/issues/${issueNumber}?build=${encodeURIComponent(BUILD_ID)}`, {
            cache: 'force-cache'
        });
        if (!response.ok) {
            throw new Error(`Failed to load issue ${issueNumber}: ${response.status}`);
        }
        const payload = await response.json();
        return String(payload.body || '');
    }

    function extractChunk(body, index) {
        const header = new RegExp(`^chunk\\s+${index}\\/2\\s*\\n?`, 'i');
        return body.replace(header, '').replace(/\s+/g, '');
    }

    function base64ToBlob(base64) {
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i += 1) {
            bytes[i] = binary.charCodeAt(i);
        }
        return new Blob([bytes], { type: 'video/mp4' });
    }

    async function loadMediaUrl() {
        if (mediaUrl) return mediaUrl;
        if (!mediaPromise) {
            mediaPromise = Promise.all(ISSUE_IDS.map((issueNumber) => fetchIssueBody(issueNumber)))
                .then(([chunk1Body, chunk2Body]) => {
                    const base64 = extractChunk(chunk1Body, 1) + extractChunk(chunk2Body, 2);
                    mediaUrl = URL.createObjectURL(base64ToBlob(base64));
                    return mediaUrl;
                })
                .catch((error) => {
                    mediaPromise = null;
                    throw error;
                });
        }
        return mediaPromise;
    }

    function getWorkHost(root) {
        const work = root.querySelector('.work-single');
        const grid = root.querySelector('.work-single-grid');
        if (!work || !grid) return null;
        return { work, grid };
    }

    function ensureSection(root) {
        const host = getWorkHost(root);
        if (!host) return null;

        let section = host.work.querySelector(`#${SECTION_ID}`);
        if (section) return section;

        section = document.createElement('section');
        section.id = SECTION_ID;
        section.className = 'work-animated-runtime';
        section.innerHTML = `
            <h2 class="work-animated-runtime-title">Ожившая версия</h2>
            <div class="work-animated-runtime-body">
                <div class="work-animated-runtime-status">Загружаем ожившую версию…</div>
            </div>
        `;
        host.grid.insertAdjacentElement('afterend', section);
        return section;
    }

    function removeSection() {
        const section = document.getElementById(SECTION_ID);
        if (section) section.remove();
    }

    function renderError(section) {
        const body = section.querySelector('.work-animated-runtime-body');
        if (!body) return;
        body.innerHTML = '<div class="work-animated-runtime-status is-error">Не удалось загрузить ожившую версию.</div>';
        section.dataset.ready = '0';
    }

    function renderVideo(section, url) {
        const body = section.querySelector('.work-animated-runtime-body');
        if (!body) return;

        const image = document.querySelector('#page-work-single .work-single-actual-image');
        const poster = image ? image.getAttribute('src') || '' : '';
        const posterAttr = poster ? ` poster="${poster}"` : '';

        body.innerHTML = `
            <video class="work-animated-runtime-video" controls playsinline preload="metadata" muted loop${posterAttr}>
                <source src="${url}" type="video/mp4">
                Ваш браузер не поддерживает встроенное видео.
            </video>
            <p class="work-animated-runtime-note">Цифровое расширение произведения. Исходная работа на странице сохраняется как основное изображение.</p>
        `;
        section.dataset.ready = '1';
    }

    function syncAnimatedBlock(retries) {
        injectStyle();

        if (!isTargetRoute(getCurrentPath())) {
            removeSection();
            return;
        }

        const root = document.getElementById('page-work-single');
        if (!root) {
            if ((retries || 0) > 0) {
                setTimeout(() => syncAnimatedBlock((retries || 0) - 1), 80);
            }
            return;
        }

        const section = ensureSection(root);
        if (!section || section.dataset.loading === '1' || section.dataset.ready === '1') return;

        section.dataset.loading = '1';
        loadMediaUrl()
            .then((url) => {
                section.dataset.loading = '0';
                if (isTargetRoute(getCurrentPath())) {
                    renderVideo(section, url);
                }
            })
            .catch((error) => {
                console.error('Animated work runtime error:', error);
                section.dataset.loading = '0';
                renderError(section);
            });
    }

    function scheduleSync() {
        setTimeout(() => syncAnimatedBlock(8), 0);
    }

    function wrapNavigateTo() {
        if (typeof window.navigateTo !== 'function' || window.navigateTo.__worksAnimatedWrapped) return;
        const originalNavigateTo = window.navigateTo;
        const wrappedNavigateTo = function wrappedNavigateTo() {
            const result = originalNavigateTo.apply(this, arguments);
            scheduleSync();
            return result;
        };
        wrappedNavigateTo.__worksAnimatedWrapped = true;
        wrappedNavigateTo.__original = originalNavigateTo;
        window.navigateTo = wrappedNavigateTo;
    }

    wrapNavigateTo();
    window.addEventListener('hashchange', scheduleSync);
    window.addEventListener('load', scheduleSync);
    scheduleSync();
})();
