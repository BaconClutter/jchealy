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
      sizes: "100vw",
      loading: "lazy",
      decoding: "async",
    };
    // Note: eleventy-img's generateHTML does not strip attributes whose
    // value is JS `undefined` — it serializes them literally as e.g.
    // `id="undefined"`. So `class`/`id` must be omitted from the object
    // entirely when not supplied, not set to `undefined`.
    if (cssClass) {
      imageAttributes.class = cssClass;
    }
    if (id) {
      imageAttributes.id = id;
    }
    return eleventyImage.generateHTML(metadata, imageAttributes);
  });

  return {
    dir: {
      input: "src",
      output: "_site",
    },
  };
}
