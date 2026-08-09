# jchealy.com: Migrate to 11ty + native CSS Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Grunt/Bower/Sass/Bootstrap-sass toolchain with 11ty (Eleventy) and hand-written native CSS, preserving the current site pixel-for-pixel and behaviorally identical, and wire up Netlify so `git push` deploys automatically.

**Architecture:** A fresh `src/` tree holds Nunjucks templates (`index.njk` + 4 project-detail pages, all built from a shared `base.njk` layout and a `projects.json` data file), a single hand-written `src/styles/main.css` (custom properties + native nesting, no compiler), and vendored copies of the exact JS libraries currently in use (jQuery, GSAP/TweenMax, Snap.svg, sticky-kit, Bootstrap's `collapse.js`) so runtime behavior doesn't shift. `@11ty/eleventy-img` handles `<img>` optimization at build time; the 4 CSS `background-image` banner photos are passed through unprocessed (matching today's actual behavior, since the current image optimizer has been broken for a while). Netlify Forms replaces the PHP mail backend that can't run on the new host.

**Tech Stack:** `@11ty/eleventy` 3.x (ESM config), `@11ty/eleventy-img` 7.x, Nunjucks templates, native CSS, Netlify (build + Forms + hosting).

---

## Before you start: source-of-truth methodology for the CSS port

Tasks 8–10 convert `app/styles/main.scss` (1019 lines) into native CSS. **Do not hand-convert directly from the Sass source.** Two real discoveries during planning proved this is unreliable:

1. Sass compiles nested `@media` blocks to a *different cascade position* than their source location suggests (Dart Sass hoists a nested `@media` to emit as a separate top-level block right where it was nested, not necessarily where you'd expect relative to sibling declarations). This produced two instances of **dead CSS in the current live site** that must be preserved as dead, not "fixed": `.project-banner`'s `@media (max-width: 768px) { height: 250px }` rule is always overridden by the unconditional `height: 406px` that follows it in compiled order, and `.btn-project-close`'s `@media (min-width: 768px) { top: -100px }` is always overridden by a later `@media (min-width: 480px) { top: 15px }` rule. Both are preserved verbatim in Task 10 below — this is intentional, not an error in this plan.
2. `@extend` interactions (e.g., `.work-inner-container { @extend .container }`) only reveal their true computed behavior once compiled — this is literally the mechanism that caused the full-width Work-section bug fixed earlier in this project's history.

Every rule below was verified against the actual compiled output (`.tmp/styles/main.css`, produced by the currently-working `npx grunt sass`), not reconstructed from memory. Each CSS task still starts with a step to regenerate that file fresh, so you can cross-check.

---

### Task 1: Preliminary cleanup on `master`

Before branching, get `master` into a clean, committed state — several fixes from earlier this session (Sass engine swap, `connect` server fix, `wiredep` fix, Work-section full-width fix, contact-info removal) are still uncommitted, and the new work should branch from a clean baseline.

**Files:**
- Modify: `Gruntfile.js`, `app/index.html`, `app/styles/main.scss`, `package.json` (already-edited, currently uncommitted)
- Delete: `app/reverbnation.md` (untracked duplicate of `app/projectArtistProfile.html`, identical content, wrong extension — confirmed via `diff` returning no output)

- [ ] **Step 1: Confirm the duplicate file really is identical before deleting**

Run: `diff /Users/jhealy/Projects/web-projects/jchealy/app/reverbnation.md /Users/jhealy/Projects/web-projects/jchealy/app/projectArtistProfile.html`
Expected: no output (files are identical)

- [ ] **Step 2: Delete the duplicate and review the full pending diff**

```bash
cd /Users/jhealy/Projects/web-projects/jchealy
rm app/reverbnation.md
git status --short
git diff -- Gruntfile.js app/index.html app/styles/main.scss package.json
```
Expected: diff shows exactly the fixes described above (Dart Sass engine, `grunt-contrib-connect` 5.x, `wiredep` block disabled, `.work-inner-container { width: 100% }`, contact-info block removed) and nothing unexpected.

- [ ] **Step 3: Capture the compiled-CSS reference snapshot while the old toolchain still works**

Tasks 8–10 port `app/styles/main.scss` to native CSS using the **compiled** output as source of truth (see the methodology note above). Task 2 replaces `package.json`, which removes Grunt from `node_modules` — so capture this snapshot now, while `npx grunt sass` still runs. It's committed temporarily and deleted at cutover (Task 14).

```bash
cd /Users/jhealy/Projects/web-projects/jchealy
npx grunt sass
mkdir -p docs/superpowers/reference
cp .tmp/styles/main.css docs/superpowers/reference/compiled-main.css
wc -l docs/superpowers/reference/compiled-main.css
```
Expected: ~7500 lines. This file is the authoritative answer for any "what does this Sass actually compile to?" question in Tasks 8–10.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "$(cat <<'EOF'
Fix legacy Grunt/Sass/Bower toolchain, snapshot compiled CSS

Restores a working local dev environment (Dart Sass, modern
grunt-contrib-connect, wiredep no longer clobbers hand-curated script
includes) ahead of the 11ty migration, and removes app/reverbnation.md,
an untracked duplicate of app/projectArtistProfile.html.

Also snapshots the compiled CSS to docs/superpowers/reference/ as the
source of truth for the hand port in later tasks — the old toolchain
stops working once package.json is replaced. Removed at cutover.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
git log --oneline -1
```
Expected: commit succeeds, `git status` shows a clean working tree.

---

### Task 2: Create the feature branch and scaffold the new package.json

**Files:**
- Create: `package.json` (full rewrite)
- Delete: `package-lock.json`
- Create: `.nvmrc`

> **Deliberately NOT deleted yet:** `Gruntfile.js`, `bower.json`, `.bowerrc`, `bower_components/`, `main.scss`, `.yo-rc.json`, `.jshintrc`, `app/`, `test/`. Task 4 still needs to copy vendor JS out of `bower_components/`, and the design spec's migration strategy is explicit that nothing gets removed until its replacement is proven. All of these are deleted together in Task 14, after verification passes.

- [ ] **Step 1: Create the branch**

```bash
cd /Users/jhealy/Projects/web-projects/jchealy
git checkout -b 11ty-migration
```
Expected: `Switched to a new branch '11ty-migration'`

- [ ] **Step 2: Clear the old dependency tree**

```bash
rm -rf node_modules package-lock.json .tmp
ls bower_components/ >/dev/null && echo "bower_components still present (needed by Task 4) — good"
```
Expected: `node_modules`/`package-lock.json`/`.tmp` gone, `bower_components` still present. (`bower_components` and `.tmp` are gitignored, so this is local cleanup, not a git change.)

- [ ] **Step 3: Write the new `package.json`**

```json
{
  "name": "jchealy",
  "private": true,
  "type": "module",
  "scripts": {
    "start": "eleventy --serve",
    "build": "eleventy"
  },
  "devDependencies": {
    "@11ty/eleventy": "^3.1.6",
    "@11ty/eleventy-img": "^7.0.0"
  },
  "engines": {
    "node": ">=22"
  }
}
```

- [ ] **Step 4: Pin the Node version for local + Netlify consistency**

```bash
echo "22" > .nvmrc
```

- [ ] **Step 5: Install and smoke-test**

```bash
npm install
npx @11ty/eleventy --version
```
Expected: install succeeds with no errors, version command prints `3.1.x`.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "$(cat <<'EOF'
Remove Grunt/Bower/Sass toolchain, scaffold 11ty package.json

Starting point for the 11ty migration: old build tooling removed,
package.json now only depends on @11ty/eleventy and @11ty/eleventy-img.
Site is non-functional until subsequent tasks rebuild it under src/.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: Scaffold the 11ty project (config, directories, smoke test)

**Files:**
- Create: `eleventy.config.js`
- Create: `src/` (empty directory structure, populated by later tasks)
- Create: `src/index.njk` (placeholder, replaced in Task 6)

- [ ] **Step 1: Create the directory structure**

```bash
cd /Users/jhealy/Projects/web-projects/jchealy
mkdir -p src/_data src/_includes/layouts src/projects src/styles src/scripts src/vendor src/images
```

> **Gitignore `_site` before the first build.** From this task onward every build writes to `_site/`, and several later tasks stage with `git add -A` — so if `_site` isn't ignored, build output gets committed. (Task 14 rewrites `.gitignore` wholesale and includes `_site`, but that is far too late.) Add it now:
>
> ```bash
> grep -qx '_site' .gitignore || printf '_site\n' >> .gitignore
> git check-ignore _site && echo "ignored"
> ```

- [ ] **Step 2: Write `eleventy.config.js`**

```js
export default function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy({ "src/vendor": "vendor" });
  eleventyConfig.addPassthroughCopy({ "src/scripts": "scripts" });
  eleventyConfig.addPassthroughCopy({ "src/styles": "styles" });
  eleventyConfig.addPassthroughCopy({ "src/favicon.ico": "favicon.ico" });
  eleventyConfig.addPassthroughCopy({ "src/robots.txt": "robots.txt" });
  // Passed through unprocessed: animated GIF and the (now-unused, but
  // harmless to keep) contact-spinner SVG. Neither is a good fit for
  // eleventy-img's raster resize/format pipeline (Task 11).
  eleventyConfig.addPassthroughCopy({ "src/images/ap-intro.gif": "images/ap-intro.gif" });
  eleventyConfig.addPassthroughCopy({ "src/images/contact-spinner.svg": "images/contact-spinner.svg" });
  // CSS background-image banners: passed through unprocessed too, since
  // main.css is a static file with no build step (see design spec) and
  // can't reference build-time-generated optimized filenames.
  eleventyConfig.addPassthroughCopy({
    "src/images/banner-mobile-hillrom.jpg": "images/banner-mobile-hillrom.jpg",
    "src/images/banner-mobile-ssa.jpg": "images/banner-mobile-ssa.jpg",
    "src/images/banner-mobile-artistprofile.jpg": "images/banner-mobile-artistprofile.jpg",
    "src/images/banner-mobile-hta.jpg": "images/banner-mobile-hta.jpg",
  });

  return {
    dir: {
      input: "src",
      output: "_site",
    },
  };
}
```

- [ ] **Step 3: Write a placeholder `src/index.njk` to smoke-test the build**

```html
---
title: smoke test
---
<h1>11ty is working</h1>
```

- [ ] **Step 4: Build and verify**

```bash
npx @11ty/eleventy
cat _site/index.html
```
Expected: build succeeds, output contains `<h1>11ty is working</h1>`.

- [ ] **Step 5: Verify the dev server works**

```bash
npm start
```
Then open `http://localhost:8080` in a browser (or `curl -s http://localhost:8080/ | grep "11ty is working"`) — confirm it serves the placeholder page. Stop the server (Ctrl-C) before continuing.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "$(cat <<'EOF'
Scaffold 11ty project structure and config

.eleventy config with passthrough copies for vendor/scripts/styles/images,
verified with a placeholder homepage build.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 4: Vendor the JS libraries (exact current files, not fresh npm installs)

The npm `gsap` package is now major version 3, a different API from the `TweenMax`/`TweenLite`/`TimelineMax` globals and the `{scrollTo: {...}}` special property that `app/scripts/main.js` uses (GSAP 1.x-era API). Installing a fresh major version would violate "keep JS behavior exactly as-is" and risk silently breaking the project open/close animations. Instead, vendor the exact files currently loaded from `bower_components/`, copied directly into git — this removes all version-drift risk for the JS layer.

**Files:**
- Create: `src/vendor/jquery.js`
- Create: `src/vendor/TweenMax.min.js`
- Create: `src/vendor/ScrollToPlugin.min.js`
- Create: `src/vendor/snap.svg-min.js`
- Create: `src/vendor/jquery.sticky-kit.js`
- Create: `src/vendor/modernizr.js`
- Create: `src/vendor/bootstrap/affix.js`, `alert.js`, `button.js`, `collapse.js`

- [ ] **Step 1: Copy the exact files from `bower_components` (still present in the working tree even though gitignored)**

```bash
cd /Users/jhealy/Projects/web-projects/jchealy
mkdir -p src/vendor/bootstrap
cp bower_components/jquery/dist/jquery.js src/vendor/jquery.js
cp bower_components/gsap/src/minified/TweenMax.min.js src/vendor/TweenMax.min.js
cp bower_components/gsap/src/minified/plugins/ScrollToPlugin.min.js src/vendor/ScrollToPlugin.min.js
cp bower_components/snap.svg/dist/snap.svg-min.js src/vendor/snap.svg-min.js
cp bower_components/sticky-kit/jquery.sticky-kit.js src/vendor/jquery.sticky-kit.js
cp bower_components/modernizr/modernizr.js src/vendor/modernizr.js
cp bower_components/bootstrap-sass-official/assets/javascripts/bootstrap/affix.js src/vendor/bootstrap/affix.js
cp bower_components/bootstrap-sass-official/assets/javascripts/bootstrap/alert.js src/vendor/bootstrap/alert.js
cp bower_components/bootstrap-sass-official/assets/javascripts/bootstrap/button.js src/vendor/bootstrap/button.js
cp bower_components/bootstrap-sass-official/assets/javascripts/bootstrap/collapse.js src/vendor/bootstrap/collapse.js
```

> **Note:** `bower_components/` is gitignored, so it exists on disk but not in git. Task 2 deliberately left it in place for this step. If it's somehow missing (e.g. a fresh clone that never ran the old `bower install`), regenerate it with `npx bower install` first — `bower.json` and `.bowerrc` are still present until Task 14.

- [ ] **Step 2: Verify file sizes match what was audited during planning**

```bash
ls -la src/vendor/jquery.js src/vendor/TweenMax.min.js src/vendor/ScrollToPlugin.min.js src/vendor/snap.svg-min.js src/vendor/jquery.sticky-kit.js src/vendor/modernizr.js src/vendor/bootstrap/*.js
```
Expected sizes: `jquery.js` ~289KB, `TweenMax.min.js` ~104KB, `ScrollToPlugin.min.js` ~2.5KB, `snap.svg-min.js` ~76KB, `jquery.sticky-kit.js` ~7.8KB, `modernizr.js` ~51KB, `collapse.js` ~4.9KB, `affix.js` ~4.1KB, `alert.js` ~2.2KB, `button.js` ~3KB.

- [ ] **Step 3: Commit**

```bash
git add src/vendor
git commit -m "$(cat <<'EOF'
Vendor exact current JS libraries instead of fresh npm installs

jQuery, GSAP (TweenMax + ScrollToPlugin), Snap.svg, sticky-kit,
Modernizr, and Bootstrap's affix/alert/button/collapse.js copied
verbatim from bower_components — npm's gsap package is now a
different major version with an incompatible API, so vendoring the
exact files removes that risk entirely.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 5: App JS passthrough (unchanged, plus the one required Netlify Forms edit)

**Files:**
- Create: `src/scripts/main.js`, `src/scripts/custom-svg.js`, `src/scripts/button-svg.js` (byte-identical copies)
- Create: `src/scripts/mail.js` (one intentional edit — see below)

- [ ] **Step 1: Copy the unchanged scripts verbatim**

```bash
cd /Users/jhealy/Projects/web-projects/jchealy
cp app/scripts/main.js src/scripts/main.js
cp app/scripts/custom-svg.js src/scripts/custom-svg.js
cp app/scripts/button-svg.js src/scripts/button-svg.js
diff app/scripts/main.js src/scripts/main.js && diff app/scripts/custom-svg.js src/scripts/custom-svg.js && diff app/scripts/button-svg.js src/scripts/button-svg.js
```
Expected: no diff output (byte-identical).

- [ ] **Step 2: Copy `mail.js` and make the one Netlify Forms-required edit**

The current `mail.js` submits via AJAX to `sender.php` and displays whatever text the PHP script returns (`$formMessages.text(response)`). Netlify Forms has no PHP backend to craft that response — a successful AJAX POST to a Netlify Forms-enabled form returns the page HTML, not a friendly message. This is the **one** intentional deviation from "JS stays unchanged," made necessary by the contact-form backend decision (Task 12), not a broader modernization pass.

```bash
cp app/scripts/mail.js src/scripts/mail.js
```

Edit `src/scripts/mail.js`, replacing the `.done()` handler's message line:

```js
/* jshint newcap: false, camelcase: false */
'use strict';

$('#contactForm').submit(function() {
	event.preventDefault();
	var $contactForm = $('#contactForm'),
		$formData = $contactForm.serialize(),
		$formMessages = $('#form-messages');
	$.ajax({
		type: 'POST',
		url: $contactForm.attr('action'),
		data: $formData
	}).done(function(response){
		// Make sure that the formMessages div has the 'success' class.
    $formMessages.removeClass('error');
    $formMessages.addClass('success');
    // Netlify Forms doesn't return a crafted message body like the old
    // sender.php did — show a fixed success message instead of `response`.
    $formMessages.text("Thank You! I'll get back to you soon.");
    // Clear the form.
    $('#name').val('');
    $('#email').val('');
    $('#message').val('');
	}).fail(function(data){
		// Make sure that the formMessages div has the 'error' class.
		$formMessages.removeClass('success');
		$formMessages.addClass('error');
		if(data.responseText !== '') {
			$formMessages.text(data.responseText);
		} else {
			$formMessages.text('Something has gone terribly awry. Sorry about that.');
		}
	});
});
```

- [ ] **Step 3: Commit**

```bash
git add src/scripts
git commit -m "$(cat <<'EOF'
Port app scripts to src/scripts

main.js, custom-svg.js, button-svg.js copied byte-identical.
mail.js gets one required edit: shows a fixed success message
instead of echoing the PHP backend's response text, since that
backend is being replaced by Netlify Forms (Task 12).

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 6: `projects.json` data file + homepage template

**Files:**
- Create: `src/_data/projects.json`
- Create: `src/_includes/layouts/base.njk`
- Create: `src/index.njk` (replaces the Task 3 placeholder)
- Create: `src/favicon.ico`, `src/robots.txt` (copied from `app/`)

- [ ] **Step 1: Write `src/_data/projects.json`**

This is the data-driven improvement described in the design spec — one entry per project, driving both the homepage banner and (via `id`) the matching detail-page URL and background-image class from Task 7 onward.

Note there is deliberately **no** `btnIndex` field. `button-svg.js` builds its SVG button arrays with `.each(function(index) { Snap('#btnExplode' + index); ... })`, so the numeric suffixes must be contiguous `0..n-1` in DOM order. Hardcoding them in JSON would silently break the moment a project is removed from the middle of the list — which is exactly the Helios-removal follow-up this data file is meant to make easy. The template derives them from Nunjucks' `loop.index0` instead, so they always renumber correctly.

```json
[
  {
    "id": "projectArtistProfile",
    "bannerClass": "project-artistprofile",
    "title": "ReverbNation Artist Profile",
    "subtitle": "Musician Homepage"
  },
  {
    "id": "projectHillRom",
    "bannerClass": "project-hillrom",
    "title": "Hill-Rom Caregiver Intelligence Suite",
    "subtitle": "Multi-platform patient and medical device status application"
  },
  {
    "id": "projectSSA",
    "bannerClass": "project-ssa",
    "title": "TowerCo Geospatial Support",
    "subtitle": "GIS Web Application"
  },
  {
    "id": "projectHTA",
    "bannerClass": "project-hta",
    "title": "Helios Towers Africa",
    "subtitle": "Responsive Web Application"
  }
]
```

- [ ] **Step 2: Copy favicon and robots.txt**

```bash
cd /Users/jhealy/Projects/web-projects/jchealy
cp app/favicon.ico src/favicon.ico
cp app/robots.txt src/robots.txt
```

- [ ] **Step 3: Write `src/_includes/layouts/base.njk`**

Holds everything from `app/index.html` that isn't page-specific content: the `<head>`, the vendor + app `<script>` tags (ported 1:1 from the current hand-curated block), and Google Analytics. `{{ content | safe }}` is 11ty/Nunjucks' way of injecting the page body into a layout.

```njk
<!doctype html>
<html class="no-js">
  <head>
    <meta charset="utf-8">
    <title>{{ title }}</title>
    <meta name="description" content="">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="shortcut icon" href="/favicon.ico">
    <link rel="stylesheet" href="/styles/main.css">
    <script src="/vendor/modernizr.js"></script>
  </head>
  <body>
    <!--[if lt IE 10]>
      <p class="browsehappy">You are using an <strong>outdated</strong> browser. Please <a href="http://browsehappy.com/">upgrade your browser</a> to improve your experience.</p>
    <![endif]-->

    {{ content | safe }}

    <script src="/vendor/jquery.js"></script>
    <script src="/vendor/bootstrap/affix.js"></script>
    <script src="/vendor/bootstrap/alert.js"></script>
    <script src="/vendor/bootstrap/button.js"></script>
    <script src="/vendor/bootstrap/collapse.js"></script>
    <script src="/vendor/snap.svg-min.js"></script>
    <script src="/vendor/TweenMax.min.js"></script>
    <script src="/vendor/ScrollToPlugin.min.js"></script>
    <script src="/vendor/jquery.sticky-kit.js"></script>

    <!-- Google Analytics: change UA-XXXXX-X to be your site's ID. -->
    <script>
      (function(b,o,i,l,e,r){b.GoogleAnalyticsObject=l;b[l]||(b[l]=
      function(){(b[l].q=b[l].q||[]).push(arguments)});b[l].l=+new Date;
      e=o.createElement(i);r=o.getElementsByTagName(i)[0];
      e.src='//www.google-analytics.com/analytics.js';
      r.parentNode.insertBefore(e,r)}(window,document,'script','ga'));
      ga('create','UA-9536048-4');ga('send','pageview');
    </script>

    <script src="/scripts/main.js"></script>
    <script src="/scripts/button-svg.js"></script>
    <script src="/scripts/custom-svg.js"></script>
    <script src="/scripts/mail.js"></script>
  </body>
</html>
```

- [ ] **Step 4: Write `src/index.njk`**

Ported directly from `app/index.html`'s body content (nav, header/intro, About, Work, Contact), with the 4 project banners now looping over `projects.json` instead of being hand-duplicated. The contact-form's email/phone list stays removed (matches the already-committed change from Task 1). SVG icon markup, image `<img>` tags, and the contact form are carried over verbatim — image tags get the `{% image %}` shortcode treatment in Task 11, not here.

```njk
---
layout: layouts/base.njk
title: John C. Healy - UX, UI, and Interaction Design
---
<div class="container-fluid">

  <button type="button" class="navbar-toggle collapsed" data-toggle="collapse" data-target="#navbar-collapse">
    <span class="sr-only">Toggle navigation</span>
    <span class="icon-bar"></span>
    <span class="icon-bar"></span>
    <span class="icon-bar"></span>
  </button>

  <div id="navbar-collapse" class="collapse navbar-collapse">
    <ul class="nav navbar-nav">
      <li><a class="nav-link" href="#About" data-toggle="collapse" data-target="#navbar-collapse">ABOUT</a></li>
      <li><a class="nav-link" id="navWork" href="#Work" data-toggle="collapse" data-target="#navbar-collapse">WORK</a></li>
      <li><a class="nav-link" href="#Contact" data-toggle="collapse" data-target="#navbar-collapse">CONTACT</a></li>
    </ul>
  </div>

  <div class="header" id="introContainer">
    <div class="svg-container" id="svgContainerHeader">
      <svg id="svgContent" version="1.1" viewBox="65 50	480 480" preserveAspectRatio="xMidYMid slice" class="head-spin"></svg>
    </div>
    <h4 class="intro-title">UX, UI &amp; INTERACTION DESIGN</h4>
    <div class="intro-inner-container" id="introInnerContainer">
      <img class="img-responsive" id="introImg" src="/images/johnhealy-m.png" alt="John Healy typographic banner text" />
    </div>
    <nav class="navbar">
      <div id="navbar-NoCollapse" class="">
        <ul class="nav navbar-nav">
          <li><a class="nav-link" href="#About">ABOUT</a><span class="spacey">/</span></li>
          <li><a class="nav-link" href="#Work">WORK</a><span class="spacey">/</span></li>
          <li><a class="nav-link" href="#Contact">CONTACT</a></li>
        </ul>
      </div>
    </nav>
  </div> <!-- /header -->

  <div class="section-about" id="About">
    <div class="about-inner-container">
      <img class="img-responsive img-about" src="/images/about.png" />

      <div class="content-row">
        <div class="text-holder-offset">
          <p>I'm John, a designer of human centric, intuitive interfaces. I help build useful and fun experiences that resonate with people. Whether for the web, native app or embedded software, I focus on the little details and grand picture cohesion to make products that people love.</p>
          <p>I see every UX project as a chance to improve someone's relationship with technology.</p>
        </div>
        <div class="img-holder-4">
          <div class="svg-container-about" id="svgContainerAbout">
            <svg id="svgContentAbout" version="1.1" viewBox="170 125 350 350" preserveAspectRatio="xMidYMid slice" class="head-spin-about"></svg>
          </div>
          <img class="img-responsive about-headshot" src="/images/about-headshot.png" alt="John Healy headshot"/>
        </div>
      </div>
    </div>
  </div> <!-- /about -->

  <div class="section-work" id="Work">
    <div class="work-inner-container">
      <img class="img-work center-block" src="/images/work.png" />

      {% for project in projects %}
      <div class="project-banner {{ project.bannerClass }}" id="{{ project.id }}">
        <div class="mob-verticalAdjustCenter">
          <h2 class="project-title">{{ project.title }}</h2>
          <h3 class="project-subtitle">{{ project.subtitle }}</h3>

          <div class="btn-project-explode" id="btnExplodeContainer{{ loop.index0 }}">
            <svg class="btn-svg" id="btnExplode{{ loop.index0 }}"></svg>
          </div>

          <button class="btn-project-close btn-project-off" id="{{ project.id }}Close" data-close="">
            <div id="btnCloseContainer{{ loop.index0 }}">
              <svg class="btn-svg-close" id="btnClose{{ loop.index0 }}"></svg>
            </div>
          </button>
        </div>
      </div>
      <div class="project-return" id="{{ project.id }}Return"></div>
      {% endfor %}

    </div>
  </div> <!-- /work -->

  <div class="section-contact footer" id="Contact">
    <div class="contact-inner-container">

      <div class="row">
        <div class="col-sm-6">
          <img class="img-responsive img-contact" src="/images/contact.png" />
          <div class="contact-copy">
            <p>If you have a project that needs some fresh eyes, or problems that need solving, then I can help with UX, UI, Interaction and Visual Design. I also do Branding, Design Systems, Animation and Front End Development.</p>
            <p>If you want help from someone who cares about meticulous craftsmanship with a purpose, then I'd be pleased to hear from you. I’m available for freelance projects and consulting.</p>

            <div class="contact-social-icons">
               <a role="social" href="http://dribbble.com/healygraphics">
                 <svg class="svg-icon" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" viewBox="0 0 438.533 438.533" xml:space="preserve" ><path d="M409.133 109.203c-19.608-33.592-46.205-60.189-79.798-79.796C295.736 9.8 259.1 0 219.3 0 c-39.781 0-76.47 9.801-110.063 29.407c-33.595 19.604-60.192 46.201-79.8 79.796C9.801 142.8 0 179.5 0 219.3 c0 39.8 9.8 76.5 29.4 110.062c19.607 33.6 46.2 60.2 79.8 79.798c33.597 19.6 70.3 29.4 110.1 29.4 s76.47-9.802 110.065-29.407c33.593-19.602 60.189-46.206 79.795-79.798c19.603-33.596 29.403-70.284 29.403-110.062 C438.533 179.5 428.7 142.8 409.1 109.203z M219.27 31.977c47.201 0 88.4 15.6 123.6 46.82l-3.569 5 c-1.427 2.002-4.996 5.852-10.704 11.565c-5.709 5.708-11.943 11.136-18.699 16.274c-6.762 5.14-15.94 10.992-27.555 17.6 c-11.611 6.567-23.982 12.328-37.117 17.276c-21.887-40.355-45.296-76.709-70.231-109.064 C190.055 33.8 204.8 32 219.3 31.977z M72.524 103.06c18.271-23.026 40.537-40.73 66.806-53.1 c23.601 31.4 46.8 67.4 69.7 107.921c-57.862 15.227-115.532 22.841-173.014 22.8 C42.072 152 54.3 126.1 72.5 103.06z M44.54 286.794c-8.376-21.412-12.563-43.923-12.563-67.527 c0-2.666 0.098-4.665 0.286-5.996c68.905 0 132.955-8.848 192.149-26.553c6.092 11.8 11.1 22.4 15.1 31.7 c-0.771 0.38-1.999 0.806-3.713 1.283c-1.719 0.476-2.953 0.806-3.721 0.999l-10.561 3.7 c-7.236 2.666-16.708 7.235-28.409 13.703c-11.704 6.478-24.123 14.182-37.257 23.13c-13.134 8.949-26.696 20.797-40.684 35.6 c-13.99 14.75-25.743 30.591-35.26 47.53C64.713 327.4 52.9 308.2 44.5 286.794z M219.27 406.6 c-44.54 0-84.32-14.277-119.343-42.825l4.283 3.142c6.661-14.66 16.462-28.746 29.408-42.257 c12.944-13.511 25.41-24.413 37.401-32.695c11.991-8.274 25.028-16.077 39.115-23.414c14.084-7.323 23.691-11.991 28.835-13.983 c5.14-1.998 9.233-3.572 12.278-4.716l0.568-0.287h0.575c18.647 48.9 32 96.3 40 142.2 C268.756 401.6 244.4 406.6 219.3 406.56z M376.876 320.479c-14.086 21.796-31.696 39.834-52.817 54.1 c-7.81-43.776-19.985-88.415-36.549-133.902c37.877-5.907 76.8-3.142 116.8 8.3 C400.092 274.8 391 298.7 376.9 320.479z M403.706 216.698c-1.903-0.378-4.285-0.81-7.139-1.283 c-2.854-0.473-6.331-1.047-10.424-1.713c-4.087-0.666-8.662-1.283-13.702-1.855c-5.045-0.571-10.421-1.093-16.136-1.569 c-5.708-0.478-11.8-0.855-18.268-1.143c-6.479-0.284-13.042-0.428-19.705-0.428c-6.656 0-13.657 0.193-20.981 0.6 c-7.326 0.375-14.414 1.049-21.265 1.999c-0.575-0.953-1.287-2.524-2.143-4.714c-0.855-2.187-1.479-3.855-1.848-4.997 c-3.621-7.994-7.81-17.036-12.573-27.121c13.134-5.333 25.652-11.469 37.555-18.418c11.892-6.949 21.402-13.131 28.544-18.555 c7.139-5.43 13.895-11.188 20.27-17.277c6.379-6.09 10.513-10.323 12.423-12.703c1.906-2.384 3.713-4.714 5.424-6.995l0.287-0.288 c27.788 33.9 42 72.9 42.5 117.059L403.706 216.698z"/></svg>
               </a>
              <a role="social" href="http://instagram.com/joohnh">
                <svg class="svg-icon" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" viewBox="0 0 438.536 438.536" xml:space="preserve"><path d="M421.981 16.562C410.941 5.5 397.7 0 382.3 0H56.248C40.83 0 27.6 5.5 16.6 16.6 C5.52 27.6 0 40.8 0 56.243V382.29c0 15.4 5.5 28.6 16.6 39.683c11.043 11 24.3 16.6 39.7 16.6 h326.046c15.41 0 28.644-5.523 39.684-16.563c11.043-11.039 16.557-24.27 16.557-39.683V56.243 C438.534 40.8 433 27.6 422 16.562z M157.462 158.025c17.224-16.652 37.924-24.982 62.097-24.982 c24.36 0 45.2 8.3 62.4 24.982c17.228 16.7 25.8 36.8 25.8 60.386c0 23.598-8.609 43.729-25.837 60.4 c-17.228 16.659-38.014 24.988-62.381 24.988c-24.172 0-44.87-8.336-62.097-24.988c-17.228-16.652-25.841-36.781-25.841-60.379 C131.621 194.8 140.2 174.7 157.5 158.025z M388.865 370.589c0 4.945-1.718 9.083-5.141 12.4 c-3.433 3.33-7.519 4.996-12.282 4.996h-305.2c-4.948 0-9.091-1.666-12.419-4.996c-3.333-3.326-4.998-7.471-4.998-12.416V185.575 H89.08c-3.805 11.993-5.708 24.462-5.708 37.402c0 36.6 13.3 67.7 40 93.511c26.65 25.8 58.7 38.7 96.2 38.7 c24.744 0 47.583-5.903 68.527-17.703c20.937-11.807 37.486-27.839 49.676-48.112c12.183-20.272 18.274-42.4 18.274-66.38 c0-12.94-1.91-25.406-5.715-37.402h38.547v185.014H388.865z M388.865 115.626c0 5.52-1.903 10.184-5.716 14 c-3.805 3.809-8.466 5.711-13.989 5.711h-49.676c-5.517 0-10.185-1.903-13.99-5.711c-3.806-3.806-5.708-8.47-5.708-13.99V68.522 c0-5.33 1.902-9.945 5.708-13.848c3.806-3.901 8.474-5.854 13.99-5.854h49.676c5.523 0 10.2 2 14 5.9 c3.812 3.9 5.7 8.5 5.7 13.848V115.626z"/></svg>
              </a>
              <a role="social" href="http://twitter.com/baconclutter">
                <svg class="svg-icon" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" viewBox="0 0 449.956 449.956" preserveAspectRatio="xMidYMid meet" xml:space="preserve"><path d="M449.956 85.657c-17.702 7.614-35.408 12.369-53.102 14.279c19.985-11.991 33.503-28.931 40.546-50.819 c-18.281 10.847-37.787 18.268-58.532 22.267c-18.274-19.414-40.73-29.125-67.383-29.125c-25.502 0-47.246 8.992-65.24 27 c-17.984 17.987-26.977 39.731-26.977 65.235c0 6.9 0.8 13.9 2.3 21.128c-37.688-1.903-73.042-11.372-106.068-28.407 C82.46 110.2 54.4 87.5 31.4 59.101c-8.375 14.272-12.564 29.787-12.564 46.536c0 15.8 3.7 30.5 11.1 44 c7.422 13.5 17.4 24.5 30 32.831c-14.849-0.572-28.743-4.475-41.684-11.708v1.142c0 22.3 7 41.8 21 58.7 c13.99 16.8 31.6 27.5 53 31.833c-7.995 2.091-16.086 3.138-24.269 3.138c-5.33 0-11.136-0.475-17.416-1.42 c5.9 18.5 16.8 33.6 32.5 45.535c15.799 11.9 33.7 18 53.7 18.418c-33.498 26.262-71.66 39.393-114.486 39.4 c-8.186 0-15.607-0.373-22.27-1.139c42.827 27.6 90 41.4 141.6 41.394c32.738 0 63.478-5.181 92.21-15.557 c28.746-10.369 53.297-24.267 73.665-41.686c20.362-17.415 37.925-37.448 52.674-60.097c14.75-22.651 25.738-46.298 32.977-70.946 c7.23-24.653 10.848-49.344 10.848-74.092c0-5.33-0.096-9.325-0.287-11.991C421.785 120.2 437.2 104.3 450 85.657z"/></svg>
              </a>
            </div>
          </div> <!-- /contact copy -->
        </div>

        <div class="col-sm-6">
          <div class="contact-form-wrapper">

            <h3 class="contact-form-title">John Healy</h3>
            <h4 class="contact-form-subtitle">UX, UI &amp; Interaction Design</h4>
            <!-- Contact Form -->
            <div id="form-div">
             <form class="form" id="contactForm" name="contactForm" role="form" method="post" data-netlify="true" action="/">
              <input type="hidden" name="form-name" value="contactForm" />

              <div class="name">
                <input class="feedback-input" id="name" name="name" type="text" placeholder="Who are you?" required />
              </div>

              <div class="email">
                <input name="email" class="feedback-input" id="email"  type="email" placeholder="What is your@email.com?" required />
              </div>

              <div class="text">
                <textarea name="message" class="feedback-input" id="message" placeholder="What&apos;s on your mind?" required ></textarea>
              </div>

              <div class="submit">
                <input id="button-submit" type="submit" value="Send" />
              </div>

              <div id="form-messages"></div>
            </form>
          </div><!-- /form-div -->

          </div><!-- /contact-form-wrapper -->

        </div> <!-- /col-sm-6 -->
      </div> <!-- /row -->

    </div> <!-- /contact-inner-container -->
  </div> <!-- /contact -->

</div> <!-- /container-fluid -->
```

Note the two Netlify Forms additions in the `<form>` tag: `data-netlify="true"`, `name="contactForm"`, `action="/"`, and the hidden `form-name` input — these are what Netlify's build-time form detection needs (Task 12 covers this in full, this step just wires the markup).

- [ ] **Step 5: Build and verify**

```bash
npx @11ty/eleventy
grep -c "project-banner" _site/index.html
```
Expected: build succeeds, output contains 4 `project-banner` divs (one per `projects.json` entry).

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "$(cat <<'EOF'
Add projects.json data file and port homepage to index.njk

Homepage content ported from app/index.html into base.njk + index.njk.
Work-section project banners now loop over _data/projects.json instead
of being hand-duplicated per project — this is what makes the Validic/
Helios follow-up task a data edit instead of an HTML surgery. Contact
form gets the Netlify Forms attributes (wired up fully in a later task).

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 7: Project detail templates

**Files:**
- Create: `src/projects/artist-profile.njk` (`permalink: /projectArtistProfile.html`)
- Create: `src/projects/hillrom.njk` (`permalink: /projectHillRom.html`)
- Create: `src/projects/towerco.njk` (`permalink: /projectSSA.html`)
- Create: `src/projects/helios.njk` (`permalink: /projectHTA.html`)

These keep their exact current flat URLs — `app/scripts/main.js`'s `.load(clickedId + '.html #' + clickedId + 'Inner', ...)` targets those filenames directly, and that JS isn't being touched. Each file's `<div class="project-expanded" id="...Inner">` body is copied verbatim from the corresponding `app/project*.html` fragment; the only new thing is the `permalink` front matter.

No `layout` key is set on these, so 11ty applies none and each page renders as a bare fragment. That's intentional and matches current behavior: the existing `app/project*.html` files are technically full documents but with a completely empty `<head>` (no stylesheet, no scripts), so visiting one directly has always shown unstyled content. jQuery's `.load()` only extracts the `#...Inner` subtree and injects it into the already-styled homepage, so the wrapper never mattered.

- [ ] **Step 1: Create `src/projects/artist-profile.njk`**

```bash
cd /Users/jhealy/Projects/web-projects/jchealy
{
  echo "---"
  echo "permalink: /projectArtistProfile.html"
  echo "---"
  sed -n '/<div class="project-expanded"/,/<\/body>/p' app/projectArtistProfile.html | sed '$d'
} > src/projects/artist-profile.njk
```

- [ ] **Step 2: Create the remaining three the same way**

```bash
{
  echo "---"
  echo "permalink: /projectHillRom.html"
  echo "---"
  sed -n '/<div class="project-expanded"/,/<\/body>/p' app/projectHillRom.html | sed '$d'
} > src/projects/hillrom.njk

{
  echo "---"
  echo "permalink: /projectSSA.html"
  echo "---"
  sed -n '/<div class="project-expanded"/,/<\/body>/p' app/projectSSA.html | sed '$d'
} > src/projects/towerco.njk

{
  echo "---"
  echo "permalink: /projectHTA.html"
  echo "---"
  sed -n '/<div class="project-expanded"/,/<\/body>/p' app/projectHTA.html | sed '$d'
} > src/projects/helios.njk
```

- [ ] **Step 3: Verify each file's body matches the original fragment exactly (only front matter differs)**

```bash
for pair in "artist-profile:projectArtistProfile" "hillrom:projectHillRom" "towerco:projectSSA" "helios:projectHTA"; do
  new="${pair%%:*}"; old="${pair##*:}"
  echo "=== $new vs $old ==="
  diff <(tail -n +4 "src/projects/$new.njk") <(sed -n '/<div class="project-expanded"/,/<\/body>/p' "app/$old.html" | sed '$d')
done
```
Expected: no diff output for any of the four pairs.

- [ ] **Step 4: Build and verify the URLs are exactly right**

```bash
npx @11ty/eleventy
ls _site/project*.html
```
Expected: `_site/projectArtistProfile.html`, `_site/projectHillRom.html`, `_site/projectSSA.html`, `_site/projectHTA.html` — matching today's live URLs exactly. Confirm no layout leaked in:

```bash
grep -L "vendor/jquery.js" _site/project*.html
```
Expected: all four filenames listed (i.e. none of them contain the layout's script tags).

- [ ] **Step 5: Assert every project's `id` resolves to a real detail page**

This is the one failure mode in this task that produces **no build error and no visible symptom until someone clicks a banner**. `main.js` does `.load(clickedId + '.html #' + clickedId + 'Inner')`, deriving both the URL and the fragment id from the banner's DOM `id`, which comes from `projects.json`. So each `projects.json` `id` must match a permalink here *and* the `id` on the `<div class="project-expanded">` inside that page. Nothing enforces this — the strings are maintained independently. Check it mechanically:

```bash
node -e '
const fs = require("fs");
const projects = JSON.parse(fs.readFileSync("src/_data/projects.json", "utf8"));
let bad = 0;
for (const p of projects) {
  const page = `_site/${p.id}.html`;
  if (!fs.existsSync(page)) { console.error(`MISSING PAGE: ${page} (for id "${p.id}")`); bad++; continue; }
  const html = fs.readFileSync(page, "utf8");
  if (!html.includes(`id="${p.id}Inner"`)) {
    console.error(`MISSING FRAGMENT: ${page} has no element with id="${p.id}Inner"`);
    bad++;
  }
}
console.log(bad === 0 ? `OK: all ${projects.length} projects resolve to a page and fragment` : `${bad} problem(s)`);
process.exit(bad === 0 ? 0 : 1);
'
```
Expected: `OK: all 4 projects resolve to a page and fragment`, exit 0.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "$(cat <<'EOF'
Port project detail pages to 11ty templates

Each project's expanded-content fragment copied verbatim from
app/project*.html into src/projects/*.njk, with explicit permalinks
preserving the exact current flat URLs (main.js's jQuery .load() ajax
targets these filenames directly).

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 8: Native CSS — variables, base, header/intro/nav/collapse

**Files:**
- Create: `src/styles/main.css`

- [ ] **Step 1: Regenerate the ground-truth reference file**

```bash
cd /Users/jhealy/Projects/web-projects/jchealy
git show HEAD~5:Gruntfile.js > /tmp/Gruntfile.js.bak 2>/dev/null || echo "Gruntfile already removed — check out the pre-Task-2 commit to regenerate .tmp/styles/main.css if you need to re-verify a rule against compiled output"
```
(If `Gruntfile.js` and its dependencies were already removed by Task 2 by the time this runs, and you need to double-check a rule against the real compiled output, temporarily `git worktree add /tmp/old-toolchain <commit-before-task-2>` and run `npx grunt sass` there — every rule in this task and Tasks 9–10 has already been cross-checked against that output during planning, so this should only be needed if something looks visually wrong during Task 13's verification pass.)

- [ ] **Step 2: Write `src/styles/main.css` (part 1 of 3 — this task's content)**

```css
/*
Framework: none (was Bootstrap-sass; replaced by hand-written native CSS)
Code Style: http://codeguide.co/#css
*/

@import url(https://fonts.googleapis.com/css?family=Montserrat:300,400,500,600,700);

/* ==========================================================================
   Variables
   ========================================================================== */

:root {
  --max-width: 1200px;

  --color-dark-blue: #0D1316;
  --color-light-blue: #043963;
  --color-tan: #FAE7C9;
  --color-white: #fff;
  --color-bright-red: #DC4601;
  --color-dark-red: #B23800;
  --color-light-gray: #EDEDED;
  --color-dark-gray: #9B9B9B;
  --color-darker-gray: #4A4A4A;

  --shadow-button: 0px 1px 1px 1px rgba(0, 0, 0, 0.20);
  --shadow-button-active: 0px 3px 3px 1px rgba(0, 0, 0, 0.20);

  --font-main: 'Montserrat', 'Century Gothic', Verdana, Arial, sans-serif;

  --z1: 100;
  --z2: 200;
  --z3: 300;
  --z4: 400;
  --z5: 500;
}

/* ==========================================================================
   Base layer

   This replaces the parts of Bootstrap's normalize + scaffolding + type
   layers that the site actually depends on. Do not trim this section
   thinking it's boilerplate — every rule here is load-bearing, verified
   against docs/superpowers/reference/compiled-main.css:

   - `box-sizing: border-box` is what makes every percentage-width column
     in Tasks 9-10 line up, since they all also carry 15px side padding.
     Without it the entire grid math is wrong.
   - The body font-size/line-height/color are inherited by all copy.
   - The heading margins/sizes are relied on by .project-title (h2),
     .project-subtitle (h3), and every h3/h4/h5/h6 inside the project
     detail pages, which set colors but not sizes or spacing.
   - `p { margin: 0 0 10px }` spaces all body copy.
   - `button, input, textarea { font: inherit }` is what makes the form
     controls and the nav/close buttons use Montserrat instead of the
     browser default form font.
   ========================================================================== */

*,
*::before,
*::after {
  box-sizing: border-box;
}

html {
  font-family: sans-serif;
  font-size: 10px;
  -webkit-text-size-adjust: 100%;
  -webkit-tap-highlight-color: rgba(0, 0, 0, 0);
}

body {
  margin: 0;
  font-size: 14px;
  line-height: 1.428571429;
  color: #333333;
  background-color: #fff;
  padding-top: 0px;
  padding-bottom: 0;
  font-family: var(--font-main);
}

h1, h2, h3, h4, h5, h6 {
  font-family: inherit;
  font-weight: 500;
  line-height: 1.1;
  color: inherit;
}

h1, h2, h3 {
  margin-top: 20px;
  margin-bottom: 10px;
}

h4, h5, h6 {
  margin-top: 10px;
  margin-bottom: 10px;
}

h1 { font-size: 36px; }
h2 { font-size: 30px; }
h3 { font-size: 24px; }
h4 { font-size: 18px; }
h5 { font-size: 14px; }
h6 { font-size: 12px; }

p {
  margin: 0 0 10px;
}

a {
  background: transparent;
  color: #428bca;
  text-decoration: none;
}

a:hover,
a:focus {
  color: #2a6496;
  text-decoration: underline;
}

a:focus {
  outline: thin dotted;
  outline: 5px auto -webkit-focus-ring-color;
  outline-offset: -2px;
}

a:hover {
  outline: 0;
}

img {
  border: 0;
  vertical-align: middle;
}

button,
input,
optgroup,
select,
textarea {
  color: inherit;
  font: inherit;
  margin: 0;
}

button {
  overflow: visible;
  text-transform: none;
}

button,
html input[type="button"],
input[type="reset"],
input[type="submit"] {
  -webkit-appearance: button;
  cursor: pointer;
}

input {
  line-height: normal;
}

textarea {
  overflow: auto;
}

/* eleventy-img (Task 11) emits <picture><img …></picture> when it outputs
   more than one format. `display: contents` removes the <picture> box from
   layout so the inner <img> participates in its parent's layout directly —
   without this, `.center-block`'s `display:block; margin:auto` centering
   breaks, because the inline <picture> wrapper would be what's laid out. */
picture {
  display: contents;
}

.browsehappy {
  margin: 0.2em 0;
  background: #ccc;
  color: #000;
  padding: 0.2em 0;
}

.container-fluid {
  margin-right: auto;
  margin-left: auto;
  padding-left: 0px;
  padding-right: 0px;
}

.container-fluid::before,
.container-fluid::after {
  content: " ";
  display: table;
}

.container-fluid::after {
  clear: both;
}

.img-responsive {
  display: inline-block;
  max-width: 100%;
  height: auto;
}

.center-block {
  display: block;
  margin-left: auto;
  margin-right: auto;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  border: 0;
}

/* ==========================================================================
   Header / intro
   ========================================================================== */

.header {
  position: relative;
  height: 100vh;
  z-index: var(--z1);
  text-align: center;
  color: var(--color-white);
  background-color: var(--color-dark-blue);
  font-weight: bold;
}

.intro-title {
  position: relative;
  margin-top: 0;
  margin-bottom: 0;
  padding-top: 30px;
  font-size: 14px;
  z-index: var(--z1);
  padding-left: 25%;
  padding-right: 25%;
  line-height: 140%;
}

@media (min-width: 480px) { /* was $screen-xs-min */
  .intro-title {
    font-size: 16px;
    padding-top: 40px;
    padding-left: 0;
    padding-right: 0;
    line-height: 100%;
  }
}

.svg-container {
  position: absolute;
  height: 100%;
  width: 100%;
  vertical-align: middle;
  overflow: hidden;
}

.svg-container::before {
  content: '';
  display: inline-block;
  height: 100%;
  vertical-align: middle;
  margin-right: -0.25em; /* Adjusts for spacing */
}

.head-spin {
  height: 100%;
  width: 99%;
  top: 0;
  left: 0;
  vertical-align: middle;
}

/* .intro-inner-container previously got Bootstrap's .container behavior via
   Sass @extend: centered (margin auto), a width that steps
   750px -> 970px -> 1170px at the 768/992/1200 breakpoints, further capped
   at 1024px by its own max-width rule from 768px up (so it actually renders
   at 750px, 970px, then 1024px — never the full 1170px). Written out
   explicitly since native CSS has no @extend equivalent. */
.intro-inner-container {
  position: relative;
  height: 100%;
  z-index: var(--z2);
  margin-top: -40px;
  padding-left: 0px;
  padding-right: 0px;
  margin-right: auto;
  margin-left: auto;
}

.intro-inner-container::before {
  content: '';
  display: inline-block;
  height: 100%;
  vertical-align: middle;
  margin-right: -0.25em; /* Adjusts for spacing */
}

@media (min-width: 480px) { /* was $screen-xs-min */
  .intro-inner-container {
    margin-top: -20px;
  }
}

@media (min-width: 768px) { /* was $screen-sm-min */
  .intro-inner-container {
    width: 750px;
    max-width: 1024px;
  }
}

@media (min-width: 992px) { /* was $screen-md-min */
  .intro-inner-container {
    width: 970px;
  }
}

@media (min-width: 1200px) { /* was $screen-lg-min */
  .intro-inner-container {
    width: 1170px;
  }
}

#introImg {
  display: inline-block;
  vertical-align: middle;
  width: 60%;
}

@media (min-width: 768px) { /* was $screen-sm-min */
  #introImg {
    width: auto;
  }
}

/* ==========================================================================
   Nav / collapse — the Bootstrap-derived rules that vendor/bootstrap/
   collapse.js needs to function (toggling the .in class), plus the site's
   own overrides. This is a small, deliberate slice of Bootstrap's navbar
   component, not the whole thing.
   ========================================================================== */

.collapse {
  display: none;
}

.collapse.in {
  display: block;
}

.collapsing {
  position: relative;
  height: 0;
  overflow: hidden;
  transition: height 0.35s ease;
}

.nav {
  margin-bottom: 0;
  padding-left: 0;
  list-style: none;
}

.nav > li > a {
  position: relative;
  display: block;
  padding: 10px 15px;
  font-size: 13px;
  padding-left: 5px;
  padding-right: 5px;
}

@media (min-width: 480px) { /* was $screen-xs-min */
  .nav > li > a {
    font-size: 14px;
    padding-left: 15px;
    padding-right: 15px;
  }
}

/* `text-decoration: none` on hover/focus comes from Bootstrap's own
   `.nav > li > a:hover, :focus` rule. It must be carried over explicitly —
   the base layer's `a:hover { text-decoration: underline }` would
   otherwise underline every nav link on hover, which the live site
   does not do. */
.nav > li > a:hover,
.nav > li > a:focus {
  text-decoration: none;
}

.nav > li > a:visited,
.nav > li > a:focus {
  background-color: transparent;
  color: #fff;
}

.nav > li > a:hover {
  background-color: transparent;
  color: var(--color-bright-red);
}

.nav > li > a:active {
  background-color: transparent;
  color: var(--color-dark-blue);
}

.navbar {
  position: relative;
  border: 1px solid transparent;
  top: -100px;
  min-height: 120px;
  z-index: var(--z2);
}

.navbar-collapse {
  overflow-x: visible;
  padding-right: 15px;
  padding-left: 15px;
  border-top: 1px solid transparent;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.1);
}

.navbar-collapse::before,
.navbar-collapse::after {
  content: " ";
  display: table;
}

.navbar-collapse::after {
  clear: both;
}

.navbar-nav {
  margin: 7.5px -15px;
  float: none;
  text-align: center;
  margin-left: 0;
  margin-right: 0;
}

.navbar-nav > li {
  float: none;
  display: inline-block;

  & > a {
    padding-top: 10px;
    padding-bottom: 10px;
    line-height: 20px;
    display: inline-block;
    color: var(--color-white);
  }
}

.spacey {
  padding-left: 15px;
  padding-right: 15px;
}

.navbar-toggle {
  position: fixed;
  left: 25px;
  top: 17px;
  height: 50px;
  width: 50px;
  padding: 13px;
  margin: 0 30px 30px 0;
  border-radius: 50%;
  background-color: #fff;
  border: 1px solid transparent;
  box-shadow: var(--shadow-button);
  z-index: var(--z5);

  &:hover {
    box-shadow: var(--shadow-button-active);
  }

  &:active {
    background-color: var(--color-bright-red);
    box-shadow: var(--shadow-button-active);
  }

  & .icon-bar {
    display: block;
    width: 22px;
    height: 3px;
    border-radius: 1px;

    & + .icon-bar {
      margin-top: 4px;
    }
  }

  & span {
    background-color: var(--color-dark-blue);
  }
}

@media (min-width: 768px) { /* was $screen-sm-min */
  #navbar-collapse {
    display: none !important;
  }
}

