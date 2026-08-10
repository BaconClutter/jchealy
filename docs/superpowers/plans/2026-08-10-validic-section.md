# Validic Case Study Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Validic Impact design-system case study as the first project in the Work section, and remove Helios Towers Africa entirely.

**Architecture:** The Work section is data-driven. A project is one entry in `src/_data/projects.json` (which drives the homepage banner) plus one Nunjucks template in `src/projects/` (the detail page, AJAX-loaded into the homepage). Adding or removing a project touches those two places, plus one CSS rule for the banner background and one passthrough line for the banner file. Copy and structure are fixed by the approved spec — this plan is mechanical assembly, not authoring.

**Tech Stack:** 11ty 3.x (Nunjucks templates, ESM config), `@11ty/eleventy-img` for responsive images, hand-written native CSS, `sips` for the one image format conversion.

**Spec:** `docs/superpowers/specs/2026-08-10-validic-section-design.md` — the approved copy lives there and is reproduced verbatim in Task 4 below.

---

## Before you start

**This site has no test suite.** The migration deliberately dropped the 2014-era Mocha suite and did not replace it. Verification here is: the build succeeds, assertions about the built output pass, and the rendered page is checked in a browser. Do not add a test framework — that is out of scope and would be a large unrequested change.

**The one failure mode that hides.** `src/scripts/main.js` loads a project detail page with:

```js
$('#' + clickedId + 'Return').load(clickedId + '.html #' + clickedId + 'Inner', …)
```

Both the URL and the fragment id come from the banner's DOM `id`, which comes from `projects.json`. If the `id`, the template's `permalink`, and the `id="…Inner"` inside the template ever disagree, there is **no build error and no visible symptom** until a human clicks that banner. Task 6 asserts all three agree. Do not skip it.

**Working directory for every task:** `/Users/jhealy/Projects/web-projects/jchealy`

**Branch:** create `validic-section` in Task 1 and stay on it. Do **not** `git push` at any point — pushing deploys to the live site and requires the owner's explicit go-ahead, which has not been given.

---

## File structure

| File | Responsibility | Change |
|---|---|---|
| `src/_data/projects.json` | Drives homepage banners; source of the DOM ids | Add Validic first, remove Helios |
| `src/projects/validic.njk` | The Validic detail page fragment | Create |
| `src/projects/helios.njk` | The Helios detail page fragment | Delete |
| `src/styles/main.css:953-956` | One `background-image` rule per banner | Add Validic, remove Helios |
| `eleventy.config.js:18-21` | Passthrough copy for banner JPEGs | Add Validic, remove Helios |
| `src/images/` | Project imagery | Add 9 Validic files, remove 8 Helios files |

---

### Task 1: Branch and stage the Validic images

**Files:**
- Create: `src/images/banner-mobile-validic.jpg`
- Create: `src/images/project-validic-*.png` (8 files)

- [ ] **Step 1: Create the branch**

```bash
cd /Users/jhealy/Projects/web-projects/jchealy
git checkout -b validic-section
git status --short
```
Expected: `Switched to a new branch 'validic-section'`, and a clean working tree.

- [ ] **Step 2: Copy and rename the eight screenshots**

The source filenames are descriptive of the Figma frames; the destinations follow this repo's existing `project-<slug>-<name>` convention (see `project-hillrom-sketches.png`, `project-ssa-code.png`).

```bash
SRC="/Users/jhealy/Documents/JOB-STUFF/Portfolio-raw/Validic-screens"
cp "$SRC/design-system-birds-eye.png"                              src/images/project-validic-system-overview.png
cp "$SRC/design-tokens.png"                                        src/images/project-validic-tokens.png
cp "$SRC/design-system-data-clusters.png"                          src/images/project-validic-data-clusters.png
cp "$SRC/clinician-panel-view.png"                                 src/images/project-validic-panel-view.png
cp "$SRC/clinician-view-exploded.png"                              src/images/project-validic-patient-record.png
cp "$SRC/clinician-logbook.png"                                    src/images/project-validic-logbook.png
cp "$SRC/admin-compound_events-2.png"                              src/images/project-validic-compound-events.png
cp "$SRC/admin_content_english_translation-no_sub_nav-english.png" src/images/project-validic-content-translation.png
ls -la src/images/project-validic-*.png | wc -l
```
Expected: `8`

- [ ] **Step 3: Convert the banner from PNG to JPEG**

