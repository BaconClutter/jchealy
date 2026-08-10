# Add the Validic case study, remove Helios Towers Africa

## Context

The Work section currently holds four projects: ReverbNation Artist Profile, Hill-Rom, TowerCo, and Helios Towers Africa. The newest of them is from 2015. This adds a 2021 case study about the design system built for the Validic Impact platform, and removes Helios.

This is the first content change since the site moved to 11ty. The migration deliberately restructured the Work section to be data-driven for exactly this: adding or removing a project should be a `projects.json` edit plus one template file, not HTML surgery across several places.

## Goals

- Add a Validic case study as the **first** project in the Work section.
- Remove Helios Towers Africa entirely — entry, template, banner, images, CSS rule, passthrough config.
- Match the existing case-study structure and voice exactly. This is new content in an established pattern, not a redesign.

## The story

The arc is **problem → system → outcome**, chosen over a pure craft showcase because it reads as solving an organizational problem rather than drawing components.

- **Problem** — no consistency across two applications, and nearly every new feature required a developer to custom-build it.
- **System** — tokens and modular components, organized into named libraries, giving design and development a shared vocabulary.
- **Outcome** — Storybook put the system in code, letting front-end developers cycle through the app's many interaction states and assemble screens autonomously.

`data_cluster` gets its own band. Its variant matrix is the most persuasive artifact available: a reader can *see* combinatorics being handled, which a birds-eye screenshot cannot show.

## Section structure

Eight content bands plus the closing client/date block, matching Hill-Rom and TowerCo in weight. Copy below is approved final text.

| # | Band class | Heading | Images |
|---|---|---|---|
| 1 | `project-section-white` | *(none — intro paragraph)* | — |
| 2 | `project-section-gray` | A shared visual language | `project-validic-system-overview.png` |
| 3 | `project-section-white` | Tokens as the foundation | `project-validic-tokens.png` |
| 4 | `project-section-gray-dark` | One component, every reading | `project-validic-data-clusters.png` |
| 5 | `project-section-white` | Monitoring at a glance | `project-validic-panel-view.png` |
| 6 | `project-section-gray` | The patient record | `project-validic-patient-record.png`, `project-validic-logbook.png` |
| 7 | `project-section-red` | Configuring programs | `project-validic-compound-events.png`, `project-validic-content-translation.png` |
| 8 | `project-section-white` | Handing the system to engineering | — |
| — | `project-section-white` | `h5` Client: Validic / `h6` 2021 | — |

### Band colours

`project-section-blue` is **not used**. Under the current palette it resolves to `--color-accent-cool` (`#2E2E2E`), which sits at 1.19:1 against `project-section-gray-dark` (`#3A3A3A`) — visually identical. Using both in one page would read as a mistake. Bands draw from white / gray / gray-dark / red only.

This is a pre-existing consequence of adopting the quiet palette, not something this change introduces. Worth addressing separately: `--color-accent-cool` has only two uses site-wide and may deserve a distinct value.

### Copy

**Band 1 — intro, no heading**

> Validic Impact is a remote patient monitoring platform built around two applications: an admin tool where healthcare organizations configure monitoring programs, and a clinician workspace for tracking enrolled patients. There was no shared design system. Patterns drifted between the two apps, and nearly every new feature meant a developer building something custom from scratch.

**Band 2 — A shared visual language**

> I organized the system around foundations, navigation, inputs and forms, data display, charts and feedback, with separate libraries for the admin and clinician applications. Grouping it this way gave design and development a common vocabulary — a conversation could name a component instead of describing a screenshot.

**Band 3 — Tokens as the foundation**

> Underneath the components sit design tokens: full grayscale and primary ramps, semantic colors for warning, success and error states, and a type scale built on a 1.414 augmented fourth in Poppins. A value gets defined once and referenced everywhere, so a change propagates instead of being hunted down screen by screen.

**Band 4 — One component, every reading**

> The data cluster is the clearest example of the approach. One component handles weight, blood pressure, glucose and heart rate — in or out of range, trending up or down, annotated or plain, alone or paired with a second measurement. Rather than drawing each combination separately, I defined the variables once and let the component absorb them.

**Band 5 — Monitoring at a glance**