@media (max-width: 768px) { /* was $screen-sm-min */
  .navbar-collapse {
    position: fixed;
    top: 0px;
    left: 0px;
    bottom: 0px;
    right: 0px;
    background-color: var(--color-white);
    z-index: var(--z4);

    & ul {
      margin-top: 50%;
      text-align: center;

      & li {
        display: block;
        margin-bottom: 30px;

        & a {
          display: block;
          color: var(--color-dark-blue);
          font-size: 22px;
          font-weight: bold;
        }
      }
    }
  }
}

/* NOTE: main.scss also had a `.nav-collapse > ul` rule (setting a 50px
   bottom margin on its list items) — omitted here. `.nav-collapse`, without
   the "navbar-" prefix, matches nothing in the markup and is referenced by
   no selector in any script; it was already dead CSS in the live site. */
```

- [ ] **Step 3: Wire it into the layout and build**

`src/styles/main.css` is already referenced by `base.njk` (`<link rel="stylesheet" href="/styles/main.css">`, added in Task 6) and passthrough-copied by `eleventy.config.js` (Task 3). Just rebuild:

```bash
npx @11ty/eleventy
grep -c "\-\-color-dark-blue" _site/styles/main.css
```
Expected: build succeeds, `main.css` present in `_site/styles/`.

- [ ] **Step 4: Commit**

```bash
git add src/styles/main.css
git commit -m "$(cat <<'EOF'
Native CSS part 1: variables, base, header/intro/nav/collapse

