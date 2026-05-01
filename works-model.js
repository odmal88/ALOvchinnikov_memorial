(function initWorksModel(global) {
    const categoryLabels = {
        north: 'Русский Север',
        city: 'Русский город',
        history: 'Историческая тема',
        interior: 'Камерный мир',
        volga: 'Волга и Юг',
        graphics: 'Графика'
    };

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
        if (combined.includes('линограв') || combined.includes('гравюр') || combined.includes('линорит')) technique = 'Линогравюра';
        else if (lower.includes('х/м')) technique = 'Холст, масло';
        else if (lower.includes('к/м')) technique = 'Картон, масло';
        else if (lower.includes('б/см') || lower.includes('б., см.т.') || lower.includes('смеш')) technique = 'Бумага, смешанная техника';
        else if (lower.includes('бум')) technique = 'Бумага';
        const sizeMatch = raw.match(/(\d+\s*[xх×]\s*\d+(?:\s*[xх×]\s*\d+)?)/i);
        const size = sizeMatch ? sizeMatch[1].replace(/[xх]/gi, '×').replace(/\s+/g, ' ').trim() + ' см' : '—';
        return { technique, size };
    }

    function inferCategory(record) {
        const haystack = [record.title, record.place, record.sectionSite, record.editorialNote, record.descriptionPublic]
            .filter(Boolean).join(' ').toLowerCase();
        const has = (pattern) => pattern.test(haystack);
        if (has(/пугач|варяг|викинг|монастыр|истор|эпос|покров|часовн|крест|церк/)) return 'history';
        if (has(/интерьер|изб|дом|сени|баня|натюрморт|портрет|утвар|мастерск|семь|хозяй|купан/)) return 'interior';
        if (has(/гравюр|линограв|график|линорит/)) return 'graphics';
        if (has(/волг|волж|горьк|нижегор|немд|васильсур|городец|балахн|сормов|щёлоков|ай-петр|ялт|алупк|симфероп|крым|швейцар/)) return 'volga';
        if (has(/ленинград|петербург|хельсинк|стокгольм|городск|кремл|мост|набереж|сад|улиц|архитектур/)) return 'city';
        if (has(/север|белом|арханг|веркол|мезен|помор|лапланд|тайг|онеж|тундр|олень|каюр|финлянд/)) return 'north';
        return '';
    }

    function isPrimaryCatalogRecord(record) {
        const author = String(record.author || '').trim().toLowerCase();
        if (!author) return true;
        return author.includes('александр') && author.includes('овчинников');
    }

    function buildDescriptionHtml(record) {
        const descriptionPublic = String(record.descriptionPublic || '').trim();
        if (descriptionPublic && descriptionPublic !== '—') return `<p>${escapeHtml(descriptionPublic)}</p>`;
        const editorialNote = String(record.editorialNote || '').trim();
        if (editorialNote && editorialNote !== '—') return `<p>${escapeHtml(editorialNote)}</p>`;
        return '<p>Аннотация к произведению будет добавлена позднее.</p>';
    }

    function normalizeWork(record, imageMap, runtimeMap, usedSlugs) {
        const imageMeta = imageMap[String(record.id)] || {};
        const runtimeEntry = runtimeMap && runtimeMap.works ? runtimeMap.works[String(record.id)] || {} : {};
        const parsed = parseSizeAndTechnique(record.size, record.title, record.editorialNote);
        const slug = makeUniqueSlug(runtimeEntry.slug || record.slug, record.title, record.id, usedSlugs);
        const category = categoryLabels[runtimeEntry.category] ? runtimeEntry.category : inferCategory(record);
        const aliases = Array.isArray(runtimeEntry.aliases)
            ? Array.from(new Set(runtimeEntry.aliases.map((alias) => slugifyRu(alias)).filter(Boolean).filter((alias) => alias !== slug)))
            : [];
        return {
            id: Number(record.id) || 0,
            slug,
            aliases,
            title: record.title || `Работа ${record.id}`,
            author: String(record.author || '').trim() || 'Александр Львович Овчинников',
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
            missingImage: Boolean(record.missingImage || imageMeta.missingImage),
            image: record.image || imageMeta.image || '',
            thumbnail: record.thumbnail || imageMeta.thumbnail || record.image || imageMeta.image || '',
            needsVerification: Boolean(record.needsVerification),
            descriptionHtml: buildDescriptionHtml(record)
        };
    }

    function normalizeCatalog(catalog, imageMap = {}, runtimeMap = {}) {
        const usedSlugs = new Set();
        return Array.isArray(catalog)
            ? catalog.filter(isPrimaryCatalogRecord).map((record) => normalizeWork(record, imageMap, runtimeMap, usedSlugs))
            : [];
    }

    function buildSlugMap(works) {
        const map = new Map();
        works.forEach((work) => {
            map.set(work.slug, work);
            (work.aliases || []).forEach((alias) => {
                if (!map.has(alias)) map.set(alias, work);
            });
        });
        return map;
    }

    global.OvchinnikovWorksModel = {
        categoryLabels,
        escapeHtml,
        slugifyRu,
        parseSizeAndTechnique,
        inferCategory,
        isPrimaryCatalogRecord,
        buildDescriptionHtml,
        normalizeWork,
        normalizeCatalog,
        buildSlugMap
    };
})(window);
