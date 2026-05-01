# 09_SOURCE_JSON

## Назначение

`09_SOURCE_JSON` — контентный слой сайта Александра Львовича Овчинникова.

Его задача — отделить редакторские тексты, повторяющиеся данные и каталожные сведения от HTML-разметки, чтобы сайт мог развиваться как устойчивый цифровой архив художника.

Выставка «Пространство памяти» хранится здесь как один из важных архивных узлов, но не как единственный смысловой контейнер проекта.

---

## Главный принцип

В проекте не должно быть нескольких равноправных источников одного и того же текста или одной и той же каталожной записи.

Правильная логика:

```text
shared/      — общие данные и общие каталожные источники
pages/       — тексты страниц и крупных смысловых модулей
templates/   — шаблоны для страниц произведений и QR-материалов
drafts/      — черновики, не runtime-источник
build/       — производный сборочный файл, не ручной источник
```

---

## Структура

```text
09_SOURCE_JSON/
  README.md
  build_master.mjs

  shared/
    site.json
    works-catalog-1-110.json
    works-image-map.json
    works-runtime-map.json

  pages/
    home.json
    exhibition.json
    about.json
    collection.json
    route.json
    linocut.json
    virtual.json
    memory.json
    visit.json

  templates/
    artTemplate.json
    qrTemplate.json

  drafts/
    ...

  build/
    site_texts_ru_master_v3.json
```

---

## Источник правды

### Для текстов

- `shared/site.json`
- `pages/*.json`
- `templates/*.json`

### Для каталога работ

- `shared/works-catalog-1-110.json` — основные каталожные записи;
- `shared/works-image-map.json` — изображения и миниатюры;
- `shared/works-runtime-map.json` — slug, aliases и runtime-категории.

### Не источник правды

- `drafts/*.json`
- `build/site_texts_ru_master_v3.json`
- старые тексты, оставшиеся в HTML после миграции
- старые каталожные фрагменты в JS

---

## Какой файл за что отвечает

- `pages/home.json` — главная
- `pages/exhibition.json` — выставка
- `pages/about.json` — страница художника
- `pages/collection.json` — коллекция
- `pages/route.json` — маршруты и места
- `pages/linocut.json` — графика и линогравюра
- `pages/virtual.json` — виртуальный зал / мастерская
- `pages/memory.json` — книга памяти
- `pages/visit.json` — посещение

Историческое соответствие:

```text
pages/artist.html  <->  09_SOURCE_JSON/pages/about.json
```

---

## Связь с HTML

HTML отвечает за структуру, сетку, DOM-контейнеры и `data-*` атрибуты для синхронизации.

JSON отвечает за утверждённый текст, повторяющиеся данные, шаблонные блоки и каталожные сведения.

Если страница уже подключена к JSON runtime, текст правится в JSON, а не в HTML.

---

## Каталог работ

Каталог произведений Александра Львовича должен развиваться как структурированный корпус, а не как набор карточек в JavaScript.

Минимальные поля карточки:

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

Не все поля должны быть заполнены сразу. Если сведения требуют проверки, это нужно явно фиксировать.

---

## Разрешённые runtime-категории

```text
north     — Русский Север
city      — Русский город
history   — Историческая тема
interior  — Камерный мир
graphics  — Графика
volga     — Волга и Юг
```

Сетка может быть уточнена позднее, но только после проверки влияния на фильтры, карточки, маршруты и публичные тексты.

---

## Сборка

```bash
node 09_SOURCE_JSON/build_master.mjs
```

Скрипт собирает `shared/site.json`, `pages/*.json` и `templates/*.json` в:

```text
09_SOURCE_JSON/build/site_texts_ru_master_v3.json
```

Этот файл не редактируется вручную.

---

## Проверка

```bash
node scripts/validate-content.mjs
```

Если в корне есть `package.json`:

```bash
npm run check
```

---

## Правила работы

1. Не редактировать `build/site_texts_ru_master_v3.json` вручную.
2. Не подключать `drafts/*.json` напрямую к runtime.
3. Не дублировать один и тот же текст одновременно в page JSON и HTML.
4. Утверждённый редакторский текст переносить в соответствующий `pages/*.json`.
5. Повторяющиеся выставочные данные менять в `shared/site.json`.
6. Данные произведений менять в каталожных JSON, а не в `app.js`.
7. Для slug, alias и runtime-категорий использовать `works-runtime-map.json`.
8. Для изображений использовать `works-image-map.json`, если изображение не записано прямо в карточке работы.
9. Если атрибуция требует проверки, фиксировать это в данных.
10. Сайт Александра Львовича не должен смешивать корпус работ с будущим отдельным архивом Льва Авксентьевича.