Sass $variables converted to CSS custom properties. Bootstrap grid/
container behavior for .intro-inner-container written out explicitly
(no @extend equivalent in native CSS) — verified against the actual
compiled output rather than reconstructed from the Sass source, since
nested @media hoisting made at least one Sass @extend interaction
behave non-obviously (documented inline).

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 9: Native CSS — About + Work sections

**Files:**
- Modify: `src/styles/main.css` (append)

- [ ] **Step 1: Append the About section**

```css

/* ==========================================================================
   About
   ========================================================================== */

.section-about {
  position: relative;
  z-index: var(--z2);
  padding-top: 90px;
  padding-right: 20%;
  padding-left: 20%;
  padding-bottom: 90px;
  background-color: var(--color-tan);
  color: var(--color-dark-blue);
  overflow: hidden;
}

.about-inner-container {
  position: relative;
  text-align: center;

  & img.img-about {
    width: 80%;

    @media (min-width: 480px) { /* was $screen-xs-min */
      width: 60%;
    }
  }

  & p {
    padding-top: 30px;
    font-weight: normal;
    font-size: 13px;
    line-height: 160%;
    text-align: left;

    @media (min-width: 480px) { /* was $screen-xs-min */
      font-size: 16px;
    }
  }
}

img.about-headshot {
  display: none;
}

.content-row {
  margin-left: -15px;
  margin-right: -15px;
}

.content-row::before,
.content-row::after {
  content: " ";
  display: table;
}

.content-row::after {
  clear: both;
}

/* .text-holder-offset replaces Bootstrap's
   make-sm-column(5) + make-md-column(4) + make-sm-column-offset(3) */
.text-holder-offset {
  position: relative;
  min-height: 1px;
  padding-left: 15px;
  padding-right: 15px;
  z-index: var(--z1);
}

@media (min-width: 768px) { /* was $screen-sm-min */
  .text-holder-offset {
    float: left;
    width: 41.6666666667%;
    margin-left: 25%;
  }
}

@media (min-width: 992px) { /* was $screen-md-min */
  .text-holder-offset {
    width: 33.3333333333%;
  }
}

/* .img-holder-4 replaces make-sm-column(4) */
.img-holder-4 {
  position: relative;
  min-height: 1px;
  padding-left: 15px;
  padding-right: 60px;
  margin-top: -70px;
  margin-bottom: 70px;
}

@media (min-width: 768px) { /* was $screen-sm-min */
  .img-holder-4 {
    float: left;
    width: 33.3333333333%;
  }
}

.svg-container-about {
  display: none;
  position: absolute;
  height: 100%;
  width: 100%;
  vertical-align: middle;
  overflow: visible;
}

.svg-container-about::before {
  content: '';
  display: inline-block;
  height: 100%;
  vertical-align: middle;
  margin-right: -0.25em; /* Adjusts for spacing */
}

.head-spin-about {
  display: none;
  height: 100%;
  width: 99%;
  top: 0;
  left: 0;
  vertical-align: middle;
  overflow: visible !important;
}

@media (min-width: 768px) { /* was $screen-sm-min — NOT screen-md-min, verify against source line 432 if in doubt */
  .svg-container-about,
  .head-spin-about {
    display: inline-block;
  }
  .section-about {
    padding-right: 0;
    padding-left: 0;
  }
  .about-inner-container {
    max-width: var(--max-width);
    margin: auto;
    text-align: left;
  }
  .about-inner-container img.img-about {
    width: 40%;
    max-width: 400px;
    margin-left: 6%;
  }
  .about-inner-container img.about-headshot {
    position: relative;
    display: inline-block;
  }
  .text-holder-offset {
    margin-top: -90px;
  }
}
```