The supplied banner is a PNG; the other four banners are JPEGs. Banners are CSS `background-image` values and never need an alpha channel, so convert for consistency and file size. `sips` is a macOS built-in — no install needed.

```bash
SRC="/Users/jhealy/Documents/JOB-STUFF/Portfolio-raw/Validic-screens"
sips -s format jpeg -s formatOptions 85 "$SRC/banner-mobile-validic.png" \
     --out src/images/banner-mobile-validic.jpg
```
Expected: sips prints the source and destination paths, no error.

- [ ] **Step 4: Verify the banner matches the others**

Every existing banner is exactly 800×406 JPEG. A mismatch here would make the Validic banner render at a different scale than the rest of the Work section.

```bash
python3 - <<'PY'
import struct, os
def jpeg_size(p):
    d = open(p,'rb').read(); i = 2
    while i < len(d):
        if d[i] == 0xFF and d[i+1] in (0xC0, 0xC1, 0xC2):
            h, w = struct.unpack('>HH', d[i+5:i+9]); return w, h
        i += 1
    return None
for f in sorted(os.listdir('src/images')):
    if f.startswith('banner-mobile-') and f.endswith('.jpg'):
        print(f"  {f:<34} {jpeg_size('src/images/'+f)}  {os.path.getsize('src/images/'+f)//1024} KB")
PY
```
Expected: five banners listed, every one reporting `(800, 406)`, including `banner-mobile-validic.jpg`.

- [ ] **Step 5: Commit**

