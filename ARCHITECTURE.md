# ARCHITECTURE

## Назначение

Репозиторий содержит статический сайт Александра Львовича Овчинникова.

Целевая модель: сайт развивается не только как страница выставки, а как официальный цифровой архив художника. Выставка «Пространство памяти» — важный архивный узел 2026 года, но не единственный контейнер проекта.

Краткая формула архитектуры:

```text
HTML — каркас.
CSS — визуальный слой.
JSON — источник текста и каталожных данных.
content-sync.js — мост между JSON и DOM.
works-model.js — единая нормализация каталога работ.
works-runtime.js — runtime-рендер каталога и страниц произведений.
app.js — поведение, роутинг и интерактив.
```

---

## Принцип двух архивов

Проект должен поддерживать две самостоятельные, но связанные платформы:

1. Александр Львович Овчинников.
2. Лев Авксентьевич Овчинников.

Нельзя смешивать биографии, произведения и смысловые центры двух художников. Связь допустима через семейную художественную линию, мастерскую, Ленинград / Петербург, работу с натурой и выставку «Пространство памяти».

---

## Текущая схема загрузки

Сайт работает как статическое приложение с hash-router.

```text
index.html
  -> bootstrap.js
    -> components/*.html
    -> pages/*.html
    -> content-sync.js
      -> 09_SOURCE_JSON/shared/site.json
      -> 09_SOURCE_JSON/pages/*.json
    -> home-selected-works-sync.js
    -> artist-route-map.js
    -> works-model.js
    -> app.js
    -> works-runtime.js
      -> 09_SOURCE_JSON/shared/works-catalog-1-110.json
      -> 09_SOURCE_JSON/shared/works-image-map.json
      -> 09_SOURCE_JSON/shared/works-runtime-map.json
```

`bootstrap.js` загружает HTML-компоненты, страницы, `content-sync.js`, затем остальные runtime-скрипты. `content-sync.js` синхронизирует уже существующие DOM-узлы с JSON. `works-model.js` содержит общую модель работ: slug, категории, техника, размеры, HTML-описание, фильтрация по автору и slug-карта. `works-runtime.js` использует эту модель и отвечает за отображение каталога и отдельных страниц произведений. `app.js` отвечает за поведение, роутинг и интерактив.

---

## Источники правды

### Тексты

```text
09_SOURCE_JSON/shared/site.json
09_SOURCE_JSON/pages/*.json
09_SOURCE_JSON/templates/*.json
```

### Каталог работ

```text
09_SOURCE_JSON/shared/works-catalog-1-110.json
09_SOURCE_JSON/shared/works-image-map.json
09_SOURCE_JSON/shared/works-runtime-map.json
```

### Не источники правды

```text
09_SOURCE_JSON/drafts/*.json
09_SOURCE_JSON/build/site_texts_ru_master_v3.json
старые тексты в pages/*.html после миграции
старые каталожные фрагменты в app.js
```

---

## Правило редактуры

Если страница уже подключена к JSON runtime, текст правится в JSON, а не в HTML.

```text
Главная       -> 09_SOURCE_JSON/pages/home.json
Выставка      -> 09_SOURCE_JSON/pages/exhibition.json
О художнике   -> 09_SOURCE_JSON/pages/about.json
Посещение     -> 09_SOURCE_JSON/pages/visit.json
Общие данные  -> 09_SOURCE_JSON/shared/site.json
```

Если страница ещё не полностью подключена к runtime, сначала нужно выяснить, откуда реально берётся текст: из JSON, HTML, `app.js` или отдельного runtime-скрипта.

---

## Каталог работ

Каталог должен развиваться как структурированный корпус произведений, а не как набор карточек в JS.

Минимальная модель произведения:

```text
id
artist
title
year
place
technique
size
category
sectionSite
image
thumbnail
slug
aliases
descriptionPublic
editorialNote
needsVerification
verificationNote
collection
provenance
exhibitionHistory
publicationHistory
signature
condition
```

Если атрибуция, дата, техника или изображение требуют проверки, это нужно фиксировать явно. Не создавать ложной уверенности.

---

## Текущее архитектурное расхождение

Каталог уже вынесен в JSON и нормализуется через `works-model.js`, а отображается через `works-runtime.js`. В `app.js` ещё остаётся исторический блок каталога. Он временно сохраняется как fallback до отдельного тестируемого PR, потому что связан с hash-router и активацией страниц.

Следующий технический шаг — аккуратно снять старый блок работ из `app.js` после проверки работы маршрутов:

```text
#/works
#/works/:slug
```

`content-sync.js` уже содержит путь к `pages/route.json`, но полноценная синхронизация маршрутов ещё должна быть доведена отдельно.

---

## Проверка перед merge

```bash
node 09_SOURCE_JSON/build_master.mjs
node scripts/validate-content.mjs
```

Если есть `package.json`:

```bash
npm run check
```

Проверка должна отслеживать валидность JSON, обязательные файлы, отсутствие runtime-ссылок на `drafts/`, дубли id и slug, неизвестные категории, отсутствующие изображения и подозрительные внутренние маршруты.

---

## Эволюционный план

1. Стабилизировать JSON-first правила.
2. Добавить проверку контента.
3. Перестать расширять каталог через `app.js`.
4. Убрать дублирование между `app.js` и `works-runtime.js`.
5. Расширить модель: маршруты, периоды, темы, места, выставки, публикации, музейные пакеты.
6. При росте архива рассмотреть Astro или Eleventy как SSG, используя уже подготовленный JSON-слой.

---

## Минимальный чек

- [ ] Текст правится в JSON, если страница подключена к JSON runtime.
- [ ] `drafts/` не подключён к runtime.
- [ ] Повторяющиеся данные не дублируются вручную.
- [ ] `content-sync.js` соответствует реальному DOM.
- [ ] Каталог работ правится в `09_SOURCE_JSON/shared/*.json`, а не в `app.js`.
- [ ] Для спорной атрибуции не создаётся ложная уверенность.
- [ ] Александр Львович и Лев Авксентьевич не смешиваются в одном смысловом центре.
