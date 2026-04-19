(function initWorkOverrides() {
    var BUILD_ID = '2026-04-19-animated-work-v2';
    var ANIMATED_MAP_PATH = '09_SOURCE_JSON/shared/works-animated-media-map.json';
    var AUTHOR_OVERRIDES = {
        '/works/natyurmort-s-ikonoy-i-podsvechnikom': 'Лев Овчинников'
    };

    var state = {
        mapPromise: null
    };

    function withBuildId(path) {
        var separator = path.indexOf('?') !== -1 ? '&' : '?';
        return path + separator + 'build=' + encodeURIComponent(BUILD_ID);
    }

    function escapeHtml(value) {
        return String(value == null ? '' : value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/\"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function getHashPath() {
        var hash = window.location.hash;
        return hash && hash.length > 1 ? hash.slice(1) : '/';
    }

    function fetchJson(path) {
        return fetch(withBuildId(path), { cache: 'no-store' }).then(function(response) {
            if (!response.ok) {
                throw new Error('Failed to load ' + path + ': ' + response.status);
            }
            return response.json();
        });
    }

    function loadAnimatedMap() {
        if (state.mapPromise) return state.mapPromise;

        state.mapPromise = fetchJson(ANIMATED_MAP_PATH).catch(function(error) {
            console.error('Animated works map error:', error);
            return {};
        });

        return state.mapPromise;
    }

    function injectAnimatedStyles() {
        if (document.getElementById('works-animated-inline-style')) return;

        var style = document.createElement('style');
        style.id = 'works-animated-inline-style';
        style.textContent = '' +
            '.work-single-media-column{display:grid;gap:22px;align-self:start;}' +
            '.work-single-animated{display:block;}' +
            '.work-single-animated[hidden]{display:none!important;}' +
            '.work-single-animated-card{background:#ffffff;border:1px solid var(--border-light);padding:20px;}' +
            '.work-single-animated-kicker{display:inline-block;margin-bottom:10px;font-family:var(--sans);font-size:11px;font-weight:500;letter-spacing:0.14em;text-transform:uppercase;color:var(--gold-muted);}' +
            '.work-single-animated-title{margin:0 0 12px;font-family:var(--serif);font-size:24px;font-weight:400;color:var(--deep-blue);line-height:1.2;}' +
            '.work-single-animated-frame{position:relative;background:var(--deep-blue);border:1px solid var(--border-dark);overflow:hidden;aspect-ratio:16/10;}' +
            '.work-single-animated-video{display:block;width:100%;height:100%;object-fit:cover;background:#0b1324;}' +
            '.work-single-animated-status{margin:12px 0 0;font-family:var(--sans);font-size:13px;color:var(--text-muted);line-height:1.6;}' +
            '@media (max-width:900px){.work-single-media-column{gap:18px;}.work-single-animated-card{padding:16px;}.work-single-animated-title{font-size:22px;}}';
        document.head.appendChild(style);
    }

    function applyAuthorOverride() {
        var path = getHashPath();
        var targetAuthor = AUTHOR_OVERRIDES[path];
        if (!targetAuthor) return;

        var authorEl = document.getElementById('workAuthor');
        if (authorEl && authorEl.textContent !== targetAuthor) {
            authorEl.textContent = targetAuthor;
        }
    }

    function ensureAnimatedHost(root) {
        if (!root) return null;

        var grid = root.querySelector('.work-single-grid');
        var image = root.querySelector('.work-single-image');
        if (!grid || !image) return null;

        var column = grid.querySelector('.work-single-media-column');
        if (!column) {
            column = document.createElement('div');
            column.className = 'work-single-media-column';
            grid.insertBefore(column, image);
            column.appendChild(image);
        } else if (!column.contains(image)) {
            column.insertBefore(image, column.firstChild || null);
        }

        var host = column.querySelector('#workAnimatedBlock');
        if (!host) {
            host = document.createElement('div');
            host.id = 'workAnimatedBlock';
            host.className = 'work-single-animated';
            column.appendChild(host);
        }

        return host;
    }

    function clearAnimatedBlock(root) {
        var host = root ? root.querySelector('#workAnimatedBlock') : null;
        if (!host) return;
        host.innerHTML = '';
        host.hidden = true;
    }

    function resolveVideoSrc(entry) {
        if (entry && entry.mp4Base64) {
            return 'data:video/mp4;base64,' + entry.mp4Base64;
        }
        if (entry && entry.mp4) {
            return withBuildId(entry.mp4);
        }
        return '';
    }

    function renderAnimatedBlock(root, entry) {
        var host = ensureAnimatedHost(root);
        if (!host) return;

        var videoSrc = resolveVideoSrc(entry);
        host.hidden = false;
        host.innerHTML = '' +
            '<section class="work-single-animated-card">' +
                '<span class="work-single-animated-kicker">Цифровое продолжение</span>' +
                '<h2 class="work-single-animated-title">' + escapeHtml(entry.label || 'Ожившая версия') + '</h2>' +
                '<div class="work-single-animated-frame">' +
                    '<video class="work-single-animated-video" controls playsinline preload="metadata" poster="' + escapeHtml(entry.poster || '') + '">' +
                        '<source src="' + escapeHtml(videoSrc) + '" type="video/mp4" />' +
                        'Ваш браузер не поддерживает встроенное видео.' +
                    '</video>' +
                '</div>' +
                '<p class="work-single-animated-status">Оригинальное произведение остаётся основной точкой просмотра, а видео открывает дополнительный цифровой ракурс.</p>' +
            '</section>';
    }

    function syncAnimatedWork() {
        var path = getHashPath();
        var root = document.getElementById('page-work-single');

        injectAnimatedStyles();

        if (!root) return;
        if (path.indexOf('/works/') !== 0) {
            clearAnimatedBlock(root);
            return;
        }

        var slug = path.slice('/works/'.length).split(/[?#]/)[0];
        if (!slug) {
            clearAnimatedBlock(root);
            return;
        }

        loadAnimatedMap().then(function(map) {
            var entry = map && typeof map === 'object' ? map[slug] : null;
            if (!entry || (!entry.mp4 && !entry.mp4Base64)) {
                clearAnimatedBlock(root);
                return;
            }
            renderAnimatedBlock(root, entry);
        });
    }

    function applyAll() {
        applyAuthorOverride();
        syncAnimatedWork();
    }

    window.addEventListener('hashchange', function() {
        requestAnimationFrame(applyAll);
    });

    document.addEventListener('DOMContentLoaded', applyAll);
    window.addEventListener('load', applyAll);

    var observer = new MutationObserver(function() {
        applyAll();
    });

    function startObserver() {
        if (!document.body) {
            requestAnimationFrame(startObserver);
            return;
        }

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        applyAll();
    }

    startObserver();
})();