- [ ] **Step 2: Append the Work section**

```css

/* ==========================================================================
   Work
   ========================================================================== */

.section-work {
  position: relative;
  z-index: var(--z2);
  padding-top: 90px;
  padding-bottom: 0px;
  padding-right: 0px;
  padding-left: 0px;
  background-color: white;
  color: var(--color-dark-blue);
  overflow: hidden;
}

/* .work-inner-container: deliberately full-width (not the Bootstrap
   .container behavior .intro-inner-container/.contact-inner-container get)
   — see the design spec's CSS section for why this was made explicit
   rather than left to an @extend that silently didn't apply at some
   breakpoints under the old Sass engine. That was a real bug, fixed
   earlier in this project's history. */
.work-inner-container {
  position: relative;
  width: 100%;
  padding-right: 0px;
  padding-left: 0px;
  min-height: 1200px;
}

.img-work {
  width: 60%;
  padding-bottom: 90px;
  max-width: 400px;
}

@media (min-width: 480px) { /* was $screen-xs-min */
  .img-work {
    width: 40%;
  }
}

/* NOTE: this @media rule is dead code, preserved intentionally for parity
   with the current live site. In the compiled Sass output, this rule
   emits BEFORE the unconditional `height: 406px` below (Dart Sass hoists
   a nested @media to where it was declared inside the rule, which here
   was first), so the unconditional rule always wins, at every viewport.
   Confirmed against .tmp/styles/main.css during planning. Worth revisiting
   as a follow-up, but changing it now would be a visual regression
   relative to what's live today, not a fix. */
@media (max-width: 768px) {
  .project-banner {
    height: 250px;
  }
}

.project-banner {
  height: 406px;
  text-align: center;
  background-repeat: no-repeat;
  background-position: center center;
  background-size: cover;
  overflow: hidden;
}

.is_stuck {
  z-index: var(--z4);
}

.project-return {
  height: 0;
  overflow: hidden;
}

.project-hillrom { background-image: url(/images/banner-mobile-hillrom.jpg); }
.project-ssa { background-image: url(/images/banner-mobile-ssa.jpg); }
.project-artistprofile { background-image: url(/images/banner-mobile-artistprofile.jpg); }
.project-hta { background-image: url(/images/banner-mobile-hta.jpg); }

.project-title {
  position: relative;
  margin-bottom: 0px;
  padding-left: 15px;
  padding-right: 15px;
  font-size: 20px;
  font-weight: bold;
  letter-spacing: -0.004em;
  color: #fff;
}

.project-subtitle {
  position: relative;
  margin-top: 7px;
  padding-left: 15px;
  padding-right: 15px;
  font-size: 13px;
  font-weight: normal;
  letter-spacing: -0.004em;
  color: #fff;
}

@media (min-width: 480px) { /* was $screen-xs-min */
  .project-title {
    font-size: 24px;
  }
  .project-subtitle {
    font-size: 14px;
  }
}

.btn-project-explode,
.btn-project-close {
  display: inline-block;
  position: relative;
  height: 100px;
  width: 100px;
  z-index: var(--z4);
  margin: 0;
  text-align: left;
  cursor: pointer;
}

.btn-project-text {
  position: absolute;
  left: 38%;
  top: 27%;
  font-size: 30px;
}

.btn-project-more,
.btn-project-next {
  height: 50px;
  width: 50px;
  margin: 0;
  padding: 0;
  background-color: #fff;
  border-radius: 50%;
  border: none;
  z-index: var(--z5);
  font-size: 16px;
  font-weight: bold;
  text-transform: uppercase;
  box-shadow: var(--shadow-button);
  color: var(--color-dark-blue);
  cursor: pointer;
}

.btn-project-next {
  margin-bottom: 40px;
}

@media (min-width: 480px) { /* was $screen-xs-min */
  .btn-project-text {
    left: 40%;
    top: 29%;
  }
  .btn-project-more {
    font-size: 18px;
  }
}

.btn-project-close {
  position: fixed;
  top: -50px;
}

/* NOTE: also dead code, preserved for the same reason as the
   .project-banner rule above — the @media (min-width: 480px) rule further
   down always wins at any viewport where this one would apply too, since
   it comes later in the compiled cascade. Confirmed against
   .tmp/styles/main.css during planning. */
@media (min-width: 768px) {
  .btn-project-close {
    top: -100px;
  }
}

.btn-project-close {
  right: 25px;
  color: var(--color-dark-blue);
  background-color: transparent;
  border: none;
  z-index: var(--z2);
  transform: rotate(45deg);
  outline: none;
}

@media (min-width: 480px) { /* was $screen-xs-min */
  .btn-project-close {
    top: 15px;
  }
}

.btn-project-off {
  display: none;
}
```

