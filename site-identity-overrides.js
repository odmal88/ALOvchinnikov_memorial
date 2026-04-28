(function initSiteIdentityOverrides() {
    var FOOTER_TITLE = 'Александр Л. Овчинников';
    var FOOTER_SUBTITLE = 'Официальный цифровой архив художника';
    var FOOTER_LINES = [
        'Живопись · графика · линогравюра',
        'Официальный цифровой архив наследия художника',
        'Архив выставки «Пространство памяти», 2026'
    ];

    function setTextIfChanged(node, value) {
        if (!node || node.textContent === value) return;
        node.textContent = value;
    }

    function setHtmlIfChanged(node, value) {
        if (!node || node.innerHTML === value) return;
        node.innerHTML = value;
    }

    function applyFooterIdentity() {
        var footer = document.getElementById('siteFooter');
        if (!footer) return;

        setTextIfChanged(footer.querySelector('.footer-brand h3'), FOOTER_TITLE);
        setTextIfChanged(footer.querySelector('.footer-brand-sub'), FOOTER_SUBTITLE);
        setHtmlIfChanged(footer.querySelector('.footer-brand p'), FOOTER_LINES.join('<br>'));
    }

    function applyAll() {
        applyFooterIdentity();
    }

    document.addEventListener('DOMContentLoaded', applyAll);
    window.addEventListener('load', applyAll);

    var observer = new MutationObserver(applyAll);

    function startObserver() {
        if (!document.body) {
            requestAnimationFrame(startObserver);
            return;
        }

        observer.observe(document.body, {
            childList: true,
            subtree: true,
            characterData: true
        });

        applyAll();
    }

    startObserver();
})();
