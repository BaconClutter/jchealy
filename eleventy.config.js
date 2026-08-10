import eleventyImage from "@11ty/eleventy-img";

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
    "src/images/banner-mobile-validic.jpg": "images/banner-mobile-validic.jpg",
    "src/images/banner-mobile-hillrom.jpg": "images/banner-mobile-hillrom.jpg",
    "src/images/banner-mobile-ssa.jpg": "images/banner-mobile-ssa.jpg",
    "src/images/banner-mobile-artistprofile.jpg": "images/banner-mobile-artistprofile.jpg",
  });

  eleventyConfig.addAsyncShortcode("image", async function (src, alt, cssClass, id, sizes) {
    // Note: check for `undefined`, NOT falsiness — alt="" is a valid and
    // meaningful value (decorative image, hidden from screen readers), and
    // most of this site's images are decorative. A `!alt` check would
    // throw on every one of them.
    if (alt === undefined) {
      throw new Error(`Missing alt text for image: ${src} (pass "" if decorative)`);
    }
    const metadata = await eleventyImage(`./src/images/${src}`, {
      // 2400 is the top tier, and `null` (the untouched original) is
      // deliberately NOT in this list. Several case-study screenshots are
      // 4500-5200px wide; leaving the original as a candidate meant any
      // retina laptop downloaded a ~400KB source to paint it at ~1050 CSS
      // px, because there was nothing between 1200 and 5176 to pick.
      // eleventy-img never upscales, so a source narrower than a requested
      // width is simply clamped -- smaller images are unaffected by this.
      widths: [400, 800, 1200, 2400],
      formats: ["webp", "auto"],
      outputDir: "./_site/images/",
      urlPath: "/images/",
    });
    // Build attributes conditionally. eleventy-img's generateHTML serializes
    // whatever keys are present without checking for undefined, so setting a
    // key to undefined emits the literal string `id="undefined"`.
    const imageAttributes = {
      alt,
      // `sizes` is not merely a download hint: when CSS width is `auto`, the
      // browser derives the element's layout width from it. `#introImg` is
      // exactly that case, so it passes an accurate value rather than the
      // default. Every other image on this site has its width pinned by CSS,
      // where `sizes` only affects which candidate is fetched.
      //
      // Case-study images all pass "83vw" because they sit in
      // `.project-expanded-content-wide` (83.33% of a row that is itself 30px
      // wider than the viewport, so 0.8333vw - 5px -- 83vw rounds that up by
      // a few pixels, which is the safe direction). The "100vw" default was a
      // 20% overstatement that pushed every retina request up a whole tier.
      sizes: sizes || "100vw",
      loading: "lazy",
      decoding: "async",
    };
    if (cssClass) imageAttributes.class = cssClass;
    if (id) imageAttributes.id = id;
    return eleventyImage.generateHTML(metadata, imageAttributes);
  });

  return {
    dir: {
      input: "src",
      output: "_site",
    },
  };
}
