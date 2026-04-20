(function () {
    const TARGET = {
        id: 2,
        slug: 'staryy-dvor',
        image: 'assets/works/full/002.jpg',
        thumbnail: 'assets/works/thumbs/002.jpg'
    };

    let lastAppliedHash = '';

    function patchWorkRecord() {
        if (typeof worksDB === 'undefined' || !Array.isArray(worksDB) || worksDB.length === 0) {
            return false;
        }

        const work = worksDB.find((item) => item && (item.id === TARGET.id || item.slug === TARGET.slug));
        if (!work) {
            return false;
        }

        work.missingImage = false;
        work.image = TARGET.image;
        work.thumbnail = TARGET.thumbnail;
        return true;
    }

    function refreshVisibleState() {
        const hash = window.location.hash || '#/';

        if (hash === '#/works/' + TARGET.slug && typeof showWorkPage === 'function') {
            showWorkPage(TARGET.slug);
            lastAppliedHash = hash;
            return true;
        }

        if (hash === '#/works' && typeof renderWorksCatalog === 'function') {
            renderWorksCatalog();
            lastAppliedHash = hash;
            return true;
        }

        return false;
    }

    function applyOverride() {
        if (!patchWorkRecord()) {
            return false;
        }

        refreshVisibleState();
        return true;
    }

    function scheduleApply() {
        setTimeout(applyOverride, 0);
        setTimeout(applyOverride, 120);
        setTimeout(applyOverride, 400);
    }

    let attempts = 0;
    const timer = setInterval(() => {
        attempts += 1;
        const applied = applyOverride();
        if (applied || attempts > 120) {
            clearInterval(timer);
        }
    }, 250);

    window.addEventListener('hashchange', scheduleApply);
    window.addEventListener('load', scheduleApply);
    document.addEventListener('DOMContentLoaded', scheduleApply);

    const observer = new MutationObserver(() => {
        const hash = window.location.hash || '#/';
        if (hash.indexOf(TARGET.slug) !== -1 || hash === '#/works') {
            applyOverride();
        }
    });

    if (document.documentElement) {
        observer.observe(document.documentElement, { childList: true, subtree: true });
    }
})();
