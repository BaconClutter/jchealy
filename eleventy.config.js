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
      widths: [400, 800, 1200, null],
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
