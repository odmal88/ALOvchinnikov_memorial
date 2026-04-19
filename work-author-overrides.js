(function initWorkAuthorOverrides() {
    const TARGET_PATH = '/works/natyurmort-s-ikonoy-i-podsvechnikom';
    const TARGET_AUTHOR = 'Лев Овчинников';

    function getHashPath() {
        const hash = window.location.hash;
        return hash && hash.length > 1 ? hash.slice(1) : '/';
    }

    function applyAuthorOverride() {
        if (getHashPath() !== TARGET_PATH) return;

        const authorEl = document.getElementById('workAuthor');
        if (authorEl && authorEl.textContent !== TARGET_AUTHOR) {
            authorEl.textContent = TARGET_AUTHOR;
        }
    }

    window.addEventListener('hashchange', () => {
        requestAnimationFrame(applyAuthorOverride);
    });

    document.addEventListener('DOMContentLoaded', applyAuthorOverride);
    window.addEventListener('load', applyAuthorOverride);

    const observer = new MutationObserver(() => {
        applyAuthorOverride();
    });

    const startObserver = () => {
        if (!document.body) {
            requestAnimationFrame(startObserver);
            return;
        }

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        applyAuthorOverride();
    };

    startObserver();
})();