> Clinicians start with a roster of everyone enrolled in a program. Two-week sparkline trends sit beside the latest reading, so the whole panel can be scanned for movement before opening a single record.

**Band 6 — The patient record**

> Opening a participant reveals the full record: alerts, notes, goals, automated events, and a logbook of every reading. It's assembled almost entirely from system components — and this density is exactly what made a system necessary.

**Band 7 — Configuring programs**

> On the admin side, organizations configure their own programs: the conditions that trigger an alert, the actions that follow, and the content participants receive at each step of enrollment — in multiple languages. Localization was a system concern rather than an afterthought, since components had to hold text of unpredictable length.

**Band 8 — Handing the system to engineering**

> I helped introduce Storybook so the system lived in code as well as in design files. For me and the front-end developers it became the place to cycle through the many interaction states this application demands — every range, alert and status, side by side and inspectable. Developers gained the autonomy to assemble screens from components already agreed on, instead of waiting on a custom build.

## Assets

Source: `/Users/jhealy/Documents/JOB-STUFF/Portfolio-raw/Validic-screens/`

Renamed on copy into `src/images/` to follow the existing `project-<slug>-<name>` convention:

| Source | Destination |
|---|---|
| `banner-mobile-validic.png` | `banner-mobile-validic.jpg` *(converted)* |
| `design-system-birds-eye.png` | `project-validic-system-overview.png` |
| `design-tokens.png` | `project-validic-tokens.png` |
| `design-system-data-clusters.png` | `project-validic-data-clusters.png` |
| `clinician-panel-view.png` | `project-validic-panel-view.png` |
| `clinician-view-exploded.png` | `project-validic-patient-record.png` |
| `clinician-logbook.png` | `project-validic-logbook.png` |
| `admin-compound_events-2.png` | `project-validic-compound-events.png` |
| `admin_content_english_translation-no_sub_nav-english.png` | `project-validic-content-translation.png` |

### Banner format

The supplied banner is a PNG at the correct 800×406, but the other four banners are JPEGs. Banners are CSS `background-image` values and never need transparency, so it is converted to JPEG for consistency and file size. `sips` handles this; no third-party tooling required.

### Screenshot sizes

Several sources are very large (`design-system-birds-eye` is 5176×2538). They are passed through `eleventy-img` like every other project image, which generates 400/800/1200px variants plus WebP. The originals are kept as the source of truth; no manual downscaling.

## Removing Helios

Every reference, verified by grep:

- `src/_data/projects.json` — the `projectHTA` entry
- `src/projects/helios.njk` — the template
- `src/images/banner-mobile-hta.jpg` — the banner
- `src/images/project-hta-*.png` — seven images
- `src/styles/main.css:956` — `.project-hta { background-image: … }`
- `eleventy.config.js:21` — the banner passthrough line

The Work section stays at four projects.

**Button-index renumbering:** `button-svg.js` builds its SVG arrays with `.each(function(index) { Snap('#btnExplode' + index) … })`, so the numeric ID suffixes must be contiguous `0..n-1` in DOM order. `index.njk` derives them from Nunjucks' `loop.index0` rather than a stored field, precisely so add/remove operations renumber automatically. This was verified during the migration by simulating a mid-list removal. No manual index maintenance is needed, but the build-time assertion below must still pass.

## Verification

- Every `projects.json` `id` resolves to a built page containing a matching `id="…Inner"` fragment. This is the one failure mode that produces no build error and no visible symptom until a banner is clicked, since `main.js` derives both the URL and the fragment id from the DOM id at click time. The assertion script already exists in the migration plan's Task 7 and is reused verbatim.
- Five banners' worth of button IDs are contiguous `0..3` after the change.
- No dangling references to `hta` or `helios` anywhere in `src/`, `eleventy.config.js`, or the built output.
- All Validic images return 200 from the dev server; none 404.
- The new detail page renders as a bare fragment with no layout wrapper, like the other four.
- Visual check of the new section against the existing ones at desktop and mobile widths.

## Out of scope

- No change to the case-study template structure, CSS, or any shared component.
- No redesign of the other three projects.
- `--color-accent-cool` collapsing against `--color-surface-dark` is noted above but not fixed here.
