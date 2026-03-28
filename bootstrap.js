(function bootstrapApp() {
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
        'pages/visit.html'
    ];

    function fetchText(path) {
        return fetch(path).then((res) => {
            if (!res.ok) throw new Error(`Failed to load: ${path}`);
            return res.text();
        });
    }

    Promise.all([
        ...Object.entries(components).map(([selector, path]) =>
            fetchText(path).then((html) => {
                const host = document.querySelector(selector);
                if (host) host.innerHTML = html;
            })
        ),
        Promise.all(pages.map((path) => fetchText(path))).then((chunks) => {
            const root = document.getElementById('pages-root');
            if (root) root.innerHTML = chunks.join('\n');
        })
    ])
        .then(() => fetchText('components/home-teasers.html'))
        .then((teasersHtml) => {
            const teasersHost = document.querySelector('[data-component="home-teasers"]');
            if (teasersHost) teasersHost.innerHTML = teasersHtml;
        })
        .then(() => {
            const appScript = document.createElement('script');
            appScript.src = 'app.js';
            document.body.appendChild(appScript);
        })
        .catch((error) => {
            console.error('Bootstrap error:', error);
        });
})();