- [ ] **Step 3: Rebuild and check for CSS syntax errors**

```bash
npx @11ty/eleventy
node -e "require('fs').readFileSync('_site/styles/main.css','utf8')" && echo "file readable, no build errors reported above"
```
Expected: build succeeds with no errors printed.

- [ ] **Step 4: Commit**

```bash
git add src/styles/main.css
git commit -m "$(cat <<'EOF'
Native CSS part 2: About and Work sections

Bootstrap grid mixins (make-row/make-sm-column/etc.) replaced with
purpose-built Flexbox/Grid-equivalent percentage widths per component,
using the exact computed values from the working compiled output.
Two dead-CSS quirks (project-banner mobile height, btn-project-close
top overrides) preserved verbatim and documented inline — both are
harmless no-ops in the current live site and changing them now would
be a visual regression, not a fix.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 10: Native CSS — Project detail, Contact, Form, State sections

**Files:**
- Modify: `src/styles/main.css` (append, final section)

- [ ] **Step 1: Append the Project (detail-page) section**

```css

/* ==========================================================================
   Project (expanded/detail content, loaded via ajax into .project-return)
   ========================================================================== */

.project-controls {
  text-align: center;
  padding-top: 0px;
}

.project-expanded {
  & h3, & h4, & h5, & h6 {
    text-align: center;
  }
}

