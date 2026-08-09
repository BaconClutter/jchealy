# jchealy.com: Migrate to 11ty + native CSS

## Context

jchealy.com is a personal portfolio site (John Healy — UX/UI/Interaction Design) originally scaffolded via Yeoman in ~2014, built with Grunt, Bower, Sass (via `node-sass`/`grunt-sass`), and Bootstrap-sass. Earlier in this session, getting the existing toolchain running locally required fixing several dead/incompatible pieces:

- `node-sass` (deprecated, no Apple Silicon build) — replaced with Dart Sass
- `grunt-contrib-connect` 0.8.0's static server crashed on modern Node (`res._headers` no longer works the way it used to) — bumped to 5.x
- `grunt-wiredep` silently regenerated hand-curated `<script>` includes on every `grunt serve`/`grunt build`, once actually breaking the live scroll animation (dropped `ScrollToPlugin`) — disabled wiredep management for that block
- `grunt-contrib-imagemin` is still broken (same native-binary problem as node-sass) — never fixed, motivates the image-handling decision below

Given how much of this session went to un-rotting 2014-era tooling, and that the owner wants to "easily update and push the site going forward," the decision is to re-platform rather than keep patching. This spec covers **only** the re-platform: same visual design, same JS behavior, new build tooling and CSS approach, new deploy path. A follow-up task (out of scope here) will add a Validic project section and remove the Helios Towers Africa project.

## Goals

- Replace Grunt + Bower + Sass + Bootstrap-sass with **11ty (Eleventy)** + **hand-written native CSS** (custom properties, native nesting, no preprocessor).
- Fix image optimization (currently broken) using `@11ty/eleventy-img`.
- Wire up **Netlify** so pushing to `master` deploys automatically — replacing the current manual-upload deploy process.
- Preserve the current site **pixel-for-pixel** and **behaviorally identical** — this is a tooling migration, not a redesign.

## Non-goals (explicitly out of scope)

- No visual or layout redesign. The live site at jchealy.com is the source of truth for correctness.
- No JS modernization. jQuery, GSAP (TweenMax + ScrollToPlugin), Snap.svg, sticky-kit, and Bootstrap's `collapse.js` all carry over unchanged, loaded as plain `<script>` tags exactly as today.
- No content changes. Same 4 projects (ReverbNation, Hill-Rom, TowerCo, Helios Towers Africa), same copy, same images. Adding Validic and removing Helios is a separate follow-up task after this migration ships and is verified.
- No test suite. The existing `test/` directory (2014-era Mocha/Chai/PhantomJS) is dropped, not ported — it's already disconnected from anything meaningful for a static content site.

## Architecture

```
src/
  _data/
    projects.json        # {id, title, subtitle, image, bannerClass} per project — drives both
                          # the homepage banners AND generates the matching detail pages
  _includes/
    layouts/
      base.njk            # <head>, header/nav (About/Work/Contact), footer, script tags
  index.njk                # homepage: header, About, Work (loops projects.json for banners), Contact
  projects/
    artist-profile.njk     # -> /projectArtistProfile.html
    hillrom.njk             # -> /projectHillRom.html
    towerco.njk             # -> /projectSSA.html
    helios.njk              # -> /projectHTA.html
  styles/
    main.css               # hand-written native CSS, no compiler, shipped as-is
  scripts/
    main.js, mail.js, custom-svg.js, button-svg.js   # copied through unchanged
  vendor/
    jquery, gsap (TweenMax + ScrollToPlugin), snap.svg, sticky-kit,
    bootstrap collapse.js                             # vendored via npm packages where available,
                                                        # copied to output via passthrough, no bundler
  images/                  # source images, processed by @11ty/eleventy-img at build time
.eleventy.js                # config: passthrough copies, image shortcode, explicit permalinks
netlify.toml                 # build command + publish dir
package.json                 # @11ty/eleventy + @11ty/eleventy-img only — no grunt/bower/sass/imagemin
```

### Key decisions

**Exact URL preservation.** Detail pages keep their current flat URLs (`/projectHillRom.html`, not a pretty `/projects/hillrom/`) because `main.js`'s jQuery `.load()` calls target those filenames directly:

```js
$('#' + clickedId + 'Return').load(clickedId + '.html #' + clickedId + 'Inner', ...)
```

Changing the URL scheme would require touching JS we've explicitly decided to leave alone. 11ty permalinks are set explicitly per template to match.

**Data-driven project banners.** Today, adding a project means hand-editing HTML in three separate places (the homepage banner markup, plus keeping the detail-page filename/ID convention in sync). Pulling banner metadata into `_data/projects.json` means the follow-up Validic/Helios task is a JSON edit plus one new template file, not a multi-file HTML surgery. This is the main structural improvement this migration buys, beyond just "unbreaks npm install."