```bash
git add src/images/banner-mobile-validic.jpg src/images/project-validic-*.png
git commit -m "$(cat <<'EOF'
Add Validic case study imagery

Eight screenshots renamed to the project-<slug>-<name> convention used
by the other case studies. The banner is converted from PNG to JPEG to
match the other four; banners are CSS background-images and never need
transparency.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: Add Validic to the project data

**Files:**
- Modify: `src/_data/projects.json`

- [ ] **Step 1: Add the Validic entry first in the array**

Order in this file is the render order on the homepage. Validic goes first because the list runs newest-to-oldest and this is 2021 work. Note there is deliberately **no** `btnIndex` field — `src/index.njk` derives SVG button indices from Nunjucks' `loop.index0`, so they renumber automatically.

Replace the entire contents of `src/_data/projects.json` with:

```json
[
  {
    "id": "projectValidic",
    "bannerClass": "project-validic",
    "title": "Validic Impact Design System",
    "subtitle": "Remote patient monitoring platform"
  },
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

Helios is still present at this stage — it is removed in Task 5, so that the addition and the removal are separately reviewable.

- [ ] **Step 2: Verify the JSON parses and the order is right**

```bash
python3 -c "
import json
p = json.load(open('src/_data/projects.json'))
print('  entries:', len(p))
for i, e in enumerate(p): print(f'    {i}  {e[\"id\"]:<22} {e[\"bannerClass\"]}')
assert p[0]['id'] == 'projectValidic', 'Validic must be first'
assert not any('btnIndex' in e for e in p), 'no entry may carry btnIndex'
print('  OK')
"
```
Expected: 5 entries, `projectValidic` at index 0, ending `OK`.

- [ ] **Step 3: Commit**

```bash
git add src/_data/projects.json
git commit -m "$(cat <<'EOF'
Add Validic to the project data, first in the list

Ordered newest-first, so the 2021 work leads the Work section.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: Wire up the Validic banner background

**Files:**
- Modify: `src/styles/main.css` (the banner rule block, currently lines 953-956)
- Modify: `eleventy.config.js` (the banner passthrough block, currently lines 18-21)

- [ ] **Step 1: Add the CSS rule**

Find this block in `src/styles/main.css`:

```css
.project-hillrom { background-image: url(/images/banner-mobile-hillrom.jpg); }
.project-ssa { background-image: url(/images/banner-mobile-ssa.jpg); }
.project-artistprofile { background-image: url(/images/banner-mobile-artistprofile.jpg); }
.project-hta { background-image: url(/images/banner-mobile-hta.jpg); }
```

Replace it with:

```css
.project-validic { background-image: url(/images/banner-mobile-validic.jpg); }
.project-hillrom { background-image: url(/images/banner-mobile-hillrom.jpg); }
.project-ssa { background-image: url(/images/banner-mobile-ssa.jpg); }
.project-artistprofile { background-image: url(/images/banner-mobile-artistprofile.jpg); }
.project-hta { background-image: url(/images/banner-mobile-hta.jpg); }
```

- [ ] **Step 2: Add the passthrough copy line**

These banners are referenced from CSS rather than through the image shortcode, so they are copied verbatim rather than processed by `eleventy-img`. Find this block in `eleventy.config.js`:

```js
    "src/images/banner-mobile-hillrom.jpg": "images/banner-mobile-hillrom.jpg",
    "src/images/banner-mobile-ssa.jpg": "images/banner-mobile-ssa.jpg",
    "src/images/banner-mobile-artistprofile.jpg": "images/banner-mobile-artistprofile.jpg",
    "src/images/banner-mobile-hta.jpg": "images/banner-mobile-hta.jpg",
```

Replace it with:

```js
    "src/images/banner-mobile-validic.jpg": "images/banner-mobile-validic.jpg",
    "src/images/banner-mobile-hillrom.jpg": "images/banner-mobile-hillrom.jpg",
    "src/images/banner-mobile-ssa.jpg": "images/banner-mobile-ssa.jpg",
    "src/images/banner-mobile-artistprofile.jpg": "images/banner-mobile-artistprofile.jpg",
    "src/images/banner-mobile-hta.jpg": "images/banner-mobile-hta.jpg",
```

- [ ] **Step 3: Build and verify the banner is served**

```bash
rm -rf _site && npx @11ty/eleventy
ls -la _site/images/banner-mobile-validic.jpg
grep -c "project-validic" _site/styles/main.css
```
Expected: the JPEG exists in `_site/images/`, and the grep returns `1`.

- [ ] **Step 4: Verify every banner class in the data has a matching CSS rule**

A `bannerClass` with no rule produces a banner with no background image — no error, just an empty coloured block.

```bash
python3 - <<'PY'
import json, re
css = open('src/styles/main.css').read()
bad = []
for e in json.load(open('src/_data/projects.json')):
    if not re.search(r'\.' + re.escape(e['bannerClass']) + r'\s*\{[^}]*background-image', css):
        bad.append(e['bannerClass'])
print('  missing background-image rules:', bad or 'none')
assert not bad
PY
```
Expected: `none`.

- [ ] **Step 5: Commit**

```bash
git add src/styles/main.css eleventy.config.js
git commit -m "$(cat <<'EOF'
Serve the Validic banner background

Adds the CSS background-image rule and the passthrough copy line. These
banners bypass eleventy-img because they are referenced from CSS, which
has no build step to rewrite a generated filename into.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 4: Create the Validic detail page

**Files:**
- Create: `src/projects/validic.njk`

- [ ] **Step 1: Create the template**

The copy below is the approved final text from the spec — do not paraphrase, reword, or "improve" it. Structure matches the other case studies: a `permalink` in front matter, **no `layout` key** (these render as bare fragments, injected into the already-styled homepage by AJAX), an outer `div.project-expanded` whose id is `{projects.json id}Inner`, then alternating colour bands.

`project-section-blue` is deliberately unused: under the current palette it resolves to `#2E2E2E`, which sits at 1.19:1 against `project-section-gray-dark`'s `#3A3A3A` — visually identical. Bands use white / gray / gray-dark / red only.

Create `src/projects/validic.njk` with exactly this content:

```njk
---
permalink: /projectValidic.html
---
	<div class="project-expanded" id="projectValidicInner">

		<div class="project-expanded-section project-section-white">
			<div class="project-expanded-content">
				<p class="project-expanded-text-only">Validic Impact is a remote patient monitoring platform built around two applications: an admin tool where healthcare organizations configure monitoring programs, and a clinician workspace for tracking enrolled patients. There was no shared design system. Patterns drifted between the two apps, and nearly every new feature meant a developer building something custom from scratch.</p>
			</div>
		</div>

		<div class="project-expanded-section project-section-gray">
			<h3>A shared visual language</h3>
			<div class="project-expanded-content">
				<p class="project-expanded-text-only">I organized the system around foundations, navigation, inputs and forms, data display, charts and feedback, with separate libraries for the admin and clinician applications. Grouping it this way gave design and development a common vocabulary — a conversation could name a component instead of describing a screenshot.</p>
			</div>
			<div class="project-expanded-content-wide">
				{% image "project-validic-system-overview.png", "", "img-responsive center-block" %}
			</div>
		</div>

		<div class="project-expanded-section project-section-white">
			<h3>Tokens as the foundation</h3>
			<div class="project-expanded-content">
				<p class="project-expanded-text-only">Underneath the components sit design tokens: full grayscale and primary ramps, semantic colors for warning, success and error states, and a type scale built on a 1.414 augmented fourth in Poppins. A value gets defined once and referenced everywhere, so a change propagates instead of being hunted down screen by screen.</p>
			</div>
			<div class="project-expanded-content-wide">
				{% image "project-validic-tokens.png", "", "img-responsive center-block" %}
			</div>
		</div>

		<div class="project-expanded-section project-section-gray-dark">
			<h3>One component, every reading</h3>
			<div class="project-expanded-content">
				<p class="project-expanded-text-only">The data cluster is the clearest example of the approach. One component handles weight, blood pressure, glucose and heart rate — in or out of range, trending up or down, annotated or plain, alone or paired with a second measurement. Rather than drawing each combination separately, I defined the variables once and let the component absorb them.</p>
			</div>
			<div class="project-expanded-content-wide">
				{% image "project-validic-data-clusters.png", "", "img-responsive center-block" %}
			</div>
		</div>

		<div class="project-expanded-section project-section-white">
			<h3>Monitoring at a glance</h3>
			<div class="project-expanded-content">
				<p class="project-expanded-text-only">Clinicians start with a roster of everyone enrolled in a program. Two-week sparkline trends sit beside the latest reading, so the whole panel can be scanned for movement before opening a single record.</p>
			</div>
			<div class="project-expanded-content-wide">
				{% image "project-validic-panel-view.png", "", "img-responsive center-block" %}
			</div>
		</div>

		<div class="project-expanded-section project-section-gray">
			<h3>The patient record</h3>
			<div class="project-expanded-content">
				<p class="project-expanded-text-only">Opening a participant reveals the full record: alerts, notes, goals, automated events, and a logbook of every reading. It's assembled almost entirely from system components — and this density is exactly what made a system necessary.</p>
			</div>
			<div class="project-expanded-content-wide">
				{% image "project-validic-patient-record.png", "", "img-responsive center-block" %}
			</div>
			<div class="project-expanded-content-wide">
				{% image "project-validic-logbook.png", "", "img-responsive center-block" %}
			</div>
		</div>

		<div class="project-expanded-section project-section-red">
			<h3>Configuring programs</h3>
			<div class="project-expanded-content">
				<p class="project-expanded-text-only">On the admin side, organizations configure their own programs: the conditions that trigger an alert, the actions that follow, and the content participants receive at each step of enrollment — in multiple languages. Localization was a system concern rather than an afterthought, since components had to hold text of unpredictable length.</p>
			</div>
			<div class="project-expanded-content-wide">
				{% image "project-validic-compound-events.png", "", "img-responsive center-block" %}
			</div>
			<div class="project-expanded-content-wide">
				{% image "project-validic-content-translation.png", "", "img-responsive center-block" %}
			</div>
		</div>

		<div class="project-expanded-section project-section-white">
			<h3>Handing the system to engineering</h3>
			<div class="project-expanded-content">
				<p class="project-expanded-text-only">I helped introduce Storybook so the system lived in code as well as in design files. For me and the front-end developers it became the place to cycle through the many interaction states this application demands — every range, alert and status, side by side and inspectable. Developers gained the autonomy to assemble screens from components already agreed on, instead of waiting on a custom build.</p>
			</div>
		</div>

		<div class="project-expanded-section project-section-white">
			<h5>Client: Validic</h5>
			<h6>2021</h6>
		</div>

	</div> <!-- /project-expanded -->
```

- [ ] **Step 2: Build**

```bash
npx @11ty/eleventy
ls -la _site/projectValidic.html
```
Expected: the file exists.

- [ ] **Step 3: Verify structure and that no layout leaked in**

These pages must render as bare fragments. If a layout were applied, jQuery's `.load()` would still extract the fragment, but the page would carry a duplicate copy of every vendor script.

```bash
python3 - <<'PY'
h = open('_site/projectValidic.html').read()
checks = {
  'has the Inner fragment id':      'id="projectValidicInner"' in h,
  'no layout leaked (no <html>)':   '<html' not in h.lower(),
  'no vendor scripts':              'vendor/jquery.js' not in h,
  '8 content bands':                h.count('project-expanded-section') == 9,   # 8 + closing
  'client line present':            'Client: Validic' in h,
  'no project-section-blue used':   'project-section-blue' not in h,
  'all 8 images rendered':          h.count('<picture') == 8,
}
for k, v in checks.items(): print(f"  {'ok ' if v else 'FAIL'} {k}")
assert all(checks.values())
PY
```
Expected: every line `ok`.

- [ ] **Step 4: Verify every referenced image actually resolves**

A typo in an image filename throws at build time with `eleventy-img`, so a successful build already proves the sources exist — this confirms the generated variants are reachable.

```bash
python3 - <<'PY'
import re, os
h = open('_site/projectValidic.html').read()
srcs = set(re.findall(r'src="(/images/[^"]+)"', h))
missing = [s for s in srcs if not os.path.exists('_site' + s)]
print(f"  image srcs: {len(srcs)}   missing: {missing or 'none'}")
assert not missing
PY
```
Expected: `missing: none`.

- [ ] **Step 5: Commit**

```bash
git add src/projects/validic.njk
git commit -m "$(cat <<'EOF'
Add the Validic case study detail page

Eight bands following the problem/system/outcome arc from the spec:
the inconsistency that prompted the work, the system's shape, tokens,
the data-cluster component as the exemplar, the clinician and admin
applications, and Storybook as the handoff to engineering.

Uses white/gray/gray-dark/red only. project-section-blue is unusable
under the current palette — it resolves to #2E2E2E, 1.19:1 against
gray-dark's #3A3A3A, so the two are indistinguishable.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 5: Remove Helios Towers Africa

**Files:**
- Modify: `src/_data/projects.json`
- Delete: `src/projects/helios.njk`
- Delete: `src/images/banner-mobile-hta.jpg`, `src/images/project-hta-*.png` (7 files)
- Modify: `src/styles/main.css` (remove the `.project-hta` rule)
- Modify: `eleventy.config.js` (remove the `banner-mobile-hta.jpg` passthrough line)

- [ ] **Step 1: Remove the data entry**

Delete this object from `src/_data/projects.json`, including the comma that precedes it:

```json
  ,{
    "id": "projectHTA",
    "bannerClass": "project-hta",
    "title": "Helios Towers Africa",
    "subtitle": "Responsive Web Application"
  }
```

The file must end up with exactly four entries: `projectValidic`, `projectArtistProfile`, `projectHillRom`, `projectSSA`.

- [ ] **Step 2: Delete the template and images**

```bash
git rm src/projects/helios.njk
git rm src/images/banner-mobile-hta.jpg
git rm src/images/project-hta-*.png
```
Expected: 9 files removed (1 template, 1 banner, 7 images).

- [ ] **Step 3: Remove the CSS rule and the passthrough line**

In `src/styles/main.css`, delete this line:

```css
.project-hta { background-image: url(/images/banner-mobile-hta.jpg); }
```

In `eleventy.config.js`, delete this line:

```js
    "src/images/banner-mobile-hta.jpg": "images/banner-mobile-hta.jpg",
```

- [ ] **Step 4: Verify nothing references Helios anywhere**

Match the actual reference forms rather than the bare string `hta` — `src/vendor/jquery.js` contains the word "hashtable", which a loose case-insensitive `hta` search hits and which is not a Helios reference. `src/vendor/` is third-party code and is never touched by this work.

```bash
grep -rnE "project-hta|banner-mobile-hta|projectHTA|helios" \
  src/ eleventy.config.js \
  --include="*.njk" --include="*.json" --include="*.css" --include="*.js" \
  -i --exclude-dir=vendor
```
Expected: **no output.** Any hit is a dangling reference that must be removed.

- [ ] **Step 5: Rebuild and confirm the removal is complete**

```bash
rm -rf _site && npx @11ty/eleventy
ls _site/project*.html
grep -ril "helios" _site/ || echo "  no Helios references in build output"
```
Expected: exactly four detail pages — `projectValidic.html`, `projectArtistProfile.html`, `projectHillRom.html`, `projectSSA.html`. No `projectHTA.html`. No Helios references.

- [ ] **Step 6: Verify the SVG button indices renumbered correctly**

This is the reason `projects.json` carries no `btnIndex` field. `src/scripts/button-svg.js` builds its arrays with `.each(function(index) { Snap('#btnExplode' + index) … })`, so the suffixes must be contiguous `0..n-1` in DOM order. Removing a project from the middle of the list must not leave a gap.

```bash
python3 - <<'PY'
import re
h = open('_site/index.html').read()
for prefix in ['btnExplodeContainer', 'btnExplode', 'btnCloseContainer', 'btnClose']:
    found = sorted(int(m) for m in re.findall(r'id="' + prefix + r'(\d+)"', h))
    ok = found == list(range(len(found)))
    print(f"  {'ok ' if ok else 'FAIL'} {prefix:<22} {found}")
    assert ok, f'{prefix} indices are not contiguous'
print('  all button indices contiguous 0..3')
PY
```
Expected: each prefix reports `[0, 1, 2, 3]`.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "$(cat <<'EOF'
Remove the Helios Towers Africa case study

Removes the data entry, template, banner, seven images, the CSS
background rule and the passthrough line — verified by grep that no
reference remains in src/, the config, or the build output.

SVG button indices renumber automatically because index.njk derives them
from loop.index0 rather than a stored field; asserted contiguous after
the removal.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 6: Assert the id contract, then verify in a browser

**Files:** none (verification only)

- [ ] **Step 1: Assert every project id resolves to a page and a fragment**

This is the failure mode described at the top of this plan: a mismatch between `projects.json`'s `id`, the template's `permalink`, and the `id="…Inner"` inside it produces no build error and no symptom until a banner is clicked.

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

- [ ] **Step 2: Start the dev server**

```bash
npx @11ty/eleventy --serve --port=8080
```
Leave it running. It serves at `http://localhost:8080`.

- [ ] **Step 3: Check the homepage**

In a browser at `http://localhost:8080`:
- Four project banners, Validic **first**
- The Validic banner shows its background photograph, not an empty coloured block
- Title reads *Validic Impact Design System*, subtitle *Remote patient monitoring platform*
- No Helios banner anywhere
- Browser console shows **no errors**

- [ ] **Step 4: Exercise the Validic project interaction**

This is what the id contract in Step 1 protects, verified by hand:
- Click the Validic banner's **+** button. The banner expands and the detail content loads.
- All eight images appear; none are broken.
- The bands alternate white / gray / white / dark / white / gray / red / white as intended, and the two dark-ish bands are not adjacent.
- Scroll through: the red *Configuring programs* band has white text that is legible against the accent background.
- Click the **×** to close. The other banners return.
- Console still shows no errors.

- [ ] **Step 5: Check the other three projects still work**

Removing a project renumbered every button index, so confirm the others were not broken by it. Open and close **each** of ReverbNation, Hill-Rom and TowerCo. Each should load its own content — a renumbering bug typically shows as a banner loading the *wrong* project's content.

- [ ] **Step 6: Check mobile width**

At a 375px viewport:
- Banners stack and are readable
- The Validic detail content is legible; the very wide screenshots (the system overview is 5176px at source) scale down within their container rather than overflowing horizontally
- The page does not scroll sideways

- [ ] **Step 7: Stop the dev server**

Press Ctrl-C in the terminal running it, then confirm nothing is left listening:

```bash
lsof -ti :8080 || echo "  port 8080 free"
```

- [ ] **Step 8: Commit any fixes**

Only if Steps 3-6 turned up something to fix:

```bash
git add -A
git commit -m "$(cat <<'EOF'
Fix issues found during Validic section verification

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 7: Merge to master

**Files:** none

- [ ] **Step 1: Confirm the branch is clean and complete**

```bash
git status --short
git log --oneline master..validic-section
```
Expected: clean tree; five or six commits listed (Tasks 1-5, plus a fixes commit if Task 6 produced one).

- [ ] **Step 2: Merge**

```bash
git checkout master
git merge validic-section
git log --oneline -3
```
Expected: a fast-forward merge; `git status` clean.

- [ ] **Step 3: Final build from scratch on master**

```bash
rm -rf _site && npx @11ty/eleventy
find _site -maxdepth 1 -name "project*.html" | sort
```
Expected: exactly the four detail pages, Helios absent.

- [ ] **Step 4: Stop — do not push**

**Do not run `git push`.** Pushing deploys to the live site via Netlify. That requires the owner's explicit go-ahead, which this plan does not carry. Report that the work is merged locally and awaiting their decision to deploy.

---

## Notes for whoever executes this

**Do not reword the copy.** It was drafted, reviewed and approved with the site owner. Fixing a perceived typo in their case-study prose is not your call.

**Do not add `btnIndex` to `projects.json`.** It looks like it belongs there. It does not — indices come from `loop.index0` precisely so add/remove operations renumber automatically. Adding it would reintroduce a bug that was deliberately designed out.

**Do not use `project-section-blue`.** It resolves to `#2E2E2E` under the current palette, effectively identical to `project-section-gray-dark`.

**If the build fails on an image**, `eleventy-img` throws on a missing source. Check the filename against the mapping table in Task 1 Step 2 — the source names and destination names deliberately differ.