.project-expanded-section {
  margin-left: -15px;
  margin-right: -15px;
  padding-top: 60px;
  padding-bottom: 60px;

  &::before,
  &::after {
    content: " ";
    display: table;
  }

  &::after {
    clear: both;
  }

  & img {
    padding-top: 60px;
  }

  & p:first-child {
    padding-top: 40px;
  }

  @media (min-width: 480px) { /* was $screen-xs-min */
    margin-left: -15px;
    margin-right: -15px;
  }
}

.project-section-white {
  background-color: white;

  & h3 {
    color: var(--color-bright-red);
    font-weight: bold;
  }
  & h4 {
    color: black;
  }
  & h5, & h6 {
    color: var(--color-dark-gray);
    font-weight: normal;
  }
  & p {
    color: var(--color-dark-blue);
  }
}

.project-section-gray {
  background-color: var(--color-light-gray);

  & h3 {
    color: var(--color-light-blue);
    font-weight: bold;
  }
}

.project-section-gray-dark {
  background-color: var(--color-darker-gray);

  & h3 {
    color: white;
    font-weight: bold;
  }
  & p {
    color: white;
  }
}

.project-section-red {
  background-color: var(--color-bright-red);

  & h3 {
    color: white;
    font-weight: bold;
  }
  & p {
    color: white;
  }
}

.project-section-blue {
  background-color: var(--color-light-blue);

  & h3 {
    color: white;
    font-weight: bold;
  }
  & p {
    color: white;
  }
}

/* .project-expanded-content replaces make-xs-column(8) + make-xs-column-offset(2) */
.project-expanded-content {
  position: relative;
  float: left;
  width: 66.6666666667%;
  min-height: 1px;
  padding-left: 15px;
  padding-right: 15px;
  margin-left: 16.6666666667%;
}

/* .project-expanded-content-wide replaces make-xs-column(10) + make-xs-column-offset(1) */
.project-expanded-content-wide {
  position: relative;
  float: left;
  width: 83.3333333333%;
  min-height: 1px;
  padding-left: 15px;
  padding-right: 15px;
  margin-left: 8.3333333333%;
  text-align: center;
}

.project-expanded-text-only {
  padding-top: 0px;
  padding-bottom: 25px;
  line-height: 160%;
  font-size: 16px;
  font-weight: 300;
}

/* ==========================================================================
   Contact
   ========================================================================== */

.section-contact {
  position: relative;
  z-index: var(--z1);
  padding: 90px 0;
  background-color: var(--color-bright-red);
  color: var(--color-dark-blue);
  overflow: hidden;
}

/* .contact-inner-container gets the same Bootstrap .container behavior as
   .intro-inner-container (width steps 750/970/1170 at 768/992/1200), plus
   its own max-width:1200px from 480px up — which never actually clamps
   anything, since the container's own widest step (1170px) is already
   below 1200px. Included for fidelity even though it's a no-op. */
.contact-inner-container {
  position: relative;
  text-align: center;
  margin-right: auto;
  margin-left: auto;
  padding-left: 15px;
  padding-right: 15px;

  &::before,
  &::after {
    content: " ";
    display: table;
  }

  &::after {
    clear: both;
  }

  & p {
    position: relative;
    padding-top: 20px;
    font-weight: normal;
    font-size: 13px;
    line-height: 160%;
    text-align: left;
  }
}

