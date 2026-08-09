# jchealy.com

John Healy's portfolio site. Built with [11ty (Eleventy)](https://www.11ty.dev/) and hand-written native CSS — no preprocessor, no bundler.

## Local development

```bash
npm install
npm start
```

Serves at `http://localhost:8080` with live reload.

## Build

```bash
npm run build
```

Outputs to `_site/`.

## Deploy

Pushing to `master` auto-deploys via Netlify (see `netlify.toml`). Contact form submissions go through [Netlify Forms](https://docs.netlify.com/manage/forms/setup/) — check the Forms tab in the Netlify dashboard.

## Structure

- `src/index.njk` — homepage
- `src/projects/*.njk` — project detail pages, ajax-loaded into the homepage's Work section by `src/scripts/main.js`
- `src/_data/projects.json` — drives the Work section's project banners; add/remove a project here plus its matching `src/projects/*.njk` file
- `src/styles/main.css` — all styles, plain CSS (custom properties + native nesting), no build step
- `src/vendor/` — jQuery, GSAP, Snap.svg, sticky-kit, Bootstrap's collapse.js — vendored as static files rather than npm dependencies (see git history on this file for why)
