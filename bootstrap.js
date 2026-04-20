(function bootstrapApp() {
    const BUILD_ID = '2026-04-20-hotfix-v2';

    function withBuildId(path) {
        const separator = path.includes('?') ? '&' : '?';
        return `${path}${separator}build=${encodeURIComponent(BUILD_ID)}`;
    }

    const components = {
        '#component-header': 'components/header.html',
        '#component-mobile-menu': 'components/mobile-menu.html',
        '#component-footer': 'components/footer.html'
    };

    const pages = [
        'pages/home.html',
        'pages/artist.html',
        'pages/exhibition.html',
        'pages/works.html',
        'pages/work-single.html',
        'pages/digital.html',
        'pages/digital-workshop.html',
        'pages/digital-animated.html',
        'pages/visit.html',
        'pages/contacts.html'
    ];

    function loadScript(path) {
        return new Promise((resolve) => {
            const script = document.createElement('script');
            script.src = withBuildId(path);
            script.onload = resolve;
            script.onerror = resolve;
            document.body.appendChild(script);
        });
    }

    Promise.all([
        ...Object.entries(components).map(([selector, path]) =>
            fetch(withBuildId(path), { cache: 'no-store' }).then((res) => {
                if (!res.ok) throw new Error(`Failed to load: ${path}`);
                return res.text();
            }).then((html) => {
                const host = document.querySelector(selector);
                if (host) host.innerHTML = html;
            })
        ),
        Promise.all(pages.map((path) =>
            fetch(withBuildId(path), { cache: 'no-store' }).then((res) => {
                if (!res.ok) throw new Error(`Failed to load: ${path}`);
                return res.text();
            })
        )).then((chunks) => {
            const root = document.getElementById('pages-root');
            if (root) root.innerHTML = chunks.join('\n');
        })
    ])
        .then(() =>
            fetch(withBuildId('components/home-teasers.html'), { cache: 'no-store' }).then((res) => {
                if (!res.ok) throw new Error('Failed to load: components/home-teasers.html');
                return res.text();
            })
        )
        .then((teasersHtml) => {
            const teasersHost = document.querySelector('[data-component="home-teasers"]');
            if (teasersHost) teasersHost.innerHTML = teasersHtml;
        })
        .then(() => loadScript('content-sync.js'))
        .then(() => {
            if (window.__contentSyncPromise && typeof window.__contentSyncPromise.then === 'function') {
                return window.__contentSyncPromise.catch((error) => {
                    console.error('Content sync promise error:', error);
                });
            }
            return null;
        })
        .then(() => loadScript('home-selected-works-sync.js'))
        .then(() => loadScript('artist-route-map.js'))
        .then(() => loadScript('app.js'))
        .then(() => loadScript('works-runtime.js'))
        .catch((error) => {
            console.error('Bootstrap error:', error);
        });
})();