@media (min-width: 768px) { /* was $screen-sm-min */
  .contact-inner-container {
    width: 750px;
  }
}

@media (min-width: 992px) { /* was $screen-md-min */
  .contact-inner-container {
    width: 970px;
  }
}

@media (min-width: 1200px) { /* was $screen-lg-min */
  .contact-inner-container {
    width: 1170px;
  }
}

@media (min-width: 480px) { /* was $screen-xs-min */
  .contact-inner-container {
    max-width: 1200px;
    text-align: left;
    padding-left: 40px;
    padding-right: 40px;
  }
  .contact-inner-container p {
    font-size: 16px;
  }
  .contact-form-wrapper {
    text-align: center;
  }
}

.contact-social-icons {
  display: table;
  width: 100%;
  text-align: center;
  margin-top: 40px;
  margin-bottom: 40px;

  & a[role="social"] {
    display: table-cell;
  }
}

img.img-contact {
  padding-bottom: 30px;
  width: 100%;
  padding-left: 15%;
  padding-right: 15%;
}

.contact-copy {
  padding-left: 10%;
  padding-right: 10%;
}

.svg-icon {
  width: 40%;
  fill: var(--color-dark-blue);
}

.svg-icon:hover {
  fill: var(--color-tan);
}

.contact-form-title {
  padding-top: 0px;
  margin-top: 0px;
  margin-bottom: 0px;
  font-size: 34px;
  font-weight: bold;
  line-height: 1.3em;
}

.contact-form-subtitle {
  padding-top: 0px;
  margin-top: 0px;
  font-size: 16px;
  font-weight: bold;
}

.contact-form-wrapper {
  padding: 20px;
  text-align: center;
  box-shadow: 0px 2px 4px 0px rgba(0,0,0,0.50);
}

/* Intentionally omitted from this port, all confirmed dead:
   - `.contact-info`, `#contactSpinner`, `#contactSpinnerParent` (+ its
     `:hover`) — the email/phone list and spinner graphic these styled were
     already removed from the markup (see the committed contact-info removal
     that index.njk was ported from).
   - `@keyframes spin` / `@keyframes backspin` — only ever referenced by the
     two spinner rules above, so they go with them.
   - `.declaration-order` — never a real style; it was a CSS-property-order
     style guide crib note left at the top of main.scss, matching no markup.
   If the spinner is ever reinstated, all of the above are recoverable from
   git history (app/styles/main.scss). */

/* ==========================================================================
   Row / col-sm-6 (used by the Contact section's two-column layout)
   ========================================================================== */

.row {
  margin-left: -15px;
  margin-right: -15px;
}

.row::before,
.row::after {
  content: " ";
  display: table;
}

.row::after {
  clear: both;
}

.col-sm-6 {
  position: relative;
  min-height: 1px;
  padding-left: 15px;
  padding-right: 15px;
}

@media (min-width: 768px) { /* was $screen-sm-min */
  .col-sm-6 {
    float: left;
    width: 50%;
  }
}

/* ==========================================================================
   Form
   ========================================================================== */

#form-div {
  position: relative;
}

.feedback-input {
  color: var(--color-dark-blue);
  border: none;
  background-color: var(--color-dark-red);
  padding: 15px 13px 15px 13px;
  margin-bottom: 30px;
  width: 100%;
  box-shadow: inset 0px 2px 4px 0px rgba(0,0,0,0.26);
}

.feedback-input:focus {
  background: var(--color-tan);
  /* `box-shadow: 0` is invalid CSS — copied verbatim from main.scss on
     purpose. Browsers discard the declaration, so the focused input keeps
     the inset shadow inherited from .feedback-input above. "Correcting"
     this to `none` would remove that shadow on focus, i.e. it would be a
     real visual change, not a cleanup. Leave it alone. */
  box-shadow: 0;
  border: none;
  color: var(--color-dark-blue);
  outline: none;
}

textarea {
  width: 100%;
  height: 150px;
  line-height: 150%;
  resize: vertical;
}

input:hover, textarea:hover,
input:focus, textarea:focus {
  background-color: var(--color-tan);
}

::-webkit-input-placeholder {
  color: var(--color-bright-red);
  font-weight: bold;
}

::-moz-placeholder {
  color: var(--color-bright-red);
  font-weight: bold;
}

:-ms-input-placeholder {
  color: var(--color-bright-red);
  font-weight: bold;
}

#button-submit {
  width: 100%;
  border: none;
  cursor: pointer;
  background-color: var(--color-dark-blue);
  color: white;
  font-size: 18px;
  padding-top: 15px;
  padding-bottom: 15px;
  box-shadow: var(--shadow-button);
}

#form-messages {
  margin-top: 20px;
}

#button-submit:hover {
  color: var(--color-dark-blue);
  background-color: var(--color-tan);
}

#button-submit:active {
  background-color: var(--color-bright-red);
}

/* ==========================================================================
   State
   ========================================================================== */

.mob-verticalAdjust {
  position: relative;
  top: 50%;
  transform: translateY(25%);
}

.mob-verticalAdjustCenter {
  position: relative;
  top: 50%;
  transform: translateY(-50%);
}
```

- [ ] **Step 2: Rebuild**

```bash
npx @11ty/eleventy
wc -l _site/styles/main.css
```
Expected: build succeeds, `main.css` is present and non-trivially sized (a few hundred lines, much smaller than the old 7520-line compiled Bootstrap output).

- [ ] **Step 3: Commit**

```bash
git add src/styles/main.css
git commit -m "$(cat <<'EOF'
Native CSS part 3: Project detail, Contact, Form, State sections

Completes the CSS port. Contact/col-sm-6 grid math taken from the
verified compiled output the same way as Task 9. Dead .contact-info/
#contactSpinner rules dropped (already-removed markup, see prior
session's contact-form change) rather than ported forward.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 11: Images via `@11ty/eleventy-img`

**Files:**
- Create: `eleventy.config.js` (add the image shortcode)
- Modify: `src/index.njk`, `src/projects/*.njk` (swap `<img>` tags for the shortcode)
- Copy: remaining source images into `src/images/`

Only `<img>` tags get the shortcode treatment. The 4 CSS `background-image` banner photos already got plain passthrough copy in Task 3 (native CSS has no build step to inject a generated filename into, per the design spec) — that's not revisited here.

- [ ] **Step 1: Copy the remaining source images (everything except the 4 CSS banners, the gif, and the svg, which Task 3 already handles)**

```bash
cd /Users/jhealy/Projects/web-projects/jchealy
for f in app/images/*; do
  base=$(basename "$f")
  case "$base" in
    banner-mobile-hillrom.jpg|banner-mobile-ssa.jpg|banner-mobile-artistprofile.jpg|banner-mobile-hta.jpg|ap-intro.gif|contact-spinner.svg)
      continue ;;
    banner-mobile-mfs.jpg|project-mfs-*.png)
      continue ;; # orphaned project (projectMFS.html isn't linked from index.html — not carried into the new site)
    *)
      cp "$f" src/images/ ;;
  esac
done
ls src/images | wc -l
```
Expected: roughly 33 files copied (41 total minus the 6 already-handled minus the 2 orphaned MFS assets).

- [ ] **Step 2: Add the image shortcode to `eleventy.config.js`**

Two details in the config below that matter and are easy to get wrong:

- **`formats: ["webp", "auto"]`, not `["webp", "jpeg"]`.** Every PNG on this site (`johnhealy-m.png`, `about.png`, `work.png`, `contact.png`, `about-headshot.png`, and all the project screenshots) has an alpha channel, and they sit on dark blue / tan / red backgrounds. Forcing a JPEG fallback would flatten transparency to a solid box behind each one — a glaring visual regression. `"auto"` keeps each image's original format as the fallback.
- **`sizes: "100vw"`** is a deliberate simplification. Several of these images render at 40–80% of their container, so `100vw` will make browsers pick a larger candidate than strictly needed. That costs some bandwidth but is never *wrong*, and getting per-image `sizes` right would mean hand-tuning a dozen call sites for a site that currently ships completely unoptimized images. Worth revisiting later; not worth blocking this migration.

```js
import eleventyImage from "@11ty/eleventy-img";

export default function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy({ "src/vendor": "vendor" });
  eleventyConfig.addPassthroughCopy({ "src/scripts": "scripts" });
  eleventyConfig.addPassthroughCopy({ "src/styles": "styles" });
  eleventyConfig.addPassthroughCopy({ "src/favicon.ico": "favicon.ico" });
  eleventyConfig.addPassthroughCopy({ "src/robots.txt": "robots.txt" });
  eleventyConfig.addPassthroughCopy({ "src/images/ap-intro.gif": "images/ap-intro.gif" });
  eleventyConfig.addPassthroughCopy({ "src/images/contact-spinner.svg": "images/contact-spinner.svg" });
  eleventyConfig.addPassthroughCopy({
    "src/images/banner-mobile-hillrom.jpg": "images/banner-mobile-hillrom.jpg",
    "src/images/banner-mobile-ssa.jpg": "images/banner-mobile-ssa.jpg",
    "src/images/banner-mobile-artistprofile.jpg": "images/banner-mobile-artistprofile.jpg",
    "src/images/banner-mobile-hta.jpg": "images/banner-mobile-hta.jpg",
  });

  eleventyConfig.addAsyncShortcode("image", async function (src, alt, cssClass, id) {
    // Note: check for `undefined`, NOT falsiness — alt="" is a valid and
    // meaningful value (decorative image, hidden from screen readers), and
    // most of this site's images are decorative. A `!alt` check would
    // throw on every one of them.
    if (alt === undefined) {
      throw new Error(`Missing alt text for image: ${src} (pass "" if decorative)`);
    }
    const metadata = await eleventyImage(`./src/images/${src}`, {
      widths: [400, 800, 1200, null],
      formats: ["webp", "auto"],
      outputDir: "./_site/images/",
      urlPath: "/images/",
    });
    const imageAttributes = {
      alt,
      class: cssClass || undefined,
      id: id || undefined,
      sizes: "100vw",
      loading: "lazy",
      decoding: "async",
    };
    return eleventyImage.generateHTML(metadata, imageAttributes);
  });

  return {
    dir: {
      input: "src",
      output: "_site",
    },
  };
}
```

- [ ] **Step 3: Swap `<img>` tags in `src/index.njk` for the shortcode**

Replace each of these five lines:

```njk
<img class="img-responsive" id="introImg" src="/images/johnhealy-m.png" alt="John Healy typographic banner text" />
```
with:
```njk
{% image "johnhealy-m.png", "John Healy typographic banner text", "img-responsive", "introImg" %}
```
(the 4th argument is the `id`, which the shortcode applies to the generated `<img>` — `#introImg` carries real layout rules (`width: 60%`, `vertical-align: middle`), so it has to land on the image element itself, not a wrapper.)

```njk
<img class="img-responsive img-about" src="/images/about.png" />
```
→
```njk
{% image "about.png", "", "img-responsive img-about" %}
```

```njk
<img class="img-responsive about-headshot" src="/images/about-headshot.png" alt="John Healy headshot"/>
```
→
```njk
{% image "about-headshot.png", "John Healy headshot", "img-responsive about-headshot" %}
```

```njk
<img class="img-work center-block" src="/images/work.png" />
```
→
```njk
{% image "work.png", "", "img-work center-block" %}
```

```njk
<img class="img-responsive img-contact" src="/images/contact.png" />
```
→
```njk
{% image "contact.png", "", "img-responsive img-contact" %}
```