**Vendor JS via npm, not bower.** `jquery`, `gsap` (includes ScrollToPlugin), `snap.svg`, and `sticky-kit` are all available as npm packages. They're copied to the output directory via 11ty passthrough copy and loaded as plain `<script>` tags — no bundler, no ESM conversion, matching today's loading model exactly. Bootstrap's `collapse.js` (the one Bootstrap file actually used, for the mobile nav toggle) is vendored directly since pulling in the whole `bootstrap` npm package for one file isn't worth it.

## CSS approach

Auditing actual Bootstrap usage in `main.scss` shows the site depends on: the grid mixins (`make-row`, `make-sm-column`, `make-sm-column-offset`, etc.), the handful of `.collapse`/`.navbar-toggle`/`.navbar-collapse` rules that `collapse.js`'s JS behavior requires to function, and base resets. That's a small fraction of Bootstrap — buttons, forms, modals, alerts, glyphicons, and most of the rest are unused dead weight today.

Migration rules:

- **Sass `$variables` → CSS custom properties.** `:root { --dark-blue: #0D1316; --bright-red: #DC4601; ... }`, direct mechanical conversion of every variable in `main.scss`.
- **Sass nesting → native CSS nesting.** Supported in all evergreen browsers (Chrome/Firefox/Safari) as of this migration; no compiler needed.
- **Bootstrap grid mixins → purpose-built CSS Grid/Flexbox per component.** Rather than porting a generic 12-column mixin system, each section (`.about-inner-container`, `.work-inner-container`, `.text-holder-offset`, etc.) gets a direct Grid/Flexbox layout matching its actual current rendered output. Less code than reproducing the mixin system, and more in the spirit of "modern native CSS."
- **Collapse/navbar-toggle CSS** — hand-written natively (a handful of declarations: `.collapse`, `.collapse.in`, `.collapsing` transition rules), not the full Bootstrap navbar component.
- **`@extend` → explicit shared classes or duplicated declarations.** Native CSS has no equivalent to Sass `@extend`. Notably, this is the exact mechanism that caused the full-width Work-section bug fixed earlier in this session (an `@extend` that silently stopped applying at certain breakpoints under Dart Sass's spec-compliant extend resolution). Making these relationships explicit in the ported CSS removes that entire class of bug going forward.
- **Known limitation, not a regression:** CSS custom properties cannot be used inside `@media` query conditions (only in declaration values), so breakpoint numbers (currently `$screen-xs-min`, `$screen-sm-min` Sass variables) become literal numbers repeated across `@media` rules in the native CSS. This matches what Sass compiled to anyway — the difference is the source no longer centralizes the value in one variable.
- No PostCSS, no CSS build step. `main.css` ships as written, verbatim.

## Images

`@11ty/eleventy-img` processes everything in `src/images/` at build time: generates optimized/resized variants plus WebP, referenced via an 11ty shortcode in templates. This replaces the currently-broken `grunt-contrib-imagemin` step. Unlike the Grunt plugin, `eleventy-img` is pure JS (no native binary dependency), so it doesn't carry the same rot risk that `node-sass` and `grunt-contrib-imagemin` both hit.

## Deploy

- `netlify.toml`: build command `npx @11ty/eleventy`, publish directory `_site`.
- Connect the GitHub repo in Netlify's dashboard — every push to `master` auto-deploys from then on.
- Pointing the `jchealy.com` domain at Netlify is a one-time manual DNS step outside the repo, done once the new build is verified and ready to go live.

## Migration strategy

Done in a feature branch in the current repo (not a separate repo, to preserve git history). The new 11ty site is built alongside the existing Grunt setup without touching it. Verification is side-by-side against both the current `localhost:9000` Grunt dev server and the live jchealy.com site — pixel-for-pixel and behaviorally (project open/close animations, mobile nav, scroll animations, contact form). Old Grunt/Bower/Sass tooling is only deleted once the new build is verified equivalent; nothing is removed before its replacement is proven working.

## Follow-up (separate task, not covered by this spec)

Once this migration ships and is verified live:
- Add a new Validic project section (banner + detail page)
- Remove the Helios Towers Africa project (banner + detail page)
- Fix the contact form's error path. `mail.js`'s `.fail()` handler still does `$formMessages.text(data.responseText)`, which was written against `sender.php`'s short human-readable error strings. Netlify Forms returns its own error page instead, so a rejected submission (spam-filtered, malformed) would dump a wall of raw markup into the error div. It renders as inert text rather than executing, so this is a UX problem and not a security one. The fix mirrors what the migration already did for the success path: show a fixed friendly string. Deliberately left out of the migration, which scoped `mail.js` to a single change.

Both become straightforward with the `projects.json`-driven structure this migration establishes.
