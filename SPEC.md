You are implementing a real V1 website for the exhibition “Овчинников А. Л.” inside this repository.

Goal:
Create a calm, elegant, museum-style, Russian-language exhibition site that is responsive, maintainable, content-driven, and ready for future expansion.

Rules:
- First inspect the repository and preserve the existing stack if it is reasonable.
- If the repo is empty or not viable, scaffold with Next.js + TypeScript + Tailwind CSS.
- Do not invent factual information.
- If content is missing, use explicit placeholders like [УКАЖИТЕ ДАТЫ ВЫСТАВКИ] and TODO markers.
- Keep content editable through dedicated files, not hardcoded in components.
- Focus on mobile responsiveness, accessibility, semantic HTML, and performance.
- Use restrained visual design with generous whitespace and subtle motion only.
- Avoid unnecessary dependencies.

Implement these pages:
- /
- /artist
- /works
- /works/[slug]
- /visit
- /contacts

Content structure:
- /content/site.json
- /content/artist.md
- /content/visit.md
- /content/works/*.md

Each work item should support:
- title
- slug
- year
- series
- medium
- dimensions
- image
- alt
- excerpt
- body
- featured

Homepage should include:
- hero section
- exhibition summary
- dates and venue
- featured works
- short artist section
- visit info
- footer contacts

Artist page:
- biography
- artistic method/themes
- timeline or selected milestones if data exists

Works page:
- clean grid of artworks
- optional filters only if enough data exists

Work detail page:
- large image
- metadata
- description
- related works if possible

Visit page:
- dates
- address
- opening hours
- ticket/admission info
- map placeholder

Contacts page:
- venue
- organizer
- email
- phone
- social links if available

Technical requirements:
- reusable components
- metadata per page
- sitemap
- robots.txt
- favicon placeholder
- image optimization
- buildable production-ready code
- README with setup and content editing instructions

Execution:
1. Inspect repo and summarize approach.
2. Implement V1.
3. Run build/lint checks if available.
4. Fix issues.
5. Return summary, changed files, commands run, and missing data TODOs.