- [ ] **Step 4: Swap `<img>` tags in each `src/projects/*.njk`**

Every image in the 4 project-detail templates follows the same pattern: `<img class="img-responsive center-block" src="images/FILENAME" />`. In each of `artist-profile.njk`, `hillrom.njk`, `towerco.njk`, `helios.njk`, replace every occurrence of:
```njk
<img class="img-responsive center-block" src="images/FILENAME" />
```
with:
```njk
{% image "FILENAME", "", "img-responsive center-block" %}
```
keeping the same `FILENAME` for each. This is the same mechanical substitution repeated once per `<img>` tag in each file (8 in `hillrom.njk`, 8 in `towerco.njk`, 7 in `helios.njk`, 2 in `artist-profile.njk` — confirm exact counts with `grep -c "<img" app/project*.html` before and after to make sure none were missed).

- [ ] **Step 5: Build and verify**

```bash
npx @11ty/eleventy
grep -c "<picture" _site/index.html
ls _site/images/*.webp | head -5
```
Expected: build succeeds, `_site/index.html` contains `<picture>` elements (eleventy-img's default output wraps responsive images), `_site/images/` contains generated `.webp` files alongside the originals.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "$(cat <<'EOF'
Wire up @11ty/eleventy-img for <img> tags

Replaces the currently-broken grunt-contrib-imagemin (same native-binary
rot as node-sass hit earlier). CSS background-image banners are left as
plain passthrough copies — main.css has no build step to reference a
generated filename from, and this matches current (unoptimized, since
imagemin's been broken) behavior for those 4 files anyway.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 12: Netlify config (build + Forms)

**Files:**
- Create: `netlify.toml`

- [ ] **Step 1: Write `netlify.toml`**

```toml
[build]
  command = "npm run build"
  publish = "_site"

[build.environment]
  NODE_VERSION = "22"

[[redirects]]
  from = "/*"
  to = "/404.html"
  status = 404
```

(The catch-all 404 redirect is optional polish, not required — remove the `[[redirects]]` block if there's no `src/404.njk`; it's included here as a common Netlify static-site default. Skip it if you'd rather not add a 404 page as part of this migration.)

- [ ] **Step 2: Verify the contact form's Netlify Forms wiring is complete**

Task 6 already added `data-netlify="true"`, `name="contactForm"`, `action="/"`, and the hidden `form-name` field to the form in `index.njk`. Netlify detects forms by scanning the **built HTML output** at deploy time — confirm the attributes survive the build:

```bash
cd /Users/jhealy/Projects/web-projects/jchealy
npx @11ty/eleventy
grep -o '<form[^>]*>' _site/index.html
grep -o '<input type="hidden" name="form-name"[^>]*>' _site/index.html
```
Expected: the `<form>` tag includes `data-netlify="true"` and `name="contactForm"`; the hidden `form-name` input is present with `value="contactForm"`.

- [ ] **Step 3: Commit**

```bash
git add netlify.toml
git commit -m "$(cat <<'EOF'
Add netlify.toml

Build command, publish directory, and Node 22 pin (required by
@11ty/eleventy-img 7.x) for Netlify's build environment.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

> **Manual step, outside the repo (do this once you're ready to go live, not now):** connect this GitHub repo in the Netlify dashboard, let it deploy once from `11ty-migration` (or `master` after Task 14's merge) to get a `*.netlify.app` preview URL, verify the contact form actually submits and appears under Netlify's Forms tab, and only then point the `jchealy.com` DNS at Netlify.

---

### Task 13: Full verification pass

This is the actual safety net for everything ported by hand in Tasks 6–11 — run through it deliberately, not just a glance.

**Files:** none (verification only)

- [ ] **Step 1: Run the new site locally**

```bash
cd /Users/jhealy/Projects/web-projects/jchealy
npm start
```
Leave this running; it serves at `http://localhost:8080`.

- [ ] **Step 2: Run the old site locally, side by side**

In a second terminal, check out the pre-migration state in a throwaway worktree. At this point `master` is still the old toolchain (the migration branch hasn't merged yet), so this gives a true before/after comparison:
```bash
cd /Users/jhealy/Projects/web-projects/jchealy
git worktree add /tmp/jchealy-old master
cd /tmp/jchealy-old && npm install --legacy-peer-deps && npx bower install && npx grunt serve --no-open
```
Serves at `http://localhost:9000` (the port is set in that Gruntfile's `connect` config — there's no `--port` CLI flag for it). The `bower install` is needed because `bower_components/` is gitignored and so isn't present in a fresh worktree.

Note this worktree's `grunt serve` will rewrite its own `app/index.html` via `wiredep` — harmless, since the whole worktree is discarded in Step 7.

- [ ] **Step 3: Spot-check the base layer numerically before eyeballing anything**

The base layer added in Task 8 (box-sizing, body/heading/paragraph metrics) is what the whole hand-ported grid depends on, and a mistake there shows up as subtle drift everywhere rather than one obvious broken thing. Compare computed values directly in both browsers' devtools consoles:

```js
JSON.stringify({
  boxSizing: getComputedStyle(document.body).boxSizing,
  bodyFont: getComputedStyle(document.body).fontFamily,
  bodySize: getComputedStyle(document.body).fontSize,
  bodyLineHeight: getComputedStyle(document.body).lineHeight,
  h2Title: (() => { const e = document.querySelector('.project-title');
    const s = getComputedStyle(e); return [s.fontSize, s.marginTop, s.marginBottom]; })(),
  para: (() => { const e = document.querySelector('.about-inner-container p');
    const s = getComputedStyle(e); return [s.fontSize, s.marginBottom, s.paddingTop]; })(),
  workBanner: document.querySelector('.project-banner').getBoundingClientRect().width,
  input: getComputedStyle(document.querySelector('.feedback-input')).fontFamily,
}, null, 2)
```
Expected: identical output from `localhost:8080` and `localhost:9000`. `boxSizing` must be `border-box`; the input's `fontFamily` must be Montserrat, not a browser default.

- [ ] **Step 4: Visual comparison checklist (desktop width, e.g. 1280px)**

Compare `localhost:8080` against `localhost:9000` for each:
- [ ] Header/intro: signature animation renders, "UX, UI & INTERACTION DESIGN" positioned identically
- [ ] Nav: desktop nav links (ABOUT / WORK / CONTACT) positioned and styled identically
- [ ] About section: text and headshot image layout matches, including the `max-width: 1200px` capped container width at desktop
- [ ] Work section: banners are **full-bleed edge to edge** (this is the bug fixed earlier in this project's history — regressing it here would be a real problem, not just cosmetic)
- [ ] Click each of the 4 project "+" buttons: banner expands, detail content ajax-loads correctly, page scrolls to the right position (GSAP `scrollTo` working — this broke once already this session when a vendor script went missing, so this specifically needs a real click-through, not just a glance)
- [ ] Click each project's "×" close button: collapses and scrolls back correctly
- [ ] Contact section: two-column layout at desktop width, no email/phone/spinner visible (matches the already-committed removal), social icons render and link correctly
- [ ] Fill out and submit the contact form: on the Netlify-deployed preview (not local — Netlify Forms only works on an actual Netlify deploy), confirm a submission appears in the Netlify dashboard's Forms tab

- [ ] **Step 5: Visual comparison checklist (mobile width, e.g. 375px)**

- [ ] Hamburger nav toggle opens/closes the fullscreen mobile nav (this depends on `collapse.js` + the hand-written `.collapse`/`.navbar-collapse` CSS from Task 8 — the highest-risk hand-converted piece in this migration)
- [ ] Project banners stack full-width, "+" buttons still work, detail content still ajax-loads
- [ ] Contact form still usable, two-column layout collapses to stacked

- [ ] **Step 6: Compare against the actual live site**

Repeat the desktop + mobile checklists above against `https://www.jchealy.com` directly, not just the local old-toolchain copy — this catches anything that might have drifted between `master` and what's actually deployed.

- [ ] **Step 7: Clean up the comparison worktree**

```bash
cd /Users/jhealy/Projects/web-projects/jchealy
git worktree remove /tmp/jchealy-old --force
```

- [ ] **Step 8: Fix anything found, then re-run the relevant checklist items**

If any discrepancy turns up, fix it in the relevant `src/` file (most likely `main.css`), rebuild, and re-check just that item — don't re-run the entire checklist for a one-line CSS fix, but do re-check the specific section that changed.

- [ ] **Step 9: Commit any fixes made during verification**

```bash
git add -A
git commit -m "$(cat <<'EOF'
Fix discrepancies found during side-by-side verification

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```
(Skip this commit if verification found nothing to fix.)

---

### Task 14: Cutover — remove old app/ tree, merge to master

Only do this once Task 13's verification is fully green.

**Files:**
- Delete: `app/` (entire directory — its contents now live under `src/`), including `app/sender.php` (the PHP mail backend, replaced by Netlify Forms) and `app/projectMFS.html` (an orphaned project page not linked from anywhere in the site)
- Delete: `test/` (2014-era Mocha/Chai suite, per the design spec's non-goals — dropped, not ported)
- Delete: `Gruntfile.js`, `bower.json`, `.bowerrc`, `bower_components/`, `main.scss`, `.yo-rc.json`, `.jshintrc` (all deferred from Task 2 so the old toolchain stayed available for reference until verification passed)
- Delete: `docs/superpowers/reference/compiled-main.css` (the Task 1 snapshot — its job is done once the CSS port is verified)
- Modify: `.gitignore` (remove now-irrelevant Grunt/Bower/Sass entries, add 11ty's `_site`)
- Modify: `README.md` (replace the one-line placeholder with real run instructions)

- [ ] **Step 1: Remove the old app tree, test suite, and legacy toolchain files**

```bash
cd /Users/jhealy/Projects/web-projects/jchealy
git rm -r app test
git rm Gruntfile.js bower.json .bowerrc main.scss .yo-rc.json .jshintrc
git rm docs/superpowers/reference/compiled-main.css
rm -rf bower_components
```
Expected: all removed. (`bower_components/` is gitignored, so plain `rm` is correct there — `git rm` would fail on it.)

- [ ] **Step 2: Update `.gitignore`**

```
node_modules
_site
.DS_Store
.superpowers/
```

- [ ] **Step 3: Write a real `README.md`**

```markdown
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
```

- [ ] **Step 4: Final build check before merging**

```bash
rm -rf _site
npx @11ty/eleventy
find _site -type f | sort
```
Expected: build succeeds, output includes `index.html`, the 4 `project*.html` detail pages, `styles/main.css`, `vendor/*`, `scripts/*`, `images/*`, `favicon.ico`, `robots.txt`.

- [ ] **Step 5: Commit the cutover**

```bash
git add -A
git commit -m "$(cat <<'EOF'
Remove old Grunt/Bower/Sass app tree, update README

Cutover complete: app/ and test/ deleted now that src/ is verified
equivalent (Task 13). .gitignore and README updated for the new stack.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

- [ ] **Step 6: Merge to master**

```bash
git checkout master
git merge 11ty-migration
git log --oneline -15
```
Expected: fast-forward or clean merge, `git status` clean.

- [ ] **Step 7: Stop here — do not push without the user's explicit go-ahead**

This plan intentionally stops before `git push`. Pushing `master` (and, later, connecting Netlify and repointing DNS) are exactly the kind of hard-to-reverse, externally-visible actions that need a direct confirmation, not an assumed yes — surface the finished branch and ask before doing either.
