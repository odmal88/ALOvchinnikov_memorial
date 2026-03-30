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
    // WORKS DATABASE
    // ══════════════════════════════════════════════
    const worksDB = [
        {
            slug: 'severniy-peyzazh',
            title: 'Северный пейзаж',
            year: '1998',
            technique: 'Холст, масло',
            size: '80 x 120 см',
            collection: 'Собрание семьи художника',
            category: 'north',
            icon: 'fa-palette',
            description: 'Одна из центральных работ северного цикла. Панорамный пейзаж с деревянной церковью на фоне бескрайнего северного неба. Работа написана по натурным этюдам, выполненным в экспедиции по Архангельской области.',
            hasAnimated: true
        },
        {
            slug: 'vecherniy-svet-vologda',
            title: 'Вечерний свет. Вологда',
            year: '2005',
            technique: 'Холст, масло',
            size: '60 x 90 см',
            collection: 'Собрание семьи художника',
            category: 'city',
            icon: 'fa-palette',
            description: 'Городской пейзаж, запечатлевший Вологду в вечернем свете. Тёплые тона заката на фасадах старинных зданий, длинные тени, тишина провинциального вечера.',
            hasAnimated: true
        },
        {
            slug: 'zimniy-den-v-peterburge',
            title: 'Зимний день в Петербурге',
            year: '2010',
            technique: 'Картон, масло',
            size: '50 x 70 см',
            collection: 'Собрание семьи художника',
            category: 'city',
            icon: 'fa-pen-nib',
            description: 'Камерный городской пейзаж. Петербург зимой — приглушённый свет, снег на крышах, графика голых деревьев на фоне классических фасадов.'
        },
        {
            slug: 'nizhegorodskie-dali',
            title: 'Нижегородские дали',
            year: '2012',
            technique: 'Холст, масло',
            size: '70 x 100 см',
            collection: 'Собрание семьи художника',
            category: 'volga',
            icon: 'fa-palette',
            description: 'Волжский пейзаж с высокого берега. Бескрайние дали, изгиб реки, далёкие деревни. Работа из волжского цикла, написанная в окрестностях Нижнего Новгорода.'
        },
        {
            slug: 'derevyannaya-tserkov',
            title: 'Деревянная церковь',
            year: '2001',
            technique: 'Холст, масло',
            size: '90 x 70 см',
            collection: 'Собрание семьи художника',
            category: 'north',
            icon: 'fa-palette',
            description: 'Деревянная церковь Русского Севера — один из ключевых мотивов творчества Овчинникова. Архитектура как воплощение народной памяти и духовного пространства.',
            hasAnimated: true
        },
        {
            slug: 'masterskaya-utro',
            title: 'Мастерская. Утро',
            year: '2014',
            technique: 'Холст, масло',
            size: '50 x 60 см',
            collection: 'Собрание семьи художника',
            category: 'interior',
            icon: 'fa-palette',
            description: 'Камерный интерьер мастерской в утреннем свете. Мольберт, кисти, незавершённый холст — тихое пространство творческой работы.'
        },
        {
            slug: 'severnaya-derevnya-gravyura',
            title: 'Северная деревня',
            year: '2003',
            technique: 'Линогравюра',
            size: '30 x 40 см',
            collection: 'Собрание семьи художника',
            category: 'graphics',
            icon: 'fa-pen-nib',
            description: 'Графическая работа из северного цикла. Линогравюра, в которой архитектурный мотив северной деревни решён средствами чёрно-белой графики.'
        },
        {
            slug: 'istoricheskiy-motiv',
            title: 'Исторический мотив',
            year: '2008',
            technique: 'Холст, масло',
            size: '100 x 80 см',
            collection: 'Собрание семьи художника',
            category: 'history',
            icon: 'fa-palette',
            description: 'Работа из исторического цикла. Осмысление национальной истории через живописный образ — архитектура, пейзаж, историческая память.'
        },
        {
            slug: 'vasilsursk',
            title: 'Васильсурск',
            year: '2007',
            technique: 'Холст, масло',
            size: '60 x 80 см',
            collection: 'Собрание семьи художника',
            category: 'volga',
            icon: 'fa-palette',
            description: 'Волжский пейзаж. Васильсурск — место на слиянии Волги и Суры, привлекавшее многих русских художников. Овчинников продолжает эту традицию, находя в волжском пространстве собственную интонацию.',
            hasAnimated: true
        }
    ];

    const categoryLabels = {
        north: 'Русский Север',
        city: 'Русский город',
        history: 'Историческая тема',
        interior: 'Камерный мир',
        volga: 'Волга и Юг',
        graphics: 'Графика'
    };

    const routeMap = {
        '/': 'page-home',
        '/artist': 'page-artist',
        '/exhibition': 'page-exhibition',
        '/works': 'page-works',
        '/digital': 'page-digital',
        '/digital/workshop': 'page-workshop',
        '/digital/animated': 'page-animated',
        '/visit': 'page-visit'
    };

    const pageTitles = {
        '/': 'Пространство памяти — Мемориальная выставка А.Л. Овчинникова',
        '/artist': 'Художник — Пространство памяти',
        '/exhibition': 'Выставка — Пространство памяти',
        '/works': 'Работы — Пространство памяти',
        '/digital': 'Цифровое пространство — Пространство памяти',
        '/digital/workshop': '3D-мастерская — Пространство памяти',
        '/digital/animated': 'Ожившие полотна — Пространство памяти',
        '/visit': 'Посещение — Пространство памяти'
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

    function getWorkTitle(slug) {
        const work = worksDB.find((w) => w.slug === slug);
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
        if (!activePage) return;

        if (!revealObserver) return;
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
    function createRelatedCard(work) {
        const card = document.createElement('a');
        card.className = 'work-card';
        card.href = '#/works/' + work.slug;
        card.setAttribute('data-route', '/works/' + work.slug);
        card.style.textDecoration = 'none';
        card.dataset.category = work.category;
        card.innerHTML = `
            <div class="work-image">
                <div class="work-image-inner">
                    <span class="artwork-label">${categoryLabels[work.category] || ''}</span>
                </div>
            </div>
            <h4 style="color: var(--deep-blue);">${work.title}</h4>
            <span class="work-meta" style="color: var(--text-muted);">${work.year} · ${work.size}</span>
        `;
        return card;
    }

    function showWorkPage(slug) {
        const work = worksDB.find((w) => w.slug === slug);

        if (!work) {
            navigateTo('/works', true);
            return false;
        }

        const idx = worksDB.findIndex((w) => w.slug === slug);
        const prev = idx > 0 ? worksDB[idx - 1] : null;
        const next = idx < worksDB.length - 1 ? worksDB[idx + 1] : null;
        const sectionLabel = categoryLabels[work.category] || '';

        document.getElementById('workHeroCategory').textContent = sectionLabel;
        document.getElementById('workHeroTitle').innerHTML = emphasizeLastWord(work.title);
        document.getElementById('workHeroMeta').textContent = `${work.year} · ${work.technique}`;

        document.getElementById('workBreadcrumbTitle').textContent = work.title;
        document.getElementById('workTitle').textContent = work.title;
        document.getElementById('workAuthor').textContent = 'Александр Львович Овчинников';
        document.getElementById('workYear').textContent = work.year;
        document.getElementById('workTechnique').textContent = work.technique;
        document.getElementById('workSize').textContent = work.size;
        document.getElementById('workSection').textContent = sectionLabel;
        document.getElementById('workCollection').textContent = work.collection;
        document.getElementById('workDescription').textContent = work.description;

        const workSingleImage = document.querySelector('.work-single-image');
        if (workSingleImage) workSingleImage.dataset.category = work.category;

        const iconEl = document.getElementById('workSingleIcon');
        iconEl.className = `fa-solid ${work.icon}`;

        const linksEl = document.getElementById('workLinks');
        linksEl.innerHTML = '';

        if (work.hasAnimated) {
            const animatedLink = document.createElement('a');
            animatedLink.href = '#/digital/animated';
            animatedLink.className = 'btn btn-burgundy';
            animatedLink.innerHTML = '<i class="fa-solid fa-play" style="color: inherit;"></i> Анимированная версия';
            animatedLink.addEventListener('click', (e) => {
                e.preventDefault();
                navigateTo('/digital/animated');
            });
            linksEl.appendChild(animatedLink);
        }

        const allWorksLink = document.createElement('a');
        allWorksLink.href = '#/works';
        allWorksLink.className = 'btn btn-light';
        allWorksLink.innerHTML = '<i class="fa-solid fa-grid-2" style="color: inherit;"></i> Вся коллекция';
        allWorksLink.addEventListener('click', (e) => {
            e.preventDefault();
            navigateTo('/works');
        });
        linksEl.appendChild(allWorksLink);

        const prevEl = document.getElementById('workPrev');
        const nextEl = document.getElementById('workNext');

        if (prev) {
            prevEl.style.visibility = 'visible';
            prevEl.href = '#/works/' + prev.slug;
            prevEl.onclick = (e) => {
                e.preventDefault();
                navigateTo('/works/' + prev.slug);
            };
            prevEl.innerHTML = `<i class="fa-solid fa-arrow-left" style="color: inherit;"></i> ${prev.title}`;
        } else {
            prevEl.style.visibility = 'hidden';
            prevEl.removeAttribute('href');
            prevEl.onclick = null;
        }

        if (next) {
            nextEl.style.visibility = 'visible';
            nextEl.href = '#/works/' + next.slug;
            nextEl.onclick = (e) => {
                e.preventDefault();
                navigateTo('/works/' + next.slug);
            };
            nextEl.innerHTML = `${next.title} <i class="fa-solid fa-arrow-right" style="color: inherit;"></i>`;
        } else {
            nextEl.style.visibility = 'hidden';
            nextEl.removeAttribute('href');
            nextEl.onclick = null;
        }

        const relatedContainer = document.getElementById('workRelated');
        relatedContainer.innerHTML = '';

        let related = worksDB.filter((w) => w.category === work.category && w.slug !== work.slug).slice(0, 3);
        if (related.length === 0) {
            related = worksDB.filter((w) => w.slug !== work.slug).slice(0, 3);
        }

        related.forEach((relatedWork) => {
            relatedContainer.appendChild(createRelatedCard(relatedWork));
        });

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

        loaderEl.classList.remove('hidden');
        errorEl.classList.remove('visible');
        hintEl.style.opacity = '1';
        progressBar.style.width = '0%';

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

                loaderEl.classList.add('hidden');
                workshopLoading = false;
                workshopInitialized = true;

                const hideHintOnce = () => {
                    setTimeout(() => {
                        hintEl.style.opacity = '0';
                    }, 3000);
                    workshopControls.removeEventListener('start', hideHintOnce);
                };
                workshopControls.addEventListener('start', hideHintOnce);

                if (getHashPath() === '/digital/workshop') {
                    startWorkshopLoop();
                }
            },
            (xhr) => {
                if (xhr.total > 0) {
                    const percent = Math.round((xhr.loaded / xhr.total) * 100);
                    progressBar.style.width = percent + '%';
                }
            },
            (error) => {
                console.error('GLB load error:', error);
                workshopLoading = false;
                workshopInitialized = false;
                loaderEl.classList.add('hidden');
                errorEl.classList.add('visible');
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
        navigateTo(getHashPath(), false);
    });

    // ══════════════════════════════════════════════
    // WORKS FILTERS
    // ══════════════════════════════════════════════
    document.addEventListener('click', (e) => {
        const btn = e.target.closest('.filter-btn');
        if (!btn) return;

        const filter = btn.getAttribute('data-filter');
        document.querySelectorAll('.filter-btn').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');

        document.querySelectorAll('#page-works .catalog-card').forEach((card) => {
            const category = card.getAttribute('data-category');
            card.style.display = (filter === 'all' || category === filter) ? '' : 'none';
        });
    });

    // ══════════════════════════════════════════════
    // INIT
    // ══════════════════════════════════════════════
    (function initApp() {
        normalizeRouteLinks();
        navigateTo(getHashPath(), false);
    })();
